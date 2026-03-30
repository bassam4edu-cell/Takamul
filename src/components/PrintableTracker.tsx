import React from 'react';
import { Student, StudentState, TaskCategory, Task } from '../pages/SmartTracker';
import { useSchoolSettings } from '../context/SchoolContext';
import { formatHijriDate, formatShortHijriDate } from '../utils/dateUtils';

interface PrintableTrackerProps {
  students: Student[];
  studentsState: Record<number, StudentState>;
  tasks: Record<TaskCategory, Task[]>;
  subject: string;
  grade: string;
  section: string;
  teacherName?: string;
}

export const PrintableTracker: React.FC<PrintableTrackerProps> = ({ students, studentsState, tasks, subject, grade, section, teacherName }) => {
  const { settings } = useSchoolSettings();

  const getCategoryTotal = (studentId: number, category: TaskCategory) => {
    const studentState = studentsState[studentId];
    if (!studentState) return 0;
    return (tasks?.[category] || []).reduce((sum, t) => sum + (Number(studentState.grades?.[t.id]) || 0), 0);
  };

  return (
    <div className="hidden print:block print:w-full print:bg-white" dir="rtl">
      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 5mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
          }
        `}
      </style>

      {/* Header */}
      <div className="hidden print:flex print:w-full print:justify-between print:items-start print:border-b-2 print:border-black print:pb-4 print:mb-6">
        {/* اليمين - الكليشة الرسمية */}
        <div className="flex flex-col text-sm font-bold leading-relaxed text-right text-black">
          <span>المملكة العربية السعودية</span>
          <span>وزارة التعليم</span>
          <span>الإدارة العامة للتعليم بمنطقة الرياض</span>
          <span>ثانوية أم القرى بالخرج</span>
        </div>

        {/* المنتصف - عنوان الكشف */}
        <div className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-black text-black mb-2">كشف المتابعة الذكي</h2>
          <div className="flex gap-4 text-sm font-bold text-black bg-gray-100 px-4 py-2 rounded-lg print:bg-transparent print:border print:border-black">
            <span>المادة: {subject}</span>
            <span>|</span>
            <span>الصف: {grade}</span>
            <span>|</span>
            <span>الفصل: {section}</span>
          </div>
        </div>

        {/* اليسار - معلومات المعلم والزمن */}
        <div className="flex flex-col text-sm font-bold leading-relaxed text-left text-black">
          <span>المعلم: {teacherName}</span>
          <span>التاريخ: {new Date().toLocaleDateString('ar-SA')}</span>
          <span>العام الدراسي: 1446 هـ</span>
        </div>
      </div>

      {/* Master Table */}
      <table className="w-full border-collapse border-2 border-black text-center text-[9px]">
        <thead>
          <tr className="bg-white text-black border-b-2 border-black">
            <th rowSpan={2} className="w-6 border border-black p-0.5 font-bold">م</th>
            <th rowSpan={2} className="w-32 border border-black p-0.5 font-bold text-right pr-1">اسم الطالب</th>
            
            {(tasks.participation?.length || 0) > 0 && (
              <th colSpan={tasks.participation?.length} className="border border-black p-0.5 font-bold">المشاركة</th>
            )}
            {(tasks.homework?.length || 0) > 0 && (
              <th colSpan={tasks.homework?.length} className="border border-black p-0.5 font-bold">الواجبات</th>
            )}
            {(tasks.performance?.length || 0) > 0 && (
              <th colSpan={tasks.performance?.length} className="border border-black p-0.5 font-bold">المهام الأدائية</th>
            )}
            {(tasks.exams?.length || 0) > 0 && (
              <th colSpan={tasks.exams?.length} className="border border-black p-0.5 font-bold">الاختبارات</th>
            )}
            
            <th rowSpan={2} className="w-12 border border-black p-0.5 font-bold">المجموع</th>
          </tr>
          <tr className="bg-white text-black text-[7px] border-b-2 border-black">
            {tasks.participation?.map(t => (
              <th key={t.id} className="border border-black p-0.5 font-normal w-6" title={t.name}>
                <div className="truncate max-w-[30px] mx-auto">{t.name}</div>
                <div className="flex flex-col items-center gap-0">
                  <div className="text-[6px] text-gray-600 mt-0.5">({t.maxGrade})</div>
                  {t.date && <div className="text-[5px] text-gray-500">{formatShortHijriDate(t.date)}</div>}
                </div>
              </th>
            ))}
            {tasks.homework?.map(t => (
              <th key={t.id} className="border border-black p-0.5 font-normal w-6" title={t.name}>
                <div className="truncate max-w-[30px] mx-auto">{t.name}</div>
                <div className="flex flex-col items-center gap-0">
                  <div className="text-[6px] text-gray-600 mt-0.5">({t.maxGrade})</div>
                  {t.date && <div className="text-[5px] text-gray-500">{formatShortHijriDate(t.date)}</div>}
                </div>
              </th>
            ))}
            {tasks.performance?.map(t => (
              <th key={t.id} className="border border-black p-0.5 font-normal w-6" title={t.name}>
                <div className="truncate max-w-[30px] mx-auto">{t.name}</div>
                <div className="flex flex-col items-center gap-0">
                  <div className="text-[6px] text-gray-600 mt-0.5">({t.maxGrade})</div>
                  {t.date && <div className="text-[5px] text-gray-500">{formatShortHijriDate(t.date)}</div>}
                </div>
              </th>
            ))}
            {tasks.exams?.map(t => (
              <th key={t.id} className="border border-black p-0.5 font-normal w-6" title={t.name}>
                <div className="truncate max-w-[30px] mx-auto">{t.name}</div>
                <div className="flex flex-col items-center gap-0">
                  <div className="text-[6px] text-gray-600 mt-0.5">({t.maxGrade})</div>
                  {t.date && <div className="text-[5px] text-gray-500">{formatShortHijriDate(t.date)}</div>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => {
            const studentState = studentsState[student.id];
            
            const partTotal = getCategoryTotal(student.id, 'participation');
            const hwTotal = getCategoryTotal(student.id, 'homework');
            const perfTotal = getCategoryTotal(student.id, 'performance');
            const examTotal = getCategoryTotal(student.id, 'exams');
            const overall = partTotal + hwTotal + perfTotal + examTotal;

            return (
              <tr key={student.id} className="bg-white">
                <td className="border border-black p-0.5 font-bold text-black">{index + 1}</td>
                <td className="border border-black p-0.5 text-right pr-1 font-bold text-black text-[10px]">{student.name}</td>
                
                {tasks.participation?.map(t => (
                  <td key={t.id} className="border border-black p-0.5 text-black">
                    {studentState?.grades?.[t.id] || '-'}
                  </td>
                ))}
                {tasks.homework?.map(t => (
                  <td key={t.id} className="border border-black p-0.5 text-black">
                    {studentState?.grades?.[t.id] || '-'}
                  </td>
                ))}
                {tasks.performance?.map(t => (
                  <td key={t.id} className="border border-black p-0.5 text-black">
                    {studentState?.grades?.[t.id] || '-'}
                  </td>
                ))}
                {tasks.exams?.map(t => (
                  <td key={t.id} className="border border-black p-0.5 text-black">
                    {studentState?.grades?.[t.id] || '-'}
                  </td>
                ))}

                <td className="border border-black p-0.5 font-black text-[10px] text-black">{overall}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="flex justify-between mt-4 text-xs font-bold px-4 text-black">
        <div>توقيع المعلم: ........................................</div>
        <div>توقيع مدير المدرسة: ........................................</div>
      </div>
    </div>
  );
};
