import fs from "fs";
import readline from "readline";

const SRC = process.argv[2] || "d:\\cursor\\Incom\\03\\cursor-agent-transcript-full.txt";
const OUT = process.argv[3] || "d:\\cursor\\Incom\\03\\cursor-transcript-dialogue-only.txt";

/** If SRC is .jsonl, parse raw; else parse exported full txt blocks */
async function fromJsonl(path) {
  const rl = readline.createInterface({
    input: fs.createReadStream(path, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  const lines = [];
  let n = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    n++;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    const role = obj.role;
    const content = obj.message?.content;
    if (!Array.isArray(content)) continue;
    const textParts = [];
    for (const c of content) {
      if (c?.type === "text" && typeof c.text === "string") textParts.push(c.text.trim());
    }
    const body = textParts.join("\n\n").trim();
    if (!body) continue;
    lines.push({ n, role, body });
  }
  return lines;
}

function stripUserQueryWrapper(s) {
  return s
    .replace(/^<user_query>\s*/i, "")
    .replace(/\s*<\/user_query>\s*$/i, "")
    .trim();
}

async function fromExportedTxt(path) {
  const raw = fs.readFileSync(path, "utf8");
  const blocks = raw.split(/\n--- #(\d+) \| ([A-Z_]+) ---\n\n/g);
  const lines = [];
  for (let i = 1; i < blocks.length; i += 3) {
    const num = blocks[i];
    const role = blocks[i + 1]?.toLowerCase();
    const body = (blocks[i + 2] || "").split(/\n--- #/)[0].trim();
    if (role !== "user" && role !== "assistant") continue;
    let clean = body;
    if (role === "assistant") {
      clean = body.replace(/\n\[Tool:[^\]]*\][\s\S]*?(?=\n--- #|\n\n\[Tool:|$)/g, "\n");
      clean = clean.replace(/\n\[Tool:[\s\S]*/g, "");
      clean = clean.replace(/\n{3,}/g, "\n\n").trim();
    }
    if (role === "user") clean = stripUserQueryWrapper(clean);
    if (!clean || clean.length < 2) continue;
    lines.push({ n: Number(num), role, body: clean });
  }
  return lines;
}

async function main() {
  const isJsonl = SRC.endsWith(".jsonl");
  const dialogue = isJsonl ? await fromJsonl(SRC) : await fromExportedTxt(SRC);
  const out = fs.createWriteStream(OUT, { encoding: "utf8" });
  out.write(
    "Dialogue-only extract (user + assistant text; tool dumps removed)\n" +
      `Source: ${SRC}\n` +
      "=".repeat(72) +
      "\n\n"
  );
  for (const { n, role, body } of dialogue) {
    out.write(`\n### [#${n}] ${role.toUpperCase()}\n\n`);
    out.write(body);
    out.write("\n");
  }
  out.end();
  await new Promise((r, j) => {
    out.on("finish", r);
    out.on("error", j);
  });
  console.log("Wrote", OUT, "turns:", dialogue.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
