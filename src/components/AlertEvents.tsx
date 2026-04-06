import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  CloudLightning, 
  Cpu, 
  ChevronDown, 
  Search, 
  Zap, 
  ShieldCheck, 
  Biohazard, 
  TrendingUp,
  ShieldAlert,
  BookOpen
} from 'lucide-react';

interface AlertEventsProps {
  risks?: any[];
  alerts?: any[];
}

export const AlertEvents: React.FC<AlertEventsProps> = ({ risks = [], alerts = [] }) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(() => {
    return localStorage.getItem('alert_events_expanded_id') || 'ai';
  });

  React.useEffect(() => {
    if (expandedId) {
      localStorage.setItem('alert_events_expanded_id', expandedId);
    } else {
      localStorage.removeItem('alert_events_expanded_id');
    }
  }, [expandedId]);

  const getWikiUrl = (id: string) => {
    const mapping: Record<string, string> = {
      'geopolitics': 'https://www.understandingwar.org/',
      'social': 'https://www.bot.or.th/th/our-roles/consumer-protection-and-financial-literacy/financial-threat.html',
      'bio': 'https://www.who.int/emergencies/disease-outbreak-news',
      'ai': 'https://futureoflife.org/ai/ai-safety-monitor/',
      'nature': 'https://earthquake.usgs.gov/earthquakes/map/',
      'cyber': 'https://www.cisa.gov/news-events/cybersecurity-advisories',
      'climate': 'https://climate.copernicus.eu/',
      'finance': 'https://www.imf.org/en/News'
    };
    return mapping[id] || 'https://en.wikipedia.org/wiki/Global_risk';
  };

  const getIcon = (id: string) => {
    if (id.startsWith('alert-')) return <Zap className="w-4 h-4 text-rose-600" />;
    switch (id) {
      case 'geopolitics': return <Globe className="w-4 h-4 text-[#e11d48]" />;
      case 'climate': return <CloudLightning className="w-4 h-4 text-[#f97316]" />;
      case 'ai': return <Cpu className="w-4 h-4 text-[#f59e0b]" />;
      case 'nature': return <Zap className="w-4 h-4 text-[#ef4444]" />;
      case 'cyber': return <ShieldCheck className="w-4 h-4 text-[#3b82f6]" />;
      case 'bio': return <Biohazard className="w-4 h-4 text-[#10b981]" />;
      case 'finance': return <TrendingUp className="w-4 h-4 text-[#6366f1]" />;
      case 'social': return <ShieldAlert className="w-4 h-4 text-[#6366f1]" />;
      default: return <Globe className="w-4 h-4 text-slate-400" />;
    }
  };

  const getIconBg = (id: string) => {
    if (id.startsWith('alert-')) return 'bg-rose-50';
    switch (id) {
      case 'geopolitics': return 'bg-[#fff1f2]';
      case 'climate': return 'bg-[#fff7ed]';
      case 'ai': return 'bg-[#fffbeb]';
      case 'nature': return 'bg-[#fef2f2]';
      case 'cyber': return 'bg-[#eff6ff]';
      case 'bio': return 'bg-[#ecfdf5]';
      case 'finance': return 'bg-[#eef2ff]';
      case 'social': return 'bg-[#eef2ff]';
      default: return 'bg-slate-50';
    }
  };

  const getCodeInfo = (id: string, score: number, threshold: number) => {
    if (id === 'cyber') {
      if (score > 78) {
        return { code: 'BRC', color: 'bg-[#fff1f2] text-[#e11d48] border-[#fecdd3]' };
      } else if (score > 65) {
        return { code: 'ALR', color: 'bg-[#fff7ed] text-[#f97316] border-[#ffedd5]' };
      } else {
        return { code: 'GRN', color: 'bg-[#ecfdf5] text-[#10b981] border-[#d1fae5]' };
      }
    }
    if (score > threshold + 5) {
      return { code: 'BRC', color: 'bg-[#fff1f2] text-[#e11d48] border-[#fecdd3]' };
    } else if (score >= threshold - 5) {
      return { code: 'ALR', color: 'bg-[#fff7ed] text-[#f97316] border-[#ffedd5]' };
    } else {
      return { code: 'GRN', color: 'bg-[#ecfdf5] text-[#10b981] border-[#d1fae5]' };
    }
  };

  const riskAlerts = (Array.isArray(risks) ? risks : []).map(risk => {
    const codeInfo = getCodeInfo(risk.id, risk.score, risk.threshold);
    const evidenceHeader = 'รายละเอียดเหตุการณ์ที่สำคัญ:';
    
    let evidencePoints: string[] = [];
    if (risk.findings && risk.findings.length > 0) {
      evidencePoints = risk.findings.map((f: any) => {
        const source = f.source || risk.sourceName || 'N/A';
        const location = f.location || risk.location || 'Global';
        return `[${source} | ${location}]: ${f.labelThai}`;
      });
    } else {
      const evidenceLines = (risk.evidenceDescriptionThai || '').split('\n').filter((l: string) => l.trim() !== '');
      evidencePoints = evidenceLines.map((l: string) => l.replace(/^- /, '').trim());
    }

    const isUrgent = risk.id === 'cyber' ? risk.score > 65 : risk.score > risk.threshold;
    const isRed = risk.id === 'cyber' ? risk.score > 78 : risk.score > risk.threshold + 5;
    const isOrange = risk.id === 'cyber' ? (risk.score > 65 && risk.score <= 78) : (risk.score >= risk.threshold - 5 && risk.score <= risk.threshold + 5);

    return {
      id: risk.id,
      timestamp: risk.timestamp || Date.now(),
      icon: getIcon(risk.id),
      iconBg: getIconBg(risk.id),
      title: risk.labelThai,
      subtitle: risk.evidenceDescriptionThai || risk.topDriverThai,
      percentage: `${risk.score}%`,
      code: codeInfo.code,
      codeColor: codeInfo.color,
      urgent: isUrgent,
      impactScore: Math.max(0, risk.score - risk.baseline),
      borderColor: isRed ? 'bg-[#e11d48]' : (isOrange ? 'bg-[#f97316]' : 'bg-[#10b981]'),
      details: {
        evidence: evidenceHeader,
        points: evidencePoints.length > 0 ? evidencePoints : [risk.topDriverThai, risk.secondaryDriverThai].filter(Boolean),
        source: risk.sourceName || 'INTELLIGENCE FEED',
        sourceUrl: risk.sourceUrl,
        wikiUrl: getWikiUrl(risk.id)
      }
    };
  });

  const aiAlerts = (Array.isArray(alerts) ? alerts : []).map(alert => ({
    id: alert.id,
    timestamp: alert.timestamp || Date.now(),
    icon: <Zap className="w-4 h-4 text-rose-600" />,
    iconBg: 'bg-rose-50',
    title: alert.title,
    subtitle: alert.body,
    percentage: alert.severity.toUpperCase(),
    code: 'NEW',
    codeColor: 'bg-rose-600 text-white border-rose-700',
    urgent: alert.severity === 'high',
    impactScore: alert.impactScore || (alert.severity === 'high' ? 80 : 40),
    borderColor: 'bg-rose-600',
    type: alert.title.includes('Earthquake') ? 'earthquake' : 'general',
    details: {
      evidence: 'รายละเอียดเหตุการณ์ที่สำคัญ:',
      points: [`[${alert.source || 'AI'} | ${alert.location || 'Global'}]: ${alert.body}`],
      source: alert.source || 'AI INTELLIGENCE',
      sourceUrl: alert.sourceUrl,
      wikiUrl: getWikiUrl(alert.title.toLowerCase().includes('earthquake') ? 'nature' : 'ai')
    }
  }));

  const allAlerts = [...aiAlerts, ...riskAlerts]
    .filter(a => (Date.now() - a.timestamp) < (24 * 60 * 60 * 1000))
    .sort((a, b) => {
      const aScore = a.code !== 'NEW' ? a.impactScore + 10 : a.impactScore;
      const bScore = b.code !== 'NEW' ? b.impactScore + 10 : b.impactScore;
      return bScore - aScore;
    });

  const getTimeAgo = (timestamp?: number) => {
    if (!timestamp) return '';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'เมื่อครู่';
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hours = Math.floor(mins / 60);
    return `${hours} ชั่วโมงที่แล้ว`;
  };

  const handleLiveSearch = (title: string) => {
    const query = encodeURIComponent(title);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  return (
    <div className="bg-white rounded-sm p-2.5 shadow-soft border border-slate-100 w-full max-w-[360px] mx-auto">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-0.5 h-4 bg-slate-900 rounded-full" />
          <h2 className="text-[11px] font-black text-slate-900 tracking-tight">รายการภัยคุกคามที่สำคัญ</h2>
        </div>
        <div className="flex gap-1">
          <div className="px-1.5 py-0.5 bg-[#f8fafc] text-[#94a3b8] text-[5px] font-bold rounded-full border border-slate-100 flex items-center gap-1 tracking-tighter">
            กำลังซิงค์กับเรดาร์
            <div className="w-0.5 h-0.5 bg-[#22c55e] rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {allAlerts.map((alert) => (
          <div 
            key={alert.id}
            className="relative bg-white border border-slate-100 shadow-sm transition-all duration-300 cursor-pointer rounded-sm"
            onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-[2.5px] ${alert.borderColor}`} />
            
            <div className="py-1 px-3 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-grow">
                <div className={`w-5.5 h-5.5 ${alert.iconBg} rounded-full border border-slate-50 flex items-center justify-center flex-shrink-0`}>
                  <div className="scale-75 flex items-center justify-center">
                    {alert.icon}
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-[9.5px] font-black text-slate-900 whitespace-nowrap">{alert.title}</span>
                    {alert.urgent && (
                      <div className="px-1 py-0.5 bg-[#e11d48] text-white text-[4px] font-black rounded-[1.5px] flex flex-col items-center justify-center leading-[1] uppercase">
                        <span>ภัย</span>
                        <span>คุกคาม</span>
                        <span>ด่วน</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[6px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">
                    {getTimeAgo(alert.timestamp)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 text-[8px] font-bold text-slate-300">
                  {alert.percentage}
                  <ChevronDown className={`w-2 h-2 transition-transform duration-300 ${expandedId === alert.id ? 'rotate-180' : ''}`} />
                </div>
                <motion.div 
                  animate={alert.code === 'BRC' ? { 
                    opacity: [1, 0.4, 1],
                    filter: ["brightness(1)", "brightness(1.8)", "brightness(1)"]
                  } : (alert.code === 'ALR' ? {
                    opacity: [1, 0.7, 1],
                    filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"]
                  } : {})}
                  transition={{ 
                    duration: alert.code === 'BRC' ? 1.2 : 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className={`px-1 py-0.5 rounded-[2px] text-[5.5px] font-black border tracking-tighter ${alert.codeColor}`}
                >
                  {alert.code}
                </motion.div>
              </div>
            </div>

            <AnimatePresence>
              {expandedId === alert.id && alert.details && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white border-t border-slate-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 pb-3 pt-1.5 space-y-2.5">
                    <div className="space-y-1.5" onClick={() => setExpandedId(null)}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-[1.5px] h-2.5 bg-[#10b981] rounded-full" />
                        <h4 className="text-[8px] font-black text-[#059669] tracking-tight">
                          {alert.details.evidence}
                        </h4>
                      </div>
                      <ul className="space-y-1 ml-2.5">
                        {alert.details.points.map((point: string, idx: number) => (
                          <li key={idx} className="text-[8px] text-slate-600 font-medium flex items-center gap-1.5">
                            <div className="w-0.5 h-[1px] bg-slate-200" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button 
                          className="py-2 bg-[#0f172a] text-white rounded-[10px] flex items-center justify-center gap-1.5 shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLiveSearch(alert.title);
                          }}
                        >
                          <Search className="w-2.5 h-2.5" />
                          <span className="text-[7px] font-black uppercase tracking-widest">LIVE SEARCH</span>
                        </button>
                        
                        <button 
                          className="py-2 bg-emerald-600 text-white rounded-[10px] flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-all active:scale-95 border border-emerald-500/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(alert.details.wikiUrl, '_blank');
                          }}
                        >
                          <BookOpen className="w-2.5 h-2.5" />
                          <span className="text-[7px] font-black uppercase tracking-widest">SPECIALIZED WIKI</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between pt-0.5 px-0.5">
                      <span className="text-[6.5px] font-bold text-slate-400 uppercase tracking-widest">
                        SOURCE: {alert.details.source}
                      </span>
                      <button 
                        className={`text-[7px] font-black flex items-center gap-1 hover:underline ${alert.details.sourceUrl ? 'text-[#059669]' : 'text-slate-300 cursor-not-allowed'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (alert.details.sourceUrl) window.open(alert.details.sourceUrl, '_blank');
                        }}
                        disabled={!alert.details.sourceUrl}
                      >
                        เปิดต้นฉบับ
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};
