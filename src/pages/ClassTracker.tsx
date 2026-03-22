import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, 
  Dices, 
  Save, 
  Hand, 
  BookOpen, 
  AlertTriangle, 
  X,
  Star,
  Clock,
  XCircle,
  Check,
  Lock
} from 'lucide-react';
import { apiFetch } from '../utils/api';

interface Student {
  id: number;
  rollNumber: number;
  name: string;
  points: number;
  avatar: string;
}

interface StudentState {
  attendance: 'present' | 'late' | 'absent';
  participation: boolean;
  homework: boolean;
  negativeNote: boolean;
}

const mockStudents: Student[] = [
  { id: 1, rollNumber: 1, name: 'خالد عبدالله', points: 15, avatar: 'https://ui-avatars.com/api/?name=خالد+عبدالله&background=0D8ABC&color=fff' },
  { id: 2, rollNumber: 2, name: 'سعود محمد', points: 10, avatar: 'https://ui-avatars.com/api/?name=سعود+محمد&background=0D8ABC&color=fff' },
  { id: 3, rollNumber: 3, name: 'فيصل فهد', points: 22, avatar: 'https://ui-avatars.com/api/?name=فيصل+فهد&background=0D8ABC&color=fff' },
  { id: 4, rollNumber: 4, name: 'عبدالرحمن سالم', points: 5, avatar: 'https://ui-avatars.com/api/?name=عبدالرحمن+سالم&background=0D8ABC&color=fff' },
  { id: 5, rollNumber: 5, name: 'عمر خالد', points: 18, avatar: 'https://ui-avatars.com/api/?name=عمر+خالد&background=0D8ABC&color=fff' },
];

const behaviorChips = [
  'إزعاج', 
  'إهمال أدوات', 
  'نوم بالحصة', 
  'تميز وابتكار', 
  'مساعدة زميل'
];

