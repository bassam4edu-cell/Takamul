import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FilePlus, 
  Bell, 
  UserCircle,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../App';

const BottomNav: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { 
      title: 'الرئيسية', 
      path: '/', 
      icon: LayoutDashboard,
      roles: ['teacher', 'vice_principal', 'counselor', 'principal', 'admin']
    },
    { 
      title: 'تحويل', 
      path: '/referral/new', 
      icon: FilePlus,
      roles: ['teacher']
    },
    { 
      title: 'التقارير', 
      path: '/reports', 
      icon: BarChart3,
      roles: ['principal', 'admin']
    },
    { 
      title: 'الإشعارات', 
      path: '/notifications', 
      icon: Bell,
      roles: ['teacher', 'vice_principal', 'counselor', 'principal', 'admin']
    },
    { 
      title: 'حسابي', 
      path: '/settings', 
      icon: UserCircle,
      roles: ['teacher', 'vice_principal', 'counselor', 'principal', 'admin']
    },
  ];

  const allowedItems = navItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around px-2 py-3 z-50 lg:hidden safe-area-bottom">
      {allowedItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `
            flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all
            ${isActive ? 'text-primary' : 'text-slate-400'}
          `}
        >
          <item.icon size={24} />
          <span className="text-[10px] font-bold">{item.title}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
