import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Dices, 
  Save, 
  Plus,
  X,
  Trophy,
  Clock,
  Star,
  Printer,
  AlertTriangle,
  Edit2
} from 'lucide-react';
import { PrintableTracker } from '../components/PrintableTracker';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

// --- Types ---
export interface Student {
  id: number;
  name: string;
  avatar: string;
  semesterAttendance: number;
}

export type TaskCategory = 'participation' | 'homework' | 'performance' | 'exams';

export interface Task {
  id: string;
  name: string;
  maxGrade: number;
  type: 'number' | 'binary';
}

export interface StudentState {
  attendance: 'present' | 'late' | 'absent';
  grades: Record<string, number | ''>;
  behaviorChips: string[];
}

// --- Mock Data ---
const mockStudents: Student[] = [
  { id: 1, name: 'خالد عبدالله', avatar: 'https://ui-avatars.com/api/?name=خالد+عبدالله&background=f1f5f9&color=334155', semesterAttendance: 98 },
  { id: 2, name: 'سعود محمد', avatar: 'https://ui-avatars.com/api/?name=سعود+محمد&background=f1f5f9&color=334155', semesterAttendance: 85 },
  { id: 3, name: 'فيصل فهد', avatar: 'https://ui-avatars.com/api/?name=فيصل+فهد&background=f1f5f9&color=334155', semesterAttendance: 100 },
  { id: 4, name: 'عبدالرحمن سالم', avatar: 'https://ui-avatars.com/api/?name=عبدالرحمن+سالم&background=f1f5f9&color=334155', semesterAttendance: 92 },
  { id: 5, name: 'عمر خالد', avatar: 'https://ui-avatars.com/api/?name=عمر+خالد&background=f1f5f9&color=334155', semesterAttendance: 76 },
];

const negativeBehaviors = ['نوم', 'لم يحضر الكتاب', 'إزعاج', 'مقاطعة درس'];
const positiveBehaviors = ['مجتهد', 'مشاركة فعالة', 'مساعدة زميل'];

// --- Subcomponents ---