const ClassTracker: React.FC = () => {
  const { user } = useAuth();
  const isReadOnly = user?.role !== 'teacher';

  const [grade, setGrade] = useState('أولى ثانوي');
  const [section, setSection] = useState('أ');
  const [subject, setSubject] = useState('رياضيات');
  const [period, setPeriod] = useState<number>(1);
  
  const [studentsState, setStudentsState] = useState<Record<number, StudentState>>(
    mockStudents.reduce((acc, student) => ({
      ...acc,
      [student.id]: { attendance: 'present', participation: false, homework: false, negativeNote: false }
    }), {})
  );

  const [highlightedStudent, setHighlightedStudent] = useState<number | null>(null);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [modalNote, setModalNote] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const todayDate = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleAttendanceChange = (studentId: number, status: 'present' | 'late' | 'absent') => {
    if (isReadOnly) return;
    setStudentsState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], attendance: status }
    }));
  };

  const toggleAssessment = (studentId: number, field: keyof Omit<StudentState, 'attendance'>) => {
    if (isReadOnly) return;
    setStudentsState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: !prev[studentId][field] }
    }));
  };

  const markAllPresent = () => {
    if (isReadOnly) return;
    setStudentsState(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(id => {
        newState[Number(id)].attendance = 'present';
      });
      return newState;
    });
  };

  const pickRandomStudent = () => {
    if (isReadOnly) return;
    let counter = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * mockStudents.length);
      setHighlightedStudent(mockStudents[randomIndex].id);
      counter++;
      if (counter > 10) {
        clearInterval(interval);
        // Keep the final selection highlighted for a bit longer
        setTimeout(() => setHighlightedStudent(null), 3000);
      }
    }, 100);
  };

  const openStudentModal = (student: Student) => {
    if (isReadOnly) return;
    setSelectedStudentForModal(student);
    setSelectedChips([]);
    setModalNote('');
  };

  const handleSaveToRecord = () => {
    if (isReadOnly) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSelectedStudentForModal(null);
    }, 1000);
  };

  const toggleChip = (chip: string) => {
    if (isReadOnly) return;
    setSelectedChips(prev => 
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-24">
      {/* Top Bar & Tools */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select 
              value={grade} onChange={(e) => setGrade(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 font-bold"
            >
              <option value="أولى ثانوي">أولى ثانوي</option>
              <option value="ثاني ثانوي">ثاني ثانوي</option>
              <option value="ثالث ثانوي">ثالث ثانوي</option>
            </select>
            <select 
              value={section} onChange={(e) => setSection(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 font-bold"
            >
              <option value="أ">أ</option>
              <option value="ب">ب</option>
              <option value="ج">ج</option>
            </select>
            <select 
              value={subject} onChange={(e) => setSubject(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 font-bold"
            >
              <option value="رياضيات">رياضيات</option>
              <option value="فيزياء">فيزياء</option>
              <option value="كيمياء">كيمياء</option>
            </select>
            
            <select 
              value={period} onChange={(e) => setPeriod(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 font-bold"
            >
              {[1, 2, 3, 4, 5, 6, 7].map(p => (
                <option key={p} value={p}>الحصة {p}</option>
              ))}
            </select>
          </div>
          <div className="text-sm font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-lg">
            {todayDate}
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
            <button 
              onClick={markAllPresent}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold py-2.5 px-4 rounded-xl transition-all duration-200"
            >
              <CheckCircle2 size={18} />
              <span className="text-sm">تحضير الكل حاضر</span>
            </button>
            
            <button 
              onClick={pickRandomStudent}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold py-2.5 px-4 rounded-xl transition-all duration-200"
            >
              <Dices size={18} />
              <span className="text-sm">اختيار عشوائي</span>
            </button>

            <button 
              className="flex-1 md:flex-none md:mr-auto flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 font-bold py-2.5 px-6 rounded-xl transition-all duration-200 shadow-sm shadow-primary/20"
            >
              <Save size={18} />
              <span className="text-sm">اعتماد وحفظ في السجل الشامل</span>
            </button>
          </div>
        )}
      </div>

      {/* Students Grid */}
      <div className="space-y-3">
        {mockStudents.map((student) => {
          const state = studentsState[student.id];
          const isHighlighted = highlightedStudent === student.id;

          return (
            <motion.div 
              key={student.id}
              initial={false}
              animate={{
                scale: isHighlighted ? 1.02 : 1,
                boxShadow: isHighlighted ? '0 10px 25px -5px rgba(99, 102, 241, 0.4)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                borderColor: isHighlighted ? '#6366f1' : '#f1f5f9'
              }}
              className={`bg-white rounded-xl border p-3 md:p-4 flex flex-col md:flex-row items-center gap-4 transition-all duration-200 ${isHighlighted ? 'ring-2 ring-indigo-500 ring-offset-2 z-10 relative' : ''}`}
            >
              {/* Identity (Right) */}
              <div 
                className="flex items-center gap-3 w-full md:w-1/3 cursor-pointer group"
                onClick={() => openStudentModal(student)}
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                  {student.rollNumber}
                </div>
                <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full shadow-sm" />
                <div>
                  <h3 className="font-bold text-slate-800 group-hover:text-primary transition-colors">{student.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-slate-500">{student.points} نقطة</span>
                  </div>
                </div>
              </div>

              {/* Attendance (Center) */}
              <div className="flex items-center justify-center w-full md:w-1/3 bg-slate-50 p-1.5 rounded-xl">
                <button
                  onClick={() => handleAttendanceChange(student.id, 'present')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                    state.attendance === 'present' 
                      ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <CheckCircle2 size={14} className={state.attendance === 'present' ? 'text-emerald-500' : ''} />
                  حاضر
                </button>
                <button
                  onClick={() => handleAttendanceChange(student.id, 'late')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                    state.attendance === 'late' 
                      ? 'bg-white text-amber-600 shadow-sm ring-1 ring-slate-200/50' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Clock size={14} className={state.attendance === 'late' ? 'text-amber-500' : ''} />
                  متأخر
                </button>
                <button
                  onClick={() => handleAttendanceChange(student.id, 'absent')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                    state.attendance === 'absent' 
                      ? 'bg-white text-red-600 shadow-sm ring-1 ring-slate-200/50' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <XCircle size={14} className={state.attendance === 'absent' ? 'text-red-500' : ''} />
                  غائب
                </button>
              </div>

              {/* Quick Assessment (Left) */}
              <div className="flex items-center justify-end gap-3 w-full md:w-1/3">
                <button
                  onClick={() => toggleAssessment(student.id, 'participation')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    state.participation 
                      ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500/20' 
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                  title="مشاركة / نشط"
                >
                  <Hand size={18} />
                </button>
                <button
                  onClick={() => toggleAssessment(student.id, 'homework')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    state.homework 
                      ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500/20' 
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                  title="حل الواجب"
                >
                  <BookOpen size={18} />
                </button>
                <button
                  onClick={() => {
                    toggleAssessment(student.id, 'negativeNote');
                    if (!state.negativeNote) {
                      openStudentModal(student);
                    }
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    state.negativeNote 
                      ? 'bg-red-100 text-red-600 ring-2 ring-red-500/20' 
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                  title="ملاحظة سلبية"
                >
                  <AlertTriangle size={18} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Student Details Modal */}
      <AnimatePresence>
        {selectedStudentForModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
              onClick={() => setSelectedStudentForModal(null)}
            />
            <motion.div 
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:right-auto md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[500px] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={selectedStudentForModal.avatar} alt={selectedStudentForModal.name} className="w-10 h-10 rounded-full shadow-sm" />
                  <div>
                    <h3 className="font-bold text-slate-800">{selectedStudentForModal.name}</h3>
                    <p className="text-xs text-slate-500">رقم الكشف: {selectedStudentForModal.rollNumber}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStudentForModal(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-3">تقييم سريع للسلوك:</h4>
                  <div className="flex flex-wrap gap-2">
                    {behaviorChips.map(chip => (
                      <button
                        key={chip}
                        onClick={() => toggleChip(chip)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                          selectedChips.includes(chip)
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-3">ملاحظات إضافية:</h4>
                  <textarea
                    value={modalNote}
                    onChange={(e) => setModalNote(e.target.value)}
                    placeholder="اكتب ملاحظة مخصصة هنا..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-white">
                <button
                  onClick={handleSaveToRecord}
                  disabled={isSaving}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-70 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={18} />
                      <span>إضافة للسجل الشامل</span>
                    </>
                  )}
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
