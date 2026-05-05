import React, { useState, useEffect } from 'react';
import {
  HiOutlineFolder,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineRefresh,
  HiOutlinePrinter,
  HiOutlineChartBar,
  HiOutlineUser,
  HiOutlineUsers,
  HiOutlineX,
} from 'react-icons/hi';
import { projetService } from '../api/projetService';
import { projetAnalyseService, ProjetAnalyseDTO } from '../api/projetAnalyseService';
import { Projet } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatMinutes = (min: number | null): string => {
  if (min === null || min === undefined) return '—';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return `${h}h${m > 0 ? ` ${m}min` : ''}`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return `${d}j ${rh > 0 ? `${rh}h` : ''}`.trim();
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const statusLabel = (s: string) => ({
  PLANIFIE: 'Planifié', EN_COURS: 'En cours', CLOTURE: 'Clôturé', ANNULE: 'Annulé',
}[s] ?? s);

const statutTacheLabel = (s: string) => ({
  TODO: 'À faire', IN_PROGRESS: 'En cours', DONE: 'Terminé',
}[s] ?? s);

// ── Sub-components ────────────────────────────────────────────────────────────

const PhaseCard: React.FC<{ title: string; icon: React.ReactNode; color: string; children: React.ReactNode }> = ({
  title, icon, color, children,
}) => (
  <div className={`rounded-3xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.06)] dark:shadow-none transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg`}>
    <div className={`flex items-center gap-4 px-6 py-5 border-b border-black/5 dark:border-white/10 ${color}`}>
      <div className="w-10 h-10 rounded-xl bg-white/60 dark:bg-black/20 flex items-center justify-center backdrop-blur-md shadow-sm">
        <span className="text-xl">{icon}</span>
      </div>
      <h3 className="font-bold text-sm tracking-wide uppercase text-gray-800 dark:text-gray-200">{title}</h3>
    </div>
    <div className="p-6 space-y-2">{children}</div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className={`flex items-center justify-between py-3 border-b border-gray-100/50 dark:border-gray-800/50 last:border-0 ${highlight ? 'text-error-600 dark:text-error-400 font-bold' : ''}`}>
    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm font-bold text-gray-800 dark:text-white">{value}</span>
  </div>
);

const Badge: React.FC<{ ok: boolean; label?: string }> = ({ ok, label }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
    ok
      ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400'
      : 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400'
  }`}>
    {ok ? <HiOutlineCheckCircle size={12} /> : <HiOutlineExclamation size={12} />}
    {label ?? (ok ? '✅ OK' : '⚠ Retard')}
  </span>
);

/** Stacked bar showing time distribution */
const TimeBar: React.FC<{ todoMin: number; ipMin: number; doneMin: number; totalMin: number }> = ({
  todoMin, ipMin, doneMin, totalMin,
}) => {
  if (totalMin <= 0) return <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 w-full" />;
  const todoPct = Math.round((todoMin / totalMin) * 100);
  const ipPct = Math.round((ipMin / totalMin) * 100);
  const donePct = Math.max(100 - todoPct - ipPct, 0);
  return (
    <div className="flex h-3 w-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800" title={`TODO: ${formatMinutes(todoMin)} | En cours: ${formatMinutes(ipMin)} | Done: ${formatMinutes(doneMin)}`}>
      {todoPct > 0 && <div className="bg-amber-400 dark:bg-amber-500 transition-all" style={{ width: `${todoPct}%` }} />}
      {ipPct > 0 && <div className="bg-brand-500 dark:bg-brand-400 transition-all" style={{ width: `${ipPct}%` }} />}
      {donePct > 0 && <div className="bg-emerald-400 dark:bg-emerald-500 transition-all" style={{ width: `${donePct}%` }} />}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const RapportProjetPage: React.FC = () => {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rapport, setRapport] = useState<ProjetAnalyseDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProjets, setLoadingProjets] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load project list
  useEffect(() => {
    (async () => {
      try {
        const res = await projetService.getAll();
        setProjets((res.data as any).data ?? []);
      } catch {
        setError("Impossible de charger la liste des projets.");
      } finally {
        setLoadingProjets(false);
      }
    })();
  }, []);

  const loadRapport = async (id: number) => {
    setLoading(true);
    setError(null);
    setRapport(null);
    try {
      const res = await projetAnalyseService.getRapport(id);
      setRapport((res.data as any).data ?? res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Erreur lors du chargement du rapport.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id: number) => {
    setSelectedId(id);
    loadRapport(id);
  };

  // ── KPI cards ──────────────────────────────────────────────────────────────
  const kpis = rapport ? [
    {
      label: 'Durée totale',
      value: formatMinutes(rapport.dureeTotaleMinutes),
      icon: <HiOutlineClock size={22} />,
      color: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
    },
    {
      label: 'Tâches créées',
      value: rapport.phaseSetup.nombreTaches,
      icon: <HiOutlineChartBar size={22} />,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    },
    {
      label: 'Retards détectés',
      value: rapport.retards.length,
      icon: <HiOutlineExclamation size={22} />,
      color: rapport.retards.length > 0
        ? 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400'
        : 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400',
    },
    {
      label: 'Statut projet',
      value: rapport.statut ? statusLabel(rapport.statut) : '—',
      icon: <HiOutlineFolder size={22} />,
      color: rapport.statut === 'CLOTURE'
        ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400'
        : 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400',
    },
  ] : [];

  return (
    <div className="space-y-8 pb-10">
      {/* Background Decor (Glassmorphism blobs) */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-500/10 dark:bg-brand-500/5 blur-[120px] rounded-full" />
        <div className="absolute right-[-10%] bottom-[10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-2">
        <div>
         
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Rapport <span className="text-brand-600 dark:text-brand-400">Cycle de vie</span>
              </h1>
          <p className="text-base font-medium text-gray-500 dark:text-gray-400 mt-3 max-w-2xl leading-relaxed">
            Analyse complète des délais par phase : <strong className="text-gray-700 dark:text-gray-300 font-semibold">mise en place</strong>, <strong className="text-gray-700 dark:text-gray-300 font-semibold">distribution</strong>, <strong className="text-gray-700 dark:text-gray-300 font-semibold">exécution</strong> et <strong className="text-gray-700 dark:text-gray-300 font-semibold">clôture</strong>.
          </p>
        </div>
        {rapport && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md px-5 py-2.5 text-sm font-bold text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-all hover:-translate-y-0.5"
          >
            <HiOutlinePrinter size={18} className="text-brand-600 dark:text-brand-400" /> 
            Imprimer
          </button>
        )}
      </div>

      {/* Project selector */}
      <div className="rounded-[2rem] border border-black/5 dark:border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-8 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.05)] dark:shadow-none transition-all">
        <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
          Sélectionner un projet
        </label>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <select
              value={selectedId ?? ''}
              onChange={e => handleSelect(Number(e.target.value))}
              disabled={loadingProjets}
              className="w-full h-14 rounded-2xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-black/20 px-5 text-base font-semibold text-gray-800 dark:text-gray-200 appearance-none focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/20 backdrop-blur-sm transition-shadow cursor-pointer"
            >
              <option value="">— Choisir un projet —</option>
              {projets.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nom} {p.clientNom ? `(${p.clientNom})` : ''}
                </option>
              ))}
            </select>
          </div>
          {selectedId && (
            <button
              onClick={() => loadRapport(selectedId)}
              className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 hover:scale-105 hover:-translate-y-1 transition-all"
            >
              <HiOutlineRefresh size={22} />
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-error-50/80 dark:bg-error-500/10 backdrop-blur-md border border-error-200 dark:border-error-500/20 px-6 py-4 flex items-center gap-4">
          <HiOutlineX size={24} className="text-error-600 shrink-0" />
          <p className="text-sm font-semibold text-error-700 dark:text-error-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-200 border-t-brand-600" />
        </div>
      )}

      {/* Rapport */}
      {rapport && !loading && (
        <div className="space-y-8 print:space-y-6">

          {/* Project header banner */}
          <div className="rounded-[2rem] border border-black/5 dark:border-white/10 bg-gradient-to-br from-brand-50 to-blue-50/50 dark:from-brand-900/20 dark:to-blue-900/10 backdrop-blur-xl p-8 relative overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.06)] dark:shadow-none">
            <div className="absolute top-0 right-0 p-10 opacity-5 dark:opacity-10 pointer-events-none mix-blend-overlay">
              <HiOutlineFolder size={200} />
            </div>
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                    <HiOutlineFolder size={24} className="text-brand-500" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{rapport.projetNom}</h2>
                  {rapport.clientNom && (
                    <span className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5 text-sm font-bold text-gray-600 dark:text-gray-300 backdrop-blur-md">
                      {rapport.clientNom}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600 dark:text-gray-400 mt-4">
                  <span className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-lg">📂</span>
                    <span><strong>Ouverture :</strong> {formatDate(rapport.dateOuverture)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-lg">🔒</span>
                    <span><strong>Clôture :</strong> {formatDate(rapport.dateCloture)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-lg">⏱</span>
                    <span><strong>Durée :</strong> {formatMinutes(rapport.dureeTotaleMinutes)}</span>
                  </span>
                </div>
              </div>
              <div className="self-end md:self-auto">
                <span className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold border ${
                  rapport.statut === 'CLOTURE' ? 'bg-success-50 border-success-200 text-success-700 dark:bg-success-900/20 dark:border-success-800 dark:text-success-400' :
                  rapport.statut === 'EN_COURS' ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-900/20 dark:border-brand-800 dark:text-brand-400' :
                  'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                } shadow-sm backdrop-blur-md`}>
                  {statusLabel(rapport.statut ?? '')}
                </span>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map(kpi => (
              <div key={kpi.label} className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-6 flex items-center gap-5 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.06)] dark:shadow-none hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${kpi.color} bg-opacity-70 dark:bg-opacity-20`}>
                  {kpi.icon}
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{kpi.label}</p>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Phase 1 — Setup */}
          <PhaseCard
            title="PHASE 1 — Mise en place (Admin)"
            icon={<HiOutlineUser />}
            color="bg-gradient-to-r from-blue-500/10 to-transparent dark:from-blue-500/5 text-blue-800 dark:text-blue-300 border-b-blue-500/20"
          >
            <InfoRow label="Date de création du projet" value={formatDate(rapport.phaseSetup.dateCreationProjet)} />
            <InfoRow label="Durée de mise en place" value={formatMinutes(rapport.phaseSetup.dureeSetupMinutes)} />
            <InfoRow label="Nombre de tâches créées" value={rapport.phaseSetup.nombreTaches} />
            <InfoRow
              label="Retard détecté"
              value={<Badge ok={!rapport.phaseSetup.retardDetecte} label={rapport.phaseSetup.retardDetecte ? '⚠ Oui' : '✅ Non'} />}
            />
            {rapport.phaseSetup.commentaire && (
              <div className="mt-4 p-4 rounded-2xl bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-black/5 dark:border-white/5">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 italic">
                  "{rapport.phaseSetup.commentaire}"
                </p>
              </div>
            )}
          </PhaseCard>

          {/* Phase 2 — Distribution */}
          <PhaseCard
            title="PHASE 2 — Distribution (Managers)"
            icon={<HiOutlineUsers />}
            color="bg-gradient-to-r from-purple-500/10 to-transparent dark:from-purple-500/5 text-purple-800 dark:text-purple-300 border-b-purple-500/20"
          >
            {rapport.phaseDistribution.length === 0 ? (
              <div className="flex items-center justify-center p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl">
                <p className="text-sm font-medium text-gray-400 italic">Aucune tâche assignée pour le moment.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-black/10 backdrop-blur-md">
                <table className="w-full text-sm">
                  <thead className="bg-black/5 dark:bg-white/5">
                    <tr>
                      <th className="text-left px-5 py-4 text-xs font-bold text-gray-500 tracking-widest uppercase">Assigné à</th>
                      <th className="text-left px-5 py-4 text-xs font-bold text-gray-500 tracking-widest uppercase">Tâche</th>
                      <th className="text-left px-5 py-4 text-xs font-bold text-gray-500 tracking-widest uppercase">Réception</th>
                      <th className="text-left px-5 py-4 text-xs font-bold text-gray-500 tracking-widest uppercase">Assignation</th>
                      <th className="text-left px-5 py-4 text-xs font-bold text-gray-500 tracking-widest uppercase">Délai</th>
                      <th className="text-left px-5 py-4 text-xs font-bold text-gray-500 tracking-widest uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {rapport.phaseDistribution.map(d => (
                      <tr key={`${d.managerId}-${d.tacheId}`} className="hover:bg-white dark:hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-gray-800 dark:text-gray-200">{d.managerNom}</td>
                        <td className="px-5 py-3.5 font-medium text-gray-600 dark:text-gray-400">{d.tacheNom}</td>
                        <td className="px-5 py-3.5 text-gray-500">{formatDate(d.dateReception)}</td>
                        <td className="px-5 py-3.5 text-gray-500">{formatDate(d.dateRedistribution)}</td>
                        <td className="px-5 py-3.5 font-bold text-gray-700 dark:text-gray-300">{formatMinutes(d.dureeDistributionMinutes)}</td>
                        <td className="px-5 py-3.5"><Badge ok={!d.retard} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PhaseCard>

          {/* ── Temps Inactif Managers ──────────────────────────────────────────── */}
          {rapport.tempsInactifManagers && rapport.tempsInactifManagers.length > 0 && (
            <PhaseCard
              title="TEMPS INACTIF MANAGERS — Délai avant distribution"
              icon={<HiOutlineClock />}
              color="bg-gradient-to-r from-orange-500/10 to-transparent dark:from-orange-500/5 text-orange-800 dark:text-orange-300 border-b-orange-500/20"
            >
              <div className="space-y-4">
                {rapport.tempsInactifManagers.map(m => (
                  <div key={m.managerId} className={`rounded-2xl border p-5 backdrop-blur-sm transition-all hover:shadow-md ${m.retard ? 'border-red-200/50 bg-red-50/40 dark:border-red-500/20 dark:bg-red-900/10' : 'border-black/5 bg-white/40 dark:border-white/5 dark:bg-black/10'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm ${m.retard ? 'bg-gradient-to-br from-red-400 to-orange-500' : 'bg-gradient-to-br from-purple-400 to-violet-500'}`}>
                          {m.managerNom.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-800 dark:text-white uppercase tracking-wide">{m.managerNom}</p>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Manager</p>
                        </div>
                      </div>
                      <Badge ok={!m.retard} label={m.retard ? '⚠ Retard' : '✅ OK'} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="rounded-xl border border-black/5 dark:border-white/5 bg-white/60 dark:bg-white/5 p-3.5 shadow-sm">
                        <p className="text-gray-400 mb-1 text-xs uppercase tracking-wider font-bold">Réception</p>
                        <p className="font-bold text-gray-800 dark:text-gray-200">{formatDate(m.dateReceptionProjet)}</p>
                      </div>
                      <div className="rounded-xl border border-black/5 dark:border-white/5 bg-white/60 dark:bg-white/5 p-3.5 shadow-sm">
                        <p className="text-gray-400 mb-1 text-xs uppercase tracking-wider font-bold">1ère assign.</p>
                        <p className="font-bold text-gray-800 dark:text-gray-200">{formatDate(m.datePremiereAssignation)}</p>
                      </div>
                      <div className={`rounded-xl border p-3.5 shadow-sm ${m.retard ? 'border-red-200/50 bg-red-100/50 dark:border-red-500/20 dark:bg-red-500/10' : 'border-black/5 bg-white/60 dark:border-white/5 dark:bg-white/5'}`}>
                        <p className="text-gray-400 mb-1 text-xs uppercase tracking-wider font-bold">Inactif</p>
                        <p className={`font-extrabold ${m.retard ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
                          {formatMinutes(m.tempsInactifMinutes)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-black/5 dark:border-white/5 bg-white/60 dark:bg-white/5 p-3.5 shadow-sm">
                        <p className="text-gray-400 mb-1 text-xs uppercase tracking-wider font-bold">Non assign.</p>
                        <p className={`font-bold ${m.tachesNonAssignees > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-800 dark:text-gray-200'}`}>
                          {m.tachesNonAssignees} tâche{m.tachesNonAssignees > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {m.commentaire && (
                      <div className="mt-4 p-3.5 rounded-xl bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5 text-sm font-medium text-gray-500 dark:text-gray-400 italic">
                        "{m.commentaire}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </PhaseCard>
          )}

          {/* Phase 3 — Exécution */}
          <PhaseCard
            title="PHASE 3 — Exécution (Membres)"
            icon={<HiOutlineChartBar />}
            color="bg-gradient-to-r from-emerald-500/10 to-transparent dark:from-emerald-500/5 text-emerald-800 dark:text-emerald-300 border-b-emerald-500/20"
          >
            {rapport.phaseExecution.length === 0 ? (
              <div className="flex items-center justify-center p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl">
                <p className="text-sm font-medium text-gray-400 italic">Aucune tâche avec données d'exécution.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-black/10 backdrop-blur-md">
                <table className="w-full text-sm">
                  <thead className="bg-black/5 dark:bg-white/5">
                    <tr>
                      <th className="text-left px-5 py-4 text-xs font-bold text-gray-500 tracking-widest uppercase">Membre</th>
                      <th className="text-left px-5 py-4 text-xs font-bold text-gray-500 tracking-widest uppercase">Tâche</th>
                      <th className="text-left px-5 py-4 text-xs font-bold text-gray-500 tracking-widest uppercase">Délai démarrage</th>
                      <th className="text-left px-5 py-4 text-xs font-bold text-gray-500 tracking-widest uppercase">Durée exéc.</th>
                      <th className="text-left px-5 py-4 text-xs font-bold text-gray-500 tracking-widest uppercase">Statut final</th>
                      <th className="text-left px-5 py-4 text-xs font-bold text-gray-500 tracking-widest uppercase">Retard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rapport.phaseExecution.map(e => (
                      <tr key={`${e.membreId}-${e.tacheId}`} className={`transition-colors ${e.enRetard ? 'bg-error-50/50 dark:bg-error-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}>
                        <td className="py-2.5 font-medium text-gray-800 dark:text-white">{e.membreNom}</td>
                        <td className="py-2.5 text-gray-600 dark:text-gray-400">{e.tacheNom}</td>
                        <td className="py-2.5">{formatMinutes(e.delaiDemarrage)}</td>
                        <td className="py-2.5">{formatMinutes(e.dureeExecution)}</td>
                        <td className="py-2.5">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            e.statutFinal === 'DONE'
                              ? 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400'
                              : e.statutFinal === 'IN_PROGRESS'
                              ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {statutTacheLabel(e.statutFinal)}
                          </span>
                        </td>
                        <td className="py-2.5"><Badge ok={!e.enRetard} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PhaseCard>

          {/* ── TEMPS PAR EMPLOYÉ ─────────────────────────────────────────────── */}
          {rapport.tempsParEmploye && rapport.tempsParEmploye.length > 0 && (
            <PhaseCard
              title="RENDEMENT PAR EMPLOYÉ — Temps dans chaque statut"
              icon={<HiOutlineClock />}
              color="border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-900/10"
            >
              {/* Legend */}
              <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> TODO (en attente)</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> En cours</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Terminé</span>
              </div>

              <div className="space-y-4">
                {rapport.tempsParEmploye.map(emp => {
                  const todoMin = emp.tempsEnTodoMinutes ?? 0;
                  const ipMin = emp.tempsEnInProgressMinutes ?? 0;
                  const doneMin = emp.tempsDepuisDoneMinutes ?? 0;
                  const totalMin = emp.tempsTotalMinutes ?? 0;
                  const inactifMin = emp.tempsInactifMinutes ?? 0;
                  const isAnomaly = todoMin > ipMin * 2 || inactifMin > totalMin * 0.3;

                  return (
                    <div key={emp.employeId} className={`rounded-xl border p-4 transition-all ${isAnomaly ? 'border-amber-300 bg-amber-50/30 dark:border-amber-500/30 dark:bg-amber-500/5' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-dark'}`}>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md ${isAnomaly ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20' : 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-cyan-500/20'}`}>
                            {emp.employeNom.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800 dark:text-white">{emp.employeNom}</p>
                            <p className="text-[10px] text-gray-400">
                              {emp.totalTaches} tâche{emp.totalTaches > 1 ? 's' : ''} • {emp.tachesDone} terminée{emp.tachesDone > 1 ? 's' : ''}
                              {emp.tachesInProgress > 0 && ` • ${emp.tachesInProgress} en cours`}
                              {emp.tachesTodo > 0 && ` • ${emp.tachesTodo} en attente`}
                            </p>
                          </div>
                        </div>
                        {isAnomaly && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                            <HiOutlineExclamation size={10} /> Anomalie
                          </span>
                        )}
                      </div>

                      {/* Time Bar */}
                      <TimeBar todoMin={todoMin} ipMin={ipMin} doneMin={doneMin} totalMin={Math.max(todoMin + ipMin + doneMin, 1)} />

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 p-2 text-center">
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">TODO</p>
                          <p className="text-sm font-bold text-amber-700 dark:text-amber-300">{formatMinutes(todoMin)}</p>
                        </div>
                        <div className="rounded-lg bg-brand-50 dark:bg-brand-500/10 p-2 text-center">
                          <p className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">En cours</p>
                          <p className="text-sm font-bold text-brand-700 dark:text-brand-300">{formatMinutes(ipMin)}</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-2 text-center">
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Depuis Done</p>
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatMinutes(doneMin)}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2 text-center">
                          <p className="text-[10px] text-gray-500 font-medium">Total</p>
                          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{formatMinutes(totalMin)}</p>
                        </div>
                        <div className={`rounded-lg p-2 text-center ${inactifMin > 0 ? 'bg-red-50 dark:bg-red-500/10' : 'bg-gray-50 dark:bg-gray-800'}`}>
                          <p className={`text-[10px] font-medium ${inactifMin > 0 ? 'text-red-500' : 'text-gray-500'}`}>Inactif</p>
                          <p className={`text-sm font-bold ${inactifMin > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{formatMinutes(inactifMin)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PhaseCard>
          )}

          {/* Phase 4 — Clôture */}
          <PhaseCard
            title="PHASE 4 — Clôture"
            icon={<HiOutlineCheckCircle />}
            color="border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20"
          >
            <InfoRow label="Dernière tâche terminée" value={formatDate(rapport.phaseCloture.dateDerniereTacheDone)} />
            <InfoRow label="Date de clôture" value={formatDate(rapport.phaseCloture.dateCloture)} />
            <InfoRow label="Délai de clôture" value={formatMinutes(rapport.phaseCloture.delaiCloture)} />
            <InfoRow
              label="Clôture effectuée"
              value={<Badge ok={rapport.phaseCloture.clotureEffectuee} label={rapport.phaseCloture.clotureEffectuee ? 'Oui ✅' : 'Non — Projet ouvert'} />}
            />
          </PhaseCard>

          {/* Résumé des retards */}
          {rapport.retards.length > 0 && (
            <div className="rounded-2xl border border-error-200 dark:border-error-800 overflow-hidden">
              <div className="bg-error-50 dark:bg-error-900/20 border-b border-error-200 dark:border-error-800 px-5 py-3.5 flex items-center gap-3">
                <HiOutlineExclamation size={18} className="text-error-600" />
                <h3 className="font-semibold text-sm text-error-700 dark:text-error-400">
                  RÉSUMÉ DES RETARDS ({rapport.retards.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Source</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Responsable</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Étape</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Durée retard</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rapport.retards.map((r, i) => (
                      <tr key={i} className="hover:bg-error-50/30 dark:hover:bg-error-900/10 transition-colors">
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            r.source === 'Admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                            r.source === 'Manager' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' :
                            'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'
                          }`}>
                            {r.source}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-800 dark:text-white">{r.nom}</td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{r.etape}</td>
                        <td className="px-5 py-3 text-error-600 dark:text-error-400 font-semibold">
                          {formatMinutes(r.dureeRetardMinutes)}
                        </td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs italic">{r.impact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Recommendations */}
              <div className="px-5 py-4 bg-orange-50 dark:bg-orange-900/10 border-t border-orange-200 dark:border-orange-800">
                <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2">
                  💡 Recommandations
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-orange-700 dark:text-orange-400">
                  {rapport.retards.some(r => r.source === 'Admin') && (
                    <li>Réduire le temps de mise en place Admin — envisager des templates de tâches prédéfinis.</li>
                  )}
                  {rapport.retards.some(r => r.source === 'Manager') && (
                    <li>Les managers doivent redistribuer les tâches dans les 24h suivant leur réception.</li>
                  )}
                  {rapport.retards.some(r => r.source === 'Membre') && (
                    <li>Les membres en retard devraient signaler les blocages plus tôt pour permettre une réallocation.</li>
                  )}
                  {rapport.tempsInactifManagers?.some(m => m.retard) && (
                    <li>Un ou plusieurs managers ont mis trop de temps avant de distribuer les tâches — mettre en place des alertes automatiques.</li>
                  )}
                  {rapport.tempsParEmploye?.some(e => (e.tempsInactifMinutes ?? 0) > (e.tempsTotalMinutes ?? 1) * 0.3) && (
                    <li>Certains employés ont un temps inactif élevé — vérifier la charge de travail et la répartition des tâches.</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {rapport.retards.length === 0 && (
            <div className="rounded-2xl border border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20 p-5 flex items-center gap-3">
              <HiOutlineCheckCircle size={24} className="text-success-600 shrink-0" />
              <div>
                <p className="font-semibold text-success-700 dark:text-success-400">Aucun retard détecté !</p>
                <p className="text-xs text-success-600 dark:text-success-500 mt-0.5">
                  Ce projet s'est déroulé dans les délais sur toutes les phases.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!rapport && !loading && !error && (
        <div className="mt-8 flex flex-col items-center justify-center py-20 px-4 rounded-[2rem] border border-black/5 dark:border-white/10 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.05)] dark:shadow-none transition-all">
          <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-brand-500/10 to-brand-500/5 flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-brand-500/5 dark:bg-brand-500/10 animate-pulse" />
            <HiOutlineChartBar size={48} className="text-brand-500/60 relative z-10" />
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">En attente de sélection</p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-3 max-w-sm text-center leading-relaxed">
            Veuillez choisir un projet dans le menu déroulant ci-dessus pour générer et analyser son rapport complet.
          </p>
        </div>
      )}
    </div>
  );
};

export default RapportProjetPage;
