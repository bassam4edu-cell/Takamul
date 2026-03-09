import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  Filter,
  MoreVertical,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Referral } from '../types';
import { useAuth } from '../App';
import { motion } from 'motion/react';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const res = await fetch(`/api/referrals?userId=${user?.id}&role=${user?.role}`);
        if (!res.ok) throw new Error('Failed to fetch referrals');
        const data = await res.json().catch(() => []);
        setReferrals(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchReferrals();
  }, [user?.id, user?.role]);

  const stats = [
    { label: 'إجمالي التحويلات', value: referrals.length, icon: AlertCircle, color: 'bg-blue-500' },
    { label: 'قيد المعالجة', value: referrals.filter(r => r.status.startsWith('pending') || r.status === 'scheduled_meeting' || r.status === 'returned_to_teacher').length, icon: Clock, color: 'bg-amber-500' },
    { label: 'تم الحل', value: referrals.filter(r => r.status === 'resolved').length, icon: CheckCircle2, color: 'bg-emerald-500' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_vp': return <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100">بانتظار الوكيل</span>;
      case 'pending_counselor': return <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">بانتظار الموجه</span>;
      case 'scheduled_meeting': return <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">موعد مع ولي الأمر</span>;
      case 'returned_to_teacher': return <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-100">نواقص - بانتظار المعلم</span>;
      case 'resolved': return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100">تم الحل</span>;
      case 'closed': return <span className="px-3 py-1 bg-slate-50 text-slate-700 rounded-full text-xs font-medium border border-slate-100">مغلق</span>;
      default: return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-blue-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">مرحباً بك، {user?.name}</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">إليك نظرة عامة على تحويلات الطلاب الخاصة بك.</p>
        </div>
        <Link 
          to="/dashboard/referral/new"
          className="sts-button-accent px-6 md:px-8 py-3 md:py-4 flex items-center justify-center gap-3 shadow-xl shadow-accent/20 w-full md:w-auto"
        >
          <Plus size={22} />
          <span>تحويل جديد</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="sts-card p-6 md:p-8 group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 ${stat.color.replace('bg-', 'bg-')}/5 rounded-bl-[4rem] md:rounded-bl-[5rem] -mr-6 md:-mr-8 -mt-6 md:-mt-8 transition-all group-hover:scale-110`} />
            <div className="relative z-10 flex items-center gap-4 md:gap-6">
              <div className={`${stat.color} w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-100 shrink-0`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[10px] md:text-sm text-slate-500 font-bold mb-1 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl md:text-4xl font-extrabold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="sts-card overflow-hidden">
        <div className="p-6 md:p-10 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/5 text-primary rounded-lg md:rounded-xl flex items-center justify-center">
              <Search size={18} />
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-800">آخر التحويلات</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 md:p-3 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg md:rounded-xl transition-all">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <table className="w-full text-right hidden md:table">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                <th className="px-10 py-5">الطالب</th>
                <th className="px-10 py-5">نوع التحويل</th>
                <th className="px-10 py-5">تكرار المخالفة</th>
                <th className="px-10 py-5">الحالة</th>
                <th className="px-10 py-5">الشواهد</th>
                <th className="px-10 py-5">التاريخ</th>
                <th className="px-10 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-10 py-12 text-center text-slate-400 font-medium">جاري تحميل البيانات...</td>
                </tr>
              ) : referrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-12 text-center text-slate-400 font-medium">لا توجد تحويلات حالياً</td>
                </tr>
              ) : (
                referrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-primary font-extrabold text-lg border border-slate-200">
                          {referral.student_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-800">{referral.student_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{referral.student_grade} - {referral.student_section}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-sm font-bold text-slate-600">
                        {referral.type === 'behavior' ? 'سلوكي' : 
                         referral.type === 'academic' ? 'أكاديمي' : 
                         referral.type === 'attendance' ? 'غياب' : 'زي مدرسي'}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`text-sm font-bold ${getSeverityColor(referral.severity)}`}>
                        {referral.severity === 'high' ? 'المرة الثالثة فأكثر' : 
                         referral.severity === 'medium' ? 'المرة الثانية' : 'المرة الأولى'}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      {getStatusBadge(referral.status)}
                    </td>
                    <td className="px-10 py-6 text-sm font-bold text-slate-400">
                      {new Date(referral.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-10 py-6 text-left">
                      <div className="flex items-center justify-end gap-3">
                        <Link 
                          to={`/dashboard/referral/${referral.id}`}
                          className="p-3 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                        >
                          <ArrowUpRight size={22} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-50">
            {loading ? (
              <div className="p-10 text-center text-slate-400 font-medium">جاري تحميل البيانات...</div>
            ) : referrals.length === 0 ? (
              <div className="p-10 text-center text-slate-400 font-medium">لا توجد تحويلات حالياً</div>
            ) : (
              referrals.map((referral) => (
                <Link 
                  key={referral.id}
                  to={`/dashboard/referral/${referral.id}`}
                  className="block p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-primary font-extrabold border border-slate-200">
                        {referral.student_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-800">{referral.student_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{referral.student_grade} - {referral.student_section}</p>
                      </div>
                    </div>
                    <ArrowUpRight size={18} className="text-slate-300" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-bold">
                    <div className="space-y-1">
                      <p className="text-slate-400 uppercase tracking-wider">نوع التحويل</p>
                      <p className="text-slate-700">
                        {referral.type === 'behavior' ? 'سلوكي' : 
                         referral.type === 'academic' ? 'أكاديمي' : 
                         referral.type === 'attendance' ? 'غياب' : 'زي مدرسي'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 uppercase tracking-wider">تكرار المخالفة</p>
                      <p className={getSeverityColor(referral.severity)}>
                        {referral.severity === 'high' ? 'المرة الثالثة فأكثر' : 
                         referral.severity === 'medium' ? 'المرة الثانية' : 'المرة الأولى'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 uppercase tracking-wider">الحالة</p>
                      <div>{getStatusBadge(referral.status)}</div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 uppercase tracking-wider">التاريخ</p>
                      <p className="text-slate-500">{new Date(referral.created_at).toLocaleDateString('ar-SA')}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
