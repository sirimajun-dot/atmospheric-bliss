import React, { useEffect, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getDetectedApiKey } from './lib/auth-utils';
import { Header, Ticker } from './components/Header';
import { LiveTrackingWidget } from './components/LiveTrackingWidget';
import { AtmosphericRadar } from './components/AtmosphericRadar';
import { RiskDetailCard } from './components/RiskCard';
import { WeatherWidget } from './components/WeatherWidget';
import { EventFocus } from './components/EventFocus';
import { BottomNav } from './components/BottomNav';
import { NeuralSyncMatrix } from './components/NeuralSyncMatrix';
import { TrendAnalyzer } from './components/TrendAnalyzer';
import { PM25Indicator, RainIndicator } from './components/AtmosphericConditions';
import { useRiskData } from './hooks/useRiskData';
import { initLiff, getLiffProfile } from './lib/liff';
import { Globe, Newspaper, LayoutDashboard, ShieldCheck, User, Settings, Info, ShieldAlert } from 'lucide-react';
import { ThreatIntelligenceReport } from './components/ThreatIntelligenceReport';
import { APIStatusTable } from './components/APIStatusTable';
import { AlertEvents } from './components/AlertEvents';
import { DataLifecycleMap } from './components/DataLifecycleMap';
import { ThreatDeepDive } from './components/ThreatDeepDive';
import { TermsOfService } from './components/TermsOfService';
import { WelcomeDisclaimer } from './components/WelcomeDisclaimer';
import { GoogleAuthGate } from './components/GoogleAuthGate';

