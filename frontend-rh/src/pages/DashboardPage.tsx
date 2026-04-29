import React, { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineBell,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineFolder,
  HiOutlineLightningBolt,
  HiOutlineSearch,
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { demandeService } from '../api/demandeService';
import { demandePapierService } from '../api/demandePapierService';
import { notificationService } from '../api/notificationService';
import { tacheService } from '../api/tacheService';
import { calendrierService } from '../api/calendrierService';
import { documentEmployeService } from '../api/documentEmployeService';
import { employeService } from '../api/employeService';
import { validationService } from '../api/validationService';
import { useAuth } from '../context/AuthContext';
import {
  CalendrierJour,
  DecisionValidation,
  DemandeResponse,
  DocumentEmployeDTO,
  NotificationResponse,
  SoldeCongeInfo,
  StatutDemande,
  StatutTache,
  TacheDetail,
  Validation,
} from '../types';

type HeroStat = {
  value: string;
  label: string;
};

type FocusItem = {
  title: string;
  subtitle: string;
  dueText: string;
  badge: string;
  emoji: string;
  path: string;
  urgent?: boolean;
};

type RhCard = {
  id: string;
  title: string;
  status: string;
  emoji: string;
  meta: string;
  badges: string[];
  path: string;
  gradient: string;
};

const cardGradients = [
  'linear-gradient(135deg, #E86A2E, #F5A87A)',
  'linear-gradient(135deg, #7c3aed, #a78bfa)',
  'linear-gradient(135deg, #059669, #34d399)',
  'linear-gradient(135deg, #2563eb, #60a5fa)',
  'linear-gradient(135deg, #f59e0b, #fbbf24)',
  'linear-gradient(135deg, #0f9f77, #46d7af)',
];

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

const formatDemandeStatus = (statut: StatutDemande): string => {
  if (statut === StatutDemande.APPROUVEE) return 'Approuvee';
  if (statut === StatutDemande.REFUSEE) return 'Refusee';
  if (statut === StatutDemande.ANNULEE) return 'Annulee';
  return 'En attente';
};

const toDemandeEmoji = (type?: string | null): string => {
  const normalized = (type || '').toUpperCase();
  if (normalized.includes('CONGE')) return '🏖️';
  if (normalized.includes('AUTORISATION')) return '📝';
  if (normalized.includes('TELETRAVAIL')) return '💻';
  if (normalized.includes('ADMIN')) return '📂';
  return '📄';
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const employeId = user?.employeId;

  const [demandes, setDemandes] = useState<DemandeResponse[]>([]);
  const [demandesPapier, setDemandesPapier] = useState<DemandeResponse[]>([]);
  const [taches, setTaches] = useState<TacheDetail[]>([]);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [documents, setDocuments] = useState<DocumentEmployeDTO[]>([]);
  const [validations, setValidations] = useState<Validation[]>([]);
  const [joursFeries, setJoursFeries] = useState<CalendrierJour[]>([]);
  const [soldeInfo, setSoldeInfo] = useState<SoldeCongeInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const displayName = user?.prenom?.trim() || 'Utilisateur';
  const heroDateText = useMemo(() => `${formatHeroDate(new Date())} · Espace RH`, []);

  const fetchData = async () => {
    if (!employeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [
        demandesRes,
        demandesPapierRes,
        tachesRes,
        notificationsRes,
        documentsRes,
        validationsRes,
        feriesRes,
        soldeRes,
      ] = await Promise.all([
        demandeService.getByEmploye(employeId).catch(() => ({ data: { data: [] } })),
        demandePapierService.getAll().catch(() => ({ data: { data: [] } })),
        tacheService.getByAssignee(employeId).catch(() => ({ data: { data: [] } })),
        notificationService.getByEmploye(employeId).catch(() => ({ data: { data: [] } })),
        documentEmployeService.getByEmploye(employeId).catch(() => ({ data: { data: [] } })),
        validationService.getPendingByValidateur(employeId).catch(() => ({ data: { data: [] } })),
        calendrierService.getFeries(new Date().getFullYear()).catch(() => ({ data: { data: [] } })),
        employeService.getSoldeInfo(employeId).catch(() => ({ data: { data: null } })),
      ]);

      const allPapier = demandesPapierRes.data.data || [];
      setDemandes(demandesRes.data.data || []);
      setDemandesPapier(allPapier.filter((d: DemandeResponse) => d.employeId === employeId));
      setTaches(tachesRes.data.data || []);
      setNotifications(notificationsRes.data.data || []);
      setDocuments(documentsRes.data.data || []);
      setValidations(validationsRes.data.data || []);
      setJoursFeries(feriesRes.data.data || []);
      setSoldeInfo(soldeRes.data.data || null);
    } catch (error) {
      console.error('Erreur chargement dashboard RH:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [employeId]);

  const now = new Date();
  const dans30j = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const demandesEnAttente = demandes.filter((d) => d.statut === StatutDemande.EN_ATTENTE).length;
  const demandesApprouvees = demandes.filter((d) => d.statut === StatutDemande.APPROUVEE).length;
  const demandesRefusees = demandes.filter((d) => d.statut === StatutDemande.REFUSEE).length;
  const papierEnAttente = demandesPapier.filter((d) => d.statut === StatutDemande.EN_ATTENTE).length;
  const notifsNonLues = notifications.filter((n) => !n.lu).length;
  const validationsEnAttente = validations.filter((v) => v.decision === DecisionValidation.EN_ATTENTE).length;

  const tachesOuvertes = taches.filter((t) => t.statut !== StatutTache.DONE);
  const tachesEnRetard = tachesOuvertes.filter((t) => t.dateEcheance && new Date(t.dateEcheance) < now);
  const docsExpirant = documents.filter(
    (d) => d.dateExpiration && new Date(d.dateExpiration) >= now && new Date(d.dateExpiration) <= dans30j,
  );

  const demandesTraitees = demandesApprouvees + demandesRefusees;
  const demandeProgress = demandes.length > 0 ? Math.round((demandesTraitees / demandes.length) * 100) : 0;

  const prochainsFeries = [...joursFeries]
    .filter((j) => new Date(j.dateJour) >= now)
    .sort((a, b) => new Date(a.dateJour).getTime() - new Date(b.dateJour).getTime())
    .slice(0, 4);

  const heroStats = useMemo<HeroStat[]>(
    () => [
      { value: String(demandesEnAttente), label: 'Demandes en attente' },
      { value: String(notifsNonLues), label: 'Notifications non lues' },
      { value: `${soldeInfo?.soldeDisponible?.toFixed(1) ?? '0'}j`, label: 'Solde conge disponible' },
    ],
    [demandesEnAttente, notifsNonLues, soldeInfo],
  );

  const focusItem = useMemo<FocusItem | null>(() => {
    const topTask = [...tachesOuvertes].sort((a, b) => {
      const urgentWeight = Number(Boolean(b.urgente)) - Number(Boolean(a.urgente));
      if (urgentWeight !== 0) return urgentWeight;
      const aDate = new Date(a.dateEcheance || '2999-12-31').getTime();
      const bDate = new Date(b.dateEcheance || '2999-12-31').getTime();
      return aDate - bDate;
    })[0];

    if (topTask) {
      return {
        title: topTask.titre,
        subtitle: `Priorite du jour · ${topTask.projetNom || 'Tache personnelle'}`,
        dueText: formatShortDate(topTask.dateEcheance),
        badge: topTask.urgente ? 'Urgent' : 'A planifier',
        emoji: topTask.urgente ? '⚡' : '🎯',
        path: '/mon-calendrier',
        urgent: Boolean(topTask.urgente),
      };
    }

    const pendingDemande = [...demandes]
      .filter((d) => d.statut === StatutDemande.EN_ATTENTE)
      .sort((a, b) => new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime())[0];

    if (pendingDemande) {
      return {
        title: pendingDemande.typeCongeLabel || pendingDemande.type || 'Demande RH',
        subtitle: 'Action RH en attente de traitement',
        dueText: formatShortDate(pendingDemande.dateCreation),
        badge: 'En attente',
        emoji: toDemandeEmoji(pendingDemande.type),
        path: '/mes-demandes',
      };
    }

    const expiringDoc = [...docsExpirant].sort(
      (a, b) => new Date(a.dateExpiration || '2999-12-31').getTime() - new Date(b.dateExpiration || '2999-12-31').getTime(),
    )[0];

    if (expiringDoc) {
      return {
        title: expiringDoc.nom,
        subtitle: 'Document RH a renouveler prochainement',
        dueText: formatShortDate(expiringDoc.dateExpiration),
        badge: 'Expire bientot',
        emoji: '📄',
        path: '/mon-profil',
      };
    }

    return null;
  }, [demandes, docsExpirant, tachesOuvertes]);

  const recentRhCards = useMemo<RhCard[]>(() => {
    const demandeCards = [...demandes]
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
      .slice(0, 4)
      .map((demande, index) => ({
        id: `demande-${demande.id}`,
        title: demande.typeCongeLabel || demande.type || 'Demande RH',
        status: formatDemandeStatus(demande.statut),
        emoji: toDemandeEmoji(demande.type),
        meta: `Soumise le ${formatShortDate(demande.dateCreation)}`,
        badges: [demande.joursOuvrables ? `${demande.joursOuvrables}j` : 'RH', 'Workflow'],
        path: '/mes-demandes',
        gradient: cardGradients[index % cardGradients.length],
      }));

    const docCards = [...documents]
      .sort((a, b) => new Date(b.dateExpiration || 0).getTime() - new Date(a.dateExpiration || 0).getTime())
      .slice(0, 2)
      .map((doc, index) => {
        const isExpired = doc.dateExpiration && new Date(doc.dateExpiration) < now;
        const isExpiring = doc.dateExpiration && new Date(doc.dateExpiration) <= dans30j;
        const status = isExpired ? 'Expire' : isExpiring ? 'Expire bientot' : 'A jour';

        return {
          id: `doc-${doc.id}`,
          title: doc.nom,
          status,
          emoji: '📄',
          meta: `${doc.type || 'Document'} · ${formatShortDate(doc.dateExpiration)}`,
          badges: ['Document', isExpired ? 'A renouveler' : 'Suivi'],
          path: '/mon-profil',
          gradient: cardGradients[(index + demandeCards.length) % cardGradients.length],
        };
      });

    const ferieCards = prochainsFeries.slice(0, 1).map((jour, index) => ({
      id: `ferie-${jour.id}`,
      title: jour.nomJour,
      status: 'Jour ferie',
      emoji: '📅',
      meta: `Le ${formatShortDate(jour.dateJour)}`,
      badges: ['Calendrier', 'Entreprise'],
      path: '/mon-calendrier',
      gradient: cardGradients[(index + demandeCards.length + docCards.length) % cardGradients.length],
    }));

    return [...demandeCards, ...docCards, ...ferieCards].slice(0, 6);
  }, [demandes, documents, now, dans30j, prochainsFeries]);

  const overviewRows = [
    {
      label: 'Demandes en attente',
      value: demandesEnAttente,
      icon: <HiOutlineClock size={16} />,
      path: '/mes-demandes',
      dotClass: 'bg-amber-400 dark:bg-amber-500',
    },
    {
      label: 'Demandes approuvees',
      value: demandesApprouvees,
      icon: <HiOutlineCheckCircle size={16} />,
      path: '/mes-demandes',
      dotClass: 'bg-emerald-400 dark:bg-emerald-500',
    },
    {
      label: 'Demandes papier en attente',
      value: papierEnAttente,
      icon: <HiOutlineFolder size={16} />,
      path: '/mes-demandes-papier',
      dotClass: 'bg-indigo-400 dark:bg-indigo-500',
    },
    {
      label: 'Validations a traiter',
      value: validationsEnAttente,
      icon: <HiOutlineExclamation size={16} />,
      path: '/validations',
      dotClass: 'bg-rose-400 dark:bg-rose-500',
    },
    {
      label: 'Notifications non lues',
      value: notifsNonLues,
      icon: <HiOutlineBell size={16} />,
      path: '/dashboard',
      dotClass: 'bg-sky-400 dark:bg-sky-500',
    },
    {
      label: 'Documents qui expirent',
      value: docsExpirant.length,
      icon: <HiOutlineFolder size={16} />,
      path: '/mon-profil',
      dotClass: 'bg-brand- dark:bg-brand-',
    },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
          <p className="text-gray-500 dark:text-gray-400">Chargement de votre dashboard RH...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-10 bg-gray-50/30 px-4 py-8 font-sans dark:bg-gray-900/20 lg:px-8 lg:py-10">
      <section
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-black px-8 py-12 shadow-2xl dark:from-gray-950 dark:via-gray-900 dark:to-black lg:px-12 lg:py-16"
        aria-label="Banniere d'accueil RH"
      >
        <div className="pointer-events-none absolute right-0 top-0 -mr-20 -mt-20 h-[400px] w-[400px] rounded-full bg-brand-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 -mb-20 -ml-20 h-[300px] w-[300px] rounded-full bg-indigo-500/20 blur-[80px]" />
        <div className="pointer-events-none absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />

        <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-brand-400">
              <HiOutlineLightningBolt size={18} />
              {heroDateText}
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white lg:text-5xl">
              Bonjour, <span className="bg-gradient-to-r from-brand-400 to-brand-200 bg-clip-text text-transparent">{displayName}</span>
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-gray-400">
              Bienvenue sur votre espace RH. Suivez vos demandes, documents et actions prioritaires d'un seul coup d'oeil.
            </p>

            <div className="group relative mt-8 max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <HiOutlineSearch className="text-gray-400 transition-colors group-focus-within:text-brand-400" size={20} />
              </div>
              <input
                type="text"
                placeholder="Rechercher une demande, un document..."
                className="w-full rounded-full border border-white/10 bg-white/5 py-3.5 pl-12 pr-6 text-white placeholder-gray-500 backdrop-blur-md transition-all focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                aria-label="Recherche principale RH"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 lg:gap-6">
            {heroStats.map((stat, index) => (
              <div
                key={stat.label}
                className="flex min-w-[140px] flex-col justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-md transition-colors hover:bg-white/10"
                style={{ animation: `fadeUp 0.5s ease-out ${index * 0.1}s forwards` }}
              >
                <strong className="mb-1 text-3xl font-bold text-white">{stat.value}</strong>
                <span className="text-xs font-medium uppercase tracking-widest text-gray-400">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="animate-fade-in-up space-y-5" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-gray-800 dark:text-white">Focus du jour</h2>
        </div>

        {focusItem ? (
          <div
            onClick={() => navigate(focusItem.path)}
            className="group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-brand-500/20 bg-white p-6 transition-all duration-300 hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-500/10 dark:border-brand-400/20 dark:bg-gray-800 lg:p-8"
          >
            <div className="pointer-events-none absolute right-0 top-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-brand-500/10 blur-[40px] transition-colors duration-500 group-hover:bg-brand-500/20" />
            <div className="pointer-events-none absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-[40px] transition-colors duration-500 group-hover:bg-indigo-500/20" />

            <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="flex items-start gap-5 md:items-center">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-2xl text-white shadow-lg">
                  {focusItem.emoji}
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-brand-500 dark:text-white">
                      {focusItem.title}
                    </h3>
                    {focusItem.urgent && (
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{focusItem.subtitle}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 md:items-end md:gap-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Echeance</p>
                <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                  <HiOutlineCalendar size={18} className="text-brand-500" />
                  {focusItem.dueText}
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {focusItem.badge}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-5 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 dark:border-emerald-500/20 dark:from-emerald-900/10 dark:to-teal-900/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              🎉
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">Tout est sous controle</h3>
              <p className="text-sm text-emerald-600/90 dark:text-emerald-400/80">
                Aucune priorite critique detectee. Votre dashboard RH est a jour.
              </p>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <section className="animate-fade-in-up space-y-5 xl:col-span-2" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-gray-800 dark:text-white">Mes dossiers RH recents</h2>
            <button
              type="button"
              className="group flex items-center gap-1 text-sm font-bold text-brand-500 transition-colors hover:text-brand-600 dark:text-brand-400"
              onClick={() => navigate('/mes-demandes')}
            >
              Voir tout <span className="transform transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {!loading && recentRhCards.length === 0 ? (
              <article className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-12 text-center dark:border-gray-700/50 dark:bg-gray-800">
                <span className="mb-4 text-5xl opacity-50">📁</span>
                <h3 className="mb-2 text-lg font-bold text-gray-800 dark:text-white">Aucun element recent</h3>
                <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
                  Vos demandes, documents et jalons RH s'afficheront ici des qu'ils seront disponibles.
                </p>
              </article>
            ) : (
              recentRhCards.map((card, index) => (
                <article
                  key={card.id}
                  className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-gray-200/50 dark:border-gray-700/50 dark:bg-gray-800 dark:hover:shadow-black/20"
                  style={{ animation: `fadeUp 0.5s ease-out ${0.2 + index * 0.1}s forwards` }}
                  onClick={() => navigate(card.path)}
                >
                  <div className="absolute left-0 right-0 top-0 h-1" style={{ background: card.gradient }} />

                  <header className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {card.status}
                    </span>
                    <span className="text-2xl transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
                      {card.emoji}
                    </span>
                  </header>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold leading-snug text-gray-900 transition-colors group-hover:text-brand-500 dark:text-white">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-xs font-medium text-gray-400 dark:text-gray-500">{card.meta}</p>
                  </div>

                  <footer className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4 dark:border-gray-700/50">
                    <div className="flex -space-x-2" aria-label="Badges">
                      {card.badges.map((badge, badgeIndex) => (
                        <div
                          key={`${card.id}-${badge}-${badgeIndex}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[10px] font-bold text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {badge.slice(0, 2).toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="translate-x-2 text-xs font-bold text-brand-500 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                      Ouvrir →
                    </span>
                  </footer>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="animate-fade-in-up space-y-5" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-gray-800 dark:text-white">Ou en est mon espace RH ?</h2>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm dark:border-gray-700/50 dark:bg-gray-800">
            {!loading && demandes.length === 0 && overviewRows.every((row) => Number(row.value) === 0) ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 opacity-50 dark:bg-gray-700/50">
                  <HiOutlineClipboardList size={32} />
                </div>
                <h3 className="mb-1 text-sm font-bold text-gray-800 dark:text-white">Aucune activite RH</h3>
                <p className="text-xs text-gray-400">Vos indicateurs apparaitront ici automatiquement.</p>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-center space-y-7">
                <div>
                  <div className="mb-2 flex items-end justify-between">
                    <span className="text-sm font-bold text-gray-800 dark:text-white">Traitement des demandes</span>
                    <span className="text-lg font-extrabold text-brand-500">{demandeProgress}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-1000 ease-out"
                      style={{ width: `${demandeProgress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t border-gray-50 pt-2 dark:border-gray-700/50">
                  {overviewRows.map((row) => (
                    <div key={row.label} className="group flex cursor-pointer items-center" onClick={() => navigate(row.path)}>
                      <div className={`mr-3 h-2 w-2 rounded-full transition-transform group-hover:scale-150 ${row.dotClass}`} />
                      <div className="mr-2 text-gray-400">{row.icon}</div>
                      <div className="flex-1 text-sm font-medium text-gray-600 dark:text-gray-300">{row.label}</div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{row.value}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/mes-demandes')}
                  className="mt-2 w-full rounded-2xl border border-transparent bg-gray-50 py-3 text-sm font-bold text-gray-600 transition-colors hover:border-brand-500/20 hover:bg-brand-50 hover:text-brand-500 dark:bg-gray-700/30 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                >
                  Acceder a mes demandes
                </button>

                <button
                  onClick={fetchData}
                  className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:border-brand-300 hover:text-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-brand-500/40 dark:hover:text-brand-400"
                >
                  Actualiser les donnees
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

export default DashboardPage;
