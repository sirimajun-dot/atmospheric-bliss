import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Info, Thermometer, Droplets, Wind, ShieldAlert } from 'lucide-react';
import { RiskData } from '../types';

export const Header: React.FC<{ risks: RiskData[], onLogoClick?: () => void, language?: 'th' | 'en' }> = ({ risks, onLogoClick, language = 'th' }) => {
  const compositeScore = Math.round(risks.reduce((a, b) => a + (b.score || 0), 0) / (risks.length || 1));
  const isNormal = compositeScore < 60;

  return (
    <header className="sticky top-0 z-50 px-5 pt-6 pb-2">
      <div className="glass-panel h-14 flex items-center justify-between px-6 rounded-full shadow-lg border-white/40 ring-1 ring-slate-200/20">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onLogoClick}>
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
             <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[12px] font-black text-slate-800 tracking-tighter leading-tight uppercase">Atmospheric Bliss</h1>
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.3em]">{language === 'th' ? 'ปัญญาบริสุทธิ์ 4.2' : 'Pure Intel 4.2'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden sm:flex flex-col items-end pr-4 border-r border-slate-100">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{language === 'th' ? 'ดัชนีบรรยากาศ' : 'Atmospheric Index'}</span>
              <span className={`text-[9px] font-black uppercase ${isNormal ? 'text-emerald-500' : 'text-amber-500'}`}>
                {language === 'th' 
                 ? (isNormal ? 'ระดับปกติ' : 'ระดับเตือนภัย') 
                 : (isNormal ? 'NOMINAL STATE' : 'WARNING STATE')}
              </span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[9px] font-black text-slate-700 tracking-tighter uppercase whitespace-nowrap">Cloud Link Active</span>
           </div>
        </div>
      </div>
    </header>

  );
};

export const Ticker: React.FC<{ risks: RiskData[], logs?: any[], language?: 'th' | 'en' }> = ({ risks, logs, language = 'th' }) => {
  const [index, setIndex] = React.useState(0);
  const sourceItems = logs && logs.length > 0 ? logs : risks;
  const items = Array.isArray(sourceItems) ? sourceItems.slice(0, 11) : [];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;

  const current = items[index];
  const message = current.messageThai || current.message || (language === 'th' ? current.labelThai : current.labelEn) || current.label;

  return (
    <div className="px-5 mb-4 overflow-hidden">
      <div className="glass-panel h-12 px-5 flex items-center gap-4 rounded-full border-indigo-500/10 shadow-sm relative overflow-hidden">
        <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-widest flex-shrink-0 animate-pulse">
          Alert
        </div>
        <div className="flex-1 flex flex-col justify-center min-h-[32px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-[11px] font-bold text-slate-600 tracking-tight leading-[1.3] line-clamp-2"
            >
              {message}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
