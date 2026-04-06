// import { GoogleGenAI } from "@google/genai"; // No longer needed on frontend
import { getDetectedApiKey } from "../lib/auth-utils";

export interface IntelligenceReport {
  risks: {
    id: string;
    score: number;
    findings: {
      label: string;
      labelThai: string;
      score: number;
      location?: string;
      time?: string;
      sourceName: string;
      sourceUrl?: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }[];
    topDriver: string;
    topDriverThai: string;
    secondaryDriver: string;
    secondaryDriverThai: string;
    evidenceDescription: string;
    evidenceDescriptionThai: string;
    sourceName: string;
    sourceUrl: string;
  }[];
  logs: {
    message: string;
    messageThai: string;
    details: string;
    deepDive: string;
    sourceName: string;
    sourceUrl: string;
    lat?: number;
    lon?: number;
    locationName?: string;
  }[];
  alerts: {
    title: string;
    body: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  dailySummary?: {
    overview: string;
    overviewThai: string;
    keyTakeaways: string[];
    keyTakeawaysThai: string[];
    criticalWatchlist: string[];
    criticalWatchlistThai: string[];
    wisdoms: string[];
    wisdomsThai: string[];
  };
}

const callAIProxy = async (model: string, contents: any, config: any) => {
  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, contents, config })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to call AI Proxy");
  }

  return await response.json();
};

