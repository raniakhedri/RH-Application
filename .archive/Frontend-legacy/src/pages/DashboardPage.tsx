import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineCalendar,
  HiOutlineClipboardList,
  HiOutlineBell,
  HiOutlineRefresh,
  HiOutlineAcademicCap,
  HiOutlineFolder,
  HiOutlineExclamation,
  HiOutlineStar,
  HiOutlineChevronRight,
  HiOutlinePaperClip,
  HiOutlineLightningBolt,
  HiOutlineChartBar,
  HiOutlineSun,
} from 'react-icons/hi';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { demandeService } from '../api/demandeService';
import { demandePapierService } from '../api/demandePapierService';
import { tacheService } from '../api/tacheService';
import { projetService } from '../api/projetService';
import { notificationService } from '../api/notificationService';
import { documentEmployeService } from '../api/documentEmployeService';
import { competenceService } from '../api/competenceService';
import { employeService } from '../api/employeService';
import { validationService } from '../api/validationService';
import { tacheObligatoireService, TacheObligatoireDTO } from '../api/tacheObligatoireService';
import { calendrierService } from '../api/calendrierService';
import {
  DemandeResponse, StatutDemande, TypeDemande,
  TacheDetail, StatutTache,
  Projet, StatutProjet,
  NotificationResponse, SoldeCongeInfo, CompetenceDTO, DocumentEmployeDTO,
  Validation, DecisionValidation, CalendrierJour, TypeJour,
} from '../types';

const COLORS = {
  brand: '#f36904',
  secondary: '#683B77',
  blue: '#3b82f6',
  green: '#10b981',
  red: '#ef4444',
  yellow: '#f59e0b',
  gray: '#6b7280',
  cyan: '#06b6d4',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6',
};

const PIE_COLORS = [COLORS.brand, COLORS.secondary, COLORS.blue, COLORS.green, COLORS.cyan, COLORS.pink, COLORS.indigo, COLORS.teal, COLORS.yellow, COLORS.red];

