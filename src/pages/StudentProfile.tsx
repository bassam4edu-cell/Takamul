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
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
}

interface BehaviorRecord {
  id: number;
  violation_name: string;
  degree: number;
  created_at: string;
  remedial_plan: string | null;
  status: string;
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'referrals' | 'behavior' | 'attendance'>('referrals');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch(`/api/student-profile/${id}`);
        if (!res.ok) throw new Error('Failed to fetch student profile');
        const data = await res.json();
        setStudent(data.student);
        setReferrals(data.referrals || []);
        setAttendanceRecords(data.attendanceRecords || []);
        setBehaviorRecords(data.behaviorRecords || []);
      } catch (err) {
        console.error('Failed to fetch student data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { weekday: 'long' });
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
        className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm"
      >
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
            <span>📝 تحويلات المعلمين</span>
          </button>
          <button
            onClick={() => setActiveTab('behavior')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'behavior' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldAlert size={18} />
            <span>⚠️ المشكلات السلوكية</span>
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'attendance' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock size={18} />
            <span>📅 الغياب والتأخر</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[300px]">
          <AnimatePresence mode="wait">
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
                              <td className="p-4">{new Date(referral.created_at).toLocaleDateString('ar-SA')}</td>
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
                            {new Date(referral.created_at).toLocaleDateString('ar-SA')}
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
                            <th className="p-4">التاريخ</th>
                            <th className="p-4">نوع المخالفة</th>
                            <th className="p-4">الدرجة</th>
                            <th className="p-4">الإجراء المتخذ</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm font-bold text-slate-700">
                          {behaviorRecords.map(record => (
                            <tr key={record.id} className="border-b border-slate-50 last:border-0">
                              <td className="p-4">{new Date(record.created_at).toLocaleDateString('ar-SA')}</td>
                              <td className="p-4">{record.violation_name}</td>
                              <td className="p-4">
                                <span className={`px-3 py-1 rounded-full text-xs ${
                                  record.degree >= 4 ? 'bg-rose-100 text-rose-700' :
                                  record.degree === 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  الدرجة {record.degree}
                                </span>
                              </td>
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
                          <p className="text-xs text-slate-600 font-bold line-clamp-2">
                            <span className="text-slate-400 ml-1">الإجراء:</span>
                            {record.remedial_plan || getStatusText(record.status)}
                          </p>
                          <div className="text-[10px] text-slate-400 font-bold">
                            {new Date(record.created_at).toLocaleDateString('ar-SA')}
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
                            <th className="p-4">اليوم</th>
                            <th className="p-4">التاريخ</th>
                            <th className="p-4">حالة الحضور</th>
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
                                <td className="p-4">{new Date(record.date).toLocaleDateString('ar-SA')}</td>
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
                                <p className="text-[10px] text-slate-400 font-bold">{new Date(record.date).toLocaleDateString('ar-SA')}</p>
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
    </div>
  );
};

export default StudentProfile;
