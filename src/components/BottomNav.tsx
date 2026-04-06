import React from 'react';
import { Home, Newspaper, Sparkles, Settings, Plus, TrendingUp, CloudRain, Activity, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RiskData } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BottomNav: React.FC<{ 
  risks: RiskData[], 
  onToggleLogs: () => void,
  onToggleWeather: () => void,
  onToggleMatrix: () => void,
  isLogsVisible: boolean,
  isWeatherVisible: boolean,
  isMatrixVisible: boolean,
  activeTab: 'dashboard' | 'news' | 'insight' | 'settings' | 'tos',
  setActiveTab: (tab: 'dashboard' | 'news' | 'insight' | 'settings' | 'tos') => void,
  connectionStatus?: { source: string; status: string }[],
  language?: 'th' | 'en'
}> = ({ risks, onToggleLogs, onToggleWeather, onToggleMatrix, isLogsVisible, isWeatherVisible, isMatrixVisible, activeTab, setActiveTab, connectionStatus = [], language = 'th' }) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const hasPriority = Array.isArray(risks) && risks.some(r => (r.id === 'ai' || r.id === 'geopolitics') && r.score > (r.threshold || 0));

  const NavItem = ({ id, icon: Icon, label, labelEn, onClick }: { id: string, icon: any, label: string, labelEn: string, onClick?: () => void }) => (
    <button 
      onClick={onClick || (() => {})}
      className={cn(
        "flex flex-col items-center gap-1 transition-all relative",
        (activeTab === id || (id === 'home' && activeTab === 'dashboard') || (id === 'settings' && activeTab === 'tos')) ? "text-indigo-600 scale-110" : "text-slate-400 opacity-60 hover:opacity-100"
      )}
    >
      <Icon className={cn("w-[18px] h-[18px]", (activeTab === id || (id === 'home' && activeTab === 'dashboard') || (id === 'settings' && activeTab === 'tos')) && "drop-shadow-[0_0_8px_rgba(79,70,229,0.3)]")} />
      <span className="text-[8.5px] font-black uppercase tracking-tight">{language === 'th' ? label : labelEn}</span>
      {(id === 'insight' || id === 'news') && hasPriority && (
        <span className="absolute -top-1 -right-0.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-ping" />
      )}
      {(id === 'insight' || id === 'news') && hasPriority && (
        <span className="absolute -top-1 -right-0.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
      )}
    </button>
  );

  return (
    <nav className="fixed bottom-4 left-5 right-5 glass-panel h-[66px] px-8 py-2 rounded-3xl flex items-center justify-between z-50 transition-all duration-500">
      <NavItem id="home" icon={Home} label="หน้าหลัก" labelEn="Home" onClick={() => setActiveTab('dashboard')} />
      <NavItem id="news" icon={Newspaper} label="เหตุการณ์" labelEn="News" onClick={() => setActiveTab('news')} />
      
      <div className="relative -top-6">
        {/* Modular Status Switch Hub */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 20 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 glass-panel p-[18px] rounded-[2.5rem] shadow-2xl border-white/60 min-w-[240px] z-50 overflow-hidden"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Matrix Hub Control</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => { onToggleMatrix(); }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all relative overflow-hidden",
                      isMatrixVisible ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-inner" : "bg-slate-50/50 border-slate-100 text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    <Activity className="w-5 h-5" />
                    <span className="text-[8px] font-bold uppercase tracking-wider">Matrix</span>
                    {isMatrixVisible && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                  </button>
                  <button 
                    onClick={() => { onToggleLogs(); }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all relative overflow-hidden",
                      isLogsVisible ? "bg-amber-50 border-amber-100 text-amber-600 shadow-inner" : "bg-slate-50/50 border-slate-100 text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-[8px] font-bold uppercase tracking-wider">Trend</span>
                    {isLogsVisible && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" />}
                  </button>
                  <button 
                    onClick={() => { onToggleWeather(); }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all relative overflow-hidden",
                      isWeatherVisible ? "bg-indigo-50 border-indigo-100 text-indigo-600 shadow-inner" : "bg-slate-50/50 border-slate-100 text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    <CloudRain className="w-5 h-5" />
                    <span className="text-[8px] font-bold uppercase tracking-wider">Envir</span>
                    {isWeatherVisible && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                  </button>
                </div>
                
                <div className="pt-2 px-1 flex justify-center">
                   <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest text-center leading-relaxed">Tactical System Overlays: {
                      [isMatrixVisible, isLogsVisible, isWeatherVisible].filter(Boolean).length
                   }/3 ACTIVE</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setShowMenu(!showMenu)}
          className={cn(
            "w-12 h-12 rounded-3xl flex items-center justify-center text-white shadow-2xl active:scale-90 transition-all border-4 border-white/40",
            showMenu ? "bg-slate-800 rotate-45" : "bg-indigo-600 shadow-xl shadow-indigo-200"
          )}
        >
          <Plus className={cn("w-6 h-6 transition-transform", showMenu ? "rotate-0" : "rotate-0")} />
        </button>
      </div>

      <NavItem id="insight" icon={Sparkles} label="ปัญญา" labelEn="Insight" onClick={() => setActiveTab('insight')} />

      <NavItem id="settings" icon={Settings} label="ตั้งค่า" labelEn="Settings" onClick={() => setActiveTab('settings')} />
    </nav>

  );
};
