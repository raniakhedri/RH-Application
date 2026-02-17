import React, { useState, useEffect } from 'react';
import { HiOutlineClock, HiOutlineLogout } from 'react-icons/hi';
import { pointageService } from '../api/pointageService';
import { Pointage, StatutPointage } from '../types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import { useAuth } from '../context/AuthContext';

const statutBadgeMap: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
  PRESENT: 'success',
  ABSENT: 'danger',
  RETARD: 'warning',
  INCOMPLET: 'warning',
};

const PointagePage: React.FC = () => {
  const { user } = useAuth();
  const [pointages, setPointages] = useState<Pointage[]>([]);
  const [loading, setLoading] = useState(true);
  const [clockInLoading, setClockInLoading] = useState(false);
  const [clockOutLoading, setClockOutLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadPointages();
  }, []);

  const loadPointages = async () => {
    try {
      if (user) {
        const response = await pointageService.getByEmploye(user.employeId);
        setPointages(response.data.data || []);
      }
    } catch (err) {
      console.error('Erreur chargement pointages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    if (!user) return;
    setClockInLoading(true);
    try {
      await pointageService.clockIn(user.employeId);
      loadPointages();
    } catch (err) {
      console.error('Erreur pointage entrée:', err);
    } finally {
      setClockInLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!user) return;
    setClockOutLoading(true);
    try {
      await pointageService.clockOut(user.employeId);
      loadPointages();
    } catch (err) {
      console.error('Erreur pointage sortie:', err);
    } finally {
      setClockOutLoading(false);
    }
  };

  const todayPointage = pointages.find((p) => p.dateJour === selectedDate);

  const columns = [
    { key: 'dateJour', label: 'Date' },
    {
      key: 'heureEntree',
      label: 'Entrée',
      render: (p: Pointage) => (
        <span className="text-theme-sm text-gray-700 dark:text-gray-300">{p.heureEntree || '-'}</span>
      ),
    },
    {
      key: 'heureSortie',
      label: 'Sortie',
      render: (p: Pointage) => (
        <span className="text-theme-sm text-gray-700 dark:text-gray-300">{p.heureSortie || '-'}</span>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (p: Pointage) => (
        <Badge text={p.statut} variant={statutBadgeMap[p.statut] || 'neutral'} />
      ),
    },
    {
      key: 'source',
      label: 'Source',
      render: (p: Pointage) => (
        <span className="text-theme-xs text-gray-500">{p.source}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Pointage</h1>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
          Suivi des entrées et sorties
        </p>
      </div>

      {/* Clock In/Out Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div>
            <h3 className="text-theme-xl font-semibold text-gray-800 dark:text-white">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            {todayPointage ? (
              <div className="mt-2 flex items-center gap-4">
                <div>
                  <span className="text-theme-xs text-gray-500">Entrée : </span>
                  <span className="text-theme-sm font-medium text-gray-800 dark:text-white">
                    {todayPointage.heureEntree || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-theme-xs text-gray-500">Sortie : </span>
                  <span className="text-theme-sm font-medium text-gray-800 dark:text-white">
                    {todayPointage.heureSortie || '-'}
                  </span>
                </div>
                <Badge
                  text={todayPointage.statut}
                  variant={statutBadgeMap[todayPointage.statut] || 'neutral'}
                />
              </div>
            ) : (
              <p className="mt-1 text-theme-sm text-gray-500">Pas de pointage enregistré aujourd'hui</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleClockIn}
              disabled={clockInLoading || (todayPointage?.heureEntree !== null && todayPointage?.heureEntree !== undefined)}
            >
              <HiOutlineClock size={18} />
              {clockInLoading ? 'Pointage...' : 'Pointer l\'entrée'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClockOut}
              disabled={clockOutLoading || !todayPointage?.heureEntree || (todayPointage?.heureSortie !== null && todayPointage?.heureSortie !== undefined)}
            >
              <HiOutlineLogout size={18} />
              {clockOutLoading ? 'Pointage...' : 'Pointer la sortie'}
            </Button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white">Historique</h2>
        {loading ? (
          <div className="py-12 text-center text-gray-500">Chargement...</div>
        ) : (
          <DataTable columns={columns} data={pointages} />
        )}
      </div>
    </div>
  );
};

export default PointagePage;
