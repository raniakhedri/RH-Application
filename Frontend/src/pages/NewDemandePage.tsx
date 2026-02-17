import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { demandeService } from '../api/demandeService';
import { TypeDemande } from '../types';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const NewDemandePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<TypeDemande>(TypeDemande.CONGE);
  const [raison, setRaison] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [date, setDate] = useState('');
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setLoading(true);

    try {
      const data: Record<string, unknown> = {
        type,
        raison,
        employeId: user.employeId,
      };

      if (type === TypeDemande.CONGE || type === TypeDemande.TELETRAVAIL) {
        data.dateDebut = dateDebut;
        data.dateFin = dateFin;
      } else {
        data.date = date;
        data.heureDebut = heureDebut;
        data.heureFin = heureFin;
      }

      await demandeService.create(data as any);
      navigate('/demandes');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Nouvelle demande</h1>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
          Créer une nouvelle demande de congé, autorisation ou télétravail
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
        {error && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 p-3 text-theme-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type */}
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Type de demande
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TypeDemande)}
              className={inputClass}
            >
              <option value={TypeDemande.CONGE}>Congé</option>
              <option value={TypeDemande.AUTORISATION}>Autorisation</option>
              <option value={TypeDemande.TELETRAVAIL}>Télétravail</option>
            </select>
          </div>

          {/* Date fields for CONGE / TELETRAVAIL */}
          {(type === TypeDemande.CONGE || type === TypeDemande.TELETRAVAIL) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Date début
                </label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Date fin
                </label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          )}

          {/* Date/Time fields for AUTORISATION */}
          {type === TypeDemande.AUTORISATION && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Heure début
                </label>
                <input
                  type="time"
                  value={heureDebut}
                  onChange={(e) => setHeureDebut(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  Heure fin
                </label>
                <input
                  type="time"
                  value={heureFin}
                  onChange={(e) => setHeureFin(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          )}

          {/* Raison */}
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Raison
            </label>
            <textarea
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
              placeholder="Décrivez la raison de votre demande..."
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => navigate('/demandes')}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer la demande'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewDemandePage;
