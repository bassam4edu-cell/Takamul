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
  Zap,
  Printer
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
  const [kpiStats, setKpiStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'behavior': return 'سلوكية';
      case 'academic': return 'أكاديمية';
      case 'attendance': return 'غياب وتأخر';
      case 'uniform': return 'زي مدرسي';
      case 'other': return 'أخرى';
      default: return type || 'متنوعة';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [refRes, perfRes, kpiRes] = await Promise.all([
          fetch(`/api/referrals?userId=${user?.id}&role=${user?.role}`),
          fetch('/api/admin/performance'),
          fetch('/api/reports/kpi-stats')
        ]);
        const refData = await refRes.json();
        const perfData = await perfRes.json();
        const kpiData = await kpiRes.json();
        setReferrals(refData);
        setPerformance(perfData);
        setKpiStats(kpiData);
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
      label: 'إجمالي الحالات هذا الشهر', 
      value: kpiStats?.total_this_month || 0, 
      icon: FileText, 
      color: 'bg-primary',
      lightColor: 'bg-primary/5',
      textColor: 'text-primary'
    },
    { 
      label: 'الحالات المغلقة', 
      value: kpiStats?.resolved_cases || 0, 
      icon: CheckCircle2, 
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    { 
      label: 'الحالات قيد الانتظار', 
      value: kpiStats?.pending_cases || 0, 
      icon: Clock, 
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-600'
    },
    { 
      label: 'حالات المشكلة الأولى', 
      value: kpiStats?.first_offense_cases || 0, 
      icon: Zap, 
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
  ];

  const reasonData = [
    { name: 'سلوكية', value: referrals.filter(r => r.type === 'behavior').length || 0 },
    { name: 'غياب', value: referrals.filter(r => r.reason.includes('غياب') || r.reason.includes('تأخر')).length || 0 },
    { name: 'تقصير دراسي', value: referrals.filter(r => r.type === 'academic').length || 0 },
  ];

  const COLORS = ['#3b82f6', '#f59e0b', '#6366f1', '#10b981'];

  if (loading) return <div className="p-12 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-10 pb-12">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .no-print, nav, aside, button, .sts-button-primary, .sts-button-accent { display: none !important; }
          .sts-card { border: none !important; box-shadow: none !important; padding: 0 !important; margin-bottom: 2rem !important; }
          .sts-card > div { padding: 0 !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #e2e8f0 !important; padding: 8px !important; font-size: 10pt !important; }
          tr { page-break-inside: avoid !important; }
          h1, h2 { color: black !important; margin-bottom: 1rem !important; }
          .grid { display: block !important; }
          .lg\\:col-span-2, .lg\\:col-span-1 { width: 100% !important; }
          .recharts-responsive-container { height: 300px !important; width: 100% !important; }
        }
      `}} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">لوحة تحكم المدير</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">نظرة شاملة على أداء نظام التحويل والإرشاد</p>
        </div>
        <div className="flex items-center gap-3 no-print">
          <button 
            onClick={() => window.print()}
            className="sts-button-accent px-6 py-3 flex items-center gap-2 shadow-xl shadow-accent/20"
          >
            <Printer size={18} />
            <span>طباعة التقرير</span>
          </button>
          <div className="bg-white px-4 md:px-5 py-2.5 md:py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs md:text-sm font-bold text-slate-700">النظام متصل</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="sts-card p-6 md:p-8 group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 ${stat.lightColor} rounded-bl-[4rem] md:rounded-bl-[5rem] -mr-6 md:-mr-8 -mt-6 md:-mt-8 transition-all group-hover:scale-110`} />
            <div className="relative z-10">
              <div className={`${stat.lightColor} ${stat.textColor} w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-sm`}>
                <stat.icon size={24} md:size={28} />
              </div>
              <p className="text-slate-500 text-[10px] md:text-sm font-bold mb-1">{stat.label}</p>
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 sts-card p-6 md:p-10">
          <div className="flex items-center justify-between mb-6 md:mb-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/5 text-primary rounded-lg md:rounded-xl flex items-center justify-center">
                <BarChart3 size={18} md:size={22} />
              </div>
              <h2 className="text-lg md:text-xl font-extrabold text-slate-800">أسباب التحويل الأكثر شيوعاً</h2>
            </div>
          </div>
          <div className="h-[250px] md:h-[350px]">
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

        <div className="sts-card p-6 md:p-10">
          <div className="flex items-center gap-3 mb-6 md:mb-10">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-50 text-amber-600 rounded-lg md:rounded-xl flex items-center justify-center">
              <PieChartIcon size={18} md:size={22} />
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-800">توزيع الحالات</h2>
          </div>
          <div className="h-[250px] md:h-[300px] relative">
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
        <div className="p-6 md:p-10 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary text-white rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <TrendingUp size={18} md:size={22} />
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-800">أداء الوكلاء والموجهين</h2>
          </div>
        </div>
        <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {performance.length > 0 ? performance.map((p, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-50 rounded-[2rem] p-6 md:p-8 border border-slate-100 hover:border-primary/20 transition-all group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-primary shadow-sm border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all">
                  <UserIcon size={24} md:size={28} />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-extrabold text-slate-800">{p.name}</h3>
                  <span className="text-[9px] md:text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-lg font-bold">
                    {p.role === 'vice_principal' ? 'وكيل' : 'موجه'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div className="bg-white p-2 md:p-3 rounded-xl border border-slate-100">
                  <p className="text-[8px] md:text-[9px] text-slate-400 font-bold mb-1 uppercase">المحولة</p>
                  <p className="text-base md:text-lg font-extrabold text-slate-700">{p.total_referred || 0}</p>
                </div>
                <div className="bg-white p-2 md:p-3 rounded-xl border border-slate-100">
                  <p className="text-[8px] md:text-[9px] text-slate-400 font-bold mb-1 uppercase">المعالجة</p>
                  <p className="text-base md:text-lg font-extrabold text-emerald-600">{p.total_resolved || 0}</p>
                </div>
                <div className="bg-white p-2 md:p-3 rounded-xl border border-slate-100">
                  <p className="text-[8px] md:text-[9px] text-slate-400 font-bold mb-1 uppercase">الوقت</p>
                  <p className="text-base md:text-lg font-extrabold text-amber-600">
                    {p.avg_hours ? (p.avg_hours > 24 ? `${Math.round(p.avg_hours / 24)}ي` : `${Math.round(p.avg_hours)}س`) : '-'}
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
        <div className="p-6 md:p-10 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-50 text-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center">
              <Timer size={18} md:size={22} />
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-800">آخر التحويلات المسجلة</h2>
          </div>
          <button className="text-xs md:text-sm font-bold text-primary hover:underline">عرض الكل</button>
        </div>
        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <table className="w-full text-right hidden md:table">
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
                        <p className="text-[10px] text-slate-400 font-bold">هوية: {referral.student_national_id || 'غير مسجل'} | {referral.student_grade} - {referral.student_section} | {getTypeLabel(referral.type)}</p>
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

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-50">
            {referrals.slice(0, 5).map((referral) => (
              <div 
                key={referral.id}
                onClick={() => navigate(`/referral/${referral.id}`)}
                className="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-primary font-extrabold border border-slate-200">
                      {referral.student_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-800">{referral.student_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">هوية: {referral.student_national_id || 'غير مسجل'} | {referral.student_grade} - {referral.student_section} | {getTypeLabel(referral.type)}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px] font-bold">
                  <div className="space-y-1">
                    <p className="text-slate-400 uppercase tracking-wider">المعلم المُحيل</p>
                    <p className="text-slate-700">{referral.teacher_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 uppercase tracking-wider">الحالة</p>
                    <p className={`inline-flex items-center gap-1.5 ${
                      referral.status === 'resolved' ? 'text-emerald-600' :
                      referral.status === 'pending_vp' ? 'text-amber-600' :
                      referral.status === 'pending_counselor' ? 'text-indigo-600' :
                      'text-slate-600'
                    }`}>
                      {referral.status === 'resolved' ? 'تم الحل' :
                       referral.status === 'pending_vp' ? 'بانتظار الوكيل' :
                       referral.status === 'pending_counselor' ? 'بانتظار الموجه' :
                       referral.status === 'scheduled_meeting' ? 'موعد جلسة' : 'قيد المعالجة'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 uppercase tracking-wider">التاريخ</p>
                    <p className="text-slate-500">{new Date(referral.created_at).toLocaleDateString('ar-SA')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
