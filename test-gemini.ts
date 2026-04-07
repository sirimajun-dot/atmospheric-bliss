import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Set GEMINI_API_KEY in .env");
    process.exit(1);
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [{ role: "user", parts: [{ text: "Hello" }] }],
    });
    const parts = result.candidates?.[0]?.content?.parts;
    const text =
      parts?.map((p) => p.text).filter(Boolean).join("") ||
      (typeof (result as { text?: string }).text === "string" ? (result as { text: string }).text : "");
    console.log("SUCCESS:", text || "(empty)");
  } catch (e) {
    console.error("ERROR:", e);
  }
}

test();
