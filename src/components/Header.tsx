import React from 'react';
import { Search, User as UserIcon, Settings, HelpCircle, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

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
    <header className="h-16 md:h-20 lg:h-24 bg-white/80 backdrop-blur-xl border-b border-slate-50 flex items-center justify-between px-4 lg:px-10 z-10 sticky top-0">
      <div className="flex items-center gap-3 lg:gap-6 flex-1 max-w-2xl">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-600 hover:text-primary hover:bg-slate-50 rounded-xl transition-all md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Menu size={24} />
        </button>
        <div className="md:hidden">
          <img 
            src="https://i.ibb.co/QFwrvnqF/photo-2026-02-20-15-16-20.jpg" 
            alt="Logo" 
            className="w-10 h-10 object-contain rounded-lg"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative w-full group hidden md:block">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="بحث سريع عن طالب، معلم، أو حالة تحويل..." 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pr-12 pl-5 text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none min-h-[44px]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-1 md:gap-2 px-2 md:px-4 border-l border-slate-100">
          <button className="p-2 md:p-3 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all relative hidden md:block min-h-[44px] min-w-[44px]">
            <HelpCircle size={22} />
          </button>
          <button className="p-2 md:p-3 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all relative hidden md:block min-h-[44px] min-w-[44px]">
            <Settings size={22} />
          </button>
          <button 
            onClick={logout}
            className="p-2 md:p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all relative min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="تسجيل الخروج"
          >
            <LogOut size={22} />
          </button>
          <NotificationBell />
        </div>

        <div className="flex items-center gap-3 pr-2 md:pr-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-extrabold text-slate-800 leading-none mb-1">{user?.name}</p>
            <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{getRoleLabel(user?.role || '')}</p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center text-primary border border-slate-200 shadow-sm overflow-hidden shrink-0">
            <UserIcon size={20} className="md:w-6 md:h-6" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
