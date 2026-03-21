import { apiFetch } from '../utils/api';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, FileText, ChevronLeft, Layers, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Student {
  id: number;
  name: string;
  grade: string;
  section: string;
  national_id: string;
}

const StudentRecordSearch: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Hierarchical search state
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await apiFetch(`/api/students?userId=${user?.id}`);
        if (res.ok) {
          const data = await res.json();
          setStudents(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [user?.id]);

  // Quick Search Results
  const quickSearchResults = useMemo(() => {
    if (searchTerm.trim().length < 3) return [];
    const lowerTerm = searchTerm.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(lowerTerm) || s.national_id.includes(lowerTerm)
    );
  }, [students, searchTerm]);

  // Hierarchical Search Data
  const grades = useMemo(() => {
    return Array.from(new Set(students.map(s => s.grade))).sort();
  }, [students]);

  const sections = useMemo(() => {
    if (!selectedGrade) return [];
    return Array.from(new Set(students.filter(s => s.grade === selectedGrade).map(s => s.section))).sort();
  }, [students, selectedGrade]);

  const studentsInSection = useMemo(() => {
    if (!selectedGrade || !selectedSection) return [];
    return students.filter(s => s.grade === selectedGrade && s.section === selectedSection).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [students, selectedGrade, selectedSection]);

  // Reset dependent dropdowns when parent changes
  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGrade(e.target.value);
    setSelectedSection('');
    setSelectedStudentId('');
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSection(e.target.value);
    setSelectedStudentId('');
  };

  const handleViewProfile = () => {
    if (selectedStudentId) {
      navigate(`/dashboard/student/${selectedStudentId}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
          <FileText size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">السجل الشامل للطالب</h1>
          <p className="text-sm text-slate-500 font-bold">ابحث عن طالب لعرض سجله الأكاديمي والسلوكي</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-10">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Column 1: Quick Search */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 mb-6">
              <Search className="text-primary" size={20} />
              <span>البحث السريع المباشر</span>
            </h2>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3 mb-4 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all shrink-0">
              <Search className="text-slate-400" size={20} />
              <input 
                type="text"
                placeholder="ابحث باسم الطالب أو رقم الهوية..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none font-bold text-slate-700 placeholder:text-slate-400"
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {searchTerm.trim().length > 0 && searchTerm.trim().length < 3 ? (
                <div className="text-center p-6 text-slate-400 font-bold text-sm">
                  الرجاء كتابة 3 أحرف على الأقل للبحث...
                </div>
              ) : quickSearchResults.length > 0 ? (
                quickSearchResults.map(student => (
                  <div 
                    key={student.id}
                    onClick={() => navigate(`/dashboard/student/${student.id}`)}
                    className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                      <User size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-slate-800 truncate text-sm">{student.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs font-bold text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md">{student.grade} - {student.section}</span>
                        <span>{student.national_id}</span>
                      </div>
                    </div>
                    <ChevronLeft className="text-slate-300 group-hover:text-primary transition-colors" size={18} />
                  </div>
                ))
              ) : searchTerm.trim().length >= 3 ? (
                <div className="text-center p-6 text-slate-400 font-bold text-sm">
                  لا توجد نتائج مطابقة
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-3 opacity-50 py-10">
                  <Search size={48} strokeWidth={1.5} />
                  <p className="font-bold text-sm">ابدأ الكتابة للبحث عن طالب</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Hierarchical Search */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 mb-6">
              <Layers className="text-indigo-500" size={20} />
              <span>البحث الهرمي المتدرج</span>
            </h2>

            <div className="space-y-5 flex-1">
              {/* Grade Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">الصف الدراسي</label>
                <select 
                  value={selectedGrade}
                  onChange={handleGradeChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-primary focus:border-primary block p-3 font-bold"
                >
                  <option value="">اختر الصف...</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              {/* Section Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">الفصل</label>
                <select 
                  value={selectedSection}
                  onChange={handleSectionChange}
                  disabled={!selectedGrade}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-primary focus:border-primary block p-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">اختر الفصل...</option>
                  {sections.map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>

              {/* Student Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">اسم الطالب</label>
                <select 
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : '')}
                  disabled={!selectedSection}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-primary focus:border-primary block p-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">اختر الطالب...</option>
                  {studentsInSection.map(student => (
                    <option key={student.id} value={student.id}>{student.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 shrink-0">
              <button
                onClick={handleViewProfile}
                disabled={!selectedStudentId}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 px-6 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary/20"
              >
                <UserCircle size={20} />
                <span>عرض ملف الطالب</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default StudentRecordSearch;
