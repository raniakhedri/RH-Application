import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSidebar } from '../../hooks/useSidebar';
import AppSwitchButton from '../ui/AppSwitchButton';

const MainLayout: React.FC = () => {
  const { isExpanded, isHovered } = useSidebar();

  const sidebarWidth = isExpanded || isHovered ? 290 : 90;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div
        className="transition-all duration-300 ease-in-out lg:ml-[90px]"
        style={{ marginLeft: window.innerWidth >= 1024 ? `${sidebarWidth}px` : '0px' }}
      >
        <Header />
        <main className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <AppSwitchButton />
    </div>
  );
};

export default MainLayout;
