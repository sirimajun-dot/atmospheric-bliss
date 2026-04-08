import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parser = new Parser();

// Helper for relative timestamps
const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Flatten Google GenAI / fetch-style errors for status + message sniffing. */
function geminiErrorFingerprint(e: unknown): { httpStatus?: number; rpcStatus?: string; text: string } {
  const chunks: string[] = [];
  let httpStatus: number | undefined;
  let rpcStatus: string | undefined;

  const absorbString = (s: string) => {
    chunks.push(s);
    try {
      const j = JSON.parse(s) as {
        error?: { code?: number; status?: string; message?: string };
      };
      if (j?.error?.code != null) httpStatus = j.error.code;
      if (j?.error?.status) rpcStatus = j.error.status;
      if (j?.error?.message) chunks.push(j.error.message);
    } catch {
      /* not JSON */
    }
  };

  const walk = (x: unknown, depth: number) => {
    if (x == null || depth > 6) return;
    if (typeof x === "string") {
      absorbString(x);
      return;
    }
    if (typeof x !== "object") return;
    const o = x as Record<string, unknown>;
    if (typeof o.status === "number") httpStatus = o.status;
    if (typeof o.code === "number" && httpStatus === undefined) httpStatus = o.code;
    if (typeof o.message === "string") absorbString(o.message);
    if (o.error != null) walk(o.error, depth + 1);
    if (o.details != null) walk(o.details, depth + 1);
    if (o.cause != null) walk(o.cause, depth + 1);
  };

  walk(e, 0);
  const text = chunks.join(" ");
  return { httpStatus, rpcStatus, text };
}

function isTransientGeminiError(e: unknown): boolean {
  if (typeof e === "object" && e != null) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ENOTFOUND" || code === "EAI_AGAIN") {
      return true;
    }
  }
  const { httpStatus, rpcStatus, text } = geminiErrorFingerprint(e);
  if (httpStatus === 503 || httpStatus === 429) return true;
  if (rpcStatus === "UNAVAILABLE" || rpcStatus === "RESOURCE_EXHAUSTED" || rpcStatus === "DEADLINE_EXCEEDED") {
    return true;
  }
  return /high demand|try again later|overloaded|rate limit|temporarily|unavailable|ECONNRESET|ETIMEDOUT/i.test(
    text
  );
}

function backoffMsWithJitter(attempt: number, baseMs: number, perAttemptCapMs: number): number {
  const exp = baseMs * 2 ** Math.max(0, attempt - 1);
  const capped = Math.min(perAttemptCapMs, exp);
  const jitter = 0.85 + Math.random() * 0.3;
  return Math.round(Math.min(perAttemptCapMs, capped * jitter));
}

async function withGeminiRetries<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const maxAttempts = Math.min(10, Math.max(1, Number(process.env.GEMINI_MAX_RETRIES || 5)));
  const baseMs = Math.min(60000, Math.max(400, Number(process.env.GEMINI_RETRY_BASE_MS || 2000)));
  const perAttemptCapMs = Math.min(120000, Math.max(2000, Number(process.env.GEMINI_RETRY_MAX_MS || 45000)));
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt === maxAttempts || !isTransientGeminiError(e)) throw e;
      const wait = backoffMsWithJitter(attempt, baseMs, perAttemptCapMs);
      const { httpStatus, rpcStatus } = geminiErrorFingerprint(e);
      if (attempt === 1) {
        console.warn(
          `[${label}] Gemini transient (${httpStatus ?? "?"}${rpcStatus ? ` ${rpcStatus}` : ""}) — retrying up to ${maxAttempts} attempts with backoff`
        );
      }
      await delay(wait);
    }
  }
  throw lastErr;
}

/** Normalize `generateContent` output across SDK shapes (`candidates[].parts` vs legacy `.text`). */
function geminiOutputText(result: unknown): string {
  const r = result as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    text?: string;
  };
  const parts = r.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    for (const p of parts) {
      if (typeof p?.text === "string" && p.text.length > 0) return p.text;
    }
  }
  if (typeof r.text === "string" && r.text.length > 0) return r.text;
  return "";
}

/**
 * First top-level `{ ... }` in `s`, respecting JSON double-quoted strings and `\` escapes.
 * Greedy `/\{[\s\S]*\}/` would span from the first `{` to the last `}` and break when prose after the JSON contains `}`.
 */
