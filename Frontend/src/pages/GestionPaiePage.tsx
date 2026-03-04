import React, { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineCurrencyDollar,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineCalendar,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineEye,
  HiOutlineX,
} from 'react-icons/hi';
import { rapportInactiviteService } from '../api/rapportInactiviteService';
import { RapportInactivite } from '../types';
import { useAuth } from '../context/AuthContext';

type SortKey = 'employe' | 'semaine' | 'salaireBase' | 'retard' | 'inactivite' | 'salaireNet' | 'decision';
type SortDir = 'asc' | 'desc';
type TabFilter = 'tous' | 'en_attente' | 'deduit' | 'annule';

const GestionPaiePage: React.FC = () => {
  const { user } = useAuth();
  const [rapports, setRapports] = useState<RapportInactivite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabFilter>('tous');
  const [selectedWeek, setSelectedWeek] = useState<string>('');  // 'debut|fin' format
  const [sortKey, setSortKey] = useState<SortKey>('semaine');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [generating, setGenerating] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [periodDebut, setPeriodDebut] = useState('');
  const [periodFin, setPeriodFin] = useState('');
  const [selectedRapport, setSelectedRapport] = useState<RapportInactivite | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionCommentaire, setDecisionCommentaire] = useState('');
  const [decidingId, setDecidingId] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rapportInactiviteService.getAll();
      setRapports(res.data.data || []);
    } catch {
      setAlert({ type: 'error', message: 'Erreur lors du chargement des données' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  // === Extract unique weeks & auto-select latest ===
  const weeks = Array.from(
    new Set(rapports.map((r) => `${r.semaineDebut}|${r.semaineFin}`))
  ).sort((a, b) => b.localeCompare(a)); // newest first

  useEffect(() => {
    if (weeks.length > 0 && (!selectedWeek || !weeks.includes(selectedWeek))) {
      setSelectedWeek(weeks[0]);
    }
  }, [weeks.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // === Filtering: week first, then tab, then search ===
  const weekFiltered = rapports.filter((r) => {
    if (!selectedWeek) return true;
    const [d, f] = selectedWeek.split('|');
    return r.semaineDebut === d && r.semaineFin === f;
  });

  // Stats are computed on the selected week only
  const stats = {
    total: weekFiltered.length,
    enAttente: weekFiltered.filter((r) => r.decision === 'EN_ATTENTE').length,
    deduit: weekFiltered.filter((r) => r.decision === 'DEDUIT').length,
    annule: weekFiltered.filter((r) => r.decision === 'ANNULE').length,
    totalDeductions: weekFiltered
      .filter((r) => r.decision === 'DEDUIT')
      .reduce((sum, r) => sum + (r.montantDeductionInactivite || 0) + (r.montantRetard || 0), 0),
  };

  const filtered = weekFiltered
    .filter((r) => {
      if (tab === 'en_attente') return r.decision === 'EN_ATTENTE';
      if (tab === 'deduit') return r.decision === 'DEDUIT';
      if (tab === 'annule') return r.decision === 'ANNULE';
      return true;
    })
    .filter((r) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        r.employeNom?.toLowerCase().includes(s) ||
        r.employePrenom?.toLowerCase().includes(s) ||
        r.employeMatricule?.toLowerCase().includes(s)
      );
    });

  // === Sorting ===
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'employe':
        cmp = `${a.employeNom} ${a.employePrenom}`.localeCompare(`${b.employeNom} ${b.employePrenom}`);
        break;
      case 'semaine':
        cmp = (a.semaineDebut || '').localeCompare(b.semaineDebut || '');
        break;
      case 'salaireBase':
        cmp = (a.salaireBase || 0) - (b.salaireBase || 0);
        break;
      case 'retard':
        cmp = (a.totalRetardMinutes || 0) - (b.totalRetardMinutes || 0);
        break;
      case 'inactivite':
        cmp = (a.totalInactiviteMinutes || 0) - (b.totalInactiviteMinutes || 0);
        break;
      case 'salaireNet':
        cmp = (a.salaireNet || 0) - (b.salaireNet || 0);
        break;
      case 'decision':
        cmp = (a.decision || '').localeCompare(b.decision || '');
        break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon: React.FC<{ col: SortKey }> = ({ col }) =>
    sortKey === col ? (
      sortDir === 'asc' ? (
        <HiOutlineChevronUp className="inline w-3 h-3 ml-1" />
      ) : (
        <HiOutlineChevronDown className="inline w-3 h-3 ml-1" />
      )
    ) : null;

  // === Actions ===
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await rapportInactiviteService.generer();
      setAlert({ type: 'success', message: 'Rapports de la semaine générés avec succès' });
      await fetchData();
    } catch {
      setAlert({ type: 'error', message: 'Erreur lors de la génération' });
    } finally {
      setGenerating(false);
    }
  };

  const handleGeneratePeriod = async () => {
    if (!periodDebut || !periodFin) return;
    setGenerating(true);
    try {
      await rapportInactiviteService.genererPeriode(periodDebut, periodFin);
      setAlert({ type: 'success', message: `Rapports générés pour la période ${periodDebut} → ${periodFin}` });
      setShowPeriodModal(false);
      setPeriodDebut('');
      setPeriodFin('');
      await fetchData();
    } catch {
      setAlert({ type: 'error', message: 'Erreur lors de la génération par période' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDecision = async (decision: 'DEDUIT' | 'ANNULE') => {
    if (!decidingId) return;
    try {
      await rapportInactiviteService.decider(decidingId, user?.employeId || 0, decision, decisionCommentaire);
      setAlert({
        type: 'success',
        message: decision === 'DEDUIT' ? 'Déduction appliquée avec succès' : 'Déduction annulée',
      });
      setShowDecisionModal(false);
      setDecisionCommentaire('');
      setDecidingId(null);
      await fetchData();
    } catch {
      setAlert({ type: 'error', message: 'Erreur lors de la décision' });
    }
  };

  const openDecisionModal = (r: RapportInactivite) => {
    setDecidingId(r.id);
    setSelectedRapport(r);
    setDecisionCommentaire('');
    setShowDecisionModal(true);
  };

  const openDetailModal = (r: RapportInactivite) => {
    setSelectedRapport(r);
    setShowDetailModal(true);
  };

  // === Decision badge ===
  const decisionBadge = (d: string) => {
    switch (d) {
      case 'EN_ATTENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <HiOutlineClock className="w-3 h-3" /> En attente
          </span>
        );
      case 'DEDUIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <HiOutlineCheckCircle className="w-3 h-3" /> Déduit
          </span>
        );
      case 'ANNULE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <HiOutlineXCircle className="w-3 h-3" /> Annulé
          </span>
        );
      default:
        return d;
    }
  };

  const formatTND = (v: number | null | undefined) => `${(v || 0).toFixed(2)} TND`;
  const formatDate = (d: string | null) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return d;
    }
  };
  const formatWeek = (debut: string, fin: string) => {
    try {
      const d = new Date(debut);
      const f = new Date(fin);
      return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} → ${f.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    } catch {
      return `${debut} → ${fin}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert */}
      {alert && (
        <div
          className={`p-4 rounded-xl border ${
            alert.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
          }`}
        >
          {alert.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion de Paie</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vue unifiée hebdomadaire — Inactivité, retard et salaire net
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Week selector */}
          <div className="relative">
            <HiOutlineCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 appearance-none cursor-pointer focus:ring-2 focus:ring-brand-500"
            >
              {weeks.map((w) => {
                const [d, f] = w.split('|');
                return (
                  <option key={w} value={w}>
                    Semaine {formatWeek(d, f)}
                  </option>
                );
              })}
            </select>
          </div>
          <button
            onClick={() => setShowPeriodModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <HiOutlineCalendar className="w-4 h-4" />
            Générer par période
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Génération...' : 'Générer semaine'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <HiOutlineCurrencyDollar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total rapports</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <HiOutlineClock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.enAttente}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">En attente</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30">
              <HiOutlineExclamationCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.deduit}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Déduits</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/30">
              <HiOutlineCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">{formatTND(stats.totalDeductions)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total déductions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Tabs */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou matricule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div className="flex rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden">
            {([
              { key: 'tous' as TabFilter, label: 'Tous', count: stats.total },
              { key: 'en_attente' as TabFilter, label: 'En attente', count: stats.enAttente },
              { key: 'deduit' as TabFilter, label: 'Déduits', count: stats.deduit },
              { key: 'annule' as TabFilter, label: 'Annulés', count: stats.annule },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'bg-brand-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <HiOutlineCurrencyDollar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Aucun rapport trouvé</p>
              <p className="text-sm mt-1">Générez les rapports pour la semaine courante</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none" onClick={() => toggleSort('employe')}>
                    Employé <SortIcon col="employe" />
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none" onClick={() => toggleSort('salaireBase')}>
                    Salaire Base <SortIcon col="salaireBase" />
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none" onClick={() => toggleSort('retard')}>
                    Retard <SortIcon col="retard" />
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none" onClick={() => toggleSort('inactivite')}>
                    Inactivité <SortIcon col="inactivite" />
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">
                    Coût/min
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none" onClick={() => toggleSort('salaireNet')}>
                    Salaire Net <SortIcon col="salaireNet" />
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none" onClick={() => toggleSort('decision')}>
                    Décision <SortIcon col="decision" />
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => {
                  const totalPenalite = (r.montantDeductionInactivite || 0) + (r.montantRetard || 0);
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {r.employeNom} {r.employePrenom}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{r.employeMatricule}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                        {formatTND(r.salaireBase)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div>
                          <span className={`font-mono ${(r.totalRetardMinutes || 0) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {r.totalRetardMinutes || 0} min
                          </span>
                          {(r.montantRetard || 0) > 0 && (
                            <p className="text-xs text-orange-500">-{formatTND(r.montantRetard)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div>
                          <span className={`font-mono ${(r.totalInactiviteMinutes || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {r.totalInactiviteMinutes || 0} min
                          </span>
                          {(r.montantDeductionInactivite || 0) > 0 && (
                            <p className="text-xs text-red-500">-{formatTND(r.montantDeductionInactivite)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-gray-600 dark:text-gray-400">
                        {(r.coutParMinute || 0).toFixed(4)} TND
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono font-bold ${totalPenalite > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {formatTND(r.salaireNet)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{decisionBadge(r.decision)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openDetailModal(r)}
                            title="Détails"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                          </button>
                          {r.decision === 'EN_ATTENTE' && (
                            <button
                              onClick={() => openDecisionModal(r)}
                              title="Décider"
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 transition-colors"
                            >
                              Décider
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!loading && sorted.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            {sorted.length} rapport{sorted.length > 1 ? 's' : ''} affiché{sorted.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* === Period Modal === */}
      {showPeriodModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Générer par période</h3>
              <button onClick={() => setShowPeriodModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <HiOutlineX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date début (lundi)</label>
                <input
                  type="date"
                  value={periodDebut}
                  onChange={(e) => setPeriodDebut(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date fin (vendredi)</label>
                <input
                  type="date"
                  value={periodFin}
                  onChange={(e) => setPeriodFin(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowPeriodModal(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={handleGeneratePeriod}
                disabled={!periodDebut || !periodFin || generating}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50"
              >
                {generating ? 'Génération...' : 'Générer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Detail Modal === */}
      {showDetailModal && selectedRapport && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Détail — {selectedRapport.employeNom} {selectedRapport.employePrenom}
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <HiOutlineX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Matricule</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedRapport.employeMatricule}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Semaine</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatWeek(selectedRapport.semaineDebut, selectedRapport.semaineFin)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Salaire Base</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatTND(selectedRapport.salaireBase)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Coût / minute</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{(selectedRapport.coutParMinute || 0).toFixed(4)} TND</p>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="grid grid-cols-3 bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-2">
                  <span>Type</span>
                  <span className="text-right">Minutes</span>
                  <span className="text-right">Montant</span>
                </div>
                <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-t border-gray-100 dark:border-gray-800">
                  <span className="text-orange-600 dark:text-orange-400 font-medium">Retard</span>
                  <span className="text-right font-mono">{selectedRapport.totalRetardMinutes || 0}</span>
                  <span className="text-right font-mono text-orange-600 dark:text-orange-400">-{formatTND(selectedRapport.montantRetard)}</span>
                </div>
                <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-t border-gray-100 dark:border-gray-800">
                  <span className="text-red-600 dark:text-red-400 font-medium">Inactivité</span>
                  <span className="text-right font-mono">{selectedRapport.totalInactiviteMinutes || 0}</span>
                  <span className="text-right font-mono text-red-600 dark:text-red-400">-{formatTND(selectedRapport.montantDeductionInactivite)}</span>
                </div>
                <div className="grid grid-cols-3 px-4 py-2.5 text-sm border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                  <span className="text-gray-900 dark:text-white">Total déductions</span>
                  <span className="text-right font-mono">{(selectedRapport.totalRetardMinutes || 0) + (selectedRapport.totalInactiviteMinutes || 0)}</span>
                  <span className="text-right font-mono text-red-600 dark:text-red-400">
                    -{formatTND((selectedRapport.montantRetard || 0) + (selectedRapport.montantDeductionInactivite || 0))}
                  </span>
                </div>
              </div>

              <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-4 flex justify-between items-center">
                <span className="text-sm font-medium text-brand-700 dark:text-brand-300">Salaire Net Hebdomadaire</span>
                <span className="text-xl font-bold text-brand-700 dark:text-brand-300 font-mono">{formatTND(selectedRapport.salaireNet)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Décision</span>
                {decisionBadge(selectedRapport.decision)}
              </div>
              {selectedRapport.decideParNom && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Décidé par</span>
                  <span className="text-gray-900 dark:text-white">{selectedRapport.decideParNom}</span>
                </div>
              )}
              {selectedRapport.dateDecision && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Date décision</span>
                  <span className="text-gray-900 dark:text-white">{formatDate(selectedRapport.dateDecision)}</span>
                </div>
              )}
              {selectedRapport.commentaire && (
                <div className="text-sm">
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Commentaire</p>
                  <p className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-gray-700 dark:text-gray-300">{selectedRapport.commentaire}</p>
                </div>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500">Généré le {formatDate(selectedRapport.dateGeneration)}</p>
            </div>
            <div className="flex justify-end p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Decision Modal === */}
      {showDecisionModal && selectedRapport && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Décision</h3>
              <button onClick={() => setShowDecisionModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <HiOutlineX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Employé</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedRapport.employeNom} {selectedRapport.employePrenom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Semaine</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatWeek(selectedRapport.semaineDebut, selectedRapport.semaineFin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Inactivité</span>
                  <span className="font-mono text-red-600 dark:text-red-400">{selectedRapport.totalInactiviteMinutes} min → -{formatTND(selectedRapport.montantDeductionInactivite)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Retard</span>
                  <span className="font-mono text-orange-600 dark:text-orange-400">{selectedRapport.totalRetardMinutes} min → -{formatTND(selectedRapport.montantRetard)}</span>
                </div>
                {/* Progress bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Impact sur salaire</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {selectedRapport.salaireBase ? (((selectedRapport.montantDeductionInactivite || 0) + (selectedRapport.montantRetard || 0)) / selectedRapport.salaireBase * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, selectedRapport.salaireBase ? ((selectedRapport.montantDeductionInactivite || 0) + (selectedRapport.montantRetard || 0)) / selectedRapport.salaireBase * 100 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commentaire (optionnel)</label>
                <textarea
                  value={decisionCommentaire}
                  onChange={(e) => setDecisionCommentaire(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white resize-none"
                  placeholder="Justification de la décision..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowDecisionModal(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDecision('ANNULE')}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors"
              >
                Annuler la déduction
              </button>
              <button
                onClick={() => handleDecision('DEDUIT')}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Appliquer la déduction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionPaiePage;
