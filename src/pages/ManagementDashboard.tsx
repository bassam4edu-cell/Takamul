import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  Filter,
  Search,
  Users,
  Calendar,
  ChevronLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Referral } from '../types';
import { useAuth } from '../App';
import { motion } from 'motion/react';

const ManagementDashboard: React.FC = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch(`/api/referrals?userId=${user?.id}&role=${user?.role}`)
      .then(res => res.json())
      .then(data => {
        setReferrals(data);
        setLoading(false);
      });
  }, [user?.id, user?.role]);

  const filteredReferrals = referrals.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'pending') return r.status.startsWith('pending') || r.status === 'scheduled_meeting' || r.status === 'returned_to_teacher';
    if (filter === 'resolved') return r.status === 'resolved';
    return true;
  });

  const stats = [
    { label: 'تحويلات جديدة', value: referrals.filter(r => r.status === 'pending_vp').length, icon: AlertCircle, color: 'bg-red-500' },
    { label: 'قيد المتابعة', value: referrals.filter(r => r.status === 'pending_counselor' || r.status === 'scheduled_meeting').length, icon: Clock, color: 'bg-amber-500' },
    { label: 'إجمالي الطلاب', value: 124, icon: Users, color: 'bg-blue-500' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_vp': return <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-100">بانتظار الوكيل</span>;
      case 'pending_counselor': return <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-100">بانتظار الموجه</span>;
      case 'scheduled_meeting': return <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">موعد مع ولي الأمر</span>;
      case 'returned_to_teacher': return <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-100">نواقص - بانتظار المعلم</span>;
      case 'resolved': return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100">تم الحل</span>;
      case 'closed': return <span className="px-3 py-1 bg-slate-50 text-slate-700 rounded-full text-xs font-medium border border-slate-100">مغلق</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-10 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">مرحباً بك، {user?.name}</h1>
          <p className="text-slate-500 mt-1">لديك {referrals.filter(r => r.status === 'pending_vp').length} تحويلات جديدة تتطلب انتباهك.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setFilter('all')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-slate-50'}`}
          >
            الكل
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === 'pending' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-slate-50'}`}
          >
            قيد المعالجة
          </button>
          <button 
            onClick={() => setFilter('resolved')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === 'resolved' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-slate-50'}`}
          >
            تم الحل
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="sts-card p-8 group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.color.replace('bg-', 'bg-')}/5 rounded-bl-[5rem] -mr-8 -mt-8 transition-all group-hover:scale-110`} />
            <div className="relative z-10 flex items-center gap-6">
              <div className={`${stat.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-100`}>
                <stat.icon size={32} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-bold mb-1 uppercase tracking-wider">{stat.label}</p>
                <p className="text-4xl font-extrabold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="sts-card overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
              <Search size={22} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800">إدارة التحويلات</h2>
            <div className="h-6 w-px bg-slate-100" />
            <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-wider">
              <Calendar size={18} />
              <span>{new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث..." 
              className="bg-slate-50 border border-slate-100 rounded-xl py-2 pr-10 pl-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 gap-6">
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-medium">جاري التحميل...</div>
            ) : filteredReferrals.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium">لا توجد تحويلات مطابقة للفلتر</div>
            ) : (
              filteredReferrals.map((referral) => (
                <Link 
                  key={referral.id}
                  to={`/referral/${referral.id}`}
                  className="group bg-slate-50/30 hover:bg-white p-8 rounded-[2rem] border border-transparent hover:border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary font-extrabold text-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                      {referral.student_name.charAt(0)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <h3 className="font-extrabold text-slate-800 text-xl">{referral.student_name}</h3>
                        {getStatusBadge(referral.status)}
                      </div>
                      <div className="flex items-center gap-6 text-sm text-slate-400 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-2">
                          <Users size={16} />
                          {referral.student_grade} - {referral.student_section}
                        </span>
                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                        <span>المعلم: {referral.teacher_name}</span>
                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                        <span className={`${
                          referral.severity === 'high' ? 'text-red-500' : 
                          referral.severity === 'medium' ? 'text-amber-500' : 'text-primary'
                        }`}>
                          {referral.severity === 'high' ? 'المرة الثالثة فأكثر' : 
                           referral.severity === 'medium' ? 'المرة الثانية' : 'المرة الأولى'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 mb-1 font-extrabold uppercase tracking-widest">تاريخ التحويل</p>
                      <p className="text-sm font-extrabold text-slate-700">{new Date(referral.created_at).toLocaleDateString('ar-SA')}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:rotate-12 transition-all shadow-sm">
                      <ChevronLeft size={24} />
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

export default ManagementDashboard;
