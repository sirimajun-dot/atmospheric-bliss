import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { repoRoot, resolveTranscriptJsonl, usageJsonl } from "./_transcriptEnv.mjs";

const INPUT = resolveTranscriptJsonl(process.argv[2]);
if (!INPUT) usageJsonl(fileURLToPath(import.meta.url));
const OUT = process.argv[3] || path.join(repoRoot, "cursor-user-index.txt");

async function main() {
  if (!fs.existsSync(INPUT)) {
    console.error("Input not found:", INPUT);
    process.exit(1);
  }
  const rl = readline.createInterface({
    input: fs.createReadStream(INPUT, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  let lineNo = 0;
  const rows = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    lineNo++;
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      continue;
    }
    if (o.role !== "user") continue;
    const c = o.message?.content;
    if (!Array.isArray(c)) continue;
    const t = c
      .filter((x) => x.type === "text" && typeof x.text === "string")
      .map((x) => x.text)
      .join(" ")
      .replace(/<\/?user_query>/gi, "")
      .trim()
      .replace(/\s+/g, " ");
    if (!t) continue;
    rows.push(`${lineNo}: ${t.slice(0, 220)}${t.length > 220 ? "…" : ""}`);
  }
  fs.writeFileSync(OUT, rows.join("\n"), "utf8");
  console.log("User lines:", rows.length, "→", OUT);
}

main().catch(console.error);