function extractFirstBalancedJsonObject(s: string): string | null {
  const start = s.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (inString) {
      if (c === "\\") {
        escaped = true;
        continue;
      }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

/** Strip optional markdown fences and parse the first JSON object (models sometimes add prose or fences). */
function parseGeminiJsonObject(raw: string): unknown {
  const cleaned = raw.replace(/```json\n?|```/g, "").trim();
  const jsonSlice = extractFirstBalancedJsonObject(cleaned);
  if (!jsonSlice) throw new Error("INVALID_AI_RESPONSE");
  return JSON.parse(jsonSlice);
}

// --- GLOBAL STATE ---
let globalState: any = {
  lastUpdated: new Date().toISOString(),
  report: {
    dailySummary: { th: "กำลังเชื่อมต่อแหล่งข้อมูลความมั่นคง...", en: "Connecting to secure intelligence feeds..." },
    risks: []
  },
  insights: [],
  weather: null,
  system: 'INITIALIZING',
  connectionStatus: [],
  history: {} // Ghost History Buffer: { [domainId]: { short: number[], long: number[] } }
};

/** Live weather row: Open-Meteo + air-quality API (Bangkok coords) — not a direct TMD API. */
const WEATHER_CONNECTION_SOURCE = "Open-Meteo (weather/air · Bangkok)";

// Authorized Sources for Egress Filter & AI Scanning
const AUTHORIZED_SOURCES = [
  "USGS Earthquake API", "CISA KEV (API)", "GDACS (UN/EU)", WEATHER_CONNECTION_SOURCE,
  "NASA FIRMS", "DDPM (ปภ.) / T-Alert", "NDWC (เตือนภัยพิบัติ)", "PTWC (NOAA)",
  "Copernicus C3S", "CEMS Early Warning", "NOAA Global Monitoring", "NASA GISS",
  "MITRE ATT&CK", "ThaiCERT (สพธอ.)", "NCSA (สกมช.)", "DDC (กรมควบคุมโรค)",
  "OECD AIM", "Gemini 3 Intelligence", "FRED (St. Louis Fed)", "OFR Financial Stress", "IMF GFSR + WEO"
];

const deepDiveHits = new Map<string, number[]>();
const DEEP_DIVE_MAP_PRUNE_AT = 4000;
let deepDiveRateLimitTicks = 0;

function pruneStaleDeepDiveKeys(windowMs: number) {
  const now = Date.now();
  for (const [ip, stamps] of deepDiveHits) {
    const fresh = stamps.filter((t) => now - t < windowMs);
    if (fresh.length === 0) deepDiveHits.delete(ip);
    else if (fresh.length !== stamps.length) deepDiveHits.set(ip, fresh);
  }
}

function clientIpForRateLimit(req: express.Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0]?.trim() || "unknown";
  }
  if (Array.isArray(fwd) && fwd[0]) {
    return String(fwd[0]).split(",")[0].trim() || "unknown";
  }
  return req.socket.remoteAddress || "unknown";
}

function rateLimitDeepDive(req: express.Request, res: express.Response, next: express.NextFunction) {
  const windowMs = Math.max(5_000, Math.min(600_000, Number(process.env.DEEP_DIVE_WINDOW_MS || 60_000)));
  const max = Math.max(1, Math.min(120, Number(process.env.DEEP_DIVE_MAX_PER_MINUTE || 20)));
  const tick = ++deepDiveRateLimitTicks;
  if (deepDiveHits.size > DEEP_DIVE_MAP_PRUNE_AT || tick % 200 === 0) {
    pruneStaleDeepDiveKeys(windowMs);
  }
  const ip = clientIpForRateLimit(req);
  const now = Date.now();
  let stamps = deepDiveHits.get(ip) || [];
  stamps = stamps.filter((t) => now - t < windowMs);
  if (stamps.length >= max) {
    res.setHeader("Retry-After", String(Math.ceil(windowMs / 1000)));
    return res.status(429).json({ error: "Too many deep dive requests. Try again shortly." });
  }
  stamps.push(now);
  deepDiveHits.set(ip, stamps);
  next();
}

