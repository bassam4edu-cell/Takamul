import { SubjectDetailedLogView } from '../components/SubjectDetailedLogView';
import { apiFetch } from '../utils/api';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Calendar, 
  FileText, 
  ArrowRight,
  ShieldAlert,
  Clock,
  BookOpen,
  GraduationCap,
  X,
  UserCircle,
  Edit,
  Trash2,
  Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatHijriDate } from '../utils/dateUtils';
import { logAction } from '../services/auditLogger';

interface Student {
  id: number;
  name: string;
  grade: string;
  section: string;
  national_id: string;
  live_behavior_score: number;
  live_attendance_score: number;
}

interface Referral {
  id: number;
  created_at: string;
  teacher_name: string;
  reason: string;
  status: string;
}

interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
  is_excused: boolean;
  teacher_name: string;
}

interface BehaviorRecord {
  id: number;
  violation_name: string;
  degree: number;
  created_at: string;
  remedial_plan: string | null;
  status: string;
  teacher_name: string;
}

interface StudentProfileProps {
  studentId?: string | number;
  isReadOnly?: boolean;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ studentId, isReadOnly = false }) => {
  const { id: paramId } = useParams();
  const id = studentId || paramId;
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [behaviorRecords, setBehaviorRecords] = useState<BehaviorRecord[]>([]);
  const [trackerData, setTrackerData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'referrals' | 'behavior' | 'attendance' | 'muwada_akademiya'>('referrals');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await apiFetch('/api/admin/students/filters');
        if (res.ok) {
          const data = await res.json();
          setFilters(data.filters || {});
        }
      } catch (err) {
        console.error("Failed to fetch filters", err);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch(`/api/student-profile/${id}`);
        if (!res.ok) throw new Error('Failed to fetch student profile');
        const data = await res.json();
        setStudent(data.student);
        
        logAction(
          'أخرى',
          'READ',
          'الملف الشخصي للطالب',
          `قام بعرض الملف الشخصي للطالب ${data.student?.name}`
        );

        setReferrals(data.referrals || []);
        setAttendanceRecords(data.attendanceRecords || []);
        setBehaviorRecords(data.behaviorRecords || []);
        
        const localLogs = JSON.parse(localStorage.getItem('takamol_student_logs') || '[]');
        const studentLocalLogs = localLogs.filter((log: any) => log.studentId === Number(id));
        setTrackerData([...(data.trackerData || []), ...studentLocalLogs]);
      } catch (err) {
        console.error('Failed to fetch student data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    const handleLogsUpdated = () => {
      const localLogs = JSON.parse(localStorage.getItem('takamol_student_logs') || '[]');
      const studentLocalLogs = localLogs.filter((log: any) => log.studentId === Number(id));
      setTrackerData(prev => {
        const apiData = prev.filter(p => !p.id || typeof p.id === 'string'); // Filter out local logs
        return [...apiData, ...studentLocalLogs];
      });
    };
    
    window.addEventListener('takamol_logs_updated', handleLogsUpdated);
    return () => window.removeEventListener('takamol_logs_updated', handleLogsUpdated);
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!student) return <div className="text-center p-10 font-bold text-slate-500">الطالب غير موجود</div>;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_vice_principal': return 'بانتظار الوكيل';
      case 'pending_counselor': return 'بانتظار الموجه';
      case 'scheduled_meeting': return 'مقابلة مجدولة';
      case 'resolved': return 'تمت المعالجة';
      case 'closed': return 'مغلق';
      default: return status;
    }
  };

  const getDayName = (dateString: string) => {
    return formatHijriDate(dateString).split('،')[0];
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;

    try {
      const res = await apiFetch(`/api/admin/students/${student.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      if (res.ok) {
        setStudent({ ...student, ...editData });
        setIsEditing(false);
      } else {
        alert('فشل تحديث البيانات');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء التحديث');
    }
  };

  const handleDeleteStudent = async () => {
    if (!window.confirm('هل أنت متأكد من فصل/حذف هذا الطالب؟ سيتم حذف جميع سجلاته ومخالفاته.')) return;
    
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/admin/students/${student.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        navigate('/dashboard/students');
      } else {
        alert('فشل حذف الطالب');
        setIsDeleting(false);
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحذف');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {!isReadOnly && (
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold"
          >
            <ArrowRight size={20} />
            <span>العودة</span>
          </button>
        </div>
      )}

      {/* Student Header Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm relative"
      >
        {user?.role === 'admin' && !isReadOnly && (
          <div className="absolute top-4 left-4 flex gap-2">
            <button
              onClick={() => {
                setEditData({
                  name: student.name,
                  national_id: student.national_id,
                  grade: student.grade,
                  section: student.section,
                  parent_phone: (student as any).parent_phone || ''
                });
                setIsEditing(true);
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="تعديل بيانات الطالب"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={handleDeleteStudent}
              disabled={isDeleting}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="فصل/حذف الطالب"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-right">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-inner shrink-0">
            <User size={40} />
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{student.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 text-slate-500 font-bold">
              <span className="bg-slate-50 px-3 py-1 rounded-lg text-sm border border-slate-100">{student.grade} - {student.section}</span>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-100 text-center min-w-[120px]">
              <p className="text-xs text-slate-500 font-bold mb-1">السلوك</p>
              <p className={`text-2xl md:text-3xl font-black ${student.live_behavior_score < 60 ? 'text-rose-600' : 'text-primary'}`}>{student.live_behavior_score}</p>
            </div>
            <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-100 text-center min-w-[120px]">
              <p className="text-xs text-slate-500 font-bold mb-1">المواظبة</p>
              <p className={`text-2xl md:text-3xl font-black ${student.live_attendance_score < 80 ? 'text-rose-600' : 'text-indigo-600'}`}>{student.live_attendance_score}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Deep-Dive Tabs */}
      <div className="space-y-6">
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('referrals')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'referrals' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={18} />
            <span> تحويلات المعلمين</span>
          </button>
          <button
            onClick={() => setActiveTab('behavior')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'behavior' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldAlert size={18} />
            <span>️ المشكلات السلوكية</span>
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'attendance' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock size={18} />
            <span> الغياب والتأخر</span>
          </button>
          <button
            onClick={() => setActiveTab('muwada_akademiya')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'muwada_akademiya' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <GraduationCap size={18} />
            <span>الأداء الأكاديمي</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[300px]">
          <AnimatePresence mode="wait">
            {activeTab === 'muwada_akademiya' && (
              <motion.div
                key="tab-muwada_akademiya"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6"
              >
                {selectedSubject ? (
                  <SubjectDetailedLogView 
                    subject={selectedSubject}
                    studentName={student.name}
                    studentId={student.id}
                    serverLogs={trackerData}
                    onBack={() => setSelectedSubject(null)}
                  />
                ) : (
                  <div>
                    <h3 className="font-bold text-slate-800 mb-4">المواد الدراسية</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from(new Set(trackerData.map(log => log.subject))).map(subject => {
                        const subjectLog = trackerData.find(log => log.subject === subject);
                        const teacherName = subjectLog?.teacher_name || subjectLog?.teacherName || 'أ. معلم المادة';

                        return (
                          <div 
                            key={subject as string}
                            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all flex flex-col gap-3"
                            onClick={() => setSelectedSubject(subject as string)}
                          >
                            <div className="flex justify-between items-start">
                              <p className="font-bold text-lg text-slate-800">{subject as string}</p>
                            </div>
                            
                            <div className="flex items-center gap-2 text-slate-500 text-sm mt-auto pt-2 border-t border-slate-50">
                              <UserCircle size={16} className="text-slate-400" />
                              <span>{teacherName}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            {activeTab === 'referrals' && (
              <motion.div
                key="tab-referrals"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {referrals.length === 0 ? (
                  <div className="text-center text-slate-400 font-bold py-12">لا توجد تحويلات مسجلة</div>
                ) : (
                  <div>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-bold">
                            <th className="p-4">التاريخ</th>
                            <th className="p-4">المعلم</th>
                            <th className="p-4">السبب</th>
                            <th className="p-4">الحالة</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm font-bold text-slate-700">
                          {referrals.map(referral => (
                            <tr 
                              key={referral.id} 
                              onClick={() => !isReadOnly && navigate(`/dashboard/referral/${referral.id}`)}
                              className={`border-b border-slate-50 last:border-0 transition-colors ${!isReadOnly ? 'hover:bg-slate-50 cursor-pointer' : ''}`}
                            >
                              <td className="p-4">{formatHijriDate(referral.created_at)}</td>
                              <td className="p-4">{referral.teacher_name}</td>
                              <td className="p-4 max-w-xs truncate">{referral.reason}</td>
                              <td className="p-4">
                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs">
                                  {getStatusText(referral.status)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile Card View */}
                    <div className="md:hidden flex flex-col gap-4 p-4">
                      {referrals.map(referral => (
                        <div 
                          key={referral.id}
                          onClick={() => !isReadOnly && navigate(`/dashboard/referral/${referral.id}`)}
                          className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 transition-colors ${!isReadOnly ? 'cursor-pointer hover:border-primary/30' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <FileText size={16} className="text-slate-400" />
                              <span className="font-bold text-slate-800 text-sm">{referral.teacher_name}</span>
                            </div>
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-bold">
                              {getStatusText(referral.status)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-bold line-clamp-2">{referral.reason}</p>
                          <div className="text-[10px] text-slate-400 font-bold">
                            {formatHijriDate(referral.created_at)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'behavior' && (
              <motion.div
                key="tab-behavior"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {behaviorRecords.length === 0 ? (
                  <div className="text-center text-slate-400 font-bold py-12">لا توجد مشكلات سلوكية مسجلة</div>
                ) : (
                  <div>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-bold">
                            <th className="p-4 text-right">التاريخ</th>
                            <th className="p-4 text-right">نوع المخالفة</th>
                            <th className="p-4 text-right">الدرجة</th>
                            <th className="p-4 text-right">المعلم الراصد</th>
                            <th className="p-4 text-right">الإجراء المتخذ</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm font-bold text-slate-700">
                          {behaviorRecords.map(record => (
                            <tr key={record.id} className="border-b border-slate-50 last:border-0">
                              <td className="p-4">{formatHijriDate(record.created_at)}</td>
                              <td className="p-4">{record.violation_name}</td>
                              <td className="p-4">
                                <span className={`px-3 py-1 rounded-full text-xs ${
                                  record.degree >= 4 ? 'bg-rose-100 text-rose-700' :
                                  record.degree === 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  الدرجة {record.degree}
                                </span>
                              </td>
                              <td className="p-4">{record.teacher_name}</td>
                              <td className="p-4 max-w-xs truncate">
                                {record.remedial_plan || getStatusText(record.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile Card View */}
                    <div className="md:hidden flex flex-col gap-4 p-4">
                      {behaviorRecords.map(record => (
                        <div key={record.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <ShieldAlert size={16} className="text-slate-400" />
                              <span className="font-bold text-slate-800 text-sm">{record.violation_name}</span>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                              record.degree >= 4 ? 'bg-rose-100 text-rose-700' :
                              record.degree === 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              الدرجة {record.degree}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                            <UserCircle size={14} className="text-slate-400" />
                            <span>المعلم الراصد: {record.teacher_name}</span>
                          </div>
                          <p className="text-xs text-slate-600 font-bold line-clamp-2">
                            <span className="text-slate-400 ml-1">الإجراء:</span>
                            {record.remedial_plan || getStatusText(record.status)}
                          </p>
                          <div className="text-[10px] text-slate-400 font-bold">
                            {formatHijriDate(record.created_at)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'attendance' && (
              <motion.div
                key="tab-attendance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {attendanceRecords.length === 0 ? (
                  <div className="text-center text-slate-400 font-bold py-12">لا توجد سجلات غياب أو تأخر</div>
                ) : (
                  <div>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-bold">
                            <th className="p-4 text-right">اليوم</th>
                            <th className="p-4 text-right">التاريخ</th>
                            <th className="p-4 text-right">المعلم الراصد</th>
                            <th className="p-4 text-right">حالة الحضور</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm font-bold text-slate-700">
                          {attendanceRecords.map(record => {
                            let statusColor = 'text-slate-700';
                            let statusText = record.status;
                            
                            if (record.status === 'حاضر') {
                              statusColor = 'text-emerald-600';
                            } else if (record.status === 'غائب') {
                              if (record.is_excused) {
                                statusColor = 'text-blue-600';
                                statusText = 'مستأذن/بعذر';
                              } else {
                                statusColor = 'text-rose-600';
                              }
                            } else if (record.status === 'متأخر') {
                              statusColor = 'text-orange-500';
                            }

                            return (
                              <tr key={record.id} className="border-b border-slate-50 last:border-0">
                                <td className="p-4">{getDayName(record.date)}</td>
                                <td className="p-4">{formatHijriDate(record.date)}</td>
                                <td className="p-4">{record.teacher_name}</td>
                                <td className={`p-4 font-black ${statusColor}`}>
                                  {statusText}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile Card View */}
                    <div className="md:hidden flex flex-col gap-4 p-4">
                      {attendanceRecords.map(record => {
                        let statusColor = 'text-slate-700';
                        let statusBg = 'bg-slate-50';
                        let statusText = record.status;
                        
                        if (record.status === 'حاضر') {
                          statusColor = 'text-emerald-600';
                          statusBg = 'bg-emerald-50';
                        } else if (record.status === 'غائب') {
                          if (record.is_excused) {
                            statusColor = 'text-blue-600';
                            statusBg = 'bg-blue-50';
                            statusText = 'مستأذن/بعذر';
                          } else {
                            statusColor = 'text-rose-600';
                            statusBg = 'bg-rose-50';
                          }
                        } else if (record.status === 'متأخر') {
                          statusColor = 'text-orange-600';
                          statusBg = 'bg-orange-50';
                        }

                        return (
                          <div key={record.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusBg} ${statusColor}`}>
                                <Clock size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{getDayName(record.date)}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{formatHijriDate(record.date)}</p>
                                <p className="text-[10px] text-primary font-bold mt-1">المعلم: {record.teacher_name}</p>
                              </div>
                            </div>
                            <span className={`text-xs font-black px-3 py-1 rounded-lg ${statusBg} ${statusColor}`}>
                              {statusText}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* Edit Modal */}
      {isEditing && editData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800">تعديل بيانات الطالب</h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم الطالب</label>
                <input
                  type="text"
                  required
                  value={editData.name}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهوية</label>
                <input
                  type="text"
                  required
                  value={editData.national_id}
                  onChange={(e) => setEditData({...editData, national_id: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الصف</label>
                  <select
                    required
                    value={editData.grade}
                    onChange={(e) => setEditData({...editData, grade: e.target.value, section: ''})}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="">-- اختر الصف --</option>
                    {Object.keys(filters).map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الفصل</label>
                  <select
                    required
                    value={editData.section}
                    onChange={(e) => setEditData({...editData, section: e.target.value})}
                    disabled={!editData.grade}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">-- اختر الفصل --</option>
                    {(filters[editData.grade] || []).map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الجوال</label>
                <input
                  type="text"
                  value={editData.parent_phone || ''}
                  onChange={(e) => setEditData({...editData, parent_phone: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="رقم جوال ولي الأمر"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-white bg-primary hover:bg-primary/90 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
