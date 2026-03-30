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
        {/* اليمين */}
        <div className="flex flex-col text-[11px] font-bold leading-relaxed text-right text-black">
          <span>المملكة العربية السعودية</span>
          <span>وزارة التعليم</span>
          <span>الإدارة العامة للتعليم بمنطقة الرياض</span>
          <span>ثانوية أم القرى بالخرج</span>
        </div>

        {/* المنتصف */}
        <div className="flex flex-col justify-center items-center mt-2 text-black">
          <h2 className="text-xl font-bold">كشف درجات الطلاب التفصيلي</h2>
        </div>

        {/* اليسار */}
        <div className="flex flex-col text-[11px] leading-relaxed text-right border-r-2 border-gray-400 pr-4 text-black gap-1">
          <span><span className="font-bold">المادة:</span> {subject}</span>
          <span><span className="font-bold">الصف:</span> {grade}</span>
          <span><span className="font-bold">الفصل:</span> {section}</span>
          <span><span className="font-bold">المعلم:</span> {teacherName}</span>
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
