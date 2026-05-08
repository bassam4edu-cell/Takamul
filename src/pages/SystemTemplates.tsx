import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Save, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { logAction } from '../services/auditLogger';

const SystemTemplates: React.FC = () => {
  const [absenceTemplate, setAbsenceTemplate] = useState('');
  const [passTemplate, setPassTemplate] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const defaultAbsenceTemplate = "المكرم ولي أمر الطالب {اسم_الطالب}، نود إشعاركم بغياب ابنكم اليوم {التاريخ} عن {الحصة}. إدارة {اسم_المدرسة}.";
  const defaultPassTemplate = `*إشعار إذن تحرك طالب* 🎫
--------------------------
*الطالب:* {اسم_الطالب}
*الإجراء:* {الاجراء}
*السبب:* {السبب}
--------------------------
*رابط التأكيد السريع:*
{رابط_التأكيد}

الرجاء النقر على الرابط لتأكيد الحالة.`;

  useEffect(() => {
    apiFetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.absence_template) {
          setAbsenceTemplate(data.absence_template);
        } else {
          setAbsenceTemplate(defaultAbsenceTemplate);
        }
        if (data.pass_template) {
          setPassTemplate(data.pass_template);
        } else {
          setPassTemplate(defaultPassTemplate);
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await apiFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            absence_template: absenceTemplate,
            pass_template: passTemplate
          }
        })
      });
      if (res.ok) {
        logAction(
          'أخرى',
          'UPDATE',
          'قوالب النظام',
          'قام بتحديث قوالب النظام'
        );
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert('فشل حفظ القالب');
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable: string, type: 'absence' | 'pass') => {
    if (type === 'absence') {
      setAbsenceTemplate(prev => prev + variable);
    } else {
      setPassTemplate(prev => prev + variable);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-6 bg-primary rounded-full inline-block"></span>
            قالب إشعار الغياب
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            قم بتخصيص الصيغة الافتراضية لرسائل الغياب التي ترسل تلقائياً للطلاب.
          </p>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-1">المتغيرات الذكية (Variables)</p>
              <p>
                النظام سيقوم تلقائياً باستبدال الكلمات بين الأقواس {'{ }'} بالبيانات الحقيقية للطالب عند الإرسال الفعلي. 
                اضغط على المتغير لإدراجه في النص.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">المتغيرات المتاحة:</label>
            <div className="flex flex-wrap gap-2">
              {['{اسم_الطالب}', '{التاريخ}', '{الحصة}', '{اسم_المدرسة}'].map(variable => (
                <button
                  key={variable}
                  onClick={() => insertVariable(variable, 'absence')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200"
                >
                  {variable}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">صيغة الرسالة:</label>
            <textarea
              value={absenceTemplate}
              onChange={(e) => setAbsenceTemplate(e.target.value)}
              className="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-700 min-h-[150px] resize-y"
              dir="rtl"
            />
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-500 rounded-full inline-block"></span>
            قالب إشعار إذن الطالب
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            قم بتخصيص الصيغة الافتراضية لرسائل الأذونات التي ترسل للمعلمين عبر الواتساب.
          </p>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">المتغيرات المتاحة:</label>
            <div className="flex flex-wrap gap-2">
              {['{اسم_الطالب}', '{الاجراء}', '{السبب}', '{رابط_التأكيد}'].map(variable => (
                <button
                  key={variable}
                  onClick={() => insertVariable(variable, 'pass')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200"
                >
                  {variable}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">صيغة الرسالة:</label>
            <textarea
              value={passTemplate}
              onChange={(e) => setPassTemplate(e.target.value)}
              className="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-700 min-h-[200px] resize-y"
              dir="rtl"
            />
          </div>
        </div>
      </motion.div>

      <div className="pt-4 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-70"
        >
          <Save size={20} />
          {saving ? 'جاري الحفظ...' : 'حفظ القوالب'}
        </button>
        
        {success && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-emerald-600 font-bold text-sm flex items-center gap-1"
          >
            تم الحفظ بنجاح 
          </motion.span>
        )}
      </div>
    </div>
  );
};

export default SystemTemplates;
