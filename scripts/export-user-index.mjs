import fs from "fs";
import readline from "readline";

const INPUT =
  process.argv[2] ||
  String.raw`C:\Users\DELL Latitude 3420\.cursor\projects\d-cursor-Incom-03\agent-transcripts\f574523d-7fd3-47f7-8b02-b6055c8203f1\f574523d-7fd3-47f7-8b02-b6055c8203f1.jsonl`;
const OUT = process.argv[3] || "d:\\cursor\\Incom\\03\\cursor-user-index.txt";

async function main() {
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
