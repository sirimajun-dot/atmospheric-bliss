import React from 'react';
import { 
  Wind, CloudRain, MapPin, X, Sun, Eye, Gauge, Cloud, 
  Flower, Activity, Flame, Waves, Car, Users, TreeDeciduous, 
  Zap, Moon, Tornado, Navigation2, RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  weather: {
    temp: number;
    pm25: number;
    condition: string;
    location: string;
    uvIndex: number;
    windDirection: number;
    visibility: number;
    pressure: number;
    cloudCover: number;
    gustSpeed: number;
    pollen: string;
    earthquakes: number;
    hotspots: number;
    floodRisk: string;
    trafficDensity: string;
    populationDensity: number;
    greenSpaceIndex: number;
    solarPotential: number;
    lightPollution: string;
  } | null | undefined;
  onRemove?: () => void;
  onRefresh?: () => void;
}

const WindRose: React.FC<{ direction: number }> = ({ direction }) => {
  return (
    <div className="relative w-12 h-12 flex items-center justify-center bg-white/50 rounded-full border border-indigo-100/50 shadow-sm">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[6px] font-black text-slate-300 absolute top-1">N</span>
        <span className="text-[6px] font-black text-slate-300 absolute bottom-1">S</span>
      </div>
      <Navigation2 
        className="w-5 h-5 text-indigo-500 fill-indigo-500 transition-transform duration-1000" 
        style={{ transform: `rotate(${direction || 0}deg)` }}
      />
    </div>
  );
};

export const WeatherWidget: React.FC<Props> = ({ weather, onRemove, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try { await onRefresh(); } finally { setTimeout(() => setIsRefreshing(false), 800); }
  };

  // Loading Guard (Performance + Simple Architect)
  if (!weather) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full animate-pulse text-slate-400">
        <CloudRain className="w-8 h-8 mb-4 opacity-20" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Hydrating Environment Data...</span>
      </div>
    );
  }

  const getImpactColor = (label: string, value: any) => {
    const val = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(val) && typeof value !== 'string') return 'text-slate-400';
    switch (label) {
      case 'UV': return val <= 2 ? 'text-emerald-500' : val <= 7 ? 'text-amber-500' : 'text-rose-500';
      case 'Wind': return val < 30 ? 'text-emerald-500' : 'text-rose-500';
      case 'PM2.5': return val < 15 ? 'text-emerald-500' : val < 37 ? 'text-amber-500' : 'text-rose-500';
      default: return 'text-slate-500';
    }
  };

  const gridItems = [
    { icon: <Sun className="w-3.5 h-3.5" />, label: 'UV', value: (Number(weather?.uvIndex) || 0).toFixed(1) },
    { icon: <Wind className="w-3.5 h-3.5" />, label: 'Wind', value: `${weather?.gustSpeed || 0} km/h` },
    { icon: <Eye className="w-3.5 h-3.5" />, label: 'Visibility', value: `${(Number(weather?.visibility) || 0).toFixed(1)} km` },
    { icon: <Gauge className="w-3.5 h-3.5" />, label: 'Pressure', value: `${Math.round(Number(weather?.pressure) || 1013)}` },
    { icon: <Activity className="w-3.5 h-3.5" />, label: 'Quake', value: weather?.earthquakes || 0 },
    { icon: <Flame className="w-3.5 h-3.5" />, label: 'Hotspots', value: weather?.hotspots || 0 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 flex flex-col h-full bg-white/40 backdrop-blur-md rounded-3xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-widest">{weather?.location || 'Detecting...'}</span>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button onClick={handleRefresh} className="p-1.5 hover:bg-indigo-50 rounded-full transition-all text-slate-400 hover:text-indigo-600">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
          {onRemove && (
            <button onClick={onRemove} className="p-1.5 hover:bg-rose-50 rounded-full transition-all text-slate-400 hover:text-rose-500">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 mb-8">
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="35" fill="none" stroke="#f1f5f9" strokeWidth="6" />
            <motion.circle 
              initial={{ strokeDashoffset: 220 }}
              animate={{ strokeDashoffset: 220 - (220 * ((weather?.pm25 || 0) / 100)) }}
              cx="40" cy="40" r="35" fill="none" 
              stroke={(weather?.pm25 || 0) < 37 ? '#6366f1' : '#ff2d55'} 
              strokeWidth="6" 
              strokeDasharray={220} 
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-slate-800 leading-none">{weather?.pm25 || 0}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase">PM2.5</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="text-4xl font-black text-slate-800 tracking-tighter leading-none mb-1">{weather?.temp || 0}°</div>
          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em]">{weather?.condition || 'Analyzing'}</div>
        </div>

        <div className="shrink-0 flex flex-col items-center gap-2">
          <WindRose direction={weather?.windDirection || 0} />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Compass</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {gridItems.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-white/60 rounded-2xl border border-indigo-50/50 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="text-indigo-400">{item.icon}</div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{item.label}</span>
            </div>
            <span className="text-[11px] font-black text-slate-700">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-indigo-50/50 flex justify-between">
        <div className="flex items-center gap-2 opacity-50">
          <Wind className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] font-black text-slate-500 uppercase">Airflow Link Est.</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Active Sink</span>
        </div>
      </div>
    </motion.div>
  );
};
