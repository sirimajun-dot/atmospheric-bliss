import React from 'react';
import { CheckCircle2, Circle, AlertCircle, Clock, Shield, Zap, TrendingUp, AlertTriangle, FileText, Activity } from 'lucide-react';
import { RiskData, LogEntry, DailySummary } from '../types';

interface APIData {
  category: string;
  source: string;
  /** Same substring used in `getStatus()` to match `connectionStatus[].source` */
  statusLookupKey: string;
  status: 'success' | 'pending' | 'failed';
  currentMethod: string;
  devPlan: string;
  benefit: string;
  frequency?: string;
}

interface Props {
  apiStatus?: Record<string, 'success' | 'pending' | 'failed'>;
  connectionStatus?: { source: string; status: string }[];
  risks?: RiskData[];
  logs?: LogEntry[];
  dailySummary?: DailySummary | null;
}

export const APIStatusTable: React.FC<Props> = ({ apiStatus, connectionStatus, risks = [], logs = [], dailySummary }) => {
  const getStatus = (sourceName: string): 'success' | 'pending' | 'failed' => {
    if (!connectionStatus) return 'pending';
    const match = connectionStatus.find(c => c.source.toLowerCase().includes(sourceName.toLowerCase()));
    if (match) {
      const s = match.status.toLowerCase();
      if (s === 'fetched') return 'success';
      if (s === 'unavailable' || s === 'error' || s === 'failed') return 'failed';
      return 'pending';
    }
    return 'pending';
  };

  const statusTooltip = (lookupKey: string): string | undefined => {
    const row = connectionStatus?.find((c) => c.source.toLowerCase().includes(lookupKey.toLowerCase()));
    if (!row) return undefined;
    const s = row.status.toLowerCase();
    if (s === "fetched") return undefined;
    if (s === "unavailable") return "ดึงข้อมูลไม่สำเร็จ (HTTP / เครือข่าย / บริการต้นทาง) — รอรอบสแกนถัดไป";
    if (s === "connecting") return "กำลังเชื่อมต่อ…";
    if (s === "idle")
      return "ยังไม่ได้เชื่อมต่อ fetch ในโค้ดรุ่นนี้ (ไม่ใช่แหล่งล่ม) — รอแผนขยายแหล่ง";
    return `สถานะ: ${row.status}`;
  };

  const apiData: APIData[] = [
    {
      category: 'ภัยธรรมชาติ (Natural Disaster)',
      source: 'USGS Earthquake API',
      statusLookupKey: 'USGS',
      status: getStatus('USGS'),
      currentMethod: 'เชื่อมต่อ API ตรง (Real-time)',
      devPlan: 'ลด Latency เครือข่าย',
      benefit: 'ข้อมูลแผ่นดินไหวแม่นยำ',
      frequency: 'ทุก 5 นาที'
    },
    {
      category: 'การป้องกันไซเบอร์ (Cyber Defense)',
      source: 'CISA KEV (API)',
      statusLookupKey: 'CISA',
      status: getStatus('CISA'),
      currentMethod: 'เชื่อมต่อ JSON API (Real-time)',
      devPlan: 'เพิ่มระบบแจ้งเตือนช่องโหว่ Day-1',
      benefit: 'ติดตามช่องโหว่ระดับองค์กร',
      frequency: 'ทุก 5 นาที'
    },
    {
      category: 'ความมั่นคงทางชีวภาพและภูมิรัฐศาสตร์',
      source: 'GDACS (UN/EU)',
      statusLookupKey: 'GDACS',
      status: getStatus('GDACS'),
      currentMethod: 'ดึงข้อมูลผ่าน Zero Trust Edge',
      devPlan: 'คงไว้เป็น Baseline รัฐบาล',
      benefit: 'วิกฤตภัยธรรมชาติและการเมือง',
      frequency: 'ทุก 5 นาที'
    },
    {
      category: 'ภูมิรัฐศาสตร์ (Geopolitics)',
      source: 'ReliefWeb API',
      statusLookupKey: 'ReliefWeb',
      status: getStatus('ReliefWeb'),
      currentMethod: 'Humanitarian report API (v2)',
      devPlan: 'ขอ appname ทางการและเพิ่มตัวกรองภูมิภาค/ประเทศ',
      benefit: 'ติดตามเหตุการณ์ภูมิรัฐศาสตร์/มนุษยธรรมใกล้เวลาจริง',
      frequency: 'ทุก 5 นาที'
    },
    {
      category: 'สภาพภูมิอากาศ (Climate)',
      source: 'Open-Meteo (weather/air · Bangkok)',
      statusLookupKey: 'Open-Meteo',
      status: getStatus('Open-Meteo'),
      currentMethod: 'Open-Meteo forecast + air-quality API (พิกัดกรุงเทพฯ)',
      devPlan: 'เชื่อม TMD จริงหรือหลายจุดภูมิภาค',
      benefit: 'PM2.5 / ความน่าจะเป็นฝน สำหรับภาพรวม',
      frequency: 'ทุก 5 นาที'
    },
    {
      category: 'การป้องกันไซเบอร์ (Cyber Defense)',
      source: 'MITRE ATT&CK',
      statusLookupKey: 'MITRE',
      status: getStatus('MITRE'),
      currentMethod: 'AI Guided Retrieval',
      devPlan: 'จับคู่ CVE อัตโนมัติ',
      benefit: 'ยุทธวิธีทางเครือข่าย',
      frequency: 'ทุก 5 นาที'
    },
    {
      category: 'การป้องกันไซเบอร์ (Cyber Defense)',
      source: 'ThaiCERT (สพธอ.)',
      statusLookupKey: 'ThaiCERT',
      status: getStatus('ThaiCERT'),
      currentMethod: 'National Intelligence Feed',
      devPlan: 'เจาะจงภัยองค์กรไทย',
      benefit: 'ข่าวกรองเจาะจงภูมิภาค',
      frequency: 'ทุก 5 นาที'
    },
    {
      category: 'การป้องกันไซเบอร์ (Cyber Defense)',
      source: 'NCSA (สกมช.)',
      statusLookupKey: 'NCSA',
      status: getStatus('NCSA'),
      currentMethod: 'National Intelligence Feed',
      devPlan: 'เชื่อมต่อ PII Masking',
      benefit: 'นโยบายระดับชาติ',
      frequency: 'ทุก 5 นาที'
    },
    {
      category: 'ปัญญาประดิษฐ์ (AI Core)',
      source: 'Gemini 2.5 Flash Lite',
      statusLookupKey: 'Gemini',
      status: getStatus('Gemini'),
      currentMethod: 'Strict RAG / @google/genai',
      devPlan: 'อัปเกรดความฉลาดเป็นเวอร์ชั่น Pro (อนาคต)',
      benefit: 'วิเคราะห์ผล 23 แหล่งพร้อมกันแบบไม่เปลืองโควต้า',
      frequency: 'ทุกการคลิก / 5 นาที'
    },
    {
      category: 'การเงินและเศรษฐกิจ (Finance)',
      source: 'FRED (St. Louis Fed)',
      statusLookupKey: 'FRED',
      status: getStatus('FRED'),
      currentMethod: 'Federal Reserve Polling',
      devPlan: 'ดึงดัชนีเงินเฟ้ออัตโนมัติ',
      benefit: 'วิเคราะห์เสถียรภาพ',
      frequency: 'ทุก 5 นาที'
    },
    {
      category: 'การเงินและเศรษฐกิจ (Finance)',
      source: 'OFR Financial Stress',
      statusLookupKey: 'OFR',
      status: getStatus('OFR'),
      currentMethod: 'Federal Polling',
      devPlan: 'เชื่อมกราฟสถิติ',
      benefit: 'วัดความเครียดตลาด',
      frequency: 'ทุก 5 นาที'
    },
    {
      category: 'การเงินและเศรษฐกิจ (Finance)',
      source: 'IMF GFSR + WEO',
      statusLookupKey: 'IMF',
      status: getStatus('IMF'),
      currentMethod: 'Global Bank Feeds',
      devPlan: 'วิเคราะห์รายงานรายไตรมาส',
      benefit: 'ติดตามสภาพคล่องตลาดโลก',
      frequency: 'ทุก 5 นาที'
    }
  ];

  const normalize = (s: string) => s.toLowerCase().trim();
  const tableKeys = apiData.map((r) => r.statusLookupKey);
  const tableKeysNorm = tableKeys.map(normalize);
  const rows = Array.isArray(connectionStatus) ? connectionStatus : [];

  const notFetchedYet = rows.filter((r) => {
    const s = normalize(r.status || "");
    return s === "idle" || s === "connecting";
  });

  const fetchedButNotInTable = rows.filter((r) => {
    const s = normalize(r.status || "");
    if (s !== "fetched") return false;
    const src = normalize(r.source || "");
    return !tableKeysNorm.some((k) => src.includes(k) || k.includes(src));
  });

  const inTableButNotFetched = apiData.filter((r) => r.status !== "success");

  const topThreats = risks
    .filter(r => r.score > r.threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="space-y-[17.5px]">
      {/* 1. Risk Intelligence Summary (New Section) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[11.7px]">
        {/* Daily Risk Report Summary */}
        <div className="p-[14.6px] rounded-sm border border-white/10 bg-black/40 backdrop-blur-md">
          <h3 className="text-[10.2px] font-bold text-blue-400 flex items-center gap-[5.8px] mb-[8.8px] uppercase tracking-wider">
            <FileText className="w-[14.6px] h-[14.6px]" />
            รายงานความเสี่ยงรายวัน (Daily Summary)
          </h3>
          <div className="space-y-[5.8px]">
            {dailySummary ? (
              <>
                <div className="text-[11.7px] font-bold text-white leading-tight">สรุปสภาวะความเสี่ยงรวม</div>
                <p className="text-[10.2px] text-gray-400 leading-relaxed line-clamp-3">{dailySummary.overviewThai || 'ไม่มีข้อมูลสรุป'}</p>
              </>
            ) : (
              <div className="text-[10.2px] text-gray-500 italic">กำลังประมวลผลสรุปรายวัน...</div>
            )}
          </div>
        </div>

        {/* Key Threats */}
        <div className="p-[14.6px] rounded-sm border border-white/10 bg-black/40 backdrop-blur-md">
          <h3 className="text-[10.2px] font-bold text-rose-400 flex items-center gap-[5.8px] mb-[8.8px] uppercase tracking-wider">
            <AlertTriangle className="w-[14.6px] h-[14.6px]" />
            ภัยคุกคามหลัก (Key Threats)
          </h3>
          <div className="space-y-[5.8px]">
            {topThreats.length > 0 ? (
              topThreats.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-[5.8px] p-[5.8px] bg-white/5 rounded-sm">
                  <span className="text-[10.2px] font-medium text-gray-200 truncate">{r.labelThai || 'Unknown'}</span>
                  <span className="text-[10.2px] font-black text-rose-500">{Math.round(Number(r.score) || 0)}%</span>
                </div>
              ))
            ) : (
              <div className="text-[10.2px] text-gray-500 italic">ไม่พบภัยคุกคามระดับสูง</div>
            )}
          </div>
        </div>

        {/* Latest Alert Events */}
        <div className="p-[14.6px] rounded-sm border border-white/10 bg-black/40 backdrop-blur-md">
          <h3 className="text-[10.2px] font-bold text-emerald-400 flex items-center gap-[5.8px] mb-[8.8px] uppercase tracking-wider">
            <Activity className="w-[14.6px] h-[14.6px]" />
            เหตุการณ์ล่าสุด (Alert Events)
          </h3>
          <div className="space-y-[5.8px]">
            {(Array.isArray(logs) ? logs : []).slice(0, 3).map((log, i) => (
              <div key={i} className="flex flex-col gap-[1.5px] border-l-2 border-emerald-500/30 pl-[5.8px]">
                <div className="text-[9.5px] font-bold text-gray-200 line-clamp-1">{log.messageThai || 'ไม่มีข้อความ'}</div>
                <div className="text-[8.1px] text-gray-500">{log.time || '--:--'} | {log.sourceName || 'System'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. API Status Table (Existing Section) */}
      <div className="flex items-center justify-between">
        <h2 className="text-[14.6px] font-bold text-white flex items-center gap-[5.8px]">
          <Shield className="w-[17.5px] h-[17.5px] text-blue-400" />
          ตารางสรุปสถานะ API และแผนพัฒนา
        </h2>
        <div className="flex gap-[11.7px] text-[8.8px]">
          <div className="flex items-center gap-[2.9px] text-green-400">
            <CheckCircle2 className="w-[8.8px] h-[8.8px]" /> สำเร็จ
          </div>
          <div className="flex items-center gap-[2.9px] text-yellow-400">
            <Clock className="w-[8.8px] h-[8.8px]" /> แผนพัฒนา
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-sm border border-white/10 bg-black/40 backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-bottom border-white/10">
              <th className="p-[11.7px] text-[8.8px] font-semibold text-gray-400 uppercase tracking-wider">หมวดหมู่ & แหล่งข้อมูล</th>
              <th className="p-[11.7px] text-[8.8px] font-semibold text-gray-400 uppercase tracking-wider text-center">API?</th>
              <th className="p-[11.7px] text-[8.8px] font-semibold text-gray-400 uppercase tracking-wider text-center">ความถี่ (Frequency)</th>
              <th className="p-[11.7px] text-[8.8px] font-semibold text-gray-400 uppercase tracking-wider">วิธีการปัจจุบัน</th>
              <th className="p-[11.7px] text-[8.8px] font-semibold text-gray-400 uppercase tracking-wider">แผนพัฒนา</th>
              <th className="p-[11.7px] text-[8.8px] font-semibold text-gray-400 uppercase tracking-wider">ประโยชน์</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {apiData.map((api, index) => (
              <tr key={index} className="hover:bg-white/5 transition-colors">
                <td className="p-[11.7px]">
                  <div className="text-[8.8px] text-blue-400 mb-[2.9px]">{api.category}</div>
                  <div className="text-[10.2px] font-medium text-white">{api.source}</div>
                </td>
                <td
                  className="p-[11.7px] text-center"
                  title={statusTooltip(api.statusLookupKey)}
                >
                  {api.status === 'success' ? (
                    <CheckCircle2 className="w-[14.6px] h-[14.6px] text-green-500 mx-auto" />
                  ) : api.status === 'pending' ? (
                    <Clock className="w-[14.6px] h-[14.6px] text-yellow-500 mx-auto animate-pulse" />
                  ) : (
                    <AlertCircle className="w-[14.6px] h-[14.6px] text-red-500 mx-auto" />
                  )}
                </td>
                <td className="p-[11.7px] text-center">
                  <div className="text-[9.5px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full inline-block">
                    {api.frequency || 'ทุก 5 นาที'}
                  </div>
                </td>
                <td className="p-[11.7px] text-[10.2px] text-gray-300">{api.currentMethod}</td>
                <td className="p-[11.7px]">
                  <div className="flex items-start gap-[5.8px]">
                    <Zap className="w-[11.7px] h-[11.7px] text-yellow-500 mt-[1.5px] shrink-0" />
                    <span className="text-[10.2px] text-gray-300">{api.devPlan}</span>
                  </div>
                </td>
                <td className="p-[11.7px]">
                  <div className="flex items-start gap-[5.8px]">
                    <TrendingUp className="w-[11.7px] h-[11.7px] text-green-500 mt-[1.5px] shrink-0" />
                    <span className="text-[10.2px] text-gray-300">{api.benefit}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. Data Coverage Audit */}
      <div className="rounded-sm border border-amber-500/20 bg-amber-500/5 p-[11.7px]">
        <h3 className="mb-[5.8px] flex items-center gap-[5.8px] text-[10.2px] font-bold text-amber-400">
          <AlertTriangle className="h-[11.7px] w-[11.7px]" />
          Data Coverage Audit (Gap Report)
        </h3>
        <div className="mb-[8.8px] grid grid-cols-1 gap-[5.8px] md:grid-cols-3">
          <div className="rounded-sm border border-white/10 bg-black/30 p-[8.8px]">
            <div className="text-[8.1px] text-gray-400">ยังไม่ดึงจริง (idle = ยังไม่ผูกในโค้ด / connecting)</div>
            <div className="text-[14.6px] font-black text-amber-300">{notFetchedYet.length}</div>
          </div>
          <div className="rounded-sm border border-white/10 bg-black/30 p-[8.8px]">
            <div className="text-[8.1px] text-gray-400">ดึงแล้วแต่ยังไม่อยู่ใน table</div>
            <div className="text-[14.6px] font-black text-emerald-300">{fetchedButNotInTable.length}</div>
          </div>
          <div className="rounded-sm border border-white/10 bg-black/30 p-[8.8px]">
            <div className="text-[8.1px] text-gray-400">อยู่ใน table แต่ยังไม่ fetched</div>
            <div className="text-[14.6px] font-black text-rose-300">{inTableButNotFetched.length}</div>
          </div>
        </div>
        <div className="space-y-[5.8px] text-[9.5px]">
          <div>
            <div className="mb-[2.9px] text-[8.8px] font-bold text-amber-300">A) ยังไม่ดึงจริง</div>
            <div className="text-gray-300">
              {notFetchedYet.length
                ? notFetchedYet.map((r) => `${r.source} (${r.status})`).join(" | ")
                : "ไม่มี"}
            </div>
          </div>
          <div>
            <div className="mb-[2.9px] text-[8.8px] font-bold text-emerald-300">B) ดึงแล้วแต่ยังไม่เข้า table</div>
            <div className="text-gray-300">
              {fetchedButNotInTable.length
                ? fetchedButNotInTable.map((r) => r.source).join(" | ")
                : "ไม่มี"}
            </div>
          </div>
          <div>
            <div className="mb-[2.9px] text-[8.8px] font-bold text-rose-300">C) อยู่ใน table แต่ยังไม่ fetched</div>
            <div className="text-gray-300">
              {inTableButNotFetched.length
                ? inTableButNotFetched.map((r) => `${r.source} (${r.status})`).join(" | ")
                : "ไม่มี"}
            </div>
          </div>
        </div>
      </div>

      <div className="p-[11.7px] rounded-sm border border-emerald-500/20 bg-emerald-500/5">
        <h3 className="text-[10.2px] font-bold text-emerald-400 flex items-center gap-[5.8px] mb-[5.8px]">
          <CheckCircle2 className="w-[11.7px] h-[11.7px]" />
          สถานะระบบปัจจุบัน (System Status)
        </h3>
        <ul className="text-[8.8px] text-gray-400 space-y-[2.9px] list-disc pl-[11.7px]">
          <li>AI Core: Gemini 2.5 Flash Lite (ประหยัดโควต้า | ประสิทธิภาพสูง)</li>
          <li>Zero Trust Whitelist: ระบบจำกัดการอ่านข้อมูลเฉพาะ 23 องค์กรที่ได้รับอนุญาต</li>
          <li>การเชื่อมต่อข้อมูลภายนอก (USGS, GDACS, NASA, WHO, ProMED, DDC, ACLED, ICG, ISW, AIID, OECD, CEMS): {
            Object.values(apiStatus || {}).every(v => v === 'success') ? 'เสถียร 100%' : 'กำลังตรวจสอบสถานะ...'
          }</li>
        </ul>
      </div>
    </div>
  );
};
