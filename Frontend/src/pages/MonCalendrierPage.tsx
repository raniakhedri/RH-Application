import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { calendrierService } from '../api/calendrierService';
import { CalendrierJour } from '../types';

const MonCalendrierPage: React.FC = () => {
  const { user } = useAuth();
  const [jours, setJours] = useState<CalendrierJour[]>([]);
  const [loading, setLoading] = useState(true);
  const [mois, setMois] = useState(new Date().getMonth());
  const [annee, setAnnee] = useState(new Date().getFullYear());

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await calendrierService.getAllJours();
        setJours(response.data.data || []);
      } catch (err) {
        console.error('Erreur chargement calendrier:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const joursFiltres = jours.filter((j) => {
    const d = new Date(j.dateJour);
    return d.getMonth() === mois && d.getFullYear() === annee;
  });

  const moisNoms = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];

  const typeColors: Record<string, string> = {
    OUVRABLE: 'bg-white dark:bg-gray-800',
    FERIE: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
    CONGE_PAYE: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    CONGE_NON_PAYE: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Mon Calendrier</h1>

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => {
            if (mois === 0) { setMois(11); setAnnee(annee - 1); }
            else setMois(mois - 1);
          }}
          className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
        >
          ←
        </button>
        <span className="text-lg font-semibold text-gray-800 dark:text-white">
          {moisNoms[mois]} {annee}
        </span>
        <button
          onClick={() => {
            if (mois === 11) { setMois(0); setAnnee(annee + 1); }
            else setMois(mois + 1);
          }}
          className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
        >
          →
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Chargement...</div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
              {d}
            </div>
          ))}
          {joursFiltres.map((j) => (
            <div
              key={j.id}
              className={`p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs ${typeColors[j.typeJour] || ''}`}
            >
              <div className="font-medium">{new Date(j.dateJour).getDate()}</div>
              {j.nomJour && <div className="text-xs truncate">{j.nomJour}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonCalendrierPage;
