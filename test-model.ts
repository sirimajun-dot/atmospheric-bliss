import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

function peekGenaiText(result: { candidates?: { content?: { parts?: { text?: string }[] } }[]; text?: string }) {
  const parts = result.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    for (const p of parts) {
      if (typeof p?.text === "string" && p.text.length > 0) return p.text;
    }
  }
  if (typeof result.text === "string" && result.text.length > 0) return result.text;
  return "";
}

const modelsToTry = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite", 
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
];

for (const model of modelsToTry) {
  try {
    const result = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: "Say ok" }] }],
    });
    const out = peekGenaiText(result);
    console.log(`OK: ${model} -> ${out.slice(0, 20)}`);
    process.exit(0);
  } catch (e: any) {
    console.log(`FAIL: ${model} -> ${e.status}: ${(e.message||'').slice(0, 60)}`);
  }
}
process.exit(1);
