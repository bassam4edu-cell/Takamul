import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check,
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
  Edit2,
  Trash2,
  Book,
  Users,
  GraduationCap,
  Calendar
} from 'lucide-react';
import { PrintableTracker } from '../components/PrintableTracker';
import { StudentProfileDrawer } from '../components/StudentProfileDrawer';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useAuditLog } from '../context/AuditLogContext';
import { logAction as globalLogAction } from '../services/auditLogger';
import { formatHijriDate } from '../utils/dateUtils';
import HijriDatePicker from '../components/HijriDatePicker';

// --- Types ---
export interface Student {
  id: number;
  name: string;
  avatar: string;
  semesterAttendance: number;
}

export type TaskCategory = 'participation' | 'homework' | 'performance' | 'exams';

const CATEGORY_NAMES: Record<TaskCategory, string> = {
  participation: 'المشاركة',
  homework: 'الواجبات',
  performance: 'المهام الأدائية',
  exams: 'اختبار الفترة'
};

export interface Task {
  id: string;
  name: string;
  maxGrade: number;
  type: 'number' | 'binary';
}

export interface TeacherAssignment {
  class_id: string;
  subject_name: string;
  subject_id: number;
  grade: string;
  semester: string;
}

export interface StudentState {
  attendance: 'present' | 'late' | 'absent';
  grades: Record<string, number | ''>;
  behaviorChips: string[];
}

const negativeBehaviors = ['نوم', 'لم يحضر الكتاب', 'إزعاج', 'مقاطعة درس'];
const positiveBehaviors = ['مجتهد', 'مشاركة فعالة', 'مساعدة زميل'];

interface FilterSheetProps {
  availableSubjects: string[]; // المواد المسندة للمعلم
  availableGrades: string[]; // الصفوف (مثال: أول ثانوي، ثاني ثانوي)
  availableSections: string[]; // الفصول (مثال: 1, 2, 3, 4)
  selectedSubject: string;
  selectedGrade: string;
  selectedSection: string;
  onSelectSubject: (s: string) => void;
  onSelectGrade: (g: string) => void;
  onSelectSection: (s: string) => void;
  onApplyFilters: (filters: any) => void;
  onClose: () => void;
}

// --- Subcomponents ---

