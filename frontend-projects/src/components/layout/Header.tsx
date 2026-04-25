import React from 'react';
import { HiOutlineMenu } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { useSidebar } from '../../hooks/useSidebar';
import { API_BASE } from '../../api/axios';

const Header: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-99 flex h-[68px] w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-1 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileSidebar}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <HiOutlineMenu size={22} />
          </button>

          <button
            onClick={toggleSidebar}
            className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:block dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <HiOutlineMenu size={22} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2.5V4.375M10 15.625V17.5M4.375 10H2.5M6.34 6.34L5.046 5.046M13.66 6.34l1.293-1.294M6.34 13.66l-1.294 1.293M13.66 13.66l1.293 1.293M17.5 10h-1.875M13.75 10a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2.5 10.508c.108 4.084 3.533 7.391 7.617 7.392a7.556 7.556 0 005.771-2.679.337.337 0 00-.272-.549 5.848 5.848 0 01-1.166-.12C10.872 13.85 8.15 10.416 8.85 6.84c.177-.897.523-1.716.972-2.446a.335.335 0 00-.31-.518A7.616 7.616 0 002.5 10.508z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          <div className="flex items-center gap-2 rounded-full py-1 pl-2 pr-1">
            {user?.imageUrl ? (
              <img src={`${API_BASE}${user.imageUrl}`} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-500 text-sm font-semibold text-white">
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </div>
            )}
            <div className="hidden text-left md:block">
              <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-200">
                {user?.prenom} {user?.nom}
              </p>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                {user?.roles?.[0] || 'Employe'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
