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
  Calendar,
  FileText,
  MapPin
} from 'lucide-react';
import { motion } from 'motion/react';

const PassVerificationPage: React.FC = () => {
  const { passId } = useParams<{ passId: string }>();
  const [loading, setLoading] = useState(true);
  const [pass, setPass] = useState<any>(null);

  useEffect(() => {
    const fetchPass = async () => {
      try {
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
  }, [passId]);

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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { label: 'إذن معتمد ✅', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', icon: CheckCircle2 };
      case 'rejected':
        return { label: 'إذن مرفوض ❌', color: 'bg-rose-500', textColor: 'text-rose-700', bgColor: 'bg-rose-50', icon: XCircle };
      default:
        return { label: 'بانتظار التأكيد ⏳', color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50', icon: Clock };
    }
  };

  const statusConfig = getStatusConfig(pass.status);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-slate-100 max-w-md w-full space-y-8 relative overflow-hidden"
      >
        {/* Verification Badge */}
        <div className={`absolute top-0 left-0 w-full h-2 ${statusConfig.color}`} />
        
        <div className="text-center space-y-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg ${statusConfig.bgColor} ${statusConfig.textColor}`}>
            <statusConfig.icon className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900">التحقق من صحة الإذن</h1>
            <div className={`inline-block px-4 py-1 rounded-full text-xs font-black border ${statusConfig.bgColor} ${statusConfig.textColor} border-current`}>
              {statusConfig.label}
            </div>
          </div>
        </div>

        {/* Pass Card */}
        <div className="bg-slate-50 rounded-3xl p-6 space-y-6 border border-slate-100">
          <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-600">
              <User size={24} />
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">اسم الطالب</p>
              <p className="text-lg font-black text-slate-800">{pass.studentName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <FileText size={10} />
                <span>نوع الإذن</span>
              </div>
              <p className="text-sm font-black text-slate-700">
                {pass.type === 'entry' ? 'دخول للفصل' : pass.type === 'call' ? 'استدعاء للوكيل' : 'خروج من المدرسة'}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <Clock size={10} />
                <span>وقت الإصدار</span>
              </div>
              <p className="text-sm font-black text-slate-700 tabular-nums">{pass.timestamp}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <ShieldCheck size={10} />
                <span>المعلم المستلم</span>
              </div>
              <p className="text-sm font-black text-slate-700">{pass.teacherName}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <MapPin size={10} />
                <span>رقم الإذن</span>
              </div>
              <p className="text-sm font-black text-indigo-600 tabular-nums">#{pass.id}</p>
            </div>
          </div>

          {pass.reason && (
            <div className="pt-4 border-t border-slate-200">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">سبب الإذن</p>
              <p className="text-sm font-bold text-slate-600 italic">{pass.reason}</p>
            </div>
          )}
        </div>

        <div className="text-center space-y-4">
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <p className="text-xs font-bold text-indigo-700">
              هذا الإذن صادر من نظام تكامل المدرسي ومعتمد من وكيل الشؤون الطلابية.
            </p>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Smart Pass System v1.0 • AI Studio Build
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PassVerificationPage;
