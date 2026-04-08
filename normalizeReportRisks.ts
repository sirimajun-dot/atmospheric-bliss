/** Fixed eight risk domains expected by the client (radar, alerts, trend history). */
export const EIGHT_DOMAIN_IDS = [
  "geopolitics",
  "climate",
  "ai",
  "nature",
  "cyber",
  "bio",
  "finance",
  "social",
] as const;

const DOMAIN_LABELS: Record<string, { th: string; en: string }> = {
  geopolitics: { th: "ภูมิรัฐศาสตร์", en: "Geopolitics" },
  climate: { th: "ภูมิอากาศ", en: "Climate" },
  ai: { th: "เอไอ", en: "AI" },
  nature: { th: "ภัยธรรมชาติ", en: "Nature" },
  cyber: { th: "ไซเบอร์", en: "Cyber" },
  bio: { th: "ชีวภาพ", en: "Biological" },
  finance: { th: "การเงิน", en: "Finance" },
  social: { th: "สังคม", en: "Social" },
};

const DOMAIN_STYLE: Record<string, { emoji: string; color: string }> = {
  geopolitics: { emoji: "🌍", color: "#e11d48" },
  climate: { emoji: "⛈️", color: "#f97316" },
  ai: { emoji: "🤖", color: "#f59e0b" },
  nature: { emoji: "⚡", color: "#ef4444" },
  cyber: { emoji: "🛡️", color: "#3b82f6" },
  bio: { emoji: "☣️", color: "#10b981" },
  finance: { emoji: "📈", color: "#6366f1" },
  social: { emoji: "👥", color: "#8b5cf6" },
};

function placeholderRiskForDomain(id: string): Record<string, unknown> {
  const L = DOMAIN_LABELS[id] || { th: id, en: id };
  const style = DOMAIN_STYLE[id] || { emoji: "•", color: "#94a3b8" };
  return {
    id,
    label: { th: L.th, en: L.en },
    labelThai: `${L.th} — รอสัญญาณจากแหล่งข้อมูล`,
    score: 12,
    baseline: 10,
    threshold: 50,
    color: style.color,
    emoji: style.emoji,
    topDriverThai: "ยังไม่มีเหตุการณ์เด่นในรอบล่าสุด",
    secondaryDriverThai: "-",
    topDriver: "No prominent signal this cycle",
    secondaryDriver: "-",
    sourceName: "รอสัญญาณจากแหล่งข้อมูล",
    evidenceDescriptionThai: "-",
    findings: [],
  };
}

function coerceRiskRow(id: string, row: Record<string, unknown>): Record<string, unknown> {
  const L = DOMAIN_LABELS[id] || { th: id, en: id };
  const style = DOMAIN_STYLE[id] || { emoji: "•", color: "#94a3b8" };
  const score = Math.max(0, Math.min(100, Number(row?.score ?? 0)));
  const threshold = Number(row?.threshold ?? 50);
  const baseline = Number(row?.baseline ?? Math.min(score, 45));
  const next: Record<string, unknown> = { ...row, id, score, threshold, baseline };
  if (!next.label || typeof next.label !== "object") next.label = { th: L.th, en: L.en };
  const lab = next.label as { th?: string; en?: string };
  if (!next.labelThai) next.labelThai = lab.th || L.th;
  if (!next.emoji) next.emoji = style.emoji;
  if (!next.color) next.color = style.color;
  if (!next.topDriverThai) next.topDriverThai = (next.topDriver as string) || "-";
  if (!next.secondaryDriverThai) next.secondaryDriverThai = (next.secondaryDriver as string) || "-";
  return next;
}

/** Merge AI `risks[]` with eight fixed domains; dedupe by `id` (first wins). */
export function normalizeReportToEightDomains(report: unknown): unknown {
  const r = report as { risks?: unknown[] } | null | undefined;
  const raw = Array.isArray(r?.risks) ? r.risks : [];
  const allowed = new Set<string>([...EIGHT_DOMAIN_IDS]);
  const byId = new Map<string, Record<string, unknown>>();
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as { id?: string };
    const id = typeof o.id === "string" ? o.id : "";
    if (!allowed.has(id)) continue;
    if (!byId.has(id)) byId.set(id, coerceRiskRow(id, o as Record<string, unknown>));
  }
  const risks = (EIGHT_DOMAIN_IDS as readonly string[]).map((id) =>
    byId.has(id) ? byId.get(id)! : placeholderRiskForDomain(id)
  );
  return { ...(typeof report === "object" && report != null ? report : {}), risks };
}
