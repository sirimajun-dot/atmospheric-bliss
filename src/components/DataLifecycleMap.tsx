import React from 'react';
import { Database, ArrowRight, Shield, Trash2, HardDrive, Globe, Cpu, Layout, Info, Search, X, Clock, ExternalLink } from 'lucide-react';
import { LogEntry } from '../types';

interface DataLifecycleMapProps {
  logs?: LogEntry[];
}

export const DataLifecycleMap: React.FC<DataLifecycleMapProps> = ({ logs = [] }) => {
  const [storageUsage, setStorageUsage] = React.useState<{ used: number; percent: number }>({ used: 0, percent: 0 });
  const [searchQuery, setSearchQuery] = React.useState('');

  // Listen for global search events from the header
  React.useEffect(() => {
    const handleGlobalSearch = (e: any) => {
      setSearchQuery(e.detail || '');
    };
    window.addEventListener('global-search', handleGlobalSearch);
    return () => window.removeEventListener('global-search', handleGlobalSearch);
  }, []);

  const filteredLogs = React.useMemo(() => {
    if (!Array.isArray(logs)) return [];
    if (!searchQuery.trim()) return logs;
    const query = searchQuery.toLowerCase();
    return logs.filter(log => 
      (log.messageThai || '').toLowerCase().includes(query) ||
      (log.message || '').toLowerCase().includes(query) ||
      (log.details || '').toLowerCase().includes(query) ||
      (log.sourceName && log.sourceName.toLowerCase().includes(query))
    );
  }, [logs, searchQuery]);

  React.useEffect(() => {
    const calculateUsage = () => {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          total += (localStorage.getItem(key) || '').length;
        }
      }
      // 5MB limit is approx 5,000,000 characters (UTF-16 code units)
      const limit = 5 * 1024 * 1024; 
      const usedKB = total / 1024;
      const percent = (total / limit) * 100;
      setStorageUsage({ used: usedKB, percent });
    };

    calculateUsage();
    // Update when storage changes (optional, but good for accuracy)
    window.addEventListener('storage', calculateUsage);
    return () => window.removeEventListener('storage', calculateUsage);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Database className="w-6 h-6 text-emerald-500" />
        <h2 className="text-xl font-black text-white tracking-tight uppercase">แผนผังการจัดการข้อมูล (Data Lifecycle)</h2>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Step 1: Sources */}
        <div className="p-5 rounded-sm border border-white/10 bg-white/5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Globe className="w-16 h-16 text-blue-400" />
          </div>
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-400/20 flex items-center justify-center text-[10px]">1</span>
            แหล่งข้อมูล (Data Sources)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'USGS/NASA', type: 'API' },
              { name: 'WHO/ProMED', type: 'RSS' },
              { name: 'Reuters/AP', type: 'RSS' },
              { name: 'ThaiCERT/NCSA', type: 'RSS' }
            ].map((s, i) => (
              <div key={i} className="p-2 bg-black/40 border border-white/5 rounded-sm text-center">
                <div className="text-[10px] font-bold text-white">{s.name}</div>
                <div className="text-[8px] text-gray-500 uppercase">{s.type}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center -my-3 relative z-10">
          <ArrowRight className="w-6 h-6 text-gray-600 rotate-90" />
        </div>

        {/* Step 2: Processing */}
        <div className="p-5 rounded-sm border border-white/10 bg-white/5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Cpu className="w-16 h-16 text-purple-400" />
          </div>
          <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-purple-400/20 flex items-center justify-center text-[10px]">2</span>
            การประมวลผล (AI & Logic)
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-sm">
              <div className="text-[11px] font-bold text-purple-300 mb-1">Gemini 3 Intelligence</div>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                วิเคราะห์ความเชื่อมโยง, สรุปใจความสำคัญ, และประเมินคะแนนความเสี่ยง (Risk Scoring) จากข้อมูลดิบ
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-sm">
              <div className="text-[11px] font-bold text-blue-300 mb-1">Risk Engine (useRiskData)</div>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                คำนวณการลดทอนของคะแนนตามเวลา (Decay Logic) และจัดการสถานะของแอปพลิเคชัน
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center -my-3 relative z-10">
          <ArrowRight className="w-6 h-6 text-gray-600 rotate-90" />
        </div>

        {/* Step 3: Storage */}
        <div className="p-5 rounded-sm border border-white/10 bg-white/5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <HardDrive className="w-16 h-16 text-emerald-400" />
          </div>
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center text-[10px]">3</span>
            การจัดเก็บข้อมูล (Storage)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-gray-300 flex items-center gap-2">
                <Database className="w-3 h-3" /> สิ่งที่ถูกเก็บ (Stored)
              </div>
              <ul className="text-[9px] text-gray-400 space-y-1 list-disc pl-4">
                <li><span className="text-emerald-400 font-bold">Risk Logs:</span> ประวัติเหตุการณ์ย้อนหลัง 5 วัน (สูงสุด 500 รายการ)</li>
                <li><span className="text-emerald-400 font-bold">Risk Findings:</span> หลักฐานความเสี่ยงย้อนหลัง 48 ชั่วโมง</li>
                <li><span className="text-emerald-400 font-bold">Daily Summary:</span> บทสรุปสถานการณ์รายวันล่าสุด</li>
                <li><span className="text-emerald-400 font-bold">Location Context:</span> พิกัดโดยประมาณเพื่อพยากรณ์อากาศ</li>
              </ul>

              {/* Search Functionality */}
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <Search className="h-3 w-3 text-emerald-500/50" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-7 pr-7 py-1.5 bg-black/40 border border-emerald-500/20 rounded-sm text-[9px] text-emerald-100 placeholder-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    placeholder="ค้นหาใน Risk Logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-emerald-500/30 hover:text-emerald-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="mt-2 bg-black/60 border border-emerald-500/10 rounded-sm max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-500/20">
                  {filteredLogs.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {filteredLogs.slice(0, 100).map((log) => (
                          <div key={log.id} className="p-2 hover:bg-white/5 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[7px] font-bold text-emerald-500">[{log.time || '--:--'}]</span>
                              <span className="text-[6px] text-gray-500 uppercase tracking-tighter">{log.sourceName || 'System'}</span>
                            </div>
                            <p className="text-[8px] text-gray-300 leading-tight mb-1">{log.messageThai || 'ไม่มีข้อความ'}</p>
                            <div className="flex items-center gap-2 text-[6px] text-gray-500">
                              <span className="flex items-center gap-0.5"><Clock className="w-2 h-2" /> {log.timestamp ? new Date(log.timestamp).toLocaleDateString('th-TH') : '--/--/----'}</span>
                              {log.sourceUrl && (
                                <a href={log.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-emerald-500/70 hover:text-emerald-500">
                                  <ExternalLink className="w-2 h-2" /> แหล่งข้อมูล
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-[8px] text-gray-500 italic">ไม่พบข้อมูล (รอระบบอัปเดต...)</p>
                      </div>
                    )}
                </div>
              </div>

              <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-[9px] font-bold text-emerald-300">Storage Location: Browser LocalStorage</div>
                  <div className="text-[9px] font-bold text-emerald-300">{storageUsage.used.toFixed(1)} KB / 5 MB</div>
                </div>
                <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden mb-1">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${Math.min(100, storageUsage.percent)}%` }}
                  />
                </div>
                <div className="text-[8px] text-gray-500 italic">
                  *ข้อมูลถูกเก็บไว้ในเครื่องของคุณเท่านั้น (ใช้ไป {storageUsage.percent.toFixed(2)}% ของพื้นที่ทั้งหมด)
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-gray-300 flex items-center gap-2">
                <Trash2 className="w-3 h-3 text-rose-400" /> สิ่งที่ไม่ถูกเก็บ (Discarded)
              </div>
              <ul className="text-[9px] text-gray-400 space-y-1 list-disc pl-4">
                <li>
                  <span className="text-rose-400 font-bold">Raw API Data (~98% of total bytes):</span> 
                  ข้อมูลดิบมหาศาลจะถูก "ย่อย" และลบทิ้งทันที ตัวอย่างเช่น:
                  <ul className="pl-4 mt-1 list-[circle] space-y-0.5 opacity-80">
                    <li><strong>USGS GeoJSON:</strong> พิกัดละเอียดของแผ่นดินไหวทั่วโลกนับพันจุด (เก็บเฉพาะจุดที่เสี่ยง)</li>
                    <li><strong>NASA FIRMS:</strong> ข้อมูลจุดความร้อนนับหมื่นจุดทั่วโลก (เก็บเฉพาะจำนวนจุดใกล้ตัว)</li>
                    <li><strong>RSS Full Content:</strong> เนื้อหาข่าวฉบับเต็มและ Metadata (เก็บเฉพาะหัวข้อและสรุปสั้น)</li>
                    <li><strong>Weather Hourly Arrays:</strong> ข้อมูลพยากรณ์รายชั่วโมงนับร้อยค่า (เก็บเฉพาะค่าปัจจุบัน)</li>
                  </ul>
                </li>
                <li><span className="text-rose-400 font-bold">Expired Logs:</span> ข้อมูลที่เก่ากว่า 5 วันจะถูกลบอัตโนมัติ</li>
                <li><span className="text-rose-400 font-bold">PII:</span> ไม่มีการเก็บชื่อ, เบอร์โทร, หรือข้อมูลระบุตัวตนจริง</li>
                <li><span className="text-rose-400 font-bold">API Keys:</span> คีย์ของคุณจะถูกใช้เพื่อเรียก AI เท่านั้น ไม่มีการบันทึกถาวรในฐานข้อมูล</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-center -my-3 relative z-10">
          <ArrowRight className="w-6 h-6 text-gray-600 rotate-90" />
        </div>

        {/* Step 4: UI */}
        <div className="p-5 rounded-sm border border-white/10 bg-white/5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Layout className="w-16 h-16 text-amber-400" />
          </div>
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center text-[10px]">4</span>
            การแสดงผล (Visual Interface)
          </h3>
          <div className="flex flex-wrap gap-2">
            {['Dashboard', 'Risk Radar', 'Alert Ticker', 'Intelligence Report', 'Weather Widget'].map((ui, i) => (
              <div key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] text-gray-300">
                {ui}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-sm border border-blue-500/20 bg-blue-500/5 flex gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-[11px] font-bold text-blue-300">นโยบายความเป็นส่วนตัวและความปลอดภัย</h4>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            ระบบนี้ถูกออกแบบมาให้เป็น <strong>"Privacy-First"</strong> ข้อมูลส่วนใหญ่จะถูกประมวลผลและจัดเก็บอยู่ภายในเบราว์เซอร์ของคุณ (Client-side) 
            การส่งข้อมูลไปยัง AI จะส่งเพียง "Context" ที่จำเป็นเพื่อให้ได้บทวิเคราะห์ที่แม่นยำที่สุดเท่านั้น
          </p>
        </div>
      </div>

      <div className="p-4 rounded-sm border border-white/10 bg-black/20 space-y-3">
        <h4 className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-3 h-3 text-emerald-400" /> ข้อมูลทางเทคนิค (Technical Q&A)
        </h4>
        
        <div className="space-y-3">
          <div>
            <div className="text-[10px] font-bold text-emerald-400 mb-1">1. วิธีการเข้าไปดูข้อมูลใน LocalStorage</div>
            <p className="text-[9px] text-gray-400 leading-relaxed">
              คุณสามารถตรวจสอบความโปร่งใสของข้อมูลได้ด้วยตัวเองผ่าน Browser DevTools:
              <br />• <strong>บนคอมพิวเตอร์:</strong> คลิกขวาที่หน้าจอ &gt; เลือก 'Inspect' (ตรวจสอบ) &gt; ไปที่แท็บ 'Application' &gt; เลือก 'Local Storage' ทางซ้ายมือ
              <br />• <strong>คีย์ที่ใช้จัดเก็บ:</strong> <code className="text-emerald-300">risk_logs</code>, <code className="text-emerald-300">risk_findings</code>, <code className="text-emerald-300">daily_summary</code>
            </p>
          </div>

          <div>
            <div className="text-[10px] font-bold text-emerald-400 mb-1">2. "ปิดแอปไปแล้ว" หมายถึงอะไร?</div>
            <p className="text-[9px] text-gray-400 leading-relaxed">
              หมายถึงการปิด Tab เบราว์เซอร์, การปิดแอป LINE (ในกรณีใช้ผ่าน LINE LIFF), หรือแม้แต่การรีสตาร์ทเครื่อง ข้อมูลที่อยู่ใน LocalStorage จะถูกเขียนลงในหน่วยความจำถาวรของเครื่อง (Disk) ไม่ใช่แค่แรม (RAM) ทำให้เมื่อคุณเปิดแอปขึ้นมาใหม่ ข้อมูลเดิมจะยังคงอยู่โดยไม่ต้องโหลดใหม่จากเซิร์ฟเวอร์
            </p>
          </div>

          <div>
            <div className="text-[10px] font-bold text-rose-400 mb-1">3. ข้อเสียและข้อจำกัดของ LocalStorage</div>
            <p className="text-[9px] text-gray-400 leading-relaxed">
              แม้จะมีข้อดีเรื่องความเป็นส่วนตัว แต่ก็มีข้อจำกัดที่ควรทราบ:
              <br />• <strong>ไม่ซิงค์ข้ามอุปกรณ์:</strong> ข้อมูลที่เก็บในมือถือเครื่อง A จะไม่ปรากฏในคอมพิวเตอร์เครื่อง B (เพราะข้อมูลไม่ได้อยู่บน Cloud)
              <br />• <strong>พื้นที่จำกัด:</strong> เบราว์เซอร์มักจำกัดพื้นที่ไว้ที่ประมาณ 5MB ต่อเว็บไซต์ (หากข้อมูลเต็ม ระบบอาจไม่บันทึกเพิ่ม)
              <br />• <strong>เสี่ยงต่อการถูกล้าง:</strong> หากคุณสั่ง "Clear Browser Data" หรือ "ล้างประวัติการเข้าชม" ข้อมูลทั้งหมดในแอปจะหายไปทันที
              <br />• <strong>ความปลอดภัย:</strong> ข้อมูลไม่ได้ถูกเข้ารหัสในระดับไฟล์ หากใครเข้าถึงเครื่องและเปิด DevTools ได้ ก็จะเห็นข้อมูลทั้งหมดเป็นข้อความปกติ
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-sm border border-white/10 bg-white/5 backdrop-blur-md relative overflow-hidden">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Layout className="w-4 h-4" /> การเปรียบเทียบต้นทุนและประสิทธิภาพ (Cost Analysis)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[9px] text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 uppercase">
                <th className="py-2 px-2">หัวข้อเปรียบเทียบ</th>
                <th className="py-2 px-2 text-emerald-400 bg-emerald-400/5">LocalStorage (ปัจจุบัน)</th>
                <th className="py-2 px-2 text-blue-400 bg-blue-400/5">Server Storage (ทางเลือก)</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-white/5">
                <td className="py-2 px-2 font-bold">ต้นทุนผู้ดูแล (Admin Cost)</td>
                <td className="py-2 px-2 text-emerald-300 bg-emerald-400/5">~$0 - $10 / เดือน (ค่า AI เท่านั้น)</td>
                <td className="py-2 px-2 text-blue-300 bg-blue-400/5">~$25 - $100+ / เดือน (DB + Auth + Server)</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 px-2 font-bold">ต้นทุนผู้ใช้ (User Cost)</td>
                <td className="py-2 px-2 text-emerald-300 bg-emerald-400/5">ฟรี (ใช้พื้นที่เครื่องตัวเอง)</td>
                <td className="py-2 px-2 text-blue-300 bg-blue-400/5">ฟรี (แต่เสีย Data มือถือเพิ่มในการโหลด)</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 px-2 font-bold">ความเร็ว (Speed)</td>
                <td className="py-2 px-2 text-emerald-300 bg-emerald-400/5">สูงสุด (Instant Access)</td>
                <td className="py-2 px-2 text-blue-300 bg-blue-400/5">ปานกลาง (ขึ้นกับความเร็วเน็ต)</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 px-2 font-bold">ความเป็นส่วนตัว (Privacy)</td>
                <td className="py-2 px-2 text-emerald-300 bg-emerald-400/5">สูงสุด (ข้อมูลไม่เคยออกจากเครื่อง)</td>
                <td className="py-2 px-2 text-blue-300 bg-blue-400/5">ต่ำกว่า (ข้อมูลถูกเก็บไว้ที่ส่วนกลาง)</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 px-2 font-bold">การซิงค์ (Sync)</td>
                <td className="py-2 px-2 text-rose-300 bg-emerald-400/5">ทำไม่ได้ (แยกตามเครื่อง)</td>
                <td className="py-2 px-2 text-emerald-300 bg-blue-400/5">ทำได้ดีมาก (ดูได้ทุกที่)</td>
              </tr>
              <tr>
                <td className="py-2 px-2 font-bold italic text-gray-500">การเก็บพิกัดสถานที่</td>
                <td className="py-2 px-2 text-emerald-300 bg-emerald-400/5 italic">เก็บในเครื่อง (ปลอดภัยสูง)</td>
                <td className="py-2 px-2 text-blue-300 bg-blue-400/5 italic">เก็บที่ Server (ระบุตัวตนได้ง่าย)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-sm">
          <div className="text-[10px] font-bold text-amber-300 mb-1">บทสรุปเชิงกลยุทธ์:</div>
          <p className="text-[9px] text-gray-400 leading-relaxed">
            การใช้ <strong>LocalStorage</strong> ช่วยลดภาระค่าใช้จ่ายของผู้ดูแลได้เกือบ 100% และให้ความเร็วสูงสุดแก่ผู้ใช้ 
            ในขณะที่ <strong>Server Storage</strong> จะจำเป็นก็ต่อเมื่อคุณต้องการให้ผู้ใช้ "ล็อกอิน" เพื่อดูข้อมูลเดิมจากอุปกรณ์อื่นได้ 
            แต่ต้องแลกมาด้วยค่าเช่าฐานข้อมูลรายเดือนและความเสี่ยงด้านความเป็นส่วนตัวที่เพิ่มขึ้น
          </p>
        </div>
      </div>

      <div className="p-5 rounded-sm border border-white/10 bg-black/40 space-y-4">
        <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
          <Cpu className="w-4 h-4" /> กลไกการทำงานและต้นทุน AI (AI Intelligence & Cost Logic)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-purple-300">1. การทำงานของการเรียก AI (Workflow)</div>
            <p className="text-[9px] text-gray-400 leading-relaxed">
              เมื่อแอปทำงาน ระบบจะรวบรวมข้อมูลดิบ (Context) จาก API ต่างๆ ส่งไปยัง <strong>Gemini 3 Flash</strong> 
              โดย AI จะทำหน้าที่ "อ่านและสรุป" ข้อมูลนับพันบรรทัดให้เหลือเพียง JSON สั้นๆ ที่แอปเข้าใจ 
              <br />• <strong>Input:</strong> ข้อมูลดิบ (ข่าว, พยากรณ์, สถิติ)
              <br />• <strong>Output:</strong> บทวิเคราะห์ความเสี่ยงและพิกัด (Risk Scoring & Geo-logs)
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-purple-300">2. การคิดค่าบริการ (Billing Metrics)</div>
            <p className="text-[9px] text-gray-400 leading-relaxed">
              Google คิดเงินตาม <strong>"Tokens"</strong> (จำนวนคำ/ตัวอักษร):
              <br />• <strong>Input Tokens:</strong> ราคาถูกมาก (เน้นส่งข้อมูลดิบได้เยอะ)
              <br />• <strong>Output Tokens:</strong> ราคาสูงกว่าเล็กน้อย (เน้นสรุปสั้นๆ เพื่อประหยัด)
              <br />*รุ่น Flash ถูกออกแบบมาให้มีราคาถูกกว่ารุ่น Pro ถึง 10-20 เท่า
            </p>
          </div>
        </div>

        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-sm">
          <div className="text-[10px] font-bold text-purple-300 mb-2">วิเคราะห์งบประมาณ $10 (ประมาณ 350 บาท) ต่อเดือน</div>
          <div className="grid grid-cols-2 gap-4 text-[9px]">
            <div className="space-y-1">
              <div className="text-gray-300 font-bold underline">กรณีผู้ใช้ทั่วไป (Casual Users)</div>
              <p className="text-gray-400">
                รองรับได้ <strong>~500 - 1,000 คน/เดือน</strong> 
                (หากแต่ละคนเปิดแอปดูสรุปวันละ 2-3 ครั้ง) 
                เนื่องจาก AI จะทำงานเฉพาะตอนที่ผู้ใช้เปิดแอปเท่านั้น
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-gray-300 font-bold underline">กรณีเปิดทิ้งไว้ (Always-on Dashboard)</div>
              <p className="text-gray-400">
                รองรับได้ <strong>~5 - 10 จอพร้อมกัน</strong> 
                (หากตั้งค่าให้รีเฟรชทุก 15 นาที ตลอด 24 ชม.) 
                งบ $10 จะครอบคลุมการเรียก AI ประมาณ 15,000 ครั้ง/เดือน
              </p>
            </div>
          </div>
          <div className="mt-2 text-[8px] text-gray-500 italic">
            *คำนวณจากราคา Gemini 1.5/3 Flash ณ ปัจจุบัน ($0.075 / 1M Input Tokens)
          </div>
        </div>
      </div>
    </div>
  );
};
