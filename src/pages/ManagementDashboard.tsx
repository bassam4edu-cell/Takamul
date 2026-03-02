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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">مرحباً بك، {user?.name}</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">لديك {referrals.filter(r => r.status === 'pending_vp').length} تحويلات جديدة تتطلب انتباهك.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${filter === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-slate-50'}`}
          >
            الكل
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${filter === 'pending' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-slate-50'}`}
          >
            قيد المعالجة
          </button>
          <button 
            onClick={() => setFilter('resolved')}
            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${filter === 'resolved' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-slate-50'}`}
          >
            تم الحل
          </button>
        </div>
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
                <stat.icon size={24} md:size={32} />
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
        <div className="p-6 md:p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/5 text-primary rounded-lg md:rounded-xl flex items-center justify-center">
              <Search size={18} md:size={22} />
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-800">إدارة التحويلات</h2>
            <div className="hidden sm:block h-6 w-px bg-slate-100" />
            <div className="hidden sm:flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-wider">
              <Calendar size={18} />
              <span>{new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-medium">جاري التحميل...</div>
            ) : filteredReferrals.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium">لا توجد تحويلات مطابقة للفلتر</div>
            ) : (
              filteredReferrals.map((referral) => (
                <Link 
                  key={referral.id}
                  to={`/referral/${referral.id}`}
                  className="group bg-slate-50/30 hover:bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-transparent hover:border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6"
                >
                  <div className="flex items-center gap-4 md:gap-8">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-primary font-extrabold text-lg md:text-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform shrink-0">
                      {referral.student_name.charAt(0)}
                    </div>
                    <div className="space-y-1 md:space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 md:gap-4">
                        <h3 className="font-extrabold text-slate-800 text-base md:text-xl truncate">{referral.student_name}</h3>
                        <div className="shrink-0">{getStatusBadge(referral.status)}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-1 text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Users size={12} className="md:w-4 md:h-4" />
                          {referral.student_grade} - {referral.student_section}
                        </span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="truncate">المعلم: {referral.teacher_name}</span>
                        <span className="hidden md:block w-1.5 h-1.5 bg-slate-200 rounded-full" />
                        <span className={`${
                          referral.severity === 'high' ? 'text-red-500' : 
                          referral.severity === 'medium' ? 'text-amber-500' : 'text-primary'
                        } whitespace-nowrap`}>
                          {referral.severity === 'high' ? 'المرة الثالثة فأكثر' : 
                           referral.severity === 'medium' ? 'المرة الثانية' : 'المرة الأولى'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100/50">
                    <div className="text-right">
                      <p className="text-[8px] md:text-[10px] text-slate-400 mb-0.5 md:mb-1 font-extrabold uppercase tracking-widest">تاريخ التحويل</p>
                      <p className="text-xs md:text-sm font-extrabold text-slate-700">{new Date(referral.created_at).toLocaleDateString('ar-SA')}</p>
                    </div>
                    <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:rotate-12 transition-all shadow-sm shrink-0">
                      <ChevronLeft size={18} className="md:w-6 md:h-6" />
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
