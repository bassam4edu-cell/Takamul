import { apiFetch } from '../utils/api';
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
import SchoolUsers from './SchoolUsers';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingPasswordUserId, setEditingPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [allGrades, setAllGrades] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [studentEditForm, setStudentEditForm] = useState({ name: '', national_id: '', grade: '', section: '', parent_phone: '' });
  const [studentSearch, setStudentSearch] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'teacher' });
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudentCell, setEditingStudentCell] = useState<{ id: number, field: string } | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [clearExistingBeforeImport, setClearExistingBeforeImport] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'students' | 'settings'>('users');

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
      const res = await apiFetch('/api/admin/students');
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
      const res = await apiFetch('/api/admin/students/import', {
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
      const res = await apiFetch('/api/students');
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
      const res = await apiFetch('/api/admin/users');
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
      const res = await apiFetch(`/api/admin/users/${userId}/role`, {
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
      const res = await apiFetch(`/api/admin/users/${userId}/update`, {
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
      const res = await apiFetch(`/api/admin/users/${userId}/password`, {
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
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(null);
  const [deletingGrade, setDeletingGrade] = useState<string | null>(null);
  const [deletingSection, setDeletingSection] = useState<string | null>(null);
  const [deletingAllStudents, setDeletingAllStudents] = useState(false);
  const [deletingAllUsers, setDeletingAllUsers] = useState(false);

  const deleteAllStudents = async () => {
    setDeletingAllStudents(false);
    try {
      const res = await apiFetch('/api/admin/database/students/delete', { method: 'POST' });
      if (res.ok) {
        fetchStudents();
      } else {
        alert('فشل حذف قاعدة بيانات الطلاب');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  const deleteAllUsers = async () => {
    setDeletingAllUsers(false);
    try {
      const res = await apiFetch('/api/admin/database/users/delete', { method: 'POST' });
      if (res.ok) {
        fetchUsers();
      } else {
        alert('فشل حذف المستخدمين');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  const deleteUser = (userId: number) => {
    setDeletingUserId(null);
    apiFetch(`/api/admin/users/${userId}/delete`, {
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
      const res = await apiFetch('/api/admin/grades/delete', {
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

  const deleteSection = async (grade: string, section: string) => {
    setDeletingSection(null);
    try {
      const res = await apiFetch('/api/admin/classes/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, section }),
      });
      if (res.ok) {
        fetchStudents();
        fetchGrades();
        fetchUsers();
        setSelectedSectionFilter('');
      } else {
        const data = await res.json().catch(() => ({ error: 'فشل حذف الفصل' }));
        alert(data.error || 'فشل حذف الفصل');
      }
    } catch (err) {
      alert('حدث خطأ أثناء حذف الفصل');
    }
  };

  const saveStudentUpdate = async (id: number) => {
    try {
      const res = await apiFetch(`/api/admin/students/${id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentEditForm),
      });
      if (res.ok) {
        fetchStudents();
        setEditingStudentId(null);
        setShowStudentModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveInlineEdit = async (id: number, field: string, value: string) => {
    try {
      const student = students.find(s => s.id === id);
      if (!student) return;
      
      const updatedData = {
        name: student.name,
        national_id: student.national_id,
        grade: student.grade,
        section: student.section,
        parent_phone: student.parent_phone,
        [field]: value
      };

      const res = await apiFetch(`/api/admin/students/${id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      
      if (res.ok) {
        fetchStudents();
        setEditingStudentCell(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInlineEditKeyDown = (e: React.KeyboardEvent, id: number, field: string) => {
    if (e.key === 'Enter') {
      saveInlineEdit(id, field, inlineEditValue);
    } else if (e.key === 'Escape') {
      setEditingStudentCell(null);
    }
  };

  const deleteStudent = async (id: number) => {
    setDeletingStudentId(null);
    try {
      const res = await apiFetch(`/api/admin/students/${id}`, {
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
      section: student.section,
      parent_phone: student.parent_phone || ''
    });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/admin/users/create', {
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
      const res = await apiFetch(`/api/admin/users/${userId}/toggle-status`, {
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
    
    // Optimistic update for UI responsiveness
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser({ ...selectedUser, assigned_grades: newGrades });
    }
    
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: newGrades }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        // Revert on error
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({ ...selectedUser, assigned_grades: currentGrades });
        }
        const data = await res.json().catch(() => ({ error: 'فشل تحديث الصفوف المسندة' }));
        alert(data.error || 'فشل تحديث الصفوف المسندة');
      }
    } catch (err) {
      console.error(err);
      // Revert on error
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, assigned_grades: currentGrades });
      }
      alert('حدث خطأ أثناء تحديث الصفوف المسندة');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportProgress(10);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setImportProgress(30);
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        let headerRowIndex = -1;
        let targetRows: any[][] = [];

        // Find header row across all sheets
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          for (let i = 0; i < Math.min(rows.length, 20); i++) {
            const row = rows[i];
            if (!row) continue;
            const rowStr = row.join(' ').replace(/\s+/g, ' ');
            if ((rowStr.includes('رقم الطالب') || rowStr.includes('الهوية')) && 
                (rowStr.includes('اسم الطالب') || rowStr.includes('الاسم'))) {
              headerRowIndex = i;
              targetRows = rows;
              break;
            }
          }
          if (headerRowIndex !== -1) break;
        }

        console.log('Raw Excel Rows:', targetRows);
        setImportProgress(50);

        if (headerRowIndex === -1) {
          alert('لم يتم العثور على ترويسة الأعمدة (رقم الطالب أو الهوية، واسم الطالب) في أي ورقة عمل. يرجى التأكد من صيغة الملف.');
          setImporting(false);
          setImportProgress(0);
          return;
        }

        const headerRow = targetRows[headerRowIndex];
        
        // Find column indices
        const getColIndex = (keywords: string[]) => {
          return headerRow.findIndex(col => {
            if (!col) return false;
            const colStr = String(col).trim();
            return keywords.some(kw => colStr.includes(kw));
          });
        };

        const idCol = getColIndex(['رقم الطالب', 'الهوية', 'رقم الهوية']);
        const nameCol = getColIndex(['اسم الطالب', 'الاسم']);
        const gradeCol = getColIndex(['الصف']);
        const sectionCol = getColIndex(['الفصل']);
        const phoneCol = getColIndex(['جوال الطالب', 'رقم الجوال', 'الجوال', 'هاتف']);

        if (nameCol === -1) {
          alert('لم يتم العثور على عمود "اسم الطالب".');
          setImporting(false);
          setImportProgress(0);
          return;
        }

        const sanitizePhone = (phone: any) => {
          if (!phone) return null;
          let p = String(phone).replace(/\s+/g, '').trim();
          if (p.startsWith('05')) {
            p = '9665' + p.substring(2);
          }
          return p;
        };

        const noorGradeMapper: Record<string, string> = {
          "1314": "أول ثانوي",
          "1416": "ثاني ثانوي",
          "1516": "ثالث ثانوي"
        };

        const students = targetRows.slice(headerRowIndex + 1).map(row => {
          const name = row[nameCol];
          const national_id = idCol !== -1 ? row[idCol] : null;
          let grade = gradeCol !== -1 ? row[gradeCol] : null;
          const section = sectionCol !== -1 ? row[sectionCol] : null;
          const parent_phone = phoneCol !== -1 ? row[phoneCol] : null;

          if (grade) {
            const gradeStr = String(grade).trim();
            grade = noorGradeMapper[gradeStr] || gradeStr;
          }

          return {
            name: name ? String(name).trim() : null,
            national_id: national_id ? String(national_id).trim() : null,
            grade: grade ? String(grade).trim() : null,
            section: section ? String(section).trim() : null,
            parent_phone: sanitizePhone(parent_phone)
          };
        }).filter(s => s.name); // only require name

        console.log('Processed students for import:', students);
        setImportProgress(70);

        if (students.length === 0) {
          alert('لم يتم العثور على بيانات طلاب صالحة في الملف.');
          setImporting(false);
          setImportProgress(0);
          return;
        }

        const res = await apiFetch('/api/admin/students/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            students,
            clearExisting: clearExistingBeforeImport 
          }),
        });
        
        setImportProgress(90);
        const result = await res.json().catch(() => ({ success: false, error: 'استجابة غير صالحة من السيرفر' }));
        if (result.success) {
          setImportProgress(100);
          setImportSuccess(result.count);
          fetchGrades(); // Refresh grades list
          fetchStudents(); // Refresh students list
          setTimeout(() => {
            setImportSuccess(null);
            setImportProgress(0);
          }, 5000);
        } else {
          alert('فشل استيراد البيانات: ' + (result.error || 'خطأ غير معروف'));
          setImportProgress(0);
        }
      } catch (err) {
        console.error('File upload error:', err);
        alert('حدث خطأ أثناء قراءة الملف: ' + (err instanceof Error ? err.message : String(err)));
        setImportProgress(0);
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

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl w-max mb-8">
        <button 
          onClick={() => setActiveTab('users')} 
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
        >
          <UserCog size={18} />
          إدارة المستخدمين
        </button>
        <button 
          onClick={() => setActiveTab('students')} 
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'students' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
        >
          <Users size={18} />
          قاعدة بيانات الطلاب
        </button>
        <button 
          onClick={() => setActiveTab('settings')} 
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
        >
          <Settings size={18} />
          إعدادات النظام
        </button>
      </div>

      <div className="space-y-12">
        {activeTab === 'users' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SchoolUsers />
          </motion.div>
        )}

        {activeTab === 'students' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                  <Users size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    قاعدة بيانات الطلاب
                  </h2>
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

                  {deletingGrade === selectedGradeFilter && selectedGradeFilter && !selectedSectionFilter ? (
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
                    selectedGradeFilter && !selectedSectionFilter && (
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

                  {deletingSection === selectedSectionFilter && selectedSectionFilter && selectedGradeFilter ? (
                    <div className="flex items-center gap-3 bg-red-50 px-4 py-2 rounded-2xl border border-red-100 animate-pulse">
                      <span className="text-xs font-extrabold text-red-600">حذف الفصل بجميع طلابه؟</span>
                      <button 
                        onClick={() => deleteSection(selectedGradeFilter, selectedSectionFilter)}
                        className="bg-red-600 text-white px-4 py-1.5 rounded-xl text-xs font-extrabold hover:bg-red-700 shadow-sm"
                      >
                        نعم
                      </button>
                      <button 
                        onClick={() => setDeletingSection(null)}
                        className="bg-slate-200 text-slate-600 px-4 py-1.5 rounded-xl text-xs font-extrabold hover:bg-slate-300"
                      >
                        لا
                      </button>
                    </div>
                  ) : (
                    selectedSectionFilter && selectedGradeFilter && (
                      <button 
                        onClick={() => setDeletingSection(selectedSectionFilter)}
                        className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-2xl text-xs font-extrabold hover:bg-red-100 transition-all border border-red-100"
                        title="حذف هذا الفصل بالكامل"
                      >
                        <Trash2 size={16} />
                        <span>حذف الفصل</span>
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
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">
                      <th className="px-8 py-6">الطالب</th>
                      <th className="px-8 py-6">رقم الهوية</th>
                      <th className="px-8 py-6">الصف والفصل</th>
                      <th className="px-8 py-6">رقم الجوال</th>
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
                        return <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold">لم يتم العثور على نتائج</td></tr>;
                      }

                      return filtered.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/20 transition-all group">
                          <td 
                            className="px-8 py-6 cursor-pointer"
                            onDoubleClick={() => {
                              setEditingStudentCell({ id: s.id, field: 'name' });
                              setInlineEditValue(s.name);
                            }}
                          >
                            {editingStudentCell?.id === s.id && editingStudentCell?.field === 'name' ? (
                              <input 
                                type="text"
                                autoFocus
                                value={inlineEditValue}
                                onChange={(e) => setInlineEditValue(e.target.value)}
                                onKeyDown={(e) => handleInlineEditKeyDown(e, s.id, 'name')}
                                onBlur={() => saveInlineEdit(s.id, 'name', inlineEditValue)}
                                className="bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-bold w-full"
                              />
                            ) : (
                              <span className="font-extrabold text-slate-800">{s.name}</span>
                            )}
                          </td>
                          <td 
                            className="px-8 py-6 cursor-pointer"
                            onDoubleClick={() => {
                              setEditingStudentCell({ id: s.id, field: 'national_id' });
                              setInlineEditValue(s.national_id);
                            }}
                          >
                            {editingStudentCell?.id === s.id && editingStudentCell?.field === 'national_id' ? (
                              <input 
                                type="text"
                                autoFocus
                                value={inlineEditValue}
                                onChange={(e) => setInlineEditValue(e.target.value)}
                                onKeyDown={(e) => handleInlineEditKeyDown(e, s.id, 'national_id')}
                                onBlur={() => saveInlineEdit(s.id, 'national_id', inlineEditValue)}
                                className="bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-bold w-full"
                              />
                            ) : (
                              <span className="text-slate-500 font-mono font-bold">{s.national_id}</span>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{s.grade}</span>
                              <span className="px-3 py-1 bg-primary/5 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest">{s.section}</span>
                            </div>
                          </td>
                          <td 
                            className="px-8 py-6 cursor-pointer"
                            onDoubleClick={() => {
                              setEditingStudentCell({ id: s.id, field: 'parent_phone' });
                              setInlineEditValue(s.parent_phone || '');
                            }}
                          >
                            {editingStudentCell?.id === s.id && editingStudentCell?.field === 'parent_phone' ? (
                              <input 
                                type="text"
                                autoFocus
                                value={inlineEditValue}
                                onChange={(e) => setInlineEditValue(e.target.value)}
                                onKeyDown={(e) => handleInlineEditKeyDown(e, s.id, 'parent_phone')}
                                onBlur={() => saveInlineEdit(s.id, 'parent_phone', inlineEditValue)}
                                className="bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-bold w-full"
                              />
                            ) : (
                              <span className="text-slate-500 font-mono font-bold">{s.parent_phone || '—'}</span>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setSelectedStudent(s);
                                  setStudentEditForm({
                                    name: s.name,
                                    national_id: s.national_id,
                                    grade: s.grade,
                                    section: s.section,
                                    parent_phone: s.parent_phone || ''
                                  });
                                  setShowStudentModal(true);
                                }}
                                className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title="إدارة الحساب"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => setDeletingStudentId(s.id)}
                                className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title="مسح السجل"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden flex flex-col divide-y divide-slate-100">
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
                    return <div className="p-8 text-center text-slate-400 font-bold">لم يتم العثور على نتائج</div>;
                  }

                  return filtered.map((s) => (
                    <div key={s.id} className="p-4 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {editingStudentCell?.id === s.id && editingStudentCell?.field === 'name' ? (
                            <input 
                              type="text"
                              autoFocus
                              value={inlineEditValue}
                              onChange={(e) => setInlineEditValue(e.target.value)}
                              onKeyDown={(e) => handleInlineEditKeyDown(e, s.id, 'name')}
                              onBlur={() => saveInlineEdit(s.id, 'name', inlineEditValue)}
                              className="bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-bold w-full"
                            />
                          ) : (
                            <h3 
                              className="font-extrabold text-slate-800 text-base cursor-pointer"
                              onDoubleClick={() => {
                                setEditingStudentCell({ id: s.id, field: 'name' });
                                setInlineEditValue(s.name);
                              }}
                            >
                              {s.name}
                            </h3>
                          )}
                          
                          <div className="mt-2 flex items-center gap-2">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{s.grade}</span>
                            <span className="px-2 py-1 bg-primary/5 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest">{s.section}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500 block mb-1 text-xs">رقم الهوية</span>
                          {editingStudentCell?.id === s.id && editingStudentCell?.field === 'national_id' ? (
                            <input 
                              type="text"
                              autoFocus
                              value={inlineEditValue}
                              onChange={(e) => setInlineEditValue(e.target.value)}
                              onKeyDown={(e) => handleInlineEditKeyDown(e, s.id, 'national_id')}
                              onBlur={() => saveInlineEdit(s.id, 'national_id', inlineEditValue)}
                              className="bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-bold w-full"
                            />
                          ) : (
                            <span 
                              className="font-mono font-bold text-slate-700 cursor-pointer"
                              onDoubleClick={() => {
                                setEditingStudentCell({ id: s.id, field: 'national_id' });
                                setInlineEditValue(s.national_id);
                              }}
                            >
                              {s.national_id}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-1 text-xs">رقم الجوال</span>
                          {editingStudentCell?.id === s.id && editingStudentCell?.field === 'parent_phone' ? (
                            <input 
                              type="text"
                              autoFocus
                              value={inlineEditValue}
                              onChange={(e) => setInlineEditValue(e.target.value)}
                              onKeyDown={(e) => handleInlineEditKeyDown(e, s.id, 'parent_phone')}
                              onBlur={() => saveInlineEdit(s.id, 'parent_phone', inlineEditValue)}
                              className="bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-bold w-full"
                            />
                          ) : (
                            <span 
                              className="font-mono font-bold text-slate-700 cursor-pointer"
                              onDoubleClick={() => {
                                setEditingStudentCell({ id: s.id, field: 'parent_phone' });
                                setInlineEditValue(s.parent_phone || '');
                              }}
                            >
                              {s.parent_phone || '—'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                        <button 
                          onClick={() => {
                            setSelectedStudent(s);
                            setStudentEditForm({
                              name: s.name,
                              national_id: s.national_id,
                              grade: s.grade,
                              section: s.section,
                              parent_phone: s.parent_phone || ''
                            });
                            setShowStudentModal(true);
                          }}
                          className="flex-1 py-2 text-slate-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors text-sm font-bold flex items-center justify-center gap-2 min-h-[44px]"
                        >
                          <Edit2 size={16} />
                          تعديل
                        </button>
                        <button 
                          onClick={() => setDeletingStudentId(s.id)}
                          className="flex-1 py-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-bold flex items-center justify-center gap-2 min-h-[44px]"
                        >
                          <Trash2 size={16} />
                          حذف
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10"
          >
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
                {importing && (
                  <div className="w-full max-w-md mt-4">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${importProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-center text-xs font-bold text-slate-500 mt-2">{importProgress}%</p>
                  </div>
                )}
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
                  النظام يستخدم رقم الهوية كمفتاح فريد. إذا كان الطالب موجوداً مسبقاً، سيتم تحديث بياناته (الصف، الفصل، الجوال)، وإذا كان جديداً سيتم إضافته.
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
                  يجب أن يحتوي الملف على الأعمدة التالية بدقة: <span className="text-primary font-black">اسم الطالب، رقم الطالب، الصف، الفصل، جوال الطالب</span>.
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
                    <p className="text-emerald-100 text-xs font-bold">تم استيراد بيانات {importSuccess} طالب من نظام نور بنجاح.</p>
                  </div>
                </div>
                <button onClick={() => setImportSuccess(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </motion.div>
            )}
          </div>
          </div>

          {/* Quick Actions & Stats */}
          <div className="space-y-8">
            <div className="sts-card p-10 space-y-6 border-none shadow-2xl shadow-slate-200/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                  <Trash2 size={24} />
                </div>
                <h2 className="text-xl font-extrabold text-slate-800">إدارة قواعد البيانات</h2>
              </div>
              <p className="text-sm text-slate-500 font-bold leading-relaxed">
                استخدم هذه الخيارات بحذر شديد. حذف قواعد البيانات إجراء لا يمكن التراجع عنه وسيؤدي إلى مسح جميع السجلات المرتبطة.
              </p>
              
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex flex-col gap-3">
                  {deletingAllStudents ? (
                    <div className="flex items-center justify-between bg-red-50 p-4 rounded-2xl border border-red-100 animate-pulse">
                      <span className="text-sm font-extrabold text-red-600">هل أنت متأكد من حذف جميع الطلاب؟</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={deleteAllStudents}
                          className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-red-700 shadow-sm"
                        >
                          نعم، احذف
                        </button>
                        <button 
                          onClick={() => setDeletingAllStudents(false)}
                          className="bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-slate-300"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setDeletingAllStudents(true)}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-extrabold hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={18} />
                      <span>حذف قاعدة بيانات الطلاب بالكامل</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {deletingAllUsers ? (
                    <div className="flex items-center justify-between bg-red-50 p-4 rounded-2xl border border-red-100 animate-pulse">
                      <span className="text-sm font-extrabold text-red-600">هل أنت متأكد من حذف جميع المستخدمين؟</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={deleteAllUsers}
                          className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-red-700 shadow-sm"
                        >
                          نعم، احذف
                        </button>
                        <button 
                          onClick={() => setDeletingAllUsers(false)}
                          className="bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-slate-300"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setDeletingAllUsers(true)}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-extrabold hover:bg-red-50 transition-all"
                    >
                      <Users size={18} />
                      <span>حذف جميع المستخدمين (باستثناء الإدارة)</span>
                    </button>
                  )}
                </div>
              </div>
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
          </motion.div>
        )}
      </div>

      {/* Modals */}
      {showAddUser && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddUser(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-white w-full max-w-md h-full shadow-2xl relative z-10 flex flex-col overflow-hidden border-l border-slate-100"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">إضافة مستخدم جديد</h3>
                  <p className="text-slate-400 text-xs font-bold mt-1">إنشاء حساب جديد في النظام</p>
                </div>
              </div>
              <button onClick={() => setShowAddUser(false)} className="p-3 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <form onSubmit={handleAddUser} className="space-y-6">
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
                <div className="pt-4">
                  <button type="submit" className="sts-button-accent w-full py-5 rounded-2xl shadow-xl shadow-accent/20">
                    إنشاء الحساب الآن
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUserModal(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-white w-full max-w-md h-full shadow-2xl relative z-10 flex flex-col overflow-hidden border-l border-slate-100"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white text-primary rounded-2xl flex items-center justify-center text-xl font-black shadow-sm border border-slate-100">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">{selectedUser.name}</h3>
                  <p className="text-slate-400 text-xs font-bold mt-1">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setShowUserModal(false)} className="p-3 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Settings size={14} />
                    الصفوف المسندة
                  </h4>
                  <span className="text-[10px] bg-primary/5 text-primary px-3 py-1 rounded-full font-black">
                    {selectedUser.assigned_grades?.length || 0} صفوف
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {allGrades.map(grade => {
                    const isSelected = selectedUser.assigned_grades?.includes(grade);
                    return (
                      <button
                        key={grade}
                        onClick={() => toggleGrade(selectedUser.id, grade, selectedUser.assigned_grades || [])}
                        className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
                          isSelected
                            ? 'bg-primary/5 border-primary/20 shadow-sm'
                            : 'bg-white border-slate-100 hover:border-primary/20 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                          {grade}
                        </span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-300'
                        }`}>
                          <Check size={14} className={isSelected ? 'opacity-100' : 'opacity-0'} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-slate-100 bg-slate-50/50">
              <button 
                onClick={() => setShowUserModal(false)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStudentModal(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-white w-full max-w-md h-full shadow-2xl relative z-10 flex flex-col overflow-hidden border-l border-slate-100"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white text-primary rounded-2xl flex items-center justify-center text-xl font-black shadow-sm border border-slate-100">
                  {studentEditForm.name.charAt(0) || 'ط'}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">تعديل بيانات الطالب</h3>
                  <p className="text-slate-400 text-xs font-bold mt-1">{studentEditForm.national_id}</p>
                </div>
              </div>
              <button onClick={() => setShowStudentModal(false)} className="p-3 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">اسم الطالب</label>
                <input 
                  type="text"
                  value={studentEditForm.name}
                  onChange={(e) => setStudentEditForm({...studentEditForm, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">رقم الهوية</label>
                <input 
                  type="text"
                  value={studentEditForm.national_id}
                  onChange={(e) => setStudentEditForm({...studentEditForm, national_id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">الصف</label>
                  <input 
                    type="text"
                    value={studentEditForm.grade}
                    onChange={(e) => setStudentEditForm({...studentEditForm, grade: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">الفصل</label>
                  <input 
                    type="text"
                    value={studentEditForm.section}
                    onChange={(e) => setStudentEditForm({...studentEditForm, section: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">رقم الجوال</label>
                <input 
                  type="text"
                  value={studentEditForm.parent_phone}
                  onChange={(e) => setStudentEditForm({...studentEditForm, parent_phone: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold font-mono"
                  placeholder="05XXXXXXXX"
                />
              </div>
            </div>
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button 
                onClick={() => saveStudentUpdate(selectedStudent.id)}
                className="flex-1 py-4 bg-primary text-white rounded-2xl font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                حفظ التعديلات
              </button>
              <button 
                onClick={() => setShowStudentModal(false)}
                className="px-6 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black hover:bg-slate-50 transition-all"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showAddStudent && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddStudent(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-white w-full max-w-md h-full shadow-2xl relative z-10 flex flex-col overflow-hidden border-l border-slate-100"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">إضافة طالب جديد</h3>
                  <p className="text-slate-400 text-xs font-bold mt-1">إدخال بيانات طالب جديد للنظام</p>
                </div>
              </div>
              <button onClick={() => setShowAddStudent(false)} className="p-3 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <form onSubmit={handleAddStudent} className="space-y-6">
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
              <div className="pt-4">
                <button type="submit" className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all">
                  إضافة الطالب لقاعدة البيانات
                </button>
              </div>
            </form>
            </div>
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

      {deletingStudentId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setDeletingStudentId(null)}
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
              <h3 className="text-xl font-black text-slate-800">مسح السجل؟</h3>
              <p className="text-sm text-slate-500 font-bold leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا الطالب؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => deleteStudent(deletingStudentId)}
                className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
              >
                تأكيد الحذف
              </button>
              <button 
                onClick={() => setDeletingStudentId(null)}
                className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all"
              >
                إلغاء الأمر
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
