import React, { useEffect, useState, useRef } from 'react';
import { agentService } from '../api/agentDashboardService';
import { DashboardEmployeStatus } from '../types';
import Badge from '../components/ui/Badge';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const formatTime = (time: string | null | undefined): string => {
  if (!time) return '--:--';
  // time peut être "09:12:17.066" ou "09:12:17" — on garde HH:mm:ss
  return time.substring(0, 8);
};

const SuiviTempsReelPage: React.FC = () => {
  const [statuses, setStatuses] = useState<DashboardEmployeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadStatuses();
    // Polling toutes les 10 secondes
    intervalRef.current = setInterval(loadStatuses, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const loadStatuses = async () => {
    try {
      const res = await agentService.getDashboard();
      setStatuses(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStatuses = statuses.filter((s) => {
    const matchSearch = `${s.nom} ${s.prenom} ${s.poste || ''} ${s.departement || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchStatut = filterStatut === 'all' || s.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const getStatutBadge = (statut: string, agentActif: boolean) => {
    if (statut === 'PRESENT') return <Badge variant="success">Présent</Badge>;
    if (statut === 'RETARD') return <Badge variant="warning">Retard</Badge>;
    if (statut === 'ABSENT') return <Badge variant="danger">Absent</Badge>;
    if (statut === 'INCOMPLET') return <Badge variant="neutral">Incomplet</Badge>;
    return <Badge variant="neutral">{statut}</Badge>;
  };

  const getAgentIndicator = (agentActif: boolean) => (
    <span className={`inline-block w-3 h-3 rounded-full ${agentActif ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
      title={agentActif ? 'Agent actif' : 'Agent inactif'}
    />
  );

  const stats = {
    presents: statuses.filter(s => s.statut === 'PRESENT').length,
    retards: statuses.filter(s => s.statut === 'RETARD').length,
    absents: statuses.filter(s => s.statut === 'ABSENT').length,
    agentsActifs: statuses.filter(s => s.agentActif).length,
    surReseau: statuses.filter(s => s.surReseauEntreprise).length,
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Suivi Temps Réel</h1>
          <p className="text-sm text-gray-500 mt-1">Mise à jour automatique toutes les 10 secondes</p>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">Présents</p>
          <p className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.presents}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-orange-600 dark:text-orange-400">En retard</p>
          <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{stats.retards}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">Absents</p>
          <p className="text-3xl font-bold text-red-700 dark:text-red-300">{stats.absents}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">Agents actifs</p>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.agentsActifs}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-600 dark:text-purple-400">Sur réseau entreprise</p>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.surReseau}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Rechercher un employé..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="all">Tous les statuts</option>
          <option value="PRESENT">Présent</option>
          <option value="RETARD">En retard</option>
          <option value="ABSENT">Absent</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStatuses.map((emp) => (
            <div
              key={emp.employeId}
              className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {emp.imageUrl ? (
                    <img src={`${API_BASE}${emp.imageUrl}`} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-sm">
                      {emp.nom?.charAt(0)}{emp.prenom?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{emp.nom} {emp.prenom}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{emp.poste || 'N/A'} - {emp.departement || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getAgentIndicator(emp.agentActif)}
                  {getStatutBadge(emp.statut, emp.agentActif)}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Entrée</p>
                  <p className="text-sm font-medium dark:text-gray-200">{formatTime(emp.heureEntree)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Retard</p>
                  <p className={`text-sm font-medium ${emp.retardMinutes > 0 ? 'text-orange-600' : 'dark:text-gray-200'}`}>
                    {emp.retardMinutes || 0} min
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
                  <p className={`text-sm font-medium ${
                    (emp.scoreJournalier ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {emp.scoreJournalier?.toFixed(1) || '0.0'}
                  </p>
                </div>
              </div>
              {/* 2ème ligne : WiFi, Réseau, Temps actif */}
              <div className="mt-2 grid grid-cols-3 gap-2 text-center border-t border-gray-100 dark:border-gray-700 pt-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">WiFi</p>
                  <p className="text-xs font-medium dark:text-gray-200 truncate" title={emp.ssidConnecte || ''}>
                    {emp.ssidConnecte || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Réseau</p>
                  <p className={`text-xs font-medium ${emp.surReseauEntreprise ? 'text-green-600' : 'text-red-500'}`}>
                    {emp.surReseauEntreprise ? '✅ Entreprise' : '❌ Externe'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Actif/Inactif</p>
                  <p className="text-xs font-medium dark:text-gray-200">
                    {emp.tempsActifMinutes || 0}m / {emp.tempsInactifMinutes || 0}m
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuiviTempsReelPage;
