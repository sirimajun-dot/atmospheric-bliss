import fs from "fs";
import readline from "readline";

const INPUT =
  process.argv[2] ||
  String.raw`C:\Users\DELL Latitude 3420\.cursor\projects\d-cursor-Incom-03\agent-transcripts\f574523d-7fd3-47f7-8b02-b6055c8203f1\f574523d-7fd3-47f7-8b02-b6055c8203f1.jsonl`;
const OUT = process.argv[3] || new URL("../cursor-transcript-text-only.txt", import.meta.url).pathname;

function stripUserQuery(s) {
  return s
    .replace(/^<user_query>\s*/i, "")
    .replace(/\s*<\/user_query>\s*$/i, "")
    .trim();
}

async function main() {
  const rl = readline.createInterface({
    input: fs.createReadStream(INPUT, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  let lineNo = 0;
  let turns = 0;
  const w = fs.createWriteStream(OUT, { encoding: "utf8" });
  w.write(`Text-only (role messages with type=text only; no tool calls)\nSource: ${INPUT}\n${"=".repeat(72)}\n`);
  for await (const line of rl) {
    if (!line.trim()) continue;
    lineNo++;
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      continue;
    }
    const role = o.role || "?";
    const c = o.message?.content;
    if (!Array.isArray(c)) continue;
    const texts = c
      .filter((x) => x.type === "text" && typeof x.text === "string")
      .map((x) => x.text.trim())
      .filter(Boolean);
    if (!texts.length) continue;
    let body = texts.join("\n\n");
    if (role === "user") body = stripUserQuery(body);
    if (!body) continue;
    turns++;
    w.write(`\n--- #${lineNo} ${String(role).toUpperCase()} ---\n\n${body}\n`);
  }
  w.end();
  await new Promise((res, rej) => {
    w.on("finish", res);
    w.on("error", rej);
  });
  console.log("JSONL lines:", lineNo, "text turns:", turns, "→", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