/** Background `processIntelligence` interval (ms). Clamped 60s–24h. Default 5m. */
function tacticalPulseIntervalMs(): number {
  const raw = Number(process.env.TACTICAL_PULSE_MS ?? "");
  const fallback = 5 * 60 * 1000;
  const n = Number.isFinite(raw) && raw > 0 ? raw : fallback;
  return Math.max(60_000, Math.min(86_400_000, n));
}

function tacticalPulseLoopEnabled(): boolean {
  return process.env.DISABLE_TACTICAL_PULSE !== "true";
}

/** Max rows in `globalState.insights`. `INSIGHTS_BUFFER_MAX` clamped 10–500; default 50. */
function insightsBufferMax(): number {
  const raw = Number(process.env.INSIGHTS_BUFFER_MAX ?? "");
  const fallback = 50;
  const n = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
  return Math.max(10, Math.min(500, n));
}

let rawDataContext = "";
let lastGdacsFailureLogAt = 0;
let db: Firestore | null = null;
const PERSISTENCE_COLLECTION = "system";
const STATE_DOC_ID = "global_state";
const SNAPSHOT_DOC_ID = "latest_snapshot";

function isFirestorePersistenceEnabled() {
  return process.env.ENABLE_FIRESTORE_PERSISTENCE === "true";
}

function initFirestoreIfEnabled() {
  if (!isFirestorePersistenceEnabled()) return;
  try {
    if (!getApps().length) {
      initializeApp();
    }
    db = getFirestore();
    console.log("[Persistence] Firestore enabled");
  } catch (error) {
    db = null;
    console.error("[Persistence] Firestore init failed", error);
  }
}

async function loadStateFromFirestore() {
  if (!db) return;
  try {
    const [stateDoc, snapshotDoc] = await Promise.all([
      db.collection(PERSISTENCE_COLLECTION).doc(STATE_DOC_ID).get(),
      db.collection(PERSISTENCE_COLLECTION).doc(SNAPSHOT_DOC_ID).get()
    ]);

    if (!stateDoc.exists && !snapshotDoc.exists) return;
    const statePayload = stateDoc.data();
    const snapshotPayload = snapshotDoc.data();

    globalState = {
      ...globalState,
      ...(statePayload?.state || {}),
      report: {
        ...globalState.report,
        ...(snapshotPayload?.report || {})
      },
      insights: (() => {
        const arr = Array.isArray(snapshotPayload?.insights) ? snapshotPayload.insights : globalState.insights;
        const cap = insightsBufferMax();
        if (!Array.isArray(arr)) return globalState.insights;
        return arr.length > cap ? arr.slice(0, cap) : arr;
      })()
    };
    console.log("[Persistence] globalState restored from Firestore");
  } catch (error) {
    console.error("[Persistence] restore failed", error);
  }
}

async function persistStateToFirestore() {
  if (!db) return;
  try {
    const nowIso = new Date().toISOString();
    await Promise.all([
      db.collection(PERSISTENCE_COLLECTION).doc(STATE_DOC_ID).set({
        state: {
          lastUpdated: globalState.lastUpdated,
          system: globalState.system,
          weather: globalState.weather,
          connectionStatus: globalState.connectionStatus,
          history: globalState.history
        },
        updatedAt: nowIso
      }),
      db.collection(PERSISTENCE_COLLECTION).doc(SNAPSHOT_DOC_ID).set({
        report: {
          dailySummary: globalState.report?.dailySummary || null,
          risks: Array.isArray(globalState.report?.risks) ? globalState.report.risks : []
        },
        insights: Array.isArray(globalState.insights) ? globalState.insights.slice(0, insightsBufferMax()) : [],
        updatedAt: nowIso
      })
    ]);
  } catch (error) {
    console.error("[Persistence] save failed", error);
  }
}

