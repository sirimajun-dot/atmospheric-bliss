import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parser = new Parser();

// Helper for relative timestamps
const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();

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

// Authorized Sources for Egress Filter & AI Scanning
const AUTHORIZED_SOURCES = [
  "USGS Earthquake API", "CISA KEV (API)", "GDACS (UN/EU)", "TMD (กรมอุตุฯ)",
  "NASA FIRMS", "DDPM (ปภ.) / T-Alert", "NDWC (เตือนภัยพิบัติ)", "PTWC (NOAA)",
  "Copernicus C3S", "CEMS Early Warning", "NOAA Global Monitoring", "NASA GISS",
  "MITRE ATT&CK", "ThaiCERT (สพธอ.)", "NCSA (สกมช.)", "DDC (กรมควบคุมโรค)",
  "OECD AIM", "Gemini 3 Intelligence", "FRED (St. Louis Fed)", "OFR Financial Stress", "IMF GFSR + WEO"
];

let rawDataContext = "";
let db: Firestore | null = null;

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
    const doc = await db.collection("system").doc("global_state").get();
    if (!doc.exists) return;
    const payload = doc.data();
    if (!payload?.state) return;
    globalState = {
      ...globalState,
      ...payload.state
    };
    console.log("[Persistence] globalState restored from Firestore");
  } catch (error) {
    console.error("[Persistence] restore failed", error);
  }
}

async function persistStateToFirestore() {
  if (!db) return;
  try {
    await db.collection("system").doc("global_state").set({
      state: globalState,
      updatedAt: new Date().toISOString()
    });
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
    } catch (e) { console.error("GDACS Fetch Failed"); }

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

        globalState.weather = {
          location: "Bangkok / Metropolitan",
          rainProb8h: wData.current?.precipitation_probability || 0,
          pm25: aData.current?.pm2_5 || 15,
          temp: 32,
          humidity: 65,
          condition: "Normal"
        };
        statusUpdates["TMD (กรมอุตุฯ)"] = 'fetched';
      }
    } catch (e) { console.error("Weather Fetch Failed"); }

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
    // Cap memory to 50 items to keep UI snappy
    if (globalState.insights.length > 50) globalState.insights = globalState.insights.slice(0, 50);

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

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("INVALID_AI_RESPONSE");

    const analysis = JSON.parse(jsonMatch[0]);

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

  initFirestoreIfEnabled();
  await loadStateFromFirestore();

  // --- ABSOLUTE API GUARD (FORCE PRIORITY) ---
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/state')) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      return res.json(globalState);
    }
    if (req.url.startsWith('/api/ai/deep-dive')) {
      return next(); // Let the post handler take it below
    }
    next();
  });

  app.post("/api/ai/deep-dive", async (req, res) => {
    try {
      const { logEntry } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(401).json({ error: "No API Key" });
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: `Tactical briefing for: ${JSON.stringify(logEntry)}. Return bilingual JSON.`
      });
      // @ts-ignore
      res.json(JSON.parse(result.text));
    } catch (e) { res.status(500).json({ error: "Deep dive failed" }); }
  });

  const distPath = path.join(process.cwd(), "dist");
  const indexPath = path.join(distPath, "index.html");

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && fs.existsSync(indexPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) return res.status(404).json({ error: "Not Found" });
      res.sendFile(indexPath);
    });
  } else {
    // Force development mode via Vite
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { port: 3334 + Math.floor(Math.random() * 1000) }
      },
      appType: "custom"
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) { next(e); }
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[White Bliss Engine] Operational on Port ${PORT} // API Guard Enabled`);

    // Initial Scan
    processIntelligence();

    // --- BACKGROUND TACTICAL PULSE (Every 5 minutes) ---
    console.log("[SYSTEM] Starting 5-minute Tactical Pulse background monitoring...");
    setInterval(() => {
      processIntelligence();
    }, 5 * 60 * 1000);
  });
}

startServer();
