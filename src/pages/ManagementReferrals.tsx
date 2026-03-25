import { apiFetch } from '../utils/api';
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
  ChevronLeft,
  Download,
  ShieldAlert,
  X as CloseIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Referral } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { formatHijriDate } from '../utils/dateUtils';
import HijriDatePicker from '../components/HijriDatePicker';

const ManagementReferrals: React.FC = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDates, setExportDates] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const res = await apiFetch(`/api/referrals?userId=${user?.id}&role=${user?.role}`);
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

  const handleExportNoor = async () => {
    setExporting(true);
    try {
      const response = await apiFetch('/api/export/noor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          role: user?.role,
          startDate: exportDates.start,
          endDate: exportDates.end
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(data.error || 'فشل تصدير البيانات');
        setExporting(false);
        return;
      }

      // Generate Excel
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "حالات نظام نور");
      XLSX.writeFile(wb, `Noor_Export_${new Date().toISOString().split('T')[0]}.xlsx`);

      setShowExportModal(false);
      // Refresh referrals to update is_exported status if needed (though not shown in UI yet)
      const res = await apiFetch(`/api/referrals?userId=${user?.id}&role=${user?.role}`);
      if (res.ok) {
        const updatedData = await res.json().catch(() => []);
        setReferrals(updatedData);
      }
      
      alert('تم تصدير البيانات بنجاح');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء التصدير');
    } finally {
      setExporting(false);
    }
  };

  const filteredReferrals = referrals.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'pending') return r.status.startsWith('pending') || r.status === 'scheduled_meeting' || r.status === 'returned_to_teacher';
    if (filter === 'resolved') return r.status === 'resolved';
    return true;
  });

  const stats = [
    { label: 'تحويلات جديدة', value: referrals.filter(r => r.status === 'pending_vp').length, icon: AlertCircle, color: 'bg-red-500' },
    { label: 'قيد المتابعة', value: referrals.filter(r => r.status === 'pending_counselor' || r.status === 'scheduled_meeting').length, icon: Clock, color: 'bg-amber-500' },
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
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">إدارة التحويلات</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">لديك {referrals.filter(r => r.status === 'pending_vp').length} تحويلات جديدة تتطلب انتباهك.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
          {user?.role === 'counselor' && (
            <button 
              onClick={() => setShowExportModal(true)}
              className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center gap-2 ml-2"
            >
              <Download size={16} />
              تصدير لنظام نور
            </button>
          )}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
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
        <div className="p-6 md:p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/5 text-primary rounded-lg md:rounded-xl flex items-center justify-center">
              <Search size={18} />
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-800">سجل التحويلات</h2>
            <div className="hidden sm:block h-6 w-px bg-slate-100" />
            <div className="hidden sm:flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-wider">
              <Calendar size={18} />
              <span>{formatHijriDate(new Date()).split('،')[1]?.trim() || formatHijriDate(new Date())}</span>
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
                  to={`/dashboard/referral/${referral.id}`}
                  className="group bg-slate-50/30 hover:bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-transparent hover:border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6"
                >
                  <div className="flex items-center gap-4 md:gap-8">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-primary font-extrabold text-lg md:text-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform shrink-0">
                      {referral.student_name.charAt(0)}
                    </div>
                    <div className="space-y-1 md:space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 md:gap-4">
                        <h3 className="font-extrabold text-slate-800 text-base md:text-xl truncate flex items-center gap-2">
                          {referral.student_name}
                          {referral.status === 'resolved' && (
                            <span title="تمت المعالجة من قبل الموجه" className="flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full">
                              <CheckCircle2 size={12} />
                            </span>
                          )}
                        </h3>
                        <div className="shrink-0">{getStatusBadge(referral.status)}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-1 text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <ShieldAlert size={12} className="md:w-4 md:h-4" />
                          هوية: {referral.student_national_id || 'غير مسجل'}
                        </span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
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
                      <p className="text-xs md:text-sm font-extrabold text-slate-700">{formatHijriDate(referral.created_at)}</p>
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

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-md shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-800">تصدير الحالات لنظام نور</h3>
                <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <CloseIcon size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 mr-1 uppercase tracking-widest">من تاريخ</label>
                  <div className="flex flex-col gap-1">
                    <HijriDatePicker
                      value={exportDates.start}
                      onChange={(date) => setExportDates({...exportDates, start: date})}
                      className="sts-input w-full"
                    />
                    <span className="text-[10px] font-bold text-primary px-2">{formatHijriDate(exportDates.start)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 mr-1 uppercase tracking-widest">إلى تاريخ</label>
                  <div className="flex flex-col gap-1">
                    <HijriDatePicker
                      value={exportDates.end}
                      onChange={(date) => setExportDates({...exportDates, end: date})}
                      className="sts-input w-full"
                    />
                    <span className="text-[10px] font-bold text-primary px-2">{formatHijriDate(exportDates.end)}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleExportNoor}
                    disabled={exporting}
                    className="w-full sts-button-primary py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
                  >
                    {exporting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Download size={20} />
                    )}
                    <span>{exporting ? 'جاري التصدير...' : 'توليد ملف Excel'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-center text-slate-400 font-bold leading-relaxed">
                  سيتم تصدير الحالات "المغلقة" فقط خلال الفترة المحددة والتي لم يتم تصديرها مسبقاً.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagementReferrals;
