import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  History, 
  Timer, 
  User, 
  ShieldCheck,
  ChevronLeft,
  Search,
  Filter
} from 'lucide-react';
import { usePasses, PassStatus, PassType } from '../context/PassContext';
import { motion, AnimatePresence } from 'motion/react';

const PASS_TYPE_CONFIG = {
  entry: { label: 'دخول للفصل', color: 'bg-emerald-500', icon: CheckCircle2, textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  call: { label: 'استدعاء للوكيل', color: 'bg-orange-500', icon: AlertTriangle, textColor: 'text-orange-700', bgColor: 'bg-orange-50' },
  exit: { label: 'خروج من المدرسة', color: 'bg-rose-500', icon: XCircle, textColor: 'text-rose-700', bgColor: 'bg-rose-50' },
};

// Helper to avoid missing AlertTriangle
import { AlertTriangle } from 'lucide-react';

const TeacherPassManagement: React.FC = () => {
  const { passes, updatePassStatus } = usePasses();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter passes for the "current teacher" (simulated)
  // In a real app, we would filter by teacherId from auth
  const teacherPasses = passes.filter(p => 
    searchQuery === '' || p.studentName.includes(searchQuery)
  );

  const activePasses = teacherPasses.filter(p => p.status === 'pending');
  const historyPasses = teacherPasses.filter(p => p.status !== 'pending');

  const displayPasses = activeTab === 'active' ? activePasses : historyPasses;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">مركز إدارة أذونات الطلاب</h2>
          <p className="text-slate-500 text-sm font-medium">إدارة وتأكيد وصول الطلاب للفصل</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'active' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Timer className="w-4 h-4" />
            أذونات نشطة
            {activePasses.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                {activePasses.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'history' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            السجل الكامل
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="البحث باسم الطالب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pr-12 pl-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>
        <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Pass Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {displayPasses.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full bg-white p-12 rounded-[2.5rem] border border-slate-200 text-center space-y-4"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <div>
                <p className="text-slate-800 font-black text-xl">لا توجد أذونات حالياً</p>
                <p className="text-slate-400 font-medium">سيتم عرض الأذونات الجديدة هنا فور صدورها من الوكيل</p>
              </div>
            </motion.div>
          ) : (
            displayPasses.map((pass) => (
              <motion.div
                key={pass.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`relative bg-white p-5 rounded-[2rem] border-2 transition-all group ${
                  pass.status === 'pending' ? 'border-indigo-100 shadow-lg shadow-indigo-50' : 'border-slate-100'
                }`}
              >
                {pass.status === 'pending' && (
                  <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-10">
                    جديد
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Icon Section */}
                  <div className={`p-4 rounded-2xl ${PASS_TYPE_CONFIG[pass.type].color} text-white shadow-lg`}>
                    {React.createElement(PASS_TYPE_CONFIG[pass.type].icon, { className: 'w-6 h-6' })}
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-black text-slate-900">{pass.studentName}</h4>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {pass.timestamp}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold">
                        <User className="w-3 h-3" />
                        {pass.agentName}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${PASS_TYPE_CONFIG[pass.type].bgColor} ${PASS_TYPE_CONFIG[pass.type].textColor}`}>
                        {PASS_TYPE_CONFIG[pass.type].label}
                      </span>
                    </div>

                    {pass.reason && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 italic">
                        "{pass.reason}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Section */}
                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between gap-3">
                  {pass.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => updatePassStatus(pass.id, 'confirmed')}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-2xl font-black text-sm transition-all shadow-md shadow-emerald-100 active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        تأكيد الوصول ✅
                      </button>
                      <button
                        onClick={() => updatePassStatus(pass.id, 'rejected')}
                        className="flex-1 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 py-3 rounded-2xl font-black text-sm transition-all active:scale-95"
                      >
                        <XCircle className="w-4 h-4" />
                        لم يصل ❌
                      </button>
                    </>
                  ) : (
                    <div className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm ${
                      pass.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {pass.status === 'confirmed' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          تم التأكيد بنجاح
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          تم الرفض / لم يصل
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeacherPassManagement;
