import React, { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineLightningBolt,
  HiOutlineBell,
  HiOutlineSearch,
  HiOutlineUserGroup,
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../api/notificationService';
import { projetService } from '../api/projetService';
import { tacheService } from '../api/tacheService';
import { NotificationResponse, Projet, StatutProjet, StatutTache, TacheDetail } from '../types';
import './AccueilProjetsPage.css';

type Shortcut = {
  key: string;
  label: string;
  path: string;
  gradient: string;
  icon: React.ReactNode;
  permission?: string;
  permissions?: string[];
};

type RecentProject = {
  id: number;
  name: string;
  gradient: string;
  emoji: string;
  status: string;
  createdText: string;
  managers: string[];
  taskPath: string;
};

type ActivityItem = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  time: string;
  path: string;
};

const shortcutsConfig: Shortcut[] = [
  {
    key: 'new-project',
    label: 'Nouveau projet',
    path: '/projets',
    gradient: 'linear-gradient(135deg, #e86a2e 0%, #f5a87a 100%)',
    icon: <HiOutlineBriefcase size={24} />,
    permissions: ['MANAGE_ALL_PROJETS', 'CREATE_PROJET'],
  },
  {
    key: 'new-task',
    label: 'Nouvelle tache',
    path: '/mes-taches',
    gradient: 'linear-gradient(135deg, #5963f3 0%, #9ea6ff 100%)',
    icon: <HiOutlineClipboardList size={24} />,
    permissions: ['VIEW_PROJETS_CREATE_TACHES', 'MANAGE_ALL_PROJETS', 'CREATE_TACHE'],
  },
  {
    key: 'media-plan',
    label: 'Media Plan',
    path: '/media-plan',
    gradient: 'linear-gradient(135deg, #0f9f77 0%, #46d7af 100%)',
    icon: <HiOutlineChartBar size={24} />,
    permission: 'VIEW_MEDIA_PLAN',
  },
  {
    key: 'calendar',
    label: 'Calendrier',
    path: '/admin/calendrier-projets',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #b28cff 100%)',
    icon: <HiOutlineCalendar size={24} />,
    permissions: ['VIEW_CALENDRIER_PROJETS', 'VIEW_DEADLINES', 'VIEW_REUNIONS'],
  },

];

const projectGradients = [
  'linear-gradient(135deg, #E86A2E, #F5A87A)',
  'linear-gradient(135deg, #7c3aed, #a78bfa)',
  'linear-gradient(135deg, #059669, #34d399)',
  'linear-gradient(135deg, #2563eb, #60a5fa)',
  'linear-gradient(135deg, #f59e0b, #fbbf24)',
  'linear-gradient(135deg, #0f9f77, #46d7af)',
];

const statusLabel: Record<string, string> = {
  PLANIFIE: 'Planifie',
  EN_COURS: 'En cours',
  CLOTURE: 'Cloture',
  CLOTURE_INCOMPLET: 'Cloture incomplet',
  ANNULE: 'Annule',
};

const formatHeroDate = (date: Date): string => {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);

  return parts.charAt(0).toUpperCase() + parts.slice(1);
};

