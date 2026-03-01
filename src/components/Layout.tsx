import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <div className="no-print hidden lg:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="no-print">
          <Header />
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
        <div className="no-print lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default Layout;
