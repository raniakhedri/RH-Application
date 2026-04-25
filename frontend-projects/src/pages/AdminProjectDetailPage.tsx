import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineUsers,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineExclamationCircle,
  HiOutlineLightningBolt,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineMail,
  HiOutlineRefresh,
} from 'react-icons/hi';
import { adminDashboardProjectService, ProjetDetailAdminDTO, AlerteDTO, TacheManagerDTO, EmployeSectionDTO, TacheTimelineDTO } from '../api/adminDashboardProjectService';
import { tacheService } from '../api/tacheService';
import { equipeService } from '../api/equipeService';

/* ── Helpers ──────────────────────────────────────────────────────────── */

const statutLabels: Record<string, string> = {
  PLANIFIE: 'Planifié', EN_COURS: 'En cours', CLOTURE: 'Clôturé ✅',
  CLOTURE_INCOMPLET: 'Clôturé incomplet ⚠️', ANNULE: 'Annulé',
};
const statutColors: Record<string, string> = {
  PLANIFIE: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  EN_COURS: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  CLOTURE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  CLOTURE_INCOMPLET: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  ANNULE: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};
const tacheStatutColors: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  IN_PROGRESS: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
};
const tacheStatutLabels: Record<string, string> = { TODO: 'À faire', IN_PROGRESS: 'En cours', DONE: 'Terminée' };

/** CORRECTION 1: Format duration properly — distinguish historical data vs real durations */
const formatDuration = (hours: number | null | undefined, isDone: boolean): { text: string; valid: boolean } => {
  // null = timestamps never captured (historical data from before the fix)
  if (hours === null || hours === undefined) {
    return isDone ? { text: '📋 Donnée historique', valid: false } : { text: '—', valid: true };
  }
  // 0 = completed instantly (< 1 minute)
  if (hours === 0 && isDone) return { text: '< 1min', valid: true };
  // Sub-hour
  if (hours < 1) {
    const mins = Math.max(1, Math.round(hours * 60));
    return { text: `${mins}min`, valid: true };
  }
  // Hours
  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round((hours % 1) * 60);
    return { text: `${h}h${m > 0 ? ` ${m}min` : ''}`, valid: true };
  }
  // Days
  const days = Math.floor(hours / 24);
  const rem = Math.round(hours % 24);
  return { text: `${days}j ${rem > 0 ? rem + 'h' : ''}`, valid: true };
};