export const fetchIntelligence = async (retryCount = 0, locationContext?: string, additionalContext?: string, recentLogs?: any[]): Promise<IntelligenceReport | null> => {
  try {
    const modelName = "gemini-1.5-flash";
    const contextStr = locationContext ? `User Location Context: ${locationContext}. Analyze risks specifically affecting this region if applicable, while maintaining global awareness.` : "Global Context.";

    // Data Minimization: Filter logs for copyrighted sources to only headlines
    const minimizedLogs = (recentLogs || []).map(log => {
      const copyrightedSources = ['reuters', 'bbc', 'cnbc', 'acled'];
      const isCopyrighted = copyrightedSources.some(s => log.sourceName?.toLowerCase().includes(s));

      if (isCopyrighted) {
        return {
          ...log,
          details: "[Content restricted for copyright compliance - Headline only analysis]",
          message: log.message // Keep headline
        };
      }
      return log;
    });

    const slicedLogs = minimizedLogs.slice(0, 15);
    const logsContext = slicedLogs.length > 0
      ? `\n\nRECENT SYSTEM LOGS (Minimized for Copyright Compliance):\n${slicedLogs.map(l => `- [${l.time}] ${l.message} (Source: ${l.sourceName || 'Unknown'})`).join('\n')}`
      : "";

    const config = {
      responseMimeType: "application/json",
      ...(retryCount === 0 ? {
        tools: [{ googleSearch: {} }],
        maxOutputTokens: 4096,
        responseSchema: {
          type: "OBJECT",
          properties: {
            dailySummary: {
              type: "OBJECT",
              properties: {
                overview: { type: "STRING" },
                overviewThai: { type: "STRING" },
                keyTakeaways: { type: "ARRAY", items: { type: "STRING" } },
                keyTakeawaysThai: { type: "ARRAY", items: { type: "STRING" } },
                criticalWatchlist: { type: "ARRAY", items: { type: "STRING" } },
                criticalWatchlistThai: { type: "ARRAY", items: { type: "STRING" } },
                wisdoms: { type: "ARRAY", items: { type: "STRING" } },
                wisdomsThai: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["overview", "overviewThai", "keyTakeaways", "keyTakeawaysThai", "criticalWatchlist", "criticalWatchlistThai", "wisdoms", "wisdomsThai"]
            },
            risks: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "STRING" },
                  score: { type: "NUMBER" },
                  findings: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        label: { type: "STRING" },
                        labelThai: { type: "STRING" },
                        score: { type: "NUMBER" },
                        location: { type: "STRING" },
                        time: { type: "STRING" },
                        sourceName: { type: "STRING" },
                        sourceUrl: { type: "STRING" },
                        severity: { type: "STRING" }
                      },
                      required: ["label", "labelThai", "score", "location", "time", "sourceName", "severity"]
                    }
                  },
                  topDriver: { type: "STRING" },
                  topDriverThai: { type: "STRING" },
                  secondaryDriver: { type: "STRING" },
                  secondaryDriverThai: { type: "STRING" },
                  evidenceDescription: { type: "STRING" },
                  evidenceDescriptionThai: { type: "STRING" },
                  sourceName: { type: "STRING" },
                  sourceUrl: { type: "STRING" }
                },
                required: ["id", "score", "findings", "topDriver", "topDriverThai", "secondaryDriver", "secondaryDriverThai", "evidenceDescription", "evidenceDescriptionThai", "sourceName", "sourceUrl"]
              }
            },
            logs: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  message: { type: "STRING" },
                  messageThai: { type: "STRING" },
                  details: { type: "STRING" },
                  deepDive: { type: "STRING" },
                  sourceName: { type: "STRING" },
                  sourceUrl: { type: "STRING" },
                  lat: { type: "NUMBER" },
                  lon: { type: "NUMBER" },
                  locationName: { type: "STRING" }
                },
                required: ["message", "messageThai", "details", "deepDive", "sourceName", "sourceUrl", "lat", "lon", "locationName"]
              }
            },
            alerts: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  body: { type: "STRING" },
                  severity: { type: "STRING" }
                },
                required: ["title", "body", "severity"]
              }
            }
          },
          required: ["dailySummary", "risks", "logs", "alerts"]
        }
      } : {})
    };

    const prompt = `${contextStr} 
    You are a "Global Risk Classifier & Strategic Analyst". 
    Your role is to classify risks and calculate risk scores (0-100) based on real-time data.

    STRICT COMPLIANCE RULES:
    1. For news sources (Reuters, BBC, CNBC, ACLED), you are ONLY provided with HEADLINES.
    2. DO NOT summarize or rewrite the content of these news articles.
    3. Use the ORIGINAL HEADLINE as the 'label' and 'evidenceDescription' for any findings derived from these sources.
    4. Your value add is the CATEGORIZATION and SCORING of these risks, not content synthesis.
    5. For Open Data (NASA, USGS, Weather), you may perform deep analysis.
    6. NEVER use generic source names like "Global Intelligence Feed". Always use the ACTUAL source name (e.g., Reuters, NASA, TMD).

    TASK:
    1. Analyze the events and update risk scores for categories: Geopolitics, Climate, AI & Wisdom, Finance, Health.
    2. Create exactly 3 "findings" for each risk category.
    3. For news-based findings, the 'label' and 'evidenceDescription' MUST be the original headline.
    4. Provide a concise daily summary that focuses on the overall risk landscape.

    ${logsContext}
    
    Return a structured JSON report following the provided schema.`;

    const response = await callAIProxy(modelName, [{ parts: [{ text: prompt }] }], config);

    const text = response.text;
    if (text) {
      try {
        // Clean up JSON if model wrapped it in markdown blocks
        const cleanedJson = text.replace(/```json\n?|```/g, "").trim();
        return JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Text:", text);
        return null;
      }
    }
    return null;
  } catch (error: any) {
    console.error("AI Proxy Call Error:", error.message);
    return null;
  }
};

export const getLogDeepDive = async (message: string, details: string): Promise<string | null> => {
  try {
    const response = await callAIProxy("gemini-1.5-flash", [{ parts: [{ text: `Provide a deep dive analysis in THAI for this risk log: "${message}". Context: "${details}". Focus on potential impact, mitigation strategies, and related global trends. Use Google Search to find recent context.` }] }], {
      tools: [{ googleSearch: {} }],
    });

    return response.text || null;
  } catch (error) {
    console.error("Error getting deep dive:", error);
    return null;
  }
};
