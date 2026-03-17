import { apiFetch } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Filter,
  ArrowUpRight,
  Users,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Referral } from '../types';
import { useAuth } from '../App';
import { motion } from 'motion/react';

const CounselorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const res = await apiFetch(`/api/referrals?userId=${user?.id}&role=${user?.role}`);
        if (!res.ok) throw new Error('Failed to fetch referrals');
        const data = await res.json().catch(() => []);
        setReferrals(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchReferrals();
  }, [user?.id, user?.role]);

  // Filter referrals for counselor
  const counselorReferrals = referrals.filter(r => 
    r.status === 'pending_counselor' || 
    r.status === 'scheduled_meeting' || 
    r.status === 'resolved' || 
    r.status === 'closed'
  );

  const filteredReferrals = counselorReferrals.filter(r => 
    r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const newCases = filteredReferrals.filter(r => r.status === 'pending_counselor');
  const inProgressCases = filteredReferrals.filter(r => r.status === 'scheduled_meeting');
  const resolvedCases = filteredReferrals.filter(r => r.status === 'resolved' || r.status === 'closed');

  const KanbanColumn = ({ title, icon: Icon, color, cases, count }: any) => (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-[2rem] border border-slate-100 p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${color}`}>
            <Icon size={20} />
          </div>
          <h2 className="font-extrabold text-lg text-slate-800">{title}</h2>
        </div>
        <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-slate-500 shadow-sm border border-slate-100">
          {count}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {cases.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
            <p className="font-bold text-sm">لا توجد حالات</p>
          </div>
        ) : (
          cases.map((referral: Referral) => (
            <motion.div
              key={referral.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-extrabold text-slate-800">{referral.student_name}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    {referral.student_grade} - {referral.student_section}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                  referral.severity === 'high' ? 'bg-red-50 text-red-600' :
                  referral.severity === 'medium' ? 'bg-amber-50 text-amber-600' :
                  'bg-emerald-50 text-emerald-600'
                }`}>
                  {referral.severity === 'high' ? 'عالية' : referral.severity === 'medium' ? 'متوسطة' : 'عادية'}
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-slate-600 font-medium line-clamp-2">
                  {referral.reason}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                  <Clock size={14} />
                  <span>{new Date(referral.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
                <Link
                  to={`/dashboard/referral/${referral.id}`}
                  className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors"
                >
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">لوحة الموجه الطلابي</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">إدارة ومتابعة الحالات السلوكية المحالة من الوكيل</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="بحث عن طالب أو حالة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        <KanbanColumn 
          title="حالات جديدة" 
          icon={AlertCircle} 
          color="bg-red-500" 
          cases={newCases} 
          count={newCases.length} 
        />
        <KanbanColumn 
          title="قيد المتابعة" 
          icon={Clock} 
          color="bg-amber-500" 
          cases={inProgressCases} 
          count={inProgressCases.length} 
        />
        <KanbanColumn 
          title="حالات معالجة" 
          icon={CheckCircle2} 
          color="bg-emerald-500" 
          cases={resolvedCases} 
          count={resolvedCases.length} 
        />
      </div>
    </div>
  );
};

export default CounselorDashboard;