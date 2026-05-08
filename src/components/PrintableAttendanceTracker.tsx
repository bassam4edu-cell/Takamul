import React from 'react';
import type { Student } from '../types/tracker';
import { useSchoolSettings } from '../context/SchoolContext';
import { formatShortHijriDate } from '../utils/dateUtils';

interface AttendanceRecord {
  session_id: number;
  session_date: string;
  student_id: number;
  attendance: 'present' | 'late' | 'absent';
}

interface PrintableAttendanceTrackerProps {
  students: Student[];
  attendanceHistory: AttendanceRecord[];
  subject: string;
  grade: string;
  section: string;
  teacherName?: string;
}

export const PrintableAttendanceTracker: React.FC<PrintableAttendanceTrackerProps> = ({ 
  students, 
  attendanceHistory, 
  subject, 
  grade, 
  section, 
  teacherName 
}) => {
  const { settings } = useSchoolSettings();

  // Extract unique dates from history and sort them
  const uniqueDates = Array.from(new Set(attendanceHistory.map(r => r.session_date))).sort();

  // Create a map for quick lookup: map[studentId][date] = attendance
  const attendanceMap: Record<number, Record<string, string>> = {};
  students.forEach(s => {
    attendanceMap[s.id] = {};
  });

  attendanceHistory.forEach(r => {
    if (attendanceMap[r.student_id]) {
      attendanceMap[r.student_id][r.session_date] = r.attendance;
    }
  });

  const getAttendanceSymbol = (status: string) => {
    switch(status) {
      case 'present': return '✓';
      case 'late': return 'ت';
      case 'absent': return 'غ';
      default: return '';
    }
  };

  const getAttendanceColor = (status: string) => {
    switch(status) {
      case 'present': return 'text-emerald-600';
      case 'late': return 'text-amber-600';
      case 'absent': return 'text-red-600';
      default: return '';
    }
  };

  return (
    <div className="hidden print:block print:w-full print:bg-white" dir="rtl">
      <style>
        {`
          @media print {
            @page { size: A4 landscape; margin: 1cm; }
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
          <span>{settings.generalDirectorateName || 'الإدارة العامة للتعليم بمنطقة الرياض'}</span>
          <span>{settings.schoolName ? `مدرسة ${settings.schoolName}` : 'ثانوية أم القرى'}</span>
        </div>

        {/* المنتصف */}
        <div className="flex flex-col justify-center items-center mt-2 text-black">
          <h2 className="text-xl font-bold">سجل الحضور والغياب الشامل</h2>
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
          <tr className="bg-white text-black border-b-2 border-black print:break-inside-avoid">
            <th className="w-6 print:w-auto border border-black p-1 font-bold print:text-[10px]">م</th>
            <th className="w-48 print:w-auto print:min-w-[120px] border border-black p-1 font-bold text-right pr-2 print:text-[10px]">اسم الطالب</th>
            
            {uniqueDates.map(date => (
              <th key={date} className="border border-black p-1 font-bold print:text-[9px] w-8">
                <div className="flex flex-col items-center">
                  <span>{formatShortHijriDate(date)}</span>
                </div>
              </th>
            ))}
            
            <th className="w-12 print:w-auto border border-black p-1 font-bold print:text-[10px]">الغياب</th>
            <th className="w-12 print:w-auto border border-black p-1 font-bold print:text-[10px]">التأخر</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => {
            let absentCount = 0;
            let lateCount = 0;
            
            uniqueDates.forEach(date => {
              const status = attendanceMap[student.id]?.[date];
              if (status === 'absent') absentCount++;
              if (status === 'late') lateCount++;
            });

            return (
              <tr key={student.id} className="border-b border-black print:break-inside-avoid hover:bg-slate-50">
                <td className="border border-black p-1 font-bold">{index + 1}</td>
                <td className="border border-black p-1 text-right pr-2 font-bold whitespace-nowrap">{student.name}</td>
                
                {uniqueDates.map(date => {
                  const status = attendanceMap[student.id]?.[date];
                  return (
                    <td key={date} className={`border border-black p-1 font-bold text-[12px] ${getAttendanceColor(status)}`}>
                      {getAttendanceSymbol(status)}
                    </td>
                  );
                })}
                
                <td className="border border-black p-1 font-bold text-red-600">{absentCount > 0 ? absentCount : ''}</td>
                <td className="border border-black p-1 font-bold text-amber-600">{lateCount > 0 ? lateCount : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Legend */}
      <div className="mt-6 flex gap-6 text-[10px] font-bold text-black print:break-inside-avoid">
        <div className="flex items-center gap-2">
          <span className="text-emerald-600 text-[12px]">✓</span>
          <span>حاضر</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-600 text-[12px]">ت</span>
          <span>متأخر</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-600 text-[12px]">غ</span>
          <span>غائب</span>
        </div>
      </div>
    </div>
  );
};
