import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../App';
import { CheckCircle2, XCircle, Clock, Save, UserCheck, AlertCircle, Printer, Filter, Calendar, MessageSquare, AlertTriangle, Search, Hourglass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VPRadar: React.FC = () => {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [grade, setGrade] = useState('all');
  const [section, setSection] = useState('all');
  
  const [grades, setGrades] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [originalAttendance, setOriginalAttendance] = useState<Record<number, string>>({});
  const [pendingClasses, setPendingClasses] = useState<{grade: string, section: string}[]>([]);
  const [completedClasses, setCompletedClasses] = useState<{grade: string, section: string}[]>([]);
  const [totalClassesCount, setTotalClassesCount] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Smart Dashboard States
  const [hasSearched, setHasSearched] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'حاضر' | 'غائب' | 'متأخر'>('all');

  // Report Engine States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<'daily' | 'warnings_3' | 'warnings_5' | 'excused_form'>('daily');
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<any>(null);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return Object.keys(attendance).some(id => attendance[Number(id)] !== originalAttendance[Number(id)]);
  }, [attendance, originalAttendance]);

  // Fetch Grades
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await fetch('/api/attendance/grades');
        if (res.ok) {
          const data = await res.json();
          setGrades(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchGrades();
  }, []);

  // Fetch Sections when Grade changes
  useEffect(() => {
    const fetchSections = async () => {
      if (grade === 'all') {
        setSections([]);
        setSection('all');
        return;
      }
      try {
        const res = await fetch(`/api/attendance/sections/${grade}`);
        if (res.ok) {
          const data = await res.json();
          setSections(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSections();
  }, [grade]);

  // Fetch Command Center Data & Pending Classes
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        date,
        grade,
        section
      });
      
      const [studentsRes, pendingRes] = await Promise.all([
        fetch(`/api/attendance/command-center?${params}`),
        fetch(`/api/attendance/pending-classes?date=${date}`)
      ]);

      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data);
        
        const currentAttendance: Record<number, string> = {};
        data.forEach((s: any) => {
          currentAttendance[s.id] = s.status || 'حاضر';
        });
        setAttendance(currentAttendance);
        setOriginalAttendance({...currentAttendance});
      }

      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        // Filter pending classes based on selected grade/section if needed
        let pending = pendingData.pending || [];
        let completed = pendingData.completed || [];
        
        if (grade !== 'all') {
          pending = pending.filter((c: any) => c.grade === grade);
          completed = completed.filter((c: any) => c.grade === grade);
        }
        if (section !== 'all') {
          pending = pending.filter((c: any) => c.section === section);
          completed = completed.filter((c: any) => c.section === section);
        }
        setPendingClasses(pending);
        setCompletedClasses(completed);
        setTotalClassesCount(pendingData.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when filters change
  useEffect(() => {
    fetchData();
    // We don't auto-set hasSearched to true here. 
    // The user must explicitly click Search or a KPI to view the list.
  }, [date, grade, section]);

  // Poll for pending classes every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/attendance/pending-classes?date=${date}`)
        .then(res => res.json())
        .then(pendingData => {
          let pending = pendingData.pending || [];
          let completed = pendingData.completed || [];
          if (grade !== 'all') {
            pending = pending.filter((c: any) => c.grade === grade);
            completed = completed.filter((c: any) => c.grade === grade);
          }
          if (section !== 'all') {
            pending = pending.filter((c: any) => c.section === section);
            completed = completed.filter((c: any) => c.section === section);
          }
          setPendingClasses(pending);
          setCompletedClasses(completed);
          setTotalClassesCount(pendingData.total || 0);
        })
        .catch(err => console.error('Failed to poll pending classes:', err));
    }, 30000);
    return () => clearInterval(interval);
  }, [date, grade, section]);

  const handleSearchClick = () => {
    setStatusFilter('all');
    setHasSearched(true);
  };

  const handleKPIClick = (status: 'حاضر' | 'غائب' | 'متأخر') => {
    setStatusFilter(status);
    setHasSearched(true);
  };

  const handleStatusChange = (studentId: number, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const records = students.map(s => ({
        student_id: s.id,
        status: attendance[s.id],
        grade: s.grade,
        section: s.section
      }));

      const res = await fetch('/api/attendance/submit-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records,
          teacher_id: user?.id,
          date,
          period: 1 // Default period for daily attendance
        })
      });

      if (res.ok) {
        setSuccess(true);
        setOriginalAttendance({...attendance});
        setTimeout(() => setSuccess(false), 3000);
        fetchData(); // Refresh to get updated teacher names and radar
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    setSelectedReportType('daily');
    setIsPrintModalOpen(true);
  };

  const getReportStudents = () => {
    let list = filteredStudents;
    if (selectedReportType === 'warnings_3') {
      list = students.filter(s => (s.total_absences || 0) >= 3);
    } else if (selectedReportType === 'warnings_5') {
      list = students.filter(s => (s.total_absences || 0) >= 5);
    } else if (selectedReportType === 'daily') {
      list = filteredStudents.filter(s => attendance[s.id] === 'غائب');
    }
    return list;
  };

  const handleSendSMS = (studentId: number) => {
    alert(`تم إرسال رسالة نصية (SMS) لولي أمر الطالب بنجاح.`);
  };

  const handleBulkSMS = () => {
    alert(`تم إرسال رسائل نصية (SMS) لجميع أولياء أمور الطلاب الغائبين بنجاح.`);
  };

  // KPIs
  const totalPresent = students.filter(s => attendance[s.id] === 'حاضر').length;
  const totalAbsent = students.filter(s => attendance[s.id] === 'غائب').length;
  const totalLate = students.filter(s => attendance[s.id] === 'متأخر').length;

  const progressPercentage = totalClassesCount > 0 ? Math.round((completedClasses.length / totalClassesCount) * 100) : 0;

  // Filtered Students
  const filteredStudents = useMemo(() => {
    if (statusFilter === 'all') return students;
    return students.filter(s => attendance[s.id] === statusFilter);
  }, [students, attendance, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto p-4 pb-24 space-y-6">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; direction: rtl; font-family: 'Tajawal', 'Cairo', sans-serif; }
          .print-table { border-collapse: collapse; width: 100%; border: 1px solid #000; }
          .print-table th, .print-table td { border: 1px solid #000; padding: 4px 8px; font-size: 11pt; text-align: right; color: #000; }
          .print-table th { background-color: #f3f4f6 !important; font-weight: bold; }
          .print-table tr:nth-child(even) { background-color: #f9fafb !important; }
          .print-table tr:nth-child(odd) { background-color: #ffffff !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
      
      {/* Print Views (Only visible when printing) */}
      <div id="printable-report" className="hidden print:block w-full bg-white text-black">
        {selectedReportType === 'excused_form' && selectedStudentForReport ? (
          <div className="p-4" dir="rtl">
            <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
              <div className="text-right font-bold text-sm leading-relaxed">
                <p>المملكة العربية السعودية</p>
                <p>وزارة التعليم</p>
                <p>المنطقة: إدارة التعليم بمحافظة الخرج</p>
                <p>المدرسة: ثانوية أم القرى</p>
              </div>
              <div className="text-left font-bold text-sm leading-relaxed" dir="ltr">
                <p>Kingdom of Saudi Arabia</p>
                <p>Ministry of Education</p>
              </div>
            </div>

            <h1 className="text-2xl font-black text-center mb-8">(نموذج إجراءات الغياب بعذر)</h1>

            <div className="mb-8 font-bold text-lg flex flex-wrap gap-8 bg-gray-50 p-4 border border-black rounded-lg print:bg-gray-50 print:border-black">
              <p>اسم الطالب: <span className="font-bold">{selectedStudentForReport.name}</span></p>
              <p>المرحلة: الثانوية</p>
              <p>الصف: {selectedStudentForReport.grade}</p>
            </div>

            <table className="print-table mb-12">
              <thead>
                <tr>
                  <th className="w-32 text-center">عدد أيام الغياب</th>
                  <th>الإجراء المتخذ</th>
                  <th className="w-32 text-center">تاريخ الإجراء</th>
                  <th className="w-32 text-center">توقيع الطالب</th>
                  <th className="w-32 text-center">توقيع ولي الأمر</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-bold text-center">3 أيام</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="font-bold text-center">5 أيام</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="font-bold text-center">10 أيام</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-between items-center mt-16 font-bold text-lg">
              <p>مدير المدرسة: .......</p>
              <p>التوقيع: .......</p>
              <p>التاريخ: .......</p>
            </div>
          </div>
        ) : (
          <div className="p-4" dir="rtl">
            <div className="grid grid-cols-3 gap-4 mb-6 border-b-2 border-black pb-4">
              <div className="text-right font-bold text-sm leading-relaxed">
                <p>المملكة العربية السعودية</p>
                <p>وزارة التعليم</p>
                <p>إدارة التعليم بمحافظة الخرج</p>
              </div>
              <div className="text-center flex flex-col items-center justify-center">
                <h2 className="text-lg font-black underline underline-offset-4">
                  {selectedReportType === 'daily' ? 'تقرير الغياب اليومي' :
                   selectedReportType === 'warnings_3' ? 'تقرير إنذارات الغياب (3 أيام فأكثر)' :
                   'تقرير إنذارات الغياب (5 أيام فأكثر)'}
                </h2>
              </div>
              <div className="text-left font-bold text-sm leading-relaxed">
                <p>المدرسة: ثانوية أم القرى بالخرج</p>
                <p>التاريخ: {date}</p>
                <p>رقم التقرير: {Math.floor(Math.random() * 10000)}</p>
              </div>
            </div>

            <table className="print-table mb-12">
              <thead>
                <tr>
                  <th className="w-10 text-center">م</th>
                  <th className="whitespace-nowrap">اسم الطالب الرباعي</th>
                  <th className="w-32 text-center whitespace-nowrap">رقم الهوية</th>
                  <th className="w-32 text-center">الصف والفصل</th>
                  <th className="w-24 text-center">الغياب</th>
                  <th className="w-full">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {getReportStudents().map((student, index) => (
                  <tr key={student.id}>
                    <td className="text-center">{index + 1}</td>
                    <td className="font-bold whitespace-nowrap">{student.name}</td>
                    <td className="text-center whitespace-nowrap">{student.national_id || '---'}</td>
                    <td className="text-center">{student.grade} - {student.section}</td>
                    <td className="text-center font-bold">{student.total_absences || 0}</td>
                    <td className="w-full"></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-center mt-16 font-bold text-lg">
              <p>وكيل شؤون الطلاب: {user?.name || 'الإدارة'} / التوقيع....</p>
              <p>مدير المدرسة: ....... / التوقيع....</p>
            </div>
          </div>
        )}
      </div>

      {/* Command Center Header & Filters (Hidden when printing) */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <UserCheck className="text-primary w-8 h-8" />
            رادار التحضير والغياب
          </h2>
          <button 
            onClick={handlePrint}
            className="w-full md:w-auto py-3 px-6 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg min-h-[44px]"
          >
            <Printer size={18} />
            طباعة التقرير المخصص
          </button>
        </div>

        {/* Overall Progress Bar */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-slate-700 text-sm">
              تم تحضير {completedClasses.length} من أصل {totalClassesCount} فصلاً - {progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <motion.div 
              className="bg-emerald-500 h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Hierarchical Grouping (Zen UI) */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-8">
          {Object.entries(
            [...pendingClasses.map(c => ({ ...c, status: 'pending' })), ...completedClasses.map(c => ({ ...c, status: 'completed' }))]
              .reduce((acc, curr) => {
                if (!acc[curr.grade]) acc[curr.grade] = [];
                acc[curr.grade].push(curr);
                return acc;
              }, {} as Record<string, any[]>)
          ).map(([gradeName, classes]) => (
            <div key={gradeName} className="space-y-4">
              <h3 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-3">
                {gradeName}
              </h3>
              <div className="flex flex-wrap gap-3">
                {classes
                  .sort((a, b) => a.section.localeCompare(b.section))
                  .map((c, idx) => (
                  <div 
                    key={`${c.grade}-${c.section}-${idx}`} 
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-500 border ${
                      c.status === 'completed' 
                        ? 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]' 
                        : 'bg-[#f3f4f6] text-[#9ca3af] border-[#e5e7eb]'
                    }`}
                  >
                    {c.grade} - {c.section}
                    {c.status === 'completed' && <CheckCircle2 size={16} className="text-[#166534]" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {totalClassesCount === 0 && (
            <div className="text-center text-slate-400 font-bold py-8">
              لا توجد فصول مسجلة لهذا اليوم
            </div>
          )}
        </div>

        {/* Smart Filters */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 text-slate-800 font-black shrink-0">
            <Filter size={18} className="text-primary" />
            <h3>الفلاتر:</h3>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
            <div className="relative">
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none min-h-[44px]"
              />
            </div>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none min-h-[44px]"
            >
              <option value="all">جميع الصفوف</option>
              {grades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              disabled={grade === 'all'}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50 min-h-[44px]"
            >
              <option value="all">جميع الفصول</option>
              {sections.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={handleSearchClick}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl py-3 px-4 text-sm font-black flex items-center justify-center gap-2 transition-all min-h-[44px]"
            >
              <Search size={18} />
              عرض السجلات
            </button>
          </div>
        </div>

        {/* Clickable KPIs (Always visible) */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleKPIClick('حاضر')}
            className={`rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center text-center transition-all border-2 ${
              statusFilter === 'حاضر' || statusFilter === 'all'
                ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                : 'bg-slate-50 border-transparent opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
            }`}
          >
            <CheckCircle2 className={`mb-2 w-8 h-8 ${statusFilter === 'حاضر' || statusFilter === 'all' ? 'text-emerald-500' : 'text-slate-400'}`} />
            <p className={`text-xs md:text-sm font-bold mb-1 ${statusFilter === 'حاضر' || statusFilter === 'all' ? 'text-emerald-600' : 'text-slate-500'}`}>الحاضرين ✅</p>
            <p className={`text-2xl md:text-4xl font-black ${statusFilter === 'حاضر' || statusFilter === 'all' ? 'text-emerald-700' : 'text-slate-600'}`}>{totalPresent}</p>
          </button>
          <button
            onClick={() => handleKPIClick('غائب')}
            className={`rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center text-center transition-all border-2 ${
              statusFilter === 'غائب' || statusFilter === 'all'
                ? 'bg-rose-50 border-rose-200 shadow-sm'
                : 'bg-slate-50 border-transparent opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
            }`}
          >
            <XCircle className={`mb-2 w-8 h-8 ${statusFilter === 'غائب' || statusFilter === 'all' ? 'text-rose-500' : 'text-slate-400'}`} />
            <p className={`text-xs md:text-sm font-bold mb-1 ${statusFilter === 'غائب' || statusFilter === 'all' ? 'text-rose-600' : 'text-slate-500'}`}>الغائبين ❌</p>
            <p className={`text-2xl md:text-4xl font-black ${statusFilter === 'غائب' || statusFilter === 'all' ? 'text-rose-700' : 'text-slate-600'}`}>{totalAbsent}</p>
          </button>
          <button
            onClick={() => handleKPIClick('متأخر')}
            className={`rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center text-center transition-all border-2 ${
              statusFilter === 'متأخر' || statusFilter === 'all'
                ? 'bg-amber-50 border-amber-200 shadow-sm'
                : 'bg-slate-50 border-transparent opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
            }`}
          >
            <Clock className={`mb-2 w-8 h-8 ${statusFilter === 'متأخر' || statusFilter === 'all' ? 'text-amber-500' : 'text-slate-400'}`} />
            <p className={`text-xs md:text-sm font-bold mb-1 ${statusFilter === 'متأخر' || statusFilter === 'all' ? 'text-amber-600' : 'text-slate-500'}`}>المتأخرين ⏱️</p>
            <p className={`text-2xl md:text-4xl font-black ${statusFilter === 'متأخر' || statusFilter === 'all' ? 'text-amber-700' : 'text-slate-600'}`}>{totalLate}</p>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!hasSearched ? (
        <div className="text-center p-16 bg-white rounded-3xl border border-slate-100 border-dashed print:hidden flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-primary/40" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">الرادار في وضع الاستعداد</h3>
          <p className="text-slate-500 font-bold">🔍 الرجاء استخدام الفلاتر أو الضغط على بطاقات الإحصائيات لعرض الطلاب</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center p-10 print:hidden">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredStudents.length > 0 ? (
        <>
          {/* Bulk Actions */}
          <AnimatePresence>
            {statusFilter === 'غائب' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="print:hidden overflow-hidden"
              >
                <button
                  onClick={handleBulkSMS}
                  className="w-full bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200 rounded-2xl py-4 px-6 text-sm font-black flex items-center justify-center gap-3 transition-all shadow-sm mb-6"
                >
                  <MessageSquare size={20} />
                  إرسال SMS لجميع الغائبين المعروضين
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Student Cards View (Hidden on Print) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:hidden">
            {filteredStudents.map((student) => {
              const absCount = student.total_absences || 0;
              const isAbsent = attendance[student.id] === 'غائب';
              
              return (
                <motion.div 
                  key={student.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-white p-5 rounded-3xl border transition-all shadow-sm flex flex-col sm:flex-row gap-4 items-center ${
                    attendance[student.id] === 'حاضر' ? 'border-emerald-200 bg-emerald-50/10' :
                    attendance[student.id] === 'غائب' ? 'border-rose-200 bg-rose-50/10' :
                    'border-amber-200 bg-amber-50/10'
                  }`}
                >
                  {/* Right: Info */}
                  <div className="flex-1 w-full text-right">
                    <span className="font-black text-slate-800 text-lg block mb-1">{student.name}</span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg inline-block">
                      {student.grade} - {student.section}
                    </span>
                  </div>

                  {/* Center: Toggles & Badges */}
                  <div className="flex-[2] w-full flex flex-col gap-3">
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleStatusChange(student.id, 'حاضر')}
                        className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                          attendance[student.id] === 'حاضر'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        <CheckCircle2 size={16} />
                        حاضر
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'غائب')}
                        className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                          attendance[student.id] === 'غائب'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        <XCircle size={16} />
                        غائب
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'متأخر')}
                        className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                          attendance[student.id] === 'متأخر'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        <Clock size={16} />
                        متأخر
                      </button>
                    </div>
                    
                    {/* Smart Badges */}
                    {isAbsent && absCount > 3 && (
                      <button 
                        onClick={handlePrint}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all hover:opacity-90 ${
                          absCount > 5 
                            ? 'bg-red-100 text-red-700 border border-red-200' 
                            : 'bg-orange-100 text-orange-700 border border-orange-200'
                        }`}
                      >
                        <AlertTriangle size={14} />
                        {absCount > 5 ? '🚨 تعهد واستدعاء: 5 أيام' : '⚠️ إنذار أول: 3 أيام'}
                      </button>
                    )}
                  </div>

                  {/* Left: Quick Actions */}
                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                    {isAbsent && (
                      <button
                        onClick={() => handleSendSMS(student.id)}
                        className="flex-1 sm:flex-none w-full sm:w-auto px-4 h-12 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 flex items-center justify-center gap-2 transition-all shadow-sm font-bold text-sm"
                        title="إرسال SMS لولي الأمر"
                      >
                        <MessageSquare size={18} />
                        إرسال SMS
                      </button>
                    )}
                    {isAbsent && absCount > 3 && (
                      <button
                        onClick={handlePrint}
                        className="flex-1 sm:flex-none w-full sm:w-auto px-4 h-12 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center justify-center gap-2 transition-all shadow-sm font-bold text-sm"
                        title="طباعة إنذار الغياب"
                      >
                        <Printer size={18} />
                        طباعة
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center p-10 bg-white rounded-3xl border border-slate-100 print:hidden">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">لا توجد بيانات مطابقة للبحث</p>
        </div>
      )}

      {/* Fixed Bottom Action (Hidden on Print) */}
      <AnimatePresence>
        {filteredStudents.length > 0 && hasUnsavedChanges && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-10 print:hidden"
          >
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full max-w-md mx-auto min-h-[56px] rounded-2xl font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg ${
                success 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                  : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
              }`}
            >
              {submitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : success ? (
                <>
                  <CheckCircle2 size={20} />
                  <span>تم حفظ التعديلات بنجاح</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>حفظ التعديلات في النظام</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Selection Modal */}
      <AnimatePresence>
        {isPrintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Printer className="text-primary" />
                  محرك التقارير الاحترافي
                </h3>
                <button onClick={() => setIsPrintModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700">اختر نوع التقرير:</label>
                  
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedReportType === 'daily' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/30'}`}>
                    <input type="radio" name="reportType" value="daily" checked={selectedReportType === 'daily'} onChange={() => setSelectedReportType('daily')} className="w-5 h-5 text-primary focus:ring-primary" />
                    <span className="font-bold text-slate-700">تقرير الغياب اليومي (حسب الفلاتر)</span>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedReportType === 'warnings_3' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-amber-500/30'}`}>
                    <input type="radio" name="reportType" value="warnings_3" checked={selectedReportType === 'warnings_3'} onChange={() => setSelectedReportType('warnings_3')} className="w-5 h-5 text-amber-500 focus:ring-amber-500" />
                    <span className="font-bold text-slate-700">تقرير إنذارات الغياب (3 أيام فأكثر)</span>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedReportType === 'warnings_5' ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-rose-500/30'}`}>
                    <input type="radio" name="reportType" value="warnings_5" checked={selectedReportType === 'warnings_5'} onChange={() => setSelectedReportType('warnings_5')} className="w-5 h-5 text-rose-500 focus:ring-rose-500" />
                    <span className="font-bold text-slate-700">تقرير إنذارات الغياب (5 أيام فأكثر)</span>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedReportType === 'excused_form' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-500/30'}`}>
                    <input type="radio" name="reportType" value="excused_form" checked={selectedReportType === 'excused_form'} onChange={() => setSelectedReportType('excused_form')} className="w-5 h-5 text-indigo-500 focus:ring-indigo-500" />
                    <span className="font-bold text-slate-700">نموذج إجراءات الغياب بعذر (طالب محدد)</span>
                  </label>
                </div>

                {selectedReportType === 'excused_form' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-bold text-slate-700">اختر الطالب:</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={selectedStudentForReport?.id || ''}
                      onChange={(e) => {
                        const st = students.find(s => s.id === Number(e.target.value));
                        setSelectedStudentForReport(st || null);
                      }}
                    >
                      <option value="">-- اختر طالباً --</option>
                      {students.filter(s => (s.total_absences || 0) > 0).map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.grade} - {s.section})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setIsPrintModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  إلغاء
                </button>
                <button 
                  onClick={() => {
                    if (selectedReportType === 'excused_form' && !selectedStudentForReport) {
                      alert('الرجاء اختيار الطالب أولاً');
                      return;
                    }
                    setTimeout(() => {
                      window.print();
                    }, 100);
                  }}
                  className="flex-1 py-3 px-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Printer size={18} />
                  طباعة التقرير
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VPRadar;
