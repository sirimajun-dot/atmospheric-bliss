export const getDetectedApiKey = () => {
  const k1 = typeof process !== 'undefined' ? process.env?.API_KEY : undefined;
  const k2 = typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined;
  const k3 = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  const k4 = (window as any)._AISTUDIO_API_KEY;
  const k5 = (window as any).process?.env?.API_KEY;
  const k6 = typeof localStorage !== 'undefined' ? localStorage.getItem('_AISTUDIO_API_KEY') : null;

  const candidates = [
    { name: "process.env.API_KEY", val: k1 },
    { name: "window.process.env.API_KEY", val: k5 },
    { name: "window._AISTUDIO_API_KEY", val: k4 },
    { name: "localStorage._AISTUDIO_API_KEY", val: k6 },
    { name: "import.meta.env.VITE_GEMINI_API_KEY", val: k3 },
    { name: "process.env.GEMINI_API_KEY", val: k2 }
  ];

  for (const { name, val } of candidates) {
    if (val && typeof val === 'string') {
      const trimmed = val.trim().replace(/["']/g, "");
      if (trimmed.startsWith("AIza") && trimmed.length >= 30) {
        return { key: trimmed, source: name };
      }
    }
  }
  
  for (const { name, val } of candidates) {
    if (val && typeof val === 'string') {
      const trimmed = val.trim().replace(/["']/g, "");
      if (trimmed.length > 20 && !trimmed.includes("YOUR_API_KEY") && trimmed !== "undefined") {
        return { key: trimmed, source: name };
      }
    }
  }

  return null;
};
