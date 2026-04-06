import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe, CloudLightning, Cpu, ChevronDown, Zap, ShieldCheck,
  Biohazard, TrendingUp, ShieldAlert, MapPin, Clock, ExternalLink,
  Activity, Search, BookOpen, AlertTriangle
} from 'lucide-react';

interface ThreatDeepDiveProps {
  risks: any[];
  language?: 'th' | 'en';
}

// All 8 risk domains with metadata
const DOMAIN_CONFIG: Record<string, {
  labelThai: string;
  labelEn: string;
  icon: any;
  iconColor: string;
  accentColor: string;
  accentBg: string;
  wikiUrl: string;
}> = {
  geopolitics: {
    labelThai: 'ภูมิรัฐศาสตร์',
    labelEn: 'Geopolitics',
    icon: Globe,
    iconColor: 'text-rose-500',
    accentColor: 'border-rose-200/60',
    accentBg: 'bg-rose-50/60',
    wikiUrl: 'https://www.understandingwar.org/'
  },
  climate: {
    labelThai: 'ภูมิอากาศ',
    labelEn: 'Climate',
    icon: CloudLightning,
    iconColor: 'text-amber-500',
    accentColor: 'border-amber-200/60',
    accentBg: 'bg-amber-50/60',
    wikiUrl: 'https://climate.copernicus.eu/'
  },
  ai: {
    labelThai: 'ปัญญาประดิษฐ์',
    labelEn: 'AI & Wisdom',
    icon: Cpu,
    iconColor: 'text-violet-500',
    accentColor: 'border-violet-200/60',
    accentBg: 'bg-violet-50/60',
    wikiUrl: 'https://futureoflife.org/ai/ai-safety-monitor/'
  },
  nature: {
    labelThai: 'ภัยธรรมชาติ',
    labelEn: 'Natural Disaster',
    icon: Zap,
    iconColor: 'text-orange-500',
    accentColor: 'border-orange-200/60',
    accentBg: 'bg-orange-50/60',
    wikiUrl: 'https://earthquake.usgs.gov/earthquakes/map/'
  },
  cyber: {
    labelThai: 'ไซเบอร์',
    labelEn: 'Cyber Defense',
    icon: ShieldCheck,
    iconColor: 'text-blue-500',
    accentColor: 'border-blue-200/60',
    accentBg: 'bg-blue-50/60',
    wikiUrl: 'https://www.cisa.gov/news-events/cybersecurity-advisories'
  },
  bio: {
    labelThai: 'สาธารณสุข',
    labelEn: 'Health & Bio',
    icon: Biohazard,
    iconColor: 'text-emerald-500',
    accentColor: 'border-emerald-200/60',
    accentBg: 'bg-emerald-50/60',
    wikiUrl: 'https://www.who.int/emergencies/disease-outbreak-news'
  },
  finance: {
    labelThai: 'การเงิน',
    labelEn: 'Finance',
    icon: TrendingUp,
    iconColor: 'text-indigo-500',
    accentColor: 'border-indigo-200/60',
    accentBg: 'bg-indigo-50/60',
    wikiUrl: 'https://www.imf.org/en/News'
  },
  social: {
    labelThai: 'สังคม',
    labelEn: 'Social Risk',
    icon: ShieldAlert,
    iconColor: 'text-pink-500',
    accentColor: 'border-pink-200/60',
    accentBg: 'bg-pink-50/60',
    wikiUrl: 'https://www.bot.or.th/'
  }
};

const ALL_DOMAIN_IDS = ['geopolitics', 'climate', 'ai', 'nature', 'cyber', 'bio', 'finance', 'social'];

