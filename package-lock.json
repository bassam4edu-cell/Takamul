import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  ShieldCheck,
  AlertCircle,
  Loader2,
  Smartphone,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePasses } from '../context/PassContext';

const TeacherQuickConfirm: React.FC = () => {
  const { passId } = useParams<{ passId: string }>();
  const { passes, updatePassStatus } = usePasses();
  const [loading, setLoading] = useState(true);
  const [pass, setPass] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchPass = async () => {
      try {
        // First check if it's in the context
        const foundPass = passes.find(p => p.id === passId);
        if (foundPass) {
          setPass(foundPass);
          setLoading(false);
          return;
        }

        // If not, fetch from API
        const res = await fetch(`/api/passes/${passId}`);
        if (res.ok) {
          const data = await res.json();
          setPass(data);
        }
      } catch (error) {
        console.error('Failed to fetch pass:', error);
      } finally {
        setLoading(false);
      }
    };

    if (passId) {
      fetchPass();
    }
  }, [passId, passes]);

  const handleConfirm = async (status: 'confirmed' | 'rejected') => {
    setActionLoading(status);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    updatePassStatus(passId!, status);
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!pass) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center" dir="rtl">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-md w-full space-y-6">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">عذراً، الإذن غير موجود</h2>
            <p className="text-slate-500 font-medium">يبدو أن الرابط غير صحيح أو تم إلغاء الإذن من قبل الوكيل.</p>
          </div>
          <button 
            onClick={() => window.close()}
            className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black transition-all hover:bg-slate-200"
          >
            إغلاق الصفحة
          </button>
        </div>
      </div>
    );
  }

  const getWording = () => {
    switch (pass.type) {
      case 'entry':
        return {
          title: 'تأكيد دخول طالب للفصل',
          buttonConfirm: 'تأكيد دخول الطالب ✅',
          buttonReject: 'الطالب لم يدخل ❌',
          successConfirm: 'تم تأكيد الدخول بنجاح',
          successReject: 'تم تسجيل عدم دخول الطالب'
        };
      case 'call':
        return {
          title: 'تأكيد وصول طالب للوكيل',
          buttonConfirm: 'تأكيد وصول الطالب ✅',
          buttonReject: 'الطالب لم يصل ❌',
          successConfirm: 'تم تأكيد الوصول بنجاح',
          successReject: 'تم تسجيل عدم وصول الطالب'
        };
      case 'exit':
        return {
          title: 'تأكيد خروج طالب من المدرسة',
          buttonConfirm: 'تأكيد خروج الطالب ✅',
          buttonReject: 'الطالب لم يخرج ❌',
          successConfirm: 'تم تأكيد الخروج بنجاح',
          successReject: 'تم تسجيل عدم خروج الطالب'
        };
      default:
        return {
          title: 'تأكيد حالة طالب',
          buttonConfirm: 'تأكيد الحالة ✅',
          buttonReject: 'رفض الحالة ❌',
          successConfirm: 'تم التأكيد بنجاح',
          successReject: 'تم تسجيل الرفض'
        };
    }
  };

  const wording = getWording();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-slate-100 max-w-md w-full space-y-8 relative overflow-hidden"
      >
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-16 -mt-16 z-0" />
        
        <div className="relative z-10 text-center space-y-6">
          <div className="w-24 h-24 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-indigo-200 rotate-3">
            <ShieldCheck className="w-12 h-12 -rotate-3" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900">{wording.title}</h1>
            <p className="text-slate-500 font-medium">الرجاء تأكيد حالة الطالب المذكور أدناه</p>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="relative z-10 bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <User className="text-indigo-600 w-5 h-5" />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">اسم الطالب</p>
                <p className="text-lg font-black text-slate-800">{pass.studentName}</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">رقم الإذن</p>
              <p className="text-sm font-black text-indigo-600 tabular-nums">#{pass.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">نوع الإذن</p>
              <p className="text-sm font-black text-slate-700">{pass.type === 'entry' ? 'دخول للفصل' : pass.type === 'call' ? 'استدعاء للوكيل' : 'خروج من المدرسة'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">وقت الإصدار</p>
              <p className="text-sm font-black text-slate-700 tabular-nums">{pass.timestamp}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="relative z-10 space-y-4">
          <AnimatePresence mode="wait">
            {pass.status === 'pending' ? (
              <motion.div 
                key="actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 gap-4"
              >
                <button 
                  disabled={!!actionLoading}
                  onClick={() => handleConfirm('confirmed')}
                  className="group flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-emerald-100 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {actionLoading === 'confirmed' ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                  {wording.buttonConfirm}
                </button>
                <button 
                  disabled={!!actionLoading}
                  onClick={() => handleConfirm('rejected')}
                  className="flex items-center justify-center gap-3 bg-white border-2 border-rose-100 text-rose-500 py-5 rounded-3xl font-black text-xl hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  {actionLoading === 'rejected' ? <Loader2 className="w-6 h-6 animate-spin" /> : <XCircle className="w-6 h-6" />}
                  {wording.buttonReject}
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`p-6 rounded-3xl text-center space-y-3 ${
                  pass.status === 'confirmed' ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  pass.status === 'confirmed' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                  {pass.status === 'confirmed' ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                </div>
                <h3 className={`text-xl font-black ${pass.status === 'confirmed' ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {pass.status === 'confirmed' ? wording.successConfirm : wording.successReject}
                </h3>
                <p className="text-slate-500 text-sm font-medium">شكراً لك، تم تحديث الحالة في نظام الوكيل.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          نظام تكامل - الأذونات الذكية
        </p>
      </motion.div>
    </div>
  );
};

export default TeacherQuickConfirm;
