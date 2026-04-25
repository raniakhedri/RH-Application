import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { API_BASE } from '../../api/axios';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck,
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
  HiOutlineDesktopComputer,
  HiOutlineDocumentReport,
  HiOutlineDownload,
  HiOutlineChartBar,
  HiOutlinePhotograph,
} from 'react-icons/hi';
import { useSidebar } from '../../hooks/useSidebar';
import { useAuth } from '../../context/AuthContext';
import { demandeService } from '../../api/demandeService';
import { agentDashboardService } from '../../api/agentDashboardService';
import { mediaPlanAssignmentService } from '../../api/mediaPlanAssignmentService';
import Logo3D from '../ui/Logo3D';

interface NavItemDef {
  label: string;
  path: string;
  icon: React.ReactNode;
  key: string;
  permission?: string;
  /** If set, item is visible when user has ANY of these permissions */
  permissions?: string[];
  badge?: number;
  children?: { label: string; path: string }[];
}

const menuGroups = [
  {
    title: 'MENU',
    items: [
      {
        key: 'projets',
        label: 'Projets',
        path: '/projets',
        icon: <HiOutlineBriefcase size={20} />,
        permission: 'VIEW_PROJETS',
      },
      { key: 'mes-taches', label: 'Mes projets', path: '/mes-taches', icon: <HiOutlineViewBoards size={20} />, permission: 'VIEW_MES_PROJETS' },
      { key: 'calendrier-projets-menu', label: 'Calendrier Projets', path: '/admin/calendrier-projets', icon: <HiOutlineCalendar size={20} />, permissions: ['VIEW_CALENDRIER_PROJETS', 'VIEW_DEADLINES', 'VIEW_REUNIONS'] },

    ] as NavItemDef[],
  },
  {
    title: 'PROJETS',
    items: [
      { key: 'taches', label: 'Tâches', path: '/taches', icon: <HiOutlineClipboardList size={20} />, permission: 'VIEW_PROJETS' },
      { key: 'equipes', label: 'Équipes', path: '/equipes', icon: <HiOutlineUserGroup size={20} />, permission: 'VIEW_EQUIPES' },
      { key: 'rapport-projet', label: 'Rapport Cycle de Vie', path: '/rapport-projet', icon: <HiOutlineDocumentReport size={20} />, permission: 'VIEW_PROJETS' },
    ] as NavItemDef[],
  },
  {
    title: 'SOCIAL MEDIA',
    items: [
      { key: 'media-plan', label: 'Media Plan', path: '/media-plan', icon: <HiOutlinePhotograph size={20} />, permission: 'VIEW_MEDIA_PLAN', children: [] },
    ] as NavItemDef[],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { key: 'tous-projets-admin', label: 'Tous les projets', path: '/admin/projets', icon: <HiOutlineBriefcase size={20} />, permission: 'VIEW_TOUS_PROJETS' },
      { key: 'dashboard-projets-admin', label: 'Dashboard Projets', path: '/admin/dashboard-projets', icon: <HiOutlineChartBar size={20} />, permission: 'VIEW_TOUS_PROJETS' },
      { key: 'clients', label: 'Clients', path: '/admin/clients', icon: <HiOutlineUsers size={20} />, permission: 'VIEW_CLIENTS' },
      { key: 'tous-media-plan', label: 'Tous les Media Plan', path: '/admin/media-plans', icon: <HiOutlinePhotograph size={20} />, permission: 'VIEW_TOUS_MEDIA_PLAN' },
    ] as NavItemDef[],
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { isExpanded, isMobileOpen, isHovered, openSubmenu, setIsHovered, setOpenSubmenu, toggleMobileSidebar } = useSidebar();
  const [pendingCount, setPendingCount] = useState(0);
  const [agentActive, setAgentActive] = useState(true);
  const [assignedClients, setAssignedClients] = useState<{ id: number; nom: string }[]>([]);

  const isClient = !!user?.isClient;
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

  // Check if agent is active for current user
  useEffect(() => {
    if (!user?.employeId) return;
    const checkAgent = async () => {
      try {
        const res = await agentDashboardService.checkAgentActive(user.employeId);
        setAgentActive(res.data.data.active);
      } catch {
        setAgentActive(false);
      }
    };
    checkAgent();
    const interval = setInterval(checkAgent, 60000); // check every minute
    return () => clearInterval(interval);
  }, [user?.employeId]);

  // Fetch assigned clients for sidebar sub-items
  useEffect(() => {
    if (!user?.employeId || !userPermissions.includes('VIEW_MEDIA_PLAN')) return;
    const fetchClients = async () => {
      try {
        const res = await mediaPlanAssignmentService.getByEmploye(user.employeId);
        const assignments = res.data.data || [];
        const clientMap = new Map<number, string>();
        assignments.forEach((a: any) => clientMap.set(a.clientId, a.clientNom));
        setAssignedClients(Array.from(clientMap, ([id, nom]) => ({ id, nom })));
      } catch { /* ignore */ }
    };
    fetchClients();
  }, [user?.employeId, userPermissions]);

  // ── Client portal menu (shown only when isClient) ─────────────────────────
  // A page is visible when clientPages is empty/null (unrestricted) OR contains this page key
  const hasPage = (pageKey: string) => {
    const pages = user?.clientPages;
    if (!pages || pages.length === 0) return true; // no restriction
    return pages.includes(pageKey);
  };

  const clientMenuGroups = [
    {
      title: 'MON ESPACE',
      items: ([
        hasPage('MEDIA_PLANS') && {
          key: 'client-media-plans',
          label: 'Mes Media Plans',
          path: '/client/media-plans',
          icon: <HiOutlinePhotograph size={20} />,
        },
        hasPage('PROJETS') && {
          key: 'client-projets',
          label: 'Mes Projets',
          path: '/client/projets',
          icon: <HiOutlineBriefcase size={20} />,
        },
        hasPage('FICHIERS') && {
          key: 'client-fichiers',
          label: 'Mes Fichiers',
          path: '/client/fichiers',
          icon: <HiOutlineCollection size={20} />,
        },
      ].filter(Boolean)) as NavItemDef[],
    },
  ];

  // ── Employee menus (shown only when NOT a client) ─────────────────────────
  const filteredMenuGroups = isClient ? [] : menuGroups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => {
          if (item.permissions) return item.permissions.some(p => userPermissions.includes(p));
          return !item.permission || userPermissions.includes(item.permission);
        })
        .map((item) => {
          if (item.key === 'media-plan' && assignedClients.length > 0) {
            return {
              ...item,
              children: assignedClients.map((c) => ({
                label: c.nom,
                path: `/media-plan/${c.id}`,
              })),
            };
          }
          return item;
        }),
    }))
    .filter((group) => group.items.length > 0);

  const activeMenuGroups = isClient ? clientMenuGroups : filteredMenuGroups;

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
          <Logo3D size={40} />
          {showText && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Antigone</h1>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                {isClient ? user?.nom || 'Client' : 'Module Projets'}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
          {activeMenuGroups.map((group) => (
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

        {/* Agent download button - only shown if agent is not active */}
        {!agentActive && !isClient && (
          <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3">
            <a
              href={`${API_BASE}/api/agent/download`}
              download
              className="flex items-center gap-3 rounded-lg bg-brand-500 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
            >
              <HiOutlineDownload size={20} className="shrink-0" />
              {showText && <span>Installer l'Agent</span>}
            </a>
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
          className="menu-item group menu-item-inactive"
        >
          <span className="menu-item-icon-inactive">
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
            style={{ maxHeight: isOpen ? '500px' : '0px' }}
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
