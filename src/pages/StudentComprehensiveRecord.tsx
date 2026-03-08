import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  User, 
  FileText, 
  Printer, 
  ChevronDown, 
  History, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  School,
  IdCard,
  Layers,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import Select from 'react-select';

interface Student {
  id: number;
  name: string;
  national_id: string;
  grade: string;
  section: string;
  total_referrals?: number;
  closed_referrals?: number;
  active_referrals?: number;
}

interface Referral {
  id: number;
  type: string;
  severity: string;
  reason: string;
  teacher_notes: string;
  remedial_plan: string;
  status: string;
  created_at: string;
  teacher_name: string;
  last_action: string;
  last_actor_name: string;
  violation_id?: number;
  applied_remedial_actions?: string | string[];
}

const StudentComprehensiveRecord: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [quickSearchResults, setQuickSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);

  // Hierarchical Search State
  const [grades, setGrades] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [studentsInHierarchy, setStudentsInHierarchy] = useState<Student[]>([]);
  
  const [selectedGrade, setSelectedGrade] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedStudentInHierarchy, setSelectedStudentInHierarchy] = useState<any>(null);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const res = await fetch('/api/hierarchy/grades');
      const data = await res.json();
      setGrades(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSections = async (grade: string) => {
    try {
      const res = await fetch(`/api/hierarchy/sections?grade=${encodeURIComponent(grade)}`);
      const data = await res.json();
      setSections(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudentsInHierarchy = async (grade: string, section: string) => {
    try {
      const res = await fetch(`/api/hierarchy/students?grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}`);
      const data = await res.json();
      setStudentsInHierarchy(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setQuickSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/student-search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setQuickSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const viewStudentProfile = async (studentId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student-profile/${studentId}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setSelectedStudent(data.student);
      setReferrals(data.referrals);
      // Clear search results to focus on profile
      setQuickSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء جلب بيانات الطالب');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_vp': return <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded-lg text-[10px] font-bold border border-red-100">بانتظار الوكيل</span>;
      case 'pending_counselor': return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold border border-amber-100">بانتظار الموجه</span>;
      case 'resolved': return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-100">تم الحل</span>;
      case 'closed': return <span className="px-2 py-0.5 bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-100">مغلق</span>;
      default: return <span className="px-2 py-0.5 bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-100">{status}</span>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'behavior': return 'سلوكية';
      case 'academic': return 'أكاديمية';
      case 'attendance': return 'غياب وتأخر';
      case 'uniform': return 'زي مدرسي';
      default: return 'أخرى';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <FileText className="text-primary" size={32} />
            <span>السجل الشامل للطالب</span>
          </h1>
          <p className="text-slate-500 font-bold">البحث في ملفات الطلاب وسجلات التحويلات التاريخية</p>
        </div>
      </div>

      {/* Search Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
        {/* Quick Search */}
        <div className="sts-card p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
              <Search size={20} />
            </div>
            <h2 className="text-lg font-black text-slate-800">البحث السريع المباشر</h2>
          </div>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => handleQuickSearch(e.target.value)}
              placeholder="اسم الطالب أو رقم الهوية..." 
              className="sts-input pr-12"
            />
          </div>
          
          <AnimatePresence>
            {quickSearchResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden"
              >
                {quickSearchResults.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => viewStudentProfile(s.id)}
                    className="w-full p-4 text-right hover:bg-white hover:text-primary transition-all flex items-center justify-between group border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <p className="font-black text-sm">{s.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{s.grade} - {s.section}</p>
                    </div>
                    <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </button>
                ))}
              </motion.div>
            )}
            {searching && (
              <div className="text-center py-4 text-slate-400 text-xs font-bold">جاري البحث...</div>
            )}
          </AnimatePresence>
        </div>

        {/* Hierarchical Search */}
        <div className="lg:col-span-2 sts-card p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Layers size={20} />
            </div>
            <h2 className="text-lg font-black text-slate-800">البحث الهرمي المتدرج</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 mr-1 uppercase tracking-widest">المرحلة / الصف</label>
              <Select 
                options={grades.map(g => ({ value: g, label: g }))}
                placeholder="اختر الصف..."
                onChange={(opt: any) => {
                  setSelectedGrade(opt);
                  setSelectedSection(null);
                  setSelectedStudentInHierarchy(null);
                  fetchSections(opt.value);
                }}
                className="sts-select-container"
                classNamePrefix="sts-select"
                isRtl
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 mr-1 uppercase tracking-widest">الفصل</label>
              <Select 
                options={sections.map(s => ({ value: s, label: s }))}
                placeholder="اختر الفصل..."
                isDisabled={!selectedGrade}
                value={selectedSection}
                onChange={(opt: any) => {
                  setSelectedSection(opt);
                  setSelectedStudentInHierarchy(null);
                  fetchStudentsInHierarchy(selectedGrade.value, opt.value);
                }}
                className="sts-select-container"
                classNamePrefix="sts-select"
                isRtl
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 mr-1 uppercase tracking-widest">اسم الطالب</label>
              <Select 
                options={studentsInHierarchy.map(s => ({ value: s.id, label: s.name }))}
                placeholder="اختر الطالب..."
                isDisabled={!selectedSection}
                value={selectedStudentInHierarchy}
                onChange={(opt: any) => {
                  setSelectedStudentInHierarchy(opt);
                }}
                className="sts-select-container"
                classNamePrefix="sts-select"
                isRtl
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              disabled={!selectedStudentInHierarchy}
              onClick={() => viewStudentProfile(selectedStudentInHierarchy.value)}
              className="sts-button-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <User size={18} />
              عرض ملف الطالب
            </button>
          </div>
        </div>
      </div>

      {/* Profile View */}
      <AnimatePresence>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 no-print">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-slate-400 font-bold">جاري جلب السجل الشامل...</p>
          </div>
        ) : selectedStudent && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Profile Card & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Student Info Card */}
              <div className="lg:col-span-2 sts-card p-8 md:p-10 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-br-[5rem] -ml-8 -mt-8 transition-all group-hover:scale-110" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-primary text-white rounded-[2rem] flex items-center justify-center text-4xl md:text-5xl font-black shadow-2xl shadow-primary/30 shrink-0">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div className="text-center md:text-right space-y-4 flex-1">
                    <h2 className="text-2xl md:text-4xl font-black text-slate-900">{selectedStudent.name}</h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                      <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                        <IdCard size={18} className="text-primary" />
                        <span className="text-sm font-bold text-slate-600">{selectedStudent.national_id}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                        <School size={18} className="text-primary" />
                        <span className="text-sm font-bold text-slate-600">{selectedStudent.grade} - {selectedStudent.section}</span>
                      </div>
                    </div>
                  </div>
                  <div className="no-print">
                    <button 
                      onClick={handlePrint}
                      className="sts-button-primary flex items-center gap-2 px-8"
                    >
                      <Printer size={20} />
                      طباعة السجل الشامل
                    </button>
                  </div>
                </div>
              </div>

              {/* Mini Stats */}
              <div className="grid grid-cols-1 gap-4">
                <div className="sts-card p-6 flex items-center justify-between border-r-4 border-primary">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">إجمالي التحويلات</p>
                    <p className="text-3xl font-black text-slate-800">{selectedStudent.total_referrals}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                    <History size={24} />
                  </div>
                </div>
                <div className="sts-card p-6 flex items-center justify-between border-r-4 border-emerald-500">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">حالات مغلقة</p>
                    <p className="text-3xl font-black text-emerald-600">{selectedStudent.closed_referrals}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                </div>
                <div className="sts-card p-6 flex items-center justify-between border-r-4 border-amber-500">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">حالات نشطة</p>
                    <p className="text-3xl font-black text-amber-600">{selectedStudent.active_referrals}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <Clock size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Referral History Table */}
            <div className="sts-card overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                  <History size={22} />
                </div>
                <h3 className="text-xl font-black text-slate-800">سجل التحويلات التاريخي</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-5 font-black text-slate-600 text-sm">التاريخ</th>
                      <th className="p-5 font-black text-slate-600 text-sm">المعلم المحيل</th>
                      <th className="p-5 font-black text-slate-600 text-sm">نوع المشكلة</th>
                      <th className="p-5 font-black text-slate-600 text-sm">الإجراء المتخذ</th>
                      <th className="p-5 font-black text-slate-600 text-sm">الحالة</th>
                      <th className="p-5 font-black text-slate-600 text-sm">آخر من قام بالإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {referrals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-slate-400 font-bold">لا توجد سجلات تحويل سابقة لهذا الطالب</td>
                      </tr>
                    ) : (
                      referrals.map((ref) => (
                        <tr 
                          key={ref.id} 
                          onClick={() => setSelectedReferral(ref)}
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                        >
                          <td className="p-5">
                            <p className="font-bold text-slate-700 text-sm">{new Date(ref.created_at).toLocaleDateString('ar-SA')}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{new Date(ref.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="p-5 font-black text-slate-800 text-sm">{ref.teacher_name}</td>
                          <td className="p-5">
                            <div className="flex flex-col">
                              <span className="text-slate-600 font-bold text-sm">{getTypeLabel(ref.type)}</span>
                              <span className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]">{ref.reason}</span>
                            </div>
                          </td>
                          <td className="p-5">
                            <p className="text-slate-600 text-xs font-bold line-clamp-2 max-w-xs">{ref.remedial_plan || 'قيد المراجعة والمعالجة'}</p>
                          </td>
                          <td className="p-5">
                            {getStatusBadge(ref.status)}
                          </td>
                          <td className="p-5">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-black text-slate-800 text-xs">{ref.last_actor_name || '-'}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{ref.last_action || '-'}</p>
                              </div>
                              <ArrowRight size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PRINT ONLY SECTION */}
            <div className="hidden print:block print-container">
              {/* Official Header */}
              <div className="flex justify-between items-start mb-10 border-b-2 border-slate-900 pb-8">
                <div className="text-right space-y-1">
                  <p className="text-sm font-black">المملكة العربية السعودية</p>
                  <p className="text-sm font-black">وزارة التعليم</p>
                  <p className="text-xs font-bold">الإدارة العامة للتعليم بمنطقة الخرج</p>
                  <p className="text-xs font-bold">ثانوية أم القرى</p>
                </div>

                <div className="text-center">
                  <img 
                    src="https://i.ibb.co/QFwrvnqF/photo-2026-02-20-15-16-20.jpg" 
                    alt="شعار الوزارة" 
                    className="w-24 h-24 object-contain mx-auto mb-3"
                    referrerPolicy="no-referrer"
                  />
                  <h1 className="text-2xl font-black text-slate-900">السجل الشامل للطالب</h1>
                  <p className="text-xs font-bold text-slate-600 mt-1">وثيقة رسمية - سرية للغاية</p>
                </div>

                <div className="text-left">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/ar/thumb/a/a2/Saudi_Vision_2030_logo.svg/512px-Saudi_Vision_2030_logo.svg.png" 
                    alt="رؤية 2030" 
                    className="w-24 h-24 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Student Info Table */}
              <div className="mb-8">
                <h3 className="text-lg font-black mb-4 border-r-4 border-primary pr-3">بيانات الطالب الأساسية</h3>
                <table className="w-full border-collapse border border-slate-300">
                  <tbody>
                    <tr>
                      <td className="p-3 border border-slate-300 bg-slate-50 font-black text-sm w-1/4">اسم الطالب الرباعي</td>
                      <td className="p-3 border border-slate-300 font-bold text-sm w-1/4">{selectedStudent.name}</td>
                      <td className="p-3 border border-slate-300 bg-slate-50 font-black text-sm w-1/4">رقم الهوية الوطنية</td>
                      <td className="p-3 border border-slate-300 font-bold text-sm w-1/4">{selectedStudent.national_id}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-slate-300 bg-slate-50 font-black text-sm">الصف الدراسي</td>
                      <td className="p-3 border border-slate-300 font-bold text-sm">{selectedStudent.grade}</td>
                      <td className="p-3 border border-slate-300 bg-slate-50 font-black text-sm">الفصل</td>
                      <td className="p-3 border border-slate-300 font-bold text-sm">{selectedStudent.section}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
              <div className="mb-8 grid grid-cols-3 gap-4">
                <div className="p-4 border border-slate-300 rounded-xl text-center">
                  <p className="text-xs font-black text-slate-500 mb-1">إجمالي التحويلات</p>
                  <p className="text-2xl font-black">{selectedStudent.total_referrals}</p>
                </div>
                <div className="p-4 border border-slate-300 rounded-xl text-center">
                  <p className="text-xs font-black text-slate-500 mb-1">الحالات المغلقة</p>
                  <p className="text-2xl font-black text-emerald-600">{selectedStudent.closed_referrals}</p>
                </div>
                <div className="p-4 border border-slate-300 rounded-xl text-center">
                  <p className="text-xs font-black text-slate-500 mb-1">الحالات النشطة</p>
                  <p className="text-2xl font-black text-amber-600">{selectedStudent.active_referrals}</p>
                </div>
              </div>

              {/* Detailed History */}
              <div className="mb-10">
                <h3 className="text-lg font-black mb-4 border-r-4 border-primary pr-3">سجل التحويلات التفصيلي</h3>
                <table className="w-full text-right border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-2 border border-slate-300 text-[10px] font-black">التاريخ</th>
                      <th className="p-2 border border-slate-300 text-[10px] font-black">المعلم</th>
                      <th className="p-2 border border-slate-300 text-[10px] font-black">النوع</th>
                      <th className="p-2 border border-slate-300 text-[10px] font-black">السبب</th>
                      <th className="p-2 border border-slate-300 text-[10px] font-black">الإجراء</th>
                      <th className="p-2 border border-slate-300 text-[10px] font-black">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((ref) => (
                      <tr key={ref.id}>
                        <td className="p-2 border border-slate-300 text-[9px] font-bold">{new Date(ref.created_at).toLocaleDateString('ar-SA')}</td>
                        <td className="p-2 border border-slate-300 text-[9px] font-black">{ref.teacher_name}</td>
                        <td className="p-2 border border-slate-300 text-[9px] font-bold">{getTypeLabel(ref.type)}</td>
                        <td className="p-2 border border-slate-300 text-[9px] font-bold">{ref.reason}</td>
                        <td className="p-2 border border-slate-300 text-[9px] font-bold">{ref.remedial_plan || '-'}</td>
                        <td className="p-2 border border-slate-300 text-[9px] font-black">
                          {ref.status === 'pending_vp' ? 'بانتظار الوكيل' : 
                           ref.status === 'pending_counselor' ? 'بانتظار الموجه' : 
                           ref.status === 'resolved' ? 'تم الحل' : 'مغلق'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="mt-16 grid grid-cols-3 gap-12 text-center">
                <div className="space-y-8">
                  <p className="font-black text-sm">وكيل شؤون الطلاب</p>
                  <div className="h-px bg-slate-300 w-3/4 mx-auto"></div>
                  <p className="text-xs font-bold">أ. فهد السالم</p>
                </div>
                <div className="space-y-8">
                  <p className="font-black text-sm">الموجه الطلابي</p>
                  <div className="h-px bg-slate-300 w-3/4 mx-auto"></div>
                  <p className="text-xs font-bold">أ. محمد الفهيد</p>
                </div>
                <div className="space-y-8">
                  <p className="font-black text-sm">مدير المدرسة</p>
                  <div className="h-px bg-slate-300 w-3/4 mx-auto"></div>
                  <p className="text-xs font-bold">د. خالد المنصور</p>
                </div>
              </div>

              {/* Dynamic Footer */}
              <div className="mt-20 pt-6 border-t border-slate-200 text-center text-[9px] font-bold text-slate-400">
                <p>طُبع بواسطة: {user?.name} ({user?.role === 'principal' ? 'مدير المدرسة' : user?.role === 'vice_principal' ? 'وكيل شؤون الطلاب' : 'الموجه الطلابي'})</p>
                <p>بتاريخ: {new Date().toLocaleString('ar-SA')}</p>
                <p className="mt-2">نظام تحويل - ثانوية أم القرى بالخرج</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    {getTypeLabel(selectedReferral.type)}
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
                      <CheckCircle2 size={18} />
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
                      <Layers size={18} />
                      <span>الخطة العلاجية المنفذة</span>
                    </div>
                    <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-emerald-900 text-sm leading-relaxed font-bold">
                      {selectedReferral.remedial_plan}
                    </div>
                  </div>
                )}
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

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            direction: rtl;
            font-family: 'Inter', 'Cairo', sans-serif;
          }
          .no-print {
            display: none !important;
          }
          .sts-card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .print-container {
            display: block !important;
            transform: scale(0.98);
            transform-origin: top center;
            overflow: visible !important;
            height: auto !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            overflow: visible !important;
            height: auto !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
          * {
            overflow: visible !important;
            height: auto !important;
          }
        }
        
        .sts-select-container .sts-select__control {
          background-color: #f8fafc;
          border-color: #f1f5f9;
          border-radius: 1rem;
          padding: 4px;
          box-shadow: none;
        }
        .sts-select-container .sts-select__control:hover {
          border-color: #006847;
        }
        .sts-select-container .sts-select__control--is-focused {
          border-color: #006847;
          box-shadow: 0 0 0 1px #006847;
        }
        .sts-select-container .sts-select__placeholder {
          color: #94a3b8;
          font-weight: 500;
          font-size: 0.875rem;
        }
      `}} />
    </div>
  );
};

export default StudentComprehensiveRecord;
