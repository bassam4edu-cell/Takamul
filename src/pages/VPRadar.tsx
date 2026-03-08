import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Users, UserX, Clock, AlertTriangle, FileText, CheckCircle2, MessageSquare, RefreshCw, Printer, X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const VPRadar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printGrade, setPrintGrade] = useState('');
  const [printSection, setPrintSection] = useState('');
  const [availableClasses, setAvailableClasses] = useState<{grade: string, section: string}[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/attendance/classes');
        if (res.ok) {
          const data = await res.json();
          setAvailableClasses(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [radarRes, alertsRes] = await Promise.all([
        fetch(`/api/attendance/radar?date=${selectedDate}`),
        fetch('/api/attendance/check-limits')
      ]);

      if (radarRes.ok) {
        const radarData = await radarRes.json();
        setData(radarData);
      }
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const handleToggleExcuse = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/attendance/toggle-excuse/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_excused: !currentStatus })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendSMS = (studentName: string) => {
    alert(`تم إرسال رسالة SMS لولي أمر الطالب: ${studentName}\n"المكرم ولي أمر الطالب... نفيدكم بغياب ابنكم هذا اليوم"`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <span className="bg-primary/10 text-primary p-2 rounded-2xl">
              <Users size={28} />
            </span>
            رادار التحضير المباشر
          </h1>
          <p className="text-slate-500 mt-2 font-medium">متابعة لحظية لحضور وغياب الطلاب</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm font-bold"
            />
          </div>
          <button 
            onClick={() => setShowPrintModal(true)}
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700 hover:text-primary hover:border-primary/30 transition-all shadow-sm flex items-center gap-2 font-bold"
          >
            <Printer size={20} />
            <span className="hidden sm:inline">طباعة التقارير</span>
          </button>
          <button 
            onClick={fetchData}
            className={`p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-primary hover:border-primary/30 transition-all shadow-sm ${refreshing ? 'animate-spin text-primary' : ''}`}
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Automated Behavior Alerts */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-3xl p-6 shadow-sm"
          >
            <h3 className="text-red-800 font-extrabold text-lg flex items-center gap-2 mb-4">
              <AlertTriangle className="text-red-600" />
              تنبيهات تجاوز حد الغياب (بدون عذر)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.map((alert, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800">{alert.student.name}</h4>
                      <span className="bg-red-100 text-red-700 text-xs font-black px-2 py-1 rounded-lg">
                        {alert.days} أيام غياب
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">{alert.student.grade} - {alert.student.section}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/print/17/${alert.student.id}`)} // Assuming template 17 is for absence
                    className="w-full py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText size={16} />
                    إصدار نموذج الغياب وخصم المواظبة
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -left-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-emerald-600 font-bold mb-1">إجمالي الحضور</p>
              <h2 className="text-4xl font-black text-slate-800">{data?.counters?.present || 0}</h2>
            </div>
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -left-6 -top-6 w-24 h-24 bg-red-50 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-red-600 font-bold mb-1">إجمالي الغياب</p>
              <h2 className="text-4xl font-black text-slate-800">{data?.counters?.absent || 0}</h2>
            </div>
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
              <UserX size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -left-6 -top-6 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-150 transition-transform duration-500" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-amber-600 font-bold mb-1">إجمالي المتأخرين</p>
              <h2 className="text-4xl font-black text-slate-800">{data?.counters?.late || 0}</h2>
            </div>
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
              <Clock size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Actionable List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
            <UserX className="text-slate-400" />
            سجل غياب يوم: {selectedDate}
          </h3>
          <span className="bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
            {data?.actionableList?.length || 0} طالب
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                <th className="p-4 font-bold">اسم الطالب</th>
                <th className="p-4 font-bold">الصف والفصل</th>
                <th className="p-4 font-bold">الحالة</th>
                <th className="p-4 font-bold">الحصة / المعلم</th>
                <th className="p-4 font-bold">العذر</th>
                <th className="p-4 font-bold">إجراءات سريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.actionableList?.map((record: any) => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-800">{record.student_name}</td>
                  <td className="p-4 text-slate-600 text-sm">{record.grade} - {record.section}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      record.status === 'غائب' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 text-sm">
                    الحصة {record.period} <br/>
                    <span className="text-xs text-slate-400">{record.teacher_name}</span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleExcuse(record.id, record.is_excused)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        record.is_excused 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {record.is_excused ? 'بعذر طبي ✅' : 'بدون عذر ❌'}
                    </button>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleSendSMS(record.student_name)}
                      className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-100"
                    >
                      <MessageSquare size={14} />
                      إرسال SMS لولي الأمر
                    </button>
                  </td>
                </tr>
              ))}
              {(!data?.actionableList || data.actionableList.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500 font-bold">
                    <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                    لا يوجد غياب أو تأخر مسجل اليوم
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Modal */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                  <Printer className="text-primary" />
                  خيارات طباعة التقارير
                </h3>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Option 1: Daily Report */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-700">1. تقرير الغياب اليومي الشامل</h4>
                  <button
                    onClick={() => {
                      setShowPrintModal(false);
                      navigate(`/print/daily-absence?date=${selectedDate}`);
                    }}
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <FileText size={18} />
                    طباعة التقرير الشامل
                  </button>
                </div>

                <div className="h-px bg-slate-100 w-full"></div>

                {/* Option 2: Filtered Report */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-700">2. تقرير مخصص حسب الصف والفصل</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">الصف</label>
                      <select
                        value={printGrade}
                        onChange={(e) => {
                          setPrintGrade(e.target.value);
                          setPrintSection('');
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      >
                        <option value="">الكل</option>
                        {Array.from(new Set(availableClasses.map(c => c.grade))).map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">الفصل</label>
                      <select
                        value={printSection}
                        onChange={(e) => setPrintSection(e.target.value)}
                        disabled={!printGrade}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50"
                      >
                        <option value="">الكل</option>
                        {availableClasses.filter(c => c.grade === printGrade).map(c => (
                          <option key={c.section} value={c.section}>{c.section}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPrintModal(false);
                      let url = `/print/daily-absence?date=${selectedDate}`;
                      if (printGrade && printSection) {
                        url += `&grade=${encodeURIComponent(printGrade)}&section=${encodeURIComponent(printSection)}`;
                      }
                      navigate(url);
                    }}
                    disabled={!printGrade || !printSection}
                    className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Printer size={18} />
                    طباعة التقرير المخصص
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VPRadar;
