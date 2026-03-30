import React, { useState, useEffect } from 'react';
import { Download, Puzzle, Settings, CheckCircle, AlertCircle, RefreshCw, Key } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useAuth } from '../context/AuthContext';

const ExtensionSetup: React.FC = () => {
  const { user } = useAuth();
  const [syncCode, setSyncCode] = useState<string | null>(null);
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  useEffect(() => {
    fetchSyncCode();
  }, []);

  const fetchSyncCode = async () => {
    if (!user) return;
    try {
      setIsLoadingCode(true);
      const res = await fetch(`/api/extension/sync-code?teacher_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setSyncCode(data.syncCode);
      }
    } catch (error) {
      console.error('Error fetching sync code:', error);
    } finally {
      setIsLoadingCode(false);
    }
  };

  const generateSyncCode = async () => {
    if (!user) return;
    try {
      setIsLoadingCode(true);
      const res = await fetch('/api/extension/sync-code/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ teacher_id: user.id })
      });
      if (res.ok) {
        const data = await res.json();
        setSyncCode(data.syncCode);
      }
    } catch (error) {
      console.error('Error generating sync code:', error);
    } finally {
      setIsLoadingCode(false);
    }
  };

  const handleDownload = async () => {
    try {
      const zip = new JSZip();
      
      // Fetch manifest.json
      const manifestRes = await fetch('/extension/manifest.json');
      const manifestText = await manifestRes.text();
      zip.file('manifest.json', manifestText);
      
      // Fetch content.js
      const contentRes = await fetch('/extension/content.js');
      const contentText = await contentRes.text();
      
      // Replace the placeholder API_BASE_URL with the actual current origin
      const currentOrigin = window.location.origin;
      const apiBaseUrl = `${currentOrigin}/api`;
      
      const updatedContentText = contentText.replace(
        /const API_BASE_URL = ".*?";/,
        `const API_BASE_URL = "${apiBaseUrl}";`
      );
      
      zip.file('content.js', updatedContentText);
      
      // Generate ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'takamol-extension.zip');
      
    } catch (error) {
      console.error('Error generating extension ZIP:', error);
      alert('حدث خطأ أثناء تحميل الإضافة. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
            <Puzzle size={48} className="text-emerald-100" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            أداة الرصد الآلي المتقدمة 🚀
          </h1>
          <p className="text-lg md:text-xl text-emerald-50 max-w-2xl leading-relaxed">
            حمل إضافة المتصفح الخاصة بالمدرسة لربط بوابتنا بنظام نور بضغطة زر، دون الحاجة للانتظار أو الإدخال اليدوي.
          </p>
          
          <button
            onClick={handleDownload}
            className="mt-4 group relative inline-flex items-center justify-center gap-3 px-8 py-4 font-bold text-emerald-700 bg-white rounded-full overflow-hidden shadow-2xl transition-transform hover:scale-105 active:scale-95"
          >
            <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
            <Download size={24} className="animate-bounce" />
            <span className="text-lg">تحميل ملف الأداة (ZIP) 📥</span>
          </button>
        </div>
      </div>

      {/* Sync Code Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2">
            <Key className="text-blue-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">كود الربط السريع</h2>
          <p className="text-slate-600 max-w-md mx-auto">
            أدخل هذا الكود في الإضافة عند طلبها لمرة واحدة لربط حسابك بنظام نور.
          </p>
          
          <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center gap-4 min-w-[300px]">
            {isLoadingCode ? (
              <div className="animate-pulse flex space-x-4 space-x-reverse">
                <div className="h-12 bg-slate-200 rounded w-32"></div>
              </div>
            ) : syncCode ? (
              <div className="text-4xl font-mono font-bold text-slate-800 tracking-widest">
                {syncCode}
              </div>
            ) : (
              <div className="text-slate-500">لا يوجد كود ربط حالياً</div>
            )}
            
            <button
              onClick={generateSyncCode}
              disabled={isLoadingCode}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoadingCode ? 'animate-spin' : ''} />
              تحديث الكود
            </button>
          </div>
        </div>
      </div>

      {/* Installation Guide */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center flex items-center justify-center gap-2">
          <Settings className="text-emerald-600" />
          دليل التثبيت السريع
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="relative flex flex-col items-center text-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xl mb-4 shadow-sm">
              1
            </div>
            <h3 className="font-bold text-slate-800 mb-2">تحميل وفك الضغط</h3>
            <p className="text-sm text-slate-600">
              حمل الملف المضغوط (ZIP) من الزر أعلاه وفك الضغط عنه في مجلد على جهازك.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative flex flex-col items-center text-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xl mb-4 shadow-sm">
              2
            </div>
            <h3 className="font-bold text-slate-800 mb-2">فتح الإضافات</h3>
            <p className="text-sm text-slate-600">
              افتح صفحة الإضافات في متصفح كروم عبر كتابة <code className="bg-slate-200 px-1 rounded text-emerald-700 font-mono text-xs">chrome://extensions</code> في شريط العنوان.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative flex flex-col items-center text-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xl mb-4 shadow-sm">
              3
            </div>
            <h3 className="font-bold text-slate-800 mb-2">وضع المطور</h3>
            <p className="text-sm text-slate-600">
              فعّل خيار "وضع المطور" (Developer mode) الموجود في أعلى يمين/يسار الشاشة.
            </p>
          </div>

          {/* Step 4 */}
          <div className="relative flex flex-col items-center text-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xl mb-4 shadow-sm">
              4
            </div>
            <h3 className="font-bold text-slate-800 mb-2">تحميل الإضافة</h3>
            <p className="text-sm text-slate-600">
              اضغط على "تحميل إضافة تم فك ضغطها" (Load unpacked) واختر المجلد الذي قمت بفك ضغطه.
            </p>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 flex gap-4 items-start">
        <AlertCircle className="text-amber-600 shrink-0 mt-1" />
        <div>
          <h3 className="font-bold text-amber-800 mb-2">ملاحظات هامة:</h3>
          <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
            <li>هذه الإضافة تعمل فقط على متصفح Google Chrome أو المتصفحات المبنية على Chromium (مثل Edge و Brave).</li>
            <li>تأكد من تسجيل الدخول إلى نظام نور قبل استخدام الإضافة.</li>
            <li>الإضافة مصممة للعمل حصرياً في صفحة رصد الدرجات في نظام نور.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExtensionSetup;
