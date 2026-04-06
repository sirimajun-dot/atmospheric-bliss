import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Newspaper, Clock, ExternalLink, ShieldCheck, Search, X, MapPin } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LogEntry } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ThreatIntelligenceReportProps {
  logs: LogEntry[];
  focusedLogId?: string | null;
}

export const ThreatIntelligenceReport: React.FC<ThreatIntelligenceReportProps> = ({ logs, focusedLogId }) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);

  // Handle focused log
  React.useEffect(() => {
    if (focusedLogId) {
      setExpandedId(focusedLogId);
      setTimeout(() => {
        const element = document.getElementById(`log-${focusedLogId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [focusedLogId]);

  // Listen for global search events from the header
  React.useEffect(() => {
    const handleGlobalSearch = (e: any) => {
      setSearchQuery(e.detail || '');
    };
    window.addEventListener('global-search', handleGlobalSearch);
    return () => window.removeEventListener('global-search', handleGlobalSearch);
  }, []);

  // Filter logs based on search query
  const filteredLogs = React.useMemo(() => {
    if (!Array.isArray(logs)) return [];
    if (!searchQuery.trim()) return logs;
    const query = searchQuery.toLowerCase();
    return logs.filter(log => 
      log && log.messageThai && (
        log.messageThai.toLowerCase().includes(query) ||
        (log.details && log.details.toLowerCase().includes(query)) ||
        (log.sourceName && log.sourceName.toLowerCase().includes(query))
      )
    );
  }, [logs, searchQuery]);

  // Group logs by date
  const groupedLogs = filteredLogs.reduce((acc, log) => {
    if (!log || !log.timestamp) return acc;
    const date = new Date(log.timestamp).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, LogEntry[]>);

  // Framer Motion Variants for Wow-Factor Stagger
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="flex flex-col gap-[0.4cm] pb-32 mt-[-0.61cm]">
      {/* Header with Mesh Aura - Slim Alchemist Edition */}
      <div className="relative py-3 px-5 rounded-3xl overflow-hidden mesh-aura border border-white/40 shadow-soft">
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-emerald-400/10 blur-[80px] rounded-full" />
        <div className="relative flex items-center justify-between gap-4">
          <AnimatePresence mode="wait">
            {!isSearching ? (
              <motion.div 
                key="header-content"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-4 flex-1"
              >
                <div className="p-2 bg-white/80 backdrop-blur-3xl rounded-xl shadow-lg border border-white glow-border-emerald">
                  <Newspaper className="w-5 h-5 text-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                </div>
                <div>
                  <h2 className="text-[14px] font-black text-slate-800 tracking-tighter leading-tight uppercase">
                    รายงานสถานการณ์ความเสี่ยงรายวัน
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em]">BILINGUAL FEED V5.1</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="search-content"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex-1 flex items-center bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 px-4 h-10"
              >
                <Search className="w-4 h-4 text-emerald-500 mr-3" />
                <input 
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาข้อมูล..."
                  className="bg-transparent border-none outline-none text-[13px] font-bold text-slate-700 w-full placeholder-slate-400"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => {
              setIsSearching(!isSearching);
              if (isSearching) setSearchQuery('');
            }}
            className="p-2.5 bg-white/60 hover:bg-white rounded-xl shadow-sm border border-white transition-all active:scale-95 flex-shrink-0"
          >
            {isSearching ? <X className="w-4 h-4 text-slate-400" /> : <Search className="w-4 h-4 text-emerald-600" />}
          </button>
        </div>
      </div>



      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-[0.4cm]"
      >
        {Object.entries(groupedLogs).length > 0 ? (
          Object.entries(groupedLogs).map(([date, dayLogs]: [string, LogEntry[]]) => (
          <div key={date} className="relative">
            {/* Date Header - Glass Pillar */}
            <div className="sticky top-0 z-20 py-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent flex-grow" />
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] px-6 py-2 bg-white/80 backdrop-blur-md rounded-full border border-white/60 shadow-sm">
                  {date}
                </span>
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent flex-grow" />
              </div>
            </div>

            <div className="space-y-6">
              {dayLogs.map((log) => (
                <motion.div
                  key={log.id}
                  id={`log-${log.id}`}
                  variants={itemVariants}
                  whileHover={{ y: -6, scale: 1.012, transition: { duration: 0.2 } }}
                  className={cn(
                    "relative bg-white/70 backdrop-blur-xl rounded-2xl border transition-all duration-500 overflow-hidden shadow-soft group",
                    expandedId === log.id ? "ring-2 ring-emerald-500/20 border-emerald-200" : "border-white/60 hover:border-emerald-200/60"
                  )}
                >
                  {/* Risk Indicator Glow Strip */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1.5",
                    log.severity === 'high' ? "bg-rose-500 shadow-[2px_0_10px_rgba(244,63,94,0.3)]" : "bg-emerald-500 shadow-[2px_0_10px_rgba(16,185,129,0.3)]"
                  )} />

                  <div 
                    className="px-6 py-6 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-grow space-y-2">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {log.category && (
                            <span className={cn(
                              "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest border",
                              ['Geopolitics', 'Cyber Defense', 'Cyber'].includes(log.category) 
                                ? 'bg-rose-50 text-rose-600 border-rose-100' 
                                : ['Climate', 'Natural Disaster'].includes(log.category)
                                  ? 'bg-orange-50 text-orange-600 border-orange-100'
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            )}>
                              {log.category === 'Geopolitics' ? 'ภูมิรัฐศาสตร์' : 
                               log.category === 'Cyber Defense' || log.category === 'Cyber' ? 'ไซเบอร์' :
                               log.category === 'Climate' ? 'ภูมิอากาศ' : log.category}
                            </span>
                          )}
                          <span className="text-[8px] font-medium text-slate-400 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-widest bg-slate-50/50">
                            AI ANALYSIS
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-300" />
                            <span>{(log as any).age || log.time || 'เมื่อครู่'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-300" />
                            <span>{log.locationName || 'Global'}</span>
                          </div>
                          {log.sourceUrl ? (
                            <a 
                              href={log.sourceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-500 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{log.sourceName || 'Source'}</span>
                            </a>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
                              <span>{log.sourceName || 'Source'}</span>
                            </div>
                          )}
                        </div>
                        <h3 className="text-[16px] font-black text-slate-800 leading-snug break-words mt-3">
                          {(log.messageThai || '').split('-')[0].split(':').slice(1).join(':').trim() || log.messageThai || 'ไม่มีหัวข้อ'}
                        </h3>
                        <p className="text-[12px] text-slate-600 leading-relaxed font-medium tracking-tight break-all mt-1 line-clamp-2">
                          {log.details && (log.details.startsWith('{') || log.details.startsWith('[')) 
                            ? '📡 [ENCRYPTED RAW DATA PACKET SECURED]' 
                            : log.details || 'ไม่มีรายละเอียด'}
                         </p>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        {expandedId === log.id ? (
                          <ChevronUp className="w-6 h-6 text-slate-300" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === log.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="border-t border-slate-100 bg-slate-50/20"
                      >
                        <div className="px-6 pb-6 pt-2 space-y-4">
                          <div className="bg-white/80 p-4 rounded-xl border border-emerald-100/50 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1 opacity-5">
                              <ShieldCheck className="w-12 h-12 text-emerald-600" />
                            </div>
                            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <Sparkles className="w-3 h-3" />
                              บทวิเคราะห์อัจฉริยะ (AI Insight):
                            </h4>
                            <p className="text-[12px] text-slate-600 leading-relaxed font-medium break-words tracking-tight relative z-10 whitespace-pre-wrap">
                              {log.details && (log.details.startsWith('{') || log.details.startsWith('[')) 
                                ? 'Raw JSON Payload received. Data is processed in backend and searchable via Settings Tab.' 
                                : log.details}
                            </p>
                          </div>

                          {log.sourceName && (
                            <div className="flex items-center justify-between p-4 bg-white/40 rounded-xl border border-slate-200/60 backdrop-blur-sm">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Verified Source</p>
                                  <p className="text-[12px] font-black text-slate-700 uppercase tracking-tighter">{log.sourceName}</p>
                                </div>
                              </div>
                              {log.sourceUrl && (
                                <a 
                                  href={log.sourceUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-all text-[10px] font-bold shadow-md hover:shadow-emerald-200 hover:-translate-y-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>Open Source</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in duration-1000">
          <div className="relative mb-8">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute inset-[-20px] bg-emerald-400/20 blur-[40px] rounded-full" 
            />
            <div className="relative p-8 bg-white/80 backdrop-blur-2xl rounded-full shadow-2xl border border-emerald-50/50 animate-float">
              <Search className="w-12 h-12 text-emerald-500 opacity-60" />
            </div>
          </div>
          <h3 className="text-[18px] font-black text-slate-800 uppercase tracking-tighter mb-3">ไม่พบข้อมูลที่ตรงกับการค้นหา</h3>
          <p className="text-[12px] text-slate-400 font-medium mb-10 max-w-[280px]">ระบบ AI ไม่สามารถค้นหาข้อมูลที่ตรงตามเงื่อนไขของคุณได้ในขณะนี้</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="group relative px-8 py-3 bg-slate-900 text-white rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-emerald-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative text-[11px] font-black uppercase tracking-[0.2em]">ล้างการค้นหา</span>
          </button>
        </div>
      )}
      </motion.div>
    </div>
  );
};

// Define additional lucide icons needed
import { Sparkles } from 'lucide-react';
