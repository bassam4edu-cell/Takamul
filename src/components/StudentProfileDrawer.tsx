import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, BookOpen, Calculator, FlaskConical, Languages, Palette, ChevronLeft } from 'lucide-react';
import { Student, StudentState, TaskCategory, Task } from '../pages/SmartTracker';
import { formatHijriDate } from '../utils/dateUtils';
import { apiFetch } from '../utils/api';
import { logAction } from '../services/auditLogger';

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

interface StudentProfileDrawerProps {
  student: Student;
  state: StudentState;
  tasks: Record<TaskCategory, Task[]>;
  onClose: () => void;
}

export const StudentProfileDrawer: React.FC<StudentProfileDrawerProps> = ({ student, state, tasks, onClose }) => {
  if (!state) return null; // إضافة فحص أمان
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);

  useEffect(() => {
    logAction(
      'أخرى',
      'READ',
      'الملف الشخصي للطالب',
      `قام بعرض الملف الشخصي للطالب ${student.name}`
    );
    const fetchAttendance = async () => {
      try {
        const res = await apiFetch(`/api/student-profile/${student.id}`);
        if (res.ok) {
          const data = await res.json();
          setAttendanceRecords(data.attendanceRecords || []);
        }
      } catch (err) {
        console.error('Failed to fetch attendance', err);
      }
    };
    fetchAttendance();
  }, [student.id]);

  const getCategoryTotal = (category: TaskCategory) => {
    return tasks[category].reduce((sum, t) => sum + (Number(state.grades?.[t.id]) || 0), 0);
  };

  const getCategoryMax = (category: TaskCategory) => {
    return tasks[category].reduce((sum, t) => sum + t.maxGrade, 0);
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
  const allTasks = Object.values(tasks).flat();

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
        className="fixed inset-y-0 left-0 z-50 w-full max-w-md bg-white shadow-2xl overflow-y-auto print:hidden"
        dir="rtl"
      >
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
            <button 
              onClick={() => window.print()} 
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">طباعة التقرير التفصيلي</span>
            </button>
          </div>
        </div>

        <div className="px-6 pb-8">
          {/* Quick Stats Dashboard */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center text-center">
              <span className="text-xs font-bold text-slate-500 mb-1">المعدل الكلي</span>
              <span className="text-2xl font-black text-emerald-600">{percentage}%</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center text-center">
              <span className="text-xs font-bold text-slate-500 mb-1">نسبة الحضور</span>
              <span className={`text-2xl font-black ${student.semesterAttendance < 90 ? 'text-amber-500' : 'text-slate-700'}`}>
                {student.semesterAttendance}%
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center text-center col-span-2">
              <span className="text-xs font-bold text-slate-500 mb-1">عدد السلوكيات المسجلة</span>
              <span className="text-2xl font-black text-slate-700">{state.behaviorChips.length}</span>
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
                  {attendanceRecords.length > 0 ? (
                    attendanceRecords.map((record) => {
                      const dateObj = new Date(record.date);
                      const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                      const dayName = days[dateObj.getDay()];
                      return (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-slate-700">{dayName}</td>
                          <td className="p-3 text-slate-500" dir="ltr">{formatHijriDate(record.date)}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                              record.status === 'absent' ? 'bg-red-50 text-red-700 border-red-100' :
                              record.status === 'late' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                              {record.status === 'absent' ? (record.is_excused ? 'غياب بعذر' : 'غياب بدون عذر') :
                               record.status === 'late' ? 'تأخر صباحي' : 'حاضر'}
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
                            <span className="text-xs text-slate-400">{formatHijriDate(new Date())}</span>
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
                            <span className="text-xs text-slate-400">{formatHijriDate(new Date())}</span>
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
                            <span className="text-xs text-slate-400">{formatHijriDate(new Date())}</span>
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
                            <span className="text-xs text-slate-400">{formatHijriDate(new Date())}</span>
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
              {state.behaviorChips.length > 0 ? (
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

      {/* Printable Report */}
      <style type="text/css" media="print">
        {`
          body > * { display: none !important; }
          .print-only { display: block !important; }
        `}
      </style>
      <div className="hidden print:block print-only print:bg-white print:text-black print:p-8 w-full absolute top-0 left-0 z-[100]" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
          <div className="text-sm leading-relaxed">
            <p>المملكة العربية السعودية</p>
            <p>وزارة التعليم</p>
            <p>إدارة التعليم بـ ....................</p>
            <p>مدرسة ثانوية أم القرى</p>
          </div>
          <div className="text-center flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mt-4">تقرير الأداء الشامل للطالب</h1>
          </div>
          <div className="text-sm leading-relaxed text-left">
            <p>تاريخ الطباعة: {formatHijriDate(new Date())}</p>
            <p>رقم الكشف: {student.id}</p>
            <p>اسم الطالب: {student.name}</p>
            <p>الصف: الحالي</p>
          </div>
        </div>

        {/* Table 1: Attendance */}
        <div className="mb-8 print:break-inside-avoid">
          <h2 className="text-lg font-bold mb-3 bg-gray-100 p-2 border border-black">سجل الغياب والتأخر</h2>
          <table className="w-full border-collapse border border-black text-sm text-center">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2">اليوم</th>
                <th className="border border-black p-2">التاريخ الهجري</th>
                <th className="border border-black p-2">حالة الحضور</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.length > 0 ? (
                attendanceRecords.map((record) => {
                  const dateObj = new Date(record.date);
                  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                  const dayName = days[dateObj.getDay()];
                  return (
                    <tr key={record.id}>
                      <td className="border border-black p-2">{dayName}</td>
                      <td className="border border-black p-2" dir="ltr">{formatHijriDate(record.date)}</td>
                      <td className="border border-black p-2">
                        {record.status === 'absent' ? (record.is_excused ? 'غياب بعذر' : 'غياب بدون عذر') :
                         record.status === 'late' ? 'تأخر صباحي' : 'حاضر'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="border border-black p-4 text-gray-500">لا يوجد سجل غياب أو تأخر</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table 2: Academic */}
        <div className="mb-8 print:break-inside-avoid">
          <h2 className="text-lg font-bold mb-3 bg-gray-100 p-2 border border-black">السجل الأكاديمي والدرجات</h2>
          <table className="w-full border-collapse border border-black text-sm text-center">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 w-12">م</th>
                <th className="border border-black p-2">فئة المتابعة</th>
                <th className="border border-black p-2">اسم المهمة</th>
                <th className="border border-black p-2">الدرجة العظمى</th>
                <th className="border border-black p-2">الدرجة المكتسبة</th>
              </tr>
            </thead>
            <tbody>
              {allTasks.map((task, idx) => {
                const grade = state.grades?.[task.id];
                let categoryName = '';
                if (tasks.participation.find(t => t.id === task.id)) categoryName = 'مشاركة';
                else if (tasks.homework.find(t => t.id === task.id)) categoryName = 'واجبات';
                else if (tasks.performance.find(t => t.id === task.id)) categoryName = 'مهام أدائية';
                else if (tasks.exams.find(t => t.id === task.id)) categoryName = 'اختبارات';

                return (
                  <tr key={task.id}>
                    <td className="border border-black p-2">{idx + 1}</td>
                    <td className="border border-black p-2">{categoryName}</td>
                    <td className="border border-black p-2">{task.name}</td>
                    <td className="border border-black p-2">{task.maxGrade}</td>
                    <td className="border border-black p-2 font-bold">{grade !== undefined && grade !== '' ? grade : '-'}</td>
                  </tr>
                );
              })}
              {allTasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="border border-black p-4 text-gray-500">لا توجد مهام مسجلة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table 3: Behavior */}
        <div className="mb-8 print:break-inside-avoid">
          <h2 className="text-lg font-bold mb-3 bg-gray-100 p-2 border border-black">السجل السلوكي</h2>
          <table className="w-full border-collapse border border-black text-sm text-center">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 w-12">م</th>
                <th className="border border-black p-2">نوع السلوك</th>
                <th className="border border-black p-2">تفصيل الملاحظة</th>
                <th className="border border-black p-2">التاريخ الهجري</th>
              </tr>
            </thead>
            <tbody>
              {state.behaviorChips.map((chip, idx) => {
                const isPositive = positiveBehaviors.includes(chip) || chip.startsWith('🌟 ');
                return (
                  <tr key={idx}>
                    <td className="border border-black p-2">{idx + 1}</td>
                    <td className="border border-black p-2">{isPositive ? 'إيجابي' : 'سلبي'}</td>
                    <td className="border border-black p-2">{chip}</td>
                    <td className="border border-black p-2">{formatHijriDate(new Date())}</td>
                  </tr>
                );
              })}
              {state.behaviorChips.length === 0 && (
                <tr>
                  <td colSpan={4} className="border border-black p-4 text-gray-500">لا توجد ملاحظات سلوكية مسجلة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between mt-12 pt-8 print:break-inside-avoid">
          <div className="text-center">
            <p className="font-bold mb-8">توقيع المعلم</p>
            <p>........................</p>
          </div>
          <div className="text-center">
            <p className="font-bold mb-8">ختم المدرسة</p>
            <p>........................</p>
          </div>
          <div className="text-center">
            <p className="font-bold mb-8">إشعار ولي الأمر (الاسم والتوقيع)</p>
            <p>........................</p>
          </div>
        </div>
      </div>
    </>
  );
};