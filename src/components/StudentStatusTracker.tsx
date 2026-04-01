import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

type Status = 'داخل المدرسة' | 'خارج المدرسة' | 'مستدعى للوكيل';
type ActionType = 'إصدار خروج من المدرسة' | 'إصدار دخول للفصل' | 'استدعاء للوكيل';

interface LogEntry {
  id: string;
  action: ActionType;
  timestamp: string;
  previousStatus: Status;
  newStatus: Status;
}

export default function StudentStatusTracker() {
  const [currentStatus, setCurrentStatus] = useState<Status>('داخل المدرسة');
  const [movementLog, setMovementLog] = useState<LogEntry[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'داخل المدرسة': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'خارج المدرسة': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'مستدعى للوكيل': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getActionTargetStatus = (action: ActionType): Status => {
    switch (action) {
      case 'إصدار خروج من المدرسة': return 'خارج المدرسة';
      case 'إصدار دخول للفصل': return 'داخل المدرسة';
      case 'استدعاء للوكيل': return 'مستدعى للوكيل';
    }
  };

  const handleActionClick = (action: ActionType) => {
    if (action === 'إصدار دخول للفصل' && currentStatus === 'خارج المدرسة') {
      setPendingAction(action);
      setShowWarningModal(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = (action: ActionType) => {
    const newStatus = getActionTargetStatus(action);
    
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      timestamp: new Date().toLocaleString('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      previousStatus: currentStatus,
      newStatus
    };

    setCurrentStatus(newStatus);
    setMovementLog(prev => [newLog, ...prev]);
    setShowWarningModal(false);
    setPendingAction(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8" dir="rtl">
      {/* Header & Status */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black">
            أم
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 mb-1">أنس محمد</h2>
            <p className="text-slate-500 font-bold text-sm">الصف الثاني ثانوي - أ | الرقم الأكاديمي: 43521</p>
          </div>
        </div>
        <motion.div 
          layout
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          key={currentStatus}
          className={`px-6 py-3 rounded-2xl border-2 font-black text-lg flex items-center gap-3 shadow-sm ${getStatusColor(currentStatus)}`}
        >
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            currentStatus === 'داخل المدرسة' ? 'bg-emerald-500' : 
            currentStatus === 'خارج المدرسة' ? 'bg-rose-500' : 'bg-amber-500'
          }`} />
          {currentStatus}
        </motion.div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => handleActionClick('إصدار دخول للفصل')}
          className="flex flex-col items-center justify-center gap-4 p-6 bg-white border-2 border-slate-100 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-100/50 rounded-3xl transition-all group"
        >
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
            <LogIn className="w-7 h-7" />
          </div>
          <span className="font-black text-slate-700 text-lg">إصدار دخول للفصل</span>
        </button>

        <button 
          onClick={() => handleActionClick('إصدار خروج من المدرسة')}
          className="flex flex-col items-center justify-center gap-4 p-6 bg-white border-2 border-slate-100 hover:border-rose-500 hover:shadow-xl hover:shadow-rose-100/50 rounded-3xl transition-all group"
        >
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-100 transition-all">
            <LogOut className="w-7 h-7" />
          </div>
          <span className="font-black text-slate-700 text-lg">إصدار خروج من المدرسة</span>
        </button>

        <button 
          onClick={() => handleActionClick('استدعاء للوكيل')}
          className="flex flex-col items-center justify-center gap-4 p-6 bg-white border-2 border-slate-100 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-100/50 rounded-3xl transition-all group"
        >
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-100 transition-all">
            <AlertCircle className="w-7 h-7" />
          </div>
          <span className="font-black text-slate-700 text-lg">استدعاء للوكيل</span>
        </button>
      </div>

      {/* Timeline */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            سجل التتبع الزمني (Audit Log)
          </h3>
          <span className="text-sm font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">
            {movementLog.length} حركات مسجلة
          </span>
        </div>
        
        <div className="relative pl-4 md:pl-0">
          {/* Vertical Line */}
          <div className="absolute right-6 md:right-1/2 top-0 bottom-0 w-0.5 bg-slate-100 transform md:translate-x-px" />
          
          <div className="space-y-8">
            <AnimatePresence>
              {movementLog.length === 0 ? (
                <p className="text-center text-slate-400 font-bold py-12 relative z-10 bg-white">لا توجد حركات مسجلة حتى الآن</p>
              ) : (
                movementLog.map((log, index) => (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
                  >
                    {/* Timeline Dot */}
                    <div className="absolute right-6 md:right-1/2 w-4 h-4 rounded-full border-4 border-white bg-indigo-400 shadow-sm transform translate-x-1.5 md:translate-x-2 z-10" />
                    
                    {/* Content Card */}
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] mr-12 md:mr-0 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-800 text-lg">{log.action}</span>
                          <span className="text-xs font-bold text-slate-400 tabular-nums bg-slate-50 px-2 py-1 rounded-md">{log.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold mt-2">
                          <span className="text-slate-400">تغيرت الحالة إلى:</span>
                          <span className={`px-2 py-0.5 rounded-md text-xs ${
                            log.newStatus === 'داخل المدرسة' ? 'bg-emerald-50 text-emerald-600' :
                            log.newStatus === 'خارج المدرسة' ? 'bg-rose-50 text-rose-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {log.newStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Warning Modal */}
      <AnimatePresence>
        {showWarningModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100"
            >
              <div className="p-8 bg-rose-50/50 flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-rose-900 mb-3">تنبيه تعارض حالة!</h3>
                  <p className="text-slate-600 font-bold leading-relaxed text-lg">
                    الطالب مسجل حالياً بأنه <span className="font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-lg mx-1">خارج المدرسة</span>
                    <br/>هل تريد تأكيد عودته ودخوله للفصل؟
                  </p>
                </div>
              </div>
              <div className="p-6 flex gap-3 bg-white border-t border-slate-100">
                <button 
                  onClick={() => pendingAction && executeAction(pendingAction)}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-black text-lg transition-colors shadow-lg shadow-rose-200"
                >
                  تأكيد العودة
                </button>
                <button 
                  onClick={() => {
                    setShowWarningModal(false);
                    setPendingAction(null);
                  }}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-lg transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
