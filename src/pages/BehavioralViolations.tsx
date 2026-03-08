import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Info, 
  ChevronLeft,
  ChevronRight,
  Filter,
  UserPlus,
  BookOpen,
  User,
  CheckCircle2,
  AlertCircle,
  Send,
  FileText,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../App';

interface Violation {
  id: number;
  violation_name: string;
  degree: number;
  deduction_points: number;
  category: string;
  procedures: {
    steps: string[];
    general: string[];
  };
}

interface Student {
  id: number;
  name: string;
  grade: string;
  section: string;
  behavior_score: number;
}

const BehavioralViolations: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'record' | 'dictionary'>('record');
  const [violations, setViolations] = useState<Violation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dictionary State
  const [search, setSearch] = useState('');
  const [selectedDegree, setSelectedDegree] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);

  // Record Form State
  const [step, setStep] = useState(1);
  const [studentSelectionMode, setStudentSelectionMode] = useState<'search' | 'hierarchy'>('search');
  const [violationSelectionMode, setViolationSelectionMode] = useState<'search' | 'hierarchy'>('search');
  
  const [studentSearch, setStudentSearch] = useState('');
  const [hierGrade, setHierGrade] = useState('');
  const [hierSection, setHierSection] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [formCategory, setFormCategory] = useState<string>('all');
  const [formViolationSearch, setFormViolationSearch] = useState('');
  const [hierDegree, setHierDegree] = useState<number | ''>('');
  const [selectedFormViolation, setSelectedFormViolation] = useState<Violation | null>(null);
  
  const [appliedProcedures, setAppliedProcedures] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [occurrenceCount, setOccurrenceCount] = useState(0);
  const [fetchingOccurrence, setFetchingOccurrence] = useState(false);

  useEffect(() => {
    const fetchOccurrence = async () => {
      if (selectedStudent && selectedFormViolation) {
        setFetchingOccurrence(true);
        try {
          const res = await fetch(`/api/students/${selectedStudent.id}/violations/${selectedFormViolation.id}/occurrence`);
          if (res.ok) {
            const data = await res.json();
            const count = data.count;
            setOccurrenceCount(count);
            
            // Auto-select the corresponding step
            // Step 1 for 1st time, Step 2 for 2nd time, etc.
            const steps = selectedFormViolation.procedures.steps;
            if (steps && steps.length > 0) {
              // If count is 0, it's the 1st time, so step index 0
              // If count is 1, it's the 2nd time, so step index 1
              const stepIndex = Math.min(count, steps.length - 1);
              const recommendedStep = steps[stepIndex];
              
              // Only auto-select if not already selected or if list is empty
              setAppliedProcedures(prev => {
                if (prev.length === 0) return [recommendedStep];
                return prev;
              });
            }
          }
        } catch (err) {
          console.error('Failed to fetch occurrence', err);
        } finally {
          setFetchingOccurrence(false);
        }
      }
    };
    fetchOccurrence();
  }, [selectedStudent, selectedFormViolation]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [violRes, studRes] = await Promise.all([
          fetch('/api/violations'),
          fetch('/api/students')
        ]);
        
        if (violRes.ok) setViolations(await violRes.json());
        if (studRes.ok) setStudents(await studRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredViolations = violations.filter(v => {
    const matchesSearch = v.violation_name.includes(search);
    const matchesDegree = selectedDegree === 'all' || v.degree === selectedDegree;
    const matchesCategory = selectedCategory === 'all' || v.category === selectedCategory;
    return matchesSearch && matchesDegree && matchesCategory;
  });

  const filteredStudents = students.filter(s => 
    s.name.includes(studentSearch) || s.id.toString().includes(studentSearch)
  ).slice(0, 5);

  const filteredFormViolations = violations.filter(v => {
    const matchesSearch = v.violation_name.includes(formViolationSearch) || v.degree.toString() === formViolationSearch;
    const matchesCategory = formCategory === 'all' || v.category === formCategory;
    return matchesSearch && matchesCategory;
  }).slice(0, 5);

  const handleRecordViolation = async () => {
    if (!selectedStudent || !selectedFormViolation || appliedProcedures.length === 0) return;
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          teacher_id: user?.id,
          type: 'behavior',
          severity: selectedFormViolation.degree >= 4 ? 'high' : selectedFormViolation.degree >= 2 ? 'medium' : 'low',
          reason: selectedFormViolation.violation_name,
          teacher_notes: notes,
          violation_id: selectedFormViolation.id,
          applied_remedial_actions: appliedProcedures,
          status: appliedProcedures.some(p => p.includes('الموجه') || p.includes('لجنة التوجيه')) ? 'pending_counselor' : 'resolved'
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setStep(1);
          setSelectedStudent(null);
          setSelectedFormViolation(null);
          setAppliedProcedures([]);
          setNotes('');
          setStudentSearch('');
          setFormViolationSearch('');
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = Array.from(new Set(violations.map(v => v.category)));
  const grades = Array.from(new Set(students.map(s => s.grade)));
  const sections = hierGrade ? Array.from(new Set(students.filter(s => s.grade === hierGrade).map(s => s.section))) : [];
  const hierStudents = students.filter(s => s.grade === hierGrade && s.section === hierSection);
  
  const degrees = formCategory !== 'all' ? Array.from(new Set(violations.filter(v => v.category === formCategory).map(v => v.degree))).sort() : [];
  const hierViolations = violations.filter(v => v.category === formCategory && v.degree === hierDegree);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-400 font-extrabold uppercase tracking-widest text-xs">جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">بوابة معالجة المشكلات السلوكية</h1>
          <p className="text-slate-500 mt-1 font-bold">المرشد الذكي للوكيل - توثيق ومعالجة المخالفات السلوكية</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('record')}
          className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-3xl text-sm font-black transition-all ${
            activeTab === 'record' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-50'
          }`}
        >
          <UserPlus size={18} />
          <span>تسجيل ومعالجة</span>
        </button>
        <button
          onClick={() => setActiveTab('dictionary')}
          className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-3xl text-sm font-black transition-all ${
            activeTab === 'dictionary' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-50'
          }`}
        >
          <BookOpen size={18} />
          <span>قاموس المخالفات</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'record' ? (
          <motion.div
            key="record"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Wizard Steps Indicator */}
            <div className="flex items-center justify-center gap-4 mb-8">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all ${
                    step === s ? 'bg-primary text-white shadow-lg shadow-primary/20' : 
                    step > s ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {step > s ? <CheckCircle2 size={20} /> : s}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${step === s ? 'text-primary' : 'text-slate-400'}`}>
                    {s === 1 ? 'اختيار الطالب والمشكلة' : 'تطبيق الإجراءات'}
                  </span>
                  {s === 1 && <div className="w-12 h-px bg-slate-100 mx-2" />}
                </div>
              ))}
            </div>

            {step === 1 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 sts-card p-10 space-y-10">
                  <div className="flex items-center gap-4 text-primary font-extrabold border-b border-slate-50 pb-6">
                    <Search size={22} />
                    <span className="text-lg uppercase tracking-widest">البحث والاختيار</span>
                  </div>

                  <div className="space-y-8">
                    {/* Student Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-slate-500 mr-2 uppercase tracking-widest">اختيار الطالب</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                          <button 
                            onClick={() => setStudentSelectionMode('search')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${studentSelectionMode === 'search' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                          >بحث مباشر</button>
                          <button 
                            onClick={() => setStudentSelectionMode('hierarchy')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${studentSelectionMode === 'hierarchy' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                          >قائمة هرمية</button>
                        </div>
                      </div>

                      {studentSelectionMode === 'search' ? (
                        <div className="relative">
                          <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text"
                            placeholder="ابدأ بكتابة اسم الطالب..."
                            value={studentSearch}
                            onChange={(e) => {
                              setStudentSearch(e.target.value);
                              if (selectedStudent) setSelectedStudent(null);
                            }}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pr-12 pl-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                          />
                          {studentSearch && !selectedStudent && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                              {filteredStudents.map(s => (
                                <button
                                  key={s.id}
                                  onClick={() => {
                                    setSelectedStudent(s);
                                    setStudentSearch(s.name);
                                  }}
                                  className="w-full p-5 text-right hover:bg-primary/5 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black text-sm">
                                      {s.name.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-slate-800">{s.name}</p>
                                      <p className="text-[10px] text-slate-400 font-bold">{s.grade} - {s.section}</p>
                                    </div>
                                  </div>
                                  <ChevronRight size={18} className="text-slate-300" />
                                </button>
                              ))}
                              {filteredStudents.length === 0 && (
                                <div className="p-8 text-center text-slate-400 font-bold text-xs">لا توجد نتائج مطابقة</div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <select 
                            value={hierGrade}
                            onChange={(e) => { setHierGrade(e.target.value); setHierSection(''); setSelectedStudent(null); }}
                            className="bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                          >
                            <option value="">اختر الصف</option>
                            {grades.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                          <select 
                            value={hierSection}
                            disabled={!hierGrade}
                            onChange={(e) => { setHierSection(e.target.value); setSelectedStudent(null); }}
                            className="bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                          >
                            <option value="">اختر الفصل</option>
                            {sections.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <select 
                            value={selectedStudent?.id || ''}
                            disabled={!hierSection}
                            onChange={(e) => {
                              const s = students.find(st => st.id === parseInt(e.target.value));
                              setSelectedStudent(s || null);
                            }}
                            className="bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                          >
                            <option value="">اختر الطالب</option>
                            {hierStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-slate-500 mr-2 uppercase tracking-widest">اختيار المشكلة السلوكية</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                          <button 
                            onClick={() => setViolationSelectionMode('search')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${violationSelectionMode === 'search' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                          >بحث مباشر</button>
                          <button 
                            onClick={() => setViolationSelectionMode('hierarchy')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${violationSelectionMode === 'hierarchy' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                          >قائمة هرمية</button>
                        </div>
                      </div>

                      {violationSelectionMode === 'search' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Category Filter */}
                          <div className="space-y-3">
                            <label className="text-[10px] font-extrabold text-slate-400 mr-2 uppercase tracking-widest">تصنيف المشكلة</label>
                            <select
                              value={formCategory}
                              onChange={(e) => setFormCategory(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                            >
                              <option value="all">جميع التصنيفات</option>
                              {categories.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>

                          {/* Violation Select2-like */}
                          <div className="space-y-3">
                            <label className="text-[10px] font-extrabold text-slate-400 mr-2 uppercase tracking-widest">المشكلة السلوكية (Select2)</label>
                            <div className="relative">
                              <ShieldAlert className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input 
                                type="text"
                                placeholder="اختر المشكلة..."
                                value={formViolationSearch}
                                onChange={(e) => {
                                  setFormViolationSearch(e.target.value);
                                  if (selectedFormViolation) setSelectedFormViolation(null);
                                }}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pr-12 pl-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                              />
                              {formViolationSearch && !selectedFormViolation && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                  {filteredFormViolations.map(v => (
                                    <button
                                      key={v.id}
                                      onClick={() => {
                                        setSelectedFormViolation(v);
                                        setFormViolationSearch(v.violation_name);
                                      }}
                                      className="w-full p-5 text-right hover:bg-primary/5 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
                                    >
                                      <div className="flex-1">
                                        <p className="text-sm font-black text-slate-800 leading-tight">{v.violation_name}</p>
                                        <p className="text-[10px] text-rose-500 font-bold mt-1">الدرجة {v.degree} | حسم {v.deduction_points} نقاط</p>
                                      </div>
                                      <ChevronRight size={18} className="text-slate-300" />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <select 
                            value={formCategory}
                            onChange={(e) => { setFormCategory(e.target.value); setHierDegree(''); setSelectedFormViolation(null); }}
                            className="bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                          >
                            <option value="all">اختر التصنيف</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <select 
                            value={hierDegree}
                            disabled={formCategory === 'all'}
                            onChange={(e) => { setHierDegree(e.target.value ? parseInt(e.target.value) : ''); setSelectedFormViolation(null); }}
                            className="bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                          >
                            <option value="">اختر الدرجة</option>
                            {degrees.map(d => <option key={d} value={d}>الدرجة {d}</option>)}
                          </select>
                          <select 
                            value={selectedFormViolation?.id || ''}
                            disabled={!hierDegree}
                            onChange={(e) => {
                              const v = violations.find(vi => vi.id === parseInt(e.target.value));
                              setSelectedFormViolation(v || null);
                            }}
                            className="bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                          >
                            <option value="">اختر المشكلة</option>
                            {hierViolations.map(v => <option key={v.id} value={v.id}>{v.violation_name}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      onClick={() => setStep(2)}
                      disabled={!selectedStudent || !selectedFormViolation}
                      className={`px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${
                        !selectedStudent || !selectedFormViolation 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-primary text-white hover:bg-primary-dark shadow-xl shadow-primary/20'
                      }`}
                    >
                      <span>التالي: تطبيق الإجراءات</span>
                      <ChevronLeft size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="sts-card p-8 space-y-6">
                    <div className="flex items-center gap-3 text-primary font-black text-sm border-b border-slate-50 pb-4">
                      <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center">
                        <Info size={18} />
                      </div>
                      <span>ملخص الاختيار</span>
                    </div>
                    {selectedStudent ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black">
                            {selectedStudent.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{selectedStudent.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{selectedStudent.grade} - {selectedStudent.section}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 text-center py-4">بانتظار اختيار الطالب...</p>
                    )}
                    {selectedFormViolation ? (
                      <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-2">
                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">المشكلة المختارة</p>
                        <p className="text-xs font-black text-rose-900 leading-relaxed">{selectedFormViolation.violation_name}</p>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-400 text-center py-4">بانتظار اختيار المشكلة...</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                {/* Top Alert Bar */}
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                  <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                      <ShieldAlert size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">{selectedFormViolation?.violation_name}</h3>
                      <p className="text-slate-400 font-bold text-sm mt-1">
                        الطالب: {selectedStudent?.name} | 
                        <span className="text-primary mr-2">
                          {fetchingOccurrence ? 'جاري فحص السجل...' : `التكرار رقم: ${occurrenceCount + 1}`}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">درجة المخالفة</p>
                      <p className="text-2xl font-black text-primary">{selectedFormViolation?.degree}</p>
                    </div>
                    <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">مقدار الحسم</p>
                      <p className="text-2xl font-black text-rose-500">{selectedFormViolation?.deduction_points} درجات</p>
                    </div>
                  </div>
                </div>

                {/* Two Column Procedures */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Column 1: Administrative */}
                  <div className="sts-card p-8 space-y-6">
                    <div className="flex items-center gap-4 text-primary font-extrabold border-b border-slate-50 pb-6">
                      <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
                        <ShieldAlert size={22} />
                      </div>
                      <span className="text-lg uppercase tracking-widest">الإجراءات النظامية والإدارية</span>
                    </div>
                    <div className="space-y-4">
                      {selectedFormViolation?.procedures.steps.map((proc, i) => {
                        const isRecommended = i === Math.min(occurrenceCount, (selectedFormViolation?.procedures.steps.length || 1) - 1);
                        return (
                          <label key={i} className={`flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${appliedProcedures.includes(proc) ? 'bg-primary/5 border-primary/20 shadow-inner' : 'bg-slate-50/50 border-slate-100 hover:border-primary/20'}`}>
                            {isRecommended && (
                              <div className="absolute top-0 left-0 bg-primary text-white text-[8px] font-black px-3 py-1 rounded-br-xl uppercase tracking-widest">
                                الإجراء الموصى به آلياً
                              </div>
                            )}
                            <div className="pt-1">
                              <input 
                                type="checkbox"
                                checked={appliedProcedures.includes(proc)}
                                onChange={() => {
                                  const current = [...appliedProcedures];
                                  const idx = current.indexOf(proc);
                                  if (idx > -1) current.splice(idx, 1);
                                  else current.push(proc);
                                  setAppliedProcedures(current);
                                }}
                                className="w-6 h-6 rounded-lg text-primary focus:ring-primary border-slate-300 transition-all"
                              />
                            </div>
                            <div className="flex-1">
                              <span className={`text-sm leading-relaxed font-bold ${appliedProcedures.includes(proc) ? 'text-primary' : 'text-slate-600'}`}>
                                {proc}
                              </span>
                              {isRecommended && (
                                <p className="text-[10px] text-primary font-black mt-1">هذا الإجراء يتناسب مع التكرار رقم {occurrenceCount + 1} لهذه المخالفة.</p>
                              )}

                              {/* Dynamic Action Box (Keyword Engine) - Professional UI */}
                              <AnimatePresence>
                                {appliedProcedures.includes(proc) && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-6 p-6 bg-slate-50/80 rounded-[2rem] border-2 border-white shadow-xl space-y-5 relative" onClick={(e) => e.stopPropagation()}>
                                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                                      
                                      {(proc.includes('تعهد خطي') || proc.includes('تعهد')) && (
                                        <div className="flex flex-col gap-3">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                            <FileText size={12} className="text-primary" />
                                            <span>توثيق التعهد السلوكي</span>
                                          </p>
                                          <button className="w-full py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-black flex items-center justify-center gap-3 border border-slate-200 transition-all shadow-sm group">
                                            <span className="text-lg group-hover:scale-110 transition-transform">🖨️</span>
                                            <span>معاينة وطباعة التعهد السلوكي (1447هـ)</span>
                                          </button>
                                        </div>
                                      )}

                                      {(proc.includes('الموجه الطلابي') || proc.includes('لجنة التوجيه') || proc.includes('الموجه')) && (
                                        <div className="space-y-4">
                                          <div className="flex items-center justify-between px-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                              <Users size={14} className="text-primary" />
                                              <span>ملاحظات الوكيل للموجه الطلابي</span>
                                            </label>
                                            <span className="bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded-full">إجراء إلزامي</span>
                                          </div>
                                          <textarea 
                                            className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm min-h-[100px]"
                                            placeholder="اكتب مرئياتك أو أسباب التحويل للموجه هنا بالتفصيل..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                          />
                                          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0">
                                              <Send size={20} />
                                            </div>
                                            <div className="flex-1">
                                              <p className="text-[10px] font-black text-primary">سيتم تحويل الحالة آلياً للموجه</p>
                                              <p className="text-[9px] text-slate-500 font-bold">عند حفظ المخالفة، ستنتقل لملف الموجه لاستكمال دراسة الحالة.</p>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {(proc.includes('ولي أمر') || proc.includes('ولي الأمر')) && (
                                        <div className="space-y-4">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                            <Users size={12} className="text-primary" />
                                            <span>التواصل مع ولي الأمر</span>
                                          </p>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <button className="py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-black flex items-center justify-center gap-3 border border-slate-200 transition-all shadow-sm group">
                                              <span className="text-lg group-hover:scale-110 transition-transform">🖨️</span>
                                              <span>طباعة إشعار استدعاء</span>
                                            </button>
                                            <button className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-600/20 group">
                                              <span className="text-lg group-hover:scale-110 transition-transform">📱</span>
                                              <span>إرسال رسالة SMS فورية</span>
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      {(proc.includes('إدارة التعليم') || proc.includes('مدير التعليم') || proc.includes('نقل')) && (
                                        <div className="p-6 bg-rose-600 rounded-[1.5rem] text-white space-y-4 shadow-xl shadow-rose-600/30">
                                          <div className="flex items-center gap-3 font-black text-xs uppercase tracking-widest">
                                            <AlertCircle size={20} className="animate-pulse" />
                                            <span>إجراء جسيم يتطلب الرفع الرسمي</span>
                                          </div>
                                          <p className="text-[10px] font-bold text-rose-100 leading-relaxed">
                                            هذا الإجراء يتطلب محضر اجتماع رسمي من لجنة التوجيه والطلاب موقع من مدير المدرسة للرفع لإدارة التعليم.
                                          </p>
                                          <button className="w-full py-4 bg-white text-rose-600 hover:bg-rose-50 rounded-2xl text-xs font-black flex items-center justify-center gap-3 transition-all shadow-lg">
                                            <span>📄</span>
                                            <span>تجهيز محضر الرفع الرسمي</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 2: Educational */}
                  <div className="sts-card p-8 space-y-6">
                    <div className="flex items-center gap-4 text-amber-600 font-extrabold border-b border-slate-50 pb-6">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                        <Info size={22} />
                      </div>
                      <span className="text-lg uppercase tracking-widest">المرشد التربوي والعلاجي</span>
                    </div>
                    <div className="space-y-4">
                      {selectedFormViolation?.procedures.general.map((proc, i) => (
                        <label key={i} className={`flex items-start gap-4 p-6 rounded-[2.5rem] border transition-all cursor-pointer relative overflow-hidden ${appliedProcedures.includes(proc) ? 'bg-amber-50 border-amber-200 shadow-inner' : 'bg-slate-50/50 border-slate-100 hover:border-amber-200'}`}>
                          <div className="pt-1">
                            <input 
                              type="checkbox"
                              checked={appliedProcedures.includes(proc)}
                              onChange={() => {
                                const current = [...appliedProcedures];
                                const idx = current.indexOf(proc);
                                if (idx > -1) current.splice(idx, 1);
                                else current.push(proc);
                                setAppliedProcedures(current);
                              }}
                              className="w-6 h-6 rounded-lg text-amber-600 focus:ring-amber-500 border-slate-300 transition-all"
                            />
                          </div>
                          <div className="flex-1">
                            <span className={`text-sm leading-relaxed font-bold ${appliedProcedures.includes(proc) ? 'text-amber-900' : 'text-slate-600'}`}>
                              {proc}
                            </span>
                            
                            {/* Dynamic Action Box (Keyword Engine) */}
                            <AnimatePresence mode="wait">
                              {appliedProcedures.includes(proc) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-6 p-6 bg-white rounded-[2rem] border border-slate-100 shadow-xl space-y-5 relative" onClick={(e) => e.stopPropagation()}>
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                                    
                                    {(proc.includes('تعهد خطي') || proc.includes('تعهد')) && (
                                      <div className="flex flex-col gap-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                          <FileText size={12} className="text-amber-600" />
                                          <span>توثيق التعهد السلوكي</span>
                                        </p>
                                        <button className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-black flex items-center justify-center gap-3 border border-slate-200 transition-all shadow-sm group">
                                          <span className="text-lg group-hover:scale-110 transition-transform">🖨️</span>
                                          <span>معاينة وطباعة التعهد السلوكي</span>
                                        </button>
                                      </div>
                                    )}
                                    
                                    {(proc.includes('الموجه الطلابي') || proc.includes('لجنة التوجيه') || proc.includes('الموجه')) && (
                                      <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Users size={14} className="text-amber-600" />
                                            <span>ملاحظات الوكيل للموجه الطلابي</span>
                                          </label>
                                        </div>
                                        <textarea 
                                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-bold focus:ring-4 focus:ring-amber-500/10 outline-none transition-all shadow-sm min-h-[100px]"
                                          placeholder="اكتب مرئياتك أو أسباب التحويل للموجه هنا بالتفصيل..."
                                          value={notes}
                                          onChange={(e) => setNotes(e.target.value)}
                                        />
                                        <button className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-3 transition-all shadow-lg shadow-amber-600/20 group">
                                          <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                                          <span>اعتماد وتحويل لملف الموجه</span>
                                        </button>
                                      </div>
                                    )}
                                    
                                    {(proc.includes('ولي أمر') || proc.includes('ولي الأمر')) && (
                                      <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                          <Users size={12} className="text-amber-600" />
                                          <span>التواصل مع ولي الأمر</span>
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <button className="py-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-black flex items-center justify-center gap-3 border border-slate-200 transition-all shadow-sm group">
                                            <span className="text-lg group-hover:scale-110 transition-transform">🖨️</span>
                                            <span>طباعة إشعار استدعاء</span>
                                          </button>
                                          <button className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-600/20 group">
                                            <span className="text-lg group-hover:scale-110 transition-transform">📱</span>
                                            <span>إرسال رسالة SMS فورية</span>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="sts-card p-8 space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-extrabold text-slate-500 mr-2 uppercase tracking-widest">ملاحظات الوكيل النهائية</label>
                    <textarea 
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="اكتب أي تفاصيل إضافية عن معالجة الحالة..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold resize-none"
                    />
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 pt-6">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-5 bg-slate-100 text-slate-600 font-black rounded-[2rem] hover:bg-slate-200 transition-all text-sm uppercase tracking-widest"
                    >
                      رجوع لتعديل البيانات
                    </button>
                    
                    {/* Smart Validation Button */}
                    <button
                      onClick={handleRecordViolation}
                      disabled={submitting || appliedProcedures.length === 0}
                      className={`flex-[2] py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl ${
                        submitting || appliedProcedures.length === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                          : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                          <span>جاري التوثيق...</span>
                        </>
                      ) : success ? (
                        <>
                          <CheckCircle2 size={20} />
                          <span>تم الاعتماد والتوثيق بنجاح</span>
                        </>
                      ) : (
                        <>
                          <Send size={20} />
                          <span>اعتماد وتوثيق الحالة</span>
                        </>
                      )}
                    </button>
                  </div>
                  {appliedProcedures.length === 0 && (
                    <p className="text-center text-rose-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                      يرجى اختيار إجراء واحد على الأقل لتفعيل زر الاعتماد
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="dictionary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-8"
          >
            {/* Filters Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="sts-card p-6 space-y-6">
                <div className="flex items-center gap-3 text-primary font-black text-sm border-b border-slate-50 pb-4">
                  <Filter size={18} />
                  <span>تصفية النتائج</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mr-2">البحث النصي</label>
                    <div className="relative">
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text"
                        placeholder="ابحث عن مخالفة..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pr-11 pl-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mr-2">درجة المخالفة</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['all', 1, 2, 3, 4, 5].map(d => (
                        <button
                          key={d}
                          onClick={() => setSelectedDegree(d as any)}
                          className={`py-2 rounded-lg text-xs font-black transition-all border ${
                            selectedDegree === d 
                              ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                              : 'bg-white text-slate-500 border-slate-100 hover:border-primary/30'
                          }`}
                        >
                          {d === 'all' ? 'الكل' : `د ${d}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mr-2">التصنيف</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                    >
                      <option value="all">جميع التصنيفات</option>
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2rem] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-[4rem] -mr-6 -mt-6" />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <Info className="text-primary" size={20} />
                    <h3 className="font-black text-sm">إحصائيات سريعة</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400">إجمالي المخالفات</span>
                      <span className="text-lg font-black">{violations.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400">النتائج الحالية</span>
                      <span className="text-lg font-black text-primary">{filteredViolations.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {selectedViolation ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="sts-card overflow-hidden"
                >
                  <div className="bg-primary p-8 text-white relative">
                    <button 
                      onClick={() => setSelectedViolation(null)}
                      className="absolute left-8 top-8 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="bg-white/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">الدرجة {selectedViolation.degree}</span>
                      <span className="bg-white/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedViolation.category}</span>
                    </div>
                    <h2 className="text-2xl font-black leading-tight max-w-2xl">{selectedViolation.violation_name}</h2>
                    <p className="mt-4 text-primary-light font-bold">مقدار الحسم: {selectedViolation.deduction_points} نقاط من السلوك</p>
                  </div>

                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 text-primary font-black text-sm border-b border-slate-50 pb-4">
                        <ShieldAlert size={18} />
                        <span>الإجراءات النظامية المتدرجة</span>
                      </div>
                      <div className="space-y-4">
                        {selectedViolation.procedures.steps.map((step, i) => (
                          <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-black text-xs shrink-0">
                              {i + 1}
                            </div>
                            <p className="text-xs leading-relaxed font-bold text-slate-700">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-3 text-amber-600 font-black text-sm border-b border-slate-50 pb-4">
                        <Info size={18} />
                        <span>إجراءات عامة ووقائية</span>
                      </div>
                      <div className="space-y-4">
                        {selectedViolation.procedures.general.map((step, i) => (
                          <div key={i} className="flex gap-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                            <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                            <p className="text-xs leading-relaxed font-bold text-amber-900">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredViolations.map((v) => (
                    <motion.button
                      layout
                      key={v.id}
                      onClick={() => setSelectedViolation(v)}
                      className="sts-card p-6 text-right hover:border-primary/30 transition-all group relative overflow-hidden"
                    >
                      <div className={`absolute top-0 right-0 w-1 h-full transition-all ${
                        v.degree === 1 ? 'bg-emerald-400' :
                        v.degree === 2 ? 'bg-blue-400' :
                        v.degree === 3 ? 'bg-amber-400' :
                        v.degree === 4 ? 'bg-orange-400' : 'bg-rose-500'
                      }`} />
                      
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                          v.degree === 1 ? 'bg-emerald-50 text-emerald-600' :
                          v.degree === 2 ? 'bg-blue-50 text-blue-600' :
                          v.degree === 3 ? 'bg-amber-50 text-amber-600' :
                          v.degree === 4 ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          الدرجة {v.degree}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">{v.category}</span>
                      </div>
                      
                      <h3 className="font-black text-slate-800 text-sm leading-relaxed mb-4 group-hover:text-primary transition-colors">
                        {v.violation_name}
                      </h3>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <span className="text-[10px] font-bold text-rose-500">-{v.deduction_points} نقطة</span>
                        <div className="flex items-center gap-1 text-primary text-[10px] font-black group-hover:translate-x-[-4px] transition-transform">
                          <span>عرض التفاصيل</span>
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {filteredViolations.length === 0 && (
                <div className="sts-card p-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                    <Search size={40} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">لا توجد نتائج مطابقة</h3>
                  <p className="text-slate-500 font-bold">يرجى محاولة تغيير معايير البحث أو التصفية.</p>
                  <button 
                    onClick={() => { setSearch(''); setSelectedDegree('all'); setSelectedCategory('all'); }}
                    className="text-primary font-black text-sm underline underline-offset-4"
                  >
                    إعادة ضبط المرشحات
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BehavioralViolations;
