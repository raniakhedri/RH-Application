import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck,
  HiOutlineClock,
  HiOutlineBriefcase,
  HiOutlineUserGroup,
  HiOutlineChevronDown,
  HiOutlineCollection,
  HiOutlineCalendar,
  HiOutlineKey,
  HiOutlineShieldCheck,
  HiOutlineClipboardList,
  HiOutlineViewBoards,
  HiOutlinePaperClip,
} from 'react-icons/hi';
import { useSidebar } from '../../hooks/useSidebar';
import { useAuth } from '../../context/AuthContext';
import { demandeService } from '../../api/demandeService';

interface NavItemDef {
  label: string;
  path: string;
  icon: React.ReactNode;
  key: string;
  permission?: string;
  badge?: number;
  children?: { label: string; path: string }[];
}

const menuGroups = [
  {
    title: 'MENU',
    items: [
      { key: 'dashboard', label: 'Tableau de bord', path: '/dashboard', icon: <HiOutlineHome size={20} />, permission: 'VIEW_DASHBOARD' },
      { key: 'employes', label: 'Employés', path: '/employes', icon: <HiOutlineUsers size={20} />, permission: 'VIEW_EMPLOYES' },

      {
        key: 'mes-demandes',
        label: 'Mes demandes',
        path: '/mes-demandes',
        icon: <HiOutlineClipboardList size={20} />,
        children: [
          { label: 'Mes demandes congés', path: '/mes-demandes' },
          { label: 'Mes demandes papiers', path: '/mes-demandes-papier' },
        ],
      },
      { key: 'mes-taches', label: 'Mes projets', path: '/mes-taches', icon: <HiOutlineViewBoards size={20} /> },
      { key: 'mon-calendrier', label: 'Mon calendrier', path: '/mon-calendrier', icon: <HiOutlineCalendar size={20} /> },

    ] as NavItemDef[],
  },
  {
    title: 'GESTION',
    items: [
      {
        key: 'validations',
        label: 'Validation demandes',
        path: '/validations',
        icon: <HiOutlineClipboardCheck size={20} />,
        permission: 'VIEW_VALIDATIONS',
        children: [
          { label: 'Demandes congés', path: '/demandes' },

          //{ label: 'Demandes papier', path: 'demandes/papier' },
          { label: 'Demandes papier', path: 'demandes/liste-papier' },


        ],
      },
      { key: 'pointage', label: 'Pointage', path: '/pointage', icon: <HiOutlineClock size={20} />, permission: 'VIEW_POINTAGE' },
    ] as NavItemDef[],
  },
  {
    title: 'PROJETS',
    items: [
      {
        key: 'projets',
        label: 'Projets',
        path: '/projets',
        icon: <HiOutlineBriefcase size={20} />,
        permission: 'VIEW_PROJETS',
       /* children: [
          { label: 'Tous les projets', path: '/projets' },
         { label: 'Tâches', path: '/taches' },
        ],*/
      },
      { key: 'equipes', label: 'Équipes', path: '/equipes', icon: <HiOutlineUserGroup size={20} />, permission: 'VIEW_EQUIPES' },
    ] as NavItemDef[],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { key: 'comptes', label: 'Comptes', path: '/comptes', icon: <HiOutlineKey size={20} />, permission: 'VIEW_COMPTES' },
      { key: 'roles', label: 'Rôles', path: '/roles', icon: <HiOutlineShieldCheck size={20} />, permission: 'VIEW_ROLES' },
      { key: 'referentiels', label: 'Référentiels', path: '/referentiels', icon: <HiOutlineCollection size={20} />, permission: 'VIEW_REFERENTIELS' },
      { key: 'calendrier', label: 'Calendrier', path: '/calendrier', icon: <HiOutlineCalendar size={20} />, permission: 'VIEW_CALENDRIER' },
    ] as NavItemDef[],
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { isExpanded, isMobileOpen, isHovered, openSubmenu, setIsHovered, setOpenSubmenu, toggleMobileSidebar } = useSidebar();
  const [pendingCount, setPendingCount] = useState(0);

  const userPermissions = user?.permissions || [];
  const canViewValidations = userPermissions.includes('VIEW_VALIDATIONS');

  // Fetch pending demandes count for users with validation permission
  useEffect(() => {
    if (!canViewValidations) return;
    const fetchPending = async () => {
      try {
        const res = await demandeService.getByStatut('EN_ATTENTE' as any);
        setPendingCount((res.data.data || []).length);
      } catch { /* ignore */ }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [canViewValidations]);

  // Filter menu groups by user permissions
  const filteredMenuGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        !item.permission || userPermissions.includes(item.permission)
      ),
    }))
    .filter((group) => group.items.length > 0);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const sidebarWidth = isExpanded || isHovered ? 'w-[290px]' : 'w-[90px]';
  const showText = isExpanded || isHovered;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-gray-900/50 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      <aside
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed left-0 top-0 z-[9999] flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900
          ${sidebarWidth}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white font-bold text-xl">
            A
          </div>
          {showText && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Antigone</h1>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">Gestion RH</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
          {filteredMenuGroups.map((group) => (
            <div key={group.title} className="mb-4">
              {showText && (
                <h3 className="mb-2 px-3 text-theme-xs font-semibold uppercase text-gray-400 dark:text-gray-500">
                  {group.title}
                </h3>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarItem
                    key={item.key}
                    item={item.key === 'demandes' && canViewValidations && pendingCount > 0 ? { ...item, badge: pendingCount } : item}
                    isActive={isActive}
                    showText={showText}
                    openSubmenu={openSubmenu}
                    setOpenSubmenu={setOpenSubmenu}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

const SidebarItem: React.FC<{
  item: NavItemDef;
  isActive: (path: string) => boolean;
  showText: boolean;
  openSubmenu: string | null;
  setOpenSubmenu: (key: string | null) => void;
}> = ({ item, isActive, showText, openSubmenu, setOpenSubmenu }) => {
  const active = isActive(item.path);
  const isOpen = openSubmenu === item.key;

  if (item.children) {
    return (
      <li>
        <button
          onClick={() => setOpenSubmenu(item.key)}
          className={`menu-item group ${active ? 'menu-item-active' : 'menu-item-inactive'}`}
        >
          <span className={active ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}>
            {item.icon}
          </span>
          {showText && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-warning-500 text-white text-[10px] font-bold">
                  {item.badge}
                </span>
              )}
              <HiOutlineChevronDown
                size={16}
                className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </>
          )}
        </button>
        {showText && (
          <div
            className="overflow-hidden transition-all duration-200"
            style={{ maxHeight: isOpen ? '200px' : '0px' }}
          >
            <ul className="mt-1 ml-3 space-y-0.5 border-l border-gray-200 pl-3 dark:border-gray-700">
              {item.children.map((child) => (
                <li key={child.path}>
                  <NavLink
                    to={child.path}
                    end
                    className={({ isActive: childActive }) =>
                      `menu-dropdown-item ${childActive ? 'menu-dropdown-item-active' : 'menu-dropdown-item-inactive'}`
                    }
                  >
                    {child.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </li>
    );
  }

  return (
    <li>
      <NavLink
        to={item.path}
        className={({ isActive: navActive }) =>
          `menu-item group ${navActive ? 'menu-item-active' : 'menu-item-inactive'}`
        }
      >
        <span className={active ? 'menu-item-icon-active' : 'menu-item-icon-inactive'}>
          {item.icon}
        </span>
        {showText && <span>{item.label}</span>}
      </NavLink>
    </li>
  );
};

export default Sidebar;
