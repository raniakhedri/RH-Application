import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBell, HiOutlineLogout, HiOutlineMenu, HiOutlineLockClosed, HiOutlineUser, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineUserAdd, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineDocumentText, HiOutlineStar, HiOutlinePhotograph, HiOutlineCalendar, HiOutlineInformationCircle } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { useSidebar } from '../../hooks/useSidebar';
import { notificationService } from '../../api/notificationService';
import { NotificationResponse } from '../../types';
import { API_BASE } from '../../api/axios';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.employeId) return;
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationService.getByEmploye(user.employeId),
        notificationService.getUnreadCount(user.employeId),
      ]);
      setNotifications(notifRes.data.data || []);
      setUnreadCount(countRes.data.data?.count || 0);
    } catch {
      // Silently fail
    }
  }, [user?.employeId]);

  // Fetch notifications on mount and poll every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refresh when dropdown opens
  useEffect(() => {
    if (showNotifications) fetchNotifications();
  }, [showNotifications, fetchNotifications]);

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

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.employeId) return;
    try {
      await notificationService.markAllAsRead(user.employeId);
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleNotifClick = (notif: NotificationResponse) => {
    if (!notif.lu) handleMarkAsRead(notif.id);
    if (notif.reunionId) {
      navigate('/admin/calendrier-projets?tab=reunions');
    } else if (notif.titre.includes('PLANIFICATION_PROJET')) { navigate('/admin/calendrier-projets'); } else if (notif.demandeId) {
      navigate('/mes-demandes');
    } else if (notif.titre.includes('employé') || notif.titre.includes('subordonné') || notif.titre.includes('Profil')) {
      navigate('/employes');
    } else if (notif.titre.includes('compétence') || notif.titre.includes('Compétence')) {
      navigate('/employes');
    } else if (notif.titre.includes('document') || notif.titre.includes('Document')) {
      navigate('/employes');
    }
    setShowNotifications(false);
  };

  const getNotifIcon = (titre: string) => {
    if (titre.includes('réunion') || titre.includes('Réunion'))
      return { icon: HiOutlineCalendar, bg: 'bg-indigo-50 dark:bg-indigo-500/10', color: 'text-indigo-500' };
    if (titre.includes('Nouvel employé') || titre.includes('Nouveau subordonné'))
      return { icon: HiOutlineUserAdd, bg: 'bg-brand-50 dark:bg-brand-500/10', color: 'text-brand-500' };
    if (titre.includes('modifiÃ©') || titre.includes('mis Ã  jour') || titre.includes('mise Ã  jour'))
      return { icon: HiOutlinePencilAlt, bg: 'bg-warning-50 dark:bg-warning-500/10', color: 'text-warning-500' };
    if (titre.includes('supprimÃ©') || titre.includes('retir') || titre.includes('rÃ©affectÃ©'))
      return { icon: HiOutlineTrash, bg: 'bg-error-50 dark:bg-error-500/10', color: 'text-error-500' };
    if (titre.includes('document') || titre.includes('Document'))
      return { icon: HiOutlineDocumentText, bg: 'bg-info-50 dark:bg-blue-500/10', color: 'text-blue-500' };
    if (titre.includes('compÃ©tence') || titre.includes('CompÃ©tence'))
      return { icon: HiOutlineStar, bg: 'bg-purple-50 dark:bg-purple-500/10', color: 'text-purple-500' };
    if (titre.includes('Photo'))
      return { icon: HiOutlinePhotograph, bg: 'bg-cyan-50 dark:bg-cyan-500/10', color: 'text-cyan-500' };
    if (titre.includes('Solde') || titre.includes('congÃ©'))
      return { icon: HiOutlineCalendar, bg: 'bg-teal-50 dark:bg-teal-500/10', color: 'text-teal-500' };
    if (titre.includes('refusÃ©e'))
      return { icon: HiOutlineXCircle, bg: 'bg-error-50 dark:bg-error-500/10', color: 'text-error-500' };
    if (titre.includes('approuvÃ©e') || titre.includes('acceptÃ©e'))
      return { icon: HiOutlineCheckCircle, bg: 'bg-success-50 dark:bg-success-500/10', color: 'text-success-500' };
    if (titre.includes('expirÃ©') || titre.includes('bientÃ´t'))
      return { icon: HiOutlineInformationCircle, bg: 'bg-orange-50 dark:bg-orange-500/10', color: 'text-orange-500' };
    return { icon: HiOutlineInformationCircle, bg: 'bg-gray-50 dark:bg-gray-500/10', color: 'text-gray-500' };
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Ã€ l'instant";
    if (diffMin < 60) return `Il y a ${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Hier';
    return `Il y a ${diffD}j`;
  };

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
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-error-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[380px] rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700">
                  <h4 className="text-theme-sm font-semibold text-gray-800 dark:text-white">
                    Notifications {unreadCount > 0 && <span className="text-brand-500">({unreadCount})</span>}
                  </h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-theme-xs text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      Tout marquer lu
                    </button>
                  )}
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-theme-sm text-gray-500 dark:text-gray-400">
                      Aucune notification
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={`flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                          !notif.lu ? 'bg-brand-50/50 dark:bg-brand-500/5' : ''
                        }`}
                      >
                        {(() => {
                          const { icon: Icon, bg, color } = getNotifIcon(notif.titre);
                          return (
                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg}`}>
                              <Icon className={color} size={16} />
                            </div>
                          );
                        })()}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-theme-sm ${!notif.lu ? 'font-semibold text-gray-800 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                              {notif.titre}
                            </p>
                            {!notif.lu && (
                              <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-theme-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 whitespace-pre-line">
                            {notif.message}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                            {formatTimeAgo(notif.dateCreation)}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {notifications.length > 10 && (
                  <div className="border-t border-gray-200 px-5 py-2.5 dark:border-gray-700">
                    <button
                      onClick={() => { navigate('/mes-demandes'); setShowNotifications(false); }}
                      className="w-full text-center text-theme-xs text-brand-500 hover:text-brand-600"
                    >
                      Voir toutes les notifications
                    </button>
                  </div>
                )}
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
                <img src={`${API_BASE}${user.imageUrl}`} alt="" className="h-9 w-9 rounded-full object-cover" />
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
                  {user?.roles?.[0] || 'EmployÃ©'}
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

