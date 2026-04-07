import fs from "fs";
import readline from "readline";

const INPUT =
  process.argv[2] ||
  String.raw`C:\Users\DELL Latitude 3420\.cursor\projects\d-cursor-Incom-03\agent-transcripts\f574523d-7fd3-47f7-8b02-b6055c8203f1\f574523d-7fd3-47f7-8b02-b6055c8203f1.jsonl`;
const OUT = process.argv[3] || new URL("../cursor-agent-transcript-full.txt", import.meta.url).pathname;

function formatBlock(content) {
  if (!Array.isArray(content)) return String(content ?? "");
  const chunks = [];
  for (const c of content) {
    if (c?.type === "text" && typeof c.text === "string") chunks.push(c.text);
    else if (c?.type === "tool_use" && c.name)
      chunks.push(`\n[Tool: ${c.name}]\n${JSON.stringify(c.input ?? {}, null, 2)}`);
    else if (c?.type === "tool_result")
      chunks.push(`\n[Tool result]\n${typeof c.content === "string" ? c.content : JSON.stringify(c.content, null, 2)}`);
  }
  return chunks.join("\n").trimEnd();
}

function lineToText(line) {
  let obj;
  try {
    obj = JSON.parse(line);
  } catch {
    return { role: "parse_error", body: line.slice(0, 500) };
  }
  const role = obj.role || "?";
  const msg = obj.message;
  const content = msg?.content;
  const body = formatBlock(content);
  return { role, body };
}

async function main() {
  if (!fs.existsSync(INPUT)) {
    console.error("Input not found:", INPUT);
    process.exit(1);
  }
  const rl = readline.createInterface({
    input: fs.createReadStream(INPUT, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  let i = 0;
  const header = [
    "=".repeat(78),
    "Cursor agent transcript export (raw JSONL → readable text)",
    `Source: ${INPUT}`,
    "Note: Includes tool calls as JSON blocks. This is the on-disk record Cursor keeps.",
    "=".repeat(78),
    "",
  ].join("\n");
  const out = fs.createWriteStream(OUT, { encoding: "utf8" });
  out.write(header);
  for await (const line of rl) {
    if (!line.trim()) continue;
    i++;
    const { role, body } = lineToText(line);
    out.write(`\n--- #${i} | ${role.toUpperCase()} ---\n\n`);
    out.write(body || "(empty)\n");
  }
  out.end();
  await new Promise((res, rej) => {
    out.on("finish", res);
    out.on("error", rej);
  });
  console.log("Wrote", OUT, "lines:", i);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
