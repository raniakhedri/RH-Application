import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  HiOutlineBell,
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineChevronDown,
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineCollection,
  HiOutlineDocumentReport,
  HiOutlineFolder,
  HiOutlineHome,
  HiOutlineInformationCircle,
  HiOutlineLogout,
  HiOutlineMoon,
  HiOutlinePencilAlt,
  HiOutlinePhotograph,
  HiOutlineStar,
  HiOutlineSun,
  HiOutlineTrash,
  HiOutlineUser,
  HiOutlineUserAdd,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineXCircle,
  HiX,
} from 'react-icons/hi';
import { useSidebar } from '../../hooks/useSidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { API_BASE } from '../../api/axios';
import { projetService } from '../../api/projetService';
import { mediaPlanAssignmentService } from '../../api/mediaPlanAssignmentService';
import { notificationService } from '../../api/notificationService';
import { NotificationResponse, Projet } from '../../types';
import { relayAuthSnapshotForSwitch } from '../../utils/authStorage';
import './SidebarCanva.css';

interface NavItemDef {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
  permissions?: string[];
  children?: { label: string; path: string }[];
}

interface RailItemDef {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  permission?: string;
  permissions?: string[];
  badge?: string;
  matchPrefixes?: string[];
  action?: 'navigate' | 'panel';
  panelMode?: 'projets' | 'calendrier' | 'media-plan' | 'projects-analytics';
}

const panelGroupsTemplate: Array<{ title: string; items: NavItemDef[]; modes: Array<'projets' | 'calendrier' | 'media-plan' | 'projects-analytics'> }> = [
  {
    title: 'MENU',
    modes: ['projets'],
    items: [
      {
        key: 'projets',
        label: 'Projets',
        path: '/projets',
        icon: <HiOutlineBriefcase size={18} />,
        permission: 'VIEW_PROJETS',
      },
      {
        key: 'mes-projets',
        label: 'Mes projets',
        path: '/mes-taches',
        icon: <HiOutlineClipboardList size={18} />,
        permission: 'VIEW_MES_PROJETS',
      },
    ],
  },
  {
    title: 'CALENDRIER',
    modes: ['calendrier'],
    items: [
      {
        key: 'calendrier-projets',
        label: 'Calendrier Projets',
        path: '/admin/calendrier-projets',
        icon: <HiOutlineCalendar size={18} />,
        permissions: ['VIEW_CALENDRIER_PROJETS', 'VIEW_DEADLINES', 'VIEW_REUNIONS'],
        children: [],
      },
    ],
  },
  {
    title: 'PROJETS',
    modes: ['projects-analytics'],
    items: [
      {
        key: 'dashboard-projets-admin',
        label: 'Dashboard Projets',
        path: '/admin/dashboard-projets',
        icon: <HiOutlineChartBar size={18} />,
        permission: 'VIEW_TOUS_PROJETS',
      },
      {
        key: 'rapport-projet',
        label: 'Rapport Cycle de Vie',
        path: '/rapport-projet',
        icon: <HiOutlineDocumentReport size={18} />,
        permission: 'VIEW_PROJETS',
      },
    ],
  },
  {
    title: 'SOCIAL MEDIA',
    modes: ['media-plan'],
    items: [
      {
        key: 'media-plan',
        label: 'Media Plan',
        path: '/media-plan',
        icon: <HiOutlineChartBar size={18} />,
        permission: 'VIEW_MEDIA_PLAN',
        children: [],
      },
      {
        key: 'all-media-plan',
        label: 'Tous les Media Plan',
        path: '/admin/media-plans',
        icon: <HiOutlineChartBar size={18} />,
        permission: 'VIEW_TOUS_MEDIA_PLAN',
      },
    ],
  },
];

