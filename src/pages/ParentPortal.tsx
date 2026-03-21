import React from 'react';
import { useAuth } from '../context/AuthContext';
import StudentProfile from './StudentProfile';
import { motion } from 'motion/react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ParentPortal: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user || user.role !== 'parent') {
    return <div className="p-10 text-center font-bold text-slate-500">غير مصرح لك بالدخول</div>;
  }

  const studentName = user.name || '';
  const nameParts = studentName.split(' ');
  const firstName = nameParts[0] || '';
  const parentName = nameParts.slice(1).join(' ') || '';

  const handleLogout = () => {
    logout();
    navigate('/parent-login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-black text-lg">
              ب
            </div>
            <span className="font-extrabold text-slate-800 text-lg hidden sm:block">بوابة ولي الأمر</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors font-bold text-sm"
          >
            <span>تسجيل الخروج</span>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Smart Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary to-indigo-600 rounded-3xl p-8 md:p-10 text-white shadow-lg mb-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl font-black mb-2">مرحباً بك: الأستاذ {parentName}</h1>
              <p className="text-primary-100 text-lg md:text-xl font-medium opacity-90">ولي أمر الطالب: {firstName}</p>
            </div>
          </motion.div>

          {/* Comprehensive Record (Read-Only) */}
          <StudentProfile studentId={user.student_id} isReadOnly={true} />
        </div>
      </main>
    </div>
  );
};

export default ParentPortal;
