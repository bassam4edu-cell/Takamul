import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  RotateCcw,
  Calendar,
  ShieldAlert,
  Trash2,
  Edit2
} from 'lucide-react';
import { Referral } from '../types';
import { useAuth } from '../App';
import { motion } from 'motion/react';

const AdminReferrals: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingReferralId, setDeletingReferralId] = useState<number | null>(null);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const res = await fetch(`/api/referrals?userId=${user?.id}&role=${user?.role}`);
      if (res.ok) {
        const data = await res.json();
        setReferrals(data);
      }
    } catch (err) {
      console.error('Failed to fetch referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingReferralId(null);
    try {
      const res = await fetch(`/api/admin/referrals/${id}/delete`, {
        method: 'POST'
      });
      if (res.ok) {
        setReferrals(referrals.filter(r => r.id !== id));
      } else {
        alert('فشل حذف التحويل');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_vp':
        return <span className="px-3 py-1.5 bg-red-50 text-red-700 rounded-xl text-[10px] font-extrabold border border-red-100 flex items-center gap-1.5 w-fit"><ShieldAlert size={14} /> بانتظار الوكيل</span>;
      case 'pending_counselor':
        return <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-extrabold border border-amber-100 flex items-center gap-1.5 w-fit"><Clock size={14} /> قيد المتابعة</span>;
      case 'scheduled_meeting':
        return <span className="px-3 py-1.5 bg-primary/5 text-primary rounded-xl text-[10px] font-extrabold border border-primary/10 flex items-center gap-1.5 w-fit"><Calendar size={14} /> موعد جلسة</span>;
      case 'returned_to_teacher':
        return <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-extrabold border border-amber-100 flex items-center gap-1.5 w-fit"><RotateCcw size={14} /> معاد للمعلم</span>;
      case 'resolved':
        return <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-extrabold border border-emerald-100 flex items-center gap-1.5 w-fit"><CheckCircle2 size={14} /> تمت المعالجة</span>;
      default:
        return <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 w-fit"><AlertCircle size={14} /> غير معروف</span>;
    }
  };

  const filteredReferrals = referrals.filter(r => {
    const matchesSearch = 
      r.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student_national_id?.includes(searchQuery) ||
      r.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">إدارة التحويلات</h1>
          <p className="text-slate-500 text-sm mt-2 font-bold">عرض وتعديل وحذف جميع التحويلات في النظام</p>
        </div>
      </div>

      <div className="sts-card p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="ابحث باسم الطالب، رقم الهوية، أو اسم المعلم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sts-input pl-4 pr-12 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sts-input md:w-64"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending_vp">بانتظار الوكيل</option>
            <option value="pending_counselor">قيد المتابعة</option>
            <option value="scheduled_meeting">موعد جلسة</option>
            <option value="returned_to_teacher">معاد للمعلم</option>
            <option value="resolved">تمت المعالجة</option>
          </select>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredReferrals.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-bold">
            لا توجد تحويلات مطابقة للبحث
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="pb-4 font-black text-slate-400 text-xs uppercase tracking-widest">رقم التحويل</th>
                  <th className="pb-4 font-black text-slate-400 text-xs uppercase tracking-widest">الطالب</th>
                  <th className="pb-4 font-black text-slate-400 text-xs uppercase tracking-widest">المعلم المحيل</th>
                  <th className="pb-4 font-black text-slate-400 text-xs uppercase tracking-widest">تاريخ التحويل</th>
                  <th className="pb-4 font-black text-slate-400 text-xs uppercase tracking-widest">الحالة</th>
                  <th className="pb-4 font-black text-slate-400 text-xs uppercase tracking-widest">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredReferrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 text-sm font-bold text-slate-900">#{referral.id}</td>
                    <td className="py-4">
                      <div className="font-bold text-slate-900">{referral.student_name}</div>
                      <div className="text-[10px] text-slate-500">{referral.student_national_id}</div>
                    </td>
                    <td className="py-4 text-sm font-bold text-slate-700">{referral.teacher_name}</td>
                    <td className="py-4 text-sm font-bold text-slate-500">{new Date(referral.created_at).toLocaleDateString('ar-SA')}</td>
                    <td className="py-4">{getStatusBadge(referral.status)}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/dashboard/referral/${referral.id}`)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                          title="عرض وتعديل"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => setDeletingReferralId(referral.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deletingReferralId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setDeletingReferralId(null)}
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
              <h3 className="text-xl font-black text-slate-800">حذف التحويل؟</h3>
              <p className="text-sm text-slate-500 font-bold leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا التحويل نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => handleDelete(deletingReferralId)}
                className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-600/20"
              >
                تأكيد الحذف
              </button>
              <button 
                onClick={() => setDeletingReferralId(null)}
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

export default AdminReferrals;
