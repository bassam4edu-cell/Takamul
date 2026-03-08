import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  History, 
  Calendar, 
  FileText, 
  AlertCircle,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../App';

interface Referral {
  id: number;
  type: string;
  severity: string;
  reason: string;
  status: string;
  created_at: string;
  teacher_name: string;
  teacher_notes?: string;
  remedial_plan?: string;
  applied_remedial_actions?: string | string[];
}

interface Student {
  id: number;
  name: string;
  grade: string;
  section: string;
  national_id: string;
  behavior_score: number;
  bonus_score: number;
  attendance_score: number;
}

interface ScoreLog {
  id: number;
  action_type: string;
  points_changed: number;
  reason_or_evidence: string;
  creator_name: string;
  created_at: string;
}

const StudentProfile: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [scoreLogs, setScoreLogs] = useState<ScoreLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);

  useEffect(() => {
    if (user && !['vice_principal', 'counselor', 'principal', 'admin'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch student details
        const studentProfileRes = await fetch(`/api/student-profile/${id}`);
        if (!studentProfileRes.ok) throw new Error('Failed to fetch student profile');
        const profileData = await studentProfileRes.json();
        setStudent(profileData.student);
        setReferrals(profileData.referrals);

        // Fetch score logs
        const logsRes = await fetch(`/api/students/${id}/score-logs`);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setScoreLogs(logsData);
        }
      } catch (err) {
        console.error('Failed to fetch student data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, navigate]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!student) return <div className="text-center p-10">الطالب غير موجود</div>;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_vp': return 'بانتظار الوكيل';
      case 'pending_counselor': return 'بانتظار الموجه';
      case 'scheduled_meeting': return 'موعد لقاء';
      case 'returned_to_teacher': return 'معاد للمعلم';
      case 'resolved': return 'تمت المعالجة';
      case 'closed': return 'مغلق';
      default: return status;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'high': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold"
        >
          <ArrowRight size={20} />
          <span>العودة</span>
        </button>
      </div>

      {/* Student Header Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sts-card p-6 md:p-8 bg-gradient-to-br from-white to-slate-50/50"
      >
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-right">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary shadow-inner shrink-0">
            <User size={40} />
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{student.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 text-slate-500 font-bold">
              <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs md:text-sm">{student.grade} - {student.section}</span>
              <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs md:text-sm">رقم الهوية: {student.national_id}</span>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm text-center min-w-[120px] md:min-w-[140px]">
              <p className="text-[10px] md:text-xs text-slate-400 font-bold mb-1">درجة السلوك</p>
              <p className={`text-2xl md:text-3xl font-black ${student.behavior_score < 60 ? 'text-rose-600' : 'text-primary'}`}>{student.behavior_score}</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm text-center min-w-[120px] md:min-w-[140px]">
              <p className="text-[10px] md:text-xs text-slate-400 font-bold mb-1">درجة المواظبة</p>
              <p className="text-2xl md:text-3xl font-black text-indigo-600">{student.attendance_score}</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm text-center min-w-[120px] md:min-w-[140px]">
              <p className="text-[10px] md:text-xs text-slate-400 font-bold mb-1">نقاط التعزيز</p>
              <p className="text-2xl md:text-3xl font-black text-emerald-600">{student.bonus_score}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Statistics Summary */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <AlertCircle size={20} className="text-primary" />
            <span>ملخص السلوك</span>
          </h3>
          <div className="sts-card p-6 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 space-y-0 lg:space-y-4">
            <div className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100">
              <span className="text-rose-700 font-bold text-xs md:text-sm">مخالفات عالية</span>
              <span className="text-xl md:text-2xl font-black text-rose-700">{referrals.filter(r => r.severity === 'high').length}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <span className="text-amber-700 font-bold text-xs md:text-sm">مخالفات متوسطة</span>
              <span className="text-xl md:text-2xl font-black text-amber-700">{referrals.filter(r => r.severity === 'medium').length}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-emerald-700 font-bold text-xs md:text-sm">مخالفات منخفضة</span>
              <span className="text-xl md:text-2xl font-black text-emerald-700">{referrals.filter(r => r.severity === 'low').length}</span>
            </div>
          </div>

          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 pt-4">
            <History size={20} className="text-primary" />
            <span>سجل الدرجات</span>
          </h3>
          <div className="sts-card p-6 space-y-4 max-h-[400px] overflow-y-auto">
            {scoreLogs.length === 0 ? (
              <p className="text-center text-slate-400 text-xs font-bold py-4">لا توجد عمليات سابقة</p>
            ) : (
              scoreLogs.map((log) => (
                <div key={`score-log-${log.id}`} className="border-b border-slate-50 pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      log.action_type === 'deduction' ? 'bg-rose-50 text-rose-600' : 
                      log.action_type === 'bonus' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {log.action_type === 'deduction' ? 'خصم' : log.action_type === 'bonus' ? 'تعزيز' : 'تعويض'}
                    </span>
                    <span className="text-[10px] font-black text-slate-400">
                      {new Date(log.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 mb-1">{log.reason_or_evidence}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold">بواسطة: {log.creator_name}</span>
                    <span className={`text-xs font-black ${
                      log.action_type === 'deduction' ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {log.action_type === 'deduction' ? '-' : '+'}{log.points_changed}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Referrals History */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <History size={20} className="text-primary" />
            <span>سجل التحويلات</span>
          </h3>
          
          <div className="space-y-4">
            {referrals.length === 0 ? (
              <div className="sts-card p-10 text-center text-slate-400 font-bold">
                لا يوجد سجل تحويلات لهذا الطالب
              </div>
            ) : (
              referrals.map((referral, index) => (
                <motion.div
                  key={`profile-ref-${referral.id}`}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedReferral(referral)}
                  className="sts-card p-6 hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 md:space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-black border ${getSeverityColor(referral.severity)}`}>
                          {referral.severity === 'high' ? 'عالية الخطورة' : referral.severity === 'medium' ? 'متوسطة' : 'منخفضة'}
                        </span>
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(referral.created_at).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm md:text-base text-slate-800 group-hover:text-primary transition-colors line-clamp-2">
                        {referral.reason}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] md:text-xs text-slate-500 font-bold">
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          المعلم: {referral.teacher_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText size={12} />
                          الحالة: {getStatusLabel(referral.status)}
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-all shrink-0">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Referral Details Modal */}
      <AnimatePresence>
        {selectedReferral && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 no-print">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReferral(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-primary p-8 text-white relative">
                <button 
                  onClick={() => setSelectedReferral(null)}
                  className="absolute left-8 top-8 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all"
                >
                  <ArrowRight size={24} className="rotate-180" />
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {selectedReferral.type === 'behavior' ? 'سلوكية' : selectedReferral.type === 'academic' ? 'أكاديمية' : 'أخرى'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    selectedReferral.severity === 'high' ? 'bg-rose-500/20 text-rose-100' : 
                    selectedReferral.severity === 'medium' ? 'bg-amber-500/20 text-amber-100' : 'bg-emerald-500/20 text-emerald-100'
                  }`}>
                    {selectedReferral.severity === 'high' ? 'عالية الخطورة' : selectedReferral.severity === 'medium' ? 'متوسطة' : 'منخفضة'}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-black leading-tight">{selectedReferral.reason}</h3>
                <p className="mt-2 text-primary-light font-bold text-sm">
                  بتاريخ: {new Date(selectedReferral.created_at).toLocaleDateString('ar-SA')} | المعلم: {selectedReferral.teacher_name}
                </p>
              </div>

              <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                {/* Applied Procedures */}
                {selectedReferral.applied_remedial_actions && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-primary font-black text-sm border-b border-slate-50 pb-4">
                      <AlertCircle size={18} />
                      <span>الإجراءات التي تم تطبيقها</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {(typeof selectedReferral.applied_remedial_actions === 'string' 
                        ? JSON.parse(selectedReferral.applied_remedial_actions) 
                        : selectedReferral.applied_remedial_actions).map((proc: string, i: number) => (
                        <div key={i} className="flex gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="w-6 h-6 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-black text-[10px] shrink-0">
                            {i + 1}
                          </div>
                          <p className="text-xs leading-relaxed font-bold text-slate-700">{proc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Teacher Notes */}
                {selectedReferral.teacher_notes && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-800 font-black text-sm border-b border-slate-50 pb-4">
                      <FileText size={18} className="text-primary" />
                      <span>ملاحظات المعلم / الوكيل</span>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed font-bold">
                      "{selectedReferral.teacher_notes}"
                    </div>
                  </div>
                )}

                {/* Remedial Plan */}
                {selectedReferral.remedial_plan && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-600 font-black text-sm border-b border-slate-50 pb-4">
                      <History size={18} />
                      <span>الخطة العلاجية المنفذة</span>
                    </div>
                    <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-emerald-900 text-sm leading-relaxed font-bold">
                      {selectedReferral.remedial_plan}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 flex justify-center">
                  <button 
                    onClick={() => navigate(`/dashboard/referral/${selectedReferral.id}`)}
                    className="text-primary font-black text-xs flex items-center gap-2 hover:underline"
                  >
                    <span>عرض صفحة التحويل الكاملة</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setSelectedReferral(null)}
                  className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-100 transition-all text-sm"
                >
                  إغلاق التفاصيل
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentProfile;
