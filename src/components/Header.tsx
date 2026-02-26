import React from 'react';
import { Bell, Search, User as UserIcon } from 'lucide-react';
import { useAuth } from '../App';

const Header: React.FC = () => {
  const { user } = useAuth();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'teacher': return 'معلم';
      case 'vice_principal': return 'وكيل شؤون الطلاب';
      case 'counselor': return 'موجه طلابي';
      case 'admin': return 'مدير النظام';
      default: return '';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث عن طالب أو حالة..." 
            className="w-full bg-slate-50 border-none rounded-xl py-2 pr-10 pl-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 border-r border-slate-200 pr-6">
          <div className="text-left text-right">
            <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-500">{getRoleLabel(user?.role || '')}</p>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 border border-slate-200">
            <UserIcon size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
