import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, Scale, ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-6 pb-20"
    >
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">ข้อกำหนดการใช้งาน (Terms of Service)</h2>
      </div>

      <div className="bg-white rounded-sm p-6 shadow-soft border border-slate-100 flex flex-col gap-8">
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">1. บทนำ</h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            ยินดีต้อนรับสู่แอปพลิเคชัน Monitoring ของเรา การเข้าใช้งานแอปพลิเคชันนี้ถือว่าคุณยอมรับข้อกำหนดและเงื่อนไขการใช้งานเหล่านี้ โปรดอ่านอย่างละเอียด
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">2. การใช้ข้อมูลและการวิเคราะห์</h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            แอปพลิเคชันนี้ใช้เทคโนโลยี AI ในการดึงข้อมูลจากแหล่งข้อมูลสาธารณะและแหล่งข้อมูลที่ได้รับอนุญาตเพื่อนำมาวิเคราะห์และแสดงผลในรูปแบบ Monitoring
          </p>
          <ul className="list-disc list-inside text-slate-600 text-sm space-y-2 ml-2">
            <li>ข้อมูลที่แสดงเป็นการวิเคราะห์เชิงสถิติและแนวโน้ม</li>
            <li>เราพยายามอย่างเต็มที่เพื่อให้ข้อมูลมีความถูกต้องและเป็นปัจจุบัน</li>
            <li>การนำข้อมูลไปใช้ต่อควรมีการอ้างอิงแหล่งที่มาอย่างเหมาะสม</li>
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">3. ลิขสิทธิ์และทรัพย์สินทางปัญญา</h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            เนื้อหา การออกแบบ และเทคโนโลยีที่พัฒนาขึ้นในแอปพลิเคชันนี้เป็นทรัพย์สินทางปัญญาของเรา สำหรับข้อมูลที่ดึงมาจากแหล่งภายนอก ลิขสิทธิ์ยังคงเป็นของเจ้าของข้อมูลต้นทาง เรานำมาใช้ภายใต้หลักการวิเคราะห์ข้อมูลเพื่อประโยชน์สาธารณะและการใช้งานที่เป็นธรรม (Fair Use)
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">4. ข้อจำกัดความรับผิดชอบ</h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            เราไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดจากการนำข้อมูลในแอปพลิเคชันนี้ไปใช้ในการตัดสินใจโดยไม่มีการตรวจสอบเพิ่มเติม ข้อมูลนี้มีวัตถุประสงค์เพื่อการเฝ้าระวังและแจ้งเตือนเบื้องต้นเท่านั้น
          </p>
        </section>

        <div className="pt-6 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold text-center">
            ปรับปรุงล่าสุดเมื่อ: 1 เมษายน 2569
          </p>
        </div>
      </div>
    </motion.div>
  );
};
