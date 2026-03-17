import { apiFetch } from '../utils/api';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../App';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Search,
  Edit2,
  Trash2,
  Lock,
  GraduationCap,
  Briefcase,
  Compass,
  Crown,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { User } from '../types';

const SchoolUsers: React.FC = React.memo(() => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'teacher' | 'vice_principal' | 'counselor' | 'principal'>('teacher');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'teacher' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserForm, setEditUserForm] = useState({ id: 0, name: '', email: '', role: 'teacher' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ id: 0, password: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [showAssignGradesModal, setShowAssignGradesModal] = useState(false);
  const [assignGradesUserId, setAssignGradesUserId] = useState<number | null>(null);
  const [allGrades, setAllGrades] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const res = await apiFetch('/api/attendance/grades');
      if (res.ok) {
        const data = await res.json();
        setAllGrades(data);
      }
    } catch (err) {
      console.error('Failed to fetch grades:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiFetch('/api/admin/users', {
        headers: { 'x-school-id': user?.schoolId?.toString() || '' }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesRole = u.role === activeTab;
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, activeTab, searchQuery]);

  const getRoleCount = (role: string) => users.filter(u => u.role === role).length;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-school-id': user?.schoolId?.toString() || ''
        },
        body: JSON.stringify(newUserForm),
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/admin/users/${editUserForm.id}/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-school-id': user?.schoolId?.toString() || ''
        },
        body: JSON.stringify({ name: editUserForm.name, email: editUserForm.email }),
      });
      if (res.ok) {
        // Also update role if changed
        const roleRes = await apiFetch(`/api/admin/users/${editUserForm.id}/role`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-school-id': user?.schoolId?.toString() || ''
          },
          body: JSON.stringify({ role: editUserForm.role }),
        });
        if (roleRes.ok) {
          setShowEditModal(false);
          fetchUsers();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/admin/users/${passwordForm.id}/password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-school-id': user?.schoolId?.toString() || ''
        },
        body: JSON.stringify({ password: passwordForm.password }),
      });
      if (res.ok) {
        setShowPasswordModal(false);
        setPasswordForm({ id: 0, password: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId) return;
    try {
      const res = await apiFetch(`/api/admin/users/${deletingUserId}/delete`, {
        method: 'POST',
        headers: { 'x-school-id': user?.schoolId?.toString() || '' }
      });
      if (res.ok) {
        setShowDeleteModal(false);
        setDeletingUserId(null);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleUserStatus = async (userId: number) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'POST',
        headers: { 'x-school-id': user?.schoolId?.toString() || '' }
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleGradeSelection = (grade: string) => {
    setSelectedGrades(prev => 
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
  };

  const handleAssignGrades = async () => {
    if (!assignGradesUserId) return;
    try {
      const res = await apiFetch(`/api/admin/users/${assignGradesUserId}/grades`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-school-id': user?.schoolId?.toString() || ''
        },
        body: JSON.stringify({ grades: selectedGrades }),
      });
      if (res.ok) {
        setShowAssignGradesModal(false);
        setAssignGradesUserId(null);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'teacher', label: 'المعلمون', icon: GraduationCap, count: getRoleCount('teacher') },
    { id: 'vice_principal', label: 'الوكلاء', icon: Briefcase, count: getRoleCount('vice_principal') },
    { id: 'counselor', label: 'الموجه الطلابي', icon: Compass, count: getRoleCount('counselor') },
    { id: 'principal', label: 'الإدارة', icon: Crown, count: getRoleCount('principal') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">إدارة منسوبي المدرسة</h2>
            <p className="text-sm text-slate-500">إدارة حسابات وصلاحيات الطاقم التعليمي والإداري</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setNewUserForm({ ...newUserForm, role: activeTab });
            setShowAddModal(true);
          }}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
        >
          <UserPlus size={20} />
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 bg-slate-100/50 p-1.5 rounded-2xl">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Icon size={18} />
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                isActive ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="البحث بالاسم أو البريد الإلكتروني..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">الاسم</th>
                <th className="px-6 py-4">البريد الإلكتروني / اسم المستخدم</th>
                <th className="px-6 py-4">حالة الحساب</th>
                {activeTab === 'teacher' && <th className="px-6 py-4">الفصول المسندة</th>}
                {(activeTab === 'vice_principal' || activeTab === 'counselor') && <th className="px-6 py-4">الصلاحيات</th>}
                <th className="px-6 py-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">جاري التحميل...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">لا يوجد مستخدمين في هذا القسم</td></tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{u.name}</td>
                    <td className="px-6 py-4 text-slate-500" dir="ltr">{u.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => toggleUserStatus(u.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none min-h-[44px] min-w-[44px] ${
                            u.is_active !== false ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              u.is_active !== false ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                    {activeTab === 'teacher' && (
                      <td className="px-6 py-4 text-slate-500">
                        {u.assigned_grades?.join('، ') || 'غير محدد'}
                      </td>
                    )}
                    {(activeTab === 'vice_principal' || activeTab === 'counselor') && (
                      <td className="px-6 py-4 text-slate-500">
                        {activeTab === 'vice_principal' ? 'شؤون طلاب' : 'توجيه وإرشاد'}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {activeTab === 'teacher' && (
                          <button 
                            onClick={() => {
                              setAssignGradesUserId(u.id);
                              setSelectedGrades(u.assigned_grades || []);
                              setShowAssignGradesModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="إسناد الفصول"
                          >
                            <GraduationCap size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setEditUserForm({ id: u.id, name: u.name, email: u.email, role: u.role });
                            setShowEditModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="تعديل المستخدم"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            setPasswordForm({ id: u.id, password: '' });
                            setShowPasswordModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="تغيير كلمة المرور"
                        >
                          <Lock size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            setDeletingUserId(u.id);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="حذف المستخدم"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-400">جاري التحميل...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400">لا يوجد مستخدمين في هذا القسم</div>
          ) : (
            filteredUsers.map(u => (
              <div key={u.id} className="p-4 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{u.name}</h3>
                    <p className="text-sm text-slate-500 mt-1" dir="ltr">{u.email}</p>
                  </div>
                  <button 
                    onClick={() => toggleUserStatus(u.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none min-h-[44px] min-w-[44px] ${
                      u.is_active !== false ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        u.is_active !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {activeTab === 'teacher' && (
                  <div className="text-sm">
                    <span className="text-slate-500">الفصول المسندة: </span>
                    <span className="font-bold text-slate-700">{u.assigned_grades?.join('، ') || 'غير محدد'}</span>
                  </div>
                )}
                
                {(activeTab === 'vice_principal' || activeTab === 'counselor') && (
                  <div className="text-sm">
                    <span className="text-slate-500">الصلاحيات: </span>
                    <span className="font-bold text-slate-700">{activeTab === 'vice_principal' ? 'شؤون طلاب' : 'توجيه وإرشاد'}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                  <button 
                    onClick={() => {
                      setEditUserForm({ id: u.id, name: u.name, email: u.email, role: u.role });
                      setShowEditModal(true);
                    }}
                    className="flex-1 py-2 text-slate-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors text-sm font-bold flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <Edit2 size={16} />
                    تعديل
                  </button>
                  <button 
                    onClick={() => {
                      setPasswordForm({ id: u.id, password: '' });
                      setShowPasswordModal(true);
                    }}
                    className="flex-1 py-2 text-slate-600 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-colors text-sm font-bold flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <Lock size={16} />
                    كلمة المرور
                  </button>
                  <button 
                    onClick={() => {
                      setDeletingUserId(u.id);
                      setShowDeleteModal(true);
                    }}
                    className="flex-1 py-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-bold flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <Trash2 size={16} />
                    حذف
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">إضافة مستخدم جديد</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الاسم الرباعي</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={e => setNewUserForm({...newUserForm, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">البريد الإلكتروني / اسم المستخدم</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={e => setNewUserForm({...newUserForm, email: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={e => setNewUserForm({...newUserForm, password: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الدور الوظيفي</label>
                <select
                  value={newUserForm.role}
                  onChange={e => setNewUserForm({...newUserForm, role: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  <option value="teacher">معلم</option>
                  <option value="vice_principal">وكيل</option>
                  <option value="counselor">موجه طلابي</option>
                  <option value="principal">مدير مدرسة</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold transition-colors">
                  حفظ وإضافة
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors">
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">تعديل المستخدم</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الاسم الرباعي</label>
                <input
                  type="text"
                  required
                  value={editUserForm.name}
                  onChange={e => setEditUserForm({...editUserForm, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">البريد الإلكتروني / اسم المستخدم</label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={e => setEditUserForm({...editUserForm, email: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الدور الوظيفي</label>
                <select
                  value={editUserForm.role}
                  onChange={e => setEditUserForm({...editUserForm, role: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  <option value="teacher">معلم</option>
                  <option value="vice_principal">وكيل</option>
                  <option value="counselor">موجه طلابي</option>
                  <option value="principal">مدير مدرسة</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold transition-colors">
                  حفظ التعديلات
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors">
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">تغيير كلمة المرور</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  value={passwordForm.password}
                  onChange={e => setPasswordForm({...passwordForm, password: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold transition-colors">
                  حفظ كلمة المرور
                </button>
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors">
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Assign Grades Modal */}
      {showAssignGradesModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">إسناد الفصول</h3>
              <button onClick={() => setShowAssignGradesModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {allGrades.length === 0 ? (
                <div className="text-center text-slate-500 py-4">لا توجد فصول متاحة للإسناد</div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {allGrades.map(grade => {
                    const isSelected = selectedGrades.includes(grade);
                    return (
                      <button
                        key={grade}
                        onClick={() => toggleGradeSelection(grade)}
                        className={`flex items-center justify-between p-4 rounded-xl transition-all border ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                            : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`font-bold text-sm ${isSelected ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {grade}
                        </span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'
                        }`}>
                          {isSelected && <span className="text-xs">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={handleAssignGrades} 
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold transition-colors"
                >
                  حفظ الإسناد
                </button>
                <button 
                  onClick={() => setShowAssignGradesModal(false)} 
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 text-center"
          >
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">تأكيد الحذف</h3>
            <p className="text-slate-500 mb-6">
              هل أنت متأكد من رغبتك في حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={handleDeleteUser}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-colors"
              >
                نعم، احذف المستخدم
              </button>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
});

export default SchoolUsers;
