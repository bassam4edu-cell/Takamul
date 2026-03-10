import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      <div className="no-print hidden lg:block print:hidden">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden relative print:overflow-visible">
        <div className="no-print print:hidden">
          <Header />
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-6 pb-24 lg:pb-6 print:overflow-visible print:bg-white print:p-0">
          <Outlet />
        </main>
        <div className="no-print lg:hidden print:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default Layout;
