import { apiFetch } from '../utils/api';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { logAction } from '../services/auditLogger';
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
  X,
  CheckCircle,
  XCircle,
  Clock,
  Book,
  Grid,
  Settings,
  Upload,
  Save,
  PlusCircle,
  BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';
import { User, Subject, TeacherAssignment } from '../types';

const SchoolUsers: React.FC = React.memo(() => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'teacher' | 'vice_principal' | 'counselor' | 'principal' | 'pending'>('teacher');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'teacher', phone_number: '', whatsapp_enabled: true });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserForm, setEditUserForm] = useState({ id: 0, name: '', email: '', role: 'teacher', phone_number: '', whatsapp_enabled: true });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignUserForm, setAssignUserForm] = useState({ id: 0, name: '', email: '', role: 'teacher', phone_number: '', whatsapp_enabled: true });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ id: 0, password: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  
  // New State for Subjects, Classes, and Assignments
  const [subjects, setSubjects] = useState<Subject[]>([]);
  interface PendingAssignment {
    id: string;
    subject: { id: number; name: string; grade: string };
    grade: string;
    sections: string[];
  }

  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
  const [builderSubjectId, setBuilderSubjectId] = useState<number | ''>('');
  const [builderGrade, setBuilderGrade] = useState<string>('');
  const [builderSemester, setBuilderSemester] = useState<string>('');
  const [builderSections, setBuilderSections] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (builderGrade) {
      console.log("Fetching sections for grade:", builderGrade);
      apiFetch(`/api/admin/sections?grade=${encodeURIComponent(builderGrade)}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log("Sections received from server:", data);
          // Ensure data is an array before setting state
          if (Array.isArray(data)) {
            setAvailableSections(data);
          } else {
            console.error("Expected array of sections, received:", data);
            setAvailableSections([]);
          }
        })
        .catch(err => {
          console.error("Failed to fetch sections:", err);
          setAvailableSections([]);
        });
    } else {
      setAvailableSections([]);
    }
  }, [builderGrade]);

  const fetchSubjects = async () => {
    try {
      const res = await apiFetch('/api/admin/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiFetch('/api/admin/users');
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
      if (activeTab === 'pending') {
        return u.status === 'PENDING' && (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || u.national_id?.includes(searchQuery) || u.phone_number?.includes(searchQuery));
      }
      const matchesRole = u.role === activeTab && u.status !== 'PENDING';
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            u.email?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, activeTab, searchQuery]);

  const getRoleCount = (role: string) => users.filter(u => u.role === role && u.status !== 'PENDING').length;

  const handleApproveUser = async (id: number) => {
    try {
      const res = await apiFetch(`/api/admin/users/${id}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        const approvedUser = users.find(u => u.id === id);
        logAction(
          'إدارة مستخدمين',
          'UPDATE',
          'إدارة المستخدمين',
          `قام بقبول تسجيل المستخدم ${approvedUser?.name}`
        );
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to approve user:', err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUserForm),
      });
      if (res.ok) {
        logAction(
          'إدارة مستخدمين',
          'CREATE',
          'إدارة المستخدمين',
          `قام بإضافة مستخدم جديد: ${newUserForm.name} بصلاحية ${newUserForm.role}`
        );
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: editUserForm.name, 
          email: editUserForm.email, 
          phone_number: editUserForm.phone_number, 
          whatsapp_enabled: editUserForm.whatsapp_enabled
        }),
      });
      if (res.ok) {
        // Also update role if changed
        const roleRes = await apiFetch(`/api/admin/users/${editUserForm.id}/role`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: editUserForm.role }),
        });
        if (roleRes.ok) {
          logAction(
            'إدارة مستخدمين',
            'UPDATE',
            'إدارة المستخدمين',
            `قام بتعديل بيانات المستخدم ${editUserForm.name}`
          );
          setShowEditModal(false);
          fetchUsers();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignSubjects = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const assignments = pendingAssignments.flatMap(pa => 
        pa.sections.map(section => ({
          subject_id: pa.subject.id,
          class_id: `${pa.grade}|${section}`
        }))
      );

      const res = await apiFetch(`/api/admin/users/${assignUserForm.id}/update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: assignUserForm.name, 
          email: assignUserForm.email, 
          phone_number: assignUserForm.phone_number, 
          whatsapp_enabled: assignUserForm.whatsapp_enabled,
          assignments: assignments
        }),
      });
      if (res.ok) {
        logAction(
          'إدارة مستخدمين',
          'UPDATE',
          'إدارة الإسناد',
          `قام بتعديل إسناد المواد للمعلم ${assignUserForm.name}`
        );
        setShowAssignModal(false);
        fetchUsers();
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: passwordForm.password }),
      });
      if (res.ok) {
        const userToChange = users.find(u => u.id === passwordForm.id);
        logAction(
          'إدارة مستخدمين',
          'UPDATE',
          'إدارة المستخدمين',
          `قام بتغيير كلمة المرور للمستخدم ${userToChange?.name}`
        );
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
        method: 'POST'
      });
      if (res.ok) {
        const deletedUser = users.find(u => u.id === deletingUserId);
        logAction(
          'إدارة مستخدمين',
          'DELETE',
          'إدارة المستخدمين',
          `قام بحذف المستخدم ${deletedUser?.name}`
        );
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
        method: 'POST'
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPendingAssignment = () => {
    if (!builderSubjectId || !builderGrade || builderSections.length === 0) return;
    
    const subject = subjects.find(s => s.id === builderSubjectId);
    if (!subject) return;

    setPendingAssignments(prev => {
      const existingIndex = prev.findIndex(a => a.subject.id === subject.id && a.grade === builderGrade);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const existingSections = updated[existingIndex].sections;
        const newSections = [...new Set([...existingSections, ...builderSections])];
        updated[existingIndex] = {
          ...updated[existingIndex],
          sections: newSections
        };
        return updated;
      } else {
        const newAssignment: PendingAssignment = {
          id: `${subject.id}-${builderGrade}-${Date.now()}`,
          subject: { id: subject.id, name: subject.name, grade: subject.grade },
          grade: builderGrade,
          sections: [...builderSections]
        };
        return [...prev, newAssignment];
      }
    });
    
    // Reset builder
    setBuilderSubjectId('');
    setBuilderGrade('');
    setBuilderSemester('');
    setBuilderSections([]);
  };

  const handleRemovePendingAssignment = (id: string) => {
    setPendingAssignments(prev => prev.filter(a => a.id !== id));
  };

  const toggleBuilderSection = (section: string) => {
    setBuilderSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const getTeacherAssignmentSummary = (u: User) => {
    const assignments = u.assignments || [];
    if (assignments.length === 0) return [];

    const summaryMap = new Map<string, string[]>();
    
    assignments.forEach(assignment => {
      const subject = subjects.find(s => s.id === assignment.subject_id);
      let clsName = '';
      
      if (assignment.class_id && typeof assignment.class_id === 'string') {
        const [grade, section] = assignment.class_id.split('|');
        if (grade && section) {
          clsName = `${grade} - ${section}`;
        } else {
          clsName = assignment.class_id;
        }
      }
      
      if (subject && clsName) {
        if (!summaryMap.has(subject.name)) {
          summaryMap.set(subject.name, []);
        }
        if (!summaryMap.get(subject.name)?.includes(clsName)) {
          summaryMap.get(subject.name)?.push(clsName);
        }
      }
    });

    const summaryParts: string[] = [];
    summaryMap.forEach((classNames, subjectName) => {
      summaryParts.push(`${subjectName} [${classNames.join('، ')}]`);
    });

    return summaryParts;
  };

  const tabs = [
    { id: 'teacher', label: 'المعلمون', icon: GraduationCap, count: getRoleCount('teacher') },
    { id: 'vice_principal', label: 'الوكلاء', icon: Briefcase, count: getRoleCount('vice_principal') },
    { id: 'counselor', label: 'الموجه الطلابي', icon: Compass, count: getRoleCount('counselor') },
    { id: 'principal', label: 'الإدارة', icon: Crown, count: getRoleCount('principal') },
    { id: 'pending', label: 'طلبات الانضمام', icon: Clock, count: users.filter(u => u.status === 'PENDING').length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">إدارة الإسناد والمواد</h2>
            <p className="text-sm text-slate-500">إدارة حسابات الطاقم التعليمي، المواد، الفصول وإسنادها</p>
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

      {/* Search and Content Grid */}
      <div className="space-y-6">
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
                {activeTab === 'pending' ? (
                  <>
                    <th className="px-6 py-4">رقم الهوية</th>
                    <th className="px-6 py-4">رقم الجوال</th>
                    <th className="px-6 py-4">الدور</th>
                  </>
                ) : (
                  <th className="px-6 py-4">حالة الحساب</th>
                )}
                {(activeTab === 'teacher' || activeTab === 'vice_principal' || activeTab === 'counselor') && <th className="px-6 py-4">الفصول المسندة</th>}
                {(activeTab === 'vice_principal' || activeTab === 'counselor') && <th className="px-6 py-4">الصلاحيات</th>}
                <th className="px-6 py-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={activeTab === 'pending' ? 6 : 6} className="px-6 py-12 text-center text-slate-400">جاري التحميل...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={activeTab === 'pending' ? 6 : 6} className="px-6 py-12 text-center text-slate-400">لا يوجد مستخدمين في هذا القسم</td></tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{u.name}</td>
                    <td className="px-6 py-4 text-slate-500" dir="ltr">{u.email}</td>
                    {activeTab === 'pending' ? (
                      <>
                        <td className="px-6 py-4 text-slate-500">{u.national_id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500" dir="ltr">{u.phone_number}</span>
                            {u.is_phone_verified ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                <CheckCircle size={12} />
                                موثق بالواتساب
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                <XCircle size={12} />
                                غير موثق
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {u.role === 'teacher' ? 'معلم' : u.role === 'vice_principal' ? 'وكيل' : u.role === 'counselor' ? 'موجه طلابي' : 'إداري'}
                        </td>
                      </>
                    ) : (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => toggleUserStatus(u.id)}
                          className="focus:outline-none"
                        >
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                            u.is_active !== false 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            <span className={`relative flex h-2 w-2`}>
                              {u.is_active !== false && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${u.is_active !== false ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            </span>
                            {u.is_active !== false ? 'نشط' : 'موقوف'}
                          </span>
                        </button>
                      </td>
                    )}
                    {(activeTab === 'teacher' || activeTab === 'vice_principal' || activeTab === 'counselor') && (
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {activeTab === 'teacher' ? (
                            getTeacherAssignmentSummary(u).length > 0 ? (
                              getTeacherAssignmentSummary(u).map((section, idx) => (
                                <span key={idx} className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm min-w-[30px]">
                                  {section}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">لا يوجد إسناد</span>
                            )
                          ) : (
                            u.assigned_grades && u.assigned_grades.length > 0 ? (
                              u.assigned_grades.map((grade, idx) => (
                                <span key={idx} className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm min-w-[30px]">
                                  {grade}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">لا يوجد إسناد</span>
                            )
                          )}
                        </div>
                      </td>
                    )}
                    {(activeTab === 'vice_principal' || activeTab === 'counselor') && (
                      <td className="px-6 py-4 text-slate-500">
                        {activeTab === 'vice_principal' ? 'شؤون طلاب' : 'توجيه وإرشاد'}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {activeTab === 'pending' ? (
                          <>
                            <button 
                              onClick={() => handleApproveUser(u.id)}
                              className="px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg transition-colors text-sm font-bold flex items-center gap-2"
                              title="اعتماد الحساب"
                            >
                              <CheckCircle size={16} />
                              اعتماد
                            </button>
                            <button 
                              onClick={() => {
                                setDeletingUserId(u.id);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                              title="رفض وحذف"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => {
                                setEditUserForm({ id: u.id, name: u.name, email: u.email || '', role: u.role, phone_number: u.phone_number || '', whatsapp_enabled: u.whatsapp_enabled !== false });
                                setShowEditModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                              title="تعديل المستخدم"
                            >
                              <Edit2 size={18} />
                            </button>
                            {u.role === 'teacher' && (
                              <button 
                                onClick={() => {
                                  setAssignUserForm({ id: u.id, name: u.name, email: u.email || '', role: u.role, phone_number: u.phone_number || '', whatsapp_enabled: u.whatsapp_enabled !== false });
                                  
                                  // Reset modal state
                                  setBuilderSubjectId('');
                                  setBuilderGrade('');
                                  setBuilderSemester('');
                                  setBuilderSections([]);
                                  setAvailableSections([]);
                                  
                                  // Pre-fill assignment selections if teacher
                                  const assignments = u.assignments || [];
                                  const groupedAssignments = assignments.reduce((acc: any, curr: any) => {
                                    const subject = subjects.find(s => s.id === curr.subject_id);
                                    if (!subject) return acc;
                                    
                                    const [grade, section] = curr.class_id.split('|');
                                    const key = `${curr.subject_id}-${grade}`;
                                    
                                    if (!acc[key]) {
                                      acc[key] = {
                                        id: key,
                                        subject: { id: subject.id, name: subject.name, grade: subject.grade },
                                        grade: grade,
                                        sections: []
                                      };
                                    }
                                    if (section && !acc[key].sections.includes(section)) {
                                      acc[key].sections.push(section);
                                    }
                                    return acc;
                                  }, {});
                                  
                                  setPendingAssignments(Object.values(groupedAssignments));
                                  
                                  setShowAssignModal(true);
                                }}
                                className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title="إسناد المواد"
                              >
                                <Book size={18} />
                              </button>
                            )}
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
                          </>
                        )}
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
                    {activeTab === 'pending' && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-slate-600">الهوية: {u.national_id}</p>
                        <p className="text-sm text-slate-600 flex items-center gap-2">
                          الجوال: <span dir="ltr">{u.phone_number}</span>
                          {u.is_phone_verified ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle size={10} />
                              موثق
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                              <XCircle size={10} />
                              غير موثق
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-slate-600">
                          الدور: {u.role === 'teacher' ? 'معلم' : u.role === 'vice_principal' ? 'وكيل' : u.role === 'counselor' ? 'موجه طلابي' : 'إداري'}
                        </p>
                      </div>
                    )}
                  </div>
                  {activeTab !== 'pending' && (
                    <button 
                      onClick={() => toggleUserStatus(u.id)}
                      className="focus:outline-none"
                    >
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                        u.is_active !== false 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        <span className={`relative flex h-2 w-2`}>
                          {u.is_active !== false && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${u.is_active !== false ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        </span>
                        {u.is_active !== false ? 'نشط' : 'موقوف'}
                      </span>
                    </button>
                  )}
                </div>
                
                {(activeTab === 'teacher' || activeTab === 'vice_principal' || activeTab === 'counselor') && (
                  <div className="text-sm">
                    <span className="text-slate-500 mb-2 block">الفصول المسندة: </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeTab === 'teacher' ? (
                        getTeacherAssignmentSummary(u).length > 0 ? (
                          getTeacherAssignmentSummary(u).map((section, idx) => (
                            <span key={idx} className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm min-w-[30px]">
                              {section}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">لا يوجد إسناد</span>
                        )
                      ) : (
                        u.assigned_grades && u.assigned_grades.length > 0 ? (
                          u.assigned_grades.map((grade, idx) => (
                            <span key={idx} className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm min-w-[30px]">
                              {grade}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">لا يوجد إسناد</span>
                        )
                      )}
                    </div>
                  </div>
                )}
                
                {(activeTab === 'vice_principal' || activeTab === 'counselor') && (
                  <div className="text-sm">
                    <span className="text-slate-500">الصلاحيات: </span>
                    <span className="font-bold text-slate-700">{activeTab === 'vice_principal' ? 'شؤون طلاب' : 'توجيه وإرشاد'}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-50 flex-wrap">
                  {activeTab === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleApproveUser(u.id)}
                        className="flex-1 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition-colors text-sm font-bold flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <CheckCircle size={16} />
                        اعتماد
                      </button>
                      <button 
                        onClick={() => {
                          setDeletingUserId(u.id);
                          setShowDeleteModal(true);
                        }}
                        className="flex-1 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-bold flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <Trash2 size={16} />
                        رفض وحذف
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          setEditUserForm({ id: u.id, name: u.name, email: u.email || '', role: u.role, phone_number: u.phone_number || '', whatsapp_enabled: u.whatsapp_enabled !== false });
                          setShowEditModal(true);
                        }}
                        className="flex-1 py-2 text-slate-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors text-sm font-bold flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <Edit2 size={16} />
                        تعديل
                      </button>
                      {u.role === 'teacher' && (
                        <button 
                          onClick={() => {
                            setAssignUserForm({ id: u.id, name: u.name, email: u.email || '', role: u.role, phone_number: u.phone_number || '', whatsapp_enabled: u.whatsapp_enabled !== false });
                            
                            // Reset modal state
                            setBuilderSubjectId('');
                            setBuilderGrade('');
                            setBuilderSemester('');
                            setBuilderSections([]);
                            setAvailableSections([]);
                            
                            // Pre-fill assignment selections if teacher
                            const assignments = u.assignments || [];
                            const groupedAssignments = assignments.reduce((acc: any, curr: any) => {
                              const subject = subjects.find(s => s.id === curr.subject_id);
                              if (!subject) return acc;
                              
                              const [grade, section] = curr.class_id.split('|');
                              const key = `${curr.subject_id}-${grade}`;
                              
                              if (!acc[key]) {
                                acc[key] = {
                                  id: key,
                                  subject: { id: subject.id, name: subject.name, grade: subject.grade },
                                  grade: grade,
                                  sections: []
                                };
                              }
                              if (section && !acc[key].sections.includes(section)) {
                                acc[key].sections.push(section);
                              }
                              return acc;
                            }, {});
                            
                            setPendingAssignments(Object.values(groupedAssignments));
                            
                            setShowAssignModal(true);
                          }}
                          className="flex-1 py-2 text-slate-600 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors text-sm font-bold flex items-center justify-center gap-2 min-h-[44px]"
                        >
                          <Book size={16} />
                          إسناد
                        </button>
                      )}
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
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
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
                <label className="block text-sm font-bold text-slate-700 mb-1">رقم الجوال</label>
                <input
                  type="tel"
                  required
                  pattern="^(05|9665)[0-9]{8}$"
                  title="يجب أن يبدأ الرقم بـ 05 أو 9665 ويليه 8 أرقام"
                  placeholder="05XXXXXXXX"
                  value={newUserForm.phone_number}
                  onChange={e => setNewUserForm({...newUserForm, phone_number: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={newUserForm.whatsapp_enabled}
                    onChange={(e) => setNewUserForm({ ...newUserForm, whatsapp_enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-700 text-sm">تفعيل إشعارات الواتساب لهذا المستخدم</span>
                </label>
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
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h3 className="text-xl font-bold text-slate-800">تعديل المستخدم</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <form id="editUserForm" onSubmit={handleEditUser} className="space-y-4">
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
                  <label className="block text-sm font-bold text-slate-700 mb-1">رقم الجوال</label>
                  <input
                    type="tel"
                    required
                    pattern="^(05|9665)[0-9]{8}$"
                    title="يجب أن يبدأ الرقم بـ 05 أو 9665 ويليه 8 أرقام"
                    placeholder="05XXXXXXXX"
                    value={editUserForm.phone_number}
                    onChange={e => setEditUserForm({...editUserForm, phone_number: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={editUserForm.whatsapp_enabled}
                      onChange={(e) => setEditUserForm({ ...editUserForm, whatsapp_enabled: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-slate-700 text-sm">تفعيل إشعارات الواتساب لهذا المستخدم</span>
                  </label>
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
              </form>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
              <button type="submit" form="editUserForm" className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold transition-colors">
                حفظ التعديلات
              </button>
              <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors">
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Assign Subjects Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h3 className="text-xl font-bold text-slate-800">
                إسناد المواد للمعلم: {assignUserForm.name}
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-6">
              {/* 1. Assignment Builder Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <PlusCircle size={18} className="text-primary" />
                  بناء إسناد جديد
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Semester Dropdown */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">الفصل الدراسي</label>
                    <select
                      value={builderSemester}
                      onChange={(e) => {
                        setBuilderSemester(e.target.value);
                        setBuilderSubjectId(''); // Reset subject when semester changes
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                      <option value="">الكل</option>
                      <option value="الفصل الأول">الفصل الدراسي الأول</option>
                      <option value="الفصل الثاني">الفصل الدراسي الثاني</option>
                    </select>
                  </div>

                  {/* Grade Dropdown */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">الصف</label>
                    <select
                      value={builderGrade}
                      onChange={(e) => {
                        setBuilderGrade(e.target.value);
                        setBuilderSubjectId(''); // Reset subject when grade changes
                        setBuilderSections([]); // Reset sections when grade changes
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                      <option value="">اختر الصف</option>
                      <option value="الصف الأول">الصف الأول</option>
                      <option value="الصف الثاني">الصف الثاني</option>
                      <option value="الصف الثالث">الصف الثالث</option>
                    </select>
                  </div>

                  {/* Subject Dropdown */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">المادة</label>
                    <select
                      value={builderSubjectId}
                      onChange={(e) => setBuilderSubjectId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      disabled={!builderGrade}
                    >
                      <option value="">اختر المادة</option>
                      {subjects
                        .filter(s => (!builderSemester || s.semester === builderSemester) && (!builderGrade || s.grade === builderGrade))
                        .map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sections Pills */}
                {builderGrade && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">الفصول المتاحة</label>
                    {availableSections.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {availableSections.map(section => (
                          <button
                            key={section}
                            type="button"
                            onClick={() => toggleBuilderSection(section)}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors border ${
                              builderSections.includes(section)
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-primary/30'
                            }`}
                          >
                            {section}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">لا توجد فصول متاحة لهذا الصف.</p>
                    )}
                  </div>
                )}

                {/* Add Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleAddPendingAssignment}
                    disabled={!builderSubjectId || !builderGrade || builderSections.length === 0}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                  >
                    <PlusCircle size={16} />
                    إضافة للإسناد
                  </button>
                </div>
              </div>

              {/* 2. Current Assignments Cart */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <BookOpen size={18} className="text-primary" />
                  الإسنادات الحالية
                </h4>
                
                {pendingAssignments.length > 0 ? (
                  <div className="space-y-2">
                    {pendingAssignments.map(assignment => (
                      <div key={assignment.id} className="flex justify-between items-center p-3 border border-slate-200 rounded-lg bg-white shadow-sm">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => handleRemovePendingAssignment(assignment.id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="حذف الإسناد"
                          >
                            <Trash2 size={18} />
                          </button>
                          <div>
                            <div className="font-bold text-slate-800">{assignment.subject.name}</div>
                            <div className="text-sm text-slate-500 mb-1">{assignment.grade}</div>
                            <div className="flex flex-wrap gap-1">
                              {assignment.sections.map(sec => (
                                <span key={sec} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md font-medium border border-slate-200">
                                  {sec}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Book className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-slate-500 text-sm">لم يتم إضافة أي إسنادات بعد.</p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
              <button 
                type="button" 
                onClick={handleAssignSubjects}
                className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Save size={20} />
                حفظ إسناد المعلم
              </button>
              <button 
                type="button" 
                onClick={() => {
                  if (window.confirm('هل أنت متأكد من رغبتك في تفريغ جميع الإسنادات لهذا المعلم؟')) {
                    setPendingAssignments([]);
                  }
                }}
                disabled={pendingAssignments.length === 0}
                className="px-6 bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                title="تفريغ جميع الإسنادات"
              >
                <Trash2 size={20} />
                تفريغ الكل
              </button>
              <button 
                type="button" 
                onClick={() => setShowAssignModal(false)} 
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors"
              >
                إلغاء
              </button>
            </div>
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
