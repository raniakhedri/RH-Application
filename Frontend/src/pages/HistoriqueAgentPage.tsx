import React, { useEffect, useState } from 'react';
import {
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineBriefcase,
  HiOutlineDesktopComputer,
  HiOutlineViewList,
  HiOutlineViewBoards,
  HiOutlineBan,
  HiOutlineEyeOff,
} from 'react-icons/hi';
import { agentHistoriqueService } from '../api/agentHistoriqueService';
import { employeService } from '../api/employeService';
import { Employe, HistoriqueEmploye, JourDetail } from '../types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { API_BASE } from '../api/axios';

const formatTime = (time: string | null | undefined): string => {
  if (!time) return '--:--';
  return time.substring(0, 8);
};

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case 'PRESENT': return <Badge variant="success">Présent</Badge>;
    case 'RETARD': return <Badge variant="warning">Retard</Badge>;
    case 'ABSENT': return <Badge variant="danger">Absent</Badge>;
    case 'EN_CONGE': return <Badge variant="info">En congé</Badge>;
    case 'EN_AUTORISATION': return <Badge variant="info">Autorisation</Badge>;
    case 'TELETRAVAIL': return <Badge variant="success">Télétravail</Badge>;
    case 'JOUR_FERIE': return <Badge variant="neutral">Jour férié</Badge>;
    default: return <Badge variant="neutral">{statut}</Badge>;
  }
};

const getStatutColor = (statut: string): string => {
  switch (statut) {
    case 'PRESENT': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    case 'RETARD': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    case 'ABSENT': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    case 'EN_CONGE': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    case 'EN_AUTORISATION': return 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800';
    case 'TELETRAVAIL': return 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800';
    case 'JOUR_FERIE': return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
    default: return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  }
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
};

