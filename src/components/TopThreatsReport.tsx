import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, AlertTriangle, ShieldAlert, Zap } from 'lucide-react';
import { RiskData } from '../types';

interface Props {
  risks: RiskData[];
}

export const TopThreatsReport: React.FC<Props> = ({ risks }) => {
  // Sort risks by score descending to get top contributors to the index
  const top3 = [...risks]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="flex flex-col h-full font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-slate-800 rounded-full" />
          <h3 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">ปัจจัยขับเคลื่อนดัชนีหลัก (Top Index Drivers)</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100">
          <TrendingUp className="w-2.5 h-2.5 text-slate-400" />
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">การวิเคราะห์ผลกระทบ (Impact Analysis)</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-2">
        {top3.map((risk, index) => {
          const isCritical = risk.score > risk.threshold + 10;
          const isWarning = risk.score > risk.threshold;
          const percentage = Math.round(risk.score);
          
          return (
            <motion.div
              key={risk.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50/80 transition-all duration-300"
            >
              {/* Rank & Icon */}
              <div className="relative flex-shrink-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm border ${
                  index === 0 ? 'bg-rose-50 border-rose-100' : 
                  index === 1 ? 'bg-orange-50 border-orange-100' : 
                  'bg-amber-50 border-amber-100'
                }`}>
                  {risk.emoji}
                </div>
                <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-slate-900 text-white text-[8px] font-black flex items-center justify-center border border-white shadow-sm">
                  {index + 1}
                </div>
              </div>

              {/* Label & Progress */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate">
                    {risk.labelThai || risk.label}
                  </span>
                  <span className={`text-[10px] font-black ${
                    isCritical ? 'text-rose-600' : isWarning ? 'text-orange-600' : 'text-slate-500'
                  }`}>
                    {percentage}%
                  </span>
                </div>
                
                {/* Driver Tag */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className={`w-1 h-1 rounded-full ${
                    isCritical ? 'bg-rose-500' : isWarning ? 'bg-orange-500' : 'bg-slate-300'
                  }`} />
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                    {risk.topDriverThai || risk.topDriver}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      isCritical ? 'bg-rose-500' : isWarning ? 'bg-orange-500' : 'bg-amber-500'
                    }`}
                  />
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 flex flex-col items-end">
                <div className={`px-1.5 py-0.5 rounded-[2px] text-[7px] font-black uppercase tracking-widest ${
                  isCritical ? 'bg-rose-600 text-white' : 
                  isWarning ? 'bg-orange-100 text-orange-600' : 
                  'bg-slate-100 text-slate-500'
                }`}>
                  {isCritical ? 'วิกฤต (Critical)' : isWarning ? 'เตือนภัย (Warning)' : 'เฝ้าระวัง (Elevated)'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between opacity-60">
        <div className="flex items-center gap-1.5">
          <Zap className="w-2.5 h-2.5 text-slate-400" />
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">การระบุแหล่งที่มาแบบเรียลไทม์ (Real-time Attribution)</span>
        </div>
        <span className="text-[8px] font-medium text-slate-400 italic">อัปเดตเมื่อ 1 นาทีที่แล้ว (Updated 1m ago)</span>
      </div>
    </div>
  );
};
