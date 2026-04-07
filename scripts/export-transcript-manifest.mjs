import fs from "fs";
import readline from "readline";

const INPUT =
  process.argv[2] ||
  String.raw`C:\Users\DELL Latitude 3420\.cursor\projects\d-cursor-Incom-03\agent-transcripts\f574523d-7fd3-47f7-8b02-b6055c8203f1\f574523d-7fd3-47f7-8b02-b6055c8203f1.jsonl`;
const OUT = process.argv[3] || "d:\\cursor\\Incom\\03\\cursor-transcript-read-manifest.txt";

function stripUserQuery(s) {
  return s
    .replace(/^<user_query>\s*/i, "")
    .replace(/\s*<\/user_query>\s*$/i, "")
    .trim();
}

function preview(s, max = 160) {
  const one = s.replace(/\s+/g, " ").trim();
  if (one.length <= max) return one;
  return one.slice(0, max) + "…";
}

async function main() {
  const rl = readline.createInterface({
    input: fs.createReadStream(INPUT, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  let jsonlLine = 0;
  let parseErrors = 0;
  let withText = 0;
  let userTurns = 0;
  let assistantTurns = 0;
  let otherRoles = 0;
  let totalTextChars = 0;
  const rows = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    jsonlLine++;
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      parseErrors++;
      rows.push(`${jsonlLine}\tPARSE_ERROR\t0\t`);
      continue;
    }
    const role = o.role || "?";
    const c = o.message?.content;
    if (!Array.isArray(c)) {
      rows.push(`${jsonlLine}\t${role}\t0\t(no content array)`);
      continue;
    }
    const texts = c
      .filter((x) => x.type === "text" && typeof x.text === "string")
      .map((x) => x.text);
    const body = texts.join("\n\n").trim();
    if (!body) {
      rows.push(`${jsonlLine}\t${role}\t0\t(tool-only or empty text)`);
      continue;
    }
    withText++;
    const len = body.length;
    totalTextChars += len;
    if (role === "user") userTurns++;
    else if (role === "assistant") assistantTurns++;
    else otherRoles++;
    let show = role === "user" ? stripUserQuery(body) : body;
    rows.push(`${jsonlLine}\t${role}\t${len}\t${preview(show, 200)}`);
  }

  const header = [
    "FULL SCAN MANIFEST (every non-empty JSONL line processed)",
    `Source: ${INPUT}`,
    `JSONL data lines: ${jsonlLine}`,
    `Parse errors: ${parseErrors}`,
    `Rows with type=text content: ${withText} (user=${userTurns}, assistant=${assistantTurns}, other=${otherRoles})`,
    `Total characters in all text parts: ${totalTextChars}`,
    "Columns: lineNo | role | textChars | preview",
    "=".repeat(100),
  ].join("\n");

  fs.writeFileSync(OUT, header + "\n" + rows.join("\n"), "utf8");
  console.log("Wrote", OUT, "lines:", rows.length + header.split("\n").length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
