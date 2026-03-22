import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Dices, 
  Save, 
  Plus, 
  UserCheck, 
  Clock, 
  XCircle, 
  BookOpen, 
  Scale, 
  X
} from 'lucide-react';

// --- Types ---
interface Student {
  id: number;
  name: string;
  avatar: string;
}

interface Task {
  id: string;
  type: string;
  name: string;
  maxGrade: number;
}

interface StudentGrade {
  taskId: string;
  grade: number | '';
}

interface StudentState {
  attendance: 'present' | 'late' | 'absent';
  grades: StudentGrade[];
  behaviorChips: string[];
  notes: string;
  activeTab: 'attendance' | 'grades' | 'behavior';
}

// --- Mock Data ---
const mockStudents: Student[] = [
  { id: 1, name: 'خالد عبدالله', avatar: 'https://ui-avatars.com/api/?name=خالد+عبدالله&background=0D8ABC&color=fff' },
  { id: 2, name: 'سعود محمد', avatar: 'https://ui-avatars.com/api/?name=سعود+محمد&background=0D8ABC&color=fff' },
  { id: 3, name: 'فيصل فهد', avatar: 'https://ui-avatars.com/api/?name=فيصل+فهد&background=0D8ABC&color=fff' },
  { id: 4, name: 'عبدالرحمن سالم', avatar: 'https://ui-avatars.com/api/?name=عبدالرحمن+سالم&background=0D8ABC&color=fff' },
  { id: 5, name: 'عمر خالد', avatar: 'https://ui-avatars.com/api/?name=عمر+خالد&background=0D8ABC&color=fff' },
];

const negativeBehaviors = ['😴 نوم', '📚 لم يحضر الكتاب', '🗣️ إزعاج', '🚫 مقاطعة درس'];
const positiveBehaviors = ['💎 مجتهد', '✋ مشاركة فعالة', '🤝 مساعدة زميل'];

