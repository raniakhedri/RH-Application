import React, { useEffect, useState } from 'react';
import { agentHistoriqueService } from '../api/agentHistoriqueService';
import { employeService } from '../api/employeService';
import { Employe, HistoriqueEmploye, JourDetail } from '../types';
import Badge from '../components/ui/Badge';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
    case 'PRESENT': return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
    case 'RETARD': return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700';
    case 'ABSENT': return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
    case 'EN_CONGE': return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700';
    case 'EN_AUTORISATION': return 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700';
    case 'TELETRAVAIL': return 'bg-teal-100 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700';
    case 'JOUR_FERIE': return 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600';
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

  // View mode: 'table' or 'timeline'
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

  // Stats summary
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Historique Agent</h1>
        <p className="text-sm text-gray-500 mt-1">Consultez l'historique détaillé de présence et d'activité de chaque employé</p>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employé</label>
            <select
              value={selectedEmployeId || ''}
              onChange={(e) => setSelectedEmployeId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">-- Sélectionner un employé --</option>
              {employes.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nom} {emp.prenom} - {emp.poste || 'N/A'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Du</label>
            <input
              type="date"
              value={debut}
              onChange={(e) => setDebut(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Au</label>
            <input
              type="date"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${viewMode === 'table' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
            >
              Tableau
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${viewMode === 'timeline' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
            >
              Timeline
            </button>
          </div>
        </div>
      </div>

      {!selectedEmployeId && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-lg">Sélectionnez un employé pour voir son historique</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      )}

      {historique && !loading && (
        <>
          {/* Employee Info Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6 border border-gray-200 dark:border-gray-700 flex items-center gap-4">
            {historique.imageUrl ? (
              <img src={`${API_BASE}${historique.imageUrl}`} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-lg">
                {historique.nom?.charAt(0)}{historique.prenom?.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{historique.nom} {historique.prenom}</h2>
              <p className="text-sm text-gray-500">{historique.poste || 'N/A'} — {historique.departement || 'N/A'}</p>
            </div>
          </div>

          {/* Stats summary cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
              <StatBox label="Présents" value={stats.presents} color="green" />
              <StatBox label="Retards" value={stats.retards} color="orange" />
              <StatBox label="Absents" value={stats.absents} color="red" />
              <StatBox label="Congés" value={stats.conges} color="blue" />
              <StatBox label="Télétravail" value={stats.teletravail} color="teal" />
              <StatBox label="Jours fériés" value={stats.feries} color="gray" />
              <StatBox label="Total retard" value={`${stats.totalRetardMin} min`} color="orange" />
            </div>
          )}

          {/* Table view */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Entrée</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sortie</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Retard</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actif</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Inactif</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">WiFi</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Réseau</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {historique.jours.map((jour, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{formatDate(jour.date)}</td>
                        <td className="px-4 py-3">{getStatutBadge(jour.statut)}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatTime(jour.heureEntree)}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatTime(jour.heureSortie)}</td>
                        <td className="px-4 py-3">
                          <span className={jour.retardMinutes > 0 ? 'text-orange-600 font-semibold' : 'text-gray-500'}>
                            {jour.retardMinutes > 0 ? `${jour.retardMinutes} min` : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-green-600 dark:text-green-400">{jour.tempsActifMinutes > 0 ? `${jour.tempsActifMinutes} min` : '-'}</td>
                        <td className="px-4 py-3 text-red-500">{jour.tempsInactifMinutes > 0 ? `${jour.tempsInactifMinutes} min` : '-'}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs truncate max-w-[120px]" title={jour.ssid || ''}>{jour.ssid || '-'}</td>
                        <td className="px-4 py-3">
                          {jour.surReseauEntreprise ? (
                            <span className="text-green-600">✅</span>
                          ) : jour.heureEntree ? (
                            <span className="text-red-500">❌</span>
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

const StatBox: React.FC<{ label: string; value: number | string; color: string }> = ({ label, value, color }) => {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    teal: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300',
    gray: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
  };
  return (
    <div className={`rounded-xl p-3 border text-center ${colorMap[color] || colorMap.gray}`}>
      <p className="text-xs opacity-75">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
};

const TimelineCard: React.FC<{ jour: JourDetail }> = ({ jour }) => {
  return (
    <div className={`rounded-xl p-4 border ${getStatutColor(jour.statut)} transition hover:shadow-md`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-800 dark:text-white">{formatDate(jour.date)}</span>
          {getStatutBadge(jour.statut)}
          {jour.teletravail && <Badge variant="info">🏠 Télétravail</Badge>}
        </div>
        {jour.retardMinutes > 0 && (
          <span className="text-sm font-semibold text-orange-600">⏰ {jour.retardMinutes} min retard</span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Entrée</span>
          <p className="font-medium text-gray-800 dark:text-gray-200">{formatTime(jour.heureEntree)}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Sortie</span>
          <p className="font-medium text-gray-800 dark:text-gray-200">{formatTime(jour.heureSortie)}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Temps actif</span>
          <p className="font-medium text-green-600 dark:text-green-400">{jour.tempsActifMinutes > 0 ? `${jour.tempsActifMinutes} min` : '-'}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Temps inactif</span>
          <p className="font-medium text-red-500">{jour.tempsInactifMinutes > 0 ? `${jour.tempsInactifMinutes} min` : '-'}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">WiFi / Réseau</span>
          <p className="font-medium text-gray-700 dark:text-gray-300 text-xs">
            {jour.ssid || 'N/A'} {jour.surReseauEntreprise ? '✅' : '❌'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HistoriqueAgentPage;