const formatShortDate = (value?: string | null): string => {
  if (!value) return 'Date inconnue';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatRelativeTime = (value?: string | null): string => {
  if (!value) return 'Date inconnue';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(1, Math.round(diffMs / 60000));
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  return `Il y a ${diffDays} j`;
};

const buildInitials = (fullName?: string | null): string => {
  if (!fullName) return 'NA';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'NA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const hasPermission = (shortcut: Shortcut, userPermissions: string[]): boolean => {
  if (shortcut.permissions?.length) {
    return shortcut.permissions.some((permission) => userPermissions.includes(permission));
  }
  if (shortcut.permission) {
    return userPermissions.includes(shortcut.permission);
  }
  return true;
};

const toActivityIcon = (title: string): string => {
  const normalized = title.toLowerCase();
  if (normalized.includes('tache')) return '🧩';
  if (normalized.includes('projet')) return '🚀';
  if (normalized.includes('reunion')) return '📅';
  if (normalized.includes('validation')) return '✅';
  if (normalized.includes('retard')) return '⏰';
  return '🔔';
};

const AccueilProjetsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const employeId = user?.employeId;
  const userPermissions = user?.permissions || [];

  const [projets, setProjets] = useState<Projet[]>([]);
  const [taches, setTaches] = useState<TacheDetail[]>([]);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const displayName = user?.prenom?.trim() || 'System Admin';
  const heroDateText = useMemo(() => `${formatHeroDate(new Date())} · Antigone`, []);

  useEffect(() => {
    const fetchAccueilData = async () => {
      if (!employeId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [projetsRes, tachesRes, notificationsRes] = await Promise.all([
          projetService.getByEmploye(employeId).catch(() => ({ data: { data: [] } })),
          tacheService.getByAssignee(employeId).catch(() => ({ data: { data: [] } })),
          notificationService.getByEmploye(employeId).catch(() => ({ data: { data: [] } })),
        ]);

        setProjets(projetsRes.data.data || []);
        setTaches(tachesRes.data.data || []);
        setNotifications(notificationsRes.data.data || []);
      } catch (error) {
        console.error('Erreur chargement accueil projets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccueilData();
  }, [employeId]);

  const shortcuts = useMemo(
    () => shortcutsConfig.filter((shortcut) => hasPermission(shortcut, userPermissions)),
    [userPermissions],
  );

  const canOpenProjectDetails = userPermissions.includes('VIEW_PROJETS') || userPermissions.includes('VIEW_TOUS_PROJETS');

  const recentProjects = useMemo<RecentProject[]>(() => {
    return [...projets]
      .sort((a, b) => new Date(b.dateDebut || 0).getTime() - new Date(a.dateDebut || 0).getTime())
      .slice(0, 6)
      .map((project, index) => {
        const managers = project.chefsDeProjet?.length
          ? project.chefsDeProjet.map((m) => buildInitials(`${m.prenom || ''} ${m.nom || ''}`))
          : project.chefDeProjet
            ? [buildInitials(`${project.chefDeProjet.prenom || ''} ${project.chefDeProjet.nom || ''}`)]
            : [buildInitials(project.createurNom || '')];

        const status = statusLabel[project.statut] || project.statut;
        const statusEmoji =
          project.statut === StatutProjet.EN_COURS ? '🚀' :
          project.statut === StatutProjet.PLANIFIE ? '📅' :
          project.statut === StatutProjet.CLOTURE ? '✅' :
          project.statut === StatutProjet.ANNULE ? '⛔' : '📁';

        return {
          id: project.id,
          name: project.nom,
          gradient: projectGradients[index % projectGradients.length],
          emoji: statusEmoji,
          status,
          createdText: `Cree par ${project.createurNom || 'System'} · ${formatShortDate(project.dateDebut)}`,
          managers,
          taskPath: canOpenProjectDetails
            ? (userPermissions.includes('VIEW_TOUS_PROJETS') && !userPermissions.includes('VIEW_PROJETS')
              ? `/admin/projets/${project.id}/taches`
              : `/projets/${project.id}/taches`)
            : '/mes-taches',
        };
      });
  }, [projets, canOpenProjectDetails, userPermissions]);

  const activities = useMemo<ActivityItem[]>(() => {
    const notificationActivities = [...notifications]
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
      .slice(0, 8)
      .map((notification) => ({
        id: `notif-${notification.id}`,
        icon: toActivityIcon(notification.titre || ''),
        title: notification.titre || 'Nouvelle notification',
        subtitle: notification.message || 'Mise a jour disponible',
        time: formatRelativeTime(notification.dateCreation),
        path: '/accueil#activite-recente',
      }));

    if (notificationActivities.length > 0) {
      return notificationActivities;
    }

    return [...taches]
      .filter((task) => !!task.dateEcheance)
      .sort((a, b) => new Date(a.dateEcheance || 0).getTime() - new Date(b.dateEcheance || 0).getTime())
      .slice(0, 8)
      .map((task) => ({
        id: `task-${task.id}`,
        icon: task.statut === StatutTache.DONE ? '✅' : task.urgente ? '⚡' : '🧩',
        title: task.titre,
        subtitle: task.projetNom ? `Projet: ${task.projetNom}` : 'Tache personnelle',
        time: formatRelativeTime(task.dateEcheance),
        path: '/mes-taches',
      }));
  }, [notifications, taches]);

  const heroStats = useMemo(() => {
    const projetsActifs = projets.filter((project) =>
      project.statut === StatutProjet.EN_COURS || project.statut === StatutProjet.PLANIFIE,
    ).length;
    const notifsNonLues = notifications.filter((notification) => !notification.lu).length;
    const tachesOuvertes = taches.filter((task) => task.statut !== StatutTache.DONE).length;

    return [
      { value: projetsActifs.toString(), label: 'Projets actifs' },
      { value: notifsNonLues.toString(), label: 'Notifications non lues' },
      { value: tachesOuvertes.toString(), label: 'Taches ouvertes' },
    ];
  }, [projets, notifications, taches]);

  const priorityTask = useMemo(() => {
    const openTasks = taches.filter((task) => task.statut !== StatutTache.DONE);
    const urgents = openTasks.filter(t => t.urgente);
    if (urgents.length > 0) {
      return urgents.sort((a, b) => new Date(a.dateEcheance || 0).getTime() - new Date(b.dateEcheance || 0).getTime())[0];
    }
    return openTasks.sort((a, b) => new Date(a.dateEcheance || 0).getTime() - new Date(b.dateEcheance || 0).getTime())[0] || null;
  }, [taches]);

  const taskStats = useMemo(() => {
    const total = taches.length;
    if (total === 0) return { aFaire: 0, enCours: 0, enRevision: 0, termine: 0, total: 0 };

    const aFaire = taches.filter(t => t.statut === StatutTache.TODO || !t.statut).length;
    const enCours = taches.filter(t => t.statut === StatutTache.IN_PROGRESS).length;
    const termine = taches.filter(t => t.statut === StatutTache.DONE).length;
    
    // Any other status falls back to "enRevision" or we just calculate it directly
    const enRevision = total - (aFaire + enCours + termine);

    return { aFaire, enCours, enRevision: Math.max(0, enRevision), termine, total };
  }, [taches]);

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-gray-900/20 px-4 py-8 lg:px-8 lg:py-10 space-y-10 font-sans">
      {/* 🚀 HERO SECTION */}
      <section 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-black dark:from-gray-950 dark:via-gray-900 dark:to-black px-8 py-12 lg:px-12 lg:py-16 shadow-2xl"
        aria-label="Banniere d'accueil"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[400px] w-[400px] rounded-full bg-brand-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-[300px] w-[300px] rounded-full bg-indigo-500/20 blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <p className="text-brand-400 font-medium tracking-wide text-sm mb-3 uppercase flex items-center gap-2">
              <HiOutlineLightningBolt size={18} />
              {heroDateText}
            </p>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Bonjour, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-200">{displayName}</span>
            </h1>
            <p className="mt-4 text-gray-400 text-lg leading-relaxed">
              Prêt(e) à accomplir de grandes choses aujourd'hui ? Voici un aperçu de vos projets et tâches en cours.
            </p>

            <div className="mt-8 relative max-w-md group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <HiOutlineSearch className="text-gray-400 group-focus-within:text-brand-400 transition-colors" size={20} />
              </div>
              <input
                type="text"
                placeholder="Rechercher un projet, une tâche..."
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-full py-3.5 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:bg-white/10 transition-all backdrop-blur-md"
                aria-label="Recherche principale"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 lg:gap-6">
            {heroStats.map((stat, i) => (
              <div 
                key={stat.label} 
                className="flex flex-col justify-center bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-6 py-5 min-w-[140px] hover:bg-white/10 transition-colors"
                style={{ animation: `fadeUp 0.5s ease-out ${i * 0.1}s forwards` }}
              >
                <strong className="text-3xl font-bold text-white mb-1">{stat.value}</strong>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🎯 FOCUS DU JOUR (Replaces shortcuts) */}
      <section className="space-y-5 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">Focus du jour</h2>
        </div>

        {priorityTask ? (
          <div 
            onClick={() => navigate('/mes-taches')}
            className="group relative overflow-hidden bg-white dark:bg-gray-800 border-2 border-brand-500/20 dark:border-brand-400/20 rounded-3xl p-6 lg:p-8 cursor-pointer transition-all duration-300 hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-500/10"
          >
            {/* Elegant Background Glow */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-brand-500/10 blur-[40px] pointer-events-none group-hover:bg-brand-500/20 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-[40px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-500" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start md:items-center gap-5">
                <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg text-2xl">
                  {priorityTask.urgente ? '⚡' : '🎯'}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">{priorityTask.titre}</h3>
                    {priorityTask.urgente && (
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/10 rounded-full">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Projet : <span className="text-gray-700 dark:text-gray-300">{priorityTask.projetNom || 'Personnel'}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-2 md:gap-1">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Échéance</p>
                <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                  <HiOutlineCalendar size={18} className="text-brand-500" />
                  {formatShortDate(priorityTask.dateEcheance)}
                </div>
              </div>
            </div>
          </div>
        ) : (
           <div className="flex items-center gap-5 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl">
             <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-2xl">
               🎉
             </div>
             <div>
               <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">Vous êtes à jour !</h3>
               <p className="text-sm text-emerald-600 dark:text-emerald-400/80">Aucune tâche ouverte, profitez de cette tranquillité pour avancer sur de nouvelles idées.</p>
             </div>
           </div>
        )}
      </section>

      {/* ✨ PROJECTS & ACTIVITY GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* MES PROJETS RECENTS */}
        <section className="xl:col-span-2 space-y-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">Mes projets récents</h2>
            <button 
              type="button" 
              className="text-sm font-bold text-brand-500 hover:text-brand-600 dark:text-brand-400 transition-colors flex items-center gap-1 group" 
              onClick={() => navigate('/projets')}
            >
              Voir tout <span className="transform group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {!loading && recentProjects.length === 0 ? (
              <article className="col-span-full flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl text-center">
                <span className="text-5xl mb-4 opacity-50">📁</span>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Aucun projet récent</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">Vous n'êtes affecté(e) à aucun projet récent pour le moment.</p>
              </article>
            ) : (
              recentProjects.map((project, index) => (
                <article
                  key={project.id}
                  className="group relative flex flex-col bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-black/20 hover:-translate-y-1 cursor-pointer overflow-hidden"
                  style={{ animation: `fadeUp 0.5s ease-out ${0.2 + index * 0.1}s forwards` }}
                  onClick={() => navigate(project.taskPath)}
                >
                  {/* Subtle top gradient line */}
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: project.gradient }} />
                  
                  <header className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {project.status}
                    </span>
                    <span className="text-2xl transform group-hover:scale-110 transition-transform duration-300" aria-hidden="true">{project.emoji}</span>
                  </header>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug group-hover:text-brand-500 transition-colors">{project.name}</h3>
                    <p className="mt-2 text-xs font-medium text-gray-400 dark:text-gray-500">{project.createdText}</p>
                  </div>

                  <footer className="mt-6 flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700/50">
                    <div className="flex -space-x-2" aria-label="Managers">
                      {project.managers.map((manager, idx) => (
                        <div 
                          key={`${project.id}-${manager}-${idx}`} 
                          className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 text-[10px] font-bold text-gray-600 dark:text-gray-300 shadow-sm"
                        >
                          {manager}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-brand-500 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      Voir tâches →
                    </span>
                  </footer>
                </article>
              ))
            )}
          </div>
        </section>

        {/* MES TACHES OVERVIEW */}
        <section className="space-y-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">Où en sont mes tâches ?</h2>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-7 shadow-sm">
            {!loading && taskStats.total === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-700/50 mb-4 opacity-50">
                  <HiOutlineClipboardList size={32} />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1">Aucune tâche assignée</h3>
                <p className="text-xs text-gray-400">Quand vous aurez des tâches, votre progression apparaîtra ici.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full justify-center space-y-7">
                {/* Progress Bar Global */}
                <div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-sm font-bold text-gray-800 dark:text-white">Avancement global</span>
                    <span className="text-lg font-extrabold text-brand-500">{taskStats.total > 0 ? Math.round((taskStats.termine / taskStats.total) * 100) : 0}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${taskStats.total > 0 ? (taskStats.termine / taskStats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-50 dark:border-gray-700/50 space-y-4">
                  {/* Stat: À faire */}
                  <div className="flex items-center group cursor-pointer" onClick={() => navigate('/mes-taches')}>
                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 mr-3 group-hover:scale-150 transition-transform" />
                    <div className="flex-1 text-sm font-medium text-gray-600 dark:text-gray-300">À faire</div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{taskStats.aFaire}</span>
                  </div>
                  
                  {/* Stat: En cours */}
                  <div className="flex items-center group cursor-pointer" onClick={() => navigate('/mes-taches')}>
                    <div className="w-2 h-2 rounded-full bg-blue-400 dark:bg-blue-500 mr-3 group-hover:scale-150 transition-transform shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                    <div className="flex-1 text-sm font-medium text-gray-600 dark:text-gray-300">En cours</div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{taskStats.enCours}</span>
                  </div>

                  {/* Stat: En révision */}
                  <div className="flex items-center group cursor-pointer" onClick={() => navigate('/mes-taches')}>
                    <div className="w-2 h-2 rounded-full bg-purple-400 dark:bg-purple-500 mr-3 group-hover:scale-150 transition-transform shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
                    <div className="flex-1 text-sm font-medium text-gray-600 dark:text-gray-300">En révision / Test</div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{taskStats.enRevision}</span>
                  </div>
                  
                  {/* Stat: Terminé */}
                  <div className="flex items-center group cursor-pointer" onClick={() => navigate('/mes-taches')}>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 dark:bg-emerald-500 mr-3 group-hover:scale-150 transition-transform shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    <div className="flex-1 text-sm font-medium text-gray-600 dark:text-gray-300">Terminées</div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{taskStats.termine}</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/mes-taches')}
                  className="w-full mt-2 py-3 rounded-2xl bg-gray-50 hover:bg-brand-50 dark:bg-gray-700/30 dark:hover:bg-brand-500/10 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-brand-500 dark:hover:text-brand-400 transition-colors border border-transparent hover:border-brand-500/20"
                >
                  Accéder au Kanban
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AccueilProjetsPage;