const FilterBottomSheet: React.FC<FilterSheetProps> = ({ 
  availableSubjects, availableGrades, availableSections,
  selectedSubject, selectedGrade, selectedSection,
  onSelectSubject, onSelectGrade, onSelectSection,
  onApplyFilters, onClose 
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">تصفية السجل</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Subject */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-500 flex items-center gap-2">
              <Book size={16} /> المادة الدراسية
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableSubjects.map(s => (
                <button
                  key={s}
                  onClick={() => onSelectSubject(s)}
                  className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border ${
                    selectedSubject === s 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
                      : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Grade */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-500 flex items-center gap-2">
              <GraduationCap size={16} /> الصف الدراسي
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableGrades.map(g => (
                <button
                  key={g}
                  onClick={() => onSelectGrade(g)}
                  className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border ${
                    selectedGrade === g 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
                      : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Section */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-500 flex items-center gap-2">
              <Users size={16} /> الفصل
            </label>
            <div className="grid grid-cols-3 gap-2">
              {availableSections.map(s => (
                <button
                  key={s}
                  onClick={() => onSelectSection(s)}
                  className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border ${
                    selectedSection === s 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
                      : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            onApplyFilters({ subject: selectedSubject, grade: selectedGrade, section: selectedSection });
            onClose();
          }}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all mt-4"
        >
          تطبيق الفلاتر
        </button>
      </motion.div>
    </div>
  );
};

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



const BehaviorCard: React.FC<{
  student: Student;
  chips: string[];
  onAddClick: () => void;
  onRemoveChip: (chip: string) => void;
  onStudentClick: () => void;
}> = ({ student, chips, onAddClick, onRemoveChip, onStudentClick }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-4 border border-slate-100">
      {/* Header */}
      <div 
        className="flex items-center gap-3 cursor-pointer group"
        onClick={onStudentClick}
      >
        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-teal-200 transition-colors">
          {student.name.charAt(0)}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold text-slate-800 text-sm truncate group-hover:text-teal-700 transition-colors">{student.name}</span>
        </div>
      </div>

      {/* Action Area */}
      <div>
        <button
          onClick={onAddClick}
          className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} /> إضافة ملاحظة
        </button>
      </div>

      {/* History Container */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
        {chips.length > 0 ? (
          chips.map(chip => {
            const isPositive = positiveBehaviors.includes(chip) || chip.startsWith('🌟 ');
            return (
              <span 
                key={chip} 
                className={`text-[10px] px-2 py-1 rounded-md font-medium flex items-center gap-1 ${
                  isPositive 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {chip}
                <button onClick={() => onRemoveChip(chip)} className="hover:opacity-75 transition-opacity ml-1">
                  <X size={10} />
                </button>
              </span>
            );
          })
        ) : (
          <p className="text-[10px] text-slate-400 text-center w-full py-1">لا توجد ملاحظات مسجلة</p>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---

const SmartTracker: React.FC = () => {
  const { user } = useAuth();
  const { logAction } = useAuditLog();
  // --- Header State ---
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [adminGrades, setAdminGrades] = useState<string[]>([]);
  const [adminSections, setAdminSections] = useState<string[]>([]);
  const [adminSubjects, setAdminSubjects] = useState<string[]>([]);

  // --- Derived State (Cascading Filters) ---
  const availableGrades = useMemo(() => {
    // If we have teacher assignments, they are the primary source of truth
    if (teacherAssignments.length > 0) {
      // Use the grade from class_id to ensure we only show grades where the teacher actually has classes
      const grades = [...new Set(teacherAssignments.map(a => a.class_id.split('|')[0]))];
      console.log("[DEBUG] Teacher available grades (from class_id):", grades);
      return grades;
    }
    // If teacher role, don't fall back to admin data
    if (user?.role === 'teacher') return [];
    // Fallback to admin grades only if no teacher assignments exist
    console.log("[DEBUG] No teacher assignments, using admin grades:", adminGrades);
    return adminGrades;
  }, [teacherAssignments, adminGrades, user?.role]);

  const availableSections = useMemo(() => {
    if (teacherAssignments.length > 0) {
      if (!grade) return [];
      // Filter assignments by the grade part of class_id
      const sections = [...new Set(teacherAssignments
        .filter(a => a.class_id.startsWith(grade + '|'))
        .map(a => a.class_id.split('|')[1]))];
      console.log(`[DEBUG] Teacher available sections for grade ${grade}:`, sections);
      return sections;
    }
    // If teacher role, don't fall back to admin data
    if (user?.role === 'teacher') return [];
    console.log(`[DEBUG] No teacher assignments, using admin sections for grade ${grade}:`, adminSections);
    return adminSections;
  }, [grade, teacherAssignments, adminSections, user?.role]);

  const availableSubjects = useMemo(() => {
    if (teacherAssignments.length > 0) {
      if (!grade || !section) return [];
      const fullClassId = `${grade}|${section}`;
      const subjects = [...new Set(teacherAssignments
        .filter(a => a.class_id === fullClassId)
        .map(a => a.subject_name))];
      console.log(`[DEBUG] Teacher available subjects for class ${fullClassId}:`, subjects);
      return subjects;
    }
    // If teacher role, don't fall back to admin data
    if (user?.role === 'teacher') return [];
    console.log(`[DEBUG] No teacher assignments, using admin subjects:`, adminSubjects);
    return adminSubjects;
  }, [grade, section, teacherAssignments, adminSubjects, user?.role]);

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
  const [behaviorModalStudent, setBehaviorModalStudent] = useState<number | null>(null);
  const [behaviorModalType, setBehaviorModalType] = useState<'positive' | 'negative'>('positive');
  const [behaviorModalNote, setBehaviorModalNote] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [confirmModalState, setConfirmModalState] = useState<'idle' | 'confirm' | 'success'>('idle');

  // --- Mobile State ---
  const [isMobileFilterSheetOpen, setIsMobileFilterSheetOpen] = useState(false);
  const [mobileGradingStudentId, setMobileGradingStudentId] = useState<number | null>(null);

  // --- Derived State ---
  const currentClassLabel = grade && section ? `${grade} - ${section}` : 'اختر الصف والفصل';
  const currentSubjectLabel = subject || 'اختر المادة';

  // --- Auto-Reset Effect (Cascading Logic) ---
  useEffect(() => {
    if (grade && availableSections.length > 0) {
      if (!section || !availableSections.includes(section)) {
        setSection(availableSections[0]);
      }
    } else {
      setSection('');
    }
  }, [grade, availableSections]);

  useEffect(() => {
    if (grade && section && availableSubjects.length > 0) {
      if (!subject || !availableSubjects.includes(subject)) {
        setSubject(availableSubjects[0]);
      }
    } else {
      setSubject('');
    }
  }, [grade, section, availableSubjects]);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Always try to fetch teacher assignments first for any user
        const assignRes = await apiFetch('/api/teacher/assignments');
        let hasAssignments = false;
        
        if (assignRes.ok) {
          const data: TeacherAssignment[] = await assignRes.json();
          if (data && data.length > 0) {
            setTeacherAssignments(data);
            hasAssignments = true;
            
            // Set initial grade if not set
            // Use the grade from class_id to ensure consistency with availableGrades
            const grades = [...new Set(data.map(a => a.class_id.split('|')[0]))];
            if (grades.length > 0 && !grade) {
              setGrade(grades[0]);
            }
          }
        }

        // If no assignments found, and user is not a teacher, fetch admin data
        if (!hasAssignments && user?.role !== 'teacher') {
          // Admin/Principal: fetch all grades
          const res = await apiFetch('/api/hierarchy/grades');
          if (res.ok) {
            const data = await res.json();
            setAdminGrades(data);
            if (data.length > 0 && !grade) {
              setGrade(data[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  // Fetch admin sections and subjects only if teacherAssignments is empty
  useEffect(() => {
    if (teacherAssignments.length === 0 && user?.role !== 'teacher') {
      const fetchSections = async () => {
        if (!grade) return;
        try {
          const res = await apiFetch(`/api/hierarchy/sections?grade=${encodeURIComponent(grade)}`);
          if (res.ok) {
            const data = await res.json();
            setAdminSections(data);
            if (data.length > 0 && !section) {
              setSection(data[0]);
            }
          }
        } catch (err) {
          console.error("Failed to fetch sections", err);
        }
      };
      fetchSections();
    }
  }, [grade, user?.role, teacherAssignments.length]);

  useEffect(() => {
    if (teacherAssignments.length === 0 && user?.role !== 'teacher') {
      const fetchSubjects = async () => {
        try {
          const res = await apiFetch('/api/admin/subjects');
          if (res.ok) {
            const data = await res.json();
            const subjects = [...new Set(data.map((s: any) => s.name))] as string[];
            setAdminSubjects(subjects.length > 0 ? subjects : ['الرياضيات', 'العلوم', 'لغتي', 'التربية الإسلامية']);
            if (subjects.length > 0 && !subject) {
              setSubject(subjects[0]);
            }
          }
        } catch (err) {
          console.error("Failed to fetch subjects", err);
        }
      };
      fetchSubjects();
    }
  }, [grade, section, user?.role, teacherAssignments.length]);

  useEffect(() => {
    const fetchData = async () => {
      if (!grade || !section || !subject) return;
      
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
                    if (st.grades && Array.isArray(st.grades)) {
                      st.grades.forEach((g: any) => {
                        initialState[st.student_id].grades[g.task_id] = Number(g.grade);
                      });
                    }
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

  const handleAttendanceChange = (studentId: number, status: 'present' | 'late' | 'absent') => {
    setStudentsState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], attendance: status }
    }));
    
    const student = students.find(s => s.id === studentId);
    if (student) {
      const statusText = status === 'present' ? 'حاضر' : status === 'late' ? 'متأخر' : 'غائب';
      logAction('ATTENDANCE', `تم تسجيل [${statusText}] للطالب [${student.name}]`);
      if (user) {
        globalLogAction(
          'حضور وغياب',
          'UPDATE',
          'كشف المتابعة',
          `تم تسجيل حضور [${statusText}] للطالب [${student.name}] في مادة ${subject}`
        );
      }
    }
  };

  const saveLogToLocalStorage = (log: any) => {
    const existingLogs = JSON.parse(localStorage.getItem('takamol_student_logs') || '[]');
    const existingIndex = existingLogs.findIndex((l: any) => 
      l.studentId === log.studentId && 
      l.taskName === log.taskName && 
      l.category === log.category && 
      l.date === log.date
    );
    
    if (existingIndex >= 0) {
      existingLogs[existingIndex] = { ...existingLogs[existingIndex], ...log };
    } else {
      existingLogs.push({ id: Date.now() + Math.random(), ...log });
    }
    
    localStorage.setItem('takamol_student_logs', JSON.stringify(existingLogs));
    window.dispatchEvent(new Event('takamol_logs_updated'));
  };

  const handleGradeChange = (studentId: number, taskId: string, value: string | number, maxGrade: number) => {
    let numValue: number | '' = value === '' ? '' : Number(value);
    if (numValue !== '' && numValue < 0) return; // Only prevent negative numbers

    setStudentsState(prev => ({
      ...prev,
      [studentId]: { 
        ...prev[studentId], 
        grades: { ...prev[studentId].grades, [taskId]: numValue } 
      }
    }));

    const student = students.find(s => s.id === studentId);
    let taskName = '';
    let categoryName = '';
    Object.entries(tasks).forEach(([cat, categoryTasks]) => {
      const t = categoryTasks.find(t => t.id === taskId);
      if (t) {
        taskName = t.name;
        if (cat === 'participation') categoryName = 'مشاركة';
        else if (cat === 'homework') categoryName = 'واجب';
        else if (cat === 'performance') categoryName = 'مهمة أدائية';
        else if (cat === 'exams') categoryName = 'اختبار';
      }
    });

    if (student && taskName) {
      logAction('UPDATE_GRADE', `تم تعديل درجة [${student.name}] في [${taskName}] إلى [${value}]`);
      if (user) {
        globalLogAction(
          'أكاديمي',
          'UPDATE',
          'كشف المتابعة',
          `تم تعديل درجة الطالب ${student.name} في ${taskName} إلى ${value} في مادة ${subject}`
        );
      }
      
      saveLogToLocalStorage({
        studentId,
        subject: subject || 'مادة عامة',
        category: categoryName,
        taskName,
        teacherNote: '',
        teacherName: user?.name || 'معلم المادة',
        score: numValue,
        maxScore: maxGrade,
        date: formatHijriDate(new Date()),
        status: numValue === maxGrade ? 'مكتمل' : (numValue === '' ? '' : 'ناقص')
      });
    }
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
      logAction('ADD_TASK', `تم إضافة مهمة جديدة: [${newTask.name}]`);
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

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => ({
      ...prev,
      [activeCategory]: prev[activeCategory].map(t => 
        t.id === taskId ? { ...t, ...updates } : t
      )
    }));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => ({
      ...prev,
      [activeCategory]: prev[activeCategory].filter(t => t.id !== taskId)
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, sIdx: number, tIdx: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.getElementById(`grade-input-${sIdx + 1}-${tIdx}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
        (nextInput as HTMLInputElement).select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.getElementById(`grade-input-${sIdx - 1}-${tIdx}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
        (prevInput as HTMLInputElement).select();
      }
    } else if (e.key === 'ArrowRight') {
      if ((e.target as HTMLInputElement).selectionStart === (e.target as HTMLInputElement).value.length || (e.target as HTMLInputElement).value === '') {
        e.preventDefault();
        const prevInput = document.getElementById(`grade-input-${sIdx}-${tIdx - 1}`);
        if (prevInput) {
          (prevInput as HTMLInputElement).focus();
          (prevInput as HTMLInputElement).select();
        }
      }
    } else if (e.key === 'ArrowLeft') {
      if ((e.target as HTMLInputElement).selectionStart === 0 || (e.target as HTMLInputElement).value === '') {
        e.preventDefault();
        const nextInput = document.getElementById(`grade-input-${sIdx}-${tIdx + 1}`);
        if (nextInput) {
          (nextInput as HTMLInputElement).focus();
          (nextInput as HTMLInputElement).select();
        }
      }
    }
  };

  const toggleBehaviorChip = (studentId: number, chip: string) => {
    setStudentsState(prev => {
      const chips = prev[studentId].behaviorChips;
      const isAdding = !chips.includes(chip);
      const newChips = isAdding 
        ? [...chips, chip]
        : chips.filter(c => c !== chip);
      
      if (isAdding) {
        if (user) {
          const student = students.find(s => s.id === studentId);
          globalLogAction(
            'سلوكي',
            'UPDATE',
            'كشف المتابعة',
            `تم إضافة ملاحظة سلوكية [${chip}] للطالب ${student?.name || studentId} في مادة ${subject}`
          );
        }
        saveLogToLocalStorage({
          studentId,
          subject: subject || 'مادة عامة',
          category: 'سلوك',
          taskName: 'ملاحظة سلوكية',
          teacherNote: chip,
          teacherName: user?.name || 'معلم المادة',
          score: null,
          maxScore: null,
          date: formatHijriDate(new Date()),
          status: ''
        });
      } else {
        if (user) {
          const student = students.find(s => s.id === studentId);
          globalLogAction(
            'سلوكي',
            'UPDATE',
            'كشف المتابعة',
            `تم إزالة ملاحظة سلوكية [${chip}] للطالب ${student?.name || studentId} في مادة ${subject}`
          );
        }
      }
      
      return {
        ...prev,
        [studentId]: { ...prev[studentId], behaviorChips: newChips }
      };
    });
  };

  const handleSaveBehaviorNote = () => {
    if (behaviorModalStudent === null) return;
    
    if (behaviorModalNote.trim()) {
      // Add custom note
      const prefix = behaviorModalType === 'positive' ? '🌟 ' : '⚠️ ';
      toggleBehaviorChip(behaviorModalStudent, prefix + behaviorModalNote.trim());
    }
    
    setBehaviorModalStudent(null);
    setBehaviorModalNote('');
    setBehaviorModalType('positive');
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
        globalLogAction(
          'متابعة',
          'CREATE',
          'المتابع الذكي',
          `قام بحفظ متابعة الطلاب للصف ${grade} - ${section} لمادة ${subject}`
        );
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
    <div className="min-h-screen bg-slate-50 pb-32 font-sans print:hidden" dir="rtl">
      
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-[40] bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-lg font-black text-slate-800">سجل المتابعة</h1>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{currentClassLabel}</span>
            <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{currentSubjectLabel}</span>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileFilterSheetOpen(true)}
          className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <Dices size={20} />
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
        
        {/* Desktop Header & Filters */}
        <div className="hidden md:flex flex-col items-center gap-6 mb-2">
          {/* Smart Pill Container */}
          <div className="flex flex-col items-center gap-2 w-full max-w-3xl">
            <div className="flex flex-wrap md:flex-nowrap items-center bg-white rounded-3xl md:rounded-full shadow-sm border border-slate-200 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200 p-1 w-full">
              
              {/* Date */}
              <div className="relative flex items-center hover:bg-slate-50 rounded-t-2xl md:rounded-t-none md:rounded-r-full transition-colors w-full md:w-auto flex-1">
                <Calendar size={16} className="text-slate-400 absolute right-3 pointer-events-none" />
                <HijriDatePicker
                  value={date}
                  onChange={setDate}
                  className="appearance-none bg-transparent border-none text-slate-700 font-medium text-sm focus:ring-0 cursor-pointer pr-10 pl-2 py-2.5 w-full outline-none"
                  placeholder="اختر التاريخ"
                />
              </div>

              {/* Subject */}
              <div className="relative flex items-center hover:bg-slate-50 transition-colors w-full md:w-auto flex-1">
                <Book size={16} className="text-slate-400 absolute right-3 pointer-events-none" />
                <select 
                  value={subject} onChange={e => setSubject(e.target.value)}
                  className="appearance-none bg-transparent border-none text-slate-700 font-medium text-sm focus:ring-0 cursor-pointer pr-10 pl-8 py-2.5 w-full outline-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'left 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  disabled={availableSubjects.length === 0}
                >
                  {availableSubjects.length === 0 ? (
                    <option value="">لا توجد مواد مسندة</option>
                  ) : (
                    availableSubjects.map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Grade */}
              <div className="relative flex items-center hover:bg-slate-50 transition-colors w-full md:w-auto flex-1">
                <GraduationCap size={16} className="text-slate-400 absolute right-3 pointer-events-none" />
                <select 
                  value={grade} onChange={e => setGrade(e.target.value)}
                  className="appearance-none bg-transparent border-none text-slate-700 font-medium text-sm focus:ring-0 cursor-pointer pr-10 pl-8 py-2.5 w-full outline-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'left 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  disabled={availableGrades.length === 0}
                >
                  {availableGrades.length === 0 ? (
                    <option value="">لا توجد صفوف</option>
                  ) : (
                    availableGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Section */}
              <div className="relative flex items-center hover:bg-slate-50 rounded-b-2xl md:rounded-b-none md:rounded-l-full transition-colors w-full md:w-auto flex-1">
                <Users size={16} className="text-slate-400 absolute right-3 pointer-events-none" />
                <select 
                  value={section} onChange={e => setSection(e.target.value)}
                  className="appearance-none bg-transparent border-none text-slate-700 font-medium text-sm focus:ring-0 cursor-pointer pr-10 pl-8 py-2.5 w-full outline-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'left 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  disabled={availableSections.length === 0}
                >
                  {availableSections.length === 0 ? (
                    <option value="">لا توجد فصول</option>
                  ) : (
                    availableSections.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-500">{formatHijriDate(date)}</span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-2">
            {activeTab === 'attendance' && (
              <button
                onClick={handleMarkAllPresent}
                className="rounded-full bg-slate-50 hover:bg-slate-100 text-teal-700 border border-slate-200 px-4 py-2 text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                تحضير الكل
              </button>
            )}
          </div>
        </div>

        {/* Segmented Control (iOS Style) - Desktop */}
        <div className="hidden md:flex bg-slate-200/60 p-1 rounded-xl w-full max-w-md mx-auto">
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

        {/* Desktop Master List & Behavior Cards */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-4">
          {/* Toolbar */}
          {activeTab === 'grades' && (
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                {(['participation', 'homework', 'performance', 'exams'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                      activeCategory === cat ? 'bg-teal-50 text-teal-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {CATEGORY_NAMES[cat]}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setEditingTaskId(null);
                  setNewTask({ name: '', maxGrade: 5, type: 'number' });
                  setIsTaskModalOpen(true);
                }}
                className="shrink-0 bg-teal-700 text-white hover:bg-teal-800 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors mr-4 shadow-sm"
              >
                <Plus size={16} />
                إضافة مهمة جديدة
              </button>
            </div>
          )}

          {/* Data Grid or Behavior Grid */}
          {activeTab === 'behavior' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              {students.map((student) => {
                const state = studentsState[student.id];
                if (!state) return null;
                return (
                  <BehaviorCard
                    key={student.id}
                    student={student}
                    chips={state.behaviorChips}
                    onAddClick={() => setBehaviorModalStudent(student.id)}
                    onRemoveChip={(chip) => toggleBehaviorChip(student.id, chip)}
                    onStudentClick={() => setSelectedStudentId(student.id)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="sticky right-0 z-20 bg-white shadow-[1px_0_5px_rgba(0,0,0,0.1)] border border-slate-300 p-2 text-sm h-10 whitespace-nowrap min-w-[200px]">
                      الطالب
                    </th>
                    {activeTab === 'grades' && (
                      <>
                        {tasks[activeCategory].map((task, tIdx) => (
                          <th 
                            key={task.id} 
                            onClick={() => handleEditTask(task)}
                            className="border border-slate-300 bg-slate-100 p-2 text-sm h-10 whitespace-nowrap min-w-[100px] cursor-pointer hover:bg-slate-200 transition-colors relative group"
                            title="انقر لتعديل المهمة"
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                              className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                              title="حذف المهمة"
                            >
                              <Trash2 size={14} />
                            </button>
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <span className="truncate w-full text-center">{task.name}</span>
                              <span className="text-[10px] text-slate-500 font-normal">({task.maxGrade})</span>
                            </div>
                          </th>
                        ))}
                        {tasks[activeCategory].length === 0 && (
                          <th className="border border-slate-300 bg-slate-100 p-2 text-sm h-10 whitespace-nowrap text-slate-400 font-normal text-center">
                            لا توجد مهام مضافة
                          </th>
                        )}
                        <th className="sticky left-0 z-20 bg-slate-50 shadow-[-1px_0_5px_rgba(0,0,0,0.1)] border border-slate-300 p-2 text-sm h-10 whitespace-nowrap min-w-[80px] text-center">
                          المجموع
                        </th>
                      </>
                    )}
                    {activeTab === 'attendance' && (
                      <th className="border border-slate-300 bg-slate-100 p-2 text-sm h-10 whitespace-nowrap w-full">
                        التحضير
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, sIdx) => {
                    const state = studentsState[student.id];
                    if (!state) return null;
                    const isHighlighted = highlightedStudent === student.id;
                    
                    return (
                      <tr key={student.id} className={`transition-colors ${isHighlighted ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                        <td className="sticky right-0 z-10 bg-white shadow-[1px_0_5px_rgba(0,0,0,0.1)] border border-slate-300 p-2 h-10">
                          <div 
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => setSelectedStudentId(student.id)}
                          >
                            <span className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">{student.name}</span>
                          </div>
                        </td>
                        
                        {activeTab === 'grades' && (
                          <>
                            {tasks[activeCategory].map((task, tIdx) => {
                              const val = state.grades[task.id] ?? '';
                              const isError = val !== '' && Number(val) > task.maxGrade;
                              return (
                                <td key={task.id} className={`p-0 border border-slate-300 h-10 relative ${isError ? 'bg-red-50' : ''}`}>
                                  {task.type === 'number' ? (
                                    <input 
                                      type="number"
                                      value={val}
                                      onChange={(e) => handleGradeChange(student.id, task.id, e.target.value, task.maxGrade)}
                                      onKeyDown={(e) => handleKeyDown(e, sIdx, tIdx)}
                                      id={`grade-input-${sIdx}-${tIdx}`}
                                      className="w-full h-full text-center bg-transparent focus:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-inset m-0 border-none [&::-webkit-inner-spin-button]:appearance-none text-sm font-bold text-slate-700"
                                      placeholder="-"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => handleGradeChange(student.id, task.id, task.maxGrade, task.maxGrade)}
                                        className={`rounded-full p-1.5 transition-all ${
                                          val === task.maxGrade 
                                            ? 'bg-green-500 text-white shadow-sm ring-2 ring-green-200' 
                                            : 'text-slate-400 bg-slate-50 hover:bg-green-50 hover:text-green-600'
                                        }`}
                                      >
                                        <Check size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleGradeChange(student.id, task.id, 0, task.maxGrade)}
                                        className={`rounded-full p-1.5 transition-all ${
                                          val === 0 
                                            ? 'bg-red-500 text-white shadow-sm ring-2 ring-red-200' 
                                            : 'text-slate-400 bg-slate-50 hover:bg-red-50 hover:text-red-600'
                                        }`}
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                            {tasks[activeCategory].length === 0 && (
                              <td className="p-0 border border-slate-300 h-10 bg-slate-50/50"></td>
                            )}
                            <td className="sticky left-0 z-10 bg-slate-50 shadow-[-1px_0_5px_rgba(0,0,0,0.1)] border border-slate-300 p-0 h-10 text-center font-black text-teal-700">
                              {tasks[activeCategory].reduce((sum, t) => sum + (Number(state.grades[t.id]) || 0), 0)}
                            </td>
                          </>
                        )}

                        {activeTab === 'attendance' && (
                          <td className="p-0 border border-slate-300 h-10 w-full">
                            <div className="flex items-center gap-2 p-2 min-h-[3rem]">
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
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

        {/* Mobile Category Tabs & Actions */}
        {activeTab === 'grades' && (
          <div className="md:hidden flex flex-col gap-3 mb-4">
            <div className="flex overflow-x-auto hide-scrollbar whitespace-nowrap gap-2 pb-2 px-1">
              {(['participation', 'homework', 'performance', 'exams'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                    activeCategory === cat 
                      ? 'bg-teal-500 text-white border-teal-500 shadow-teal-100' 
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  {CATEGORY_NAMES[cat]}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setEditingTaskId(null);
                setNewTask({ name: '', maxGrade: 5, type: 'number' });
                setIsTaskModalOpen(true);
              }}
              className="w-full bg-teal-700 text-white hover:bg-teal-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={16} />
              إضافة مهمة جديدة
            </button>
          </div>
        )}

        {/* Mobile Student Cards Layout */}
        <div className="block md:hidden space-y-4">
          {students.map((student) => {
            const state = studentsState[student.id];
            if (!state) return null;

            return (
              <motion.div 
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col gap-4"
              >
                {/* Card Header: Student Name & Total */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">{student.name}</span>
                      <span className="text-[10px] text-slate-400">رقم الطالب: #{student.id}</span>
                    </div>
                  </div>
                  
                  {activeTab === 'grades' && (
                    <div className="flex flex-col items-center bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold">المجموع</span>
                      <span className="font-bold text-teal-700 text-lg">
                        {tasks[activeCategory].reduce((sum, t) => sum + (Number(state.grades[t.id]) || 0), 0)}
                      </span>
                    </div>
                  )}

                  {activeTab !== 'grades' && (
                    <button 
                      onClick={() => setSelectedStudentId(student.id)}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Users size={18} />
                    </button>
                  )}
                </div>

                {/* Tab Specific Content */}
                {activeTab === 'attendance' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAttendanceChange(student.id, 'present')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        state.attendance === 'present' 
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100' 
                          : 'bg-slate-50 text-slate-400'
                      }`}
                    >
                      حاضر
                    </button>
                    <button
                      onClick={() => handleAttendanceChange(student.id, 'late')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        state.attendance === 'late' 
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-100' 
                          : 'bg-slate-50 text-slate-400'
                      }`}
                    >
                      متأخر
                    </button>
                    <button
                      onClick={() => handleAttendanceChange(student.id, 'absent')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        state.attendance === 'absent' 
                          ? 'bg-red-500 text-white shadow-md shadow-red-100' 
                          : 'bg-slate-50 text-slate-400'
                      }`}
                    >
                      غائب
                    </button>
                  </div>
                )}

                {activeTab === 'grades' && (
                  <div className="space-y-3">
                    {tasks[activeCategory].map((task) => {
                      const val = state.grades[task.id] ?? '';
                      const isError = val !== '' && Number(val) > task.maxGrade;
                      
                      return (
                        <div key={task.id} className={`flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100 ${isError ? 'bg-red-50 border-red-100' : ''}`}>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">{task.name}</span>
                            <span className="text-[10px] text-slate-400">الدرجة العظمى: {task.maxGrade}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {task.type === 'number' ? (
                              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
                                <button 
                                  onClick={() => handleGradeChange(student.id, task.id, Math.max(0, (Number(val) || 0) - 1), task.maxGrade)}
                                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <Plus size={14} className="rotate-45" />
                                </button>
                                <input 
                                  type="number"
                                  value={val}
                                  onChange={(e) => handleGradeChange(student.id, task.id, e.target.value, task.maxGrade)}
                                  className="w-12 text-center font-bold text-teal-700 text-sm bg-transparent border-none focus:ring-0 p-0"
                                  placeholder="0"
                                />
                                <button 
                                  onClick={() => handleGradeChange(student.id, task.id, Math.min(task.maxGrade, (Number(val) || 0) + 1), task.maxGrade)}
                                  className="p-2 text-slate-400 hover:text-teal-600 transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleGradeChange(student.id, task.id, 0, task.maxGrade)}
                                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all border ${
                                    val === 0 
                                      ? 'bg-red-500 text-white border-red-600 shadow-sm' 
                                      : 'bg-white text-slate-300 hover:bg-red-50'
                                  }`}
                                >
                                  <X size={18} />
                                </button>
                                <button
                                  onClick={() => handleGradeChange(student.id, task.id, task.maxGrade, task.maxGrade)}
                                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all border ${
                                    val === task.maxGrade 
                                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' 
                                      : 'bg-white text-slate-300 hover:bg-emerald-50'
                                  }`}
                                >
                                  <Check size={18} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {tasks[activeCategory].length === 0 && (
                      <div className="text-center py-4 text-slate-400 text-xs italic">
                        لا توجد مهام مضافة في هذا القسم
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'behavior' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {state.behaviorChips.length > 0 ? (
                        state.behaviorChips.map(chip => (
                          <span key={chip} className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {chip}
                          </span>
                        ))
                      ) : (
                        <span className="text-[9px] text-slate-400 italic">لا توجد ملاحظات</span>
                      )}
                    </div>
                    <button 
                      onClick={() => setBehaviorModalStudent(student.id)}
                      className="w-full py-2 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2"
                    >
                      <Plus size={14} /> إضافة ملاحظة سلوكية
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

      {/* Mobile Grading Bottom Sheet */}
      <AnimatePresence>
        {mobileGradingStudentId !== null && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm md:hidden">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full rounded-t-3xl p-6 shadow-2xl flex flex-col gap-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                    {students.find(s => s.id === mobileGradingStudentId)?.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800">رصد درجات الطالب</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{students.find(s => s.id === mobileGradingStudentId)?.name}</span>
                      <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-bold">
                        {CATEGORY_NAMES[activeCategory]}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setMobileGradingStudentId(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              {/* Category selector inside bottom sheet */}
              <div className="flex gap-2 overflow-x-auto hide-scrollbar px-1">
                {(['participation', 'homework', 'performance', 'exams'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border ${
                      activeCategory === cat 
                        ? 'bg-teal-500 text-white border-teal-500 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {CATEGORY_NAMES[cat]}
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                {tasks[activeCategory].map((task) => {
                  const val = studentsState[mobileGradingStudentId]?.grades[task.id] ?? '';
                  return (
                    <div key={task.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700 text-sm">{task.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold">الدرجة العظمى: {task.maxGrade}</span>
                      </div>
                      
                      {task.type === 'number' ? (
                        <div className="flex items-center gap-4">
                          <input 
                            type="number"
                            value={val}
                            onChange={(e) => handleGradeChange(mobileGradingStudentId, task.id, e.target.value, task.maxGrade)}
                            className="flex-1 py-3 text-center bg-white border border-slate-200 rounded-xl font-black text-lg text-teal-700 focus:ring-2 focus:ring-teal-500 outline-none"
                            placeholder="0"
                          />
                          <div className="flex flex-col gap-1">
                            <button 
                              onClick={() => handleGradeChange(mobileGradingStudentId, task.id, Math.min(task.maxGrade, (Number(val) || 0) + 1), task.maxGrade)}
                              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600"
                            >
                              <Plus size={16} />
                            </button>
                            <button 
                              onClick={() => handleGradeChange(mobileGradingStudentId, task.id, Math.max(0, (Number(val) || 0) - 1), task.maxGrade)}
                              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600"
                            >
                              <X size={16} className="rotate-45" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGradeChange(mobileGradingStudentId, task.id, task.maxGrade, task.maxGrade)}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                              val === task.maxGrade ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-500'
                            }`}
                          >
                            تم الإنجاز
                          </button>
                          <button
                            onClick={() => handleGradeChange(mobileGradingStudentId, task.id, 0, task.maxGrade)}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                              val === 0 ? 'bg-red-500 text-white' : 'bg-white border border-slate-200 text-slate-500'
                            }`}
                          >
                            لم يتم
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {tasks[activeCategory].length === 0 && (
                  <div className="text-center py-10 text-slate-400 italic text-sm">
                    لا توجد مهام مضافة في هذا التصنيف
                  </div>
                )}
              </div>

              <button
                onClick={() => setMobileGradingStudentId(null)}
                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-slate-900 transition-all mt-4"
              >
                تم
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Filter Bottom Sheet */}
      <AnimatePresence>
        {isMobileFilterSheetOpen && (
          <FilterBottomSheet
            availableSubjects={availableSubjects}
            availableGrades={availableGrades}
            availableSections={availableSections}
            selectedSubject={subject}
            selectedGrade={grade}
            selectedSection={section}
            onSelectSubject={setSubject}
            onSelectGrade={setGrade}
            onSelectSection={setSection}
            onApplyFilters={() => {}}
            onClose={() => setIsMobileFilterSheetOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between z-[50] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'attendance' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <Clock size={20} />
          <span className="text-[10px] font-bold">الحضور</span>
        </button>
        <button 
          onClick={() => setActiveTab('grades')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'grades' ? 'text-teal-600' : 'text-slate-400'}`}
        >
          <Star size={20} />
          <span className="text-[10px] font-bold">المتابعة</span>
        </button>
        <button 
          onClick={() => setActiveTab('behavior')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'behavior' ? 'text-amber-600' : 'text-slate-400'}`}
        >
          <Trophy size={20} />
          <span className="text-[10px] font-bold">السلوك</span>
        </button>
        <div className="w-px h-8 bg-slate-100 mx-2" />
        <button 
          onClick={handleFinalSubmit}
          className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-all"
        >
          <Save size={20} />
        </button>
      </div>

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
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-700 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الدرجة العظمى</label>
                  <input
                    type="number"
                    min="1"
                    value={newTask.maxGrade}
                    onChange={e => setNewTask({...newTask, maxGrade: Number(e.target.value)})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-700 focus:bg-white outline-none transition-all"
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
                        className="w-4 h-4 text-teal-700 focus:ring-teal-700"
                      />
                      <span className="text-sm font-semibold text-slate-700">إدخال رقمي</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="taskType"
                        checked={newTask.type === 'binary'}
                        onChange={() => setNewTask({...newTask, type: 'binary'})}
                        className="w-4 h-4 text-teal-700 focus:ring-teal-700"
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
                  className="px-6 py-2 rounded-xl text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingTaskId ? 'حفظ التعديلات' : 'إضافة المهمة'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Final Submit Button (Fixed at bottom) - Desktop Only */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-30 print:hidden">
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
            className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-8 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors w-full md:w-auto"
          >
            <Save size={18} />
            اعتماد وحفظ السجل
          </button>
        </div>
      </div>

      {/* Add Behavior Modal */}
      <AnimatePresence>
        {behaviorModalStudent !== null && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 text-lg">إضافة ملاحظة سلوكية</h3>
                <button
                  onClick={() => setBehaviorModalStudent(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 flex flex-col gap-5">
                {/* Type Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setBehaviorModalType('positive')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                      behaviorModalType === 'positive' 
                        ? 'bg-white text-emerald-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    سلوك إيجابي
                  </button>
                  <button
                    onClick={() => setBehaviorModalType('negative')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                      behaviorModalType === 'negative' 
                        ? 'bg-white text-red-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    سلوك سلبي
                  </button>
                </div>

                {/* Predefined Options */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">اختر من القائمة (اختياري)</label>
                  <div className="flex flex-wrap gap-2">
                    {(behaviorModalType === 'positive' ? positiveBehaviors : negativeBehaviors).map(b => (
                      <button
                        key={b}
                        onClick={() => {
                          toggleBehaviorChip(behaviorModalStudent, b);
                          setBehaviorModalStudent(null);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                          behaviorModalType === 'positive'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Note */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">أو اكتب ملاحظة مخصصة</label>
                  <textarea
                    value={behaviorModalNote}
                    onChange={(e) => setBehaviorModalNote(e.target.value)}
                    placeholder="اكتب تفاصيل الملاحظة هنا..."
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none resize-none h-24 bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                <button
                  onClick={() => setBehaviorModalStudent(null)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveBehaviorNote}
                  disabled={!behaviorModalNote.trim()}
                  className="px-6 py-2 rounded-xl text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  حفظ الملاحظة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModalState !== 'idle' && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden p-6 text-center"
            >
              {confirmModalState === 'confirm' ? (
                <>
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">تأكيد الحفظ</h3>
                  <p className="text-slate-600 mb-6">هل أنت متأكد من رغبتك في اعتماد وحفظ سجل المتابعة لهذا اليوم؟</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmModalState('idle')}
                      className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      تراجع
                    </button>
                    <button
                      onClick={confirmSubmit}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                    >
                      تأكيد وحفظ
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">تم الحفظ بنجاح</h3>
                  <p className="text-slate-600 mb-6">تم اعتماد سجل المتابعة وحفظه في النظام.</p>
                  <button
                    onClick={() => setConfirmModalState('idle')}
                    className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors"
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

    {/* Student Profile Drawer */}
    <AnimatePresence>
      {selectedStudentId !== null && students.find(s => s.id === selectedStudentId) && studentsState[selectedStudentId] && (
        <StudentProfileDrawer
          student={students.find(s => s.id === selectedStudentId)!}
          state={studentsState[selectedStudentId]}
          tasks={tasks}
          grade={grade}
          section={section}
          date={date}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </AnimatePresence>

    {!selectedStudentId && (
      <PrintableTracker 
        students={students} 
        studentsState={studentsState} 
        tasks={tasks} 
        subject={subject}
        grade={grade}
        section={section}
        teacherName={user?.name || ''}
      />
    )}
    </>
  );
};

export default SmartTracker;
