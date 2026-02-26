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
    fetch(`/api/referrals?userId=${user?.id}&role=${user?.role}`)
      .then(res => res.json())
      .then(data => {
        setReferrals(data);
        setLoading(false);
      });
  }, [user?.id, user?.role]);

  const stats = [
    { label: 'إجمالي التحويلات', value: referrals.length, icon: AlertCircle, color: 'bg-blue-500' },
    { label: 'قيد المعالجة', value: referrals.filter(r => r.status.startsWith('pending') || r.status === 'scheduled_meeting').length, icon: Clock, color: 'bg-amber-500' },
    { label: 'تم الحل', value: referrals.filter(r => r.status === 'resolved').length, icon: CheckCircle2, color: 'bg-emerald-500' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_vp': return <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100">بانتظار الوكيل</span>;
      case 'pending_counselor': return <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">بانتظار الموجه</span>;
      case 'scheduled_meeting': return <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">موعد مع ولي الأمر</span>;
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">مرحباً بك، أ. محمد</h1>
          <p className="text-slate-500">إليك نظرة عامة على تحويلات الطلاب الخاصة بك.</p>
        </div>
        <Link 
          to="/referral/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
        >
          <Plus size={20} />
          <span>تحويل جديد</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl card-shadow border border-slate-100 flex items-center gap-4"
          >
            <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-100`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-3xl card-shadow border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">آخر التحويلات</h2>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
              <Filter size={18} />
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
              <Search size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">الطالب</th>
                <th className="px-6 py-4">نوع التحويل</th>
                <th className="px-6 py-4">الخطورة</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">جاري تحميل البيانات...</td>
                </tr>
              ) : referrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">لا توجد تحويلات حالياً</td>
                </tr>
              ) : (
                referrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                          {referral.student_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{referral.student_name}</p>
                          <p className="text-xs text-slate-500">{referral.student_grade} - {referral.student_section}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">
                        {referral.type === 'behavior' ? 'سلوكي' : 
                         referral.type === 'academic' ? 'أكاديمي' : 
                         referral.type === 'attendance' ? 'غياب' : 'زي مدرسي'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold ${getSeverityColor(referral.severity)}`}>
                        {referral.severity === 'high' ? 'مرتفعة' : 
                         referral.severity === 'medium' ? 'متوسطة' : 'منخفضة'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(referral.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(referral.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/referral/${referral.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ArrowUpRight size={18} />
                        </Link>
                        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
