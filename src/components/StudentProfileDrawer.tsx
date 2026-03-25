import React from 'react';
import { motion } from 'framer-motion';
import { X, Printer } from 'lucide-react';
import { Student, StudentState, TaskCategory, Task } from '../pages/SmartTracker';
import { formatHijriDate } from '../utils/dateUtils';

const positiveBehaviors = ['مجتهد', 'مشاركة فعالة', 'مساعدة زميل'];

interface StudentProfileDrawerProps {
  student: Student;
  state: StudentState;
  tasks: Record<TaskCategory, Task[]>;
  onClose: () => void;
}

export const StudentProfileDrawer: React.FC<StudentProfileDrawerProps> = ({ student, state, tasks, onClose }) => {
  const getCategoryTotal = (category: TaskCategory) => {
    return tasks[category].reduce((sum, t) => sum + (Number(state.grades[t.id]) || 0), 0);
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
              <p className="text-teal-100 text-sm mt-1">رقم الكشف: {student.id} • الصف الحالي</p>
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

          {/* 1. Attendance Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">الحضور والغياب</h3>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-600">نسبة الحضور طوال الفصل</span>
                <span className="text-slate-800">{student.semesterAttendance}%</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${student.semesterAttendance < 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${student.semesterAttendance}%` }}
                />
              </div>
            </div>
          </div>

          {/* 2. Academic Performance Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">الأداء الأكاديمي (المهام)</h3>
            <div className="flex flex-col gap-2">
              {allTasks.length > 0 ? (
                allTasks.map(task => {
                  const grade = state.grades[task.id];
                  return (
                    <div key={task.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-sm font-medium text-slate-700">{task.name}</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-slate-800">{grade !== undefined && grade !== '' ? grade : '-'}</span>
                        <span className="text-xs text-slate-400">/ {task.maxGrade}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">لا توجد مهام مسجلة</p>
              )}
            </div>
          </div>

          {/* 3. Behavior Timeline Section */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">سجل السلوك</h3>
            <div className="relative border-r-2 border-slate-100 pr-4 ml-2 space-y-6 mt-4">
              {state.behaviorChips.length > 0 ? (
                state.behaviorChips.map((chip, idx) => {
                  const isPositive = positiveBehaviors.includes(chip) || chip.startsWith('🌟 ');
                  return (
                    <div key={idx} className="relative">
                      <div className={`absolute -right-[23px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className={`text-sm font-medium ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                          {chip}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {/* Mocking a date since we don't store dates for chips currently */}
                          {formatHijriDate(new Date())}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500 text-center py-4 pr-0">لا توجد ملاحظات سلوكية مسجلة</p>
              )}
            </div>
          </div>

        </div>
      </motion.div>

      {/* Printable Report */}
      <div className="hidden print:block print:bg-white print:text-black print:p-8 w-full absolute top-0 left-0 z-[100]" dir="rtl">
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
                <th className="border border-black p-2 w-12">م</th>
                <th className="border border-black p-2">اليوم</th>
                <th className="border border-black p-2">التاريخ الهجري</th>
                <th className="border border-black p-2">حالة الحضور</th>
              </tr>
            </thead>
            <tbody>
              {/* Mocking attendance history since it's not in state */}
              <tr>
                <td className="border border-black p-2">1</td>
                <td className="border border-black p-2">الأحد</td>
                <td className="border border-black p-2">1445/08/15</td>
                <td className="border border-black p-2">غياب بدون عذر</td>
              </tr>
              <tr>
                <td className="border border-black p-2">2</td>
                <td className="border border-black p-2">الثلاثاء</td>
                <td className="border border-black p-2">1445/08/24</td>
                <td className="border border-black p-2">تأخر صباحي</td>
              </tr>
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
                const grade = state.grades[task.id];
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