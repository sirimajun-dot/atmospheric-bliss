import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, CheckCircle2, ChevronRight, Share2, Terminal, ExternalLink } from 'lucide-react';

interface Scenario {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  impact: string;
  remediation: string[];
  links: { label: string; url: string }[];
}

const CURRENT_SCENARIOS: Scenario[] = [
  {
    id: 'cve-2026-3502',
    title: 'TrueConf Client Zero-Day (CVE-2026-3502)',
    severity: 'critical',
    impact: 'ผู้บุกรุกสามารถฝังมัลแวร์ผ่านระบบอัปเดตซอฟต์แวร์ปลอม (Malicious Update Hijacking) ส่งผลให้สามารถควบคุมเครื่องคอมพิวเตอร์ได้ทั้งหมด',
    remediation: [
      'อัปเดต TrueConf Client เป็นเวอร์ชัน 8.4.1 หรือสูงกว่าทันที',
      'ตรวจสอบและยกเลิกกระบวนการอัปเดตที่ดูผิดปกติหรือไม่ผ่านเซิร์ฟเวอร์หลัก',
      'บล็อกพอร์ตการสื่อสารที่ไม่จำเป็นของแอปพลิเคชันจนกว่าจะทำการแพตช์เสร็จสิ้น'
    ],
    links: [
      { label: 'BleepingComputer Report', url: 'https://www.bleepingcomputer.com/news/security/hackers-exploit-trueconf-zero-day/' }
    ]
  },
  {
    id: 'cve-2026-5281',
    title: 'Google Dawn / WebGPU Vulnerability (CVE-2026-5281)',
    severity: 'high',
    impact: 'การเข้าชมเว็บไซต์ที่มีรหัสอันตรายอาจทำให้เกิด Heap Buffer Overflow ในระบบ WebGPU นำไปสู่การรันโค้ดระยะไกล (Remote Code Execution)',
    remediation: [
      'อัปเดต Google Chrome, Microsoft Edge เป็นเวอร์ชันล่าสุด (Patch 134.0+) ทันที',
      'สำหรับระบบองค์กร ให้ปิดการใช้งาน WebGPU ชั่วคราวผ่าน Group Policy จนกว่าพนักงานจะอัปเดตครบถ้วน',
      'เฝ้าระวังการใช้งาน GPU Memory ที่ผิดปกติบนเบราว์เซอร์'
    ],
    links: [
      { label: 'Chromium Security Updates', url: 'https://chromereleases.googleblog.com/' }
    ]
  }
];

export const CyberTacticalGuide: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto h-full overflow-y-auto custom-scrollbar">
      {/* Header Banner */}
      <div className="bg-rose-950/20 border border-rose-500/30 rounded-sm p-4 flex items-center gap-4">
        <div className="bg-rose-500 rounded-sm p-2">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-rose-500 uppercase tracking-tighter">คำแนะนำการตอบสนองภัยคุกคามด่วน</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">TACTICAL RESPONSE GUIDE v1.0</p>
        </div>
      </div>

      <div className="grid gap-6">
        {CURRENT_SCENARIOS.map((scenario) => (
          <motion.div 
            key={scenario.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden"
          >
            {/* Scenario Header */}
            <div className={`p-3 flex items-center justify-between ${
              scenario.severity === 'critical' ? 'bg-rose-600' : 'bg-orange-500'
            }`}>
              <h3 className="text-[12px] font-black text-white uppercase tracking-tight">
                {scenario.title}
              </h3>
              <span className="text-[8px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/30 uppercase">
                {scenario.severity}
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* Impact Section */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-rose-600">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">ผลกระทบที่ระบุได้ (Impact)</span>
                </div>
                <p className="text-[11.5px] font-medium text-slate-700 leading-relaxed bg-rose-50 p-2 rounded-sm border-l-2 border-rose-500">
                  {scenario.impact}
                </p>
              </div>

              {/* Remediation Steps */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">แนวทางการแก้ไข (Immediate Steps)</span>
                </div>
                <div className="space-y-1.5">
                  {scenario.remediation.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 group">
                      <div className="mt-1 shrink-0 w-4 h-4 bg-emerald-100 flex items-center justify-center rounded-xs text-emerald-600 text-[9px] font-black group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        {idx + 1}
                      </div>
                      <p className="text-[11px] font-bold text-slate-600 leading-snug">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                {scenario.links.map((link, idx) => (
                  <a 
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {link.label}
                  </a>
                ))}
                <button className="p-2 border border-slate-200 rounded-sm hover:bg-slate-50 transition-colors">
                  <Share2 className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer Disclaimer */}
      <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 flex gap-3">
        <Terminal className="w-5 h-5 text-slate-400 shrink-0" />
        <div className="space-y-1">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SYSTEM ADVISORY</p>
          <p className="text-[10px] text-slate-400 leading-relaxed italic">
            คำแนะนำเหล่านี้มาจากฐานข้อมูลภัยคุกคามล่าสุด กรุณาปรึกษาเจ้าหน้าที่ IT ฝ่ายเทคนิคขององค์กรก่อนดำเนินการในระบบที่มีความสำคัญสูง
          </p>
        </div>
      </div>
    </div>
  );
};
