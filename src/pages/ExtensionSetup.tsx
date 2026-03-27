import React, { useState } from 'react';
import { motion } from 'framer-motion';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { 
  Download, 
  Copy, 
  CheckCircle2, 
  PlayCircle, 
  AlertCircle, 
  Puzzle, 
  FolderOpen, 
  Settings, 
  ToggleRight, 
  UploadCloud,
  ChevronLeft,
  RefreshCw
} from 'lucide-react';

const ExtensionSetup: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('chrome://extensions');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const apiUrl = window.location.origin;

      const manifestContent = `{
  "manifest_version": 3,
  "name": "محرك الرصد الآلي - تكامل",
  "version": "1.0",
  "description": "إضافة متصفح لربط نظام نور بمنصة تكامل لرصد الدرجات والغياب آلياً.",
  "permissions": [
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://noor.moe.gov.sa/*",
    "${apiUrl}/*"
  ],
  "content_scripts": [
    {
      "matches": ["https://noor.moe.gov.sa/*"],
      "js": ["content.js"]
    }
  ]
}`;

      const contentJsContent = `
// --- Takamol Noor Sync Engine Chrome Extension ---
const API_URL = "${apiUrl}/api/get-takamol-grades";

function injectFloatingButton() {
  if (document.getElementById('takamol-sync-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'takamol-sync-btn';
  btn.innerHTML = '🚀 رصد درجات تكامل';
  btn.style.cssText = \`
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 999999;
    background-color: #059669;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: 'Tajawal', sans-serif;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
  \`;

  btn.onmouseover = () => btn.style.transform = 'translateY(-2px)';
  btn.onmouseout = () => btn.style.transform = 'translateY(0)';

  btn.onclick = handleSync;

  document.body.appendChild(btn);
}

async function handleSync() {
  const btn = document.getElementById('takamol-sync-btn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ جاري جلب البيانات...';
  btn.disabled = true;
  btn.style.backgroundColor = '#4B5563';

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('فشل الاتصال بالخادم');
    const gradesData = await response.json();

    let successCount = 0;

    // Noor system usually uses tables with specific IDs. 
    // We assume rows have inputs for grades.
    // This logic needs to be adapted to the exact HTML structure of Noor.
    const studentRows = document.querySelectorAll('tr[id^="gvDynamicStudentsMark_ctl"]');

    studentRows.forEach(row => {
      // Find the cell containing the National ID (usually a span or text node)
      // This is a heuristic and might need adjustment based on Noor's actual DOM
      const rowText = row.innerText; 
      
      const studentData = gradesData.find(g => rowText.includes(g.nationalId));

      if (studentData) {
        // Find input fields in this row. 
        // Assuming 1st input is oral, 2nd is performance.
        const inputs = row.querySelectorAll('input[type="text"]');
        
        if (inputs.length >= 2) {
          inputs[0].value = studentData.oralScore;
          inputs[1].value = studentData.performanceScore;

          // Trigger events to ensure Noor's frontend registers the change
          inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
          inputs[0].dispatchEvent(new Event('blur', { bubbles: true }));
          
          inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
          inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
          inputs[1].dispatchEvent(new Event('blur', { bubbles: true }));

          // Highlight the row to show it was updated
          row.style.backgroundColor = '#d1fae5'; 
          successCount++;
        }
      }
    });

    btn.innerHTML = \`✅ تم رصد \${successCount} طالب\`;
    btn.style.backgroundColor = '#059669';
    alert(\`تمت المزامنة بنجاح! تم رصد درجات \${successCount} طالب.\`);

  } catch (error) {
    console.error('Sync Error:', error);
    btn.innerHTML = '❌ فشل الرصد';
    btn.style.backgroundColor = '#DC2626';
    alert('حدث خطأ أثناء الاتصال ببوابة تكامل. يرجى التأكد من تسجيل الدخول.');
  } finally {
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      btn.style.backgroundColor = '#059669';
    }, 5000);
  }
}

// Run when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectFloatingButton);
} else {
  injectFloatingButton();
}
`;

      zip.file("manifest.json", manifestContent);
      zip.file("content.js", contentJsContent);

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "takamol-noor-extension.zip");
    } catch (error) {
      console.error("Error generating zip:", error);
      alert("حدث خطأ أثناء تجهيز ملف الإضافة.");
    } finally {
      setIsDownloading(false);
    }
  };

  const steps = [
    {
      icon: FolderOpen,
      title: 'تحميل وفك الضغط',
      desc: 'حمل الملف المضغوط (ZIP) وفك الضغط عنه في مجلد على جهازك.',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    {
      icon: Settings,
      title: 'فتح صفحة الإضافات',
      desc: 'افتح صفحة الإضافات في متصفح كروم عبر الرابط chrome://extensions',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      action: (
        <button 
          onClick={handleCopy}
          className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm font-bold text-indigo-700 hover:bg-indigo-50 transition-colors"
        >
          {copied ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} />}
          {copied ? 'تم النسخ!' : 'نسخ الرابط'}
        </button>
      )
    },
    {
      icon: ToggleRight,
      title: 'تفعيل وضع المطور',
      desc: 'فعّل خيار "وضع المطور" (Developer Mode) في أعلى يسار الشاشة.',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    },
    {
      icon: UploadCloud,
      title: 'رفع الأداة',
      desc: 'اضغط على "تحميل أداة تم فك ضغطها" (Load unpacked) واختر المجلد.',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Hero Section */}
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute top-1/2 -right-24 w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-2">
            <Puzzle size={40} className="text-white" />
          </div>
          
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
              أداة الرصد الآلي المتقدمة 🚀
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              حمل إضافة المتصفح الخاصة بالمدرسة لربط بوابتنا بنظام نور بضغطة زر، دون الحاجة للانتظار. تقنية آمنة ومباشرة من جهازك.
            </p>
          </div>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`relative group overflow-hidden mt-4 px-8 py-4 rounded-2xl font-bold text-xl transition-all shadow-xl ${
              isDownloading 
                ? 'bg-emerald-100 text-emerald-700 shadow-emerald-100/50' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-1 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]'
            }`}
          >
            <div className="flex items-center gap-3 relative z-10">
              {isDownloading ? (
                <>
                  <RefreshCw className="animate-spin" size={28} />
                  جاري التحضير...
                </>
              ) : (
                <>
                  <Download size={28} className="group-hover:-translate-y-1 transition-transform" />
                  تحميل ملف الأداة (ZIP)
                </>
              )}
            </div>
            {!isDownloading && (
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Steps Guide */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="text-emerald-600" />
            دليل التثبيت السريع
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-2xl border ${step.border} ${step.bg} relative overflow-hidden group hover:shadow-md transition-all`}
              >
                <div className="absolute top-4 left-4 text-4xl font-black opacity-5">
                  0{index + 1}
                </div>
                <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm mb-4 ${step.color}`}>
                  <step.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  {index + 1}. {step.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {step.desc}
                </p>
                {step.action}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Video & Status */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <PlayCircle className="text-emerald-600" />
            شرح عملي
          </h2>
          
          {/* Video Placeholder */}
          <div className="bg-slate-900 rounded-2xl aspect-video relative overflow-hidden group cursor-pointer shadow-lg border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop" 
              alt="Video Thumbnail" 
              className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:bg-emerald-500 group-hover:border-emerald-400 transition-all group-hover:scale-110">
                <PlayCircle size={32} className="text-white ml-1" />
              </div>
            </div>
            <div className="absolute bottom-4 right-4 left-4 z-20 flex justify-between items-end">
              <div>
                <p className="text-white font-bold text-sm">طريقة التثبيت في 30 ثانية</p>
                <p className="text-slate-300 text-xs mt-1">شرح خطوة بخطوة</p>
              </div>
              <div className="bg-black/50 backdrop-blur-md px-2 py-1 rounded text-white text-xs font-mono">
                00:30
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">حالة الاتصال</h3>
            <div className="flex items-center gap-4 p-4 bg-rose-50 rounded-xl border border-rose-100">
              <div className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
              </div>
              <div>
                <p className="font-bold text-rose-800">الأداة غير متصلة بمتصفحك</p>
                <p className="text-xs text-rose-600 mt-1">يرجى تثبيت الأداة وتفعيلها للبدء</p>
              </div>
            </div>
            
            <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
              <AlertCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <p>بمجرد تثبيت الأداة بنجاح، ستتحول هذه الحالة إلى اللون الأخضر تلقائياً.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtensionSetup;