class ErrorBoundary extends Component<any, any> {
  state: any;
  props: any;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("App Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 text-center bg-slate-900 text-white">
          <div>
            <h1 className="text-2xl font-bold mb-4">ขออภัย เกิดข้อผิดพลาดบางอย่าง</h1>
            <p className="text-slate-400 mb-6">แอปพลิเคชันขัดข้อง กรุณารีเฟรชหน้าจอ</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-emerald-500 rounded-full font-bold"
            >
              รีเฟรชหน้าจอ
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <GoogleAuthGate>
        <AppContent />
      </GoogleAuthGate>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { risks, top3Risks, overallTopThreat, weather, alerts, compositeScore, logs, isLoading, isLocating, isFallback, geoError, refresh, reacquireLocation, isKeyInvalid, dailySummary, apiStatus, connectionStatus, history } = useRiskData();
  const [showLogs, setShowLogs] = React.useState(false);
  const [showWeather, setShowWeather] = React.useState(false);
  const [showMatrix, setShowMatrix] = React.useState(false);
  const [activeDomainId, setActiveDomainId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'news' | 'insight' | 'settings' | 'tos'>(() => {
    return (localStorage.getItem('active_tab') as any) || 'dashboard';
  });

  React.useEffect(() => {
    localStorage.setItem('active_tab', activeTab);
  }, [activeTab]);
  const [radarTheme, setRadarTheme] = React.useState<'default' | 'tactical' | 'minimal' | 'brutalist' | 'organic'>('default');
  const [focusedLogId, setFocusedLogId] = React.useState<string | null>(null);
  
  // Visual Alchemist: Permanently lock to V5 White Bliss
  const appVersion = 'v5';
  const [liffProfile, setLiffProfile] = React.useState<any>(null);

  React.useEffect(() => {
    document.body.className = `theme-${appVersion}`;
  }, [appVersion]);

  const [showDisclaimer, setShowDisclaimer] = React.useState(() => {
    try {
      return localStorage.getItem('disclaimer_accepted') !== 'true';
    } catch (e) {
      return true;
    }
  });

  // Calculate threat levels based on radar points (risks)
  const alertPoints = risks.filter((r: any) => r.score > r.threshold);
  const totalAlerts = alertPoints.length;
  const isNormal = totalAlerts === 0;

  const statusPrefix = isNormal ? "NORMAL:" : "ELEVATED:";
  const statusColorClass = isNormal ? "text-slate-600" : "text-amber-600";
  const borderColorClass = isNormal ? "border-slate-300/50" : "border-amber-500/50";
  const dotColorClass = isNormal ? "bg-slate-600" : "bg-amber-600";

  let threatLevelText = "ภัยคุกคามระดับต่ำ";
  if (totalAlerts === 1) {
    threatLevelText = "ภัยคุกคามบางโดเมน";
  } else if (totalAlerts > 1) {
    threatLevelText = "ภัยคุกคามหลายโดเมน";
  }

  const onRefresh = async () => {
    await refresh();
  };

  useEffect(() => {
    // Initialize LINE LIFF if ID is provided in env
    const liffId = (import.meta as any).env?.VITE_LIFF_ID;
    if (liffId) {
      initLiff(liffId).then(() => {
        getLiffProfile().then(profile => {
          if (profile) setLiffProfile(profile);
        });
      });
    }
  }, []);

  useEffect(() => {
    const handleRefreshAI = () => onRefresh();
    window.addEventListener('refresh-ai', handleRefreshAI);
    return () => window.removeEventListener('refresh-ai', handleRefreshAI);
  }, [onRefresh]);

  const handleFocusLog = (logId: string) => {
    setFocusedLogId(logId);
    setActiveTab('news');
  };

  return (
    <div className="min-h-screen pb-32 font-sans selection:bg-emerald-100">
      <WelcomeDisclaimer
        isOpen={showDisclaimer}
        onAccept={() => {
          localStorage.setItem('disclaimer_accepted', 'true');
          setShowDisclaimer(false);
        }}
      />
      <Header
        risks={risks}
        profile={liffProfile}
        onLogoClick={() => {
          setActiveTab('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
      <Ticker risks={risks} logs={logs} />

      <main className="px-[21px] pt-[18px] pb-[120px] max-w-lg mx-auto">
        {activeTab === 'dashboard' ? (
          <>
            {/* Hero Section - Alchemist Ultra-Tight Cluster Optimization */}
            <section className={`text-center relative py-4 ${appVersion === 'v5' ? 'mt-[-0.2cm]' : ''}`}>
              {/* Moved Title - Stays in place */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="absolute top-[-10px] left-0 z-20 flex items-center gap-1.5 select-none opacity-70"
              >
                <span className="text-[14px] font-black lowercase tracking-tighter text-slate-400">เกิดอะไรขึ้น</span>
                <Globe className="w-[14px] h-[14px] text-slate-400 stroke-[2.5]" />
                <span className="text-[14px] font-black lowercase tracking-tighter text-slate-400">บนโลก</span>
              </motion.div>

              {/* Rain Probability Indicator - Stays in place */}
              <div className="absolute top-[12px] left-[0px] z-10">
                <RainIndicator value={weather?.rainProb8h} />
              </div>

              {/* PM2.5 Indicator - Stays in place */}
              <div className="absolute top-[12px] right-[0px] z-10">
                <PM25Indicator value={weather?.pm25} reverse={true} />
              </div>

              {/* Live Tracking Widget - Stays in place */}
              <div className="absolute top-[-15px] right-0 z-10 scale-90 origin-right">
                <LiveTrackingWidget
                  location={weather?.location}
                  onClick={reacquireLocation}
                  isUpdating={isLoading}
                />
              </div>

              {/* ONLY MOVE THIS UP 0.3cm for iPhone balance */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative pt-[2px]"
                style={{ marginTop: '-0.3cm' }}
              >
                <AtmosphericRadar 
                  data={risks} 
                  overallTopThreat={overallTopThreat} 
                  connectionStatus={connectionStatus}
                  theme={radarTheme} 
                />
              </motion.div>





            </section>

            {/* Dynamic Threat Status Card - Tactical Shift UP 1.74cm (Target: -1.32cm) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center mb-[0.4cm]"
              style={{ marginTop: '-1.32cm' }}
            >






              <div className="w-[285px] mb-1.5 px-3 flex justify-start">
                <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-400/80">
                  Global Intelligence Status
                </span>
              </div>
              <div className={`glass-panel ${isNormal ? 'border-emerald-200/50 ring-emerald-500/5' : 'border-amber-200/50 ring-amber-500/5'} rounded-full flex items-center px-5 h-[38px] w-[285px] shadow-soft gap-4 transition-all duration-500`}>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className={`w-1.5 h-1.5 ${isNormal ? 'bg-emerald-500' : 'bg-amber-500'} rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.4)]`} />
                  <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${isNormal ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {statusPrefix}
                  </p>
                </div>
                <div className="w-px h-3 bg-slate-200" />
                <p className={`text-[12.4px] font-bold truncate ${isNormal ? 'text-slate-500' : 'text-slate-700'}`}>
                  {threatLevelText}
                </p>
              </div>
            </motion.div>


            {/* Event Focus Card & Gadgets - Strict 0.4cm Vertical Flow */}
            <div className="flex flex-col gap-[0.4cm] mb-[0.4cm]">
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-white rounded-sm shadow-soft border border-slate-100 min-h-[80px]"
              >
                <div className="p-3.5 h-full">
                  <EventFocus
                    risks={risks}
                    top3Risks={top3Risks}
                    hideIcons={true}
                    onFocusLog={handleFocusLog}
                  />
                </div>
              </motion.div>

              {/* Neural Sync Matrix - Tactical Console Relocation */}
              <AnimatePresence>
                {(activeTab === 'dashboard' || activeTab === 'insight') && showMatrix && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="mb-[0.4cm]"
                    >
                      <div className="w-[300px] mb-[0.4cm] px-3 flex justify-start">
                      <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-400/80">
                        System Health Monitor
                      </span>
                    </div>
                    <NeuralSyncMatrix 
                      connectionStatus={connectionStatus} 
                      onHover={setActiveDomainId}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Trend Analysis Matrix - Tactical Console Relocation */}
              {showLogs && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="mb-[0.4cm]"
                >
                  <TrendAnalyzer 
                    history={history} 
                    activeDomainId={activeDomainId}
                    language={'th'}
                  />
                </motion.div>
              )}

              {/* Weather & PM2.5 - Moved from Insight Tab */}
              {showWeather && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-sm shadow-soft border border-slate-100 overflow-hidden h-[230px]"
                >
                  <WeatherWidget
                    weather={weather}
                    onRemove={() => setShowWeather(false)}
                    onRefresh={refresh}
                  />
                </motion.div>
              )}
            </div>
          </>
        ) : activeTab === 'insight' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-[0.4cm] pb-32"
          >
            <ThreatDeepDive risks={risks} />
            <AlertEvents risks={risks} alerts={alerts} />
          </motion.div>
        ) : activeTab === 'settings' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-8 pb-12"
          >
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-black text-slate-800 tracking-tight">การตั้งค่าระบบ</h2>
            </div>

            {/* API Status Table Section */}
            <div className="bg-slate-900 rounded-sm p-6 shadow-2xl border border-slate-800">
              <APIStatusTable
                apiStatus={apiStatus}
                connectionStatus={connectionStatus}
                risks={risks}
                logs={logs}
                dailySummary={dailySummary}
              />
            </div>

            {/* Data Lifecycle Map Section */}
            <div className="bg-slate-900 rounded-sm p-6 shadow-2xl border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">ผังการไหลของข้อมูล (Data Flow)</h3>
              </div>
              <DataLifecycleMap logs={logs} />
            </div>

            {/* Radar Theme Selection Section */}
            <div className="bg-slate-900 rounded-sm p-6 shadow-2xl border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">ปรับแต่งรูปแบบเรดาร์ (Radar Themes)</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {[
                  { id: 'default', label: 'มาตรฐาน', color: 'bg-white' },
                  { id: 'tactical', label: 'ยุทธวิธี', color: 'bg-slate-950' },
                  { id: 'minimal', label: 'มินิมอล', color: 'bg-white/40' },
                  { id: 'brutalist', label: 'เทคนิคอล', color: 'bg-[#f5f5f5]' },
                  { id: 'organic', label: 'ธรรมชาติ', color: 'bg-stone-50' },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setRadarTheme(theme.id as any)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-sm border transition-all ${radarTheme === theme.id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-full border border-slate-600 ${theme.color}`} />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Terms of Service Link Section */}
            <div className="bg-slate-900 rounded-sm p-6 shadow-2xl border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">ข้อมูลทางกฎหมาย (Legal Information)</h3>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setActiveTab('tos')}
                  className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 rounded-sm border border-slate-700 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-200">ข้อกำหนดการใช้งาน (Terms of Service)</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tight">ลิขสิทธิ์และการใช้งานข้อมูล</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                </button>

                <button
                  onClick={() => {
                    localStorage.removeItem('disclaimer_accepted');
                    setShowDisclaimer(true);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 rounded-sm border border-slate-700 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-amber-500" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-200">แสดงข้อตกลงการใช้งานอีกครั้ง</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tight">Reset Welcome Disclaimer</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                    <ShieldAlert className="w-4 h-4 text-white" />
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'tos' ? (
          <TermsOfService onBack={() => setActiveTab('settings')} />
        ) : (
          /* Default to Events (News) Tab - Show AI Analysis Here */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="pb-24"
          >
            <ThreatIntelligenceReport
              logs={logs}
              focusedLogId={focusedLogId}
            />
          </motion.div>
        )}



        {/* Footer Copyright Notice */}
        <div className="mt-12 pb-8 border-t border-slate-200 pt-8 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-2">
            © 2026 ATMOSPHERIC BLISS MONITORING
          </p>
          <p className="text-[9px] text-slate-400 leading-relaxed max-w-[280px] mx-auto">
            ข้อมูลทั้งหมดถูกรวบรวมและวิเคราะห์โดยระบบ AI อัจฉริยะ ภายใต้ข้อกำหนดการใช้งานที่เป็นธรรม (Fair Use)
          </p>
          <button
            onClick={() => setActiveTab('tos')}
            className="mt-4 text-[9px] text-emerald-600 font-black uppercase tracking-widest hover:underline"
          >
            อ่านข้อกำหนดการใช้งาน
          </button>
        </div>
      </main>

      <BottomNav
        risks={risks}
        onToggleLogs={() => setShowLogs(!showLogs)}
        onToggleWeather={() => setShowWeather(!showWeather)}
        onToggleMatrix={() => setShowMatrix(!showMatrix)}
        isLogsVisible={showLogs}
        isWeatherVisible={showWeather}
        isMatrixVisible={showMatrix}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        connectionStatus={connectionStatus}
      />
    </div>
  );
}