const formatDateTime = (dt: string | null) => {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

type TabId = 'managers' | 'employes' | 'indicateurs' | 'timeline' | 'alertes';

/* ── Component ────────────────────────────────────────────────────────── */

const AdminProjectDetailPage: React.FC = () => {
  const { projetId } = useParams<{ projetId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ProjetDetailAdminDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('managers');
  const [expandedManager, setExpandedManager] = useState<number | null>(0);

  useEffect(() => {
    if (!projetId) return;
    loadDetail(Number(projetId));
  }, [projetId]);

  const loadDetail = async (id: number) => {
    try {
      const res = await adminDashboardProjectService.getProjetDetail(id);
      setDetail(res.data.data);
      if (res.data.data.managers.length > 0) setExpandedManager(0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500 dark:border-gray-700 dark:border-t-brand-400" />
    </div>
  );
  if (!detail) return <div className="py-16 text-center text-gray-400">Projet non trouvé</div>;

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'managers', label: 'Par Manager', icon: <HiOutlineUsers size={16} />, count: detail.managers.length },
    { id: 'employes', label: 'Par Employé', icon: <HiOutlineUser size={16} />, count: detail.employes.length },
    { id: 'indicateurs', label: 'Indicateurs', icon: <HiOutlineClock size={16} /> },
    { id: 'timeline', label: 'Timeline', icon: <HiOutlineCalendar size={16} /> },
    { id: 'alertes', label: 'Alertes', icon: <HiOutlineLightningBolt size={16} />, count: detail.alertes.length },
  ];

  const doneW = detail.totalTaches > 0 ? (detail.tachesDone / detail.totalTaches) * 100 : 0;
  const ipW = detail.totalTaches > 0 ? (detail.tachesInProgress / detail.totalTaches) * 100 : 0;

  // CORRECTION 2: Count invalid tasks (DONE without assignee)
  const allTasks = detail.managers.flatMap(m => m.taches);
  const invalidTasks = allTasks.filter(t => t.statut === 'DONE' && !t.employeNom);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <button onClick={() => navigate('/admin/dashboard-projets')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-brand-500 mb-4 transition-colors">
          <HiOutlineArrowLeft size={16} /> Retour
        </button>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{detail.projetNom}</h1>
              {/* CORRECTION 5: Different badges for CLOTURE vs CLOTURE_INCOMPLET */}
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${statutColors[detail.statut] || ''}`}>
                {statutLabels[detail.statut] || detail.statut}
              </span>
              {detail.tachesEnRetard > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-500/15 dark:text-red-400">
                  ⚠ {detail.tachesEnRetard} retard{detail.tachesEnRetard > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
              {detail.clientNom && <span>🏢 {detail.clientNom}</span>}
              {detail.dateDebut && <span>📅 {detail.dateDebut}</span>}
              {detail.dateFin && <span>→ {detail.dateFin}</span>}
            </div>
          </div>

          {/* CORRECTION 5: Warning banner for incomplete closure */}
          {detail.statut === 'CLOTURE_INCOMPLET' && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-500/20 dark:bg-orange-500/5">
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                ⚠️ Ce projet a été clôturé avec {detail.tachesEnRetard || '?'} tâche(s) non terminée(s)
              </p>
              <p className="text-xs text-orange-600/70 dark:text-orange-400/60 mt-0.5">
                {detail.progressionPourcentage}% réalisé
              </p>
            </div>
          )}
        </div>

        {/* Progress summary */}
        <div className="mt-4 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-white">{detail.progressionPourcentage}%</span>
            <span className="text-xs text-gray-400">progression</span>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex gap-4 text-sm">
            <span className="font-bold text-emerald-600">{detail.tachesDone} <span className="text-xs font-normal text-gray-400">done</span></span>
            <span className="font-bold text-brand-600">{detail.tachesInProgress} <span className="text-xs font-normal text-gray-400">en cours</span></span>
            <span className="font-bold text-gray-500">{detail.tachesTodo} <span className="text-xs font-normal text-gray-400">à faire</span></span>
          </div>
        </div>
        <div className="mt-3 h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
          <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${doneW}%` }} />
          <div className="h-full bg-brand-400 transition-all duration-700" style={{ width: `${ipW}%` }} />
        </div>
      </div>

      {/* CORRECTION 2: Invalid data banner */}
      {invalidTasks.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 dark:border-red-500/20 dark:bg-red-500/5">
          <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">
            ⚠️ Données invalides — {invalidTasks.length} tâche(s) terminée(s) sans employé assigné
          </p>
          <ul className="text-xs text-red-600/80 dark:text-red-400/70 space-y-0.5">
            {invalidTasks.map(t => (
              <li key={t.tacheId}>• {t.tacheNom} — <span className="font-medium">statut DONE sans assigné</span></li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}>
            {tab.icon} {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`h-5 min-w-[20px] rounded-full px-1.5 text-[10px] font-bold flex items-center justify-center ${activeTab === tab.id ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'managers' && <ManagersTab managers={detail.managers} expandedManager={expandedManager} setExpandedManager={setExpandedManager} />}
      {activeTab === 'employes' && <EmployesTab employes={detail.employes} />}
      {activeTab === 'indicateurs' && <IndicateursTab managers={detail.managers} />}
      {activeTab === 'timeline' && <TimelineTab timeline={detail.timeline} dateDebut={detail.dateDebut} dateFin={detail.dateFin} />}
      {activeTab === 'alertes' && <AlertesTab alertes={detail.alertes} projetId={detail.projetId} onReload={() => loadDetail(detail.projetId)} />}
    </div>
  );
};

/* ── TacheRow — shared with CORRECTION 1 & 2 ─────────────────────────── */

const TacheRow: React.FC<{ tache: TacheManagerDTO }> = ({ tache }) => {
  const isDone = tache.statut === 'DONE';
  const dur = formatDuration(tache.dureeReelleHeures, isDone);
  const isInvalid = isDone && !tache.employeNom;

  return (
    <div className={`flex items-center gap-4 px-5 py-3 ${tache.enRetard ? 'bg-red-50/30 dark:bg-red-500/5' : ''} ${isInvalid ? 'bg-red-50/50 dark:bg-red-500/8' : ''}`}>
      <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${tache.statut === 'DONE' ? 'bg-emerald-500' : tache.statut === 'IN_PROGRESS' ? 'bg-brand-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{tache.tacheNom}</p>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${tacheStatutColors[tache.statut] || ''}`}>
            {tacheStatutLabels[tache.statut] || tache.statut}
          </span>
          {/* CORRECTION 2: Invalid badge */}
          {isInvalid && (
            <span className="inline-flex rounded-full bg-red-200 px-2 py-0.5 text-[9px] font-bold text-red-800 dark:bg-red-500/30 dark:text-red-300">
              ⚠️ Sans assigné
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-400 flex-wrap">
          {tache.employeNom ? <span>👤 {tache.employeNom}</span> : <span className="text-amber-500">⚠ Non assigné</span>}
          {tache.dateEcheance && <span>📅 {tache.dateEcheance}</span>}
          {/* CORRECTION 1: Proper duration display */}
          {isDone && (
            <span className={dur.valid ? 'text-gray-500' : 'text-orange-500 font-semibold'}>
              ⏱ {dur.text}
            </span>
          )}
          {tache.statut === 'IN_PROGRESS' && tache.dateDebutExecution && (
            <span className="text-brand-500">▶ Démarré {formatDateTime(tache.dateDebutExecution)}</span>
          )}
        </div>
      </div>
      {/* Retard status */}
      {tache.statutRetard && tache.statutRetard !== 'DANS_LES_TEMPS' && (
        <span className={`text-xs font-semibold whitespace-nowrap ${tache.statutRetard === 'CRITIQUE' ? 'text-red-600' : 'text-amber-600'}`}>
          {tache.statutRetard === 'CRITIQUE' ? '🔴 Critique' : '⚠ En retard'}
        </span>
      )}
      {tache.statutRetard === 'DANS_LES_TEMPS' && isDone && (
        <span className="text-xs text-emerald-500">✅</span>
      )}
    </div>
  );
};

/* ── Managers Tab ──────────────────────────────────────────────────────── */

const ManagersTab: React.FC<{
  managers: ProjetDetailAdminDTO['managers'];
  expandedManager: number | null;
  setExpandedManager: (idx: number | null) => void;
}> = ({ managers, expandedManager, setExpandedManager }) => {
  if (managers.length === 0) return <div className="py-12 text-center text-gray-400">Aucun manager assigné</div>;

  return (
    <div className="space-y-3">
      {managers.map((mgr, idx) => {
        const done = mgr.taches.filter(t => t.statut === 'DONE').length;
        const late = mgr.taches.filter(t => t.enRetard).length;
        return (
          <div key={idx} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-dark overflow-hidden">
            <button onClick={() => setExpandedManager(expandedManager === idx ? null : idx)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-sm font-bold text-white shadow">
                  {mgr.managerNom.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800 dark:text-white">{mgr.managerNom}</p>
                  <p className="text-[11px] text-gray-400">{mgr.taches.length} tâche{mgr.taches.length > 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-500 text-xs font-semibold">{done}✓</span>
                {late > 0 && <span className="text-red-500 text-xs font-bold">⚠{late}</span>}
                {expandedManager === idx ? <HiOutlineChevronDown size={16} className="text-gray-400" /> : <HiOutlineChevronRight size={16} className="text-gray-400" />}
              </div>
            </button>
            {expandedManager === idx && (
              <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                {mgr.taches.map(t => <TacheRow key={t.tacheId} tache={t} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ── Employes Tab ─────────────────────────────────────────────────────── */

const EmployesTab: React.FC<{ employes: EmployeSectionDTO[] }> = ({ employes }) => {
  if (employes.length === 0) return <div className="py-12 text-center text-gray-400">Aucun employé assigné</div>;

  const fmtMin = (min: number | null): string => {
    if (min === null || min === undefined) return '—';
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h < 24) return `${h}h${m > 0 ? `${m}min` : ''}`;
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return `${d}j ${rh > 0 ? `${rh}h` : ''}`.trim();
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-gray-500 px-1">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> TODO (en attente)</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> En cours</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Terminé</span>
      </div>

      {employes.map(emp => {
        const pct = emp.tachesAssignees > 0 ? Math.round((emp.tachesDone / emp.tachesAssignees) * 100) : 0;
        const todoMin = emp.tempsEnTodoMinutes ?? 0;
        const ipMin = emp.tempsEnInProgressMinutes ?? 0;
        const doneMin = emp.tempsDepuisDoneMinutes ?? 0;
        const totalMin = emp.tempsTotalMinutes ?? 0;
        const barTotal = Math.max(todoMin + ipMin + doneMin, 1);
        const todoPct = Math.round((todoMin / barTotal) * 100);
        const ipPct = Math.round((ipMin / barTotal) * 100);
        const isAnomaly = totalMin > 0 && todoMin > ipMin * 2;

        return (
          <div key={emp.employeId} className={`rounded-2xl border overflow-hidden transition-all ${isAnomaly ? 'border-amber-300 dark:border-amber-500/30' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-dark`}>
            {/* Header */}
            <div className="flex items-center gap-4 px-5 py-4">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg ${isAnomaly ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20' : 'bg-gradient-to-br from-brand-400 to-violet-500 shadow-brand-500/20'}`}>
                {emp.employeNom.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-800 dark:text-white">{emp.employeNom}</p>
                  {isAnomaly && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                      <HiOutlineExclamation size={10} /> Anomalie
                    </span>
                  )}
                  {emp.tachesEnRetard > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700 dark:bg-red-500/15 dark:text-red-400">⚠ {emp.tachesEnRetard} retard</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                  <span>{emp.tachesAssignees} tâche{emp.tachesAssignees > 1 ? 's' : ''}</span>
                  <span className="text-emerald-500 font-semibold">{emp.tachesDone} done</span>
                  {emp.tachesEnCours > 0 && <span className="text-brand-500">{emp.tachesEnCours} en cours</span>}
                  {emp.tachesTodo > 0 && <span>{emp.tachesTodo} à faire</span>}
                </div>
              </div>
              {/* Progress ring */}
              <div className="shrink-0 relative h-12 w-12">
                <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="19" fill="none" strokeWidth="4" className="stroke-gray-100 dark:stroke-gray-800" />
                  <circle cx="24" cy="24" r="19" fill="none" strokeWidth="4" strokeLinecap="round"
                    className={pct >= 80 ? 'stroke-emerald-500' : pct >= 40 ? 'stroke-brand-500' : 'stroke-amber-500'}
                    strokeDasharray={`${pct * 1.19} 119`}
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-gray-700 dark:text-gray-300">{pct}%</span>
              </div>
            </div>

            {/* Time Bar */}
            {totalMin > 0 && (
              <div className="px-5 pb-4">
                <div className="flex h-4 w-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {todoPct > 0 && <div className="bg-amber-400 dark:bg-amber-500 transition-all" style={{ width: `${todoPct}%` }} title={`TODO: ${fmtMin(todoMin)}`} />}
                  {ipPct > 0 && <div className="bg-brand-500 dark:bg-brand-400 transition-all" style={{ width: `${ipPct}%` }} title={`En cours: ${fmtMin(ipMin)}`} />}
                  {100 - todoPct - ipPct > 0 && <div className="bg-emerald-400 dark:bg-emerald-500 transition-all" style={{ width: `${Math.max(100 - todoPct - ipPct, 0)}%` }} title={`Done: ${fmtMin(doneMin)}`} />}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-center">
                    <p className="text-[9px] text-amber-600 dark:text-amber-400 font-medium uppercase">TODO</p>
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-300">{fmtMin(todoMin)}</p>
                  </div>
                  <div className="rounded-lg bg-brand-50 dark:bg-brand-500/10 px-3 py-2 text-center">
                    <p className="text-[9px] text-brand-600 dark:text-brand-400 font-medium uppercase">En cours</p>
                    <p className="text-sm font-bold text-brand-700 dark:text-brand-300">{fmtMin(ipMin)}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-center">
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium uppercase">Depuis Done</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{fmtMin(doneMin)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-center">
                    <p className="text-[9px] text-gray-500 font-medium uppercase">Total</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{fmtMin(totalMin)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-center">
                    <p className="text-[9px] text-gray-500 font-medium uppercase">Temps moyen</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {emp.tempsMoyenHeures != null ? formatDuration(emp.tempsMoyenHeures, emp.tachesDone > 0).text : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ── Indicateurs Tab (CORRECTION 1 — proper durations) ────────────────── */

const IndicateursTab: React.FC<{ managers: ProjetDetailAdminDTO['managers'] }> = ({ managers }) => {
  const allTaches = managers.flatMap(m => m.taches);
  if (allTaches.length === 0) return <div className="py-12 text-center text-gray-400">Aucune tâche</div>;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-dark overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
            <th className="px-4 py-3 text-[10px] font-semibold uppercase text-gray-500">Tâche</th>
            <th className="px-3 py-3 text-[10px] font-semibold uppercase text-gray-500">Employé</th>
            <th className="px-3 py-3 text-[10px] font-semibold uppercase text-gray-500">Assignée</th>
            <th className="px-3 py-3 text-[10px] font-semibold uppercase text-gray-500">Démarrée</th>
            <th className="px-3 py-3 text-[10px] font-semibold uppercase text-gray-500">Terminée</th>
            <th className="px-3 py-3 text-[10px] font-semibold uppercase text-gray-500">Durée réelle</th>
            <th className="px-3 py-3 text-[10px] font-semibold uppercase text-gray-500">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {allTaches.map(t => {
            const isDone = t.statut === 'DONE';
            const dur = formatDuration(t.dureeReelleHeures, isDone);
            const isInvalid = isDone && !t.employeNom;
            return (
              <tr key={t.tacheId} className={`hover:bg-gray-50 dark:hover:bg-gray-800/20 ${t.enRetard ? 'bg-red-50/30 dark:bg-red-500/5' : ''} ${isInvalid ? 'bg-red-50/50 dark:bg-red-500/8' : ''}`}>
                <td className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[200px] truncate">{t.tacheNom}</td>
                <td className="px-3 py-2.5 text-xs">
                  {t.employeNom || <span className="text-red-500 font-semibold">⚠ Non assigné</span>}
                  {isInvalid && <span className="block text-[9px] text-red-500 font-bold">Donnée invalide</span>}
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-400">{formatDateTime(t.dateAssignation)}</td>
                <td className="px-3 py-2.5 text-xs text-gray-400">{formatDateTime(t.dateDebutExecution)}</td>
                <td className="px-3 py-2.5 text-xs text-gray-400">{formatDateTime(t.dateFinExecution)}</td>
                <td className="px-3 py-2.5">
                  <span className={`text-xs font-medium ${dur.valid ? 'text-gray-600 dark:text-gray-400' : 'text-orange-500 font-semibold'}`}>
                    {dur.text}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${tacheStatutColors[t.statut] || ''}`}>
                    {tacheStatutLabels[t.statut]}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/* ── Timeline Tab (CORRECTION 6 — Fixed proportions) ──────────────────── */

const TimelineTab: React.FC<{
  timeline: TacheTimelineDTO[];
  dateDebut: string | null;
  dateFin: string | null;
}> = ({ timeline, dateDebut, dateFin }) => {
  if (timeline.length === 0) return <div className="py-12 text-center text-gray-400">Aucune tâche</div>;

  // CORRECTION 6: Calculate consistent date range
  const allDates: number[] = [];
  timeline.forEach(t => {
    if (t.dateAssignation) allDates.push(new Date(t.dateAssignation).getTime());
    if (t.dateEcheance) allDates.push(new Date(t.dateEcheance).getTime());
    if (t.dateFinExecution) allDates.push(new Date(t.dateFinExecution).getTime());
  });
  if (dateDebut) allDates.push(new Date(dateDebut).getTime());
  if (dateFin) allDates.push(new Date(dateFin).getTime());
  allDates.push(Date.now());

  const rangeStart = Math.min(...allDates) - 86400000;
  const rangeEnd = Math.max(...allDates) + 86400000;
  const totalRange = rangeEnd - rangeStart;
  const todayPct = ((Date.now() - rangeStart) / totalRange) * 100;

  // Generate week labels
  const weeks: { label: string; pct: number }[] = [];
  const step = Math.max(7, Math.ceil(totalRange / 86400000 / 8)) * 86400000;
  for (let d = rangeStart; d <= rangeEnd; d += step) {
    weeks.push({
      label: new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      pct: ((d - rangeStart) / totalRange) * 100,
    });
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-dark overflow-hidden px-5 py-4">
      <div className="overflow-x-auto" style={{ minWidth: '600px' }}>
        {/* Week labels */}
        <div className="relative h-6 mb-1">
          {weeks.map((w, i) => (
            <div key={i} className="absolute text-[9px] text-gray-400" style={{ left: `${w.pct}%`, transform: 'translateX(-50%)' }}>
              {w.label}
            </div>
          ))}
        </div>

        {/* Grid + today line */}
        <div className="relative">
          <div className="absolute top-0 bottom-0 w-px bg-red-400 z-10" style={{ left: `${todayPct}%` }}>
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
              Aujourd'hui
            </span>
          </div>

          <div className="space-y-1.5">
            {timeline.map(t => {
              // CORRECTION 6: Bar = assignation date → deadline, proportional
              const barStart = t.dateAssignation
                ? new Date(t.dateAssignation).getTime()
                : rangeStart + (totalRange * 0.05);
              const barEnd = t.dateEcheance
                ? new Date(t.dateEcheance).getTime() + 86400000
                : barStart + (t.dureePrevueJours || 5) * 86400000;

              const leftPct = Math.max(0, ((barStart - rangeStart) / totalRange) * 100);
              const widthPct = Math.max(2, ((barEnd - barStart) / totalRange) * 100);

              // Color: done=green (or amber if late), in_progress=blue (or red if past deadline), todo=gray
              const isOverdue = t.dateEcheance && Date.now() > new Date(t.dateEcheance).getTime() + 86400000;
              let barColor = 'bg-gray-300 dark:bg-gray-600';
              if (t.statut === 'DONE') barColor = t.enRetard ? 'bg-amber-400' : 'bg-emerald-500';
              else if (t.statut === 'IN_PROGRESS') barColor = isOverdue ? 'bg-red-500 animate-pulse' : 'bg-brand-500';
              else if (isOverdue) barColor = 'bg-red-400';

              return (
                <div key={t.tacheId} className="flex items-center gap-3 py-0.5">
                  <div className="w-32 shrink-0 text-right pr-2">
                    <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">{t.tacheNom}</p>
                    <p className="text-[9px] text-gray-400 truncate">{t.employeNom || 'Non assigné'}</p>
                  </div>
                  <div className="flex-1 relative h-7 bg-gray-50 dark:bg-gray-800/30 rounded">
                    <div
                      className={`absolute top-1 bottom-1 rounded ${barColor} flex items-center justify-end pr-1.5 transition-all`}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: '16px' }}
                    >
                      <span className="text-[8px] font-bold text-white/90">{t.progressPourcent}%</span>
                    </div>
                  </div>
                  <div className="w-20 shrink-0 text-[9px]">
                    <span className={`font-bold ${tacheStatutColors[t.statut]} rounded-full px-1.5 py-0.5`}>
                      {tacheStatutLabels[t.statut]}
                    </span>
                    {t.enRetard && <span className="block text-red-500 font-bold mt-0.5">⚠ Retard</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Alertes Tab (with working action buttons) ────────────────────────── */

const AlertesTab: React.FC<{ alertes: AlerteDTO[]; projetId: number; onReload: () => void }> = ({ alertes, projetId, onReload }) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [reassignModal, setReassignModal] = useState<{ tacheId: number; tacheNom: string } | null>(null);
  const [deadlineModal, setDeadlineModal] = useState<{ tacheId: number; tacheNom: string; currentDeadline: string | null } | null>(null);
  const [membres, setMembres] = useState<{ id: number; prenom: string; nom: string }[]>([]);
  const [membresLoading, setMembresLoading] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');

  // Load project members when reassign modal opens
  useEffect(() => {
    if (!reassignModal) return;
    setMembresLoading(true);
    setMembres([]);
    equipeService.getMembresByProjet(projetId)
      .then(res => {
        const data = res.data.data || [];
        setMembres(data.map((e: any) => ({ id: e.id, prenom: e.prenom, nom: e.nom })));
      })
      .catch((err) => {
        console.error('Erreur chargement membres:', err);
        setMembres([]);
      })
      .finally(() => setMembresLoading(false));
  }, [reassignModal, projetId]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRelance = async (tacheId: number, tacheNom: string) => {
    const key = `relance-${tacheId}`;
    setLoadingAction(key);
    try {
      await tacheService.relance(tacheId);
      showToast(`Relance envoyée pour "${tacheNom}"`, 'success');
    } catch {
      showToast(`Erreur lors de l'envoi de la relance`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReassign = async (tacheId: number, employeId: number) => {
    setLoadingAction(`reassign-${tacheId}`);
    try {
      await tacheService.assign(tacheId, employeId);
      showToast('Tâche réassignée avec succès', 'success');
      setReassignModal(null);
      onReload();
    } catch {
      showToast('Erreur lors de la réassignation', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeadlineUpdate = async () => {
    if (!deadlineModal || !newDeadline) return;
    setLoadingAction(`deadline-${deadlineModal.tacheId}`);
    try {
      await tacheService.updateDeadline(deadlineModal.tacheId, newDeadline);
      showToast('Deadline mise à jour', 'success');
      setDeadlineModal(null);
      setNewDeadline('');
      onReload();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Erreur lors de la modification';
      showToast(msg, 'error');
    } finally {
      setLoadingAction(null);
    }
  }

  if (alertes.length === 0) return (
    <div className="py-16 text-center">
      <HiOutlineCheckCircle size={48} className="mx-auto text-emerald-400 opacity-40 mb-3" />
      <p className="text-gray-400">Aucune alerte — tout est dans les temps 🎉</p>
    </div>
  );

  const grouped = alertes.reduce<Record<string, AlerteDTO[]>>((acc, a) => {
    const key = a.managerNom || 'Non assigné';
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-2 rounded-xl px-5 py-3 shadow-xl text-sm font-medium transition-all animate-in slide-in-from-right ${
          toast.type === 'success'
            ? 'bg-emerald-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <HiOutlineCheckCircle size={18} /> : <HiOutlineExclamationCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([mgrNom, mgrAlertes]) => (
          <div key={mgrNom}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
              👔 {mgrNom} <span className="text-gray-400">({mgrAlertes.length})</span>
            </h3>
            <div className="space-y-3">
              {mgrAlertes.map((a, i) => (
                <div key={i} className={`rounded-2xl border p-5 ${a.niveau === 'CRITIQUE' ? 'border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5' : 'border-amber-200 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5'}`}>
                  <div className="flex items-start gap-3">
                    {a.niveau === 'CRITIQUE'
                      ? <HiOutlineExclamationCircle size={22} className="text-red-500 shrink-0 mt-0.5" />
                      : <HiOutlineExclamation size={22} className="text-amber-500 shrink-0 mt-0.5" />
                    }
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${a.niveau === 'CRITIQUE' ? 'bg-red-200 text-red-800 dark:bg-red-500/30 dark:text-red-300' : 'bg-amber-200 text-amber-800 dark:bg-amber-500/30 dark:text-amber-300'}`}>
                          {a.niveau === 'CRITIQUE' ? '🔴' : '⚠'} {a.niveau}
                          {a.retardJours > 0 && ` — +${a.retardJours}j`}
                        </span>
                      </div>

                      {/* Detail card */}
                      <div className="rounded-xl border border-gray-200/50 bg-white/60 dark:border-gray-700/30 dark:bg-gray-900/20 p-4 space-y-1.5 text-sm">
                        {a.tacheNom && (
                          <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">Tâche</span><span className="font-medium text-gray-700 dark:text-gray-300">{a.tacheNom}</span></div>
                        )}
                        {a.employeNom && (
                          <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">Employé</span><span className="font-medium text-gray-700 dark:text-gray-300">{a.employeNom}</span></div>
                        )}
                        {a.managerNom && (
                          <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">Manager</span><span className="font-medium text-gray-700 dark:text-gray-300">{a.managerNom}</span></div>
                        )}
                        <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">Problème</span><span className="text-gray-700 dark:text-gray-300">{a.probleme}</span></div>
                        {a.retardJours > 0 && (
                          <div className="flex gap-2"><span className="text-gray-400 w-20 shrink-0">Retard</span><span className="font-bold text-red-600">+{a.retardJours} jour(s)</span></div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="mt-3 rounded-lg bg-white/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700/30 px-4 py-3">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Actions suggérées :</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            disabled={!a.tacheId || loadingAction === `relance-${a.tacheId}`}
                            onClick={() => a.tacheId && handleRelance(a.tacheId, a.tacheNom || '')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-[11px] font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 transition-colors disabled:opacity-50"
                          >
                            {loadingAction === `relance-${a.tacheId}`
                              ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
                              : <HiOutlineMail size={14} />
                            }
                            Relancer l'employé
                          </button>
                          <button
                            disabled={!a.tacheId}
                            onClick={() => a.tacheId && setReassignModal({ tacheId: a.tacheId, tacheNom: a.tacheNom || '' })}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 transition-colors disabled:opacity-50"
                          >
                            <HiOutlineRefresh size={14} /> Réassigner
                          </button>
                          <button
                            disabled={!a.tacheId}
                            onClick={() => a.tacheId && setDeadlineModal({ tacheId: a.tacheId, tacheNom: a.tacheNom || '', currentDeadline: null })}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 transition-colors disabled:opacity-50"
                          >
                            <HiOutlineCalendar size={14} /> Modifier deadline
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Reassign Modal ── */}
      {reassignModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setReassignModal(null)}>
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Réassigner la tâche</h3>
            <p className="text-sm text-gray-400 mb-4">"{reassignModal.tacheNom}"</p>

            {membresLoading ? (
              <div className="py-6 text-center">
                <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-gray-200 border-t-brand-500 mb-2" />
                <p className="text-sm text-gray-400">Chargement des membres...</p>
              </div>
            ) : membres.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">Aucun membre trouvé dans ce projet</div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-1.5">
                {membres.map(m => (
                  <button
                    key={m.id}
                    disabled={loadingAction === `reassign-${reassignModal.tacheId}`}
                    onClick={() => handleReassign(reassignModal.tacheId, m.id)}
                    className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors disabled:opacity-50"
                  >
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-xs font-bold text-white shadow">
                      {m.prenom[0]}{m.nom[0]}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{m.prenom} {m.nom}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button onClick={() => setReassignModal(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deadline Modal ── */}
      {deadlineModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setDeadlineModal(null); setNewDeadline(''); }}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Modifier la deadline</h3>
            <p className="text-sm text-gray-400 mb-4">"{deadlineModal.tacheNom}"</p>

            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">Nouvelle deadline</label>
            <input
              type="date"
              value={newDeadline}
              onChange={e => setNewDeadline(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />

            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => { setDeadlineModal(null); setNewDeadline(''); }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Annuler
              </button>
              <button
                disabled={!newDeadline || loadingAction === `deadline-${deadlineModal.tacheId}`}
                onClick={handleDeadlineUpdate}
                className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {loadingAction === `deadline-${deadlineModal.tacheId}` ? 'Mise à jour...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminProjectDetailPage;

