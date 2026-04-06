import React from 'react';
import { motion } from 'motion/react';
import { Crosshair, MapPin } from 'lucide-react';

interface LiveTrackingWidgetProps {
  location?: string;
  className?: string;
  onClick?: () => void;
  isUpdating?: boolean;
  isFallback?: boolean;
  geoError?: string | null;
}

export const LiveTrackingWidget: React.FC<LiveTrackingWidgetProps> = ({ 
  location = "BANGKOK, TH",
  className = "",
  onClick,
  isUpdating = false,
  isFallback = false,
  geoError = null
}) => {
  const badgeText = isUpdating 
    ? 'UPDATING GPS...' 
    : (isFallback ? 'ESTIMATED / FALLBACK' : 'LIVE GPS ACTIVE');
  
  const statusColor = isUpdating 
    ? 'bg-amber-500' 
    : (isFallback ? 'bg-orange-500' : 'bg-emerald-500');

  const dotColor = isUpdating 
    ? 'bg-amber-400' 
    : (isFallback ? 'bg-orange-400' : 'bg-emerald-400');
  return (
    <button 
      onClick={onClick}
      disabled={isUpdating}
      className={`flex flex-col items-center group/tracking outline-none transition-transform active:scale-95 disabled:opacity-70 disabled:active:scale-100 ${className}`}
    >
      <div className="relative w-[110px] h-[12.1px] bg-slate-900 rounded-[3px] overflow-hidden border border-slate-800 shadow-lg group-hover/tracking:border-emerald-500/50 transition-colors">
        {/* Stylized Map Background */}
        <div className="absolute inset-0 opacity-40 bg-[url('https://picsum.photos/seed/map/200/200')] bg-cover bg-center grayscale contrast-125" />
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
 
        {/* Live Badge */}
        <div className="absolute top-[1px] left-[2px] bg-slate-100/90 backdrop-blur-sm px-[2px] py-0 rounded-[1px] flex items-center gap-[0.5px] border border-slate-200/50">
          <span className={`w-[1px] h-[1px] rounded-full ${statusColor} animate-pulse`} />
          <span className="text-[3.5px] font-black text-slate-700 uppercase tracking-tighter leading-none flex items-center gap-[1px]">
            {badgeText} {geoError && <span className="text-red-600 font-bold">[{geoError}]</span>}
          </span>
        </div>
 
        {/* Center Target */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <motion.div 
              animate={{ 
                scale: isUpdating ? [1, 2, 1] : [1, 1.5, 1], 
                opacity: isUpdating ? [0.8, 0.4, 0.8] : [0.5, 0.2, 0.5] 
              }}
              transition={{ duration: isUpdating ? 1 : 2, repeat: Infinity }}
              className={`absolute inset-0 rounded-full -m-[1px] ${statusColor}`}
            />
            <div className={`w-[1px] h-[1px] rounded-full shadow-[0_0_2px_rgba(52,211,153,0.8)] ${dotColor}`} />
          </div>
        </div>
 
        {/* Target Icon Button */}
        <div className="absolute bottom-[1px] right-[2px] w-[6px] h-[6px] bg-[#002b2b] rounded-[1px] flex items-center justify-center border border-emerald-500/30 shadow-sm group-hover/tracking:bg-emerald-900 transition-colors">
          <Crosshair className={`w-[4px] h-[4px] text-white ${isUpdating ? 'animate-spin' : ''}`} />
        </div>
 
        {/* Scan Line Animation */}
        <motion.div 
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: isUpdating ? 1 : 4, repeat: Infinity, ease: "linear" }}
          className={`absolute left-0 right-0 h-[1px] z-10 ${statusColor} opacity-20`}
        />
      </div>
      
      {/* Location Text Below */}
      <div className="mt-1 flex items-center gap-1">
        <MapPin className={`w-[9.04px] h-[9.04px] ${isUpdating ? 'text-amber-500 animate-bounce' : (isFallback ? 'text-orange-400' : 'text-emerald-500')}`} />
        <span className={`text-[9.04px] font-black uppercase tracking-widest transition-colors ${isFallback ? 'text-orange-500/80' : 'text-slate-500 group-hover/tracking:text-emerald-500'}`}>
          {isUpdating ? 'REACQUIRING...' : (
            <span className="flex items-center gap-1">
              {location}
              {isFallback && geoError && <span className="text-[7px] text-red-500 font-bold opacity-70">({geoError})</span>}
            </span>
          )}
        </span>
      </div>
    </button>
  );
};
