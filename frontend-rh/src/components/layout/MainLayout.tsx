import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppSwitchButton from '../ui/AppSwitchButton';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--bg)] dark:bg-gray-950">
      <Sidebar />
      <div
        className="transition-all duration-300 ease-in-out lg:ml-[80px]"
      >
        <main className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <AppSwitchButton />
    </div>
  );
};

export default MainLayout;
