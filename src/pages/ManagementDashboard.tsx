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
    if (filter === 'pending') return r.status.startsWith('pending') || r.status === 'scheduled_meeting';
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
      case 'resolved': return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100">تم الحل</span>;
      case 'closed': return <span className="px-3 py-1 bg-slate-50 text-slate-700 rounded-full text-xs font-medium border border-slate-100">مغلق</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">مرحباً بك، {user?.name}</h1>
          <p className="text-slate-500">لديك {referrals.filter(r => r.status === 'pending_vp').length} تحويلات جديدة تتطلب انتباهك.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-200 card-shadow">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:text-slate-700'}`}
          >
            الكل
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'pending' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:text-slate-700'}`}
          >
            قيد المعالجة
          </button>
          <button 
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'resolved' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:text-slate-700'}`}
          >
            تم الحل
          </button>
        </div>
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

      <div className="bg-white rounded-[2.5rem] card-shadow border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">إدارة التحويلات</h2>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Calendar size={16} />
              <span>{new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث..." 
              className="bg-slate-50 border border-slate-100 rounded-xl py-2 pr-10 pl-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="p-12 text-center text-slate-400">جاري التحميل...</div>
            ) : filteredReferrals.length === 0 ? (
              <div className="p-12 text-center text-slate-400">لا توجد تحويلات مطابقة للفلتر</div>
            ) : (
              filteredReferrals.map((referral) => (
                <Link 
                  key={referral.id}
                  to={`/referral/${referral.id}`}
                  className="group bg-slate-50/50 hover:bg-white p-6 rounded-3xl border border-transparent hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 font-bold text-xl shadow-sm border border-slate-100">
                      {referral.student_name.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-800 text-lg">{referral.student_name}</h3>
                        {getStatusBadge(referral.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {referral.student_grade} - {referral.student_section}
                        </span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>المعلم: {referral.teacher_name}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className={`font-medium ${
                          referral.severity === 'high' ? 'text-red-600' : 
                          referral.severity === 'medium' ? 'text-amber-600' : 'text-blue-600'
                        }`}>
                          {referral.severity === 'high' ? 'خطورة مرتفعة' : 
                           referral.severity === 'medium' ? 'خطورة متوسطة' : 'خطورة منخفضة'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-1">تاريخ التحويل</p>
                      <p className="text-sm font-medium text-slate-700">{new Date(referral.created_at).toLocaleDateString('ar-SA')}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                      <ChevronLeft size={20} />
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
