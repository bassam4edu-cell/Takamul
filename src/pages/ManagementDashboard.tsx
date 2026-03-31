import { apiFetch } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  ArrowUpRight,
  Search,
  ShieldAlert,
  Activity,
  Hourglass,
  AlertTriangle,
  RefreshCw,
  Ticket,
  LayoutDashboard
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import AgentPassDashboard from '../components/AgentPassDashboard';

const ManagementDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'smart-pass'>('overview');
  
  const [dashboardData, setDashboardData] = useState<{
    attendanceRate: number;
    absentCount: number;
    pendingClassesCount: number;
    behavioralIncidentsCount: number;
    activeReferralsCount: number;
    alerts: any[];
    activities: any[];
  } | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await apiFetch('/api/dashboard/pulse');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

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

  const handleAlertAction = (actionLink: string) => {
    navigate(actionLink);
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* Hero Section & Global Search */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">
              مرحباً بك يا {user?.name} 
            </h1>
            <p className="text-slate-500 font-bold">إليك ملخص نبض المدرسة لهذا اليوم.</p>
          </div>
          
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === 'overview' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutDashboard size={18} />
              نظرة عامة
            </button>
            <button 
              onClick={() => setActiveTab('smart-pass')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === 'smart-pass' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Ticket size={18} />
              نظام الأذونات
            </button>
          </div>

          <div className="w-full md:w-96 relative">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="ابحث عن طالب بالاسم أو رقم الهوية..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pr-12 pl-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
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
                        <div>
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
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Live Pulse KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-colors"
              >
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">الحضور اليوم</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-800">{dashboardData?.attendanceRate}%</span>
                    <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">{dashboardData?.absentCount} غائب</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-amber-200 transition-colors"
              >
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Hourglass size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">فصول معلقة</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-800">{dashboardData?.pendingClassesCount}</span>
                    <span className="text-xs font-bold text-slate-400">فصل بانتظار التحضير</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-rose-200 transition-colors"
              >
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">أحداث سلوكية</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-800">{dashboardData?.behavioralIncidentsCount}</span>
                    <span className="text-xs font-bold text-slate-400">مخالفة اليوم</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-colors"
              >
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <RefreshCw size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-1">إحالات نشطة</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-800">{dashboardData?.activeReferralsCount}</span>
                    <span className="text-xs font-bold text-slate-400">قيد المعالجة</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Split View Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              
              {/* Right Column: Actionable Alerts */}
              <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                    <ShieldAlert size={20} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800">صندوق المهام العاجلة</h2>
                </div>

                <div className="space-y-4">
                  {dashboardData?.alerts && dashboardData.alerts.length > 0 ? (
                    dashboardData.alerts.map((alert: any) => (
                      <div key={alert.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{alert.icon}</span>
                          <p className="font-bold text-slate-700 text-sm leading-relaxed">{alert.message}</p>
                        </div>
                        <button 
                          onClick={() => handleAlertAction(alert.actionLink)}
                          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            alert.type === 'warning' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' :
                            alert.type === 'alert' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' :
                            'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                        >
                          {alert.actionText}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-400 font-bold flex flex-col items-center gap-2">
                      <CheckCircle2 size={32} className="text-emerald-400" />
                      لا توجد مهام عاجلة حالياً
                    </div>
                  )}
                </div>
              </div>

              {/* Left Column: Live Activity Stream */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800">الشريط الزمني المباشر</h2>
                </div>

                <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {dashboardData?.activities && dashboardData.activities.length > 0 ? (
                    dashboardData.activities.map((activity: any, index: number) => (
                      <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-50 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <span className="text-sm">{activity.icon}</span>
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{activity.time}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-700 leading-relaxed">{activity.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-400 font-bold">
                      لا توجد نشاطات مسجلة اليوم
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="smart-pass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100"
          >
            <AgentPassDashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagementDashboard;
