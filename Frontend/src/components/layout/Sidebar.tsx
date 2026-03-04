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
  HiOutlineDownload,
  HiOutlineCurrencyDollar,
} from 'react-icons/hi';
import { useSidebar } from '../../hooks/useSidebar';
import { useAuth } from '../../context/AuthContext';
import { demandeService } from '../../api/demandeService';
import axios from '../../api/axios';

interface NavItemDef {
  label: string;
  path: string;
  icon: React.ReactNode;
  key: string;
  permission?: string;
  children?: { label: string; path: string }[];
}

const menuGroups = [
  {
    title: 'MENU',
    items: [
      { key: 'dashboard', label: 'Tableau de bord', path: '/dashboard', icon: <HiOutlineHome size={20} /> },
      { key: 'employes', label: 'Employés', path: '/employes', icon: <HiOutlineUsers size={20} /> },
    ] as NavItemDef[],
  },
  {
    title: 'GESTION',
    items: [
      {
        key: 'demandes',
        label: 'Demandes',
        path: '/demandes',
        icon: <HiOutlineDocumentText size={20} />,
        children: [
          { label: 'Toutes les demandes', path: '/demandes' },
          { label: 'Nouvelle demande', path: '/demandes/new' },
        ],
      },
      { key: 'validations', label: 'Validations', path: '/validations', icon: <HiOutlineClipboardCheck size={20} /> },
      { key: 'pointage', label: 'Pointage', path: '/pointage', icon: <HiOutlineClock size={20} /> },
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
        children: [
          { label: 'Tous les projets', path: '/projets' },
          { label: 'Tâches', path: '/taches' },
        ],
      },
      { key: 'equipes', label: 'Équipes', path: '/equipes', icon: <HiOutlineUserGroup size={20} /> },
    ] as NavItemDef[],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { key: 'referentiels', label: 'Référentiels', path: '/referentiels', icon: <HiOutlineCollection size={20} /> },
      { key: 'calendrier', label: 'Calendrier', path: '/calendrier', icon: <HiOutlineCalendar size={20} /> },
    ] as NavItemDef[],
  },
  {
    title: 'MONITORING',
    items: [
      { key: 'suivi-temps-reel', label: 'Suivi temps réel', path: '/suivi-temps-reel', icon: <HiOutlineClock size={20} />, permission: 'VIEW_SUIVI_TEMPS_REEL' },
      { key: 'gestion-paie', label: 'Gestion de paie', path: '/gestion-paie', icon: <HiOutlineCurrencyDollar size={20} />, permission: 'VIEW_FICHES_PAIE' },
    ] as NavItemDef[],
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isExpanded, isMobileOpen, isHovered, openSubmenu, setIsHovered, setOpenSubmenu, toggleMobileSidebar } = useSidebar();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [agentAvailable, setAgentAvailable] = useState(false);

  const isAdmin = user?.roles?.includes('SUPER_ADMIN');

  // Check if agent installer is available AND employee doesn't have it yet
  useEffect(() => {
    const checkAgent = async () => {
      try {
        const employeId = user?.employeId;
        const url = employeId ? `/agent/download/info?employeId=${employeId}` : '/agent/download/info';
        const resp = await axios.get(url);
        if (resp.data?.available && !resp.data?.alreadyInstalled) {
          setAgentAvailable(true);
        } else {
          setAgentAvailable(false);
        }
      } catch { /* ignore */ }
    };
    checkAgent();
  }, [user?.employeId]);

  const handleDownloadAgent = async () => {
    setDownloading(true);
    try {
      const response = await axios.get('/agent/download', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Antigone-RH-Agent-Setup.exe');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Erreur lors du téléchargement de l\'agent.');
    } finally {
      setDownloading(false);
    }
  };

  // Fetch pending demandes count for admin
  useEffect(() => {
    if (!isAdmin) return;
    const fetchPending = async () => {
      try {
        const res = await demandeService.getByStatut('EN_ATTENTE' as any);
        setPendingCount((res.data.data || []).length);
      } catch { /* ignore */ }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [isAdmin]);

  const userPermissions = user?.permissions || [];
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');

  // Filter menu groups: SUPER_ADMIN sees everything, others need permissions
  const filteredMenuGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        isSuperAdmin || !item.permission || userPermissions.includes(item.permission)
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
                    item={item}
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

        {/* Agent Download Button */}
        {agentAvailable && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleDownloadAgent}
              disabled={downloading}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all disabled:opacity-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white">
                {downloading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <HiOutlineDownload size={18} />
                )}
              </span>
              {showText && (
                <div className="overflow-hidden text-left">
                  <p className="text-sm font-semibold truncate">
                    {downloading ? 'Téléchargement...' : 'Télécharger l\'Agent'}
                  </p>
                  <p className="text-[10px] text-blue-400 dark:text-blue-500">Monitoring PC</p>
                </div>
              )}
            </button>
          </div>
        )}
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
                    end={child.path === item.path}
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