async function fetchDataFeeds() {
  const feeds: any[] = [];
  const statusUpdates: any = {};

  try {
    // 1. USGS Earthquake (JSON)
    const usgsRes = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson");
    if (usgsRes.ok) {
      const usgsData = await usgsRes.json();
      feeds.push(`[USGS] Latest activities: ${JSON.stringify(usgsData.features.slice(0, 3))}`);
      statusUpdates["USGS Earthquake API"] = 'fetched';

      usgsData.features.slice(0, 3).forEach((f: any) => {
        const mag = f.properties.mag;
        globalState.insights.unshift({
          id: `RAW-USGS-${Math.floor(Math.random() * 100000)}`,
          source: "USGS Earthquake API",
          insight: `ตรวจพบแผ่นดินไหวขนาด M${mag} บริเวณ ${f.properties.place}`,
          data: JSON.stringify(f.properties),
          risk: mag >= 4.5 ? 'high' : 'normal',
          time: new Date(f.properties.time).toISOString()
        });
      });
    } else {
      statusUpdates["USGS Earthquake API"] = "unavailable";
    }

    // 2. CISA KEV (JSON)
    const cisaRes = await fetch("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json");
    if (cisaRes.ok) {
      const cisaData = await cisaRes.json();
      feeds.push(`[CISA] Top threats: ${JSON.stringify(cisaData.vulnerabilities.slice(0, 2))}`);
      statusUpdates["CISA KEV (API)"] = 'fetched';

      cisaData.vulnerabilities.slice(0, 2).forEach((v: any) => {
        globalState.insights.unshift({
          id: `RAW-CISA-${v.cveID}`,
          source: "CISA KEV (API)",
          insight: `อัปเดตช่องโหว่ภัยคุกคามไซเบอร์: [${v.cveID}] ${v.vulnerabilityName}`,
          data: JSON.stringify(v),
          risk: 'restricted',
          time: v.dateAdded ? new Date(v.dateAdded).toISOString() : new Date().toISOString()
        });
      });
    } else {
      statusUpdates["CISA KEV (API)"] = "unavailable";
    }

    // 3. GDACS (RSS) - Reliable Disaster Feed
    try {
      const gdacsFeed = await parser.parseURL("https://www.gdacs.org/xml/rss.xml");
      feeds.push(`[GDACS] Disaster alerts: ${gdacsFeed.items.slice(0, 3).map(i => i.title).join('; ')}`);
      statusUpdates["GDACS (UN/EU)"] = 'fetched';

      gdacsFeed.items.slice(0, 3).forEach((item: any) => {
        globalState.insights.unshift({
          id: `RAW-GDACS-${Math.floor(Math.random() * 100000)}`,
          source: "GDACS (UN/EU)",
          insight: item.title,
          data: JSON.stringify(item),
          risk: item.title?.includes('Red') ? 'high' : 'medium',
          time: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
        });
      });
    } catch (e) {
      statusUpdates["GDACS (UN/EU)"] = "unavailable";
      const now = Date.now();
      const cooldown = Math.max(
        120_000,
        Math.min(24 * 60 * 60_000, Number(process.env.GDACS_FAILURE_LOG_COOLDOWN_MS || 1_800_000))
      );
      if (now - lastGdacsFailureLogAt >= cooldown) {
        lastGdacsFailureLogAt = now;
        const detail = e instanceof Error ? e.message : String(e);
        console.warn(
          `[GDACS] RSS fetch failed (${detail}). Suppressing repeat logs for ~${Math.round(cooldown / 60_000)}m (GDACS_FAILURE_LOG_COOLDOWN_MS).`
        );
      }
    }

    // 4. Weather & Air Quality (Open-Meteo)
    try {
      // Simple Architect: Auto-detect location for Thai users or default to Bangkok
      const lat = 13.75;
      const lon = 100.51;

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=precipitation_probability,pm2_5&hourly=pm2_5,precipitation_probability&timezone=Asia%2FBangkok`;
      const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5&timezone=Asia%2FBangkok`;

      const [wRes, aRes] = await Promise.all([fetch(weatherUrl), fetch(airUrl)]);

      if (wRes.ok && aRes.ok) {
        const wData = await wRes.json();
        const aData = await aRes.json();

        const rainP = wData.current?.precipitation_probability || 0;
        const pm = aData.current?.pm2_5 || 15;
        globalState.weather = {
          location: "Bangkok / Metropolitan",
          rainProb8h: rainP,
          pm25: pm,
          temp: 32,
          humidity: 65,
          condition: "Normal"
        };
        feeds.push(
          `[Open-Meteo] Bangkok area: rainProb8h=${rainP}% pm2.5=${pm} (open-meteo.com; attribution required for public products)`
        );
        statusUpdates[WEATHER_CONNECTION_SOURCE] = "fetched";
      } else {
        statusUpdates[WEATHER_CONNECTION_SOURCE] = "unavailable";
      }
    } catch (e) {
      console.error("Weather Fetch Failed");
      statusUpdates[WEATHER_CONNECTION_SOURCE] = "unavailable";
    }

    // 5. Finance baseline (FRED) - St. Louis Financial Stress Index
    try {
      const fredApiKey = process.env.FRED_API_KEY?.trim();
      if (fredApiKey) {
        const fredUrl =
          `https://api.stlouisfed.org/fred/series/observations` +
          `?series_id=STLFSI4&sort_order=desc&limit=1&file_type=json&api_key=${encodeURIComponent(fredApiKey)}`;
        const fredRes = await fetch(fredUrl);
        if (fredRes.ok) {
          const fredData = (await fredRes.json()) as { observations?: { date?: string; value?: string }[] };
          const obs = Array.isArray(fredData.observations) ? fredData.observations[0] : undefined;
          const v = Number(obs?.value);
          if (Number.isFinite(v)) {
            feeds.push(`[FRED] STLFSI4 latest=${v} date=${obs?.date || "n/a"}`);
            globalState.insights.unshift({
              id: `RAW-FRED-STLFSI4-${obs?.date || new Date().toISOString().slice(0, 10)}`,
              source: "FRED (St. Louis Fed)",
              insight: `ดัชนีความตึงเครียดการเงินสหรัฐ (STLFSI4) ล่าสุด = ${v.toFixed(2)}`,
              data: JSON.stringify({ series: "STLFSI4", date: obs?.date || null, value: v }),
              risk: v >= 1 ? "high" : v >= 0.5 ? "medium" : "normal",
              time: obs?.date ? new Date(`${obs.date}T00:00:00Z`).toISOString() : new Date().toISOString()
            });
            statusUpdates["FRED (St. Louis Fed)"] = "fetched";
          } else {
            statusUpdates["FRED (St. Louis Fed)"] = "unavailable";
          }
        } else {
          statusUpdates["FRED (St. Louis Fed)"] = "unavailable";
        }
      } else {
        // keep as idle when key is not configured
      }
    } catch (e) {
      console.error("FRED Fetch Failed");
      statusUpdates["FRED (St. Louis Fed)"] = "unavailable";
    }

    rawDataContext = feeds.join("\n\n");

    // Fill remaining as default
    AUTHORIZED_SOURCES.forEach(s => {
      if (!statusUpdates[s]) statusUpdates[s] = 'idle';
    });

    globalState.connectionStatus = AUTHORIZED_SOURCES.map(s => ({ source: s, status: statusUpdates[s] }));

    // Simple Architect: Inject periodic Pulse Log for transparency
    const now = new Date();
    globalState.insights.unshift({
      source: 'SYSTEM',
      insight: `Tactical scan complete // ${now.toLocaleTimeString('th-TH')}`,
      data: `Analyzed ${AUTHORIZED_SOURCES.length} security domains. AI Core engaged.`,
      risk: 'info',
      time: now.toISOString()
    });
    const cap = insightsBufferMax();
    if (globalState.insights.length > cap) globalState.insights = globalState.insights.slice(0, cap);

  } catch (e) {
    console.error("[Aggregator Engine Error]", e);
  }
}