const ProgressBar = ({ label, current, max }: { label: string, current: number, max: number }) => {
  const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-1.5">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-800">{current} <span className="text-slate-400 font-medium">/ {max}</span></span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const StudentPortfolioModal: React.FC<{
  student: Student;
  state: StudentState;
  tasks: Record<TaskCategory, Task[]>;
  onClose: () => void;
}> = ({ student, state, tasks, onClose }) => {
  const getCategoryTotal = (category: TaskCategory) => {
    return tasks[category].reduce((sum, t) => sum + (Number(state.grades[t.id]) || 0), 0);
  };

  const getCategoryMax = (category: TaskCategory) => {
    return tasks[category].reduce((sum, t) => sum + t.maxGrade, 0);
  };

  const participationTotal = getCategoryTotal('participation');
  const participationMax = getCategoryMax('participation');

  const homeworkTotal = getCategoryTotal('homework');
  const homeworkMax = getCategoryMax('homework');

  const performanceTotal = getCategoryTotal('performance');
  const performanceMax = getCategoryMax('performance');

  const examsTotal = getCategoryTotal('exams');
  const examsMax = getCategoryMax('exams');

  const overallTotal = participationTotal + homeworkTotal + performanceTotal + examsTotal;
  const overallMax = participationMax + homeworkMax + performanceMax + examsMax;

  const percentage = overallMax > 0 ? Math.round((overallTotal / overallMax) * 100) : 0;

  let performanceText = 'text-emerald-500';
  if (percentage < 50) {
    performanceText = 'text-red-500';
  } else if (percentage < 80) {
    performanceText = 'text-amber-500';
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <img src={student.avatar} alt={student.name} className="w-16 h-16 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
            <div>
              <h2 className="text-xl font-bold text-slate-800">{student.name}</h2>
              <p className="text-sm font-mono text-slate-500 mt-1">رقم الكشف: {student.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Dashboard Glance */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Overall Performance */}
          <div className="col-span-1 bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 text-slate-700">
              <Trophy size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">الأداء الكلي</h3>
            
            {/* Circular Progress */}
            <div className="relative w-32 h-32 flex items-center justify-center mb-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={performanceText}
                  strokeDasharray={`${percentage}, 100`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-3xl font-black ${performanceText}`}>{overallTotal}</span>
                <span className="text-xs font-bold text-slate-400 border-t border-slate-200 pt-1 mt-1 w-8 text-center">{overallMax}</span>
              </div>
            </div>
          </div>

          {/* 2. Grades Breakdown */}
          <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
            
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex-1">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <Trophy size={16} className="text-indigo-500" />
                تفصيل الدرجات
              </h3>
              
              <div className="space-y-4">
                <ProgressBar label="المشاركة" current={participationTotal} max={participationMax} />
                <ProgressBar label="الواجبات" current={homeworkTotal} max={homeworkMax} />
                <ProgressBar label="المهام الأدائية" current={performanceTotal} max={performanceMax} />
                <ProgressBar label="اختبار الفترة" current={examsTotal} max={examsMax} />
              </div>
            </div>

            {/* 3. Discipline Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 mb-1">نسبة الحضور</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-slate-800">
                      {student.semesterAttendance}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">طوال الفصل</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                  <Star size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 mb-1">السلوك</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {state.behaviorChips.length > 0 ? (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md truncate max-w-[100px]">
                        {state.behaviorChips[state.behaviorChips.length - 1]}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-slate-400">لا توجد ملاحظات</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

const BehaviorDropdown: React.FC<{
  studentId: number;
  chips: string[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  onToggleChip: (chip: string) => void;
  onRemoveChip: (chip: string) => void;
}> = ({ chips, isOpen, onToggleOpen, onClose, onToggleChip, onRemoveChip }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div className="flex items-center gap-2">
      {chips.length > 0 && (
        <div className="flex gap-1">
          {chips.map(chip => (
            <span key={chip} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md flex items-center gap-1">
              {chip}
              <button onClick={() => onRemoveChip(chip)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      
      <div className="relative" ref={ref}>
        <button
          onClick={onToggleOpen}
          className="border-dashed border-2 border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 rounded-lg px-3 py-1 text-xs font-medium flex items-center gap-1 transition-colors"
        >
          <Plus size={14} /> إضافة سلوك
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-2 overflow-hidden"
            >
              <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">سلوك إيجابي</div>
              {positiveBehaviors.map(b => (
                <button
                  key={b}
                  onClick={() => { onToggleChip(b); onClose(); }}
                  className="w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                >
                  {b}
                </button>
              ))}
              
              <div className="h-px bg-slate-100 my-1"></div>
              
              <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">سلوك سلبي</div>
              {negativeBehaviors.map(b => (
                <button
                  key={b}
                  onClick={() => { onToggleChip(b); onClose(); }}
                  className="w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  {b}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Main Component ---

const SmartTracker: React.FC = () => {
  const { user } = useAuth();
  // --- Header State ---
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('رياضيات');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Global Tab State ---
  const [activeTab, setActiveTab] = useState<'attendance' | 'grades' | 'behavior'>('attendance');
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('participation');

  // --- Tasks State ---
  const [tasks, setTasks] = useState<Record<TaskCategory, Task[]>>({
    participation: [], homework: [], performance: [], exams: []
  });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<{name: string, maxGrade: number, type: 'number' | 'binary'}>({
    name: '', maxGrade: 5, type: 'number'
  });

  // --- Students State ---
  const [studentsState, setStudentsState] = useState<Record<number, StudentState>>({});

  const [highlightedStudent, setHighlightedStudent] = useState<number | null>(null);
  const [openBehaviorStudent, setOpenBehaviorStudent] = useState<number | null>(null);
  const [portfolioStudentId, setPortfolioStudentId] = useState<number | null>(null);
  const [confirmModalState, setConfirmModalState] = useState<'idle' | 'confirm' | 'success'>('idle');

  // --- History State ---
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await apiFetch('/api/hierarchy/grades');
        if (res.ok) {
          const data = await res.json();
          setAvailableGrades(data);
          if (data.length > 0) {
            setGrade(data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch grades", err);
      }
    };
    fetchGrades();
  }, []);

  useEffect(() => {
    const fetchSections = async () => {
      if (!grade) return;
      try {
        const res = await apiFetch(`/api/hierarchy/sections?grade=${encodeURIComponent(grade)}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableSections(data);
          if (data.length > 0) {
            setSection(data[0]);
          } else {
            setSection('');
          }
        }
      } catch (err) {
        console.error("Failed to fetch sections", err);
      }
    };
    fetchSections();
  }, [grade]);

  useEffect(() => {
    const fetchData = async () => {
      if (!grade || !section) return;
      
      setLoading(true);
      try {
        // 1. Fetch students for the class
        const studentsRes = await apiFetch(`/api/students?grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}`);
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          const formattedStudents = studentsData.map((s: any) => ({
            id: s.id,
            name: s.name,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=f1f5f9&color=334155`,
            semesterAttendance: 100 // Mock for now
          }));
          setStudents(formattedStudents);

          // Initialize state
          const initialState: Record<number, StudentState> = {};
          formattedStudents.forEach((s: Student) => {
            initialState[s.id] = { attendance: 'present', grades: {}, behaviorChips: [] };
          });

          // 2. Fetch tracker session
          if (user?.id) {
            const sessionRes = await apiFetch(`/api/tracker/session?teacher_id=${user.id}&grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}&subject=${encodeURIComponent(subject)}&date=${date}`);
            if (sessionRes.ok) {
              const sessionData = await sessionRes.json();
              if (sessionData) {
                // Restore tasks
                const newTasks: Record<TaskCategory, Task[]> = { participation: [], homework: [], performance: [], exams: [] };
                sessionData.tasks.forEach((t: any) => {
                  if (newTasks[t.category as TaskCategory]) {
                    newTasks[t.category as TaskCategory].push({
                      id: t.id,
                      name: t.name,
                      maxGrade: t.max_grade,
                      type: t.type
                    });
                  }
                });
                setTasks(newTasks);

                // Restore student states
                sessionData.studentStates.forEach((st: any) => {
                  if (initialState[st.student_id]) {
                    initialState[st.student_id].attendance = st.attendance;
                    initialState[st.student_id].behaviorChips = st.behavior_chips || [];
                    st.grades.forEach((g: any) => {
                      initialState[st.student_id].grades[g.task_id] = Number(g.grade);
                    });
                  }
                });
              } else {
                // Reset tasks if no session
                setTasks({ participation: [], homework: [], performance: [], exams: [] });
              }
            }
          }
          setStudentsState(initialState);
        }
      } catch (err) {
        console.error("Failed to fetch tracker data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [grade, section, subject, date, user?.id]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!showHistory || !user?.id || !grade || !section) return;
      setHistoryLoading(true);
      try {
        const res = await apiFetch(`/api/tracker/history?teacher_id=${user.id}&grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}&subject=${encodeURIComponent(subject)}`);
        if (res.ok) {
          const data = await res.json();
          setHistoryData(data);
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [showHistory, user?.id, grade, section, subject]);

  // --- Handlers ---
  const handleMarkAllPresent = () => {
    setStudentsState(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(id => {
        newState[Number(id)].attendance = 'present';
      });
      return newState;
    });
  };

  const handleRandomSelection = () => {
    if (students.length === 0) return;
    const randomId = students[Math.floor(Math.random() * students.length)].id;
    setHighlightedStudent(randomId);
    setTimeout(() => setHighlightedStudent(null), 3000);
  };

  const handleAttendanceChange = (studentId: number, status: 'present' | 'late' | 'absent') => {
    setStudentsState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], attendance: status }
    }));
  };

  const handleGradeChange = (studentId: number, taskId: string, value: string, maxGrade: number) => {
    let numValue: number | '' = value === '' ? '' : Number(value);
    if (numValue !== '' && (numValue < 0 || numValue > maxGrade)) return;

    setStudentsState(prev => ({
      ...prev,
      [studentId]: { 
        ...prev[studentId], 
        grades: { ...prev[studentId].grades, [taskId]: numValue } 
      }
    }));
  };

  const handleToggleGrade = (studentId: number, taskId: string, maxGrade: number) => {
    setStudentsState(prev => {
      const currentGrade = prev[studentId].grades[taskId];
      const newGrade = currentGrade === maxGrade ? 0 : maxGrade;
      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          grades: { ...prev[studentId].grades, [taskId]: newGrade }
        }
      };
    });
  };

  const handleSelectAll = (taskId: string, maxGrade: number) => {
    setStudentsState(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(id => {
        const studentId = Number(id);
        newState[studentId] = {
          ...newState[studentId],
          grades: {
            ...newState[studentId].grades,
            [taskId]: maxGrade
          }
        };
      });
      return newState;
    });
  };

  const handleAddTask = () => {
    if (!newTask.name) return;
    
    if (editingTaskId) {
      setTasks(prev => ({
        ...prev,
        [activeCategory]: prev[activeCategory].map(t => 
          t.id === editingTaskId 
            ? { ...t, name: newTask.name, maxGrade: newTask.maxGrade, type: newTask.type }
            : t
        )
      }));
    } else {
      const task: Task = {
        id: Date.now().toString(),
        name: newTask.name,
        maxGrade: newTask.maxGrade,
        type: newTask.type
      };
      setTasks(prev => ({
        ...prev,
        [activeCategory]: [...prev[activeCategory], task]
      }));
    }
    closeTaskModal();
  };

  const handleEditTask = (task: Task) => {
    setNewTask({ name: task.name, maxGrade: task.maxGrade, type: task.type });
    setEditingTaskId(task.id);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTaskId(null);
    setNewTask({ name: '', maxGrade: 5, type: 'number' });
  };

  const toggleBehaviorChip = (studentId: number, chip: string) => {
    setStudentsState(prev => {
      const chips = prev[studentId].behaviorChips;
      const newChips = chips.includes(chip) 
        ? chips.filter(c => c !== chip)
        : [...chips, chip];
      
      return {
        ...prev,
        [studentId]: { ...prev[studentId], behaviorChips: newChips }
      };
    });
  };

  const handleFinalSubmit = () => {
    setConfirmModalState('confirm');
  };

  const confirmSubmit = async () => {
    if (!user?.id) return;
    try {
      const res = await apiFetch('/api/tracker/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: user.id,
          grade,
          section,
          subject,
          date,
          tasks,
          studentsState
        })
      });
      if (res.ok) {
        setConfirmModalState('success');
        setTimeout(() => {
          setConfirmModalState(prev => prev === 'success' ? 'idle' : prev);
        }, 3000);
      }
    } catch (err) {
      console.error("Failed to save tracker session", err);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-32 font-sans print:hidden" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-3 flex-wrap">
            <select 
              value={grade} onChange={e => setGrade(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {availableGrades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <select 
              value={section} onChange={e => setSection(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {availableSections.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select 
              value={subject} onChange={e => setSubject(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option>رياضيات</option>
              <option>فيزياء</option>
              <option>كيمياء</option>
            </select>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                showHistory ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Clock size={16} />
              {showHistory ? 'العودة للرصد' : 'سجل المهام المعتمدة'}
            </button>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleMarkAllPresent}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
            >
              <CheckCircle2 size={16} className="text-emerald-500" />
              تحضير الكل
            </button>
            <button
              onClick={handleRandomSelection}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
            >
              <Dices size={16} className="text-indigo-500" />
              اختيار عشوائي
            </button>
          </div>
        </div>

        {showHistory ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Clock className="text-indigo-500" />
              سجل المهام المعتمدة
            </h2>
            {historyLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : historyData.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                لا توجد مهام معتمدة سابقة لهذا الفصل.
              </div>
            ) : (
              <div className="space-y-4">
                {historyData.map((task, idx) => (
                  <div key={`${task.task_id}-${idx}`} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{task.task_name}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                          <span>{new Date(task.session_date).toLocaleDateString('ar-SA')}</span>
                          <span>•</span>
                          <span>الدرجة العظمى: {task.max_grade}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDate(task.session_date.split('T')[0]);
                        setActiveCategory(task.category as TaskCategory);
                        setActiveTab('grades');
                        setShowHistory(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                    >
                      <Edit2 size={16} />
                      تعديل الدرجات
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Segmented Control (iOS Style) */}
            <div className="flex bg-slate-200/60 p-1 rounded-xl w-full max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'attendance' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            الحضور
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'grades' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            المتابعة
          </button>
          <button
            onClick={() => setActiveTab('behavior')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'behavior' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            السلوك
          </button>
        </div>

        {/* Master List */}
        {activeTab === 'grades' && (
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {(['participation', 'homework', 'performance', 'exams'] as const).map(cat => {
                const categoryNames = { participation: 'المشاركة', homework: 'الواجبات', performance: 'المهام الأدائية', exams: 'اختبار الفترة' };
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                      activeCategory === cat ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {categoryNames[cat]}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="shrink-0 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors mr-4"
            >
              <Plus size={16} />
              إضافة مهمة جديدة
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row (Only for Grades) */}
            {activeTab === 'grades' && (
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
                {/* Right: Identity Header */}
                <div className="flex items-center gap-4 w-64 shrink-0">
                  <span className="font-semibold text-slate-500 text-sm px-2">الطالب</span>
                </div>

                {/* Left: Tasks Header */}
                <div className="flex items-center justify-end gap-4 flex-1">
                  <div className="flex items-center gap-6">
                    {tasks[activeCategory].map(task => (
                      <div key={task.id} className="flex flex-col items-center gap-1.5 w-20 group relative">
                        <div className="flex items-center justify-center gap-1 w-full">
                          <span className="text-xs font-bold text-slate-700 truncate text-center" title={task.name}>
                            {task.name}
                          </span>
                          <button 
                            onClick={() => handleEditTask(task)}
                            className="text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="تعديل المهمة"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                        <button 
                          onClick={() => handleSelectAll(task.id, task.maxGrade)}
                          className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                        >
                          ✔️ تحديد الكل
                        </button>
                      </div>
                    ))}
                    {tasks[activeCategory].length === 0 && (
                      <span className="text-xs text-slate-400 font-medium w-32 text-center">لا توجد مهام مضافة</span>
                    )}
                  </div>
                  
                  {/* Total Badge Header */}
                  <div className="h-10 w-px bg-transparent mx-1 shrink-0"></div>
                  <div className="w-16 shrink-0 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">المجموع</span>
                  </div>
                </div>
              </div>
            )}

            <div className="divide-y divide-slate-100">
              {students.map(student => {
                const state = studentsState[student.id];
                if (!state) return null;
                const isHighlighted = highlightedStudent === student.id;

                return (
                  <div 
                    key={student.id}
                    className={`flex items-center justify-between p-4 transition-colors ${isHighlighted ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                  >
                    {/* Right: Identity */}
                    <div 
                      className="flex items-center gap-4 w-64 shrink-0 cursor-pointer group"
                      onClick={() => setPortfolioStudentId(student.id)}
                    >
                      <span className="text-slate-400 font-mono text-sm w-6 text-center">{student.id}</span>
                      <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full bg-slate-100 group-hover:ring-2 group-hover:ring-indigo-500 transition-all" />
                      <span className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{student.name}</span>
                    </div>

                    {/* Left: Content based on Active Tab */}
                    <div className="flex items-center justify-end gap-4 flex-1">
                      
                      {/* Attendance Tab */}
                      {activeTab === 'attendance' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAttendanceChange(student.id, 'present')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                              state.attendance === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            حاضر
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(student.id, 'late')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                              state.attendance === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            متأخر
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(student.id, 'absent')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                              state.attendance === 'absent' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            غائب
                          </button>
                        </div>
                      )}

                      {/* Grades Tab */}
                      {activeTab === 'grades' && (
                        <>
                          <div className="flex items-center gap-6">
                            {tasks[activeCategory].map(task => {
                              const grade = state.grades[task.id] ?? '';
                              return (
                                <div key={task.id} className="flex flex-col items-center justify-center w-20">
                                  {task.type === 'number' ? (
                                    <input
                                      type="number"
                                      min="0"
                                      max={task.maxGrade}
                                      value={grade}
                                      onChange={(e) => handleGradeChange(student.id, task.id, e.target.value, task.maxGrade)}
                                      className="w-16 h-8 text-center text-sm bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                                      placeholder="-"
                                    />
                                  ) : (
                                    <button
                                      onClick={() => handleToggleGrade(student.id, task.id, task.maxGrade)}
                                      className={`w-12 h-7 rounded-full relative transition-colors duration-300 ease-in-out focus:outline-none ${grade === task.maxGrade ? 'bg-[#34C759]' : 'bg-slate-200'}`}
                                    >
                                      <div className={`absolute top-[2px] right-[2px] w-6 h-6 rounded-full bg-white shadow-md border border-slate-100 transition-transform duration-300 ease-in-out ${grade === task.maxGrade ? '-translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                            {tasks[activeCategory].length === 0 && (
                              <div className="w-32"></div>
                            )}
                          </div>
                          
                          {/* Total Badge */}
                          <div className="h-10 w-px bg-slate-200 mx-1 shrink-0"></div>
                          <div className="flex flex-col items-center justify-center bg-indigo-50 rounded-lg px-3 h-10 w-16 shrink-0">
                            <span className="text-sm font-black text-indigo-700">
                              {tasks[activeCategory].reduce((sum, t) => sum + (Number(state.grades[t.id]) || 0), 0)}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Behavior Tab */}
                      {activeTab === 'behavior' && (
                        <BehaviorDropdown
                          studentId={student.id}
                          chips={state.behaviorChips}
                          isOpen={openBehaviorStudent === student.id}
                          onToggleOpen={() => setOpenBehaviorStudent(openBehaviorStudent === student.id ? null : student.id)}
                          onClose={() => setOpenBehaviorStudent(null)}
                          onToggleChip={(chip) => toggleBehaviorChip(student.id, chip)}
                          onRemoveChip={(chip) => toggleBehaviorChip(student.id, chip)}
                        />
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </>
      )}
      </div>

      {/* Student Portfolio Modal */}
      <AnimatePresence>
        {portfolioStudentId !== null && students.find(s => s.id === portfolioStudentId) && (
          <StudentPortfolioModal
            student={students.find(s => s.id === portfolioStudentId)!}
            state={studentsState[portfolioStudentId]}
            tasks={tasks}
            onClose={() => setPortfolioStudentId(null)}
          />
        )}
      </AnimatePresence>

      {/* Task Creation Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800">{editingTaskId ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}</h3>
                <button onClick={closeTaskModal} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">اسم المهمة</label>
                  <input
                    type="text"
                    value={newTask.name}
                    onChange={e => setNewTask({...newTask, name: e.target.value})}
                    placeholder="مثال: مطوية العلوم"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الدرجة العظمى</label>
                  <input
                    type="number"
                    min="1"
                    value={newTask.maxGrade}
                    onChange={e => setNewTask({...newTask, maxGrade: Number(e.target.value)})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                  />
                </div>
                {editingTaskId && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-semibold flex items-start gap-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <p>تنبيه: تعديل الدرجة العظمى سيؤثر على نسب الطلاب الذين تم رصد درجاتهم مسبقاً في هذه المهمة.</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">نوع التقييم</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="taskType"
                        checked={newTask.type === 'number'}
                        onChange={() => setNewTask({...newTask, type: 'number'})}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-semibold text-slate-700">إدخال رقمي</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="taskType"
                        checked={newTask.type === 'binary'}
                        onChange={() => setNewTask({...newTask, type: 'binary'})}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-semibold text-slate-700">إنجاز سريع (نفذ/لم ينفذ)</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                <button
                  onClick={closeTaskModal}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAddTask}
                  disabled={!newTask.name}
                  className="px-6 py-2 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingTaskId ? 'حفظ التعديلات' : 'إضافة المهمة'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Final Submit Button (Fixed at bottom) */}
      {!showHistory && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-40 print:hidden">
          <div className="max-w-5xl mx-auto flex justify-end gap-3">
            <button
              onClick={() => window.print()}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold py-3 px-6 rounded-xl flex items-center gap-2 shadow-sm transition-colors"
            >
              <Printer size={18} />
              طباعة الكشف
            </button>
            <button
              onClick={handleFinalSubmit}
              className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-8 rounded-xl flex items-center gap-2 shadow-sm transition-colors"
            >
              <Save size={18} />
              اعتماد وحفظ السجل
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModalState !== 'idle' && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden p-6 text-center"
            >
              {confirmModalState === 'confirm' ? (
                <>
                  <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">اعتماد السجل</h3>
                  <p className="text-slate-500 mb-6">هل أنت متأكد من اعتماد كشف الحصة وإرساله للسجل الشامل؟ لا يمكن التراجع عن هذا الإجراء بسهولة.</p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setConfirmModalState('idle')}
                      className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={confirmSubmit}
                      className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm transition-colors"
                    >
                      تأكيد الاعتماد
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">تم الاعتماد بنجاح!</h3>
                  <p className="text-slate-500 mb-6">تم حفظ كشف الحصة وإرساله للسجل الشامل.</p>
                  <button
                    onClick={() => setConfirmModalState('idle')}
                    className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 shadow-sm transition-colors"
                  >
                    إغلاق
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    <PrintableTracker students={students} studentsState={studentsState} tasks={tasks} />
    </>
  );
};

export default SmartTracker;
