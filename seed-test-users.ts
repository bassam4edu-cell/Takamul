import React, { useState, useEffect } from 'react';
import { 
  Book, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Check,
  Search,
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetch } from '../../utils/api';
import { Subject } from '../../types';

const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectTab, setSubjectTab] = useState<'core' | 'elective'>('core');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [subjectGradeFilter, setSubjectGradeFilter] = useState<string>('all');
  const [subjectSemesterFilter, setSubjectSemesterFilter] = useState<string>('all');
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    try {
      const res = await apiFetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newSubjectName.trim(),
          is_elective: subjectTab === 'elective'
        })
      });
      if (res.ok) {
        const newSubject = await res.json();
        setSubjects([...subjects, newSubject]);
        setNewSubjectName('');
      }
    } catch (err) {
      console.error('Failed to add subject:', err);
    }
  };

  const handleEditSubject = async (id: number) => {
    if (!editingSubjectName.trim()) return;
    try {
      const res = await apiFetch(`/api/admin/subjects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: editingSubjectName.trim(),
          is_elective: subjects.find(s => s.id === id)?.is_elective
        })
      });
      if (res.ok) {
        const updatedSubject = await res.json();
        setSubjects(subjects.map(s => s.id === id ? updatedSubject : s));
        setEditingSubjectId(null);
        setEditingSubjectName('');
      }
    } catch (err) {
      console.error('Failed to update subject:', err);
    }
  };

  const handleDeleteSubject = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المادة؟')) return;
    try {
      const res = await apiFetch(`/api/admin/subjects/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSubjects(subjects.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete subject:', err);
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const matchesTab = subjectTab === 'core' ? !s.is_elective : s.is_elective;
    const matchesGrade = subjectGradeFilter === 'all' || s.grade === subjectGradeFilter;
    const matchesSemester = subjectSemesterFilter === 'all' || s.semester === subjectSemesterFilter;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesGrade && matchesSemester && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <Book size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">إدارة المواد الدراسية</h2>
            <p className="text-slate-500 text-sm font-bold mt-1">إضافة وتعديل المواد الأساسية والاختيارية في النظام.</p>
          </div>
        </div>
      </div>

      <div className="sts-card p-8 border-none shadow-2xl shadow-slate-200/50 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl w-max">
            <button
              onClick={() => setSubjectTab('core')}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${subjectTab === 'core' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              المواد الأساسية
            </button>
            <button
              onClick={() => setSubjectTab('elective')}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${subjectTab === 'elective' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              المجال الاختياري
            </button>
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="بحث عن مادة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pr-11 pl-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Add Subject Card */}
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col justify-center gap-4 hover:border-primary/30 transition-all group">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">إضافة مادة جديدة</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="اسم المادة..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  onClick={handleAddSubject}
                  className="bg-primary text-white p-2 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
            ))
          ) : filteredSubjects.length > 0 ? (
            filteredSubjects.map(subject => (
              <motion.div
                layout
                key={subject.id}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    {editingSubjectId === subject.id ? (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={editingSubjectName}
                          onChange={(e) => setEditingSubjectName(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          onClick={() => handleEditSubject(subject.id)}
                          className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => setEditingSubjectId(null)}
                          className="text-slate-400 hover:bg-slate-50 p-1.5 rounded-lg"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-black text-slate-800">{subject.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {subject.is_elective ? 'مجال اختياري' : `${subject.grade} - ${subject.semester}`}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingSubjectId(subject.id);
                        setEditingSubjectName(subject.name);
                      }}
                      className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <Book className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 font-bold">لا توجد مواد تطابق البحث أو الفلترة.</p>
            </div>
          )}
        </div>

        {subjectTab === 'core' && (
          <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">تصفية حسب:</span>
            </div>
            <select
              value={subjectGradeFilter}
              onChange={(e) => setSubjectGradeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="all">جميع الصفوف</option>
              <option value="الصف الأول">الصف الأول</option>
              <option value="الصف الثاني">الصف الثاني</option>
              <option value="الصف الثالث">الصف الثالث</option>
            </select>
            <select
              value={subjectSemesterFilter}
              onChange={(e) => setSubjectSemesterFilter(e.target.value)}
              className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="all">جميع الفصول</option>
              <option value="الفصل الأول">الفصل الأول</option>
              <option value="الفصل الثاني">الفصل الثاني</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectManagement;
