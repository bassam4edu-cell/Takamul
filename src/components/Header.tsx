import React from 'react';
import { Search, User as UserIcon, Settings, HelpCircle } from 'lucide-react';
import { useAuth } from '../App';
import NotificationBell from './NotificationBell';

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
    <header className="h-20 lg:h-24 bg-white/80 backdrop-blur-xl border-b border-slate-50 flex items-center justify-between px-4 lg:px-10 z-10 sticky top-0">
      <div className="flex items-center gap-4 lg:gap-6 flex-1 max-w-2xl">
        <div className="lg:hidden">
          <img 
            src="https://upload.wikimedia.org/wikipedia/ar/thumb/a/a2/Ministry_of_Education_Saudi_Arabia.svg/512px-Ministry_of_Education_Saudi_Arabia.svg.png" 
            alt="Logo" 
            className="w-10 h-10 object-contain"
          />
        </div>
        <div className="relative w-full group hidden md:block">
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
          <NotificationBell />
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
