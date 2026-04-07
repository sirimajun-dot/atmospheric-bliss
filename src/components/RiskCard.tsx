import React, { useState } from 'react';
import { Terminal, Filter, X, Sparkles, Loader2, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  logs: any[];
  onRemove?: () => void;
  language?: 'th' | 'en';
}

export const RiskDetailCard: React.FC<Props> = ({ logs = [], onRemove, language = 'th' }) => {
  const [filter30m, setFilter30m] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deepDives, setDeepDives] = useState<Record<string, any>>({});
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [deepDiveErrors, setDeepDiveErrors] = useState<Record<string, string>>({});

  const safeLogs = Array.isArray(logs) ? logs : [];
  const filteredLogs = filter30m 
    ? safeLogs.filter(log => log.timestamp > Date.now() - 30 * 60 * 1000)
    : safeLogs;

  const handleDeepDive = async (log: any) => {
    if (deepDives[log.id] || loadingIds[log.id]) return;

    setLoadingIds(prev => ({ ...prev, [log.id]: true }));
    setDeepDiveErrors((prev) => {
      const next = { ...prev };
      delete next[log.id];
      return next;
    });
    try {
      const response = await fetch('/api/ai/deep-dive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ logEntry: log })
      });
      if (response.ok) {
        const result = await response.json();
        setDeepDives(prev => ({ ...prev, [log.id]: result }));
        return;
      }
      let message =
        language === 'th'
          ? 'ไม่สามารถโหลดคำแนะนำเจาะลึกได้'
          : 'Could not load deep briefing';
      try {
        const j = (await response.json()) as { error?: string };
        if (response.status === 429) {
          message =
            language === 'th'
              ? 'เรียกบริการถี่เกินไป กรุณารอสักครู่แล้วลองใหม่'
              : 'Too many requests. Please wait and try again.';
        } else if (response.status === 503) {
          message =
            language === 'th'
              ? 'บริการ AI ไม่พร้อมชั่วคราว ลองใหม่ภายหลัง'
              : 'AI is temporarily busy. Try again shortly.';
        } else if (response.status === 502) {
          message =
            language === 'th'
              ? 'คำตอบจาก AI ไม่สมบูรณ์ ลองใหม่อีกครั้ง'
              : 'The AI returned an incomplete response. Please try again.';
        } else if (j?.error && typeof j.error === 'string') {
          message = j.error;
        }
      } catch {
        /* use default message */
      }
      setDeepDiveErrors((prev) => ({ ...prev, [log.id]: message }));
    } catch (err) {
      console.error("[Deep Dive Error]", err);
      setDeepDiveErrors((prev) => ({
        ...prev,
        [log.id]:
          language === 'th'
            ? 'เครือข่ายขัดข้อง ลองใหม่ภายหลัง'
            : 'Network error. Try again later.',
      }));
    } finally {
      setLoadingIds(prev => ({ ...prev, [log.id]: false }));
    }
  };

  return (
    <div className="p-5 h-full flex flex-col bg-white/40 backdrop-blur-md rounded-3xl border border-white/40 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">
            {language === 'th' ? 'สตรีมข่าวกรอง' : 'Intelligence Stream'}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setFilter30m(!filter30m)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-[8px] font-black uppercase tracking-tight",
              filter30m 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                : 'bg-white border-indigo-50 text-indigo-400 hover:bg-slate-50'
            )}
          >
            <Filter className="w-2.5 h-2.5" />
            30M
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
          </div>
          {onRemove && (
            <button onClick={onRemove} className="p-1.5 hover:bg-rose-50 rounded-full text-slate-300 hover:text-rose-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-hide space-y-4 max-h-[500px]">
        <AnimatePresence mode="popLayout">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <motion.div 
                key={log.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className={cn(
                  "group p-4 rounded-2xl transition-all cursor-pointer border relative overflow-hidden",
                  expandedId === log.id 
                    ? 'bg-white border-indigo-100 shadow-xl scale-[1.02] z-10' 
                    : 'bg-white/50 border-white/50 hover:bg-white hover:border-indigo-50'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">[{log.time}]</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">#{log.id.slice(-4)}</span>
                  </div>
                </div>
                <p className="text-[11px] font-bold text-slate-700 leading-tight">
                  {log.message}
                </p>
                
                {expandedId === log.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-indigo-50 space-y-4"
                  >
                    {deepDiveErrors[log.id] && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-900">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                        <p className="text-[10px] font-bold leading-relaxed">{deepDiveErrors[log.id]}</p>
                      </div>
                    )}

                    {!deepDives[log.id] && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeepDive(log); }}
                        disabled={loadingIds[log.id]}
                        className="w-full h-11 bg-slate-900 rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg hover:bg-indigo-900 group/btn"
                      >
                        {loadingIds[log.id] ? (
                          <>
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">
                              {language === 'th' ? 'กำลังสังเคราะห์ข้อมูล...' : 'Synthesizing...'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-indigo-400 group-hover/btn:text-white transition-colors" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">
                               {language === 'th' ? 'ขอคำแนะนำเจาะลึก' : 'Request Deep Briefing'}
                            </span>
                          </>
                        )}
                      </button>
                    )}

                    <AnimatePresence>
                      {deepDives[log.id] && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100">
                             <div className="flex items-center gap-2 mb-3">
                               <CheckCircle2 className="w-4 h-4 text-indigo-200" />
                               <h4 className="text-[11px] font-black uppercase tracking-widest leading-none">
                                 {deepDives[log.id][language]?.title || 'Briefing Ready'}
                               </h4>
                             </div>
                             <p className="text-[12px] font-medium leading-relaxed opacity-90">
                               {deepDives[log.id][language]?.content || deepDives[log.id][language]?.briefing}
                             </p>
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                             {(deepDives[log.id][language]?.actions || []).map((action: string, idx: number) => (
                               <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl group/action hover:bg-indigo-50 transition-colors">
                                  <ChevronRight className="w-3 h-3 text-indigo-500 mt-0.5 group-hover/action:translate-x-1 transition-transform" />
                                  <span className="text-[10px] font-bold text-slate-600 group-hover/action:text-indigo-900 transition-colors">{action}</span>
                               </div>
                             ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center opacity-30">
              <span className="text-[10px] font-black uppercase tracking-widest italic">Signal Isolated: No active logs found</span>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