const railMainItems: RailItemDef[] = [
  {
    key: 'accueil',
    label: 'Accueil',
    icon: <HiOutlineHome size={20} />,
    path: '/accueil',
    matchPrefixes: ['/accueil'],
    action: 'navigate',
  },
  {
    key: 'projets',
    label: 'Projets',
    icon: <HiOutlineBriefcase size={20} />,
    path: '/mes-taches',
    permissions: ['VIEW_PROJETS', 'VIEW_MES_PROJETS'],
    matchPrefixes: ['/projets', '/mes-taches'],
    action: 'panel',
    panelMode: 'projets',
  },
  {
    key: 'calendrier',
    label: 'Calendrier',
    icon: <HiOutlineCalendar size={20} />,
    path: '/admin/calendrier-projets',
    permissions: ['VIEW_CALENDRIER_PROJETS', 'VIEW_DEADLINES', 'VIEW_REUNIONS'],
    matchPrefixes: ['/admin/calendrier-projets'],
    action: 'panel',
    panelMode: 'calendrier',
  },
];

const railSecondaryItems: RailItemDef[] = [
  {
    key: 'media-plan',
    label: 'Media Plan',
    icon: <HiOutlineChartBar size={20} />,
    path: '/media-plan',
    permission: 'VIEW_MEDIA_PLAN',
    matchPrefixes: ['/media-plan', '/admin/media-plans'],
    action: 'panel',
    panelMode: 'media-plan',
  },
  {
    key: 'rapports',
    label: 'Rapports',
    icon: <HiOutlineDocumentReport size={20} />,
    path: '/rapport-projet',
    permission: 'VIEW_PROJETS',
    matchPrefixes: ['/rapport-projet', '/admin/dashboard-projets'],
    action: 'panel',
    panelMode: 'projects-analytics',
  },
  {
    key: 'clients',
    label: 'Clients',
    icon: <HiOutlineUsers size={20} />,
    path: '/admin/clients',
    permission: 'VIEW_CLIENTS',
    matchPrefixes: ['/admin/clients'],
    action: 'navigate',
  },
];

const pathMatches = (currentPath: string, targetPrefix: string) =>
  currentPath === targetPrefix || currentPath.startsWith(`${targetPrefix}/`);

const panelRouteMatches = (currentPath: string, currentSearch: string, targetPath: string) => {
  const [targetPathname, targetQuery = ''] = targetPath.split('?');
  if (!pathMatches(currentPath, targetPathname)) return false;
  if (!targetQuery) return true;

  const currentParams = new URLSearchParams(currentSearch);
  const targetParams = new URLSearchParams(targetQuery);
  for (const [key, value] of targetParams.entries()) {
    if (currentParams.get(key) !== value) return false;
  }

  return true;
};

const normalizePermission = (permission: string) => permission.trim().toUpperCase();

const itemHasAccess = (item: { permission?: string; permissions?: string[] }, userPermissions: string[]) => {
  if (item.permissions) return item.permissions.some((permission) => userPermissions.includes(normalizePermission(permission)));
  return !item.permission || userPermissions.includes(normalizePermission(item.permission));
};

