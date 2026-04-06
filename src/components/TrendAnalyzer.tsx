import React, { useState } from 'react';
import { TrendingUp, Clock, Calendar, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryData {
  short: number[];
  long: number[];
}

interface Props {
  history: Record<string, HistoryData>;
  activeDomainId?: string | null;
  onClose?: () => void;
  language?: 'th' | 'en';
}

const DOMAIN_NAMES: Record<string, any> = {
  nature: { th: 'ภัยธรรมชาติ', en: 'Nature' },
  cyber: { th: 'ไซเบอร์', en: 'Cyber' },
  bio: { th: 'ชีวภาพ', en: 'Bio' },
  geopolitics: { th: 'ภูมิรัฐศาสตร์', en: 'Geopolitical' },
  climate: { th: 'ภูมิอากาศ', en: 'Climate' },
  ai: { th: 'เอไอ', en: 'AI' },
  finance: { th: 'การเงิน', en: 'Finance' },
  social: { th: 'สังคม', en: 'Social' }
};

export const TrendAnalyzer: React.FC<Props> = ({ history = {}, activeDomainId, onClose, language = 'th' }) => {
  const [viewMode, setViewMode] = useState<'24h' | '7d'>('24h');
  
  const hasData = Object.keys(history).length > 0;
  
  // Render a simple SVG Line
  const renderLine = (data: number[], color: string, isHighlighted: boolean) => {
    if (!data || data.length < 2) return null;
    
    const width = 400;
    const height = 120;
    const maxVal = 100;
    
    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - (val / maxVal) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={isHighlighted ? 2.5 : 0.5}
        strokeOpacity={isHighlighted ? 1 : 0.15}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-500"
      />
    );
  };

  return (
    <div className="p-5 h-full flex flex-col bg-white/40 backdrop-blur-md rounded-3xl border border-white/40 shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">
            {language === 'th' ? 'วิเคราะห์แนวโน้ม' : 'Trend Analyzer'}
          </h3>
          {activeDomainId && (
             <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
               {DOMAIN_NAMES[activeDomainId]?.[language] || activeDomainId}
             </span>
          )}
        </div>
        
        <div className="flex bg-slate-100 p-0.5 rounded-full">
           <button 
             onClick={() => setViewMode('24h')}
             className={`px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all ${viewMode === '24h' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
           >
             24H
           </button>
           <button 
             onClick={() => setViewMode('7d')}
             className={`px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all ${viewMode === '7d' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
           >
             7D
           </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 relative min-h-[140px] flex items-center justify-center">
        {hasData ? (
          <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible drop-shadow-sm">
            {/* Background Grid Lines */}
            {[0, 25, 50, 75, 100].map(v => (
              <line 
                key={v} 
                x1="0" y1={120 - (v/100)*120} 
                x2="400" y2={120 - (v/100)*120} 
                stroke="#e2e8f0" 
                strokeWidth="0.5" 
                strokeDasharray="4 4" 
              />
            ))}
            
            {/* Render all domains jumbled in background */}
            {Object.entries(history).map(([id, data]) => (
               <React.Fragment key={id}>
                 {id !== activeDomainId && renderLine(viewMode === '24h' ? (data as HistoryData).short : (data as HistoryData).long, '#94a3b8', false)}
               </React.Fragment>
            ))}
            
            {/* Render active domain with highlight */}
            {activeDomainId && history[activeDomainId] && (
              renderLine(viewMode === '24h' ? history[activeDomainId].short : history[activeDomainId].long, '#4f46e5', true)
            )}
            
            {/* If no active domain, highlight top one? Or just keep them all subtle */}
          </svg>
        ) : (
          <div className="text-center opacity-20">
            <Clock className="w-8 h-8 mx-auto mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">Collecting Historical Data...</span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-400">
           <Info className="w-3 h-3" />
           <span className="text-[8px] font-bold uppercase tracking-tight">
             {viewMode === '24h' ? 'High-Res: 15m intervals' : 'Tactical Pulse: 4h snapshots'}
           </span>
        </div>
        <div className="text-[8px] font-black text-indigo-400 bg-indigo-50/50 px-2 py-1 rounded">
           NO DB // LOCAL RAM CACHE
        </div>
      </div>
    </div>
  );
};
