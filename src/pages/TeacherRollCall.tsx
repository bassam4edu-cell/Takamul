import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../App';
import { CheckCircle2, XCircle, Clock, Save, Lock, Users, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const TeacherRollCall: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<{grade: string, section: string}[]>([]);
  
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  
  const [period, setPeriod] = useState('1');
  const date = new Date().toISOString().split('T')[0];
  
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitterName, setSubmitterName] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/attendance/classes');
        if (res.ok) {
          const data = await res.json();
          setClasses(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, []);

  const availableGrades = useMemo(() => {
    const uniqueGrades = Array.from(new Set(classes.map(c => c.grade)));
    return uniqueGrades.sort();
  }, [classes]);

  const availableSections = useMemo(() => {
    if (!grade) return [];
    return classes.filter(c => c.grade === grade).map(c => c.section).sort();
  }, [classes, grade]);

  // Reset section when grade changes
  useEffect(() => {
    setSection('');
  }, [grade]);

  useEffect(() => {
    if (!grade || !section) {
      setStudents([]);
      return;
    }

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const classId = encodeURIComponent(JSON.stringify({ grade, section }));
        const res = await fetch(`/api/attendance/class/${classId}?date=${date}&period=${period}`);
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students);
          setIsSubmitted(data.isSubmitted);
          setSubmitterName(data.submitterName);
          
          const currentAttendance: Record<number, string> = {};
          data.students.forEach((s: any) => {
            currentAttendance[s.id] = s.status || 'حاضر';
          });
          setAttendance(currentAttendance);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [grade, section, period, date]);

  const handleStatusChange = (studentId: number, status: string) => {
    if (isSubmitted && user?.role !== 'admin') return;
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleBulkAction = (status: string) => {
    if (isSubmitted && user?.role !== 'admin') return;
    const newAttendance: Record<number, string> = {};
    students.forEach(s => {
      newAttendance[s.id] = status;
    });
    setAttendance(newAttendance);
  };

  const handleSubmit = async () => {
    if (isSubmitted && user?.role !== 'admin') return;
    setSubmitting(true);
    try {
      const records = students.map(s => ({
        student_id: s.id,
        status: attendance[s.id],
        grade,
        section
      }));

      const res = await fetch('/api/attendance/submit-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records,
          teacher_id: user?.id,
          date,
          period: Number(period)
        })
      });

      if (res.ok) {
        setSuccess(true);
        setIsSubmitted(true);
        setSubmitterName(user?.name || 'أنت');
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 pb-10 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Users size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">تحضير الحصة</h1>
          <p className="text-slate-500 font-bold text-sm">تسجيل الحضور والغياب اليومي</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">الصف</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none min-h-[44px]"
            >
              <option value="">اختر الصف...</option>
              {availableGrades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">الفصل</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              disabled={!grade}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none min-h-[44px] disabled:opacity-50"
            >
              <option value="">اختر الفصل...</option>
              {availableSections.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">الحصة</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none min-h-[44px]"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                <option key={p} value={p}>الحصة {p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : students.length > 0 ? (
        <div className="space-y-4">
          {isSubmitted ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <Lock className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-bold text-amber-800">تم رصد غياب هذه الحصة مسبقاً</h3>
                <p className="text-sm text-amber-700 mt-1">
                  السجل للقراءة فقط. تم التحضير بواسطة: <span className="font-black">{submitterName}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('حاضر')}
                className="flex-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors min-h-[44px]"
              >
                <CheckCircle2 size={18} />
                تعيين الجميع حضور
              </button>
              <button
                onClick={() => handleBulkAction('غائب')}
                className="flex-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors min-h-[44px]"
              >
                <XCircle size={18} />
                تعيين الجميع غياب
              </button>
            </div>
          )}

          <div className="space-y-3">
            {students.map((student) => (
              <motion.div 
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white p-4 rounded-3xl border transition-all shadow-sm flex flex-col gap-3 ${
                  attendance[student.id] === 'حاضر' ? 'border-emerald-200 bg-emerald-50/10' :
                  attendance[student.id] === 'غائب' ? 'border-rose-200 bg-rose-50/10' :
                  'border-amber-200 bg-amber-50/10'
                } ${isSubmitted ? 'opacity-75' : ''}`}
              >
                <div className="font-black text-slate-800">{student.name}</div>
                <div className="flex gap-2">
                  <button
                    disabled={isSubmitted && user?.role !== 'admin'}
                    onClick={() => handleStatusChange(student.id, 'حاضر')}
                    className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                      attendance[student.id] === 'حاضر'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                    } ${isSubmitted && user?.role !== 'admin' ? 'cursor-not-allowed' : ''}`}
                  >
                    <CheckCircle2 size={16} />
                    حاضر
                  </button>
                  <button
                    disabled={isSubmitted && user?.role !== 'admin'}
                    onClick={() => handleStatusChange(student.id, 'غائب')}
                    className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                      attendance[student.id] === 'غائب'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                    } ${isSubmitted && user?.role !== 'admin' ? 'cursor-not-allowed' : ''}`}
                  >
                    <XCircle size={16} />
                    غائب
                  </button>
                  <button
                    disabled={isSubmitted && user?.role !== 'admin'}
                    onClick={() => handleStatusChange(student.id, 'متأخر')}
                    className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                      attendance[student.id] === 'متأخر'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                    } ${isSubmitted && user?.role !== 'admin' ? 'cursor-not-allowed' : ''}`}
                  >
                    <Clock size={16} />
                    متأخر
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Action Button at the end of the list */}
          {(!isSubmitted || user?.role === 'admin') && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-6 pb-4"
            >
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`w-full min-h-[56px] rounded-2xl font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm ${
                  success 
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                    : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                }`}
              >
                {submitting ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : success ? (
                  <>
                    <CheckCircle2 size={20} />
                    <span>تم إرسال التحضير بنجاح</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>حفظ التحضير وإرسال للوكيل</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>
      ) : grade && section ? (
        <div className="text-center p-10 bg-white rounded-3xl border border-slate-100">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">لا يوجد طلاب في هذا الفصل</p>
        </div>
      ) : (
        <div className="text-center p-10 bg-white rounded-3xl border border-slate-100 border-dashed">
          <p className="text-slate-400 font-bold">الرجاء اختيار الصف والفصل لعرض قائمة الطلاب</p>
        </div>
      )}
    </div>
  );
};

export default TeacherRollCall;