async function processIntelligence() {
  // Visual Alert: Pulse the connection status at the start
  globalState.system = 'SYNCING';
  globalState.connectionStatus = AUTHORIZED_SOURCES.map(s => ({ source: s, status: 'connecting' }));

  // Simple Architect: Fetch real facts first
  await fetchDataFeeds();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    globalState.system = 'WARN';
    globalState.insights.unshift({
      source: 'SYSTEM',
      insight: `STALLED // GEMINI_API_KEY Missing`,
      data: `Please add GEMINI_API_KEY to your .env file to enable AI Tactical Analysis.`,
      risk: 'high',
      time: new Date().toISOString()
    });
    {
      const cap = insightsBufferMax();
      if (globalState.insights.length > cap) globalState.insights = globalState.insights.slice(0, cap);
    }
    await persistStateToFirestore();
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // DEFINITIVE RAG PROTOCOL
    const prompt = `
      [STRICT DATA ANALYSIS PROTOCOL]
      You are a Tactical Intelligence Analyst for White Bliss Hub.
      Your analysis MUST be 100% based on the provided RAW DATA CONTEXT below.
      
      [RAW DATA CONTEXT]
      ${globalState.insights.slice(0, 10).map((i: any) => `[${i.id}] ${i.source}: ${i.insight}`).join('\n')}
      ${rawDataContext || "No live data fetched. Focus on System Stability."}
      
      [STRICT RULES]
      1. Use ONLY the provided RAW DATA. Do not hallucinate.
      2. [LEGAL & COMPLIANCE GUARDRAIL]: Ensure absolutely no Personally Identifiable Information (PII) is included in the output. Respect data ownership by including the literal 'sourceName' and accurate 'sourceUrl' for proper attribution under fair use.
      3. [TONE & PSYCHOLOGY DIRECTIVE]: Your analysis must be strictly objective, calm, and analytical. DO NOT use sensationalized, fear-mongering, or apocalyptic language (e.g., avoid words like 'Catastrophic', 'หายนะ', 'พินาศ'). Describe the risk factually and provide measured, actionable advice to maintain user composure and operational stability.
      4. [INDEX PIPELINE]: Categorize 'id' strictly as one of: 'nature', 'cyber', 'bio', 'geopolitics', 'climate', 'ai', 'finance', 'social'.
      5. Data Lineage: Extract 'id' from RAW DATA and pass it to 'sourceRefId'.
      
      [OUTPUT FORMAT: JSON]
      { 
        "dailySummary": { "th": "สรุปแบบใจเย็น...", "en": "Calm summary..." }, 
        "risks": [
          { 
            "id": "nature", 
            "sourceRefId": ["RAW-USGS-12345"],
            "labelThai": "แผ่นดินไหวขนาดปานกลาง", 
            "location": "ไต้หวัน",
            "score": 65, 
            "threshold": 50,
            "baseline": 40,
            "topDriverThai": "อาจส่งผลต่อการเดินเครื่องจักรระยะสั้น",
            "findings": [ { "labelThai": "แรงสั่น 5.5 ระดับตื้น" } ],
            "actionableAdvice": "รอติดตามประกาศทางการ",
            "sourceName": "USGS Earthquake Hazards Program",
            "sourceUrl": "https://earthquake.usgs.gov/...",
            "timestamp": "ISO" 
          }
        ]
      }
    `;

    const result = await withGeminiRetries("Intelligence", () =>
      ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    );

    const text = geminiOutputText(result) || "{}";
    const analysis = parseGeminiJsonObject(text) as typeof globalState.report;

    globalState.report = analysis;
    globalState.lastUpdated = new Date().toISOString();
    globalState.system = 'STABLE';

    // --- GHOST HISTORY SNAPSHOT (Every Scan) ---
    snapshotHistory(analysis.risks);
    await persistStateToFirestore();

  } catch (e) {
    console.error("[Intelligence Error]", e);
    globalState.system = 'WARN';
    await persistStateToFirestore();
  }
}

