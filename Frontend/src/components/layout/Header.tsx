import React, { useState, useRef, useEffect } from 'react';
import { HiOutlineSearch, HiOutlineBell, HiOutlineLogout, HiOutlineMenu, HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { useSidebar } from '../../hooks/useSidebar';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-99 flex h-[68px] w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-1 items-center justify-between px-4 md:px-6">
        {/* Left: Hamburger + Search */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={toggleMobileSidebar}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <HiOutlineMenu size={22} />
          </button>

          {/* Desktop toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:block dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <HiOutlineMenu size={22} />
          </button>

          {/* Search bar */}
          <div className="relative hidden md:block">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher..."
              className="h-10 w-[280px] rounded-lg border border-gray-200 bg-transparent pl-10 pr-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:text-gray-300 dark:focus:border-brand-600"
            />
          </div>
        </div>

        {/* Right: Theme toggler + Notifications + User dropdown */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
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

          {/* Notifications */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <HiOutlineBell size={20} />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-error-500" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[350px] rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700">
                  <h4 className="text-theme-sm font-semibold text-gray-800 dark:text-white">
                    Notifications
                  </h4>
                </div>
                <div className="p-4 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                  Aucune nouvelle notification
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-full pl-2 pr-1 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {user?.imageUrl ? (
                <img src={`http://localhost:8080${user.imageUrl}`} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-500 text-white text-sm font-semibold">
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </div>
              )}
              <div className="hidden text-left md:block">
                <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                  {user?.roles?.[0] || 'Employé'}
                </p>
              </div>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-[220px] rounded-2xl border border-gray-200 bg-white p-2 shadow-theme-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                  <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-200">
                    {user?.prenom} {user?.nom}
                  </p>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/mon-profil'); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-theme-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <HiOutlineUser size={18} />
                  Mon profil
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/change-password'); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-theme-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <HiOutlineLockClosed size={18} />
                  Changer le mot de passe
                </button>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-theme-sm text-error-500 hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <HiOutlineLogout size={18} />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