const isRailItemActive = (item: RailItemDef, pathname: string) => {
  const prefixes = item.matchPrefixes?.length ? item.matchPrefixes : [item.path.split('#')[0]];
  return prefixes.some((prefix) => pathMatches(pathname, prefix));
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const {
    isExpanded,
    isMobileOpen,
    isRailVisible,
    openSubmenu,
    setOpenSubmenu,
    toggleSidebar,
    toggleMobileSidebar,
    toggleRail,
  } = useSidebar();

  const userPermissions = useMemo(
    () => (user?.permissions ?? []).map((permission) => normalizePermission(permission)),
    [user?.permissions],
  );
  const canViewAllProjects = userPermissions.includes('VIEW_PROJETS');
  const canViewMyProjects = userPermissions.includes('VIEW_MES_PROJETS');
  const isMesProjetsOnly = canViewMyProjects && !canViewAllProjects;

  const [assignedClients, setAssignedClients] = useState<{ id: number; nom: string }[]>([]);
  const [assignedProjects, setAssignedProjects] = useState<Projet[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activePanelMode, setActivePanelMode] = useState<'projets' | 'calendrier' | 'media-plan' | 'projects-analytics' | null>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const rhAppUrl = (import.meta.env.VITE_RH_APP_URL as string | undefined)?.trim();
  const isClient = !!user?.isClient;
  const canViewValidations = userPermissions.includes('VIEW_VALIDATIONS');

  // Pages enabled for this client (set by the admin in the RH app).
  // If clientPages is empty/null ⇒ all pages are accessible.
  const clientPages: string[] = user?.clientPages ?? [];
  const hasClientPage = (key: string) =>
    !clientPages.length || clientPages.includes(key);

  // Build the client portal rail items dynamically from the enabled pages
  const clientRailItems: RailItemDef[] = useMemo(() => {
    if (!isClient) return [];
    const items: RailItemDef[] = [];
    if (hasClientPage('MEDIA_PLANS')) {
      items.push({
        key: 'client-media-plans',
        label: 'Mes Media Plans',
        icon: <HiOutlinePhotograph size={20} />,
        path: '/client/media-plans',
        matchPrefixes: ['/client/media-plans'],
        action: 'navigate',
      });
    }
    if (hasClientPage('PROJETS')) {
      items.push({
        key: 'client-projets',
        label: 'Mes Projets',
        icon: <HiOutlineBriefcase size={20} />,
        path: '/client/projets',
        matchPrefixes: ['/client/projets'],
        action: 'navigate',
      });
    }
    if (hasClientPage('FICHIERS')) {
      items.push({
        key: 'client-fichiers',
        label: 'Mes Fichiers',
        icon: <HiOutlineCollection size={20} />,
        path: '/client/fichiers',
        matchPrefixes: ['/client/fichiers'],
        action: 'navigate',
      });
    }
    return items;
  }, [isClient, clientPages.join(',')]);

  useEffect(() => {
    if (!user?.employeId || !userPermissions.includes('VIEW_MEDIA_PLAN')) {
      setAssignedClients([]);
      return;
    }

    const fetchClients = async () => {
      try {
        const response = await mediaPlanAssignmentService.getByEmploye(user.employeId);
        const assignments = response.data.data || [];
        const clientMap = new Map<number, string>();
        assignments.forEach((assignment: any) => clientMap.set(assignment.clientId, assignment.clientNom));
        setAssignedClients(Array.from(clientMap, ([id, nom]) => ({ id, nom })));
      } catch {
        setAssignedClients([]);
      }
    };

    fetchClients();
  }, [user?.employeId, userPermissions]);

  useEffect(() => {
    if (!user?.employeId || !canViewMyProjects) {
      setAssignedProjects([]);
      return;
    }

    const fetchAssignedProjects = async () => {
      try {
        const response = await projetService.getByEmploye(user.employeId);
        setAssignedProjects(response.data.data || []);
      } catch {
        setAssignedProjects([]);
      }
    };

    fetchAssignedProjects();
  }, [canViewMyProjects, user?.employeId]);

  const recentAssignedProjects = useMemo(
    () => [...assignedProjects]
      .sort((a, b) => new Date(b.dateDebut || 0).getTime() - new Date(a.dateDebut || 0).getTime())
      .slice(0, 10),
    [assignedProjects],
  );

  const fetchNotifications = async () => {
    if (!user?.employeId) return;
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationService.getByEmploye(user.employeId),
        notificationService.getUnreadCount(user.employeId),
      ]);
      setNotifications(notifRes.data.data || []);
      setUnreadCount(countRes.data.data?.count || 0);
    } catch {
      // ignore fetch errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.employeId]);

  useEffect(() => {
    if (showNotifications) fetchNotifications();
  }, [showNotifications, user?.employeId]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const visibleRailMain = useMemo(
    () => railMainItems.filter((item) => itemHasAccess(item, userPermissions)),
    [userPermissions],
  );

  const visibleRailSecondary = useMemo(
    () => railSecondaryItems.filter((item) => itemHasAccess(item, userPermissions)),
    [userPermissions],
  );

  const filteredPanelGroups = useMemo(() => {
    const groups = panelGroupsTemplate
      .filter((group) => !activePanelMode || group.modes.includes(activePanelMode))
      .map((group) => ({
        ...group,
        items: group.items
          .filter((item) => itemHasAccess(item, userPermissions))
          .map((item) => {
            if (item.key === 'calendrier-projets') {
              const children: Array<{ label: string; path: string }> = [];

             

              if (userPermissions.includes('VIEW_DEADLINES')) {
                children.push({ label: 'Deadlines', path: '/admin/calendrier-projets?tab=deadlines' });
              }

              if (userPermissions.includes('VIEW_REUNIONS')) {
                children.push({ label: 'R\u00e9unions', path: '/admin/calendrier-projets?tab=reunions' });
              }
               if (userPermissions.includes('VIEW_CALENDRIER_PROJETS')) {
                children.push({ label: 'Tournage', path: '/admin/calendrier-projets?tab=tournage' });
              }

              return {
                ...item,
                children,
              };
            }

            if (item.key === 'media-plan' && assignedClients.length > 0) {
              return {
                ...item,
                children: assignedClients.map((client) => ({
                  label: client.nom,
                  path: `/media-plan/${client.id}`,
                })),
              };
            }

            if (item.key === 'mes-projets' && assignedProjects.length > 0) {
              const clientMap = new Map<number | null, { id: number | null; nom: string }>();
              assignedProjects.forEach(p => {
                const cid = p.clientId || null;
                if (!clientMap.has(cid)) {
                  clientMap.set(cid, { id: cid, nom: p.clientNom || 'Projets Internes' });
                }
              });

              return {
                ...item,
                children: Array.from(clientMap.values()).map((client) => ({
                  label: client.nom,
                  path: client.id ? `/mes-taches?clientId=${client.id}` : '/mes-taches?clientId=internal',
                })),
              };
            }

            return item;
          }),
      }))
      .filter((group) => group.items.length > 0);

    return groups;
  }, [activePanelMode, assignedClients, recentAssignedProjects, userPermissions]);

  const panelTitle = useMemo(() => {
    if (activePanelMode === 'media-plan') return 'MediaPlan';
    if (activePanelMode === 'projects-analytics') return 'Projets';
    if (activePanelMode === 'projets') return 'Projets';
    if (activePanelMode === 'calendrier') return 'Calendrier';

    const allRailItems = [...visibleRailMain, ...visibleRailSecondary];
    const activeItem = allRailItems.find((item) => isRailItemActive(item, location.pathname));
    return activeItem?.key === 'accueil' ? 'Projets' : activeItem?.label || 'Projets';
  }, [activePanelMode, location.pathname, visibleRailMain, visibleRailSecondary]);

  const userInitials = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`.toUpperCase() || 'SA';

  const openPanelIfNeeded = () => {
    if (!isExpanded) toggleSidebar();
  };

  const closeAllPanels = () => {
    if (isExpanded) toggleSidebar();
    if (isMobileOpen) toggleMobileSidebar();
    setOpenSubmenu(null);
    setShowNotifications(false);
    setShowAccountMenu(false);
  };

  const handleRailClick = (item: RailItemDef) => {
    setShowNotifications(false);
    setShowAccountMenu(false);
    if (item.action === 'panel' && item.panelMode) {
      setActivePanelMode(item.panelMode);
      openPanelIfNeeded();

      if (item.panelMode === 'calendrier') {
        setOpenSubmenu('calendrier-projets');
      }

      if (item.key === 'projets' && isMesProjetsOnly) {
        navigate('/mes-taches');
        return;
      }

      navigate(item.path);
      return;
    }

    setActivePanelMode(null);
    closeAllPanels();

    if (item.key === 'projets' && isMesProjetsOnly) {
      navigate('/mes-taches');
      return;
    }

    navigate(item.path);
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, lu: true } : notif)));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.employeId) return;
    try {
      await notificationService.markAllAsRead(user.employeId);
      setNotifications((prev) => prev.map((notif) => ({ ...notif, lu: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const switchToRhApp = () => {
    if (rhAppUrl) {
      relayAuthSnapshotForSwitch();
      window.location.assign(rhAppUrl);
      return;
    }

    navigate('/accueil');
  };

  const handleNotificationClick = (notif: NotificationResponse) => {
    if (!notif.lu) handleMarkAsRead(notif.id);

    const title = (notif.titre || '').toLowerCase();
    const isPlanningOrMeeting =
      Boolean(notif.reunionId) ||
      title.includes('planification_projet') ||
      title.includes('planification projet') ||
      title.includes('reunion') ||
      title.includes('rÃ©union');

    const isRhRelated =
      Boolean(notif.demandeId) ||
      title.includes('demande') ||
      title.includes('employe') ||
      title.includes('employÃ©') ||
      title.includes('subordonne') ||
      title.includes('subordonnÃ©') ||
      title.includes('profil') ||
      title.includes('competence') ||
      title.includes('compÃ©tence') ||
      title.includes('document');

    if (isPlanningOrMeeting) {
      navigate(notif.reunionId ? '/admin/calendrier-projets?tab=reunions' : '/admin/calendrier-projets');
    } else if (isRhRelated) {
      switchToRhApp();
    } else {
      navigate('/accueil');
    }

    setShowNotifications(false);
  };

  const getNotificationIcon = (title: string) => {
    const value = title.toLowerCase();

    if (value.includes('reunion') || value.includes('rÃ©union')) {
      return { icon: HiOutlineCalendar, bg: 'bg-indigo-50 dark:bg-indigo-500/10', color: 'text-indigo-500' };
    }
    if (value.includes('nouvel employe') || value.includes('nouvel employÃ©') || value.includes('nouveau subordonne') || value.includes('nouveau subordonnÃ©')) {
      return { icon: HiOutlineUserAdd, bg: 'bg-brand-50 dark:bg-brand-500/10', color: 'text-brand-500' };
    }
    if (value.includes('mise a jour') || value.includes('mise Ã  jour') || value.includes('mis a jour') || value.includes('mis Ã  jour')) {
      return { icon: HiOutlinePencilAlt, bg: 'bg-warning-50 dark:bg-warning-500/10', color: 'text-warning-500' };
    }
    if (value.includes('supprime') || value.includes('supprimÃ©') || value.includes('retir') || value.includes('reaffecte') || value.includes('rÃ©affectÃ©')) {
      return { icon: HiOutlineTrash, bg: 'bg-error-50 dark:bg-error-500/10', color: 'text-error-500' };
    }
    if (value.includes('document')) {
      return { icon: HiOutlineDocumentReport, bg: 'bg-blue-50 dark:bg-blue-500/10', color: 'text-blue-500' };
    }
    if (value.includes('competence') || value.includes('compÃ©tence')) {
      return { icon: HiOutlineStar, bg: 'bg-purple-50 dark:bg-purple-500/10', color: 'text-purple-500' };
    }
    if (value.includes('photo')) {
      return { icon: HiOutlinePhotograph, bg: 'bg-cyan-50 dark:bg-cyan-500/10', color: 'text-cyan-500' };
    }
    if (value.includes('conge') || value.includes('congÃ©') || value.includes('solde')) {
      return { icon: HiOutlineCalendar, bg: 'bg-teal-50 dark:bg-teal-500/10', color: 'text-teal-500' };
    }
    if (value.includes('refusee') || value.includes('refusÃ©e')) {
      return { icon: HiOutlineXCircle, bg: 'bg-error-50 dark:bg-error-500/10', color: 'text-error-500' };
    }
    if (value.includes('approuvee') || value.includes('approuvÃ©e') || value.includes('acceptee') || value.includes('acceptÃ©e')) {
      return { icon: HiOutlineCheckCircle, bg: 'bg-success-50 dark:bg-success-500/10', color: 'text-success-500' };
    }

    return { icon: HiOutlineInformationCircle, bg: 'bg-gray-50 dark:bg-gray-500/10', color: 'text-gray-500' };
  };

  const formatTimeAgo = (dateValue: string) => {
    const now = new Date();
    const date = new Date(dateValue);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "A l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hier';
    return `Il y a ${diffDays} j`;
  };

  return (
    <>
      <aside className={`pc-icon-rail-shell ${isMobileOpen ? 'is-mobile-open' : ''} ${!isRailVisible ? 'rail-hidden' : ''}`}>
        <button
          type="button"
          className="pc-logo-btn"
          onClick={() => {
            setActivePanelMode(null);
            closeAllPanels();
            navigate('/accueil');
          }}
          aria-label="Ouvrir l'accueil"
        >
          A
        </button>

        <div className="pc-rail-divider" />

        <div className="pc-rail-list">
          {/* Client portal: show enabled client pages */}
          {isClient ? (
            clientRailItems.map((item) => {
              const active = isRailItemActive(item, location.pathname);
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`pc-icon-btn ${active ? 'active' : ''}`}
                  onClick={() => handleRailClick(item)}
                  aria-label={item.label}
                >
                  <span className="pc-icon-wrapper">{item.icon}</span>
                  <span className="iconLabel">{item.label}</span>
                </button>
              );
            })
          ) : (
            visibleRailMain.map((item) => {
              const active = isRailItemActive(item, location.pathname);
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`pc-icon-btn ${active ? 'active' : ''}`}
                  onClick={() => handleRailClick(item)}
                  aria-label={item.label}
                >
                  <span className="pc-icon-wrapper">{item.icon}</span>
                  <span className="iconLabel">{item.label}</span>
                  {item.badge && <span className="pc-icon-badge">{item.badge}</span>}
                </button>
              );
            })
          )}
        </div>

        <div className="pc-rail-divider" />

        {/* Secondary items: hidden for clients */}
        {!isClient && (
          <div className="pc-rail-list">
            {visibleRailSecondary.map((item) => {
              const active = isRailItemActive(item, location.pathname);
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`pc-icon-btn ${active ? 'active' : ''}`}
                  onClick={() => handleRailClick(item)}
                  aria-label={item.label}
                >
                  <span className="pc-icon-wrapper">{item.icon}</span>
                  <span className="iconLabel">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="pc-rail-spacer" />

        <div className="pc-bottom-controls">
          {/* Empty for now - only avatar button below */}
        </div>

        <div className="pc-rail-notif-wrap" ref={notifMenuRef}>
          <button
            type="button"
            className={`pc-icon-btn ${showNotifications ? 'active' : ''}`}
            onClick={() => {
              setShowAccountMenu(false);
              setShowNotifications((prev) => !prev);
            }}
            aria-label="Notifications"
          >
            <span className="pc-icon-wrapper"><HiOutlineBell size={20} /></span>
            <span className="iconLabel">Notifications</span>
            {unreadCount > 0 && <span className="pc-icon-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="pc-sidebar-notif-popover rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-800">
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
                      onClick={() => handleNotificationClick(notif)}
                      className={`flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!notif.lu ? 'bg-brand-50/50 dark:bg-brand-500/5' : ''
                        }`}
                    >
                      {(() => {
                        const { icon: Icon, bg, color } = getNotificationIcon(notif.titre || '');
                        return (
                          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg}`}>
                            <Icon className={color} size={16} />
                          </div>
                        );
                      })()}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-theme-sm ${!notif.lu ? 'font-semibold text-gray-800 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                            {notif.titre}
                          </p>
                          {!notif.lu && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                        </div>
                        <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-theme-xs text-gray-500 dark:text-gray-400">
                          {notif.message}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
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
                    onClick={() => {
                      navigate('/accueil#activite-recente');
                      setShowNotifications(false);
                    }}
                    className="w-full text-center text-theme-xs text-brand-500 hover:text-brand-600"
                  >
                    Voir toutes les notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pc-account-menu-wrap" ref={accountMenuRef}>
          <button
            type="button"
            className="pc-avatar-btn"
            title={`${user?.prenom ?? ''} ${user?.nom ?? ''}`}
            onClick={() => {
              setShowNotifications(false);
              setShowAccountMenu((prev) => !prev);
            }}
            aria-label="Compte utilisateur"
          >
            <div className="pc-avatar-chip">{userInitials}</div>
          </button>

          {showAccountMenu && (
            <div className="pc-account-popup">
              <div className="pc-account-popup-header">
                <div className="flex flex-1 items-center gap-3">
                  {user?.imageUrl ? (
                    <img src={`${API_BASE}${user.imageUrl}`} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #E86A2E, #F5A87A)' }}
                    >
                      {userInitials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="pc-account-name">{user?.prenom} {user?.nom}</p>
                    <p className="pc-account-email">{user?.email}</p>
                    <span className="pc-account-role-badge">{user?.roles?.[0] || 'Employe'}</span>
                  </div>
                </div>
              </div>

              <div className="pc-account-popup-divider" />

              <button
                onClick={() => {
                  setShowAccountMenu(false);
                  navigate('/mon-profil');
                }}
                className="pc-account-popup-item"
              >
                <HiOutlineUser size={18} />
                <span>Mon profil</span>
              </button>

              <div className="pc-account-popup-divider" />

              <div className="pc-account-popup-section-label">Theme</div>

              <div className="pc-account-popup-theme-options">
                <button
                  onClick={() => setTheme('light')}
                  className={`pc-account-popup-theme-btn ${theme === 'light' ? 'active' : ''}`}
                  title="Mode clair"
                >
                  <HiOutlineSun size={18} />
                  <span>Leger</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`pc-account-popup-theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  title="Mode sombre"
                >
                  <HiOutlineMoon size={18} />
                  <span>Sombre</span>
                </button>
              </div>

              <div className="pc-account-popup-divider" />

              <button
                onClick={() => {
                  setShowAccountMenu(false);
                  logout();
                }}
                className="pc-account-popup-item pc-account-popup-item-logout"
              >
                <HiOutlineLogout size={18} />
                <span>Se deconnecter</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {isExpanded && isRailVisible && <button type="button" className="pc-panel-overlay" onClick={closeAllPanels} aria-label="Fermer le panel" />}

      <section className={`pc-secondary-panel ${isExpanded && isRailVisible ? 'open' : ''}`} aria-hidden={!isExpanded || !isRailVisible}>
        <header className="pc-secondary-header">
          <div>
            <p className="pc-secondary-title">{panelTitle}</p>
            <p className="pc-secondary-subtitle">Module Projets</p>
          </div>
          <button type="button" className="pc-close-btn" onClick={closeAllPanels} aria-label="Fermer">
            <HiX size={18} />
          </button>
        </header>

        <div className="pc-secondary-content custom-scrollbar">
          {filteredPanelGroups.map((group) => (
            <div key={group.title} className="pc-panel-group">
              <p className="pc-panel-group-title">{group.title}</p>
              <ul className="pc-panel-list">
                {group.items.map((item) => (
                  <PanelItem
                    key={item.key}
                    item={item}
                    currentPath={location.pathname}
                    currentSearch={location.search}
                    openSubmenu={openSubmenu}
                    setOpenSubmenu={setOpenSubmenu}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

const PanelItem: React.FC<{
  item: NavItemDef;
  currentPath: string;
  currentSearch: string;
  openSubmenu: string | null;
  setOpenSubmenu: (submenu: string | null) => void;
}> = ({ item, currentPath, currentSearch, openSubmenu, setOpenSubmenu }) => {
  const navigate = useNavigate();
  const active = panelRouteMatches(currentPath, currentSearch, item.path);
  const childActive = item.children?.some((child) => panelRouteMatches(currentPath, currentSearch, child.path)) ?? false;
  const isOpen = openSubmenu === item.key || childActive;

  if (item.children && item.children.length > 0) {
    return (
      <li>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setOpenSubmenu(isOpen ? null : item.key);

            if (item.key !== 'mes-projets') {
              navigate(item.path);
            }
          }}
          className={`pc-panel-item ${active || childActive ? 'is-active' : ''}`}
        >
          <span className="pc-panel-item-icon">{item.icon}</span>
          <span className="pc-panel-item-label">{item.label}</span>
          <HiOutlineChevronDown size={16} className={`pc-chevron ${isOpen ? 'open' : ''}`} />
        </button>

        <div className="pc-panel-children" style={{ maxHeight: isOpen ? '420px' : '0px' }}>
          <ul className="pc-panel-child-list">
            {item.children.map((child) => (
              <li key={child.path}>
                <NavLink
                  to={child.path}
                  end
                  onClick={(event) => event.stopPropagation()}
                  className={`pc-panel-child ${panelRouteMatches(currentPath, currentSearch, child.path) ? 'is-active' : ''}`}
                >
                  {child.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </li>
    );
  }

  return (
    <li>
      <NavLink
        to={item.path}
        onClick={(event) => event.stopPropagation()}
        className={({ isActive }) => `pc-panel-item ${isActive ? 'is-active' : ''}`}
      >
        <span className="pc-panel-item-icon">{item.icon}</span>
        <span className="pc-panel-item-label">{item.label}</span>
      </NavLink>
    </li>
  );
};

export default Sidebar;