// Tactical Data Retention: 24h @ 15m (96 pts) + 7d @ 4h (42 pts)
function snapshotHistory(risks: any[]) {
  const now = new Date();
  const isQuarterDay = now.getHours() % 4 === 0 && now.getMinutes() < 15;

  risks.forEach(risk => {
    const id = risk.id || 'unknown';
    if (!globalState.history[id]) {
      globalState.history[id] = { short: [], long: [] };
    }

    // 1. Short-Term (24h @ 15m)
    globalState.history[id].short.push(risk.score || 0);
    if (globalState.history[id].short.length > 96) {
      globalState.history[id].short.shift();
    }

    // 2. Long-Term (7d @ 4h - Quarter Day Pulse)
    if (isQuarterDay) {
      globalState.history[id].long.push(risk.score || 0);
      if (globalState.history[id].long.length > 42) {
        globalState.history[id].long.shift();
      }
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3334;
  const MAX_JSON_BODY = process.env.MAX_JSON_BODY || "256kb";

  app.disable("x-powered-by");
  app.set("trust proxy", true);
  app.use(express.json({ limit: MAX_JSON_BODY }));
  app.use((req, res, next) => {
    // CIS-style baseline hardening headers without adding extra dependencies.
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    next();
  });

  app.get("/healthz", (_req, res) => {
    res.status(200).json({ ok: true, service: "atmospheric-bliss" });
  });

  app.get("/readyz", (_req, res) => {
    const ready = globalState.system !== "INITIALIZING";
    res.status(ready ? 200 : 503).json({ ready, system: globalState.system });
  });

  // --- Access mode: public (default) | google (Google ID token + optional httpOnly cookie) ---
  const googleOAuthClient = new OAuth2Client();
  const AUTH_COOKIE_NAME = "ab_google_credential";

  function parseCookie(req: express.Request, name: string): string | undefined {
    const raw = req.headers.cookie;
    if (!raw) return undefined;
    for (const part of raw.split(";")) {
      const i = part.indexOf("=");
      if (i < 0) continue;
      const k = part.slice(0, i).trim();
      if (k === name) return decodeURIComponent(part.slice(i + 1).trim());
    }
    return undefined;
  }

  function authModeIsGoogle(): boolean {
    return process.env.AUTH_MODE === "google";
  }

  function googleOAuthClientId(): string {
    return process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() || "";
  }

  async function verifyGoogleIdToken(
    idToken: string
  ): Promise<{ email: string; sub: string } | null> {
    const aud = googleOAuthClientId();
    if (!aud || !idToken) return null;
    try {
      const ticket = await googleOAuthClient.verifyIdToken({ idToken, audience: aud });
      const payload = ticket.getPayload();
      if (!payload?.email) return null;
      if (payload.email_verified === false) return null;
      const allowed = process.env.GOOGLE_ALLOWED_DOMAINS?.split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (allowed?.length) {
        const domain = (payload.email.split("@")[1] || "").toLowerCase();
        const ok = allowed.some((d) => {
          const base = d.startsWith(".") ? d.slice(1) : d;
          return domain === base || domain.endsWith("." + base);
        });
        if (!ok) return null;
      }
      return { email: payload.email, sub: payload.sub || "" };
    } catch {
      return null;
    }
  }

  function extractGoogleIdToken(req: express.Request): string | null {
    const h = req.headers.authorization;
    if (h?.startsWith("Bearer ")) return h.slice(7).trim();
    const c = parseCookie(req, AUTH_COOKIE_NAME);
    return c?.trim() || null;
  }

  app.get("/api/auth/status", async (req, res) => {
    const mode = authModeIsGoogle() ? "google" : "public";
    const clientId = googleOAuthClientId();
    if (mode === "public") {
      return res.json({ mode, authenticated: true, clientId: "" });
    }
    if (!clientId) {
      return res.status(503).json({
        mode,
        authenticated: false,
        clientId: "",
        error: "GOOGLE_OAUTH_CLIENT_ID is not set",
      });
    }
    const token = extractGoogleIdToken(req);
    if (!token) {
      return res.json({ mode, authenticated: false, clientId });
    }
    const user = await verifyGoogleIdToken(token);
    if (!user) {
      return res.json({ mode, authenticated: false, clientId });
    }
    res.json({ mode, authenticated: true, clientId, email: user.email });
  });

  app.post("/api/auth/session", async (req, res) => {
    if (!authModeIsGoogle()) {
      return res.status(400).json({ error: "AUTH_MODE is not google" });
    }
    const clientId = googleOAuthClientId();
    if (!clientId) return res.status(503).json({ error: "Not configured" });
    const credential = typeof req.body?.credential === "string" ? req.body.credential : "";
    if (!credential) return res.status(400).json({ error: "missing credential" });
    const user = await verifyGoogleIdToken(credential);
    if (!user) return res.status(401).json({ error: "invalid credential" });
    res.cookie(AUTH_COOKIE_NAME, credential, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 55 * 60 * 1000,
      path: "/",
    });
    res.json({ ok: true, email: user.email });
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie(AUTH_COOKIE_NAME, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.json({ ok: true });
  });

  function pathIsApiState(req: express.Request): boolean {
    const p = req.path || "";
    return p === "/api/state" || p.startsWith("/api/state/");
  }

  function sendGlobalStateJson(res: express.Response) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.json({ ...globalState, insightsBufferMax: insightsBufferMax() });
  }

  // Public mode: /api/state before Google auth middleware (JSON first — avoids dev/static catching the path).
  app.use((req, res, next) => {
    if (authModeIsGoogle()) return next();
    if (!pathIsApiState(req)) return next();
    return sendGlobalStateJson(res);
  });

  app.use(async (req, res, next) => {
    if (!authModeIsGoogle()) return next();
    if (req.method === "OPTIONS") return next();
    const p = req.path;
    if (p === "/healthz" || p === "/readyz") return next();
    if (!p.startsWith("/api/")) return next();
    if (p.startsWith("/api/auth/")) return next();
    const token = extractGoogleIdToken(req);
    if (!token) {
      res.setHeader("Content-Type", "application/json");
      return res.status(401).json({ error: "Unauthorized", authRequired: true });
    }
    const user = await verifyGoogleIdToken(token);
    if (!user) {
      res.clearCookie(AUTH_COOKIE_NAME, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      res.setHeader("Content-Type", "application/json");
      return res.status(401).json({ error: "Unauthorized", authRequired: true });
    }
    next();
  });

  initFirestoreIfEnabled();
  await loadStateFromFirestore();

  // Google mode: /api/state only after the session middleware above (still JSON — not Vite/HTML).
  app.use((req, res, next) => {
    if (!authModeIsGoogle()) return next();
    if (!pathIsApiState(req)) return next();
    return sendGlobalStateJson(res);
  });

  app.use((req, res, next) => {
    if (req.url.startsWith("/api/ai/deep-dive")) return next();
    next();
  });

  app.post("/api/ai/deep-dive", rateLimitDeepDive, async (req, res) => {
    try {
      const { logEntry } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(401).json({ error: "No API Key" });
      const ai = new GoogleGenAI({ apiKey });
      const result = await withGeminiRetries("DeepDive", () =>
        ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Tactical briefing for: ${JSON.stringify(logEntry)}. Return bilingual JSON.`,
                },
              ],
            },
          ],
        })
      );
      const text = geminiOutputText(result);
      if (!text.trim()) {
        return res.status(502).json({ error: "Empty AI response" });
      }
      try {
        res.json(parseGeminiJsonObject(text));
      } catch {
        return res.status(502).json({ error: "AI returned invalid JSON" });
      }
    } catch (e) {
      console.error("[DeepDive]", e);
      if (isTransientGeminiError(e)) {
        return res.status(503).json({ error: "AI service temporarily busy. Please try again shortly." });
      }
      const { httpStatus } = geminiErrorFingerprint(e);
      if (httpStatus === 401 || httpStatus === 403) {
        return res.status(httpStatus).json({ error: "AI authentication failed" });
      }
      res.status(500).json({ error: "Deep dive failed" });
    }
  });

  const distPath = path.join(process.cwd(), "dist");
  const indexPath = path.join(distPath, "index.html");

  const isProduction = process.env.NODE_ENV === 'production';

  /** Same TCP port for HTML + API + Vite HMR (LAN/mobile dev); avoids random HMR port blocked by firewall. */
  const httpServer = http.createServer(app);

  if (isProduction && fs.existsSync(indexPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) return res.status(404).json({ error: "Not Found" });
      res.sendFile(indexPath);
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const disableHmr = process.env.DISABLE_HMR === "true";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: disableHmr ? false : { server: httpServer },
      },
      appType: "custom"
    });
    app.use((req, res, next) => {
      const pathOnly = req.originalUrl.split("?")[0] || "";
      if (pathOnly.startsWith("/api")) return next();
      return vite.middlewares(req, res, next);
    });

    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) { next(e); }
    });
  }

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[White Bliss Engine] Operational on Port ${PORT} // API Guard Enabled`);

    processIntelligence();

    const pulseMs = tacticalPulseIntervalMs();
    if (tacticalPulseLoopEnabled()) {
      console.log(
        `[SYSTEM] Tactical Pulse every ${Math.round(pulseMs / 1000)}s (set TACTICAL_PULSE_MS / DISABLE_TACTICAL_PULSE to adjust)`
      );
      setInterval(() => {
        processIntelligence();
      }, pulseMs);
    } else {
      console.log("[SYSTEM] Tactical Pulse loop off (DISABLE_TACTICAL_PULSE=true); initial scan already ran.");
    }
  });
}

startServer();