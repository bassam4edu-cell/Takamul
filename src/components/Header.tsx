import React from 'react';
import { Bell, Search, User as UserIcon, Settings, HelpCircle } from 'lucide-react';
import { useAuth } from '../App';

const Header: React.FC = () => {
  const { user } = useAuth();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'teacher': return 'معلم';
      case 'vice_principal': return 'وكيل شؤون الطلاب';
      case 'counselor': return 'موجه طلابي';
      case 'principal': return 'مدير المدرسة';
      case 'admin': return 'مدير النظام';
      default: return '';
    }
  };

  return (
    <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-50 flex items-center justify-between px-10 z-10 sticky top-0">
      <div className="flex items-center gap-6 flex-1 max-w-2xl">
        <div className="relative w-full group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="بحث سريع عن طالب، معلم، أو حالة تحويل..." 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pr-12 pl-5 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 border-l border-slate-100">
          <button className="p-3 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all relative">
            <HelpCircle size={22} />
          </button>
          <button className="p-3 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all relative">
            <Settings size={22} />
          </button>
          <button className="relative p-3 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all">
            <Bell size={22} />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
          </button>
        </div>

        <div className="flex items-center gap-4 pr-4">
          <div className="text-right">
            <p className="text-sm font-extrabold text-slate-800 leading-none mb-1">{user?.name}</p>
            <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{getRoleLabel(user?.role || '')}</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center text-primary border border-slate-200 shadow-sm overflow-hidden">
            <UserIcon size={24} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
