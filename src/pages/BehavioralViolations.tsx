import { apiFetch } from '../utils/api';
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
  Users,
  X
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
  const [showCounselorModal, setShowCounselorModal] = useState(false);

  const recommendedStep = selectedFormViolation?.procedures.steps[Math.min(occurrenceCount, (selectedFormViolation?.procedures.steps.length || 1) - 1)] || '';
  
  // Specific cases for General Procedures
  const vName = selectedFormViolation?.violation_name || '';
  const vDegree = selectedFormViolation?.degree || 0;
  
  const needs1919 = vDegree >= 4 && (vName.includes('تحرش') || vName.includes('ابتزاز') || vName.includes('إيذاء') || vName.includes('تنمر'));
  const needsSecurity = vDegree >= 5 && (vName.includes('أسلحة') || vName.includes('مخدرات') || vName.includes('اعتداء') || vName.includes('جرائم معلوماتية') || vName.includes('تزوير') || vName.includes('نار'));
  const needsAmbulance = vDegree >= 4 && (vName.includes('اعتداء') || vName.includes('مشاجرة') || vName.includes('إصابة') || vName.includes('أسلحة') || vName.includes('نار'));

  const activeProcedures = selectedFormViolation ? [
    recommendedStep,
    ...(selectedFormViolation.procedures.general || []).filter(proc => {
      if (proc.includes('1919') || proc.includes('مركز البلاغات')) return needs1919;
      if (proc.includes('الجهات الأمنية')) return needsSecurity;
      if (proc.includes('الهلال الأحمر') || proc.includes('مركز صحي')) return needsAmbulance;
      return true; // Keep any other general procedures if they exist
    })
  ] : [];

  const activeProceduresText = activeProcedures.join(' ');
  const needsPledge = activeProceduresText.includes('تعهد خطي') || activeProceduresText.includes('تعهد');
  const needsParent = activeProceduresText.includes('ولي أمر') || activeProceduresText.includes('ولي الأمر');
  const needsCounselor = activeProceduresText.includes('الموجه الطلابي') || activeProceduresText.includes('لجنة التوجيه') || activeProceduresText.includes('الموجه');
  const needsCommittee = activeProceduresText.includes('انعقاد لجنة التوجيه');
  const needsOfficial = activeProceduresText.includes('إدارة التعليم') || activeProceduresText.includes('مدير التعليم') || activeProceduresText.includes('نقل');

  useEffect(() => {
    setAppliedProcedures([]);
    const fetchOccurrence = async () => {
      if (selectedStudent && selectedFormViolation) {
        setFetchingOccurrence(true);
        try {
          const res = await apiFetch(`/api/students/${selectedStudent.id}/violations/${selectedFormViolation.id}/occurrence`);
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
          apiFetch('/api/violations'),
          apiFetch('/api/students')
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
    if (!selectedStudent || !selectedFormViolation) return;
    
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/referrals', {
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
          applied_remedial_actions: activeProcedures,
          status: activeProcedures.some(p => p.includes('الموجه') || p.includes('لجنة التوجيه')) ? 'pending_counselor' : 'resolved'
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setStep(1);
          setSelectedStudent(null);
          setSelectedFormViolation(null);
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
                className="space-y-6 pb-24"
              >
                {/* Status Header */}
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-black text-xl">
                      {selectedStudent?.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">
                        الطالب: {selectedStudent?.name} 
                        <span className="text-slate-400 text-sm font-bold mr-2">| الصف: {selectedStudent?.grade} - {selectedStudent?.section}</span>
                      </h3>
                      <p className="text-sm font-bold text-slate-600 mt-1">
                        المخالفة: {selectedFormViolation?.violation_name} 
                        <span className="text-slate-400 text-xs font-bold mr-2">| الدرجة: {selectedFormViolation?.degree}</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-100 px-6 py-3 rounded-2xl text-center min-w-[200px]">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">الإجراء الآلي للنظام</p>
                    <p className="text-sm font-black text-red-800">سيتم حسم {selectedFormViolation?.deduction_points} درجات من المواظبة</p>
                  </div>
                </div>

                {/* Two-Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  
                  {/* Right Column: Procedures (Read-only) */}
                  <div className="p-8 border-l border-slate-200 bg-slate-50/50">
                    <h4 className="text-base font-black text-slate-800 mb-6 flex items-center gap-2">
                      <ShieldAlert size={20} className="text-slate-400" />
                      الإجراءات النظامية المطلوبة
                    </h4>
                    <ul className="space-y-4 text-sm font-bold text-slate-700 list-disc list-inside">
                      {selectedFormViolation?.procedures.steps.map((proc, i) => {
                        const isRecommended = i === Math.min(occurrenceCount, (selectedFormViolation?.procedures.steps.length || 1) - 1);
                        return (
                          <li key={i} className={`p-4 rounded-2xl border ${isRecommended ? 'bg-white border-primary/20 text-primary shadow-sm' : 'bg-transparent border-transparent text-slate-500'}`}>
                            <span className="leading-relaxed">{proc}</span>
                            {isRecommended && (
                              <span className="block text-[10px] text-primary/70 mt-2 font-black uppercase tracking-widest">
                                الإجراء الموصى به للتكرار الحالي ({occurrenceCount + 1})
                              </span>
                            )}
                          </li>
                        );
                      })}
                      {selectedFormViolation?.procedures.general.map((proc, i) => (
                        <li key={`gen-${i}`} className="p-4 rounded-2xl border bg-transparent border-transparent text-slate-600">
                          <span className="leading-relaxed">{proc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Left Column: Action Buttons */}
                  <div className="p-8 bg-white">
                    <h4 className="text-base font-black text-slate-800 mb-6 flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-slate-400" />
                      أدوات التنفيذ والطباعة
                    </h4>
                    <div className="space-y-4">
                      {needsPledge && (
                        <button className="w-full py-5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-sm font-black flex items-center justify-center gap-3 border border-slate-200 transition-all shadow-sm">
                          <span className="text-xl">🖨️</span>
                          <span>طباعة التعهد السلوكي</span>
                        </button>
                      )}
                      
                      {needsParent && (
                        <button className="w-full py-5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-sm font-black flex items-center justify-center gap-3 border border-slate-200 transition-all shadow-sm">
                          <span className="text-xl">🖨️</span>
                          <span>طباعة إشعار ولي الأمر</span>
                        </button>
                      )}

                      {needsCounselor && (
                        <button 
                          onClick={() => setShowCounselorModal(true)}
                          className="w-full py-5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl text-sm font-black flex items-center justify-center gap-3 border border-blue-200 transition-all shadow-sm"
                        >
                          <span className="text-xl">📩</span>
                          <span>تحويل الحالة للموجه الطلابي</span>
                        </button>
                      )}

                      {needs1919 && (
                        <button className="w-full py-5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-sm font-black flex items-center justify-center gap-3 border border-rose-200 transition-all shadow-sm">
                          <span className="text-xl">🚨</span>
                          <span>نموذج إبلاغ 1919</span>
                        </button>
                      )}

                      {needsSecurity && (
                        <button className="w-full py-5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-3 border border-slate-700 transition-all shadow-sm">
                          <span className="text-xl">🚓</span>
                          <span>نموذج إبلاغ الجهات الأمنية</span>
                        </button>
                      )}

                      {needsAmbulance && (
                        <button className="w-full py-5 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl text-sm font-black flex items-center justify-center gap-3 border border-red-200 transition-all shadow-sm">
                          <span className="text-xl">🚑</span>
                          <span>استدعاء الهلال الأحمر (997)</span>
                        </button>
                      )}

                      {needsCommittee && (
                        <button className="w-full py-5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-2xl text-sm font-black flex items-center justify-center gap-3 border border-amber-200 transition-all shadow-sm">
                          <span className="text-xl">👥</span>
                          <span>محضر اجتماع لجنة التوجيه</span>
                        </button>
                      )}

                      {needsOfficial && (
                        <button className="w-full py-5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-2xl text-sm font-black flex items-center justify-center gap-3 border border-purple-200 transition-all shadow-sm">
                          <span className="text-xl">📄</span>
                          <span>محضر الرفع الرسمي لإدارة التعليم</span>
                        </button>
                      )}

                      {!needsPledge && !needsParent && !needsCounselor && !needs1919 && !needsSecurity && !needsAmbulance && !needsCommittee && !needsOfficial && (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500 text-sm font-bold">لا توجد أدوات تنفيذ إضافية مطلوبة لهذه المخالفة.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 flex justify-center">
                  <div className="w-full max-w-6xl flex gap-4 px-4">
                    <button
                      onClick={() => setStep(1)}
                      className="px-8 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all text-sm flex items-center gap-2"
                    >
                      <span>🔙</span>
                      <span>تراجع</span>
                    </button>
                    <button
                      onClick={handleRecordViolation}
                      disabled={submitting}
                      className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-sm ${
                        submitting
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20 shadow-lg'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>جاري التوثيق...</span>
                        </>
                      ) : success ? (
                        <>
                          <CheckCircle2 size={20} />
                          <span>تم الاعتماد والتوثيق بنجاح</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg">✅</span>
                          <span>اعتماد الإجراءات وإغلاق السجل</span>
                        </>
                      )}
                    </button>
                  </div>
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

      {/* Counselor Modal */}
      <AnimatePresence>
        {showCounselorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
            >
              <div className="bg-blue-50 p-6 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-blue-800">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">تحويل للموجه الطلابي</h3>
                    <p className="text-xs font-bold text-blue-600/70 mt-0.5">إضافة ملاحظات وتوجيهات للموجه</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCounselorModal(false)}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} className="text-slate-400" />
                    ملاحظات الوكيل (اختياري)
                  </label>
                  <textarea 
                    rows={5}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="اكتب مرئياتك أو أسباب التحويل للموجه هنا بالتفصيل..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-300 outline-none transition-all font-bold resize-none shadow-inner"
                  />
                </div>

                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                  <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-blue-800 leading-relaxed">
                    عند حفظ المخالفة، ستنتقل هذه الحالة تلقائياً إلى صندوق الوارد الخاص بالموجه الطلابي لاستكمال دراسة الحالة والإجراءات التربوية.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setShowCounselorModal(false)}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-black rounded-xl hover:bg-slate-50 transition-all text-sm shadow-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => setShowCounselorModal(false)}
                  className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all text-sm shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  <span>تأكيد التحويل</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BehavioralViolations;
