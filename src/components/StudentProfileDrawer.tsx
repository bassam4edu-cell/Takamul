import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Share2, BookOpen, Calculator, FlaskConical, Languages, Palette, ChevronLeft } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { Student, StudentState, TaskCategory, Task } from '../pages/SmartTracker';
import { formatHijriDate, formatHijriDateTime } from '../utils/dateUtils';
import { apiFetch } from '../utils/api';
import { logAction } from '../services/auditLogger';
import { useAuth } from '../context/AuthContext';
import { useSchoolSettings } from '../context/SchoolContext';

const positiveBehaviors = ['مجتهد', 'مشاركة فعالة', 'مساعدة زميل'];

// بيانات تجريبية للمواد
const mockSubjects = [
  { id: 1, name: 'الرياضيات', icon: Calculator, progress: 85, behaviorNotes: 2 },
  { id: 2, name: 'العلوم', icon: FlaskConical, progress: 92, behaviorNotes: 0 },
  { id: 3, name: 'اللغة العربية', icon: Languages, progress: 78, behaviorNotes: 1 },
  { id: 4, name: 'الفنية', icon: Palette, progress: 95, behaviorNotes: 0 },
];

interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
  is_excused: boolean;
}

interface TimelineEvent {
  event_type: 'referral' | 'attendance' | 'score_log' | 'smart_grade' | 'smart_behavior' | 'pass';
  event_id: number | string;
  event_date: string;
  actor_name: string;
  description: string;
  category: string;
  status: string;
}

interface StudentProfileDrawerProps {
  student: Student;
  state: StudentState;
  tasks: Record<TaskCategory, Task[]>;
  grade: string;
  section: string;
  date: string;
  onClose: () => void;
}

