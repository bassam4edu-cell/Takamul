import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { 
  Search, 
  Users, 
  ArrowUpRight, 
  Filter,
  UserCircle,
  GraduationCap,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const StudentSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await apiFetch('/api/admin/students/filters');
        if (res.ok) {
          const data = await res.json();
          setFilters(data.filters || {});
        }
      } catch (err) {
        console.error("Failed to fetch filters", err);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const searchStudents = async () => {
      if (!searchQuery.trim() && selectedGrade === 'all' && selectedSection === 'all') {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.append('query', searchQuery);
        if (selectedGrade !== 'all') params.append('grade', selectedGrade);
        if (selectedSection !== 'all') params.append('section', selectedSection);

        const res = await apiFetch(`/api/student-search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchStudents, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedGrade, selectedSection]);

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2">الملف الشامل للطالب</h1>
          <p className="text-slate-500 font-bold">ابحث عن أي طالب للوصول إلى سجله الأكاديمي والسلوكي الكامل.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو رقم الهوية..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pr-12 pl-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
              <Filter size={18} className="text-slate-400" />
              <select 
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  setSelectedSection('all');
                }}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none"
              >
                <option value="all">كل الصفوف</option>
                {Object.keys(filters).map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
              <Users size={18} className="text-slate-400" />
              <select 
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={selectedGrade === 'all'}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none disabled:opacity-50"
              >
                <option value="all">كل الفصول</option>
                {selectedGrade !== 'all' && filters[selectedGrade]?.map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-slate-500 font-bold">جاري البحث عن الطلاب...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((student, idx) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link 
                    to={`/dashboard/student/${student.id}`}
                    className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-primary/30 hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                        <UserCircle size={28} />
                      </div>
                      <div className="text-right">
                        <h3 className="font-black text-slate-800 text-lg mb-1">{student.name}</h3>
                        <div className="flex items-center gap-2 text-slate-500">
                          <GraduationCap size={14} />
                          <span className="text-xs font-bold">{student.grade} - {student.section}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                      <ChevronRight size={20} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : searchQuery.trim() || selectedGrade !== 'all' ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="font-bold">لم يتم العثور على نتائج تطابق بحثك</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Users size={48} className="mb-4 opacity-20" />
              <p className="font-bold">ابدأ البحث أو اختر الصف والفصل لعرض الطلاب</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentSearch;
