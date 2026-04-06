import React from 'react';
import { CloudRain, Wind } from 'lucide-react';
import { cn } from '../lib/utils';

interface IndicatorProps {
  value: number;
  label: string;
  icon: React.ReactNode;
  suffix?: string;
  reverse?: boolean;
}

const Indicator: React.FC<IndicatorProps> = ({ value, label, icon, suffix = "", reverse = false }) => {
  const getStatusColor = (val: number) => {
    if (val < 37.5) return 'text-emerald-500';
    if (val <= 75) return 'text-orange-500';
    return 'text-rose-500';
  };

  const color = (value === undefined || value === null || isNaN(value)) ? 'text-slate-300' : getStatusColor(value);
  const displayValue = (value === undefined || value === null || isNaN(value)) ? '--' : value;

  return (
    <div className={cn("flex items-center gap-[11px] group", reverse ? "flex-row-reverse text-right" : "flex-row text-left")}>
      <div className="w-[40px] h-[40px] rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-slate-100 flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
        <div className={color}>{icon}</div>
      </div>
      <div className={cn("flex flex-col", reverse ? "items-end" : "items-start")}>
        <span className={`text-[10.5px] font-black leading-none ${color}`}>{displayValue}{suffix}</span>
        <span className="text-[9.2px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{label}</span>
      </div>
    </div>
  );
};

export const PM25Indicator: React.FC<{ value: number; reverse?: boolean }> = ({ value, reverse }) => (
  <Indicator value={value} label="ดัชนี PM2.5" icon={<Wind className="w-[19px] h-[19px]" />} reverse={reverse} suffix=" µg/m³" />
);

export const RainIndicator: React.FC<{ value: number; reverse?: boolean }> = ({ value, reverse }) => (
  <Indicator value={value} label="ฝน (8 ชม.)" icon={<CloudRain className="w-[19px] h-[19px]" />} suffix="%" reverse={reverse} />
);

interface Props {
  pm25: number;
  rainProb: number;
}

export const AtmosphericConditions: React.FC<Props> = ({ pm25, rainProb }) => {
  return (
    <div className="flex flex-col gap-[12px] items-start">
      <PM25Indicator value={pm25} />
      <RainIndicator value={rainProb} />
    </div>
  );
};
