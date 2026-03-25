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
    return tasks[category].reduce((sum, t) => sum + (Number(studentsState[studentId].grades[t.id]) || 0), 0);
  };

  return (
    <div className="hidden print:block print:w-full print:bg-white" dir="rtl">
      <style>
        {`
          @media print {
            @page { size: A4 landscape; margin: 10mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}
      </style>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="text-sm font-bold leading-relaxed">
          <p>المملكة العربية السعودية</p>
          <p>وزارة التعليم</p>
          <p>{settings.schoolName ? `مدرسة ${settings.schoolName}` : 'مدرسة ....................'}</p>
        </div>

        <div className="flex flex-col items-center justify-center mt-4">
          <div className="bg-teal-700 text-white px-8 py-2 rounded-full font-bold text-xl shadow-sm border-2 border-teal-800">
            سجل متابعة الطلاب
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Placeholder for Vision 2030 Logo */}
          <div className="w-16 h-16 border-2 border-gray-300 rounded flex items-center justify-center text-[10px] text-gray-400 font-bold text-center">
            رؤية<br/>2030
          </div>
          {/* Placeholder for MOE Logo */}
          <div className="w-16 h-16 border-2 border-gray-300 rounded flex items-center justify-center text-[10px] text-gray-400 font-bold text-center">
            شعار<br/>الوزارة
          </div>
        </div>
      </div>

      {/* Meta-info Bar */}
      <div className="flex justify-between bg-teal-700 text-white p-3 text-sm font-bold mb-4 rounded-sm">
        <div>المادة / المقرر: ....................</div>
        <div>الشعبة / الصف: ....................</div>
        <div>اسم المعلم: ....................</div>
        <div>الفصل الدراسي: ....................</div>
      </div>

      {/* Master Table */}
      <table className="w-full border-collapse border border-gray-400 text-center text-sm">
        <thead>
          <tr className="bg-teal-700 text-white">
            <th rowSpan={2} className="w-8 border border-gray-400 p-2">م</th>
            <th rowSpan={2} className="w-48 border border-gray-400 p-2">اسم الطالب</th>
            
            {/* Dynamic Category Headers */}
            <th colSpan={Math.max(1, tasks.participation.length) + 1} className="border border-gray-400 p-2">المشاركة - 10 درجات</th>
            <th colSpan={Math.max(1, tasks.homework.length) + 1} className="border border-gray-400 p-2">الواجبات - 10 درجات</th>
            <th colSpan={Math.max(1, tasks.performance.length) + 1} className="border border-gray-400 p-2">المهام الأدائية - 20 درجة</th>
            <th colSpan={Math.max(1, tasks.exams.length) + 1} className="border border-gray-400 p-2">اختبار الفترة - 20 درجة</th>
            
            <th rowSpan={2} className="w-16 border border-gray-400 p-2">المجموع الكلي - 60</th>
          </tr>
          <tr className="bg-teal-100 text-teal-900 text-xs">
            {/* Participation Tasks */}
            {tasks.participation.length > 0 ? tasks.participation.map(t => (
              <th key={t.id} className="border border-gray-400 p-1 w-12">{t.name}</th>
            )) : <th className="border border-gray-400 p-1 w-12">-</th>}
            <th className="border border-gray-400 p-1 w-12 font-bold bg-teal-200/50">المجموع</th>

            {/* Homework Tasks */}
            {tasks.homework.length > 0 ? tasks.homework.map(t => (
              <th key={t.id} className="border border-gray-400 p-1 w-12">{t.name}</th>
            )) : <th className="border border-gray-400 p-1 w-12">-</th>}
            <th className="border border-gray-400 p-1 w-12 font-bold bg-teal-200/50">المجموع</th>

            {/* Performance Tasks */}
            {tasks.performance.length > 0 ? tasks.performance.map(t => (
              <th key={t.id} className="border border-gray-400 p-1 w-12">{t.name}</th>
            )) : <th className="border border-gray-400 p-1 w-12">-</th>}
            <th className="border border-gray-400 p-1 w-12 font-bold bg-teal-200/50">المجموع</th>

            {/* Exams Tasks */}
            {tasks.exams.length > 0 ? tasks.exams.map(t => (
              <th key={t.id} className="border border-gray-400 p-1 w-12">{t.name}</th>
            )) : <th className="border border-gray-400 p-1 w-12">-</th>}
            <th className="border border-gray-400 p-1 w-12 font-bold bg-teal-200/50">المجموع</th>
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
              <tr key={student.id} className="even:bg-gray-50">
                <td className="border border-gray-400 p-2 font-bold">{index + 1}</td>
                <td className="border border-gray-400 p-2 text-right font-bold">{student.name}</td>
                
                {/* Participation Grades */}
                {tasks.participation.length > 0 ? tasks.participation.map(t => (
                  <td key={t.id} className="border border-gray-400 p-1 text-gray-700">{studentsState[student.id].grades[t.id] || '-'}</td>
                )) : <td className="border border-gray-400 p-1 text-gray-400">-</td>}
                <td className="border border-gray-400 p-1 font-bold text-teal-800 bg-teal-50/50">{partTotal}</td>

                {/* Homework Grades */}
                {tasks.homework.length > 0 ? tasks.homework.map(t => (
                  <td key={t.id} className="border border-gray-400 p-1 text-gray-700">{studentsState[student.id].grades[t.id] || '-'}</td>
                )) : <td className="border border-gray-400 p-1 text-gray-400">-</td>}
                <td className="border border-gray-400 p-1 font-bold text-teal-800 bg-teal-50/50">{hwTotal}</td>

                {/* Performance Grades */}
                {tasks.performance.length > 0 ? tasks.performance.map(t => (
                  <td key={t.id} className="border border-gray-400 p-1 text-gray-700">{studentsState[student.id].grades[t.id] || '-'}</td>
                )) : <td className="border border-gray-400 p-1 text-gray-400">-</td>}
                <td className="border border-gray-400 p-1 font-bold text-teal-800 bg-teal-50/50">{perfTotal}</td>

                {/* Exams Grades */}
                {tasks.exams.length > 0 ? tasks.exams.map(t => (
                  <td key={t.id} className="border border-gray-400 p-1 text-gray-700">{studentsState[student.id].grades[t.id] || '-'}</td>
                )) : <td className="border border-gray-400 p-1 text-gray-400">-</td>}
                <td className="border border-gray-400 p-1 font-bold text-teal-800 bg-teal-50/50">{examTotal}</td>

                <td className="border border-gray-400 p-2 font-black text-lg text-teal-900 bg-teal-100/50">{overall}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="flex justify-between mt-12 text-sm font-bold px-8">
        <div>توقيع المعلم: ........................................</div>
        <div>توقيع مدير المدرسة: ........................................</div>
      </div>
    </div>
  );
};
