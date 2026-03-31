import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRightLeft } from 'lucide-react';
import AgentPassDashboard from '../components/AgentPassDashboard';
import TeacherQuickConfirm from '../components/TeacherQuickConfirm';

const SmartPassSystem = () => {
  const [view, setView] = useState<'agent' | 'teacher'>('agent');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toggle View Switcher */}
      <div className="fixed top-6 left-6 z-50">
        <button 
          onClick={() => setView(view === 'agent' ? 'teacher' : 'agent')}
          className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-xl hover:shadow-2xl transition-all font-black text-slate-700 group"
        >
          <ArrowRightLeft className="w-5 h-5 text-indigo-600 group-hover:rotate-180 transition-transform duration-500" />
          {view === 'agent' ? 'عرض شاشة جوال المعلم' : 'العودة لواجهة الوكيل'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === 'agent' ? (
          <motion.div
            key="agent"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            <AgentPassDashboard />
          </motion.div>
        ) : (
          <motion.div
            key="teacher"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <TeacherQuickConfirm />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="fixed bottom-6 right-6 text-slate-400 text-[10px] font-bold uppercase tracking-widest pointer-events-none">
        Smart Pass System v1.0 • AI Studio Build
      </div>
    </div>
  );
};

export default SmartPassSystem;