const tooltipStyle = { borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' };

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const employeId = user?.employeId;

  const [demandes, setDemandes] = useState<DemandeResponse[]>([]);
  const [demandesPapier, setDemandesPapier] = useState<DemandeResponse[]>([]);
  const [taches, setTaches] = useState<TacheDetail[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [soldeInfo, setSoldeInfo] = useState<SoldeCongeInfo | null>(null);
  const [competences, setCompetences] = useState<CompetenceDTO[]>([]);
  const [documents, setDocuments] = useState<DocumentEmployeDTO[]>([]);
  const [validations, setValidations] = useState<Validation[]>([]);
  const [tachesObligatoires, setTachesObligatoires] = useState<TacheObligatoireDTO[]>([]);
  const [joursFeries, setJoursFeries] = useState<CalendrierJour[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!employeId) return;
    setLoading(true);
    try {
      const [
        demandesRes, demandesPapierRes, tachesRes, projetsRes, notifsRes,
        soldeRes, compsRes, docsRes, valsRes, tachesObRes, feriésRes,
      ] = await Promise.all([
        demandeService.getByEmploye(employeId),
        demandePapierService.getAll().catch(() => ({ data: { data: [] } })),
        tacheService.getByAssignee(employeId),
        projetService.getByEmploye(employeId),
        notificationService.getByEmploye(employeId),
        employeService.getSoldeInfo(employeId),
        competenceService.getByEmploye(employeId).catch(() => ({ data: { data: [] } })),
        documentEmployeService.getByEmploye(employeId).catch(() => ({ data: { data: [] } })),
        validationService.getPendingByValidateur(employeId).catch(() => ({ data: { data: [] } })),
        tacheObligatoireService.getByEmploye(employeId).catch(() => ({ data: { data: [] } })),
        calendrierService.getFeries(new Date().getFullYear()).catch(() => ({ data: { data: [] } })),
      ]);
      setDemandes(demandesRes.data.data || []);
      // Filter papier demandes for current employee
      const allPapier = demandesPapierRes.data.data || [];
      setDemandesPapier(allPapier.filter((d: DemandeResponse) => d.employeId === employeId));
      setTaches(tachesRes.data.data || []);
      setProjets(projetsRes.data.data || []);
      setNotifications(notifsRes.data.data || []);
      setSoldeInfo(soldeRes.data.data || null);
      setCompetences(compsRes.data.data || []);
      setDocuments(docsRes.data.data || []);
      setValidations(valsRes.data.data || []);
      setTachesObligatoires(tachesObRes.data.data || []);
      setJoursFeries(feriésRes.data.data || []);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [employeId]);

  // ==================== COMPUTED DATA ====================

  // -- Congés --
  const demandesEnAttente = demandes.filter(d => d.statut === StatutDemande.EN_ATTENTE).length;
  const demandesApprouvees = demandes.filter(d => d.statut === StatutDemande.APPROUVEE).length;
  const demandesRefusees = demandes.filter(d => d.statut === StatutDemande.REFUSEE).length;

  // -- Demandes papier --
  const papierEnAttente = demandesPapier.filter(d => d.statut === StatutDemande.EN_ATTENTE).length;

  // -- Tâches --
  const tachesTodo = taches.filter(t => t.statut === StatutTache.TODO).length;
  const tachesInProgress = taches.filter(t => t.statut === StatutTache.IN_PROGRESS).length;
  const tachesDone = taches.filter(t => t.statut === StatutTache.DONE).length;
  const tachesEnRetard = taches.filter(t => t.dateEcheance && new Date(t.dateEcheance) < new Date() && t.statut !== StatutTache.DONE).length;

  // -- Projets --
  const projetsEnCours = projets.filter(p => p.statut === StatutProjet.EN_COURS).length;

  // -- Notifications non lues --
  const notifsNonLues = notifications.filter(n => !n.lu).length;

  // -- Documents expirant bientôt --
  const now = new Date();
  const dans30j = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const docsExpirant = documents.filter(d => d.dateExpiration && new Date(d.dateExpiration) <= dans30j && new Date(d.dateExpiration) >= now);

  // -- Validations en attente (si manager) --
  const validationsEnAttente = validations.filter(v => v.decision === DecisionValidation.EN_ATTENTE).length;

  // -- Prochains jours fériés --
  const prochainsFeries = joursFeries
    .filter(j => new Date(j.dateJour) >= now)
    .sort((a, b) => new Date(a.dateJour).getTime() - new Date(b.dateJour).getTime())
    .slice(0, 4);

  // -- Demandes par type pour chart --
  const demandesParType = demandes.reduce<Record<string, number>>((acc, d) => {
    const t = d.type || 'Autre';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const typeLabels: Record<string, string> = {
    CONGE: 'Congé', AUTORISATION: 'Autorisation', TELETRAVAIL: 'Télétravail', ADMINISTRATION: 'Administration',
  };
  const demandesTypeData = Object.entries(demandesParType).map(([key, value], i) => ({
    name: typeLabels[key] || key, value, color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  // -- Tâches statut chart --
  const tacheStatutData = [
    { name: 'À faire', value: tachesTodo, color: COLORS.yellow },
    { name: 'En cours', value: tachesInProgress, color: COLORS.blue },
    { name: 'Terminées', value: tachesDone, color: COLORS.green },
  ].filter(d => d.value > 0);

  // -- Compétences par catégorie --
  const compParCategorie = competences.reduce<Record<string, CompetenceDTO[]>>((acc, c) => {
    const cat = c.categorie || 'Autre';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {});

  // -- Tâches prochaines échéances --
  const tachesProchaines = [...taches]
    .filter(t => t.statut !== StatutTache.DONE && t.dateEcheance)
    .sort((a, b) => new Date(a.dateEcheance!).getTime() - new Date(b.dateEcheance!).getTime())
    .slice(0, 5);

  // -- Dernières demandes --
  const dernieresDemandes = [...demandes]
    .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
    .slice(0, 5);

  // -- Notifications récentes --
  const notifsRecentes = [...notifications]
    .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
    .slice(0, 5);

  // -- Tâches obligatoires à venir --
  const tachesObProchaines = tachesObligatoires
    .filter(t => t.dates.some(d => new Date(d) >= now))
    .slice(0, 5);

  // -- Solde congé chart --
  const soldeChartData = soldeInfo ? [
    { name: 'Disponible', value: soldeInfo.soldeDisponible, color: COLORS.green },
    { name: 'Consommés', value: soldeInfo.joursConsommes, color: COLORS.red },
    { name: 'En attente', value: soldeInfo.joursEnAttente, color: COLORS.yellow },
  ].filter(d => d.value > 0) : [];

  // -- Greeting --
  function getGreeting() {
    const h = now.getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  // -- Alert items in banner --
  const alertItems = useMemo(() => {
    const items: { icon: React.ReactNode; label: string }[] = [];
    if (demandesEnAttente > 0) items.push({ icon: <HiOutlineClock size={14} />, label: `${demandesEnAttente} demande(s) en attente` });
    if (tachesEnRetard > 0) items.push({ icon: <HiOutlineExclamation size={14} />, label: `${tachesEnRetard} tâche(s) en retard` });
    if (validationsEnAttente > 0) items.push({ icon: <HiOutlineCheckCircle size={14} />, label: `${validationsEnAttente} validation(s) à traiter` });
    if (notifsNonLues > 0) items.push({ icon: <HiOutlineBell size={14} />, label: `${notifsNonLues} notification(s) non lue(s)` });
    if (docsExpirant.length > 0) items.push({ icon: <HiOutlineFolder size={14} />, label: `${docsExpirant.length} doc(s) expire(nt) bientôt` });
    if (items.length === 0) items.push({ icon: <HiOutlineCheckCircle size={14} />, label: 'Tout est à jour !' });
    return items;
  }, [demandesEnAttente, tachesEnRetard, validationsEnAttente, notifsNonLues, docsExpirant.length]);

  // -- Agenda 7 jours --
  const agendaSemaine = useMemo(() => {
    const events: { type: string; titre: string; detail: string; dateLabel: string; badge: string; date: Date; icon: React.ReactNode }[] = [];
    const dans7j = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Tâches en retard
    taches.filter(t => t.dateEcheance && new Date(t.dateEcheance) < now && t.statut !== StatutTache.DONE).forEach(t => {
      const d = new Date(t.dateEcheance!);
      events.push({
        type: 'retard', titre: t.titre, detail: t.projetNom || 'Tâche personnelle',
        dateLabel: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        badge: 'En retard', date: d, icon: <HiOutlineExclamation size={18} />,
      });
    });

    // Tâches à venir (7j)
    taches.filter(t => t.dateEcheance && new Date(t.dateEcheance) >= now && new Date(t.dateEcheance) <= dans7j && t.statut !== StatutTache.DONE).forEach(t => {
      const d = new Date(t.dateEcheance!);
      events.push({
        type: 'tache', titre: t.titre, detail: t.projetNom || 'Tâche personnelle',
        dateLabel: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        badge: `Échéance ${Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))}j`, date: d,
        icon: <HiOutlineClipboardList size={18} />,
      });
    });

    // Congés approuvés à venir
    demandes.filter(d => d.statut === StatutDemande.APPROUVEE && d.dateDebut && new Date(d.dateDebut) >= now && new Date(d.dateDebut) <= dans7j).forEach(d => {
      const dt = new Date(d.dateDebut!);
      events.push({
        type: 'conge', titre: d.typeCongeLabel || typeLabels[d.type] || d.type,
        detail: `${d.dateDebut} → ${d.dateFin}${d.joursOuvrables ? ` (${d.joursOuvrables}j)` : ''}`,
        dateLabel: dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        badge: 'Congé', date: dt, icon: <HiOutlineSun size={18} />,
      });
    });

    // Jours fériés
    joursFeries.filter(j => new Date(j.dateJour) >= now && new Date(j.dateJour) <= dans7j).forEach(j => {
      const d = new Date(j.dateJour);
      events.push({
        type: 'ferie', titre: j.nomJour, detail: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
        dateLabel: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        badge: 'Férié', date: d, icon: <HiOutlineCalendar size={18} />,
      });
    });

    // Tâches obligatoires
    tachesObligatoires.forEach(t => {
      t.dates.filter(ds => { const d = new Date(ds); return d >= now && d <= dans7j; }).forEach(ds => {
        const d = new Date(ds);
        events.push({
          type: 'obligatoire', titre: t.nom, detail: `Équipe: ${t.equipeNom}`,
          dateLabel: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
          badge: 'Obligatoire', date: d, icon: <HiOutlineLightningBolt size={18} />,
        });
      });
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 8);
  }, [taches, demandes, joursFeries, tachesObligatoires, now]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* =========== WELCOME BANNER =========== */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-500 via-brand-600 to-secondary-600 p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNi02IDIuNjg2LTYgNiAyLjY4NiA2IDYgNnoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-20" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider">{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <h1 className="text-2xl font-bold mt-1">
                {getGreeting()}, {user?.prenom || 'Utilisateur'} 👋
              </h1>
              <p className="text-white/80 mt-1 text-sm">Voici un aperçu de votre espace RH pour aujourd'hui.</p>
            </div>
            <button
              onClick={fetchData}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-sm font-medium"
            >
              <HiOutlineRefresh size={16} />
              Actualiser
            </button>
          </div>
          {/* Quick summary in banner */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/15">
            {alertItems.map((a, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                {a.icon}
                <span className="text-xs font-medium">{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========== SECTION 1 : KPIs PERSOS =========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Solde congé"
          value={`${soldeInfo?.soldeDisponible?.toFixed(1) ?? '—'} j`}
          icon={<HiOutlineCalendar size={22} />}
          subtitle={`${soldeInfo?.joursEnAttente ?? 0} en attente`}
          subtitleType={soldeInfo && soldeInfo.soldeDisponible < 5 ? 'negative' : 'positive'}
          iconBg="bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
        />
        <KPICard
          title="Mes tâches"
          value={taches.length}
          icon={<HiOutlineClipboardList size={22} />}
          subtitle={`${tachesInProgress} en cours · ${tachesEnRetard > 0 ? `${tachesEnRetard} en retard` : `${tachesDone} terminées`}`}
          subtitleType={tachesEnRetard > 0 ? 'negative' : 'neutral'}
          iconBg="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
        />
        <KPICard
          title="Mes projets"
          value={projets.length}
          icon={<HiOutlineBriefcase size={22} />}
          subtitle={`${projetsEnCours} en cours`}
          subtitleType="neutral"
          iconBg="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
        />
        <KPICard
          title="Notifications"
          value={notifsNonLues}
          icon={<HiOutlineBell size={22} />}
          subtitle={`${notifications.length} au total`}
          subtitleType={notifsNonLues > 0 ? 'negative' : 'positive'}
          iconBg="bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"
        />
      </div>

      {/* =========== ROW 2 : Mini alerts =========== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MiniCard label="Demandes en attente" value={demandesEnAttente} icon={<HiOutlineClock size={16} />} color="text-yellow-600 dark:text-yellow-400" bg="bg-yellow-50 dark:bg-yellow-500/10" />
        <MiniCard label="Approuvées" value={demandesApprouvees} icon={<HiOutlineCheckCircle size={16} />} color="text-green-600 dark:text-green-400" bg="bg-green-50 dark:bg-green-500/10" />
        <MiniCard label="Refusées" value={demandesRefusees} icon={<HiOutlineXCircle size={16} />} color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-500/10" />
        <MiniCard label="Papier en attente" value={papierEnAttente} icon={<HiOutlinePaperClip size={16} />} color="text-indigo-600 dark:text-indigo-400" bg="bg-indigo-50 dark:bg-indigo-500/10" />
        <MiniCard label="Validations à traiter" value={validationsEnAttente} icon={<HiOutlineCheckCircle size={16} />} color="text-brand-600 dark:text-brand-400" bg="bg-brand-50 dark:bg-brand-500/10" />
        <MiniCard label="Documents" value={documents.length} icon={<HiOutlineFolder size={16} />} color="text-teal-600 dark:text-teal-400" bg="bg-teal-50 dark:bg-teal-500/10" />
      </div>

      {/* =========== SECTION 2 : CONGÉS & DEMANDES =========== */}
      <SectionTitle title="Congés & Demandes" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Solde congé donut */}
        <Card title="Mon solde de congé">
          {soldeInfo ? (
            <>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={soldeChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4}>
                      {soldeChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mt-2">
                <div>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{soldeInfo.soldeDisponible.toFixed(1)}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Disponible</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">{soldeInfo.joursConsommes}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Consommés</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{soldeInfo.joursEnAttente}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">En attente</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                <div>Droit annuel: <strong className="text-gray-800 dark:text-white">{soldeInfo.droitAnnuel}j</strong></div>
                <div>Acquis: <strong className="text-gray-800 dark:text-white">{soldeInfo.joursAcquis.toFixed(1)}j</strong></div>
                <div>Reportés: <strong className="text-gray-800 dark:text-white">{soldeInfo.joursReportes}j</strong></div>
                <div>Ancienneté: <strong className="text-gray-800 dark:text-white">{soldeInfo.ancienneteAnnees}a {soldeInfo.ancienneteMois}m</strong></div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-400 dark:text-gray-500 py-8">Données indisponibles</p>
          )}
        </Card>

        {/* Mes demandes par type */}
        <Card title="Mes demandes par type">
          {demandesTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={demandesTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" name="Demandes" radius={[8, 8, 0, 0]} barSize={36}>
                  {demandesTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="Aucune demande pour l'instant" />
          )}
          <div className="mt-3 text-center border-t border-gray-100 dark:border-gray-700 pt-3">
            <span className="text-xl font-bold text-gray-800 dark:text-white">{demandes.length}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">demandes au total</span>
          </div>
        </Card>

        {/* Dernières demandes */}
        <Card title="Dernières demandes">
          {dernieresDemandes.length > 0 ? (
            <div className="space-y-2.5">
              {dernieresDemandes.map(d => (
                <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <StatusDot statut={d.statut} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {d.typeCongeLabel || typeLabels[d.type] || d.type}
                    </p>
                    <p className="text-[11px] text-gray-400">{d.dateDebut && d.dateFin ? `${d.dateDebut} → ${d.dateFin}` : d.date || '—'}</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    d.statut === StatutDemande.APPROUVEE ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                    d.statut === StatutDemande.REFUSEE ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                    d.statut === StatutDemande.ANNULEE ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' :
                    'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400'
                  }`}>
                    {d.statut === StatutDemande.APPROUVEE ? 'Approuvée' :
                     d.statut === StatutDemande.REFUSEE ? 'Refusée' :
                     d.statut === StatutDemande.ANNULEE ? 'Annulée' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Aucune demande" />
          )}
        </Card>
      </div>

      {/* =========== SECTION 3 : TÂCHES & PROJETS =========== */}
      <SectionTitle title="Tâches & Projets" />
      {/* Progress bar global */}
      {taches.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Progression globale</h3>
            <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{taches.length > 0 ? Math.round((tachesDone / taches.length) * 100) : 0}%</span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-green-500 transition-all duration-700" style={{ width: `${taches.length > 0 ? (tachesDone / taches.length) * 100 : 0}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-[11px] text-gray-400">
            <span>{tachesDone} terminées sur {taches.length}</span>
            <span>{tachesTodo + tachesInProgress} restantes</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tâches statut donut */}
        <Card title="Mes tâches par statut">
          {tacheStatutData.length > 0 ? (
            <div className="flex items-center gap-6 justify-center">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={tacheStatutData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={4}>
                    {tacheStatutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {tacheStatutData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-600 dark:text-gray-300">{item.name}</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-white">{item.value}</span>
                  </div>
                ))}
                {tachesEnRetard > 0 && (
                  <div className="flex items-center gap-1.5 pt-1 border-t border-gray-200 dark:border-gray-700">
                    <HiOutlineExclamation className="text-red-500" size={14} />
                    <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">{tachesEnRetard} en retard</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <EmptyState text="Aucune tâche assignée" />
          )}
        </Card>

        {/* Tâches prochaines échéances */}
        <Card title="Prochaines échéances">
          {tachesProchaines.length > 0 ? (
            <div className="space-y-2.5">
              {tachesProchaines.map(t => {
                const echeance = new Date(t.dateEcheance!);
                const isOverdue = echeance < now;
                const daysLeft = Math.ceil((echeance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      t.statut === StatutTache.IN_PROGRESS ? 'bg-blue-500' : 'bg-yellow-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{t.titre}</p>
                      <p className="text-[11px] text-gray-400">{t.projetNom || '—'}</p>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      isOverdue ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                      daysLeft <= 3 ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {isOverdue ? `En retard (${Math.abs(daysLeft)}j)` : `${daysLeft}j`}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState text="Pas d'échéances à venir" />
          )}
        </Card>

        {/* Mes projets */}
        <Card title="Mes projets">
          {projets.length > 0 ? (
            <div className="space-y-2.5">
              {projets.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    p.statut === StatutProjet.EN_COURS ? 'bg-green-500' :
                    p.statut === StatutProjet.PLANIFIE ? 'bg-blue-500' :
                    p.statut === StatutProjet.CLOTURE ? 'bg-gray-400' : 'bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{p.nom}</p>
                    <p className="text-[11px] text-gray-400">{p.dateDebut} → {p.dateFin}</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    p.statut === StatutProjet.EN_COURS ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                    p.statut === StatutProjet.PLANIFIE ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {p.statut === StatutProjet.EN_COURS ? 'En cours' :
                     p.statut === StatutProjet.PLANIFIE ? 'Planifié' :
                     p.statut === StatutProjet.CLOTURE ? 'Clôturé' : 'Annulé'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Aucun projet" />
          )}
        </Card>
      </div>

      {/* =========== SECTION 4 : COMPÉTENCES & DOCUMENTS =========== */}
      <SectionTitle title="Compétences & Documents" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compétences */}
        <Card title="Mes compétences">
          {competences.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(compParCategorie).map(([cat, comps]) => (
                <div key={cat}>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{cat}</p>
                  <div className="space-y-2">
                    {comps.map(c => (
                      <div key={c.id} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300 w-32 truncate" title={c.nom}>{c.nom}</span>
                        <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${(c.niveau / 5) * 100}%`, backgroundColor: c.niveau >= 4 ? COLORS.green : c.niveau >= 3 ? COLORS.blue : COLORS.yellow }}
                          />
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(n => (
                            <HiOutlineStar key={n} size={12} className={n <= c.niveau ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Aucune compétence enregistrée" />
          )}
        </Card>

        {/* Documents */}
        <Card title="Mes documents">
          {documents.length > 0 ? (
            <div className="space-y-2.5">
              {documents.map(doc => {
                const isExpiring = doc.dateExpiration && new Date(doc.dateExpiration) <= dans30j && new Date(doc.dateExpiration) >= now;
                const isExpired = doc.dateExpiration && new Date(doc.dateExpiration) < now;
                return (
                  <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <HiOutlineDocumentText size={18} className={
                      isExpired ? 'text-red-500' : isExpiring ? 'text-orange-500' : 'text-gray-400'
                    } />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{doc.nom}</p>
                      <p className="text-[11px] text-gray-400">{doc.type}</p>
                    </div>
                    {doc.dateExpiration && (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        isExpired ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                        isExpiring ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {isExpired ? 'Expiré' : isExpiring ? 'Expire bientôt' : new Date(doc.dateExpiration).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                );
              })}
              {docsExpirant.length > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 rounded-lg p-2.5">
                  <HiOutlineExclamation size={14} />
                  {docsExpirant.length} document(s) expire(nt) dans les 30 prochains jours
                </div>
              )}
            </div>
          ) : (
            <EmptyState text="Aucun document" />
          )}
        </Card>
      </div>

      {/* =========== SECTION 5 : MON AGENDA & RÉSUMÉ =========== */}
      <SectionTitle title="Mon Agenda & Résumé" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agenda des 7 prochains jours */}
        <div className="lg:col-span-2">
          <Card title="Ma semaine à venir">
            {agendaSemaine.length > 0 ? (
              <div className="space-y-2">
                {agendaSemaine.map((event, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    event.type === 'retard' ? 'bg-red-50/50 border-red-100 dark:bg-red-500/5 dark:border-red-500/10' :
                    event.type === 'ferie' ? 'bg-brand-50/50 border-brand-100 dark:bg-brand-500/5 dark:border-brand-500/10' :
                    event.type === 'tache' ? 'bg-blue-50/50 border-blue-100 dark:bg-blue-500/5 dark:border-blue-500/10' :
                    event.type === 'conge' ? 'bg-green-50/50 border-green-100 dark:bg-green-500/5 dark:border-green-500/10' :
                    event.type === 'obligatoire' ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-500/5 dark:border-indigo-500/10' :
                    'bg-gray-50 border-gray-100 dark:bg-gray-800 dark:border-gray-700'
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      event.type === 'retard' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' :
                      event.type === 'ferie' ? 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' :
                      event.type === 'tache' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' :
                      event.type === 'conge' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' :
                      event.type === 'obligatoire' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {event.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{event.titre}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{event.detail}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{event.dateLabel}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        event.type === 'retard' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                        event.type === 'ferie' ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400' :
                        event.type === 'tache' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                        event.type === 'conge' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                        event.type === 'obligatoire' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>{event.badge}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="Rien de prévu cette semaine" />
            )}
          </Card>
        </div>

        {/* Colonne droite : Résumé + Fériés */}
        <div className="space-y-6">
          {/* Résumé personnel */}
          <Card title="Mon résumé">
            <div className="space-y-3">
              <SummaryRow icon={<HiOutlineCalendar size={15} />} label="Solde congé" value={`${soldeInfo?.soldeDisponible?.toFixed(1) ?? '—'} jours`} color={soldeInfo && soldeInfo.soldeDisponible < 5 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} />
              <SummaryRow icon={<HiOutlineClipboardList size={15} />} label="Tâches actives" value={`${tachesTodo + tachesInProgress}`} color="text-blue-600 dark:text-blue-400" />
              <SummaryRow icon={<HiOutlineBriefcase size={15} />} label="Projets" value={`${projetsEnCours} en cours`} color="text-purple-600 dark:text-purple-400" />
              <SummaryRow icon={<HiOutlineClock size={15} />} label="Demandes en attente" value={`${demandesEnAttente}`} color={demandesEnAttente > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'} />
              <SummaryRow icon={<HiOutlineFolder size={15} />} label="Documents" value={`${documents.length}${docsExpirant.length > 0 ? ` (${docsExpirant.length} expire)` : ''}`} color={docsExpirant.length > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-teal-600 dark:text-teal-400'} />
              <SummaryRow icon={<HiOutlineAcademicCap size={15} />} label="Compétences" value={`${competences.length}`} color="text-indigo-600 dark:text-indigo-400" />
            </div>
          </Card>

          {/* Prochains jours fériés */}
          <Card title="Prochains jours fériés">
            {prochainsFeries.length > 0 ? (
              <div className="space-y-2.5">
                {prochainsFeries.map(j => {
                  const daysUntil = Math.ceil((new Date(j.dateJour).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={j.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase leading-none">
                          {new Date(j.dateJour).toLocaleDateString('fr-FR', { month: 'short' })}
                        </span>
                        <span className="text-sm font-bold text-brand-700 dark:text-brand-300 leading-tight">
                          {new Date(j.dateJour).getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{j.nomJour}</p>
                        <p className="text-[11px] text-gray-400">{new Date(j.dateJour).toLocaleDateString('fr-FR', { weekday: 'long' })}</p>
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium">{daysUntil === 0 ? "Aujourd'hui" : `${daysUntil}j`}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState text="Pas de jours fériés à venir" />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

// ======================== Helpers ========================

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

// ======================== Sub-components ========================

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center gap-3 pt-2">
    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{title}</h2>
    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
  </div>
);

const KPICard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle: string;
  subtitleType: 'positive' | 'negative' | 'neutral';
  iconBg: string;
}> = ({ title, value, icon, subtitle, subtitleType, iconBg }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{value}</h3>
        <p className={`text-xs font-medium ${
          subtitleType === 'positive' ? 'text-green-600 dark:text-green-400' :
          subtitleType === 'negative' ? 'text-red-600 dark:text-red-400' :
          'text-gray-500 dark:text-gray-400'
        }`}>{subtitle}</p>
      </div>
      <div className={`rounded-xl p-3 ${iconBg}`}>{icon}</div>
    </div>
  </div>
);

const MiniCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}> = ({ label, value, icon, color, bg }) => (
  <div className={`rounded-xl ${bg} p-3.5 flex items-center gap-3`}>
    <div className={`${color}`}>{icon}</div>
    <div>
      <p className="text-lg font-bold text-gray-800 dark:text-white">{value}</p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
    </div>
  </div>
);

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark">
    <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">{title}</h3>
    {children}
  </div>
);

const StatusDot: React.FC<{ statut: StatutDemande }> = ({ statut }) => (
  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
    statut === StatutDemande.APPROUVEE ? 'bg-green-500' :
    statut === StatutDemande.REFUSEE ? 'bg-red-500' :
    statut === StatutDemande.ANNULEE ? 'bg-gray-400' :
    'bg-yellow-500'
  }`} />
);

const SummaryRow: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
    <span className="text-gray-400">{icon}</span>
    <span className="text-sm text-gray-600 dark:text-gray-300 flex-1">{label}</span>
    <span className={`text-sm font-bold ${color}`}>{value}</span>
  </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center justify-center py-8">
    <p className="text-sm text-gray-400 dark:text-gray-500">{text}</p>
  </div>
);

export default DashboardPage;
