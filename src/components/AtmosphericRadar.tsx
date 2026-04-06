import React from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { RiskData } from '../types';

interface Props {
  data: RiskData[];
  connectionStatus?: { source: string; status: 'connecting' | 'fetched' | 'idle' }[];
  overallTopThreat?: any;
  theme?: 'default' | 'tactical' | 'minimal' | 'brutalist' | 'organic';
  language?: 'th' | 'en';
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload || typeof cx !== 'number' || typeof cy !== 'number') return null;
  
  const risk = payload as RiskData;
  const isOver = risk.score > risk.threshold;
  const diff = Math.max(0, risk.score - (risk.threshold || 0));
  
  const size = (isOver ? 9.717 + (diff * 0.37) : 9.717) * 0.462;
  const isPriority = (risk.id === 'ai' || risk.id === 'geopolitics') && risk.score > (risk.threshold || 0);
  const isRed = risk.id === 'cyber' ? risk.score > 78 : risk.score > (risk.threshold || 0) + 10;
  
  const color = isOver ? (isRed ? '#ff2d55' : '#ff9500') : '#10b981'; // Emerald for v5

  return (
    <g>
      {isOver && (
        <circle cx={cx} cy={cy} r={size + 8} fill={color} opacity={0.15} className="animate-pulse" />
      )}
      <circle cx={cx} cy={cy} r={size} fill={color} stroke="#fff" strokeWidth={2} className="shadow-lg" />
    </g>
  );
};

export const AtmosphericRadar: React.FC<Props> = ({ data, connectionStatus = [], theme = 'default', language = 'th' }) => {
  const safeData = Array.isArray(data) ? data : [];
  const isEmpty = safeData.length === 0;

  const chartData = safeData.map(r => {
    const labelObj = r.label || {};
    const textLabel = typeof labelObj === 'string' ? labelObj : (labelObj[language] || r.labelThai || 'Subject');
    return { ...r, subject: textLabel, A: r.score || 0 };
  });

  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto flex flex-col items-center justify-center group select-none">
      
      {/* Visual Alchemist: Professional Empty State with Frosted Glass Pulse */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Radar Background Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[70%] h-[70%] rounded-full relative overflow-hidden border border-white/60 shadow-[inset_0_2px_10px_rgba(255,255,255,0.8)] glass-panel bg-white/30 backdrop-blur-md">
            {/* Shimmer Sweep Animation */}
            <div className="absolute inset-0 z-10">
              <div className="absolute inset-0 rounded-full animate-[spin_8s_linear_infinite] overflow-hidden">
                <div 
                  className="absolute top-1/2 left-1/2 w-full h-full origin-top-left"
                  style={{
                    background: `conic-gradient(from 0deg, transparent 0deg, rgba(16, 185, 129, 0.08) 25deg, transparent 50deg)`,
                    transform: 'translate(0, -50%) rotate(-25deg)'
                  }}
                />
              </div>
            </div>

            {/* Static Rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[0.25, 0.5, 0.75, 1].map(r => (
                <div key={r} className="absolute rounded-full border border-slate-200/40" style={{ width: `${r * 100}%`, height: `${r * 100}%` }} />
              ))}
            </div>

            {/* Empty State Pulse Aura */}
            {isEmpty && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                  <div className="w-4 h-4 bg-emerald-500/20 rounded-full animate-ping mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] animate-pulse">
                    {language === 'th' ? "กำลังเชื่อมต่อข่ายงานวิเคราะห์" : "Analyzing Tactical Grid"}
                  </p>
                </div>
            )}
          </div>
        </div>

        {!isEmpty && (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid stroke="#cbd5e1" strokeOpacity={0.3} gridType="circle" radialLines={false} />
              <PolarAngleAxis dataKey="subject" tick={false} />
              <Radar name="A" dataKey="A" stroke="transparent" fill="transparent" dot={<CustomDot />} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
};
