import { apiFetch } from '../utils/api';
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
  Printer,
  Radar,
  Activity,
  ClipboardCheck,
  ArrowUpRight,
  ExternalLink,
  Calendar,
  Search
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
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';

const PrincipalDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const searchStudents = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await apiFetch(`/api/student-search?query=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchStudents, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch('/api/principal/dashboard-stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const kpis = [
    { 
      label: 'التحضير اليومي', 
      value: stats?.attendance?.present || 0, 
      subValue: `غائب: ${stats?.attendance?.absent || 0}`,
      icon: Radar, 
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      link: '/dashboard/attendance/radar'
    },
    { 
      label: 'التحويلات النشطة', 
      value: stats?.referrals?.pending || 0, 
      subValue: `بانتظار المعالجة`,
      icon: AlertCircle, 
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      link: '/dashboard/referrals'
    },
    { 
      label: 'حصص المتابعة الذكية', 
      value: stats?.tracker?.sessions || 0, 
      subValue: `اليوم`,
      icon: ClipboardCheck, 
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      link: '/dashboard/class-tracker'
    },
    { 
      label: 'طاقم العمل', 
      value: stats?.topTeachers?.length || 0, 
      subValue: `نشط اليوم`,
      icon: Users, 
      color: 'bg-primary',
      lightColor: 'bg-primary/5',
      textColor: 'text-primary',
      link: '/dashboard/school-users'
    },
  ];

  const attendanceData = [
    { name: 'حاضر', value: Number(stats?.attendance?.present || 0) },
    { name: 'غائب', value: Number(stats?.attendance?.absent || 0) },
    { name: 'متأخر', value: Number(stats?.attendance?.late || 0) },
  ];

  const referralData = [
    { name: 'تم الحل', value: Number(stats?.referrals?.resolved || 0) },
    { name: 'قيد الانتظار', value: Number(stats?.referrals?.pending || 0) },
  ];

  const COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#6366f1'];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-slate-500 font-bold">جاري تحميل لوحة التحكم...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-12 font-sans" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .no-print, nav, aside, button { display: none !important; }
          .sts-card { border: 1px solid #e2e8f0 !important; box-shadow: none !important; margin-bottom: 2rem !important; }
          .grid { display: block !important; }
          .lg\\:col-span-2, .lg\\:col-span-1 { width: 100% !important; }
        }
      `}} />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">لوحة القيادة والتحكم</h1>
          <div className="flex items-center gap-2 text-slate-500 mt-2">
            <Calendar size={16} />
            <span className="text-sm font-bold">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 no-print">
          <div className="relative w-full md:w-80">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="ابحث عن طالب بالاسم أو الهوية..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
              />
              {isSearching && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {searchQuery.trim() && searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 max-h-80 overflow-y-auto"
                >
                  {searchResults.map(student => (
                    <Link 
                      key={student.id}
                      to={`/dashboard/student/${student.id}`}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{student.grade} - {student.section} | {student.national_id}</p>
                        </div>
                      </div>
                      <ArrowUpRight size={16} className="text-slate-400" />
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white text-slate-700 px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all font-bold text-sm"
          >
            <Printer size={18} />
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <motion.div 
            key={`kpi-${idx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => navigate(kpi.link)}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-24 h-24 ${kpi.lightColor} rounded-br-[4rem] -ml-8 -mt-8 transition-all group-hover:scale-110`} />
            <div className="relative z-10">
              <div className={`${kpi.lightColor} ${kpi.textColor} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                <kpi.icon size={28} />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-bold mb-1">{kpi.label}</p>
                  <h3 className="text-3xl font-black text-slate-900">{kpi.value}</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">{kpi.subValue}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl text-slate-300 group-hover:text-primary transition-colors">
                  <ArrowUpRight size={20} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Attendance Radar Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Radar size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-800">رادار التحضير اليومي</h2>
            </div>
            <button onClick={() => navigate('/dashboard/attendance/radar')} className="text-primary hover:underline text-xs font-bold">التفاصيل</button>
          </div>
          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-900">
                {attendanceData.reduce((acc, curr) => acc + curr.value, 0)}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">إجمالي المسجلين</span>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {attendanceData.map((item, idx) => (
              <div key={`att-${idx}`} className="text-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ backgroundColor: COLORS[idx] }} />
                <p className="text-[10px] font-bold text-slate-500 mb-1">{item.name}</p>
                <p className="text-sm font-black text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Tracker Activity */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Activity size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-800">نشاط كشف المتابعة الذكي</h2>
            </div>
            <button onClick={() => navigate('/dashboard/class-tracker')} className="text-primary hover:underline text-xs font-bold">فتح الكشف</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-xs font-bold text-slate-500 mb-2">حصص اليوم</p>
              <h4 className="text-2xl font-black text-slate-900">{stats?.tracker?.sessions || 0}</h4>
              <div className="mt-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[65%]" />
              </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-xs font-bold text-slate-500 mb-2">رصد السلوك</p>
              <h4 className="text-2xl font-black text-slate-900">{stats?.tracker?.behavior_entries || 0}</h4>
              <div className="mt-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[45%]" />
              </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-xs font-bold text-slate-500 mb-2">رصد الدرجات</p>
              <h4 className="text-2xl font-black text-slate-900">{stats?.tracker?.grade_entries || 0}</h4>
              <div className="mt-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[80%]" />
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                <TrendingUp size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">تحليل الأداء التعليمي</h4>
                <p className="text-xs text-slate-500 mt-1 font-bold">تم رصد {Number(stats?.tracker?.behavior_entries || 0) + Number(stats?.tracker?.grade_entries || 0)} عملية تعليمية اليوم عبر النظام الذكي.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Status Pipeline */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <FileText size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-800">حالة التحويلات</h2>
            </div>
            <button onClick={() => navigate('/dashboard/referrals')} className="text-primary hover:underline text-xs font-bold">إدارة التحويلات</button>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-600">تم الحل</span>
              <span className="text-sm font-black text-emerald-600">{stats?.referrals?.resolved || 0}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000" 
                style={{ width: `${(stats?.referrals?.resolved / (stats?.referrals?.total || 1)) * 100}%` }} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-600">قيد الانتظار</span>
              <span className="text-sm font-black text-amber-600">{stats?.referrals?.pending || 0}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-1000" 
                style={{ width: `${(stats?.referrals?.pending / (stats?.referrals?.total || 1)) * 100}%` }} 
              />
            </div>

            <div className="pt-6 border-t border-slate-50">
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">إجمالي هذا الشهر</p>
                  <p className="text-xl font-black text-slate-800">{stats?.referrals?.this_month || 0}</p>
                </div>
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                  <TrendingUp size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Active Teachers Today */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                <Medal size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-800">المعلمون الأكثر نشاطاً اليوم</h2>
            </div>
            <button onClick={() => navigate('/dashboard/school-users')} className="text-primary hover:underline text-xs font-bold">طاقم العمل</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats?.topTeachers?.length > 0 ? stats.topTeachers.map((teacher: any, idx: number) => (
              <div key={`teacher-${idx}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm">
                    <UserIcon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{teacher.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">نشاط التحضير والمتابعة</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-lg font-black text-primary">{teacher.activity_count}</span>
                  <p className="text-[8px] text-slate-400 font-bold uppercase">عملية</p>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-8 text-center text-slate-400 font-bold">لا يوجد نشاط مسجل للمعلمين اليوم حتى الآن</div>
            )}
          </div>
        </div>

      </div>

      {/* Quick Access Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 no-print">
        {[
          { label: 'الملف الشامل', icon: UserIcon, link: '/dashboard/students', color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'رادار التحضير', icon: Radar, link: '/dashboard/attendance/radar', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'كشف المتابعة', icon: ClipboardCheck, link: '/dashboard/class-tracker', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'سجل الغياب', icon: FileText, link: '/dashboard/absence-record', color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'إدارة التحويلات', icon: AlertCircle, link: '/dashboard/referrals', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'طاقم العمل', icon: Users, link: '/dashboard/school-users', color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'مركز التقارير', icon: BarChart3, link: '/dashboard/reports', color: 'text-slate-600', bg: 'bg-slate-100' },
        ].map((item, idx) => (
          <button
            key={`link-${idx}`}
            onClick={() => navigate(item.link)}
            className="flex flex-col items-center gap-3 p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <item.icon size={24} />
            </div>
            <span className="text-xs font-black text-slate-700">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PrincipalDashboard;

