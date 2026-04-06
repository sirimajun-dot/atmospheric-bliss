import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Info, X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface WelcomeDisclaimerProps {
  isOpen: boolean;
  onAccept: () => void;
}

export const WelcomeDisclaimer: React.FC<WelcomeDisclaimerProps> = ({ isOpen, onAccept }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="bg-amber-500 p-6 text-white flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight leading-tight">
                  ข้อตกลงการใช้งาน<br />
                  <span className="text-sm font-bold opacity-90 uppercase tracking-widest">Prototype Version</span>
                </h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="flex gap-4">
                <div className="shrink-0 mt-1">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-1">แอปพลิเคชันตัวต้นแบบ (Prototype Only)</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    แอปนี้อยู่ในขั้นตอนการพัฒนาเพื่อทดสอบแนวคิดเท่านั้น ระบบอาจมีความไม่เสถียรหรือข้อมูลที่ยังไม่สมบูรณ์
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 mt-1">
                  <Info className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-1">การคุ้มครองข้อมูลส่วนบุคคล (PDPA)</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    เพื่อความปลอดภัย <span className="text-red-500 font-bold">ห้ามกรอกข้อมูลจริง</span> เช่น ชื่อ-นามสกุล, เลขบัตรประชาชน หรือข้อมูลความลับขององค์กร โปรดใช้ข้อมูลสมมติในการทดสอบเท่านั้น
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 mt-1">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-1">ข้อจำกัดของ AI</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    ผลการวิเคราะห์ประมวลผลโดย AI อัจฉริยะ ซึ่งอาจมีความคลาดเคลื่อนได้ ไม่ควรนำไปใช้อ้างอิงทางกฎหมายหรือการตัดสินใจที่สำคัญโดยตรง
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 mt-1">
                  <ShieldAlert className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-1">ลิขสิทธิ์และสิทธิ์ในเนื้อหา</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    แอปนี้เป็นเครื่องมือรวบรวมดัชนีเนื้อหา (Indexing Tool) เพื่อการศึกษาและการเฝ้าระวังส่วนบุคคล ลิขสิทธิ์ข่าวและข้อมูลทั้งหมดเป็นของสำนักข่าวต้นทาง โดยระบบจะระบุแหล่งที่มาอย่างชัดเจน
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-0">
              <button
                onClick={onAccept}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl transition-all transform active:scale-95 shadow-xl shadow-slate-900/20 uppercase tracking-widest text-xs"
              >
                ยอมรับและเข้าสู่แอปพลิเคชัน
              </button>
              <p className="text-[9px] text-center text-slate-400 mt-4 uppercase tracking-tighter">
                การกดปุ่มด้านบนแสดงว่าคุณเข้าใจและยอมรับเงื่อนไขการทดสอบนี้
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
