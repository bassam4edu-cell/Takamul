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
  Trash2,
  Lock,
  Eye,
  Settings,
  UserCog,
  MoreHorizontal,
  Check,
  ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { User } from '../types';
import { useAuth } from '../App';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importingNationalIds, setImportingNationalIds] = useState(false);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);
  const [importNationalIdsResult, setImportNationalIdsResult] = useState<{ updated: number, notFound: number } | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingPasswordUserId, setEditingPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [clearExistingBeforeImport, setClearExistingBeforeImport] = useState(false);

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

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({ name: '', national_id: '', grade: '', section: '' });

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch('/api/admin/students');
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json().catch(() => []);
      if (Array.isArray(data)) {
        setStudents(data);
      } else {
        console.error('Students data is not an array:', data);
        setStudents([]);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: [newStudentForm] }),
      });
      if (res.ok) {
        setShowAddStudent(false);
        setNewStudentForm({ name: '', national_id: '', grade: '', section: '' });
        fetchStudents();
      } else {
        const data = await res.json().catch(() => ({ error: 'فشل إضافة الطالب' }));
        alert(data.error || 'فشل إضافة الطالب');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إضافة الطالب');
    }
  };

  const fetchGrades = async () => {
    try {
      const res = await fetch('/api/students');
      if (!res.ok) throw new Error('Failed to fetch grades');
      const data = await res.json().catch(() => []);
      const grades = Array.from(new Set(data.map((s: any) => s.grade))) as string[];
      setAllGrades(grades);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json().catch(() => []);
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
      } else {
        const data = await res.json().catch(() => ({ error: 'فشل تغيير الدور' }));
        alert(data.error || 'فشل تغيير الدور');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تغيير الدور');
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
      } else {
        const data = await res.json().catch(() => ({ error: 'فشل تحديث بيانات المستخدم' }));
        alert(data.error || 'فشل تحديث بيانات المستخدم');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تحديث بيانات المستخدم');
    }
  };

  const savePasswordUpdate = async (userId: number) => {
    if (!newPassword) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        setEditingPasswordUserId(null);
        setNewPassword('');
        alert('تم تحديث كلمة المرور بنجاح');
      } else {
        const data = await res.json().catch(() => ({ error: 'فشل تحديث كلمة المرور' }));
        alert(data.error || 'فشل تحديث كلمة المرور');
      }
    } catch (err) {
      console.error(err);
      alert('فشل تحديث كلمة المرور');
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
        const data = await res.json().catch(() => ({ error: 'فشل الحذف' }));
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
        const data = await res.json().catch(() => ({ error: 'فشل حذف الصف' }));
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
      } else {
        const data = await res.json().catch(() => ({ error: 'فشل حذف الطالب' }));
        alert(data.error || 'فشل حذف الطالب');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حذف الطالب');
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
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setShowAddUser(false);
        setNewUserForm({ name: '', email: '', password: '', role: 'teacher' });
        fetchUsers();
      } else {
        const data = await res.json().catch(() => ({ error: 'فشل إضافة المستخدم' }));
        alert(data.error || 'فشل إضافة المستخدم');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إضافة المستخدم');
    }
  };

  const toggleUserStatus = async (userId: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json().catch(() => ({ error: 'فشل تغيير حالة المستخدم' }));
        alert(data.error || 'فشل تغيير حالة المستخدم');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تغيير حالة المستخدم');
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
      } else {
        const data = await res.json().catch(() => ({ error: 'فشل تحديث الصفوف المسندة' }));
        alert(data.error || 'فشل تحديث الصفوف المسندة');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تحديث الصفوف المسندة');
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
        
        // Use header: 1 to get raw arrays (Column A = index 0, B = 1, etc.)
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        console.log('Raw Excel Rows:', rows);

        // Map Excel columns to student object (A: Name, B: ID, C: Grade, D: Section)
        // Skip header row (index 0)
        const students = rows.slice(1).map(row => {
          const name = row[0];
          const national_id = row[1];
          const grade = row[2];
          const section = row[3];

          return {
            name: name ? String(name).trim() : null,
            national_id: national_id ? String(national_id).trim() : null,
            grade: grade ? String(grade).trim() : null,
            section: section ? String(section).trim() : null
          };
        }).filter(s => s.name && s.grade && s.section);

        console.log('Processed students for import:', students);

        if (students.length === 0) {
          alert('لم يتم العثور على بيانات طلاب صالحة في الملف. تأكد من أن الملف يحتوي على البيانات في الأعمدة الأربعة الأولى (الاسم، الهوية، الصف، الفصل)');
          setImporting(false);
          return;
        }

        const res = await fetch('/api/admin/students/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            students,
            clearExisting: clearExistingBeforeImport 
          }),
        });
        
        const result = await res.json().catch(() => ({ success: false, error: 'استجابة غير صالحة من السيرفر' }));
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

  const handleNationalIdImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingNationalIds(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const base64 = evt.target?.result as string;
        const res = await fetch('/api/admin/import-national-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64 }),
        });
        
        const result = await res.json().catch(() => ({ success: false, error: 'فشل معالجة الملف' }));
        if (result.success) {
          setImportNationalIdsResult({ updated: result.updatedCount, notFound: result.notFoundCount });
          fetchStudents();
          setTimeout(() => setImportNationalIdsResult(null), 10000);
        } else {
          alert('فشل استيراد البيانات: ' + (result.error || 'خطأ غير معروف'));
        }
      } catch (err) {
        console.error('File upload error:', err);
        alert('حدث خطأ أثناء قراءة الملف');
      } finally {
        setImportingNationalIds(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'teacher': return 'معلم';
      case 'vice_principal': return 'وكيل';
      case 'counselor': return 'موجه';
      case 'principal': return 'مدير مدرسة';
      case 'admin': return 'مدير نظام';
      default: return role;
    }
  };

  return (
    <div className="space-y-10 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">لوحة تحكم المسؤول</h1>
          <p className="text-slate-500 mt-1 font-bold">إدارة المستخدمين، الطلاب، وإعدادات النظام المركزية.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2">
            <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div className="pl-4">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">حالة النظام</p>
              <p className="text-sm font-extrabold text-emerald-600 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                متصل ومستقر
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">
          
          {/* Users Management Section */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                  <UserCog size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">إدارة المستخدمين والصلاحيات</h2>
                  <p className="text-sm text-slate-500 font-bold mt-1">تحكم في حسابات الموظفين وصلاحيات الوصول للنظام.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddUser(true)}
                className="sts-button-accent px-6 py-3.5 flex items-center justify-center gap-3 shadow-xl shadow-accent/20"
              >
                <UserPlus size={20} />
                <span>إضافة مستخدم جديد</span>
              </button>
            </div>

            <div className="sts-card overflow-hidden border-none shadow-2xl shadow-slate-200/50">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">
                      <th className="px-8 py-6">المستخدم</th>
                      <th className="px-8 py-6">الدور / الصلاحية</th>
                      <th className="px-8 py-6 text-center">حالة الحساب</th>
                      <th className="px-8 py-6 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold">جاري تحميل البيانات...</td></tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/20 transition-all group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white text-primary rounded-2xl flex items-center justify-center font-black shadow-sm border border-slate-100 group-hover:border-primary/20 transition-colors">
                                {u.name.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-extrabold text-slate-800 text-base">{u.name}</span>
                                <span className="text-slate-400 text-xs font-bold">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest shadow-sm ${
                              u.role === 'admin' ? 'bg-red-50 text-red-700 border-red-100' :
                              u.role === 'vice_principal' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              u.role === 'counselor' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              u.role === 'principal' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                              'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                              {getRoleLabel(u.role)}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex justify-center">
                              <button 
                                onClick={() => toggleUserStatus(u.id)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                  u.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    u.is_active ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowUserModal(true);
                                }}
                                className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all border border-transparent hover:border-primary/10"
                                title="عرض التفاصيل والتعديل"
                              >
                                <Settings size={20} />
                              </button>
                              <button 
                                onClick={() => setDeletingUserId(u.id)}
                                className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
                                title="حذف المستخدم"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Students Management Section */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                  <Users size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">قاعدة بيانات الطلاب</h2>
                  <p className="text-sm text-slate-500 font-bold mt-1">إدارة بيانات الطلاب، تعديل المعلومات، وتصفية القوائم.</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowAddStudent(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-sm font-extrabold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <UserPlus size={18} />
                    <span>إضافة طالب</span>
                  </button>

                  {deletingGrade === selectedGradeFilter && selectedGradeFilter ? (
                    <div className="flex items-center gap-3 bg-red-50 px-4 py-2 rounded-2xl border border-red-100 animate-pulse">
                      <span className="text-xs font-extrabold text-red-600">حذف الصف بجميع طلابه؟</span>
                      <button 
                        onClick={() => deleteGrade(selectedGradeFilter)}
                        className="bg-red-600 text-white px-4 py-1.5 rounded-xl text-xs font-extrabold hover:bg-red-700 shadow-sm"
                      >
                        نعم
                      </button>
                      <button 
                        onClick={() => setDeletingGrade(null)}
                        className="bg-slate-200 text-slate-600 px-4 py-1.5 rounded-xl text-xs font-extrabold hover:bg-slate-300"
                      >
                        لا
                      </button>
                    </div>
                  ) : (
                    selectedGradeFilter && (
                      <button 
                        onClick={() => setDeletingGrade(selectedGradeFilter)}
                        className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-2xl text-xs font-extrabold hover:bg-red-100 transition-all border border-red-100"
                        title="حذف هذا الصف بالكامل"
                      >
                        <Trash2 size={16} />
                        <span>حذف الصف</span>
                      </button>
                    )
                  )}
                  <select 
                    value={selectedGradeFilter}
                    onChange={(e) => {
                      setSelectedGradeFilter(e.target.value);
                      setSelectedSectionFilter('');
                    }}
                    className="bg-white border border-slate-200 rounded-2xl py-3 px-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold shadow-sm"
                  >
                    <option value="">كل الصفوف</option>
                    {Array.from(new Set(students.map(s => s.grade).filter(Boolean))).sort().map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>

                  <select 
                    value={selectedSectionFilter}
                    onChange={(e) => setSelectedSectionFilter(e.target.value)}
                    disabled={!selectedGradeFilter}
                    className="bg-white border border-slate-200 rounded-2xl py-3 px-5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50 font-bold shadow-sm"
                  >
                    <option value="">كل الفصول</option>
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
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="بحث عن طالب..." 
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="bg-white border border-slate-200 rounded-2xl py-3 pr-12 pl-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all w-64 shadow-sm font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="sts-card overflow-hidden border-none shadow-2xl shadow-slate-200/50">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">
                      <th className="px-8 py-6">الطالب</th>
                      <th className="px-8 py-6">رقم الهوية</th>
                      <th className="px-8 py-6">الصف والفصل</th>
                      <th className="px-8 py-6 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(() => {
                      const filtered = students.filter(s => {
                        const name = s.name || '';
                        const nationalId = s.national_id || '';
                        
                        const matchesSearch = studentSearch 
                          ? (name.toLowerCase().includes(studentSearch.toLowerCase()) || nationalId.includes(studentSearch))
                          : true;
                        
                        const matchesGrade = selectedGradeFilter ? s.grade === selectedGradeFilter : true;
                        const matchesSection = selectedSectionFilter ? s.section === selectedSectionFilter : true;
                        
                        return matchesSearch && matchesGrade && matchesSection;
                      });
                      
                      if (filtered.length === 0) {
                        return <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold">لم يتم العثور على نتائج</td></tr>;
                      }

                      return filtered.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/20 transition-all group">
                          <td className="px-8 py-6">
                            {editingStudentId === s.id ? (
                              <input 
                                type="text"
                                value={studentEditForm.name}
                                onChange={(e) => setStudentEditForm({...studentEditForm, name: e.target.value})}
                                className="bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-bold w-full"
                              />
                            ) : (
                              <span className="font-extrabold text-slate-800">{s.name}</span>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            {editingStudentId === s.id ? (
                              <input 
                                type="text"
                                value={studentEditForm.national_id}
                                onChange={(e) => setStudentEditForm({...studentEditForm, national_id: e.target.value})}
                                className="bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-bold w-full"
                              />
                            ) : (
                              <span className="text-slate-500 font-mono font-bold">{s.national_id}</span>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            {editingStudentId === s.id ? (
                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  value={studentEditForm.grade}
                                  onChange={(e) => setStudentEditForm({...studentEditForm, grade: e.target.value})}
                                  className="w-24 bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                                />
                                <input 
                                  type="text"
                                  value={studentEditForm.section}
                                  onChange={(e) => setStudentEditForm({...studentEditForm, section: e.target.value})}
                                  className="w-16 bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{s.grade}</span>
                                <span className="px-3 py-1 bg-primary/5 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest">{s.section}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-2">
                              {editingStudentId === s.id ? (
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => saveStudentUpdate(s.id)}
                                    className="p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                  >
                                    <Save size={18} />
                                  </button>
                                  <button 
                                    onClick={() => setEditingStudentId(null)}
                                    className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all"
                                  >
                                    <X size={18} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => startEditingStudent(s)}
                                    className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  <button 
                                    onClick={() => deleteStudent(s.id)}
                                    className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
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
        </div>

        <div className="space-y-8">
          {/* Smart Import Card */}
          <div className="sts-card p-10 space-y-8 border-none shadow-2xl shadow-slate-200/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">استيراد الطلاب الذكي</h2>
                <p className="text-sm text-slate-500 font-bold mt-1">ارفع ملف Excel لتحديث قاعدة البيانات تلقائياً.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <input 
                type="checkbox" 
                id="clear-db"
                checked={clearExistingBeforeImport}
                onChange={(e) => setClearExistingBeforeImport(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label htmlFor="clear-db" className="text-sm font-extrabold text-slate-700 cursor-pointer">
                مسح قاعدة بيانات الطلاب الحالية قبل الاستيراد (Wipe & Import)
              </label>
            </div>

            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  const mockEvent = { target: { files: [file] } } as any;
                  handleFileUpload(mockEvent);
                }
              }}
              className={`relative group transition-all duration-500 ${isDragging ? 'scale-[1.02]' : ''}`}
            >
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden" 
                id="excel-upload"
                disabled={importing}
              />
              <label 
                htmlFor="excel-upload"
                className={`w-full flex flex-col items-center justify-center gap-8 p-16 border-2 border-dashed rounded-[3rem] cursor-pointer transition-all duration-500 ${
                  isDragging 
                    ? 'bg-primary/5 border-primary shadow-2xl shadow-primary/10' 
                    : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-primary/40'
                } ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-xl ${
                  isDragging ? 'bg-primary text-white rotate-12 scale-110' : 'bg-white text-primary group-hover:scale-110 group-hover:rotate-6'
                }`}>
                  <Upload size={40} />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-black text-slate-800 text-xl">{importing ? 'جاري معالجة البيانات...' : 'اسحب الملف هنا أو اضغط للرفع'}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">XLSX, XLS, CSV (حتى 10MB)</p>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                    <Check size={16} />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm">استراتيجية التحديث الذكي</h4>
                </div>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  النظام يستخدم رقم الهوية كمفتاح فريد. إذا كان الطالب موجوداً مسبقاً، سيتم تحديث بياناته (الصف، الفصل)، وإذا كان جديداً سيتم إضافته.
                </p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                    <FileSpreadsheet size={16} />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm">الأعمدة المطلوبة</h4>
                </div>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  يجب أن يحتوي الملف على الأعمدة التالية بدقة: <span className="text-primary font-black">الاسم، رقم الهوية، الصف، الفصل</span>.
                </p>
              </div>
            </div>

            {importSuccess !== null && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-emerald-500 text-white p-6 rounded-3xl flex items-center justify-between shadow-xl shadow-emerald-500/20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 size={28} />
                  </div>
                  <div>
                    <p className="font-black text-lg">اكتمل الاستيراد بنجاح!</p>
                    <p className="text-emerald-100 text-xs font-bold">تمت معالجة {importSuccess} سجل بنجاح.</p>
                  </div>
                </div>
                <button onClick={() => setImportSuccess(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </motion.div>
            )}
          </div>

          {/* Quick Actions & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="sts-card p-10 space-y-6 border-none shadow-2xl shadow-slate-200/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                  <Shield size={24} />
                </div>
                <h2 className="text-xl font-extrabold text-slate-800">تحديث الهويات</h2>
              </div>
              <p className="text-sm text-slate-500 font-bold leading-relaxed">
                تحديث أرقام الهوية للطلاب الحاليين بناءً على الاسم. استخدم هذا الخيار فقط عند الحاجة لتصحيح الهويات.
              </p>
              <div className="relative">
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  onChange={handleNationalIdImport}
                  className="hidden" 
                  id="id-upload"
                  disabled={importingNationalIds}
                />
                <label 
                  htmlFor="id-upload"
                  className={`w-full flex items-center justify-center gap-4 p-6 border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer hover:bg-slate-50 hover:border-amber-500/50 transition-all ${importingNationalIds ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload size={20} className="text-amber-600" />
                  <span className="font-extrabold text-slate-700">{importingNationalIds ? 'جاري التحديث...' : 'رفع ملف الهويات'}</span>
                </label>
              </div>
              {importNationalIdsResult && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-amber-600" size={18} />
                    <span className="text-xs font-black text-amber-800">تم تحديث {importNationalIdsResult.updated} طالب.</span>
                  </div>
                  {importNationalIdsResult.notFound > 0 && (
                    <span className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                      {importNationalIdsResult.notFound} لم يتم العثور عليهم
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-8 relative overflow-hidden shadow-2xl shadow-slate-900/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Lock className="text-primary" size={24} />
                  </div>
                  <h3 className="font-extrabold text-xl tracking-tight">تنبيهات الأمان والإدارة</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <AlertCircle className="text-amber-500" size={18} />
                    </div>
                    <p className="text-xs text-slate-300 font-bold leading-relaxed">
                      تغيير صلاحيات المستخدمين يؤثر فوراً على قدرتهم على الوصول للبيانات الحساسة. يرجى مراجعة الصلاحيات دورياً.
                    </p>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <Shield className="text-emerald-500" size={18} />
                    </div>
                    <p className="text-xs text-slate-300 font-bold leading-relaxed">
                      جميع عمليات الاستيراد والتعديل يتم تسجيلها في سجلات النظام لأغراض التدقيق والأمان.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowAddUser(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
          >
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                  <UserPlus size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-800">إضافة مستخدم جديد</h3>
              </div>
              <button onClick={() => setShowAddUser(false)} className="p-3 hover:bg-white rounded-2xl transition-colors shadow-sm">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-2">الاسم الكامل</label>
                <input 
                  type="text" 
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                  placeholder="أدخل اسم الموظف..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-2">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-2">كلمة المرور</label>
                  <input 
                    type="password" 
                    required
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-2">الدور الوظيفي</label>
                  <select 
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                  >
                    <option value="teacher">معلم</option>
                    <option value="vice_principal">وكيل</option>
                    <option value="counselor">موجه</option>
                    <option value="principal">مدير مدرسة</option>
                    <option value="admin">مدير نظام</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="sts-button-accent w-full py-5 rounded-2xl shadow-xl shadow-accent/20 mt-4">
                إنشاء الحساب الآن
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowUserModal(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden"
          >
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white text-primary rounded-[1.5rem] flex items-center justify-center text-2xl font-black shadow-sm border border-slate-100">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">{selectedUser.name}</h3>
                  <p className="text-slate-400 font-bold">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setShowUserModal(false)} className="p-4 hover:bg-white rounded-2xl transition-colors shadow-sm">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-10 space-y-10">
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Shield size={14} />
                    الدور والصلاحيات
                  </h4>
                  <select 
                    value={selectedUser.role}
                    onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                  >
                    <option value="teacher">معلم</option>
                    <option value="vice_principal">وكيل</option>
                    <option value="counselor">موجه</option>
                    <option value="principal">مدير مدرسة</option>
                    <option value="admin">مدير نظام</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Lock size={14} />
                    تغيير كلمة المرور
                  </h4>
                  <div className="flex gap-3">
                    <input 
                      type="password"
                      placeholder="كلمة مرور جديدة..."
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                      value={editingPasswordUserId === selectedUser.id ? newPassword : ''}
                      onChange={(e) => {
                        setEditingPasswordUserId(selectedUser.id);
                        setNewPassword(e.target.value);
                      }}
                    />
                    <button 
                      onClick={() => savePasswordUpdate(selectedUser.id)}
                      className="px-6 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                    >
                      تحديث
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Settings size={14} />
                    الصفوف المسندة للمستخدم
                  </h4>
                  <span className="text-[10px] bg-primary/5 text-primary px-3 py-1 rounded-full font-black">
                    {selectedUser.assigned_grades?.length || 0} صفوف
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {allGrades.map(grade => (
                    <button
                      key={grade}
                      onClick={() => toggleGrade(selectedUser.id, grade, selectedUser.assigned_grades || [])}
                      className={`py-3 px-4 rounded-xl text-xs font-black transition-all border ${
                        selectedUser.assigned_grades?.includes(grade)
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                          : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-primary/30'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showAddStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowAddStudent(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
          >
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <UserPlus size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-800">إضافة طالب جديد</h3>
              </div>
              <button onClick={() => setShowAddStudent(false)} className="p-3 hover:bg-white rounded-2xl transition-colors shadow-sm">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-2">اسم الطالب</label>
                <input 
                  type="text" 
                  required
                  value={newStudentForm.name}
                  onChange={(e) => setNewStudentForm({...newStudentForm, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                  placeholder="أدخل اسم الطالب الرباعي..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-2">رقم الهوية</label>
                <input 
                  type="text" 
                  required
                  value={newStudentForm.national_id}
                  onChange={(e) => setNewStudentForm({...newStudentForm, national_id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                  placeholder="1XXXXXXXXX"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-2">الصف</label>
                  <input 
                    type="text" 
                    required
                    value={newStudentForm.grade}
                    onChange={(e) => setNewStudentForm({...newStudentForm, grade: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    placeholder="مثال: الأول"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-2">الفصل</label>
                  <input 
                    type="text" 
                    required
                    value={newStudentForm.section}
                    onChange={(e) => setNewStudentForm({...newStudentForm, section: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    placeholder="مثال: 1"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black shadow-xl shadow-emerald-500/20 mt-4 hover:bg-emerald-600 transition-all">
                إضافة الطالب لقاعدة البيانات
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUserId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setDeletingUserId(null)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl relative z-10 text-center space-y-8"
          >
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-red-100">
              <Trash2 size={36} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800">حذف المستخدم؟</h3>
              <p className="text-sm text-slate-500 font-bold leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => deleteUser(deletingUserId)}
                className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
              >
                نعم، احذف
              </button>
              <button 
                onClick={() => setDeletingUserId(null)}
                className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