const SmartTracker: React.FC = () => {
  // --- Header State ---
  const [grade, setGrade] = useState('أولى ثانوي');
  const [section, setSection] = useState('أ');
  const [subject, setSubject] = useState('رياضيات');

  // --- Tasks State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ type: 'مشاركة', name: '', maxGrade: 10 });

  // --- Students State ---
  const [studentsState, setStudentsState] = useState<Record<number, StudentState>>(
    mockStudents.reduce((acc, student) => ({
      ...acc,
      [student.id]: { 
        attendance: 'present', 
        grades: [], 
        behaviorChips: [], 
        notes: '',
        activeTab: 'attendance'
      }
    }), {})
  );

  const [highlightedStudent, setHighlightedStudent] = useState<number | null>(null);

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
    const randomId = mockStudents[Math.floor(Math.random() * mockStudents.length)].id;
    setHighlightedStudent(randomId);
    setTimeout(() => setHighlightedStudent(null), 3000);
  };

  const handleTabChange = (studentId: number, tab: 'attendance' | 'grades' | 'behavior') => {
    setStudentsState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], activeTab: tab }
    }));
  };

  const handleAttendanceChange = (studentId: number, status: 'present' | 'late' | 'absent') => {
    setStudentsState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], attendance: status }
    }));
  };

  const handleGradeChange = (studentId: number, taskId: string, value: string, maxGrade: number) => {
    let numValue: number | '' = value === '' ? '' : Number(value);
    if (numValue !== '' && (numValue < 0 || numValue > maxGrade)) return; // Validate max grade

    setStudentsState(prev => {
      const studentGrades = [...prev[studentId].grades];
      const existingGradeIndex = studentGrades.findIndex(g => g.taskId === taskId);
      
      if (existingGradeIndex >= 0) {
        studentGrades[existingGradeIndex].grade = numValue;
      } else {
        studentGrades.push({ taskId, grade: numValue });
      }

      return {
        ...prev,
        [studentId]: { ...prev[studentId], grades: studentGrades }
      };
    });
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

  const handleNotesChange = (studentId: number, notes: string) => {
    setStudentsState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes }
    }));
  };

  const handleAddTask = () => {
    if (!newTask.name || newTask.maxGrade <= 0) return;
    const task: Task = {
      id: Math.random().toString(36).substring(2, 9),
      ...newTask
    };
    setTasks(prev => [...prev, task]);
    setIsTaskModalOpen(false);
    setNewTask({ type: 'مشاركة', name: '', maxGrade: 10 });
  };

  const calculateTotalGrades = (studentId: number) => {
    return studentsState[studentId].grades.reduce((sum, g) => sum + (Number(g.grade) || 0), 0);
  };

  const handleFinalSubmit = () => {
    if (confirm('هل أنت متأكد من اعتماد كشف الحصة وإرساله للسجل الشامل؟')) {
      alert('تم اعتماد كشف الحصة بنجاح!');
      // Here you would typically send the data to your backend
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 pb-32">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-primary" />
              كشف المتابعة الذكي
            </h1>
            <p className="text-slate-500 mt-2 font-medium">إدارة الحضور، المهام، والسلوك داخل الحصة</p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select 
              value={grade} onChange={e => setGrade(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 flex-1 md:flex-none"
            >
              <option>أولى ثانوي</option>
              <option>ثاني ثانوي</option>
              <option>ثالث ثانوي</option>
            </select>
            <select 
              value={section} onChange={e => setSection(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 flex-1 md:flex-none"
            >
              <option>أ</option>
              <option>ب</option>
              <option>ج</option>
            </select>
            <select 
              value={subject} onChange={e => setSubject(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 flex-1 md:flex-none"
            >
              <option>رياضيات</option>
              <option>فيزياء</option>
              <option>كيمياء</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-100">
          <button
            onClick={handleMarkAllPresent}
            className="flex-1 md:flex-none bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={20} />
            تحضير الكل حاضر
          </button>
          <button
            onClick={handleRandomSelection}
            className="flex-1 md:flex-none bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Dices size={20} />
            اختيار عشوائي
          </button>
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        {mockStudents.map(student => {
          const state = studentsState[student.id];
          const isHighlighted = highlightedStudent === student.id;

          return (
            <motion.div 
              key={student.id}
              animate={{ 
                scale: isHighlighted ? 1.02 : 1,
                boxShadow: isHighlighted ? '0 0 0 4px rgba(99, 102, 241, 0.3)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
              className={`bg-white rounded-2xl border ${isHighlighted ? 'border-indigo-500' : 'border-slate-200'} overflow-hidden transition-colors`}
            >
              <div className="flex flex-col md:flex-row">
                {/* Student Info (Right Side) */}
                <div className="p-4 md:w-64 bg-slate-50/50 border-b md:border-b-0 md:border-l border-slate-100 flex items-center gap-4">
                  <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                  <div>
                    <h3 className="font-bold text-slate-800">{student.name}</h3>
                    <span className="text-xs font-medium text-slate-500">رقم الكشف: {student.id}</span>
                  </div>
                </div>

                {/* Tabs & Content (Left Side) */}
                <div className="flex-1 flex flex-col">
                  {/* Tabs Header */}
                  <div className="flex border-b border-slate-100">
                    <button
                      onClick={() => handleTabChange(student.id, 'attendance')}
                      className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                        state.activeTab === 'attendance' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <UserCheck size={16} />
                      <span className="hidden sm:inline">الحضور</span>
                    </button>
                    <button
                      onClick={() => handleTabChange(student.id, 'grades')}
                      className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                        state.activeTab === 'grades' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <BookOpen size={16} />
                      <span className="hidden sm:inline">المتابعة</span>
                    </button>
                    <button
                      onClick={() => handleTabChange(student.id, 'behavior')}
                      className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                        state.activeTab === 'behavior' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Scale size={16} />
                      <span className="hidden sm:inline">السلوك</span>
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="p-4">
                    {/* Attendance Tab */}
                    {state.activeTab === 'attendance' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAttendanceChange(student.id, 'present')}
                          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                            state.attendance === 'present' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <CheckCircle2 size={18} />
                          حاضر
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(student.id, 'late')}
                          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                            state.attendance === 'late' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Clock size={18} />
                          متأخر
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(student.id, 'absent')}
                          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                            state.attendance === 'absent' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <XCircle size={18} />
                          غائب
                        </button>
                      </div>
                    )}

                    {/* Grades Tab */}
                    {state.activeTab === 'grades' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <button
                            onClick={() => setIsTaskModalOpen(true)}
                            className="text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Plus size={16} />
                            إضافة مهمة جديدة
                          </button>
                        </div>

                        {tasks.length > 0 ? (
                          <div className="space-y-2">
                            {tasks.map(task => {
                              const gradeObj = state.grades.find(g => g.taskId === task.id);
                              const gradeVal = gradeObj ? gradeObj.grade : '';
                              return (
                                <div key={task.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold bg-white px-2 py-1 rounded text-slate-500 border border-slate-200">{task.type}</span>
                                    <span className="text-sm font-bold text-slate-700">{task.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      max={task.maxGrade}
                                      value={gradeVal}
                                      onChange={(e) => handleGradeChange(student.id, task.id, e.target.value, task.maxGrade)}
                                      className="w-16 text-center bg-white border border-slate-200 rounded-lg py-1 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                      placeholder="-"
                                    />
                                    <span className="text-xs text-slate-400 font-medium">/ {task.maxGrade}</span>
                                    <button 
                                      className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                      title="حفظ الدرجة"
                                    >
                                      <Save size={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-slate-400 text-sm font-medium">
                            لا توجد مهام مضافة بعد. انقر على "إضافة مهمة جديدة".
                          </div>
                        )}

                        {tasks.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                            <div className="bg-primary/10 px-4 py-2 rounded-xl text-sm font-black text-primary flex items-center gap-2">
                              <span>المجموع التلقائي:</span>
                              <span className="bg-white px-3 py-1 rounded-lg shadow-sm">{calculateTotalGrades(student.id)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Behavior Tab */}
                    {state.activeTab === 'behavior' && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-bold text-slate-500 mb-2">سلوكيات سلبية</p>
                          <div className="flex flex-wrap gap-2">
                            {negativeBehaviors.map(chip => {
                              const isActive = state.behaviorChips.includes(chip);
                              return (
                                <button
                                  key={chip}
                                  onClick={() => toggleBehaviorChip(student.id, chip)}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                                    isActive ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {chip}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 mb-2">سلوكيات إيجابية</p>
                          <div className="flex flex-wrap gap-2">
                            {positiveBehaviors.map(chip => {
                              const isActive = state.behaviorChips.includes(chip);
                              return (
                                <button
                                  key={chip}
                                  onClick={() => toggleBehaviorChip(student.id, chip)}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                                    isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {chip}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <textarea
                          placeholder="ملاحظات إضافية (اختياري)..."
                          value={state.notes}
                          onChange={(e) => handleNotesChange(student.id, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none h-20"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Final Submit Button (Fixed at bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-40">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleFinalSubmit}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Save size={24} />
            <span className="text-lg">اعتماد وحفظ كشف الحصة في السجل الشامل</span>
          </button>
        </div>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">إضافة مهمة جديدة</h3>
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">نوع المهمة</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option>مشاركة</option>
                    <option>واجب</option>
                    <option>اختبار قصير</option>
                    <option>مشروع</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">اسم المهمة</label>
                  <input
                    type="text"
                    value={newTask.name}
                    onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                    placeholder="مثال: واجب ص15"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">الدرجة العظمى</label>
                  <input
                    type="number"
                    min="1"
                    value={newTask.maxGrade}
                    onChange={(e) => setNewTask({...newTask, maxGrade: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="pt-4">
                  <button
                    onClick={handleAddTask}
                    disabled={!newTask.name || newTask.maxGrade <= 0}
                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    إضافة المهمة
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartTracker;
