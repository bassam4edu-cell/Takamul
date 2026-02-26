import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FilePlus, 
  Users, 
  Settings, 
  LogOut,
  ClipboardList,
  ShieldCheck,
  Settings2
} from 'lucide-react';
import { useAuth } from '../App';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    { 
      title: 'لوحة التحكم', 
      path: '/', 
      icon: LayoutDashboard,
      roles: ['teacher', 'vice_principal', 'counselor']
    },
    { 
      title: 'تحويل جديد', 
      path: '/referral/new', 
      icon: FilePlus,
      roles: ['teacher']
    },
    { 
      title: 'الإعدادات', 
      path: '/settings', 
      icon: Settings,
      roles: ['teacher', 'vice_principal', 'counselor', 'admin']
    },
    { 
      title: 'إدارة النظام', 
      path: '/admin', 
      icon: Settings2,
      roles: ['admin']
    },
  ];

  return (
    <aside className="w-64 bg-white border-l border-slate-200 flex flex-col h-full card-shadow z-20">
      <div className="p-6 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 text-lg leading-tight">نظام التحويل</h1>
          <p className="text-xs text-slate-500">المدرسة الذكية</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.filter(item => item.roles.includes(user?.role || '')).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-blue-50 text-blue-700 font-medium" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon size={20} className={cn(
              "transition-colors",
              "group-hover:text-blue-600"
            )} />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-right text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