const getTimeAgo = (timestamp?: string | number) => {
  if (!timestamp) return 'ไม่ระบุ';
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'เมื่อครู่';
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ชม. ที่แล้ว`;
  const days = Math.floor(hours / 24);
  return `${days} วันที่แล้ว`;
};

const getStatusCode = (score: number, threshold: number) => {
  if (score > threshold + 5) return { code: 'BRC', color: 'bg-rose-500 text-white', label: 'วิกฤต' };
  if (score >= threshold - 5) return { code: 'ALR', color: 'bg-amber-500 text-white', label: 'เตือน' };
  return { code: 'GRN', color: 'bg-emerald-500 text-white', label: 'ปกติ' };
};

export const ThreatDeepDive: React.FC<ThreatDeepDiveProps> = ({ risks = [], language = 'th' }) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  // Map existing risk data by domain ID
  const riskMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    (Array.isArray(risks) ? risks : []).forEach(r => { map[r.id] = r; });
    return map;
  }, [risks]);

  return (
    <div className="flex flex-col gap-[0.4cm]">
      {/* Section Header */}
      <div className="relative py-3.5 px-5 rounded-3xl overflow-hidden mesh-aura border border-white/40 shadow-soft">
        <div className="absolute top-[-20%] left-[-10%] w-48 h-48 bg-indigo-400/8 blur-[80px] rounded-full" />
        <div className="relative flex items-center gap-4">
          <div className="p-2.5 bg-white/80 backdrop-blur-3xl rounded-xl shadow-lg border border-white">
            <Activity className="w-5 h-5 text-indigo-600 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]" />
          </div>
          <div>
            <h2 className="text-[14px] font-black text-slate-800 tracking-tighter leading-tight uppercase">
              ข้อมูลเชิงลึกภัยคุกคาม
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em]">
                {ALL_DOMAIN_IDS.length} DOMAINS · DEEP INTELLIGENCE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Cards */}
      <div className="flex flex-col gap-[0.4cm]">
        {ALL_DOMAIN_IDS.map((domainId) => {
          const config = DOMAIN_CONFIG[domainId];
          const risk = riskMap[domainId];
          const isExpanded = expandedId === domainId;
          const hasData = !!risk;
          const score = risk?.score ?? 0;
          const threshold = risk?.threshold ?? 50;
          const status = getStatusCode(score, threshold);
          const findings = (risk?.findings || []).slice(0, 3);
          const IconComponent = config.icon;

          return (
            <motion.div
              key={domainId}
              layout
              className={`relative rounded-2xl border overflow-hidden transition-all duration-500 ${isExpanded
                  ? `bg-white shadow-lg ${config.accentColor} ring-1 ring-slate-100`
                  : 'bg-white/50 backdrop-blur-sm border-white/40 hover:bg-white/70 hover:shadow-md'
                }`}
            >
              {/* Domain Header Row */}
              <div
                className="px-4 py-3 flex items-center justify-between cursor-pointer select-none active:scale-[0.995] transition-transform"
                onClick={() => setExpandedId(isExpanded ? null : domainId)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 ${config.accentBg} rounded-xl flex items-center justify-center border border-white shadow-sm flex-shrink-0`}>
                    <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-slate-800 tracking-tight">
                        {language === 'th' ? config.labelThai : config.labelEn}
                      </span>
                      {hasData && score > threshold && (
                        <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[5px] font-black rounded-sm animate-pulse leading-none uppercase">
                          ภัยคุกคามด่วน
                        </span>
                      )}
                    </div>
                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      {hasData ? (risk.sourceName || 'BLISS INTELLIGENCE') : 'รอข้อมูล...'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {hasData ? (
                    <>
                      <span className={`text-[12px] font-black ${score > threshold ? 'text-rose-500' : 'text-slate-600'}`}>
                        {score}%
                      </span>
                      <motion.span
                        animate={status.code === 'BRC' ? { opacity: [1, 0.4, 1] } : (status.code === 'ALR' ? { opacity: [1, 0.7, 1] } : {})}
                        transition={{ duration: status.code === 'BRC' ? 1.2 : 2, repeat: Infinity }}
                        className={`px-1.5 py-0.5 rounded text-[6px] font-black ${status.color}`}
                      >
                        {status.code}
                      </motion.span>
                    </>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-300">—</span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Expanded Detail Panel */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-slate-100/80">
                      {/* Section Title */}
                      <div className="flex items-center gap-2 pt-3 pb-2">
                        <div className="w-[2px] h-3.5 bg-emerald-500 rounded-full" />
                        <h4 className="text-[9px] font-black text-emerald-700 uppercase tracking-[0.15em]">
                          หลักฐานและสถานการณ์จริง
                        </h4>
                      </div>

                      {findings.length > 0 ? (
                        <div className="flex flex-col gap-2.5">
                          {findings.map((finding: any, idx: number) => (
                            <div
                              key={idx}
                              className={`relative rounded-xl border ${config.accentColor} bg-gradient-to-br from-white to-slate-50/30 p-3 transition-all hover:shadow-sm`}
                            >
                              {/* Finding Header */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-lg ${config.accentBg} flex items-center justify-center text-[8px] font-black ${config.iconColor} border border-white shadow-sm`}>
                                    {idx + 1}
                                  </span>
                                  <span className="text-[9px] font-black text-slate-700 leading-tight">
                                    จุดเสี่ยงที่ {idx + 1}
                                  </span>
                                </div>
                                {finding.score && (
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${finding.severity === 'critical' || finding.severity === 'high'
                                      ? 'bg-rose-50 text-rose-500 border border-rose-100'
                                      : 'bg-slate-50 text-slate-500 border border-slate-100'
                                    }`}>
                                    IDX {finding.score}
                                  </span>
                                )}
                              </div>

                              {/* Finding Description */}
                              <p className="text-[9px] text-slate-700 font-semibold leading-relaxed mb-2.5 pl-7">
                                {finding.labelThai || finding.label || 'กำลังวิเคราะห์ข้อมูล...'}
                              </p>

                              {/* Metadata Grid */}
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pl-7">
                                {/* Location */}
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                                  <span className="text-[7px] font-bold text-slate-500 truncate">
                                    {finding.location || risk?.location || 'Global'}
                                  </span>
                                </div>
                                {/* Time Elapsed */}
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                                  <span className="text-[7px] font-bold text-slate-500 truncate">
                                    {getTimeAgo(finding.time || risk?.timestamp)}
                                  </span>
                                </div>
                                {/* Source */}
                                <div className="flex items-center gap-1.5">
                                  <Activity className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                                  <span className="text-[7px] font-bold text-slate-500 truncate">
                                    {finding.sourceName || risk?.sourceName || 'ไม่ระบุ'}
                                  </span>
                                </div>
                                {/* Source Link */}
                                {(finding.sourceUrl || risk?.sourceUrl) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(finding.sourceUrl || risk?.sourceUrl, '_blank');
                                    }}
                                    className="flex items-center gap-1 text-[7px] font-black text-indigo-500 hover:text-indigo-700 transition-colors"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                                    <span className="truncate">เปิดต้นฉบับ</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Empty State - No Findings */
                        <div className="flex flex-col items-center justify-center py-6 gap-2">
                          <div className={`w-10 h-10 ${config.accentBg} rounded-2xl flex items-center justify-center border border-white shadow-sm`}>
                            <AlertTriangle className="w-4 h-4 text-slate-300" />
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 text-center">
                            ยังไม่มีข้อมูลเชิงลึกสำหรับโดเมนนี้
                          </p>
                          <p className="text-[7px] text-slate-300 text-center">
                            ระบบจะอัปเดตเมื่อมีข้อมูลใหม่
                          </p>
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const query = encodeURIComponent(config.labelThai);
                            window.open(`https://www.google.com/search?q=${query}+ความเสี่ยง+ล่าสุด`, '_blank');
                          }}
                          className="flex-1 py-2 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95"
                        >
                          <Search className="w-2.5 h-2.5" />
                          <span className="text-[7px] font-black uppercase tracking-widest">LIVE SEARCH</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(config.wikiUrl, '_blank');
                          }}
                          className="flex-1 py-2 bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-200/30 hover:bg-emerald-700 transition-all active:scale-95"
                        >
                          <BookOpen className="w-2.5 h-2.5" />
                          <span className="text-[7px] font-black uppercase tracking-widest">WIKI</span>
                        </button>
                      </div>

                      {/* Domain Metadata Footer */}
                      {hasData && (
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-50">
                          <span className="text-[6px] font-bold text-slate-400 uppercase tracking-widest">
                            SOURCE: {risk.sourceName || 'BLISS INTELLIGENCE'}
                          </span>
                          <span className="text-[6px] font-bold text-slate-300 uppercase tracking-widest">
                            อัปเดต: {getTimeAgo(risk.timestamp)}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
