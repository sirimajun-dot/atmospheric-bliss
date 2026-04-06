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

interface EventFocusProps {
  risks?: any[];
  onFocusLog?: (logId: string) => void;
  language?: 'th' | 'en';
}

export const EventFocus: React.FC<EventFocusProps> = ({ risks = [], language = 'th' }) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const getIcon = (id: string) => {
    switch (id) {
      case 'geopolitics': return <Globe className="w-4 h-4 text-rose-500" />;
      case 'climate': return <CloudLightning className="w-4 h-4 text-amber-500" />;
      case 'ai': return <Cpu className="w-4 h-4 text-indigo-500" />;
      case 'cyber': return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      case 'finance': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      default: return <Zap className="w-4 h-4 text-indigo-400" />;
    }
  };

  const threatItems = (Array.isArray(risks) ? risks : []).slice(0, 3).map(risk => ({
    id: risk.id,
    title: risk.label?.[language] || risk.labelThai || risk.label || 'Threat Detected',
    percentage: `${Math.round(Number(risk.score) || 0)}%`,
    urgent: risk.score > (risk.threshold || 50),
    icon: getIcon(risk.id),
    details: (risk.findings || []).map((f: any) => f[language] || f.labelThai || f.label).slice(0, 2),
    source: risk.sourceName || 'Bliss Intelligence'
  }));

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
          {language === 'th' ? 'การเตือนภัยคุกคาม' : 'Threat Hazard Warning'}
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-indigo-500">
            {language === 'th' ? 'กำลังซิงค์กับเรดาร์' : 'Syncing with Radar'}
          </span>
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
        </div>
      </div>
      
      {threatItems.map((item) => (
        <div 
          key={item.id}
          className={`group overflow-hidden transition-all duration-500 rounded-2xl border ${
            expandedId === item.id 
              ? 'bg-white border-indigo-100 shadow-lg translate-x-1' 
              : 'bg-white/40 border-white/40 hover:border-indigo-50 hover:bg-white/60'
          }`}
          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
        >
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center border border-indigo-50">
                {item.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-slate-800 tracking-tight">{item.title}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.source}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className={`text-[12px] font-black ${item.urgent ? 'text-rose-500' : 'text-indigo-600'}`}>{item.percentage}</span>
                {item.urgent && (
                  <span className="text-[6px] font-black bg-rose-500 text-white px-1 py-0.5 rounded-sm animate-pulse">
                    {language === 'th' ? 'วิกฤต' : 'CRITICAL'}
                  </span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${expandedId === item.id ? 'rotate-180' : ''} text-slate-300`} />
            </div>
          </div>

          <AnimatePresence>
            {expandedId === item.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 border-t border-indigo-50/50"
              >
                <div className="pt-3 space-y-3">
                  <div className="space-y-1.5">
                    {item.details.map((p: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-[10px] text-slate-600 leading-relaxed font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 mt-1 shrink-0" />
                        {p}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/search?q=${item.title}`, '_blank'); }}
                      className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 active:scale-95 transition-all"
                    >
                      {language === 'th' ? 'ค้นหาเพิ่มเติม' : 'Deep Dive Explorer'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};
