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
  <div className={`rounded-2xl border ${color} overflow-hidden`}>
    <div className={`flex items-center gap-3 px-5 py-3.5 border-b ${color}`}>
      <span className="text-lg">{icon}</span>
      <h3 className="font-semibold text-sm">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className={`flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 ${highlight ? 'text-error-600 dark:text-error-400 font-medium' : ''}`}>
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-800 dark:text-white">{value}</span>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">
            Rapport Cycle de Vie Projet
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Analyse complète des délais par phase : mise en place, distribution, exécution et clôture
          </p>
        </div>
        {rapport && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <HiOutlinePrinter size={16} /> Imprimer
          </button>
        )}
      </div>

      {/* Project selector */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Sélectionner un projet
        </label>
        <div className="flex gap-3">
          <select
            value={selectedId ?? ''}
            onChange={e => handleSelect(Number(e.target.value))}
            disabled={loadingProjets}
            className="flex-1 h-11 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-4 text-sm text-gray-700 dark:text-gray-300 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10"
          >
            <option value="">— Choisir un projet —</option>
            {projets.map(p => (
              <option key={p.id} value={p.id}>
                {p.nom} {p.clientNom ? `(${p.clientNom})` : ''} — {p.statut ? statusLabel(p.statut as any) : ''}
              </option>
            ))}
          </select>
          {selectedId && (
            <button
              onClick={() => loadRapport(selectedId)}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              <HiOutlineRefresh size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 px-4 py-3 flex items-center gap-3">
          <HiOutlineX size={18} className="text-error-600 shrink-0" />
          <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500" />
        </div>
      )}

      {/* Rapport */}
      {rapport && !loading && (
        <div className="space-y-6 print:space-y-4">

          {/* Project header banner */}
          <div className="rounded-2xl border border-brand-200 dark:border-brand-800 bg-gradient-to-r from-brand-50 to-blue-50 dark:from-brand-900/20 dark:to-blue-900/20 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <HiOutlineFolder size={20} className="text-brand-500" />
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">{rapport.projetNom}</h2>
                  {rapport.clientNom && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">— {rapport.clientNom}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <span>📂 <strong>Ouverture :</strong> {formatDate(rapport.dateOuverture)}</span>
                  <span>🔒 <strong>Clôture :</strong> {formatDate(rapport.dateCloture)}</span>
                  <span>⏱ <strong>Durée totale :</strong> {formatMinutes(rapport.dureeTotaleMinutes)}</span>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                rapport.statut === 'CLOTURE' ? 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400' :
                rapport.statut === 'EN_COURS' ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400' :
                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {statusLabel(rapport.statut ?? '')}
              </span>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(kpi => (
              <div key={kpi.label} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark p-4 flex items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${kpi.color}`}>
                  {kpi.icon}
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.label}</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Phase 1 — Setup */}
          <PhaseCard
            title="PHASE 1 — Mise en place (Admin)"
            icon={<HiOutlineUser />}
            color="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10"
          >
            <InfoRow label="Date de création du projet" value={formatDate(rapport.phaseSetup.dateCreationProjet)} />
            <InfoRow label="Durée de mise en place" value={formatMinutes(rapport.phaseSetup.dureeSetupMinutes)} />
            <InfoRow label="Nombre de tâches créées" value={rapport.phaseSetup.nombreTaches} />
            <InfoRow
              label="Retard détecté"
              value={<Badge ok={!rapport.phaseSetup.retardDetecte} label={rapport.phaseSetup.retardDetecte ? '⚠ Oui' : '✅ Non'} />}
            />
            {rapport.phaseSetup.commentaire && (
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                {rapport.phaseSetup.commentaire}
              </p>
            )}
          </PhaseCard>

          {/* Phase 2 — Distribution */}
          <PhaseCard
            title="PHASE 2 — Distribution (Managers)"
            icon={<HiOutlineUsers />}
            color="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10"
          >
            {rapport.phaseDistribution.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucune tâche assignée.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Assigné à</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Tâche</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Date réception</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Date assignation</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Délai</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rapport.phaseDistribution.map(d => (
                      <tr key={`${d.managerId}-${d.tacheId}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="py-2.5 font-medium text-gray-800 dark:text-white">{d.managerNom}</td>
                        <td className="py-2.5 text-gray-600 dark:text-gray-400">{d.tacheNom}</td>
                        <td className="py-2.5 text-gray-500">{formatDate(d.dateReception)}</td>
                        <td className="py-2.5 text-gray-500">{formatDate(d.dateRedistribution)}</td>
                        <td className="py-2.5 font-medium">{formatMinutes(d.dureeDistributionMinutes)}</td>
                        <td className="py-2.5"><Badge ok={!d.retard} /></td>
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
              color="border-brand- dark:border-brand- bg-brand-/50 dark:bg-brand-/10"
            >
              <div className="space-y-4">
                {rapport.tempsInactifManagers.map(m => (
                  <div key={m.managerId} className={`rounded-xl border p-4 ${m.retard ? 'border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-dark'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm ${m.retard ? 'bg-gradient-to-br from-red-400 to-brand-' : 'bg-gradient-to-br from-purple-400 to-violet-500'}`}>
                          {m.managerNom.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800 dark:text-white">{m.managerNom}</p>
                          <p className="text-[10px] text-gray-400">Manager</p>
                        </div>
                      </div>
                      <Badge ok={!m.retard} label={m.retard ? '⚠ Retard' : '✅ OK'} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2.5">
                        <p className="text-gray-400 mb-0.5">Réception projet</p>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">{formatDate(m.dateReceptionProjet)}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2.5">
                        <p className="text-gray-400 mb-0.5">1ère assignation</p>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">{formatDate(m.datePremiereAssignation)}</p>
                      </div>
                      <div className={`rounded-lg p-2.5 ${m.retard ? 'bg-red-50 dark:bg-red-500/10' : 'bg-gray-50 dark:bg-gray-800'}`}>
                        <p className="text-gray-400 mb-0.5">Temps inactif</p>
                        <p className={`font-bold ${m.retard ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {formatMinutes(m.tempsInactifMinutes)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2.5">
                        <p className="text-gray-400 mb-0.5">Non assignées</p>
                        <p className={`font-bold ${m.tachesNonAssignees > 0 ? 'text-brand- dark:text-brand-' : 'text-gray-700 dark:text-gray-300'}`}>
                          {m.tachesNonAssignees} tâche{m.tachesNonAssignees > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {m.commentaire && (
                      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                        {m.commentaire}
                      </p>
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
            color="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10"
          >
            {rapport.phaseExecution.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucune tâche avec données d'exécution.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Membre</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Tâche</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Délai démarrage</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Durée exécution</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Statut final</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Retard</th>
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
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md ${isAnomaly ? 'bg-gradient-to-br from-amber-400 to-brand- shadow-amber-500/20' : 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-cyan-500/20'}`}>
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
                            'bg-brand- text-brand- dark:bg-brand-/20 dark:text-brand-'
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
              <div className="px-5 py-4 bg-brand- dark:bg-brand-/10 border-t border-brand- dark:border-brand-">
                <p className="text-sm font-semibold text-brand- dark:text-brand- mb-2">
                  💡 Recommandations
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-brand- dark:text-brand-">
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
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
          <HiOutlineChartBar size={48} className="mb-4 opacity-40" />
          <p className="text-lg font-medium">Sélectionnez un projet</p>
          <p className="text-sm mt-1">Choisissez un projet dans la liste ci-dessus pour générer son rapport</p>
        </div>
      )}
    </div>
  );
};

export default RapportProjetPage;
