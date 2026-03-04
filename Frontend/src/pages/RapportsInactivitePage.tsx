import React, { useEffect, useState, useMemo } from 'react';
import { rapportInactiviteService } from '../api/rapportInactiviteService';
import { RapportInactivite } from '../types';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import {
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlineRefresh,
  HiOutlineDocumentReport,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationCircle,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from 'react-icons/hi';

type FilterType = 'all' | 'en_attente' | 'deduit' | 'annule';
type SortField = 'employe' | 'semaineDebut' | 'totalInactiviteMinutes' | 'inactiviteExcedentaire' | 'montantDeduction' | 'decision';
type SortDir = 'asc' | 'desc';

const RapportsInactivitePage: React.FC = () => {
  const { user } = useAuth();
  const [rapports, setRapports] = useState<RapportInactivite[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('en_attente');
  const [generating, setGenerating] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [selectedRapport, setSelectedRapport] = useState<RapportInactivite | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [sortField, setSortField] = useState<SortField>('semaineDebut');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Génération par période
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [periodeDebut, setPeriodeDebut] = useState('');
  const [periodeFin, setPeriodeFin] = useState('');
  const [generatingPeriode, setGeneratingPeriode] = useState(false);

  useEffect(() => {
    loadRapports();
  }, []);

  const showAlertMsg = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const loadRapports = async () => {
    try {
      setLoading(true);
      const res = await rapportInactiviteService.getAll();
      setRapports(res.data.data || []);
    } catch (err) {
      console.error(err);
      showAlertMsg('error', 'Erreur lors du chargement des rapports.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerer = async () => {
    try {
      setGenerating(true);
      const res = await rapportInactiviteService.generer();
      const count = res.data.data?.length || 0;
      await loadRapports();
      showAlertMsg('success', count > 0 ? `${count} rapport(s) généré(s) pour la semaine courante.` : 'Aucun nouveau rapport à générer (déjà existants ou pas de données).');
    } catch (err: any) {
      console.error(err);
      showAlertMsg('error', err.response?.data?.message || 'Erreur lors de la génération des rapports.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenererPeriode = async () => {
    if (!periodeDebut || !periodeFin) {
      showAlertMsg('error', 'Veuillez saisir les dates de début et de fin.');
      return;
    }
    if (periodeDebut > periodeFin) {
      showAlertMsg('error', 'La date de début doit être antérieure à la date de fin.');
      return;
    }
    try {
      setGeneratingPeriode(true);
      const res = await rapportInactiviteService.genererPeriode(periodeDebut, periodeFin);
      const count = res.data.data?.length || 0;
      await loadRapports();
      setShowPeriodModal(false);
      setPeriodeDebut('');
      setPeriodeFin('');
      showAlertMsg('success', count > 0 ? `${count} rapport(s) généré(s) pour la période ${periodeDebut} → ${periodeFin}.` : 'Aucun nouveau rapport à générer pour cette période.');
    } catch (err: any) {
      console.error(err);
      showAlertMsg('error', err.response?.data?.message || 'Erreur lors de la génération par période.');
    } finally {
      setGeneratingPeriode(false);
    }
  };

  const handleDecider = async (rapportId: number, decision: 'DEDUIT' | 'ANNULE') => {
    if (!user?.employeId) return;
    try {
      setDeciding(true);
      await rapportInactiviteService.decider(rapportId, user.employeId, decision, commentaire);
      setCommentaire('');
      setSelectedRapport(null);
      await loadRapports();
      showAlertMsg('success', decision === 'DEDUIT' ? 'Déduction confirmée avec succès.' : 'Déduction annulée avec succès.');
    } catch (err: any) {
      console.error(err);
      showAlertMsg('error', err.response?.data?.message || 'Erreur lors de la prise de décision.');
    } finally {
      setDeciding(false);
    }
  };

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(montant);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}`;
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'DEDUIT': return <Badge variant="danger">Déduit</Badge>;
      case 'ANNULE': return <Badge variant="neutral">Annulé</Badge>;
      default: return <Badge variant="warning">En attente</Badge>;
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = rapports.length;
    const enAttente = rapports.filter(r => r.decision === 'EN_ATTENTE').length;
    const deduit = rapports.filter(r => r.decision === 'DEDUIT').length;
    const annule = rapports.filter(r => r.decision === 'ANNULE').length;
    const totalDeduction = rapports
      .filter(r => r.decision === 'DEDUIT')
      .reduce((sum, r) => sum + r.montantDeduction, 0);
    return { total, enAttente, deduit, annule, totalDeduction };
  }, [rapports]);

  // Filter + search + sort
  const filteredRapports = useMemo(() => {
    let data = [...rapports];

    // Filter by decision
    if (filter === 'en_attente') data = data.filter(r => r.decision === 'EN_ATTENTE');
    else if (filter === 'deduit') data = data.filter(r => r.decision === 'DEDUIT');
    else if (filter === 'annule') data = data.filter(r => r.decision === 'ANNULE');

    // Search by name/matricule
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      data = data.filter(r =>
        r.employeNom.toLowerCase().includes(term) ||
        r.employePrenom.toLowerCase().includes(term) ||
        r.employeMatricule.toLowerCase().includes(term)
      );
    }

    // Sort
    data.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'employe':
          cmp = `${a.employeNom} ${a.employePrenom}`.localeCompare(`${b.employeNom} ${b.employePrenom}`);
          break;
        case 'semaineDebut':
          cmp = a.semaineDebut.localeCompare(b.semaineDebut);
          break;
        case 'totalInactiviteMinutes':
          cmp = a.totalInactiviteMinutes - b.totalInactiviteMinutes;
          break;
        case 'inactiviteExcedentaire':
          cmp = a.inactiviteExcedentaire - b.inactiviteExcedentaire;
          break;
        case 'montantDeduction':
          cmp = a.montantDeduction - b.montantDeduction;
          break;
        case 'decision':
          cmp = a.decision.localeCompare(b.decision);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return data;
  }, [rapports, filter, searchTerm, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return <HiOutlineChevronDown size={14} className="opacity-30 ml-1 inline" />;
    return sortDir === 'asc'
      ? <HiOutlineChevronUp size={14} className="ml-1 inline text-blue-500" />
      : <HiOutlineChevronDown size={14} className="ml-1 inline text-blue-500" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Alert */}
      {alert && (
        <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium shadow-sm transition-all ${
          alert.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
            : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
        }`}>
          {alert.type === 'success' ? <HiOutlineCheckCircle size={20} /> : <HiOutlineExclamationCircle size={20} />}
          <span className="flex-1">{alert.message}</span>
          <button onClick={() => setAlert(null)} className="text-current opacity-50 hover:opacity-100">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Rapports d'Inactivité</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Suivi et gestion des rapports d'inactivité hebdomadaires
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowPeriodModal(true)}>
            <HiOutlineCalendar size={16} />
            Générer par période
          </Button>
          <Button size="sm" onClick={handleGenerer} disabled={generating}>
            <HiOutlineRefresh size={16} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Génération...' : 'Générer semaine courante'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <HiOutlineDocumentReport size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total rapports</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30">
              <HiOutlineClock size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.enAttente}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">En attente</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/30">
              <HiOutlineXCircle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.deduit}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Déduits — {formatMontant(stats.totalDeduction)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30">
              <HiOutlineCheckCircle size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.annule}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Annulés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <HiOutlineSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom ou matricule..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {([
            { key: 'all' as FilterType, label: 'Tous' },
            { key: 'en_attente' as FilterType, label: 'En attente' },
            { key: 'deduit' as FilterType, label: 'Déduits' },
            { key: 'annule' as FilterType, label: 'Annulés' },
          ]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                filter === f.key
                  ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {f.label}
              {f.key === 'en_attente' && stats.enAttente > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold dark:bg-amber-800 dark:text-amber-200">
                  {stats.enAttente}
                </span>
              )}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {filteredRapports.length} résultat{filteredRapports.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-gray-500 dark:text-gray-400">Chargement des rapports...</p>
        </div>
      ) : filteredRapports.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <HiOutlineDocumentReport size={48} className="mx-auto text-gray-300 dark:text-gray-600" />
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg">
            Aucun rapport d'inactivité {filter !== 'all' ? `(${filter === 'en_attente' ? 'en attente' : filter === 'deduit' ? 'déduit' : 'annulé'})` : ''}
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Cliquez sur « Générer semaine courante » pour créer les rapports.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('employe')}>
                    Employé <SortIcon field="employe" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('semaineDebut')}>
                    Période <SortIcon field="semaineDebut" />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('totalInactiviteMinutes')}>
                    Inactivité <SortIcon field="totalInactiviteMinutes" />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tolérance
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('inactiviteExcedentaire')}>
                    Excédent. <SortIcon field="inactiviteExcedentaire" />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('montantDeduction')}>
                    Déduction <SortIcon field="montantDeduction" />
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => handleSort('decision')}>
                    Décision <SortIcon field="decision" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date génér.
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredRapports.map((rapport) => (
                  <tr key={rapport.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {rapport.employeNom} {rapport.employePrenom}
                        </span>
                        <span className="block text-xs text-gray-400 dark:text-gray-500">{rapport.employeMatricule}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(rapport.semaineDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        {' → '}
                        {new Date(rapport.semaineFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${rapport.totalInactiviteMinutes > rapport.toleranceMinutes ? 'text-red-600' : 'text-orange-500'}`}>
                        {formatMinutes(rapport.totalInactiviteMinutes)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{formatMinutes(rapport.toleranceMinutes)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-semibold ${rapport.inactiviteExcedentaire > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {rapport.inactiviteExcedentaire > 0 ? `+${formatMinutes(rapport.inactiviteExcedentaire)}` : '0'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-semibold ${rapport.montantDeduction > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {rapport.montantDeduction > 0 ? formatMontant(rapport.montantDeduction) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getDecisionBadge(rapport.decision)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(rapport.dateGeneration)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rapport.decision === 'EN_ATTENTE' ? (
                        <button
                          onClick={() => setSelectedRapport(rapport)}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition"
                        >
                          Décider
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {rapport.decideParNom || '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {selectedRapport && (
        <Modal isOpen={true} onClose={() => { setSelectedRapport(null); setCommentaire(''); }} title="Décision — Rapport d'Inactivité" size="lg">
          <div className="space-y-5">
            {/* Employee info */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employé</p>
                  <p className="mt-1 font-semibold text-gray-800 dark:text-white">{selectedRapport.employeNom} {selectedRapport.employePrenom}</p>
                  <p className="text-xs text-gray-400">{selectedRapport.employeMatricule}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Période</p>
                  <p className="mt-1 font-semibold text-gray-800 dark:text-white">
                    {new Date(selectedRapport.semaineDebut).toLocaleDateString('fr-FR')} → {new Date(selectedRapport.semaineFin).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <p className="text-lg font-bold text-orange-600">{formatMinutes(selectedRapport.totalInactiviteMinutes)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Inactivité totale</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <p className="text-lg font-bold text-blue-600">{formatMinutes(selectedRapport.toleranceMinutes)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tolérance</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                <p className="text-lg font-bold text-red-600">{formatMinutes(selectedRapport.inactiviteExcedentaire)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Excédentaire</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                <p className="text-lg font-bold text-red-600">{formatMontant(selectedRapport.montantDeduction)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Montant déduction</p>
              </div>
            </div>

            {/* Progress bar visual */}
            {selectedRapport.totalInactiviteMinutes > 0 && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Tolérance: {formatMinutes(selectedRapport.toleranceMinutes)}</span>
                  <span>Total: {formatMinutes(selectedRapport.totalInactiviteMinutes)}</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      selectedRapport.inactiviteExcedentaire > 0 ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (selectedRapport.totalInactiviteMinutes / Math.max(selectedRapport.toleranceMinutes, selectedRapport.totalInactiviteMinutes)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            )}

            {/* Commentaire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Commentaire <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                rows={3}
                placeholder="Motif de la décision..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSelectedRapport(null); setCommentaire(''); }}
                disabled={deciding}
              >
                Fermer
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDecider(selectedRapport.id, 'ANNULE')}
                disabled={deciding}
              >
                <HiOutlineCheckCircle size={16} />
                {deciding ? 'Traitement...' : 'Annuler la déduction'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDecider(selectedRapport.id, 'DEDUIT')}
                disabled={deciding}
              >
                <HiOutlineXCircle size={16} />
                {deciding ? 'Traitement...' : 'Confirmer la déduction'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Period Generation Modal */}
      <Modal isOpen={showPeriodModal} onClose={() => { setShowPeriodModal(false); setPeriodeDebut(''); setPeriodeFin(''); }} title="Générer rapports par période">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sélectionnez une période pour générer les rapports d'inactivité. Les rapports déjà existants pour cette période seront ignorés.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date début</label>
              <input
                type="date"
                value={periodeDebut}
                onChange={(e) => setPeriodeDebut(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date fin</label>
              <input
                type="date"
                value={periodeFin}
                onChange={(e) => setPeriodeFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" size="sm" onClick={() => { setShowPeriodModal(false); setPeriodeDebut(''); setPeriodeFin(''); }}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleGenererPeriode} disabled={generatingPeriode || !periodeDebut || !periodeFin}>
              <HiOutlineCalendar size={16} />
              {generatingPeriode ? 'Génération...' : 'Générer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RapportsInactivitePage;
