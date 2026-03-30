import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  UserCog,
  Book
} from 'lucide-react';
import { motion } from 'motion/react';
import SchoolUsers from './SchoolUsers';
import SubjectManagement from '../components/admin/SubjectManagement';
import StudentManagement from '../components/StudentManagement';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'subjects' | 'students'>('students');

  return (
    <div className="space-y-10 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">لوحة تحكم المسؤول</h1>
          <p className="text-slate-500 mt-1 font-bold">إدارة المستخدمين وإدارة المواد المركزية.</p>
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
          onClick={() => setActiveTab('students')} 
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'students' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
        >
          <Users size={18} />
          إدارة الطلاب
        </button>
        <button 
          onClick={() => setActiveTab('users')} 
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
        >
          <UserCog size={18} />
          إدارة الإسناد والمواد
        </button>
        <button 
          onClick={() => setActiveTab('subjects')} 
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'subjects' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
        >
          <Book size={18} />
          إدارة المواد
        </button>
      </div>

      <div className="space-y-12">
        {activeTab === 'students' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <StudentManagement />
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SchoolUsers />
          </motion.div>
        )}

        {activeTab === 'subjects' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SubjectManagement />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
