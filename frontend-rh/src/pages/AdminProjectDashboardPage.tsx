import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineBriefcase,
  HiOutlineClipboardCheck,
  HiOutlineExclamation,
  HiOutlineTrendingUp,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineSearch,
  HiOutlineLightningBolt,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineX,
} from 'react-icons/hi';
import { adminDashboardProjectService, AdminDashboardDTO, ProjetSummaryDTO, AlerteDTO } from '../api/adminDashboardProjectService';
import { tacheService } from '../api/tacheService';

/* ── Helpers ──────────────────────────────────────────────────────────── */

const statutColors: Record<string, string> = {
  PLANIFIE: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  EN_COURS: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  CLOTURE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  CLOTURE_INCOMPLET: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  ANNULE: 'bg-red-500/10 text-red-500 dark:text-red-400',
};
const statutLabels: Record<string, string> = {
  PLANIFIE: 'Planifié', EN_COURS: 'En cours', CLOTURE: 'Clôturé ✅',
  CLOTURE_INCOMPLET: 'Clôturé incomplet ⚠️', ANNULE: 'Annulé',
};
const tacheStatutLabels: Record<string, string> = { TODO: 'À faire', IN_PROGRESS: 'En cours', DONE: 'Terminée' };

interface ClientGroup {
  clientNom: string;
  projets: ProjetSummaryDTO[];
  totalTaches: number;
  tachesDone: number;
  tachesEnRetard: number;
  progression: number;
}

/* ── Main Component ───────────────────────────────────────────────────── */

const AdminProjectDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<AdminDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [expandedProjet, setExpandedProjet] = useState<number | null>(null);
  const [projetTaches, setProjetTaches] = useState<Record<number, any[]>>({});
  const [loadingTaches, setLoadingTaches] = useState<number | null>(null);
  const [showAlertes, setShowAlertes] = useState(false);

  useEffect(() => {
    loadDashboard();
    const iv = setInterval(loadDashboard, 120000);
    return () => clearInterval(iv);
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await adminDashboardProjectService.getDashboard();
      setDashboard(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  /* Group projects by client */
  const clientGroups: ClientGroup[] = useMemo(() => {
    if (!dashboard) return [];
    const map = new Map<string, ProjetSummaryDTO[]>();
    for (const p of dashboard.projets) {
      const key = p.clientNom || 'Sans client';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).map(([clientNom, projets]) => {
      const totalTaches = projets.reduce((s, p) => s + p.totalTaches, 0);
      const tachesDone = projets.reduce((s, p) => s + p.tachesDone, 0);
      const tachesEnRetard = projets.reduce((s, p) => s + p.tachesEnRetard, 0);
      const progression = totalTaches > 0 ? Math.round((tachesDone / totalTaches) * 100) : 0;
      return { clientNom, projets, totalTaches, tachesDone, tachesEnRetard, progression };
    }).sort((a, b) => b.tachesEnRetard - a.tachesEnRetard || b.projets.length - a.projets.length);
  }, [dashboard]);

  const filtered = useMemo(() => {
    if (!search) return clientGroups;
    const q = search.toLowerCase();
    return clientGroups.filter(g =>
      g.clientNom.toLowerCase().includes(q) ||
      g.projets.some(p => p.projetNom.toLowerCase().includes(q))
    );
  }, [clientGroups, search]);

  /* Load tasks for a project */
  const loadProjetTaches = async (projetId: number) => {
    if (projetTaches[projetId]) return;
    setLoadingTaches(projetId);
    try {
      const res = await tacheService.getByProjet(projetId);
      setProjetTaches(prev => ({ ...prev, [projetId]: (res.data as any)?.data || res.data || [] }));
    } catch (e) { console.error(e); }
    finally { setLoadingTaches(null); }
  };

  const toggleProjet = (projetId: number) => {
    if (expandedProjet === projetId) { setExpandedProjet(null); return; }
    setExpandedProjet(projetId);
    loadProjetTaches(projetId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin" />
          </div>
          <p className="text-sm text-gray-400">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const critiques = dashboard.alertes.filter(a => a.niveau === 'CRITIQUE').length;
  const warnings = dashboard.alertes.filter(a => a.niveau === 'WARNING').length;

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Suivi des Projets
          </h1>
          <p className="text-sm text-gray-400 mt-1">Vue consolidée par client</p>
        </div>
        {dashboard.alertes.length > 0 && (
          <button
            onClick={() => setShowAlertes(true)}
            className="relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all hover:-translate-y-0.5"
          >
            <HiOutlineLightningBolt size={16} />
            {critiques + warnings} Alerte{critiques + warnings > 1 ? 's' : ''}
            {critiques > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] rounded-full bg-white text-red-600 text-[10px] font-black flex items-center justify-center px-1 shadow animate-pulse">
                {critiques}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ── KPI Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Clients"
          value={clientGroups.length}
          icon="🏢"
          gradient="from-brand-500/10 to-violet-500/10 dark:from-brand-500/5 dark:to-violet-500/5"
          border="border-brand-200/50 dark:border-brand-500/20"
        />
        <KpiCard
          label="Projets actifs"
          value={dashboard.projetsActifs}
          icon="📁"
          sub={`${dashboard.totalProjets} total`}
          gradient="from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5"
          border="border-emerald-200/50 dark:border-emerald-500/20"
        />
        <KpiCard
          label="Progression"
          value={`${dashboard.progressionMoyenne}%`}
          icon="📊"
          progress={dashboard.progressionMoyenne}
          gradient="from-violet-500/10 to-purple-500/10 dark:from-violet-500/5 dark:to-purple-500/5"
          border="border-violet-200/50 dark:border-violet-500/20"
        />
        <KpiCard
          label="En retard"
          value={dashboard.tachesEnRetard}
          icon={dashboard.tachesEnRetard > 0 ? '⚠️' : '✅'}
          sub={dashboard.tachesEnRetard > 0 ? 'Action requise' : 'Tout va bien'}
          gradient={dashboard.tachesEnRetard > 0 ? 'from-red-500/10 to-orange-500/10 dark:from-red-500/5 dark:to-orange-500/5' : 'from-green-500/10 to-emerald-500/10 dark:from-green-500/5 dark:to-emerald-500/5'}
          border={dashboard.tachesEnRetard > 0 ? 'border-red-200/50 dark:border-red-500/20' : 'border-green-200/50 dark:border-green-500/20'}
        />
      </div>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div className="relative max-w-md">
        <HiOutlineSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un client ou projet…"
          className="h-11 w-full rounded-2xl border border-gray-200 bg-white/80 backdrop-blur pl-11 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-dark/80 dark:text-gray-300 transition-all"
        />
      </div>

      {/* ── Client Cards Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(group => (
          <ClientCard
            key={group.clientNom}
            group={group}
            isExpanded={expandedClient === group.clientNom}
            onToggle={() => setExpandedClient(expandedClient === group.clientNom ? null : group.clientNom)}
            expandedProjet={expandedProjet}
            onToggleProjet={toggleProjet}
            projetTaches={projetTaches}
            loadingTaches={loadingTaches}
            onNavigateDetail={(id) => navigate(`/admin/dashboard-projets/${id}`)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <span className="text-4xl opacity-20">🔍</span>
          <p className="text-gray-400 mt-3">Aucun client trouvé</p>
        </div>
      )}

      {/* ── Alertes Drawer ─────────────────────────────────────────────── */}
      {showAlertes && (
        <AlertesDrawer alertes={dashboard.alertes} onClose={() => setShowAlertes(false)} onNavigate={(id) => { setShowAlertes(false); navigate(`/admin/dashboard-projets/${id}`); }} />
      )}
    </div>
  );
};

/* ── KPI Card ─────────────────────────────────────────────────────────── */

const KpiCard: React.FC<{
  label: string; value: string | number; icon: string; sub?: string;
  gradient: string; border: string; progress?: number;
}> = ({ label, value, icon, sub, gradient, border, progress }) => (
  <div className={`relative overflow-hidden rounded-2xl border ${border} bg-gradient-to-br ${gradient} p-5`}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-2xl">{icon}</span>
      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
    {progress !== undefined && (
      <div className="mt-3 h-1.5 w-full rounded-full bg-white/50 dark:bg-gray-800/50 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-brand-500 transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
    )}
    {sub && <p className="text-[11px] text-gray-400 mt-2">{sub}</p>}
  </div>
);

/* ── Client Card ──────────────────────────────────────────────────────── */

const ClientCard: React.FC<{
  group: ClientGroup;
  isExpanded: boolean;
  onToggle: () => void;
  expandedProjet: number | null;
  onToggleProjet: (id: number) => void;
  projetTaches: Record<number, any[]>;
  loadingTaches: number | null;
  onNavigateDetail: (id: number) => void;
}> = ({ group, isExpanded, onToggle, expandedProjet, onToggleProjet, projetTaches, loadingTaches, onNavigateDetail }) => {
  const progressGradient = group.progression >= 80 ? 'from-emerald-400 to-emerald-500'
    : group.progression >= 50 ? 'from-brand-400 to-brand-500'
    : group.progression >= 20 ? 'from-amber-400 to-orange-500'
    : 'from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500';

  return (
    <div className={`rounded-2xl border transition-all duration-300 ${isExpanded
      ? 'md:col-span-2 xl:col-span-3 border-brand-300 dark:border-brand-500/30 shadow-xl shadow-brand-500/5'
      : 'border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg hover:shadow-gray-500/5'
    } bg-white dark:bg-gray-dark overflow-hidden`}>

      {/* Header — always visible */}
      <button onClick={onToggle} className="w-full text-left p-5 flex items-center gap-4 group">
        {/* Client avatar */}
        <div className={`shrink-0 h-12 w-12 rounded-2xl bg-gradient-to-br ${group.tachesEnRetard > 0 ? 'from-red-400 to-orange-500' : 'from-brand-400 to-violet-500'} flex items-center justify-center text-white font-black text-lg shadow-lg ${group.tachesEnRetard > 0 ? 'shadow-red-500/20' : 'shadow-brand-500/20'}`}>
          {group.clientNom.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {group.clientNom}
            </h3>
            {group.tachesEnRetard > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-500/15 dark:text-red-400 animate-pulse">
                ⚠ {group.tachesEnRetard}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span>{group.projets.length} projet{group.projets.length > 1 ? 's' : ''}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>{group.totalTaches} tâche{group.totalTaches > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Progress ring */}
        <div className="shrink-0 relative h-11 w-11">
          <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" strokeWidth="4" className="stroke-gray-100 dark:stroke-gray-800" />
            <circle cx="22" cy="22" r="18" fill="none" strokeWidth="4" strokeLinecap="round"
              className={`${group.progression >= 80 ? 'stroke-emerald-500' : group.progression >= 40 ? 'stroke-brand-500' : 'stroke-amber-500'}`}
              strokeDasharray={`${group.progression * 1.13} 113`}
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-300">
            {group.progression}%
          </span>
        </div>

        <div className={`shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
          <HiOutlineChevronRight size={18} className="text-gray-400" />
        </div>
      </button>

      {/* Expanded: Projects list */}
      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
          <div className="p-4 space-y-2">
            {group.projets.map(projet => (
              <ProjetRow
                key={projet.projetId}
                projet={projet}
                isExpanded={expandedProjet === projet.projetId}
                onToggle={() => onToggleProjet(projet.projetId)}
                taches={projetTaches[projet.projetId]}
                isLoadingTaches={loadingTaches === projet.projetId}
                onDetail={() => onNavigateDetail(projet.projetId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Project Row ──────────────────────────────────────────────────────── */

const ProjetRow: React.FC<{
  projet: ProjetSummaryDTO;
  isExpanded: boolean;
  onToggle: () => void;
  taches?: any[];
  isLoadingTaches: boolean;
  onDetail: () => void;
}> = ({ projet, isExpanded, onToggle, taches, isLoadingTaches, onDetail }) => {
  const done = projet.totalTaches > 0 ? Math.round((projet.tachesDone / projet.totalTaches) * 100) : 0;

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${isExpanded ? 'border-brand-200 dark:border-brand-500/20 bg-white dark:bg-gray-dark' : 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-dark'}`}>
      {/* Project header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onToggle} className="flex items-center gap-3 flex-1 min-w-0 text-left group">
          <div className={`shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
            <HiOutlineChevronRight size={14} className="text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {projet.projetNom}
              </span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${statutColors[projet.statut] || ''}`}>
                {statutLabels[projet.statut]}
              </span>
              {projet.tachesEnRetard > 0 && (
                <span className="text-[9px] font-bold text-red-500">⚠ {projet.tachesEnRetard}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {/* Mini progress bar */}
              <div className="h-1 w-16 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${done}%` }} />
              </div>
              <span className="text-[10px] text-gray-400">{done}% • {projet.tachesDone}/{projet.totalTaches}</span>
              {projet.managerNoms.length > 0 && (
                <span className="text-[10px] text-gray-400">• 👔 {projet.managerNoms[0]}</span>
              )}
            </div>
          </div>
        </button>

        <button
          onClick={onDetail}
          className="shrink-0 rounded-lg bg-brand-50 px-3 py-1.5 text-[11px] font-semibold text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition-colors"
        >
          Détails →
        </button>
      </div>

      {/* Expanded: Tasks */}
      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 bg-gray-50/30 dark:bg-gray-800/10">
          {isLoadingTaches ? (
            <div className="py-4 text-center text-xs text-gray-400">Chargement des tâches…</div>
          ) : !taches || taches.length === 0 ? (
            <div className="py-4 text-center text-xs text-gray-400">Aucune tâche</div>
          ) : (
            <div className="space-y-1.5">
              {taches.map((t: any) => (
                <div key={t.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${t.statut === 'DONE' ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : t.statut === 'IN_PROGRESS' ? 'bg-brand-50/50 dark:bg-brand-500/5' : 'bg-white dark:bg-gray-dark'} border border-gray-100 dark:border-gray-700/30`}>
                  {/* Status dot */}
                  <div className={`h-2 w-2 rounded-full shrink-0 ${t.statut === 'DONE' ? 'bg-emerald-500' : t.statut === 'IN_PROGRESS' ? 'bg-brand-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  <span className="flex-1 text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{t.titre}</span>
                  {t.dateEcheance && <span className="text-[10px] text-gray-400 shrink-0">📅 {t.dateEcheance}</span>}
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold shrink-0 ${t.statut === 'DONE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : t.statut === 'IN_PROGRESS' ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400' : 'bg-gray-100 text-gray-500'}`}>
                    {tacheStatutLabels[t.statut] || t.statut}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Alertes Drawer (slide-in panel) ──────────────────────────────────── */

const AlertesDrawer: React.FC<{
  alertes: AlerteDTO[];
  onClose: () => void;
  onNavigate: (id: number) => void;
}> = ({ alertes, onClose, onNavigate }) => (
  <>
    {/* Backdrop */}
    <div className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm" onClick={onClose} />

    {/* Panel */}
    <div className="fixed right-0 top-0 z-[101] h-full w-full max-w-lg bg-white dark:bg-gray-dark shadow-2xl overflow-y-auto animate-slideIn">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-white/90 dark:bg-gray-dark/90 backdrop-blur px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <HiOutlineLightningBolt size={20} className="text-orange-500" />
          Alertes ({alertes.length})
        </h2>
        <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <HiOutlineX size={20} />
        </button>
      </div>

      <div className="p-6 space-y-3">
        {alertes.length === 0 ? (
          <div className="py-16 text-center">
            <HiOutlineCheckCircle size={40} className="mx-auto text-emerald-400 mb-3" />
            <p className="text-gray-400">Aucune alerte 🎉</p>
          </div>
        ) : alertes.map((a, i) => (
          <button
            key={i}
            onClick={() => a.projetId && onNavigate(a.projetId)}
            className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-md ${a.niveau === 'CRITIQUE' ? 'border-red-200 bg-red-50/50 hover:bg-red-50 dark:border-red-500/20 dark:bg-red-500/5 dark:hover:bg-red-500/10' : 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 dark:hover:bg-amber-500/10'}`}
          >
            <div className="flex items-start gap-3">
              {a.niveau === 'CRITIQUE'
                ? <HiOutlineExclamationCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                : <HiOutlineExclamation size={20} className="text-amber-500 shrink-0 mt-0.5" />
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${a.niveau === 'CRITIQUE' ? 'bg-red-200 text-red-800 dark:bg-red-500/30 dark:text-red-300' : 'bg-amber-200 text-amber-800 dark:bg-amber-500/30 dark:text-amber-300'}`}>
                    {a.niveau}
                  </span>
                  {a.projetNom && <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{a.projetNom}</span>}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{a.probleme}</p>
                <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-gray-400">
                  {a.tacheNom && <span>📋 {a.tacheNom}</span>}
                  {a.employeNom && <span>👤 {a.employeNom}</span>}
                  {a.retardJours > 0 && <span className="text-red-500 font-bold">+{a.retardJours}j</span>}
                </div>
                <p className="text-[10px] text-brand-600 dark:text-brand-400 mt-1.5">💡 {a.actionSuggere}</p>
              </div>
              <HiOutlineChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0 mt-1" />
            </div>
          </button>
        ))}
      </div>
    </div>

    {/* Slide-in animation */}
    <style>{`
      @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      .animate-slideIn { animation: slideIn 0.3s ease-out; }
    `}</style>
  </>
);

export default AdminProjectDashboardPage;
