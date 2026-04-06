import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Shield, Zap, TrendingUp, Info, ChevronRight, X, MapPin, Calendar, Clock } from 'lucide-react';
import { LogEntry, DailySummary } from '../types';
import { cn } from '../lib/utils';

interface Props {
  logs: LogEntry[];
  summary: DailySummary | null;
}

export const ExecutiveGlobalReport: React.FC<Props> = ({ logs, summary }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<LogEntry | null>(null);
  const [rotation, setRotation] = useState<[number, number]>([0, -20]);
  const [isDragging, setIsDragging] = useState(false);

  // Filter logs with coordinates
  const mapPoints = logs.filter(l => l.lat !== undefined && l.lon !== undefined);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 600;
    const height = 600;
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`);

    svg.selectAll('*').remove();

    const projection = d3.geoOrthographic()
      .scale(260)
      .translate([width / 2, height / 2])
      .rotate([rotation[0], rotation[1]]);

    const path = d3.geoPath().projection(projection);

    // Background circle (Ocean)
    svg.append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', projection.scale())
      .attr('fill', '#f1f5f9')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 0.5);

    // Graticule (Grid lines)
    const graticule = d3.geoGraticule();
    svg.append('path')
      .datum(graticule())
      .attr('class', 'graticule')
      .attr('d', path as any)
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.2);

    // Load world data
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((data: any) => {
      const countries = feature(data, data.objects.countries) as any;

      // Draw countries
      svg.append('g')
        .selectAll('path')
        .data(countries.features)
        .enter()
        .append('path')
        .attr('d', path as any)
        .attr('fill', '#ffffff')
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 0.5);

      // Draw points
      const pointsGroup = svg.append('g');
      
      mapPoints.forEach(point => {
        const gpoint = [point.lon!, point.lat!];
        const isVisible = d3.geoDistance(gpoint as any, [-rotation[0], -rotation[1]] as any) < Math.PI / 2;

        if (isVisible) {
          const coords = projection([point.lon!, point.lat!]);
          if (!coords) return;

          const g = pointsGroup.append('g')
            .attr('class', 'point-group')
            .style('cursor', 'pointer')
            .on('click', () => setSelectedEvent(point));

          // Outer pulse
          g.append('circle')
            .attr('cx', coords[0])
            .attr('cy', coords[1])
            .attr('r', 8)
            .attr('fill', '#10b981')
            .attr('opacity', 0.3)
            .append('animate')
            .attr('attributeName', 'r')
            .attr('values', '4;12;4')
            .attr('dur', '2s')
            .attr('repeatCount', 'indefinite');

          // Inner dot
          g.append('circle')
            .attr('cx', coords[0])
            .attr('cy', coords[1])
            .attr('r', 4)
            .attr('fill', '#059669')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5);
        }
      });
    });

    // Drag behavior
    const drag = d3.drag<SVGSVGElement, unknown>()
      .on('start', () => setIsDragging(true))
      .on('drag', (event) => {
        const rotate = projection.rotate();
        const k = 75 / projection.scale();
        setRotation([
          rotate[0] + event.dx * k,
          rotate[1] - event.dy * k
        ]);
      })
      .on('end', () => setIsDragging(false));

    svg.call(drag as any);

  }, [rotation, mapPoints]);

  if (!summary) return (
    <div className="bg-white rounded-xl p-12 text-center border border-slate-100 shadow-sm">
      <Globe className="w-8 h-8 text-slate-200 mx-auto mb-4 animate-pulse" />
      <p className="text-slate-400 text-sm font-medium">กำลังสังเคราะห์รายงานเชิงกลยุทธ์...</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden mb-8">
      {/* Editorial Header */}
      <div className="p-6 sm:p-10 border-b border-slate-50 bg-gradient-to-b from-slate-50/50 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">สรุปข้อมูลข่าวกรอง (Intelligence Briefing)</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-full shadow-sm self-start sm:self-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.1em]">การสังเคราะห์ข้อมูลสด (Live Synthesis)</span>
          </div>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif italic text-slate-900 mb-6 leading-[1.1] tracking-tight">
          การสังเคราะห์ภัยคุกคามรายวัน (Daily Threat Synthesis)
        </h1>
        <div className="h-px w-16 sm:w-24 bg-slate-900 mb-6" />
        <p className="text-slate-600 font-medium text-base sm:text-lg max-w-2xl leading-relaxed">
          {summary.overviewThai || summary.overview}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Strategic Overview (Map) */}
        <div className="lg:col-span-7 p-10 border-r border-slate-50 relative bg-white">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col gap-1">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">ภาพรวมเชิงกลยุทธ์ (Strategic Overview)</h3>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ข้อมูลย้อนหลัง 5 วัน (5-Day Historical Window)</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ภัยคุกคามที่กำลังเกิดขึ้น (Active Threats)</span>
              </div>
            </div>
          </div>
          
          <div className="relative aspect-square w-full max-w-[480px] mx-auto cursor-grab active:cursor-grabbing">
            <svg ref={svgRef} className="w-full h-full" />
            
            {/* Radar Overlay Effect */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[88%] h-[88%] rounded-full border border-emerald-500/5 relative overflow-hidden">
                <div className="absolute inset-0 animate-[spin_10s_linear_infinite]">
                  <div 
                    className="absolute top-1/2 left-1/2 w-full h-full origin-top-left"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0deg, rgba(16, 185, 129, 0.03) 40deg, transparent 80deg)',
                      transform: 'translate(0, -50%) rotate(-40deg)'
                    }}
                  />
                </div>
                {/* Radar Rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full rounded-full border border-slate-200/20" />
                  <div className="absolute w-[66%] h-[66%] rounded-full border border-slate-200/20" />
                  <div className="absolute w-[33%] h-[33%] rounded-full border border-slate-200/20" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {mapPoints.slice(0, 4).map((p, i) => (
              <button 
                key={i} 
                onClick={() => setSelectedEvent(p)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors group"
              >
                <MapPin className="w-3 h-3 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{p.locationName || 'Global'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Key Takeaways & Wisdom */}
        <div className="lg:col-span-5 flex flex-col bg-slate-50/30">
          {/* Key Takeaways */}
          <div className="p-10 border-b border-slate-50 flex-1">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              ประเด็นสำคัญ (Key Takeaways)
            </h3>
            <div className="space-y-10">
              {(summary.keyTakeawaysThai || summary.keyTakeaways).map((item, i) => (
                <div key={i} className="group cursor-default relative">
                  <div className="flex gap-6">
                    <span className="text-slate-200 font-serif italic text-4xl leading-none transition-colors group-hover:text-emerald-200">0{i + 1}</span>
                    <div className="flex flex-col gap-2">
                      <p className="text-slate-700 text-sm font-semibold leading-relaxed group-hover:text-slate-900 transition-colors">
                        {item}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Wisdom Section */}
          <div className="p-10 bg-slate-900 text-white relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            </div>

            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-8 flex items-center gap-2 relative z-10">
              <Zap className="w-3 h-3" />
              ภูมิปัญญาเชิงกลยุทธ์ (Strategic Wisdom)
            </h3>
            <div className="space-y-6 relative z-10">
              {(summary.wisdomsThai || summary.wisdoms).slice(0, 2).map((item, i) => (
                <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all hover:translate-x-1">
                  <div className="flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[11px] font-black text-emerald-400">{i + 1}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200 leading-relaxed">
                      {item}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deep Dive Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">การวิเคราะห์เจาะลึก (Deep Dive Analysis)</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedEvent.locationName || 'Global Event'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              
              <div className="p-8 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center gap-6 mb-8">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">{new Date(selectedEvent.timestamp).toLocaleDateString('th-TH')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">{selectedEvent.time}</span>
                  </div>
                </div>

                <h2 className="text-2xl font-serif italic text-slate-900 mb-4 leading-tight">
                  {selectedEvent.messageThai || selectedEvent.message}
                </h2>
                
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 leading-relaxed mb-6">
                    {selectedEvent.details}
                  </p>
                  
                  {selectedEvent.deepDive && (
                    <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 mb-6">
                      <h5 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Info className="w-3 h-3" />
                        ข้อมูลเชิงลึกข่าวกรอง (Intelligence Insight)
                      </h5>
                      <p className="text-emerald-900/80 text-sm leading-relaxed italic">
                        {selectedEvent.deepDive}
                      </p>
                    </div>
                  )}
                </div>

                  {selectedEvent.sourceUrl && (
                  <a 
                    href={selectedEvent.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors"
                  >
                    ดูแหล่งข้อมูลหลัก (View Primary Source)
                    <ChevronRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
