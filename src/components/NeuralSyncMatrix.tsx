import React from 'react';
import { Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  connectionStatus: { source: string; status: string }[];
  onHover?: (domainId: string | null) => void;
  onClose?: () => void;
}

export const NeuralSyncMatrix: React.FC<Props> = ({ connectionStatus, onHover, onClose }) => {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 10 }}
      className="glass-panel p-4 rounded-[2rem] shadow-2xl border-white/60 w-full max-w-[280px] mx-auto overflow-hidden relative"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Neural Sync Matrix</span>
          </div>
          <span className="text-[9px] font-bold text-slate-400">
            {connectionStatus.filter(s => s.status === 'fetched').length}/{connectionStatus.length} OK
          </span>
        </div>

        {/* The Matrix Grid */}
        <div className="grid grid-cols-6 gap-2 p-1 bg-slate-50/50 rounded-2xl border border-slate-100">
          {connectionStatus.map((s, i) => {
            const agencyCode = s.source.split(' ')[0].substring(0, 3).toUpperCase();
            
            // Map Source to Domain
            let domainId = 'unknown';
            if (s.source.includes('USGS') || s.source.includes('NASA')) domainId = 'nature';
            if (s.source.includes('CISA') || s.source.includes('CERT')) domainId = 'cyber';
            if (s.source.includes('DDC')) domainId = 'bio';
            if (s.source.includes('GDACS')) domainId = 'geopolitics';
            if (s.source.includes('Open-Meteo') || s.source.includes('CEMS')) domainId = 'climate';
            if (s.source.includes('Gemini')) domainId = 'ai';
            if (s.source.includes('FRED') || s.source.includes('IMF')) domainId = 'finance';
            if (s.source.includes('OECD')) domainId = 'social';

            return (
              <div 
                key={i} 
                className="group relative flex flex-col items-center py-1"
                onMouseEnter={() => onHover?.(domainId)}
                onMouseLeave={() => onHover?.(null)}
              >
                <div 
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-700 shadow-sm",
                    s.status === 'fetched' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : s.status === 'connecting' ? "bg-amber-400 animate-pulse" : "bg-slate-200"
                  )}
                />
                
                {/* Tooltip on hover */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white text-[7px] px-2.5 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 font-black tracking-[0.1em] border border-white/20 shadow-2xl scale-90 group-hover:scale-100">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-emerald-400 opacity-80">{domainId.toUpperCase()}</span>
                    <span>{s.source}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-1 pt-1 flex justify-center">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Scanning Tactical Egress...</p>
        </div>
      </div>
      
      {/* Visual Alchemist: Professional Data Sweep Animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500 animate-[scan_3s_linear_infinite]" />
      </div>
    </motion.div>
  );
};
