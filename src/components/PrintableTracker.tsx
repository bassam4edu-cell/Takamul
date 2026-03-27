import React from 'react';
import { Student, StudentState, TaskCategory, Task } from '../pages/SmartTracker';
import { useSchoolSettings } from '../context/SchoolContext';

interface PrintableTrackerProps {
  students: Student[];
  studentsState: Record<number, StudentState>;
  tasks: Record<TaskCategory, Task[]>;
}

export const PrintableTracker: React.FC<PrintableTrackerProps> = ({ students, studentsState, tasks }) => {
  const { settings } = useSchoolSettings();

  const getCategoryTotal = (studentId: number, category: TaskCategory) => {
    const studentState = studentsState[studentId];
    if (!studentState) return 0;
    return tasks[category].reduce((sum, t) => sum + (Number(studentState.grades[t.id]) || 0), 0);
  };

  return (
    <div className="hidden print:block print:w-full print:bg-white" dir="rtl">
      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 15mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}
      </style>

      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b-2 border-slate-800 pb-4">
        <div className="text-sm font-bold leading-relaxed text-slate-800">
          <p>المملكة العربية السعودية</p>
          <p>وزارة التعليم</p>
          <p>{settings.schoolName ? `مدرسة ${settings.schoolName}` : 'مدرسة ....................'}</p>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="bg-slate-800 text-white px-8 py-2 rounded-full font-bold text-xl shadow-sm">
            كشف درجات الطلاب الإجمالي
          </div>
          <p className="text-sm font-semibold mt-2 text-slate-600">للتسليم للإدارة</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 border-2 border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 font-bold text-center">
            رؤية<br/>2030
          </div>
          <div className="w-16 h-16 border-2 border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 font-bold text-center">
            شعار<br/>الوزارة
          </div>
        </div>
      </div>

      {/* Meta-info Bar */}
      <div className="flex justify-between bg-slate-100 border border-slate-300 text-slate-800 p-4 text-sm font-bold mb-6 rounded-lg">
        <div>المادة / المقرر: ....................</div>
        <div>الشعبة / الصف: ....................</div>
        <div>اسم المعلم: ....................</div>
        <div>الفصل الدراسي: ....................</div>
      </div>

      {/* Master Table */}
      <table className="w-full border-collapse border-2 border-slate-800 text-center text-sm">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="w-12 border border-slate-700 p-3 font-bold text-lg">م</th>
            <th className="border border-slate-700 p-3 font-bold text-lg text-right pr-4">اسم الطالب</th>
            <th className="w-32 border border-slate-700 p-3 font-bold text-lg">المجموع الكلي (60)</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => {
            const partTotal = getCategoryTotal(student.id, 'participation');
            const hwTotal = getCategoryTotal(student.id, 'homework');
            const perfTotal = getCategoryTotal(student.id, 'performance');
            const examTotal = getCategoryTotal(student.id, 'exams');
            const overall = partTotal + hwTotal + perfTotal + examTotal;

            return (
              <tr key={student.id} className="even:bg-slate-50">
                <td className="border border-slate-400 p-3 font-bold text-slate-700">{index + 1}</td>
                <td className="border border-slate-400 p-3 text-right pr-4 font-bold text-slate-800 text-base">{student.name}</td>
                <td className="border border-slate-400 p-3 font-black text-xl text-slate-900 bg-slate-100">{overall}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="flex justify-between mt-16 text-base font-bold px-8 text-slate-800">
        <div>توقيع المعلم: ........................................</div>
        <div>توقيع مدير المدرسة: ........................................</div>
      </div>
    </div>
  );
};
