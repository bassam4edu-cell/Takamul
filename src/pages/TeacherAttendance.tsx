import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { CheckCircle2, XCircle, Clock, Save, UserCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const TeacherAttendance: React.FC = () => {
  const { user } = useAuth();
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [period, setPeriod] = useState(1);
  const [students, setStudents] = useState<any[]>([]);
  const [availableClasses, setAvailableClasses] = useState<{grade: string, section: string}[]>([]);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/attendance/classes');
        if (res.ok) {
          const data = await res.json();
          setAvailableClasses(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    if (!grade || !section || !period) return;
    setLoading(true);
    try {
      const classId = encodeURIComponent(JSON.stringify({ grade, section }));
      const date = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/attendance/class/${classId}?date=${date}&period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
        // Set attendance from DB or default to 'حاضر'
        const currentAttendance: Record<number, string> = {};
        data.forEach((s: any) => {
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

  useEffect(() => {
    fetchStudents();
  }, [grade, section, period]);

  const handleStatusChange = (studentId: number, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!grade || !section || !period) return;
    setSubmitting(true);
    try {
      const records = students.map(s => ({
        student_id: s.id,
        status: attendance[s.id]
      }));

      const classId = JSON.stringify({ grade, section });
      const date = new Date().toISOString().split('T')[0];

      const res = await fetch('/api/attendance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records,
          teacher_id: user?.id,
          class_id: classId,
          period,
          date
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-24 space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
          <UserCheck className="text-primary" />
          التحضير السريع
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">الصف</label>
            <select
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value);
                setSection(''); // Reset section when grade changes
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="">اختر الصف</option>
              {Array.from(new Set(availableClasses.map(c => c.grade))).map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">الفصل</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              disabled={!grade}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-50"
            >
              <option value="">اختر الفصل</option>
              {availableClasses.filter(c => c.grade === grade).map(c => (
                <option key={c.section} value={c.section}>{c.section}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2">الحصة</label>
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {[1, 2, 3, 4, 5, 6, 7].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`w-12 h-12 shrink-0 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
                  period === p 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : students.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-slate-700">قائمة الطلاب ({students.length})</h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">الافتراضي: حاضر</span>
          </div>

          {students.map((student) => (
            <motion.div 
              key={student.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white p-4 rounded-2xl border transition-all ${
                attendance[student.id] === 'حاضر' ? 'border-emerald-200 bg-emerald-50/30' :
                attendance[student.id] === 'غائب' ? 'border-red-200 bg-red-50/30' :
                'border-amber-200 bg-amber-50/30'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-800">{student.name}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange(student.id, 'حاضر')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                    attendance[student.id] === 'حاضر'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  حاضر
                </button>
                <button
                  onClick={() => handleStatusChange(student.id, 'غائب')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                    attendance[student.id] === 'غائب'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <XCircle size={16} />
                  غائب
                </button>
                <button
                  onClick={() => handleStatusChange(student.id, 'متأخر')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                    attendance[student.id] === 'متأخر'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <Clock size={16} />
                  متأخر
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : grade && section ? (
        <div className="text-center p-10 bg-white rounded-3xl border border-slate-100">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">لا يوجد طلاب في هذا الفصل</p>
        </div>
      ) : null}

      {/* Fixed Bottom Action */}
      {students.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-10">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full max-w-md mx-auto py-4 rounded-2xl font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg ${
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
                <span>تم الحفظ وإرسال التحضير للوكيل</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>حفظ وإرسال للوكيل</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendance;
