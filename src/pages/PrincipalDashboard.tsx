import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  User as UserIcon,
  ChevronRight,
  FileText,
  Timer,
  Medal,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Referral } from '../types';
import { useAuth } from '../App';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const PrincipalDashboard: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [refRes, perfRes] = await Promise.all([
          fetch(`/api/referrals?userId=${user?.id}&role=${user?.role}`),
          fetch('/api/admin/performance')
        ]);
        const refData = await refRes.json();
        const perfData = await perfRes.json();
        setReferrals(refData);
        setPerformance(perfData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id, user?.role]);

  const stats = [
    { 
      label: 'إجمالي التحويلات', 
      value: referrals.length, 
      icon: FileText, 
      color: 'bg-primary',
      lightColor: 'bg-primary/5',
      textColor: 'text-primary'
    },
    { 
      label: 'بانتظار الوكيل', 
      value: referrals.filter(r => r.status === 'pending_vp').length, 
      icon: Clock, 
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-600'
    },
    { 
      label: 'عند الموجه الطلابي', 
      value: referrals.filter(r => r.status === 'pending_counselor' || r.status === 'scheduled_meeting').length, 
      icon: Users, 
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    { 
      label: 'تم الإغلاق بنجاح', 
      value: referrals.filter(r => r.status === 'resolved' || r.status === 'closed').length, 
      icon: CheckCircle2, 
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
  ];

  const reasonData = [
    { name: 'تأخر صباحي', value: referrals.filter(r => r.reason.includes('تأخر')).length || 5 },
    { name: 'غياب متكرر', value: referrals.filter(r => r.reason.includes('غياب')).length || 8 },
    { name: 'ضعف دراسي', value: referrals.filter(r => r.type === 'academic').length || 12 },
    { name: 'مشكلة سلوكية', value: referrals.filter(r => r.type === 'behavior').length || 15 },
  ];

  const COLORS = ['#3b82f6', '#f59e0b', '#6366f1', '#10b981'];

  if (loading) return <div className="p-12 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-10 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">لوحة تحكم المدير</h1>
          <p className="text-slate-500 mt-1">نظرة شاملة على أداء نظام التحويل والإرشاد</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-slate-700">النظام متصل</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="sts-card p-8 group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.lightColor} rounded-bl-[5rem] -mr-8 -mt-8 transition-all group-hover:scale-110`} />
            <div className="relative z-10">
              <div className={`${stat.lightColor} ${stat.textColor} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                <stat.icon size={28} />
              </div>
              <p className="text-slate-500 text-sm font-bold mb-1">{stat.label}</p>
              <h3 className="text-3xl font-extrabold text-slate-900">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 sts-card p-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                <BarChart3 size={22} />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800">أسباب التحويل الأكثر شيوعاً</h2>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasonData} layout="vertical" margin={{ right: 30, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={100}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                  {reasonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#006847', '#00855c', '#d4af37', '#004d35'][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sts-card p-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <PieChartIcon size={22} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800">توزيع الحالات</h2>
          </div>
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reasonData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {reasonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold text-slate-900">{referrals.length}</span>
              <span className="text-xs text-slate-400 font-bold uppercase">إجمالي الحالات</span>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {reasonData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span className="text-sm font-bold text-slate-600">{item.name}</span>
                </div>
                <span className="text-sm font-extrabold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sts-card overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <TrendingUp size={22} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800">أداء الوكلاء والموجهين</h2>
          </div>
        </div>
        <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {performance.length > 0 ? performance.map((p, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-primary/20 transition-all group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all">
                  <UserIcon size={28} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800">{p.name}</h3>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-lg font-bold">
                    {p.role === 'vice_principal' ? 'وكيل' : 'موجه'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">تم الحل</p>
                  <p className="text-xl font-extrabold text-primary">{p.total_resolved}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">متوسط الوقت</p>
                  <p className="text-xl font-extrabold text-amber-600">
                    {p.avg_hours > 24 ? `${Math.round(p.avg_hours / 24)} يوم` : `${Math.round(p.avg_hours)} ساعة`}
                  </p>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-12 text-center text-slate-400 font-medium">لا توجد بيانات أداء متاحة حالياً</div>
          )}
        </div>
      </div>

      <div className="sts-card overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Timer size={22} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800">آخر التحويلات المسجلة</h2>
          </div>
          <button className="text-sm font-bold text-primary hover:underline">عرض الكل</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                <th className="px-10 py-5">اسم الطالب</th>
                <th className="px-10 py-5">المعلم المُحيل</th>
                <th className="px-10 py-5">الحالة الحالية</th>
                <th className="px-10 py-5">تاريخ الإجراء</th>
                <th className="px-10 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {referrals.slice(0, 5).map((referral) => (
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
                    <span className="text-sm font-bold text-slate-600">{referral.teacher_name}</span>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-extrabold ${
                      referral.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' :
                      referral.status === 'pending_vp' ? 'bg-amber-50 text-amber-700' :
                      referral.status === 'pending_counselor' ? 'bg-indigo-50 text-indigo-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        referral.status === 'resolved' ? 'bg-emerald-500' :
                        referral.status === 'pending_vp' ? 'bg-amber-500' :
                        referral.status === 'pending_counselor' ? 'bg-indigo-500' :
                        'bg-slate-500'
                      }`} />
                      {referral.status === 'resolved' ? 'تم الحل' :
                       referral.status === 'pending_vp' ? 'بانتظار الوكيل' :
                       referral.status === 'pending_counselor' ? 'بانتظار الموجه' :
                       referral.status === 'scheduled_meeting' ? 'موعد جلسة' : 'قيد المعالجة'}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-sm font-bold text-slate-400">
                    {new Date(referral.created_at).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-10 py-6 text-left">
                    <button 
                      onClick={() => navigate(`/referral/${referral.id}`)}
                      className="p-3 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                    >
                      <ChevronRight size={22} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
