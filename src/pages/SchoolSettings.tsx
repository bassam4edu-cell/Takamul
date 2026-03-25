import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Building2, UserCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useSchoolSettings } from '../context/SchoolContext';

const SchoolSettings: React.FC = () => {
  const { settings, updateSettings, isLoading } = useSchoolSettings();
  const [formData, setFormData] = useState({
    schoolName: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!isLoading) {
      setFormData({
        schoolName: settings.schoolName || '',
      });
    }
  }, [settings, isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage({ type: '', text: '' });

    try {
      await updateSettings(formData);
      setSaveMessage({ type: 'success', text: 'تم حفظ الإعدادات المركزية بنجاح' });
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ الإعدادات' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-teal-100 text-teal-700 rounded-xl">
          <Building2 size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">إعدادات المدرسة المركزية</h1>
          <p className="text-slate-500 text-sm mt-1">إدارة الكليشة الرسمية وبيانات الاعتماد للتقارير</p>
        </div>
      </div>

      {saveMessage.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg font-medium ${
            saveMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {saveMessage.text}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Official Header Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6 text-teal-800 border-b border-slate-100 pb-4">
            <Building2 size={20} />
            <h2 className="text-lg font-bold">الكليشة الرسمية (Official Header)</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">اسم المدرسة</label>
              <input
                type="text"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleChange}
                placeholder="مثال: ثانوية أم القرى"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Branding Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 opacity-75">
          <div className="flex items-center gap-2 mb-6 text-teal-800 border-b border-slate-100 pb-4">
            <ImageIcon size={20} />
            <h2 className="text-lg font-bold">الهوية البصرية (Branding)</h2>
          </div>
          
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-not-allowed bg-slate-50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <ImageIcon className="w-8 h-8 mb-3 text-slate-400" />
                <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">اضغط لرفع شعار المدرسة</span></p>
                <p className="text-xs text-slate-400">(ميزة الرفع ستتوفر قريباً)</p>
              </div>
              <input type="file" className="hidden" disabled />
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>💾 حفظ الإعدادات المركزية</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SchoolSettings;