export const StudentProfileDrawer: React.FC<StudentProfileDrawerProps> = ({ student, state, tasks, grade, section, date, onClose }) => {
  const { user: currentUser } = useAuth();
  const { settings } = useSchoolSettings();
  if (!state) return null; // إضافة فحص أمان
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!drawerRef.current) return;
    try {
      setIsSharing(true);
      
      // Use html-to-image instead of html2canvas to support modern CSS like oklch
      const dataUrl = await htmlToImage.toPng(drawerRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      
      // Convert dataUrl to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      const file = new File([blob], `تقرير_${student.name}.png`, { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `تقرير الطالب ${student.name}`,
          files: [file]
        });
      } else {
        // Fallback for browsers that don't support file sharing
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تقرير_${student.name}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      alert('حدث خطأ أثناء تجهيز الصورة للمشاركة. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    logAction(
      'أخرى',
      'READ',
      'الملف الشخصي للطالب',
      `قام بعرض الملف الشخصي للطالب ${student.name}`
    );
    const fetchProfileData = async () => {
      try {
        const res = await apiFetch(`/api/student-profile/${student.id}`);
        if (res.ok) {
          const data = await res.json();
          setAttendanceRecords(data.attendanceRecords || []);
          setTimeline(data.timeline || []);
        }
      } catch (err) {
        console.error('Failed to fetch student profile data', err);
      }
    };
    fetchProfileData();
  }, [student.id]);

  const combinedAttendance = React.useMemo(() => {
    const records = [...attendanceRecords];
    
    // Check if the current session's date is already in the records
    const hasCurrentDate = records.some(r => r.date && r.date.startsWith(date));
    
    if (!hasCurrentDate && state.attendance !== 'present') {
      records.unshift({
        id: Date.now(), // mock ID
        date: date,
        status: state.attendance === 'absent' ? 'غائب' : 'متأخر',
        is_excused: false
      });
    }
    
    return records;
  }, [attendanceRecords, date, state.attendance]);

  const getCategoryTotal = (category: TaskCategory) => {
    return (tasks?.[category] || []).reduce((sum, t) => sum + (Number(state.grades?.[t.id]) || 0), 0);
  };

  const getCategoryMax = (category: TaskCategory) => {
    return (tasks?.[category] || []).reduce((sum, t) => sum + t.maxGrade, 0);
  };

  const participationTotal = getCategoryTotal('participation');
  const participationMax = getCategoryMax('participation');

  const homeworkTotal = getCategoryTotal('homework');
  const homeworkMax = getCategoryMax('homework');

  const performanceTotal = getCategoryTotal('performance');
  const performanceMax = getCategoryMax('performance');

  const examsTotal = getCategoryTotal('exams');
  const examsMax = getCategoryMax('exams');

  const overallTotal = participationTotal + homeworkTotal + performanceTotal + examsTotal;
  const overallMax = participationMax + homeworkMax + performanceMax + examsMax;

  const percentage = overallMax > 0 ? Math.round((overallTotal / overallMax) * 100) : 0;

  // Collect all tasks for the timeline
  const allTasks = Object.values(tasks || {}).flat();

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm print:hidden"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 left-0 z-50 w-full max-w-md bg-white shadow-2xl overflow-y-auto print:w-full print:absolute print:inset-0 print:border-none print:shadow-none print:max-w-none print:overflow-visible print:bg-white"
        dir="rtl"
        ref={drawerRef}
      >
        {/* Normal UI - Hidden in print */}
        <div className="print:hidden">
          {/* 360° Header */}
          <div className="bg-teal-700 text-white p-6 rounded-b-xl mb-6 relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 left-4 p-2 text-teal-100 hover:text-white hover:bg-teal-600/50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-4 mt-4">
            <img 
              src={student.avatar} 
              alt={student.name} 
              className="w-16 h-16 rounded-full bg-white border-2 border-white shadow-md shrink-0" 
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold">{student.name}</h2>
              <p className="text-teal-100 text-sm mt-1">الصف الحالي</p>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => window.print()} 
                className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Printer size={16} />
                <span className="hidden sm:inline">طباعة</span>
              </button>
              <button 
                onClick={handleShare} 
                disabled={isSharing}
                className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">{isSharing ? 'جاري التجهيز...' : 'مشاركة'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-8">
          {/* 1. Comprehensive Log Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">سجل المتابعة الشامل</h3>
            <div className="space-y-4">
              {timeline.length > 0 ? (
                timeline.map((event, idx) => {
                  const dateObj = new Date(event.event_date);
                  const isBehavior = event.event_type === 'referral' && event.category === 'behavior' || event.event_type === 'smart_behavior';
                  const isGrade = event.event_type === 'smart_grade' || event.event_type === 'score_log';
                  const isAttendance = event.event_type === 'attendance';
                  const isPass = event.event_type === 'pass';

                  let iconColor = 'bg-slate-100 text-slate-600';
                  let typeLabel = 'حدث';
                  
                  if (isBehavior) {
                    iconColor = 'bg-amber-50 text-amber-700 border-amber-100';
                    typeLabel = 'سلوك';
                  } else if (isGrade) {
                    iconColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    typeLabel = 'درجة/متابعة';
                  } else if (isAttendance) {
                    iconColor = 'bg-red-50 text-red-700 border-red-100';
                    typeLabel = 'حضور';
                  } else if (isPass) {
                    iconColor = 'bg-indigo-50 text-indigo-700 border-indigo-100';
                    typeLabel = 'إذن';
                  }

                  return (
                    <div key={`${event.event_type}-${event.event_id}-${idx}`} className="relative pr-6 border-r-2 border-slate-100 pb-4 last:pb-0">
                      <div className={`absolute top-0 -right-[9px] w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                        isBehavior ? 'bg-amber-500' : isGrade ? 'bg-emerald-500' : isAttendance ? 'bg-red-500' : isPass ? 'bg-indigo-500' : 'bg-slate-400'
                      }`} />
                      
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${iconColor}`}>
                              {typeLabel}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              {formatHijriDateTime(dateObj)}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">بواسطة: {event.actor_name}</span>
                        </div>
                        
                        <p className="text-sm text-slate-700 font-bold mb-1">
                          {event.description}
                        </p>
                        
                        {event.category && event.category !== 'completed' && (
                          <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                            التصنيف: {event.category}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-500 text-sm">لا توجد مدخلات مسجلة في السجل الشامل</p>
                </div>
              )}
            </div>
          </div>

          {/* 2. Attendance Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">سجل الغياب والتأخر</h3>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                  <tr>
                    <th className="p-3 font-semibold">اليوم</th>
                    <th className="p-3 font-semibold">التاريخ</th>
                    <th className="p-3 font-semibold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {combinedAttendance.length > 0 ? (
                    combinedAttendance.map((record) => {
                      const dateObj = new Date(record.date);
                      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                      const dayName = days[dateObj.getDay()];
                      const isAbsent = record.status === 'absent' || record.status === 'غائب';
                      const isLate = record.status === 'late' || record.status === 'متأخر';
                      
                      return (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-slate-700">{dayName}</td>
                          <td className="p-3 text-slate-500" dir="ltr">{formatHijriDate(record.date)}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                              isAbsent ? 'bg-red-50 text-red-700 border-red-100' :
                              isLate ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                              {isAbsent ? (record.is_excused ? 'غياب بعذر' : 'غياب بدون عذر') :
                               isLate ? 'تأخر صباحي' : 'حاضر'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-500">لا يوجد سجل غياب أو تأخر</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Academic Performance Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">الأداء الأكاديمي</h3>
            
            <div className="space-y-6">
              {/* Participation */}
              <div>
                <h4 className="text-sm font-bold text-teal-700 mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-teal-500 rounded-full"></div>
                  المشاركة
                </h4>
                <div className="flex flex-col gap-2">
                  {tasks.participation.length > 0 ? (
                    tasks.participation.map(task => {
                      const grade = state.grades?.[task.id];
                      return (
                        <div key={task.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">{task.name}</span>
                            <span className="text-xs text-slate-400">{task.date ? formatHijriDate(new Date(task.date)) : formatHijriDate(new Date(date))}</span>
                          </div>
                          <div className="flex items-baseline gap-1 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
                            <span className="text-sm font-bold text-slate-800">{grade !== undefined && grade !== '' ? grade : '-'}</span>
                            <span className="text-xs text-slate-400">/ {task.maxGrade}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">لا توجد مهام مسجلة</p>
                  )}
                </div>
              </div>

              {/* Homework */}
              <div>
                <h4 className="text-sm font-bold text-indigo-700 mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                  الواجبات
                </h4>
                <div className="flex flex-col gap-2">
                  {tasks.homework.length > 0 ? (
                    tasks.homework.map(task => {
                      const grade = state.grades?.[task.id];
                      return (
                        <div key={task.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">{task.name}</span>
                            <span className="text-xs text-slate-400">{task.date ? formatHijriDate(new Date(task.date)) : formatHijriDate(new Date(date))}</span>
                          </div>
                          <div className="flex items-baseline gap-1 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
                            <span className="text-sm font-bold text-slate-800">{grade !== undefined && grade !== '' ? grade : '-'}</span>
                            <span className="text-xs text-slate-400">/ {task.maxGrade}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">لا توجد مهام مسجلة</p>
                  )}
                </div>
              </div>

              {/* Performance Tasks */}
              <div>
                <h4 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                  المهام الأدائية
                </h4>
                <div className="flex flex-col gap-2">
                  {tasks.performance.length > 0 ? (
                    tasks.performance.map(task => {
                      const grade = state.grades?.[task.id];
                      return (
                        <div key={task.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">{task.name}</span>
                            <span className="text-xs text-slate-400">{task.date ? formatHijriDate(new Date(task.date)) : formatHijriDate(new Date(date))}</span>
                          </div>
                          <div className="flex items-baseline gap-1 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
                            <span className="text-sm font-bold text-slate-800">{grade !== undefined && grade !== '' ? grade : '-'}</span>
                            <span className="text-xs text-slate-400">/ {task.maxGrade}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">لا توجد مهام مسجلة</p>
                  )}
                </div>
              </div>

              {/* Exams */}
              <div>
                <h4 className="text-sm font-bold text-rose-700 mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-rose-500 rounded-full"></div>
                  اختبار الفترة
                </h4>
                <div className="flex flex-col gap-2">
                  {tasks.exams.length > 0 ? (
                    tasks.exams.map(task => {
                      const grade = state.grades?.[task.id];
                      return (
                        <div key={task.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">{task.name}</span>
                            <span className="text-xs text-slate-400">{task.date ? formatHijriDate(new Date(task.date)) : formatHijriDate(new Date(date))}</span>
                          </div>
                          <div className="flex items-baseline gap-1 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
                            <span className="text-sm font-bold text-slate-800">{grade !== undefined && grade !== '' ? grade : '-'}</span>
                            <span className="text-xs text-slate-400">/ {task.maxGrade}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">لا توجد مهام مسجلة</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Behavior Timeline Section */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">سجل السلوك</h3>
            <div className="flex flex-col gap-3">
              {state.behaviorChips?.length > 0 ? (
                state.behaviorChips.map((chip, idx) => {
                  const isPositive = positiveBehaviors.includes(chip) || chip.startsWith('🌟 ');
                  return (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                          isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {isPositive ? 'سلوك إيجابي' : 'سلوك سلبي'}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{formatHijriDate(new Date())}</span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">
                        {chip}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">لا توجد ملاحظات سلوكية مسجلة</p>
              )}
            </div>
          </div>

        </div>
        </div>

        {/* Printable Report */}
        <div className="hidden print:block print:p-4 w-full print:text-[9pt] print:leading-tight" dir="rtl">
          {/* 1. Official Header */}
          <div className="hidden print:flex print:justify-between print:border-b-2 print:border-black print:pb-2 print:mb-3">
            <div className="text-right print:text-xs text-sm leading-relaxed font-bold">
              <p>المملكة العربية السعودية</p>
              <p>وزارة التعليم</p>
              <p>{settings.generalDirectorateName || 'الإدارة العامة للتعليم بمنطقة الرياض'}</p>
              <p>{settings.schoolName ? `مدرسة ${settings.schoolName}` : 'ثانوية أم القرى'}</p>
            </div>
            <div className="text-center flex flex-col items-center justify-center">
              <h1 className="print:text-lg text-2xl font-bold mt-2">التقرير التفصيلي لمستوى الطالب</h1>
            </div>
            <div className="text-left print:text-xs text-sm leading-relaxed font-bold">
              <p>التاريخ: {new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { year: 'numeric', month: 'numeric', day: 'numeric' }).format(new Date()).replace(/ هـ| AH|هـ/g, '')}هـ</p>
            </div>
          </div>

          {/* 2. Student Info */}
          <div className="print:border print:border-gray-400 print:rounded-md print:p-2 print:mb-3 print:shadow-none flex justify-between items-center bg-gray-50 p-4 mb-6">
            <div>
              <span className="text-gray-500 print:text-xs text-sm">اسم الطالب:</span>
              <span className="font-bold print:text-sm text-lg mr-2">{student.name}</span>
            </div>
            <div>
              <span className="text-gray-500 print:text-xs text-sm">الصف:</span>
              <span className="font-bold print:text-sm text-lg mr-2">{grade || 'الحالي'}</span>
            </div>
            <div>
              <span className="text-gray-500 print:text-xs text-sm">الفصل:</span>
              <span className="font-bold print:text-sm text-lg mr-2">{section || '-'}</span>
            </div>
          </div>

          {/* 3. Academic & Attendance Grid */}
          <div className="print:grid print:grid-cols-2 print:gap-2 print:mb-3">
            {/* Participation */}
            <div className="print:bg-white print:border print:border-gray-300 print:shadow-none print:p-2 p-4 rounded-lg bg-teal-50">
              <h3 className="font-bold print:text-sm text-lg print:mb-1 mb-2 border-b print:pb-1 pb-2">المشاركة</h3>
              <div className="space-y-1 print:space-y-0.5 print:mb-1 mb-3">
                {tasks.participation?.map(t => {
                  const grade = state.grades?.[t.id];
                  const isDone = grade !== undefined && grade !== '' && Number(grade) > 0;
                  return (
                    <div key={t.id} className="flex justify-between print:text-xs text-sm">
                      <span>{t.name} <span className="print:text-[10px] text-xs text-gray-500 mr-1">({isDone ? 'نفذ' : 'لم ينفذ'})</span></span>
                      <span className="font-medium">{grade || 0} / {t.maxGrade}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center print:pt-1 pt-2 border-t">
                <span className="text-gray-600 font-bold print:text-xs">المجموع:</span>
                <span className="font-bold print:text-sm text-lg">{participationTotal} / {participationMax}</span>
              </div>
            </div>
            {/* Homework */}
            <div className="print:bg-white print:border print:border-gray-300 print:shadow-none print:p-2 p-4 rounded-lg bg-indigo-50">
              <h3 className="font-bold print:text-sm text-lg print:mb-1 mb-2 border-b print:pb-1 pb-2">الواجبات</h3>
              <div className="space-y-1 print:space-y-0.5 print:mb-1 mb-3">
                {tasks.homework?.map(t => {
                  const grade = state.grades?.[t.id];
                  const isDone = grade !== undefined && grade !== '' && Number(grade) > 0;
                  return (
                    <div key={t.id} className="flex justify-between print:text-xs text-sm">
                      <span>{t.name} <span className="print:text-[10px] text-xs text-gray-500 mr-1">({isDone ? 'نفذ' : 'لم ينفذ'})</span></span>
                      <span className="font-medium">{grade || 0} / {t.maxGrade}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center print:pt-1 pt-2 border-t">
                <span className="text-gray-600 font-bold print:text-xs">المجموع:</span>
                <span className="font-bold print:text-sm text-lg">{homeworkTotal} / {homeworkMax}</span>
              </div>
            </div>
            {/* Performance */}
            <div className="print:bg-white print:border print:border-gray-300 print:shadow-none print:p-2 p-4 rounded-lg bg-amber-50">
              <h3 className="font-bold print:text-sm text-lg print:mb-1 mb-2 border-b print:pb-1 pb-2">المهام الأدائية</h3>
              <div className="space-y-1 print:space-y-0.5 print:mb-1 mb-3">
                {tasks.performance?.map(t => {
                  const grade = state.grades?.[t.id];
                  const isDone = grade !== undefined && grade !== '' && Number(grade) > 0;
                  return (
                    <div key={t.id} className="flex justify-between print:text-xs text-sm">
                      <span>{t.name} <span className="print:text-[10px] text-xs text-gray-500 mr-1">({isDone ? 'نفذ' : 'لم ينفذ'})</span></span>
                      <span className="font-medium">{grade || 0} / {t.maxGrade}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center print:pt-1 pt-2 border-t">
                <span className="text-gray-600 font-bold print:text-xs">المجموع:</span>
                <span className="font-bold print:text-sm text-lg">{performanceTotal} / {performanceMax}</span>
              </div>
            </div>
            {/* Exams */}
            <div className="print:bg-white print:border print:border-gray-300 print:shadow-none print:p-2 p-4 rounded-lg bg-rose-50">
              <h3 className="font-bold print:text-sm text-lg print:mb-1 mb-2 border-b print:pb-1 pb-2">الاختبارات</h3>
              <div className="space-y-1 print:space-y-0.5 print:mb-1 mb-3">
                {tasks.exams?.map(t => {
                  const grade = state.grades?.[t.id];
                  const isDone = grade !== undefined && grade !== '' && Number(grade) > 0;
                  return (
                    <div key={t.id} className="flex justify-between print:text-xs text-sm">
                      <span>{t.name} <span className="print:text-[10px] text-xs text-gray-500 mr-1">({isDone ? 'نفذ' : 'لم ينفذ'})</span></span>
                      <span className="font-medium">{grade || 0} / {t.maxGrade}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center print:pt-1 pt-2 border-t">
                <span className="text-gray-600 font-bold print:text-xs">المجموع:</span>
                <span className="font-bold print:text-sm text-lg">{examsTotal} / {examsMax}</span>
              </div>
            </div>
            {/* Attendance */}
            <div className="print:bg-white print:border print:border-gray-300 print:shadow-none print:p-2 p-4 rounded-lg col-span-2 bg-slate-50">
              <h3 className="font-bold print:text-sm text-lg print:mb-1 mb-2 border-b print:pb-1 pb-2">سجل الغياب والتأخر</h3>
              <div className="space-y-2 print:space-y-0.5">
                {combinedAttendance.filter(r => r.status !== 'present' && r.status !== 'حاضر').length > 0 ? (
                  combinedAttendance.filter(r => r.status !== 'present' && r.status !== 'حاضر').map(record => {
                    const isAbsent = record.status === 'absent' || record.status === 'غائب';
                    const isLate = record.status === 'late' || record.status === 'متأخر';
                    
                    return (
                      <div key={record.id} className="flex justify-between items-center print:text-xs text-sm border-b border-gray-100 print:pb-0.5 pb-1 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className={`print:w-1.5 print:h-1.5 w-2 h-2 rounded-full ${isAbsent ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                          <span>{formatHijriDate(record.date)}</span>
                        </div>
                        <span className="font-medium">
                          {isAbsent ? 'غياب' : 'تأخر'}
                          {record.is_excused ? ' (بعذر)' : ' (بدون عذر)'}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="print:text-xs text-sm text-gray-500 text-center print:py-1 py-2">لا يوجد غياب أو تأخر مسجل.</p>
                )}
              </div>
            </div>
          </div>

          {/* 4. Teacher's Remarks Section */}
          <div className="mt-6 p-5 print:mt-2 print:p-2 bg-blue-50/50 rounded-xl print:bg-transparent print:border print:border-gray-400 print:rounded-md print:break-inside-avoid">
            <h3 className="text-lg print:text-sm font-bold text-gray-800 mb-3 print:mb-1 print:text-black print:border-b print:border-gray-300 print:pb-1">
              ملاحظات وتوجيهات المعلم:
            </h3>
            <p className="text-gray-700 print:text-xs leading-relaxed whitespace-pre-wrap print:text-black">
              {state.behaviorChips?.length > 0 ? state.behaviorChips.join('\n') : 'لا توجد ملاحظات مسجلة.'}
            </p>
          </div>

          {/* 4.5 Comprehensive Log (Print) */}
          <div className="mt-4 print:block hidden print:break-inside-avoid">
            <h3 className="text-lg print:text-sm font-bold text-gray-800 mb-2 print:mb-1 print:text-black print:border-b print:border-gray-300 print:pb-1">
              السجل التاريخي للمتابعة:
            </h3>
            <div className="space-y-1">
              {timeline.length > 0 ? (
                timeline.slice(0, 15).map((event, idx) => (
                  <div key={idx} className="flex justify-between items-start print:text-[8pt] border-b border-gray-100 pb-0.5">
                    <div className="flex gap-2">
                      <span className="font-bold min-w-[100px]">{formatHijriDateTime(new Date(event.event_date))}</span>
                      <span>{event.description}</span>
                    </div>
                    <span className="text-gray-500 italic">{event.actor_name}</span>
                  </div>
                ))
              ) : (
                <p className="print:text-xs text-gray-500">لا توجد مدخلات تاريخية مسجلة.</p>
              )}
              {timeline.length > 15 && <p className="text-[7pt] text-gray-400 text-center mt-1">... تم عرض آخر 15 مدخلاً فقط في التقرير المطبوع ...</p>}
            </div>
          </div>

          {/* 5. Teacher Footer */}
          <div className="hidden print:flex print:justify-end print:mt-2 print:pt-2 print:border-t print:border-gray-400 print:break-inside-avoid">
            <p className="text-lg print:text-xs font-bold text-gray-800 print:text-black">
              معلم المادة : {currentUser?.name || 'غير محدد'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Subject Detail Modal */}
      <AnimatePresence>
        {selectedSubject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
              dir="rtl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <selectedSubject.icon className="text-teal-600" />
                  {selectedSubject.name}
                </h3>
                <button onClick={() => setSelectedSubject(null)} className="p-1 hover:bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <p className="text-slate-600 mb-4">تفاصيل المتابعة الأكاديمية والسلوك الخاصة بمادة {selectedSubject.name}.</p>
              <div className="bg-slate-50 p-4 rounded-lg text-center text-slate-500">
                سيتم عرض كشف المتابعة والسلوك الخاص بهذه المادة هنا.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};