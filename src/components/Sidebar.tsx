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
  Settings2,
  Home,
  BarChart3,
  UserCircle,
  Bell,
  FileText
} from 'lucide-react';
import { useAuth } from '../App';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Logo from './Logo';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    { 
      title: 'لوحة التحكم', 
      path: '/dashboard', 
      icon: LayoutDashboard,
      roles: ['teacher', 'vice_principal', 'counselor', 'principal']
    },
    { 
      title: 'تحويل جديد', 
      path: '/dashboard/referral/new', 
      icon: FilePlus,
      roles: ['teacher']
    },
    { 
      title: 'إدارة النظام', 
      path: '/dashboard/admin', 
      icon: ShieldCheck,
      roles: ['admin']
    },
    { 
      title: 'إدارة التحويلات', 
      path: '/dashboard/admin-referrals', 
      icon: ClipboardList,
      roles: ['admin']
    },
    { 
      title: 'السجل الشامل للطالب', 
      path: '/dashboard/student-record', 
      icon: FileText,
      roles: ['vice_principal', 'counselor', 'principal']
    },
    { 
      title: 'المشكلات السلوكية', 
      path: '/dashboard/behavioral-violations', 
      icon: ShieldCheck,
      roles: ['vice_principal', 'admin', 'principal']
    },
    { 
      title: 'التقارير الإحصائية', 
      path: '/dashboard/reports', 
      icon: BarChart3,
      roles: ['principal', 'admin']
    },
    { 
      title: 'الإشعارات', 
      path: '/dashboard/notifications', 
      icon: Bell,
      roles: ['teacher', 'vice_principal', 'counselor', 'admin', 'principal']
    },
    { 
      title: 'الإعدادات', 
      path: '/dashboard/settings', 
      icon: Settings,
      roles: ['teacher', 'vice_principal', 'counselor', 'admin', 'principal']
    },
  ];

  return (
    <aside className="w-72 bg-white border-l border-slate-100 flex flex-col h-full z-20 transition-all duration-300">
      <div className="p-8 flex flex-col items-center gap-4 border-b border-slate-50">
        <Logo className="w-20 h-20" />
        <div className="text-center">
          <p className="text-xs font-extrabold text-primary mb-1">ثانوية أم القرى بالخرج</p>
          <h1 className="font-extrabold text-primary text-xl leading-tight">نظام تحويل طالب</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Student Transfer System</p>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
        {menuItems.filter(item => item.roles.includes(user?.role || '')).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group",
              isActive 
                ? "bg-primary text-white shadow-lg shadow-primary/20 font-bold" 
                : "text-slate-500 hover:bg-slate-50 hover:text-primary"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} className={cn(
                  "transition-colors",
                  isActive ? "text-white" : "group-hover:text-primary"
                )} />
                <span className="text-sm">{item.title}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-50">
        <div className="bg-slate-50 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-slate-100">
            <UserCircle size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              {user?.role === 'teacher' ? 'معلم' : user?.role === 'vice_principal' ? 'وكيل' : user?.role === 'counselor' ? 'موجه' : user?.role === 'admin' ? 'أدمن' : 'مدير'}
            </p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex items-center gap-4 px-5 py-4 w-full text-right text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300 font-bold text-sm"
        >
          <LogOut size={20} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
