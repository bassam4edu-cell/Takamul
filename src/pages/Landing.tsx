import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSystemClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden font-['Tajawal']" dir="rtl">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#006C35 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50/50 via-transparent to-blue-50/50 pointer-events-none"></div>

      {/* Top Right Header */}
      <header className="absolute top-6 right-6 md:top-12 md:right-12 text-right z-10">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-0.5 md:space-y-1"
        >
          <h2 className="text-sm md:text-xl font-bold text-slate-800">المملكة العربية السعودية</h2>
          <h3 className="text-xs md:text-lg font-semibold text-slate-700">وزارة التعليم</h3>
          <p className="text-[10px] md:text-base text-slate-600">الإدارة العامة للتعليم بمنطقة الرياض</p>
          <p className="text-[10px] md:text-sm text-emerald-700 font-bold">ثانوية أم القرى بالخرج</p>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 md:px-6 py-24 md:py-20 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col items-center text-center space-y-8 md:space-y-12 max-w-4xl w-full"
        >
          {/* Logo */}
          <div className="relative">
            <motion.div
              animate={{ 
                y: [0, -8, 0],
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <img 
                src="https://i.ibb.co/11D74Jg/222.png" 
                alt="شعار ثانوية أم القرى" 
                className="w-40 md:w-64 lg:w-80 h-auto drop-shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-3 bg-black/5 blur-xl rounded-full"></div>
          </div>

          {/* Title Section */}
          <div className="space-y-3 md:space-y-4">
            <h1 className="text-3xl md:text-6xl font-black text-slate-900 tracking-tight font-display">
              بوابة التحول الرقمي
            </h1>
            <div className="h-1 w-16 md:h-1.5 md:w-24 bg-emerald-600 mx-auto rounded-full"></div>
          </div>

          {/* Buttons Container */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full max-w-3xl pt-4 md:pt-8">
            <motion.a
              href="https://sites.google.com/view/ummal/%D8%A7%D9%84%D8%B5%D9%81%D8%AD%D8%A9-%D8%A7%D9%84%D8%B1%D8%A6%D9%8A%D8%B3%D9%8A%D8%A9?authuser=0"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full md:flex-1 bg-white text-slate-800 border-2 border-slate-100 py-5 md:py-6 px-4 md:px-6 rounded-2xl md:rounded-[2rem] font-bold text-base md:text-lg shadow-xl shadow-slate-200/50 flex items-center justify-center gap-3 hover:border-emerald-500/30 hover:text-emerald-700 transition-all group"
            >
              <span className="w-8 h-8 md:w-10 md:h-10 bg-emerald-50 text-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-6 md:h-6"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              </span>
              <span className="whitespace-nowrap">الوثائق المدرسية</span>
            </motion.a>

            <motion.button
              onClick={() => navigate('/parent-login')}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full md:flex-1 bg-white text-slate-800 border-2 border-slate-100 py-5 md:py-6 px-4 md:px-6 rounded-2xl md:rounded-[2rem] font-bold text-base md:text-lg shadow-xl shadow-slate-200/50 flex items-center justify-center gap-3 hover:border-indigo-500/30 hover:text-indigo-700 transition-all group"
            >
              <span className="w-8 h-8 md:w-10 md:h-10 bg-indigo-50 text-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-6 md:h-6"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <span className="whitespace-nowrap">بوابة ولي الأمر</span>
            </motion.button>

            <motion.button
              onClick={handleSystemClick}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full md:flex-1 bg-white text-slate-800 border-2 border-slate-100 py-5 md:py-6 px-4 md:px-6 rounded-2xl md:rounded-[2rem] font-bold text-base md:text-lg shadow-xl shadow-slate-200/50 flex items-center justify-center gap-3 hover:border-blue-500/30 hover:text-blue-700 transition-all group"
            >
              <span className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 text-blue-600 rounded-lg md:rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-6 md:h-6"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
              </span>
              <span className="whitespace-nowrap">نظام تحويل طالب</span>
            </motion.button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-8 w-full text-center text-slate-400 text-xs font-bold z-10">
        <p>© 2026 ثانوية أم القرى بالخرج - جميع الحقوق محفوظة</p>
        <p className="text-[10px] mt-1 opacity-70">برمجة: بسام العنزي</p>
      </footer>
    </div>
  );
};

export default Landing;
