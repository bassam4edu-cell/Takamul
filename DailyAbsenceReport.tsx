import React from 'react';
import { Student, StudentState, TaskCategory, Task } from '../pages/SmartTracker';
import { useSchoolSettings } from '../context/SchoolContext';

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
      <div className="flex justify-between items-start mb-2 border-b-2 border-black pb-1">
        <div className="text-[10px] font-bold leading-relaxed text-black">
          <p>المملكة العربية السعودية</p>
          <p>وزارة التعليم</p>
          <p>{settings.schoolName ? `مدرسة ${settings.schoolName}` : 'مدرسة ....................'}</p>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="border-2 border-black text-black px-4 py-0.5 rounded-full font-bold text-base shadow-sm">
            كشف درجات الطلاب التفصيلي
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Logos removed as requested */}
        </div>
      </div>

      {/* Meta-info Bar */}
      <div className="flex justify-between border-2 border-black text-black px-2 py-1 text-[10px] font-bold mb-2 rounded-lg">
        <div>المادة: {subject || '....................'}</div>
        <div>الصف: {grade || '....................'} - الفصل: {section || '....................'}</div>
        <div>المعلم: {teacherName || '....................'}</div>
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
                <div className="text-[6px] text-gray-600 mt-0.5">({t.maxGrade})</div>
              </th>
            ))}
            {tasks.homework?.map(t => (
              <th key={t.id} className="border border-black p-0.5 font-normal w-6" title={t.name}>
                <div className="truncate max-w-[30px] mx-auto">{t.name}</div>
                <div className="text-[6px] text-gray-600 mt-0.5">({t.maxGrade})</div>
              </th>
            ))}
            {tasks.performance?.map(t => (
              <th key={t.id} className="border border-black p-0.5 font-normal w-6" title={t.name}>
                <div className="truncate max-w-[30px] mx-auto">{t.name}</div>
                <div className="text-[6px] text-gray-600 mt-0.5">({t.maxGrade})</div>
              </th>
            ))}
            {tasks.exams?.map(t => (
              <th key={t.id} className="border border-black p-0.5 font-normal w-6" title={t.name}>
                <div className="truncate max-w-[30px] mx-auto">{t.name}</div>
                <div className="text-[6px] text-gray-600 mt-0.5">({t.maxGrade})</div>
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
