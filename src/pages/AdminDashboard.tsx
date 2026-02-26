import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Upload,
  Search,
  ChevronLeft,
  Edit2,
  Save,
  X,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { User } from '../types';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [allGrades, setAllGrades] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [studentEditForm, setStudentEditForm] = useState({ name: '', national_id: '', grade: '', section: '' });
  const [studentSearch, setStudentSearch] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'teacher' });
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('');

  const normalizeArabic = (str: string) => {
    if (!str) return '';
    return str
      .replace(/^الصف\s+/, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .trim();
  };

  useEffect(() => {
    fetchUsers();
    fetchGrades();
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  const fetchGrades = async () => {
    const res = await fetch('/api/students');
    const data = await res.json();
    const grades = Array.from(new Set(data.map((s: any) => s.grade))) as string[];
    setAllGrades(grades);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (user: User) => {
    setEditingUserId(user.id);
    setEditForm({ name: user.name, email: user.email });
  };

  const cancelEditing = () => {
    setEditingUserId(null);
  };

  const saveUserUpdate = async (userId: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingUserId(null);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [deletingGrade, setDeletingGrade] = useState<string | null>(null);

  const deleteUser = (userId: number) => {
    setDeletingUserId(null);
    fetch(`/api/admin/users/${userId}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(async (res) => {
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'فشل الحذف');
      }
    })
    .catch(err => {
      console.error('Delete error:', err);
      alert('حدث خطأ في الاتصال');
    });
  };

  const deleteGrade = async (grade: string) => {
    setDeletingGrade(null);
    try {
      const res = await fetch('/api/admin/grades/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade }),
      });
      if (res.ok) {
        fetchStudents();
        fetchGrades();
        fetchUsers();
        setSelectedGradeFilter('');
        setSelectedSectionFilter('');
      } else {
        const data = await res.json();
        alert(data.error || 'فشل حذف الصف');
      }
    } catch (err) {
      alert('حدث خطأ أثناء حذف الصف');
    }
  };

  const saveStudentUpdate = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/students/${id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentEditForm),
      });
      if (res.ok) {
        fetchStudents();
        setEditingStudentId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteStudent = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditingStudent = (student: any) => {
    setEditingStudentId(student.id);
    setStudentEditForm({
      name: student.name,
      national_id: student.national_id,
      grade: student.grade,
      section: student.section
    });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddUser(false);
        setNewUserForm({ name: '', email: '', password: '', role: 'teacher' });
        fetchUsers();
      } else {
        alert(data.error || 'فشل إضافة المستخدم');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إضافة المستخدم');
    }
  };

  const toggleGrade = async (userId: number, grade: string, currentGrades: string[]) => {
    const newGrades = currentGrades.includes(grade)
      ? currentGrades.filter(g => g !== grade)
      : [...currentGrades, grade];
    
    try {
      const res = await fetch(`/api/admin/users/${userId}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: newGrades }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        console.log('Imported JSON:', json);

        // Map Excel columns to student object
        const students = json.map(row => ({
          name: row.Name || row['الاسم'] || row.name || row['اسم الطالب'],
          national_id: String(row['National ID'] || row['رقم الهوية'] || row.national_id || row['السجل المدني'] || ''),
          grade: row.Grade || row['الصف'] || row.grade,
          section: row.Section || row['الفصل'] || row.section
        })).filter(s => s.name && s.grade && s.section);

        if (students.length === 0) {
          alert('لم يتم العثور على بيانات طلاب صالحة في الملف. تأكد من وجود أعمدة (الاسم، الصف، الفصل)');
          setImporting(false);
          return;
        }

        const res = await fetch('/api/admin/students/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ students }),
        });
        
        const result = await res.json();
        if (result.success) {
          setImportSuccess(result.count);
          fetchGrades(); // Refresh grades list
          setTimeout(() => setImportSuccess(null), 5000);
        } else {
          alert('فشل استيراد البيانات: ' + (result.error || 'خطأ غير معروف'));
        }
      } catch (err) {
        console.error('File upload error:', err);
        alert('حدث خطأ أثناء قراءة الملف');
      } finally {
        setImporting(false);
        // Reset input
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'teacher': return 'معلم';
      case 'vice_principal': return 'وكيل';
      case 'counselor': return 'موجه';
      case 'admin': return 'مدير نظام';
      default: return role;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة النظام</h1>
          <p className="text-slate-500">إدارة صلاحيات المستخدمين واستيراد بيانات الطلاب.</p>
          <button 
            onClick={() => alert('نظام التنبيهات يعمل!')}
            className="mt-2 text-[10px] bg-slate-200 px-2 py-1 rounded"
          >
            اختبار التنبيهات
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] card-shadow border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-slate-800">المستخدمون والصلاحيات</h2>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  <UserPlus size={18} />
                  <span>إضافة مستخدم</span>
                </button>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="بحث عن مستخدم..." 
                    className="bg-slate-50 border border-slate-100 rounded-xl py-2 pr-10 pl-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {showAddUser && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="p-8 bg-slate-50 border-b border-slate-100"
              >
                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 mr-2">الاسم الكامل</label>
                    <input 
                      type="text" 
                      required
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="أ. محمد علي"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 mr-2">البريد الإلكتروني (اسم المستخدم)</label>
                    <input 
                      type="email" 
                      required
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="user@school.edu"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 mr-2">كلمة المرور</label>
                    <input 
                      type="password" 
                      required
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 mr-2">الصلاحية</label>
                    <div className="flex items-center gap-2">
                      <select 
                        value={newUserForm.role}
                        onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                        className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="teacher">معلم</option>
                        <option value="vice_principal">وكيل</option>
                        <option value="counselor">موجه</option>
                        <option value="admin">مدير نظام</option>
                      </select>
                      <button 
                        type="submit"
                        className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                      >
                        <Save size={20} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowAddUser(false)}
                        className="bg-slate-200 text-slate-600 p-2 rounded-xl hover:bg-slate-300 transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-8 py-4">المستخدم</th>
                    <th className="px-8 py-4">البريد الإلكتروني</th>
                    <th className="px-8 py-4">الصلاحية</th>
                    <th className="px-8 py-4">الصفوف المسندة</th>
                    <th className="px-8 py-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-400">جاري التحميل...</td></tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4">
                          <div className="flex flex-col gap-1">
                            {editingUserId === u.id ? (
                              <input 
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            ) : (
                              <span className="font-bold text-slate-800">{u.name}</span>
                            )}
                            {editingUserId === u.id ? (
                              <input 
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            ) : (
                              <span className="text-slate-400 text-xs">{u.email}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                u.role === 'vice_principal' ? 'bg-red-50 text-red-700 border-red-100' :
                                u.role === 'counselor' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-blue-50 text-blue-700 border-blue-100'
                              }`}>
                                {getRoleLabel(u.role)}
                              </span>
                              <select 
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-[10px] focus:ring-2 focus:ring-blue-500/20 outline-none"
                              >
                                <option value="teacher">معلم</option>
                                <option value="vice_principal">وكيل</option>
                                <option value="counselor">موجه</option>
                                <option value="admin">مدير نظام</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 font-medium block">الصفوف المسندة:</span>
                              <div className="flex flex-wrap gap-1 max-w-[250px]">
                                {allGrades.map(g => (
                                  <button
                                    key={g}
                                    onClick={() => toggleGrade(u.id, g, u.assigned_grades || [])}
                                    className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all border ${
                                      (u.assigned_grades || []).includes(g)
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300'
                                    }`}
                                  >
                                    {g}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-2">
                            {editingUserId === u.id ? (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => saveUserUpdate(u.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all"
                                >
                                  <Save size={14} />
                                  <span>حفظ</span>
                                </button>
                                <button 
                                  onClick={cancelEditing}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
                                >
                                  <X size={14} />
                                  <span>إلغاء</span>
                                </button>
                              </div>
                            ) : deletingUserId === u.id ? (
                              <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-100 animate-pulse">
                                <span className="text-[10px] font-bold text-red-600 px-1">تأكيد؟</span>
                                <button 
                                  onClick={() => deleteUser(u.id)}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700"
                                >
                                  نعم
                                </button>
                                <button 
                                  onClick={() => setDeletingUserId(null)}
                                  className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-300"
                                >
                                  لا
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => startEditing(u)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all"
                                >
                                  <Edit2 size={14} />
                                  <span>تعديل</span>
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setDeletingUserId(u.id);
                                  }}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 active:scale-95 transition-all shadow-md"
                                >
                                  حذف
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] card-shadow border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="text-emerald-600" size={24} />
                <h2 className="text-xl font-bold text-slate-800">إدارة الطلاب</h2>
                {students.length === 0 && (
                  <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-lg font-bold">لا يوجد بيانات طلاب</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {deletingGrade === selectedGradeFilter ? (
                    <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-xl border border-red-100 animate-pulse">
                      <span className="text-xs font-bold text-red-600">حذف الصف بجميع طلابه؟</span>
                      <button 
                        onClick={() => deleteGrade(selectedGradeFilter)}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-700"
                      >
                        نعم
                      </button>
                      <button 
                        onClick={() => setDeletingGrade(null)}
                        className="bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-300"
                      >
                        لا
                      </button>
                    </div>
                  ) : (
                    selectedGradeFilter && (
                      <button 
                        onClick={() => setDeletingGrade(selectedGradeFilter)}
                        className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
                        title="حذف هذا الصف بالكامل"
                      >
                        <Trash2 size={14} />
                        <span>حذف الصف بالكامل</span>
                      </button>
                    )
                  )}
                  <select 
                    value={selectedGradeFilter}
                    onChange={(e) => {
                      setSelectedGradeFilter(e.target.value);
                      setSelectedSectionFilter('');
                      setDeletingGrade(null);
                    }}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  >
                    <option value="">اختر الصف</option>
                    {Array.from(new Set(students.map(s => s.grade).filter(Boolean))).sort().map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>

                  <select 
                    value={selectedSectionFilter}
                    onChange={(e) => setSelectedSectionFilter(e.target.value)}
                    disabled={!selectedGradeFilter}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">اختر الفصل</option>
                    {selectedGradeFilter && Array.from(new Set(
                      students
                        .filter(s => s.grade === selectedGradeFilter)
                        .map(s => s.section)
                        .filter(Boolean)
                    )).sort().map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="بحث عن طالب..." 
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-2 pr-10 pl-4 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-8 py-4">الطالب</th>
                    <th className="px-8 py-4">رقم الهوية</th>
                    <th className="px-8 py-4">الصف / الفصل</th>
                    <th className="px-8 py-4">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const filteredStudents = students.filter(s => {
                      const matchesSearch = studentSearch 
                        ? (s.name.includes(studentSearch) || s.national_id.includes(studentSearch))
                        : true;
                      
                      const matchesGrade = selectedGradeFilter ? s.grade === selectedGradeFilter : true;
                      const matchesSection = selectedSectionFilter ? s.section === selectedSectionFilter : true;
                      
                      if (!studentSearch && !selectedSectionFilter && selectedGradeFilter) return false;
                      if (!studentSearch && !selectedGradeFilter) return false;

                      return matchesSearch && matchesGrade && matchesSection;
                    });

                    if (filteredStudents.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="px-8 py-12 text-center">
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                              <AlertCircle size={40} className="opacity-20" />
                              <p className="text-sm font-medium">
                                {!selectedGradeFilter && !studentSearch ? 'يرجى اختيار الصف والفصل لعرض الطلاب' : 
                                 selectedGradeFilter && !selectedSectionFilter ? 'يرجى اختيار الفصل' :
                                 'لا يوجد طلاب يطابقون البحث'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4">
                          {editingStudentId === s.id ? (
                            <input 
                              type="text"
                              value={studentEditForm.name}
                              onChange={(e) => setStudentEditForm({...studentEditForm, name: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          ) : (
                            <span className="font-bold text-slate-800">{s.name}</span>
                          )}
                        </td>
                        <td className="px-8 py-4">
                          {editingStudentId === s.id ? (
                            <input 
                              type="text"
                              value={studentEditForm.national_id}
                              onChange={(e) => setStudentEditForm({...studentEditForm, national_id: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          ) : (
                            <span className="text-slate-500 text-sm">{s.national_id}</span>
                          )}
                        </td>
                        <td className="px-8 py-4">
                          {editingStudentId === s.id ? (
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                placeholder="الصف"
                                value={studentEditForm.grade}
                                onChange={(e) => setStudentEditForm({...studentEditForm, grade: e.target.value})}
                                className="w-20 bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                              <input 
                                type="text"
                                placeholder="الفصل"
                                value={studentEditForm.section}
                                onChange={(e) => setStudentEditForm({...studentEditForm, section: e.target.value})}
                                className="w-20 bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">{s.grade}</span>
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-bold">{s.section}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-2">
                            {editingStudentId === s.id ? (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => saveStudentUpdate(s.id)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                  title="حفظ"
                                >
                                  <Save size={16} />
                                </button>
                                <button 
                                  onClick={() => setEditingStudentId(null)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="إلغاء"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <button 
                                  onClick={() => startEditingStudent(s)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  title="تعديل"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => deleteStudent(s.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="حذف"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] card-shadow border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 text-blue-600 font-bold text-lg">
              <FileSpreadsheet size={24} />
              <span>استيراد الطلاب (Excel)</span>
            </div>
            
            <p className="text-sm text-slate-500 leading-relaxed">
              يمكنك رفع ملف Excel يحتوي على قائمة الطلاب. تأكد من وجود أعمدة باسم "الاسم"، "رقم الهوية"، "الصف"، و "الفصل".
            </p>

            <div className="relative">
              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden" 
                id="excel-upload"
                disabled={importing}
              />
              <label 
                htmlFor="excel-upload"
                className={`w-full flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800">{importing ? 'جاري الرفع...' : 'اضغط لرفع الملف'}</p>
                  <p className="text-xs text-slate-400 mt-1">XLSX, XLS (حتى 5MB)</p>
                </div>
              </label>
            </div>

            {importSuccess !== null && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700"
              >
                <CheckCircle2 size={20} />
                <p className="text-sm font-bold">تم استيراد {importSuccess} طالب بنجاح!</p>
              </motion.div>
            )}
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6">
            <div className="flex items-center gap-3">
              <Shield className="text-blue-400" size={24} />
              <h3 className="font-bold text-lg">تنبيهات الأمان</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-400 shrink-0" size={18} />
                <p className="text-xs text-slate-400 leading-relaxed">
                  تغيير صلاحيات المستخدمين يؤثر فوراً على قدرتهم على الوصول للبيانات الحساسة.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-400 shrink-0" size={18} />
                <p className="text-xs text-slate-400 leading-relaxed">
                  عند استيراد الطلاب، سيتم إضافة الأسماء الجديدة إلى قاعدة البيانات الحالية.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
