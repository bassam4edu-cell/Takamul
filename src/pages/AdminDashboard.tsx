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
  X
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

  useEffect(() => {
    fetchUsers();
    fetchGrades();
  }, []);

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
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      // Map Excel columns to student object
      const students = data.map(row => ({
        name: row.Name || row['الاسم'] || row.name,
        national_id: row['National ID'] || row['رقم الهوية'] || row.national_id,
        grade: row.Grade || row['الصف'] || row.grade,
        section: row.Section || row['الفصل'] || row.section
      })).filter(s => s.name && s.grade && s.section);

      if (students.length > 0) {
        try {
          const res = await fetch('/api/admin/students/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ students }),
          });
          const result = await res.json();
          if (result.success) {
            setImportSuccess(result.count);
            setTimeout(() => setImportSuccess(null), 5000);
          }
        } catch (err) {
          console.error(err);
        }
      }
      setImporting(false);
    };
    reader.readAsBinaryString(file);
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
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="بحث عن مستخدم..." 
                  className="bg-slate-50 border border-slate-100 rounded-xl py-2 pr-10 pl-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            </div>

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
                        </td>
                        <td className="px-8 py-4">
                          {editingUserId === u.id ? (
                            <input 
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          ) : (
                            <span className="text-slate-500 text-sm">{u.email}</span>
                          )}
                        </td>
                        <td className="px-8 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            u.role === 'vice_principal' ? 'bg-red-50 text-red-700 border-red-100' :
                            u.role === 'counselor' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {getRoleLabel(u.role)}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {allGrades.map(g => (
                              <button
                                key={g}
                                onClick={() => toggleGrade(u.id, g, u.assigned_grades || [])}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all border ${
                                  (u.assigned_grades || []).includes(g)
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300'
                                }`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-2">
                            <select 
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
                            >
                              <option value="teacher">معلم</option>
                              <option value="vice_principal">وكيل</option>
                              <option value="counselor">موجه</option>
                              <option value="admin">مدير نظام</option>
                            </select>
                            {editingUserId === u.id ? (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => saveUserUpdate(u.id)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                  title="حفظ"
                                >
                                  <Save size={16} />
                                </button>
                                <button 
                                  onClick={cancelEditing}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="إلغاء"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => startEditing(u)}
                                className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-all"
                                title="تعديل البيانات"
                              >
                                <Edit2 size={16} />
                              </button>
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
