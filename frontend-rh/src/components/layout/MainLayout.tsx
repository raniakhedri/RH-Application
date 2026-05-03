import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppSwitchButton from '../ui/AppSwitchButton';
import { useSidebar } from '../../hooks/useSidebar';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';


const MainLayout: React.FC = () => {
  const { isRailVisible, toggleRail } = useSidebar();
  return (
    <div className="min-h-screen bg-[var(--bg)] dark:bg-gray-950">
      <Sidebar />
      <div className={`transition-all duration-300 ease-in-out ${isRailVisible ? 'lg:ml-[80px]' : 'lg:ml-0'}`}>
        <main className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
          {/* Bouton hamburger dans le contenu */}
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={toggleRail}
            aria-label={isRailVisible ? 'Fermer la barre' : 'Ouvrir la barre'}
            style={{ position: 'fixed', top: 24, left: isRailVisible ? 68 : 16 }}
          >

            {isRailVisible ? <HiOutlineChevronLeft size={16} /> : <HiOutlineChevronRight size={16} />}

          </button>
          <Outlet />
        </main>
      </div>
      <AppSwitchButton />
    </div>
  );
};

export default MainLayout;
