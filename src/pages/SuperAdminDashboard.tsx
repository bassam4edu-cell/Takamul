import { apiFetch } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  Building2, 
  Plus, 
  Search,
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface School {
  id: number;
  name: string;
  subscription_end_date: string;
  is_active: boolean;
  greenapi_instance_id: string;
  greenapi_token: string;
}

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchoolForm, setNewSchoolForm] = useState({ name: '', subscription_end_date: '' });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const res = await apiFetch('/api/superadmin/schools');
      if (!res.ok) throw new Error('Failed to fetch schools');
      const data = await res.json();
      setSchools(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/superadmin/schools/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchoolForm),
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchSchools();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSchoolStatus = async (schoolId: number) => {
    try {
      const res = await apiFetch(`/api/superadmin/schools/${schoolId}/toggle-status`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchSchools();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">لوحة تحكم النظام (Super Admin)</h2>
            <p className="text-sm text-slate-500">إدارة المدارس والاشتراكات</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus size={20} />
          <span>إضافة مدرسة جديدة</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="البحث باسم المدرسة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
        />
      </div>

      {/* Table & Mobile Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">جاري التحميل...</div>
        ) : filteredSchools.length === 0 ? (
          <div className="p-12 text-center text-slate-400">لا يوجد مدارس</div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredSchools.map(s => {
                const isExpired = new Date(s.subscription_end_date) < new Date();
                return (
                  <div key={s.id} className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">المعرف</span>
                        <span className="font-mono text-slate-500">#{s.id}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                        !isExpired ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {!isExpired ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {!isExpired ? 'ساري' : 'منتهي'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-400 block mb-1">اسم المدرسة</span>
                      <span className="font-bold text-slate-800">{s.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">تاريخ انتهاء الاشتراك</span>
                        <span className="text-slate-500" dir="ltr">{new Date(s.subscription_end_date).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 block mb-1">حالة الحساب</span>
                        <button 
                          onClick={() => toggleSchoolStatus(s.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            s.is_active !== false ? 'bg-indigo-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              s.is_active !== false ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-50 flex justify-end">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">المعرف</th>
                    <th className="px-6 py-4">اسم المدرسة</th>
                    <th className="px-6 py-4">تاريخ انتهاء الاشتراك</th>
                    <th className="px-6 py-4">حالة الاشتراك</th>
                    <th className="px-6 py-4">حالة الحساب</th>
                    <th className="px-6 py-4 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSchools.map(s => {
                    const isExpired = new Date(s.subscription_end_date) < new Date();
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-500">#{s.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">{s.name}</td>
                        <td className="px-6 py-4 text-slate-500" dir="ltr">
                          {new Date(s.subscription_end_date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                            !isExpired ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {!isExpired ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                            {!isExpired ? 'ساري' : 'منتهي'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-start">
                            <button 
                              onClick={() => toggleSchoolStatus(s.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                s.is_active !== false ? 'bg-indigo-500' : 'bg-slate-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  s.is_active !== false ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                              <Edit2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
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
              <h3 className="text-xl font-bold text-slate-800">إضافة مدرسة جديدة</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleAddSchool} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">اسم المدرسة</label>
                <input
                  type="text"
                  required
                  value={newSchoolForm.name}
                  onChange={e => setNewSchoolForm({...newSchoolForm, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ انتهاء الاشتراك</label>
                <input
                  type="date"
                  required
                  value={newSchoolForm.subscription_end_date}
                  onChange={e => setNewSchoolForm({...newSchoolForm, subscription_end_date: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  dir="ltr"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors">
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
    </div>
  );
};

export default SuperAdminDashboard;
