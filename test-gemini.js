const { GoogleGenAI } = require("@google/genai");

async function test() {
  const apiKey = 'AIzaSyBkkztQ55UzFPqYXyhSH4yE15HVYn-LAwU';
  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: "Hello" }] }]
    });
    console.log("SUCCESS:", result.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (e) {
    console.error("ERROR:", e);
  }
}
test();