const HistoriqueAgentPage: React.FC = () => {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [selectedEmployeId, setSelectedEmployeId] = useState<number | null>(null);
  const [historique, setHistorique] = useState<HistoriqueEmploye | null>(null);
  const [loading, setLoading] = useState(false);
  const [debut, setDebut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [fin, setFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');

  useEffect(() => {
    employeService.getAll().then(res => {
      setEmployes(res.data.data || []);
    });
  }, []);

  const loadHistorique = async () => {
    if (!selectedEmployeId) return;
    setLoading(true);
    try {
      const res = await agentHistoriqueService.getHistorique(selectedEmployeId, debut, fin);
      setHistorique(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEmployeId) loadHistorique();
  }, [selectedEmployeId, debut, fin]);

  const stats = historique ? {
    totalJours: historique.jours.length,
    presents: historique.jours.filter(j => j.statut === 'PRESENT').length,
    retards: historique.jours.filter(j => j.statut === 'RETARD').length,
    absents: historique.jours.filter(j => j.statut === 'ABSENT').length,
    conges: historique.jours.filter(j => j.statut === 'EN_CONGE').length,
    teletravail: historique.jours.filter(j => j.statut === 'TELETRAVAIL').length,
    feries: historique.jours.filter(j => j.statut === 'JOUR_FERIE').length,
    totalRetardMin: historique.jours.reduce((s, j) => s + (j.retardMinutes || 0), 0),
    totalActifMin: historique.jours.reduce((s, j) => s + (j.tempsActifMinutes || 0), 0),
    totalInactifMin: historique.jours.reduce((s, j) => s + (j.tempsInactifMinutes || 0), 0),
  } : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Historique Agent</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Consultez l'historique détaillé de présence et d'activité de chaque employé</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <HiOutlineViewList size={16} />
            Tableau
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('timeline')}
          >
            <HiOutlineViewBoards size={16} />
            Timeline
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <HiOutlineUser size={15} className="text-gray-400" />
              Employé
            </label>
            <select
              value={selectedEmployeId || ''}
              onChange={(e) => setSelectedEmployeId(e.target.value ? Number(e.target.value) : null)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="">-- Sélectionner un employé --</option>
              {employes.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nom} {emp.prenom} - {emp.poste || 'N/A'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <HiOutlineCalendar size={15} className="text-gray-400" />
              Du
            </label>
            <input
              type="date"
              value={debut}
              onChange={(e) => setDebut(e.target.value)}
              className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <HiOutlineCalendar size={15} className="text-gray-400" />
              Au
            </label>
            <input
              type="date"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!selectedEmployeId && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mx-auto mb-4">
            <HiOutlineSearch size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Sélectionnez un employé pour voir son historique</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Utilisez le filtre ci-dessus pour choisir un employé</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-500 dark:text-gray-400">Chargement de l'historique...</p>
        </div>
      )}

      {historique && !loading && (
        <>
          {/* Employee Info Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
            {historique.imageUrl ? (
              <img src={`${API_BASE}${historique.imageUrl}`} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-lg ring-2 ring-brand-200 dark:ring-brand-800">
                {historique.nom?.charAt(0)}{historique.prenom?.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">{historique.nom} {historique.prenom}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <HiOutlineBriefcase size={14} />
                {historique.poste || 'N/A'} — {historique.departement || 'N/A'}
              </p>
            </div>
            {stats && (
              <div className="hidden md:flex items-center gap-3 text-sm">
                <span className="text-gray-500 dark:text-gray-400">{stats.totalJours} jours</span>
              </div>
            )}
          </div>

          {/* Stats summary cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard icon={<HiOutlineBan size={20} />} label="Total absences" value={`${stats.absents} jour${stats.absents > 1 ? 's' : ''}`} bgColor="bg-red-50 dark:bg-red-900/20" iconColor="text-red-500" borderColor="border-red-200 dark:border-red-800" valueColor="text-red-700 dark:text-red-300" />
              <StatCard icon={<HiOutlineClock size={20} />} label="Total retard" value={`${stats.totalRetardMin} min`} bgColor="bg-orange-50 dark:bg-orange-900/20" iconColor="text-orange-500" borderColor="border-orange-200 dark:border-orange-800" valueColor="text-orange-700 dark:text-orange-300" />
              <StatCard icon={<HiOutlineEyeOff size={20} />} label="Total inactif" value={`${stats.totalInactifMin} min`} bgColor="bg-purple-50 dark:bg-purple-900/20" iconColor="text-purple-500" borderColor="border-purple-200 dark:border-purple-800" valueColor="text-purple-700 dark:text-purple-300" />
            </div>
          )}

          {/* Table view */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Entrée</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sortie</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Retard</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actif</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Inactif</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">WiFi</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Réseau</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {historique.jours.map((jour, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{formatDate(jour.date)}</td>
                        <td className="px-4 py-3.5">{getStatutBadge(jour.statut)}</td>
                        <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300">{formatTime(jour.heureEntree)}</td>
                        <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300">{formatTime(jour.heureSortie)}</td>
                        <td className="px-4 py-3.5">
                          <span className={jour.retardMinutes > 0 ? 'text-orange-600 font-semibold' : 'text-gray-400'}>
                            {jour.retardMinutes > 0 ? `${jour.retardMinutes} min` : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-green-600 dark:text-green-400">{jour.tempsActifMinutes > 0 ? `${jour.tempsActifMinutes} min` : '-'}</td>
                        <td className="px-4 py-3.5 text-red-500">{jour.tempsInactifMinutes > 0 ? `${jour.tempsInactifMinutes} min` : '-'}</td>
                        <td className="px-4 py-3.5 text-gray-600 dark:text-gray-400 text-xs truncate max-w-[120px]" title={jour.ssid || ''}>{jour.ssid || '-'}</td>
                        <td className="px-4 py-3.5">
                          {jour.surReseauEntreprise ? (
                            <HiOutlineCheckCircle size={18} className="text-green-500" />
                          ) : jour.heureEntree ? (
                            <HiOutlineXCircle size={18} className="text-red-500" />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Timeline view */}
          {viewMode === 'timeline' && (
            <div className="space-y-3">
              {historique.jours.map((jour, idx) => (
                <TimelineCard key={idx} jour={jour} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number | string;
  bgColor: string;
  iconColor: string;
  borderColor: string;
  valueColor: string;
}> = ({ icon, label, value, bgColor, iconColor, borderColor, valueColor }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${borderColor} p-4`}>
    <div className="flex items-center gap-3">
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${bgColor}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  </div>
);

const TimelineCard: React.FC<{ jour: JourDetail }> = ({ jour }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border ${getStatutColor(jour.statut)} transition hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <HiOutlineCalendar size={16} className="text-gray-400" />
            <span className="text-sm font-bold text-gray-800 dark:text-white">{formatDate(jour.date)}</span>
          </div>
          {getStatutBadge(jour.statut)}
          {jour.teletravail && <Badge variant="info">🏠 Télétravail</Badge>}
        </div>
        {jour.retardMinutes > 0 && (
          <div className="flex items-center gap-1.5 text-sm font-semibold text-orange-600">
            <HiOutlineClock size={16} />
            {jour.retardMinutes} min retard
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2.5">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Entrée</span>
          <p className="font-medium text-gray-800 dark:text-gray-200">{formatTime(jour.heureEntree)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2.5">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Sortie</span>
          <p className="font-medium text-gray-800 dark:text-gray-200">{formatTime(jour.heureSortie)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2.5">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Temps actif</span>
          <p className="font-medium text-green-600 dark:text-green-400">{jour.tempsActifMinutes > 0 ? `${jour.tempsActifMinutes} min` : '-'}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2.5">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Temps inactif</span>
          <p className="font-medium text-red-500">{jour.tempsInactifMinutes > 0 ? `${jour.tempsInactifMinutes} min` : '-'}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2.5">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">WiFi / Réseau</span>
          <p className="font-medium text-gray-700 dark:text-gray-300 text-xs flex items-center gap-1">
            {jour.ssid || 'N/A'}
            {jour.surReseauEntreprise ? (
              <HiOutlineCheckCircle size={14} className="text-green-500" />
            ) : (
              <HiOutlineXCircle size={14} className="text-red-500" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HistoriqueAgentPage;
