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
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600'
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
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">لوحة تحكم المدير</h1>
          <p className="text-slate-500 mt-1">نظام الإحالة والإرشاد - ثانوية أم القرى</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">مدير المدرسة</p>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
            <UserIcon size={20} />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.lightColor} ${stat.textColor} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <TrendingUp size={16} className="text-slate-300" />
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">تحليل أسباب التحويل</h3>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {reasonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <PieChartIcon size={20} className="text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">توزيع الحالات</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reasonData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {reasonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {reasonData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Referrals Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">آخر التحويلات المسجلة</h3>
            </div>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">عرض الكل</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-8 py-4">اسم الطالب</th>
                  <th className="px-8 py-4">المعلم المُحيل</th>
                  <th className="px-8 py-4">الحالة الحالية</th>
                  <th className="px-8 py-4">تاريخ الإجراء</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {referrals.slice(0, 5).map((referral) => (
                  <tr key={referral.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                          {referral.student_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{referral.student_name}</p>
                          <p className="text-xs text-slate-500">{referral.student_grade} - {referral.student_section}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm text-slate-600 font-medium">{referral.teacher_name}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        referral.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' :
                        referral.status === 'pending_vp' ? 'bg-amber-50 text-amber-700' :
                        referral.status === 'pending_counselor' ? 'bg-indigo-50 text-indigo-700' :
                        'bg-slate-50 text-slate-700'
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
                    <td className="px-8 py-5 text-sm text-slate-500">
                      {new Date(referral.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-8 py-5 text-left">
                      <button 
                        onClick={() => navigate(`/referral/${referral.id}`)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <Zap size={20} className="text-amber-500" />
            <h3 className="text-lg font-bold text-slate-900">أداء الوكلاء والموجهين</h3>
          </div>
          <div className="space-y-6">
            {performance.length > 0 ? performance.map((p, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${p.role === 'vice_principal' ? 'bg-blue-500' : 'bg-indigo-500'}`}>
                      <UserIcon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-500">{p.role === 'vice_principal' ? 'وكيل شؤون الطلاب' : 'موجه طلابي'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-600">{p.total_resolved} حالة</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Timer size={14} />
                    <span className="text-xs">متوسط وقت الإنجاز:</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {p.avg_hours < 24 
                      ? `${Math.round(p.avg_hours)} ساعة` 
                      : `${Math.round(p.avg_hours / 24)} يوم`}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400">
                <Medal size={40} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">لا توجد بيانات أداء كافية حالياً</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
