import path from "path";
import { fileURLToPath } from "url";

export const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** First CLI arg, or `CURSOR_TRANSCRIPT_JSONL` env (path to Cursor agent `*.jsonl`). */
export function resolveTranscriptJsonl(argv2) {
  return (argv2 || process.env.CURSOR_TRANSCRIPT_JSONL || "").trim();
}

export function usageJsonl(scriptFile) {
  const base = path.basename(scriptFile);
  console.error(
    `${base}: pass path to Cursor agent transcript (.jsonl) as the first argument, or set CURSOR_TRANSCRIPT_JSONL.\n` +
      `Example: .cursor/projects/<project>/agent-transcripts/<uuid>/<uuid>.jsonl`
  );
  process.exit(1);
}
