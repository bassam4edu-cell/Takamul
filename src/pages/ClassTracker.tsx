import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, Dices, Save, Hand, BookOpen, AlertTriangle, 
  X, Clock, XCircle, Check, Users
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { formatHijriDate } from '../utils/dateUtils';
import toast from 'react-hot-toast';

interface Student {
  id: number;
  name: string;
}

interface StudentState {
  attendance: 'present' | 'late' | 'absent';
  participation: boolean;
  homework: boolean;
  negativeNote: boolean;
  behaviorChips: string[];
  note: string;
}

const behaviorChips = ['إزعاج','إهمال أدوات','نوم بالحصة','تميز وابتكار','مساعدة زميل'];

const ClassTracker: React.FC = () => {
  const { user } = useAuth();
  const isReadOnly = user?.role !== 'teacher';

  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [period, setPeriod] = useState<number>(1);

  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [studentsState, setStudentsState] = useState<Record<number, StudentState>>({});

  const [highlightedStudent, setHighlightedStudent] = useState<number | null>(null);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [modalNote, setModalNote] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);

  const todayDate = formatHijriDate(new Date());
  const todayISO = new Date().toISOString().split('T')[0];

  // ✅ إصلاح 2: تحميل الصفوف والمواد من الـ API
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await apiFetch('/api/hierarchy/grades');
        if (res.ok) {
          const data = await res.json();
          setAvailableGrades(data);
          if (data.length > 0) setGrade(data[0]);
        }
      } catch (err) { console.error('Failed to fetch grades:', err); }
    };

    const fetchSubjects = async () => {
      try {
        const res = await apiFetch('/api/teacher/assignments');
        if (res.ok) {
          const data = await res.json();
          const subjects = [...new Set(data.map((a: any) => a.subject_name))] as string[];
          if (subjects.length > 0) { setAvailableSubjects(subjects); setSubject(subjects[0]); return; }
        }
      } catch (_) {}
      const defaults = ['رياضيات','فيزياء','كيمياء','لغة عربية','إنجليزي'];
      setAvailableSubjects(defaults); setSubject(defaults[0]);
    };

    fetchGrades();
    fetchSubjects();
  }, []);

  // ✅ إصلاح 2ب: تحميل الفصول عند تغيير الصف
  useEffect(() => {
    if (!grade) return;
    const fetchSections = async () => {
      try {
        const res = await apiFetch(`/api/hierarchy/sections?grade=${encodeURIComponent(grade)}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableSections(data);
          setSection(data.length > 0 ? data[0] : '');
        }
      } catch (err) { console.error('Failed to fetch sections:', err); }
    };
    fetchSections();
  }, [grade]);

  // ✅ إصلاح 3: تحميل الطلاب وتهيئة حالاتهم
  useEffect(() => {
    if (!grade || !section) return;
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(
          `/api/hierarchy/students?grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}`
        );
        if (res.ok) {
          const data: Student[] = await res.json();
          setStudents(data);
          const initial: Record<number, StudentState> = {};
          data.forEach(s => {
            initial[s.id] = { attendance: 'present', participation: false, homework: false, negativeNote: false, behaviorChips: [], note: '' };
          });
          setStudentsState(initial);
        }
      } catch (err) { console.error('Failed to fetch students:', err); }
      finally { setLoading(false); }
    };
    fetchStudents();
  }, [grade, section]);

  const handleAttendanceChange = (id: number, status: 'present' | 'late' | 'absent') => {
    if (isReadOnly) return;
    setStudentsState(prev => ({ ...prev, [id]: { ...prev[id], attendance: status } }));
  };

  const toggleAssessment = (id: number, field: 'participation' | 'homework' | 'negativeNote') => {
    if (isReadOnly) return;
    setStudentsState(prev => ({ ...prev, [id]: { ...prev[id], [field]: !prev[id][field] } }));
  };

  const markAllPresent = () => {
    if (isReadOnly) return;
    setStudentsState(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => { next[Number(id)] = { ...next[Number(id)], attendance: 'present' }; });
      return next;
    });
  };

  const pickRandomStudent = () => {
    if (isReadOnly || students.length === 0) return;
    let counter = 0;
    const interval = setInterval(() => {
      setHighlightedStudent(students[Math.floor(Math.random() * students.length)].id);
      if (++counter > 10) { clearInterval(interval); setTimeout(() => setHighlightedStudent(null), 3000); }
    }, 100);
  };

  const openStudentModal = (student: Student) => {
    if (isReadOnly) return;
    setSelectedStudentForModal(student);
    setSelectedChips(studentsState[student.id]?.behaviorChips || []);
    setModalNote(studentsState[student.id]?.note || '');
  };

  const handleSaveModal = () => {
    if (!selectedStudentForModal) return;
    setStudentsState(prev => ({ ...prev, [selectedStudentForModal.id]: { ...prev[selectedStudentForModal.id], behaviorChips: selectedChips, note: modalNote } }));
    setSelectedStudentForModal(null);
  };

  // ✅ إصلاح 4: حفظ حقيقي في قاعدة البيانات
  const handleSaveSession = async () => {
    if (!grade || !section || !subject) { toast.error('يرجى اختيار الصف والفصل والمادة'); return; }
    setIsSaving(true);
    try {
      const res = await apiFetch('/api/tracker/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: user?.id, grade, section, subject, date: todayISO, tasks: {},
          studentsState: Object.fromEntries(
            Object.entries(studentsState).map(([id, s]) => [id, { attendance: s.attendance, behaviorChips: s.behaviorChips, grades: {} }])
          ),
        }),
      });
      res.ok ? toast.success('تم حفظ السجل بنجاح ✓') : toast.error('فشل الحفظ، يرجى المحاولة مرة أخرى');
    } catch { toast.error('خطأ في الاتصال بالسيرفر'); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-24">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select value={grade} onChange={e => setGrade(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 font-bold">
              {availableGrades.length === 0 && <option value="">-- لا يوجد صفوف --</option>}
              {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={section} onChange={e => setSection(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 font-bold">
              {availableSections.length === 0 && <option value="">-- اختر الصف أولاً --</option>}
              {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 font-bold">
              {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={period} onChange={e => setPeriod(Number(e.target.value))} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 font-bold">
              {[1,2,3,4,5,6,7].map(p => <option key={p} value={p}>الحصة {p}</option>)}
            </select>
          </div>
          <div className="text-sm font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-lg">{todayDate}</div>
        </div>

        {!isReadOnly && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
            <button onClick={markAllPresent} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold py-2.5 px-4 rounded-xl transition-all">
              <CheckCircle2 size={18} /><span className="text-sm">تحضير الكل حاضر</span>
            </button>
            <button onClick={pickRandomStudent} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold py-2.5 px-4 rounded-xl transition-all">
              <Dices size={18} /><span className="text-sm">اختيار عشوائي</span>
            </button>
            <button onClick={handleSaveSession} disabled={isSaving} className="flex-1 md:flex-none md:mr-auto flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm disabled:opacity-70">
              {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={18} />}
              <span className="text-sm">{isSaving ? 'جاري الحفظ...' : 'اعتماد وحفظ في السجل الشامل'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-500">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"/>
            جاري تحميل الطلاب...
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
            <p className="text-slate-500 font-medium">{!grade || !section ? 'اختر الصف والفصل لعرض الطلاب' : 'لا يوجد طلاب في هذا الفصل'}</p>
          </div>
        ) : (
          students.map(student => {
            const state = studentsState[student.id];
            if (!state) return null;
            const isHighlighted = highlightedStudent === student.id;
            return (
              <motion.div key={student.id} initial={false}
                animate={{ scale: isHighlighted ? 1.02 : 1, boxShadow: isHighlighted ? '0 10px 25px -5px rgba(99,102,241,0.4)' : '0 1px 2px 0 rgba(0,0,0,0.05)', borderColor: isHighlighted ? '#6366f1' : '#f1f5f9' }}
                className={`bg-white rounded-xl border p-3 md:p-4 flex flex-col md:flex-row items-center gap-4 ${isHighlighted ? 'ring-2 ring-indigo-500 ring-offset-2 z-10 relative' : ''}`}
              >
                <div className="flex items-center gap-3 w-full md:w-1/3 cursor-pointer group" onClick={() => openStudentModal(student)}>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{student.id}</div>
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">{student.name.charAt(0)}</div>
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-primary transition-colors">{student.name}</h3>
                    {state.behaviorChips.length > 0 && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {state.behaviorChips.slice(0,2).map(c => <span key={c} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{c}</span>)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-center w-full md:w-1/3 bg-slate-50 p-1.5 rounded-xl">
                  {(['present','late','absent'] as const).map((status, i) => {
                    const labels = ['حاضر','متأخر','غائب'];
                    const icons = [<CheckCircle2 size={14}/>, <Clock size={14}/>, <XCircle size={14}/>];
                    const activeColors = ['text-emerald-600','text-amber-600','text-red-600'];
                    const isActive = state.attendance === status;
                    return (
                      <button key={status} onClick={() => handleAttendanceChange(student.id, status)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${isActive ? `bg-white ${activeColors[i]} shadow-sm ring-1 ring-slate-200/50` : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {icons[i]}{labels[i]}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end gap-3 w-full md:w-1/3">
                  {(['participation','homework','negativeNote'] as const).map((field, i) => {
                    const activeClass = ['bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500/20','bg-blue-100 text-blue-600 ring-2 ring-blue-500/20','bg-red-100 text-red-600 ring-2 ring-red-500/20'][i];
                    const icons = [<Hand size={18}/>, <BookOpen size={18}/>, <AlertTriangle size={18}/>];
                    const titles = ['مشاركة / نشط','حل الواجب','ملاحظة سلبية'];
                    return (
                      <button key={field} title={titles[i]}
                        onClick={() => { toggleAssessment(student.id, field); if (field === 'negativeNote' && !state.negativeNote) openStudentModal(student); }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${state[field] ? activeClass : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                      >{icons[i]}</button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {selectedStudentForModal && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={() => setSelectedStudentForModal(null)}/>
            <motion.div initial={{opacity:0,y:'100%'}} animate={{opacity:1,y:0}} exit={{opacity:0,y:'100%'}} transition={{type:'spring',damping:25,stiffness:300}}
              className="fixed bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:right-auto md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[500px] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{selectedStudentForModal.name.charAt(0)}</div>
                  <div><h3 className="font-bold text-slate-800">{selectedStudentForModal.name}</h3><p className="text-xs text-slate-500">ملاحظات الطالب</p></div>
                </div>
                <button onClick={() => setSelectedStudentForModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 transition-colors"><X size={18}/></button>
              </div>
              <div className="p-5 overflow-y-auto space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-3">تقييم سريع للسلوك:</h4>
                  <div className="flex flex-wrap gap-2">
                    {behaviorChips.map(chip => (
                      <button key={chip} onClick={() => setSelectedChips(prev => prev.includes(chip) ? prev.filter(c=>c!==chip) : [...prev,chip])}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${selectedChips.includes(chip) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >{chip}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-3">ملاحظات إضافية:</h4>
                  <textarea value={modalNote} onChange={e => setModalNote(e.target.value)} placeholder="اكتب ملاحظة مخصصة هنا..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none"/>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-white">
                <button onClick={handleSaveModal} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                  <Check size={18}/><span>حفظ الملاحظات</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassTracker;
