import { useState, useEffect, useCallback } from 'react';

/**
 * useRiskData (Revolution Edition 4.5)
 * Absolute Synchronization with Bilingual Hub.
 */

/**
 * Legal Guardian Protocol: Redacts sensitive PII (Phone, Email, ID)
 */
const redactSensitiveInfo = (text: string) => {
    if (!text) return text;
    // Redact Phone Numbers (TH format)
    let redacted = text.replace(/(\d{3})-\d{3}-\d{4}/g, "$1-XXX-XXXX");
    redacted = redacted.replace(/0\d{9}/g, "0XXXXXXXXX");
    // Redact Emails
    redacted = redacted.replace(/[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+\.[a-zA-z]{2,3}/g, "[REDACTED EMAIL]");
    return redacted;
};

// Performance Guru: Cache singleton
let apiCache: { data: any, timestamp: number } | null = null;
const CACHE_TTL = 60 * 1000; // 60 seconds

export const useRiskData = () => {
    const [state, setState] = useState<any>({
        risks: [],
        dailySummary: null,
        logs: [],
        system: 'INITIALIZING',
        isLoading: true,
        compositeScore: 0,
        weather: null,
        lastUpdated: '',
        connectionStatus: []
    });

    const fetchState = useCallback(async (force = false) => {
        try {
            // Performance Guru: Return cached data if available and fresh
            if (!force && apiCache && (Date.now() - apiCache.timestamp < CACHE_TTL)) {
                setState(apiCache.data);
                return;
            }

            const bust = Date.now();
            const response = await fetch(`/api/state?t=${bust}`, { credentials: "include" });
            
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
               throw new Error("API_RETURNED_HTML_INSTEAD_OF_JSON");
            }

            const data = await response.json();
            
            if (data.report) {
                const risks = data.report.risks || [];
                const scores = risks.map((r: any) => r.score || 0);
                const compositeScore = risks.length > 0 
                  ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / risks.length) 
                  : 0;
                
                const nextState = {
                    risks: risks,
                    dailySummary: data.report.dailySummary || null,
                    logs: (data.insights || []).map((i: any, idx: number) => {
                        let cat = 'System';
                        if (i.source?.includes('USGS')) cat = 'Natural Disaster';
                        if (i.source?.includes('CISA')) cat = 'Cyber Defense';
                        if (i.source?.includes('GDACS')) cat = 'Geopolitics';
                        return {
                            id: i.id || `log-${idx}`,
                            timestamp: i.time || new Date().toISOString(),
                            time: i.time ? new Date(i.time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : new Date(data.lastUpdated || Date.now()).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                            messageThai: redactSensitiveInfo(i.insight || 'System Pulse'),
                            details: redactSensitiveInfo(i.data || ''),
                            sourceName: i.source || 'SYSTEM',
                            category: cat,
                            severity: i.risk === 'restricted' || i.risk === 'high' ? 'high' : 'medium'
                        };
                    }),
                    system: data.system || 'STABLE',
                    isLoading: false,
                    compositeScore,
                    weather: data.weather || null,
                    lastUpdated: data.lastUpdated,
                    connectionStatus: data.connectionStatus || [],
                    history: data.history || {} // Ghost History Pulse
                };

                apiCache = { data: nextState, timestamp: Date.now() };
                setState(nextState);
            } else {
                setState(prev => ({ 
                    ...prev, 
                    isLoading: false, 
                    system: data.system,
                    connectionStatus: data.connectionStatus || [] 
                }));
            }
        } catch (err) {
            console.error('[Revolution Sync Error]', err);
            setState(prev => ({ ...prev, isLoading: false, system: 'SYNC_FAIL' }));
        }
    }, []);

    useEffect(() => {
        fetchState();
        const interval = setInterval(() => fetchState(true), 15 * 60 * 1000); 
        return () => clearInterval(interval);
    }, [fetchState]);

    return {
        ...state,
        refresh: () => fetchState(true),
        getOverallTopThreat: (lang: 'th' | 'en') => {
          const top = state.risks.sort((a: any, b: any) => b.score - a.score)[0];
          if (!top) return lang === 'th' ? 'ปกติ' : 'NORMAL';
          const label = top.label || {};
          return label[lang] || top.labelThai || top.label || "NORMAL";
        }
    };
};

