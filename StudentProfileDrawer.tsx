import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Printer, Share2 } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { formatHijriDate, formatHijriDateTime } from '../utils/dateUtils';
import { apiFetch } from '../utils/api';
import { logAction } from '../services/auditLogger';
import { useAuth } from '../context/AuthContext';
import { useSchoolSettings } from '../context/SchoolContext';

const positiveBehaviors = ['مجتهد', 'مشاركة فعالة', 'مساعدة زميل', 'تميز وابتكار'];

interface Student {
  id: number;
  name: string;
  avatar?: string;
}

interface StudentState {
  attendance: string;
  behaviorChips?: string[];
}

interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
  is_excused: boolean;
  source?: string;
  teacher_name?: string;
  subject?: string;
}

interface GradeRecord {
  task_id: string;
  task_name: string;
  max_score: number;
  noor_category: string;
  subject: string;
  score: number | string;
  updated_at: string;
  teacher_name: string;
}

interface TimelineEvent {
  event_type: string;
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
  tasks: any;
  grade: string;
  section: string;
  date: string;
  onClose: () => void;
}

export const StudentProfileDrawer: React.FC<StudentProfileDrawerProps> = ({ 
  student, 
  grade, 
  section,
  onClose 
}) => {
  const { user: currentUser } = useAuth();
  const { settings } = useSchoolSettings();
  
  const [allGrades, setAllGrades] = useState<GradeRecord[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!drawerRef.current) return;
    try {
      setIsSharing(true);
      const dataUrl = await htmlToImage.toPng(drawerRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `تقرير_${student.name}.png`, { type: 'image/png' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: `تقرير الطالب ${student.name}`, files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `تقرير_${student.name}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    logAction('أخرى', 'READ', 'الملف الشخصي للطالب', `قام بعرض الملف الشخصي للطالب ${student.name}`);
    
    const fetchDrawerData = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/student-drawer/${student.id}`);
        if (res.ok) {
          const data = await res.json();
          setStudentData(data.student);
          setAllGrades(data.allGrades || []);
          setAllAttendance(data.allAttendance || []);
          setTimeline(data.timeline || []);
        }
      } catch (err) {
        console.error('Failed to fetch student drawer data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDrawerData();
  }, [student.id]);

  const gradesByCategory = React.useMemo(() => {
    const categories: Record<string, GradeRecord[]> = {
      participation: [],
      homework: [],
      performance: [],
      exams: []
    };
    allGrades.forEach(grade => {
      const cat = grade.noor_category;
      if (categories[cat]) categories[cat].push(grade);
    });
    return categories;
  }, [allGrades]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm print:hidden"
      />

      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 left-0 z-50 w-full max-w-md bg-white shadow-2xl overflow-y-auto print:w-full print:absolute print:inset-0"
        dir="rtl"
        ref={drawerRef}
      >
        <div className="print:hidden">
          <div className="bg-teal-700 text-white p-6 rounded-b-xl mb-6 relative">
            <button 
              onClick={onClose} 
              className="absolute top-4 left-4 p-2 text-teal-100 hover:text-white hover:bg-teal-600/50 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-4 mt-4">
              <div className="w-16 h-16 rounded-full bg-white border-2 border-white shadow-md shrink-0 flex items-center justify-center text-2xl font-bold text-teal-700">
                {student.avatar ? (
                  <img 
                    src={student.avatar} 
                    alt={student.name} 
                    className="w-full h-full rounded-full object-cover" 
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.parentElement) {
                        e.currentTarget.parentElement.textContent = student.name.charAt(0);
                      }
                    }}
                  />
                ) : (
                  student.name.charAt(0)
                )}
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-bold">{student.name}</h2>
                <p className="text-teal-100 text-sm mt-1">{grade} - {section}</p>
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
                  <span className="hidden sm:inline">{isSharing ? 'جاري...' : 'مشاركة'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 pb-8">
            {/* Timeline */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">سجل المتابعة الشامل</h3>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500">جاري التحميل...</p>
                  </div>
                ) : timeline.length > 0 ? (
                  timeline.map((event, idx) => {
                    const dateObj = new Date(event.event_date);
                    const isBehavior = event.event_type === 'referral' || event.event_type === 'smart_behavior';
                    const isGrade = event.event_type === 'smart_grade' || event.event_type === 'score_log';
                    const isAttendance = event.event_type === 'attendance';

                    let iconColor = 'bg-slate-100 text-slate-600';
                    let typeLabel = 'حدث';
                    
                    if (isBehavior) {
                      iconColor = 'bg-amber-50 text-amber-700 border-amber-100';
                      typeLabel = 'سلوك';
                    } else if (isGrade) {
                      iconColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                      typeLabel = 'درجة';
                    } else if (isAttendance) {
                      iconColor = 'bg-red-50 text-red-700 border-red-100';
                      typeLabel = 'حضور';
                    }

                    return (
                      <div key={`${event.event_type}-${event.event_id}-${idx}`} className="relative pr-6 border-r-2 border-slate-100 pb-4 last:pb-0">
                        <div className={`absolute top-0 -right-[9px] w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                          isBehavior ? 'bg-amber-500' : isGrade ? 'bg-emerald-500' : isAttendance ? 'bg-red-500' : 'bg-slate-400'
                        }`} />
                        
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${iconColor}`}>
                                {typeLabel}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">
                                {formatHijriDateTime(dateObj)}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">{event.actor_name}</span>
                          </div>
                          <p className="text-sm text-slate-700 font-bold">{event.description}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-500 text-sm">لا توجد مدخلات</p>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance */}
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
                    {loading ? (
                      <tr><td colSpan={3} className="p-4 text-center text-slate-500">جاري التحميل...</td></tr>
                    ) : allAttendance.length > 0 ? (
                      allAttendance.map((record) => {
                        const dateObj = new Date(record.date);
                        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                        const dayName = days[dateObj.getDay()];
                        const isAbsent = record.status === 'absent' || record.status === 'غائب';
                        const isLate = record.status === 'late' || record.status === 'متأخر';
                        
                        return (
                          <tr key={`${record.source}-${record.id}`} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-slate-700">{dayName}</td>
                            <td className="p-3 text-slate-500" dir="ltr">{formatHijriDate(record.date)}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                                  isAbsent ? 'bg-red-50 text-red-700 border-red-100' :
                                  isLate ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                  'bg-emerald-50 text-emerald-700 border-emerald-100'
                                }`}>
                                  {isAbsent ? (record.is_excused ? 'غياب بعذر' : 'غياب') :
                                   isLate ? 'تأخر' : 'حاضر'}
                                </span>
                                {record.source === 'tracker' && record.subject && (
                                  <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                    {record.subject}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={3} className="p-4 text-center text-slate-500">لا يوجد سجل</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Academic Performance */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">الأداء الأكاديمي</h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-500">جاري تحميل الدرجات...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(['participation', 'homework', 'performance', 'exams'] as const).map((category, idx) => {
                    const titles = ['المشاركة', 'الواجبات', 'المهام الأدائية', 'الاختبارات'];
                    const colors = ['teal', 'indigo', 'amber', 'red'];
                    const grades = gradesByCategory[category] || [];
                    
                    return (
                      <div key={category}>
                        <h4 className={`text-sm font-bold text-${colors[idx]}-700 mb-3 flex items-center gap-2`}>
                          <div className={`w-1.5 h-4 bg-${colors[idx]}-500 rounded-full`}></div>
                          {titles[idx]}
                        </h4>
                        <div className="flex flex-col gap-2">
                          {grades.length > 0 ? (
                            grades.map(grade => (
                              <div key={grade.task_id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-slate-700">{grade.task_name}</span>
                                  <span className="text-xs text-slate-400">{formatHijriDate(new Date(grade.updated_at))}</span>
                                  <span className="text-[10px] text-slate-500">{grade.subject} • {grade.teacher_name}</span>
                                </div>
                                <div className="flex items-baseline gap-1 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
                                  <span className="text-sm font-bold text-slate-800">{grade.score ?? '-'}</span>
                                  <span className="text-xs text-slate-400">/ {grade.max_score}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-500 text-center py-2 bg-slate-50 rounded-lg border border-dashed border-slate-200">لا توجد مهام مسجلة</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};
