import React, { useState, useEffect } from 'react';
import { HiOutlineSearch, HiOutlineFilter, HiOutlineEye, HiOutlineXCircle } from 'react-icons/hi';
import { demandeService } from '../api/demandeService';
import { DemandeResponse, StatutDemande, TypeDemande } from '../types';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const statutBadgeMap: Record<string, 'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'neutral'> = {
  BROUILLON: 'neutral',
  SOUMISE: 'primary',
  EN_VALIDATION: 'warning',
  VALIDEE: 'success',
  REFUSEE: 'danger',
  ANNULEE: 'neutral',
};

const typeBadgeMap: Record<string, 'primary' | 'secondary' | 'success' | 'warning'> = {
  CONGE: 'primary',
  AUTORISATION: 'secondary',
  TELETRAVAIL: 'success',
  ADMINISTRATION: 'warning',
};

const DemandesPage: React.FC = () => {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState<DemandeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('');
  const [selectedDemande, setSelectedDemande] = useState<DemandeResponse | null>(null);

  useEffect(() => {
    loadDemandes();
  }, []);

  const loadDemandes = async () => {
    try {
      const response = await demandeService.getAll();
      setDemandes(response.data.data || []);
    } catch (err) {
      console.error('Erreur chargement demandes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (id: number) => {
    try {
      await demandeService.submit(id);
      loadDemandes();
    } catch (err) {
      console.error('Erreur soumission:', err);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await demandeService.cancel(id);
      loadDemandes();
    } catch (err) {
      console.error('Erreur annulation:', err);
    }
  };

  const filtered = demandes.filter((d) => {
    const matchSearch =
      d.employeNom?.toLowerCase().includes(search.toLowerCase()) ||
      d.type.toLowerCase().includes(search.toLowerCase()) ||
      d.raison?.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut ? d.statut === filterStatut : true;
    return matchSearch && matchStatut;
  });

  const columns = [
    { key: 'id', label: '#' },
    {
      key: 'type',
      label: 'Type',
      render: (item: DemandeResponse) => (
        <Badge text={item.type} variant={typeBadgeMap[item.type] || 'neutral'} />
      ),
    },
    { key: 'employeNom', label: 'Employé' },
    { key: 'raison', label: 'Raison', render: (d: DemandeResponse) => <span className="truncate max-w-[200px] block">{d.raison}</span> },
    {
      key: 'dates',
      label: 'Dates',
      render: (d: DemandeResponse) => (
        <span className="text-theme-xs text-gray-500">
          {d.dateDebut && d.dateFin ? `${d.dateDebut} → ${d.dateFin}` : d.date || '-'}
        </span>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (item: DemandeResponse) => (
        <Badge text={item.statut} variant={statutBadgeMap[item.statut] || 'neutral'} />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: DemandeResponse) => (
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedDemande(item)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <HiOutlineEye size={16} />
          </button>
          {item.statut === 'BROUILLON' && (
            <button
              onClick={() => handleSubmit(item.id)}
              className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50"
              title="Soumettre"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          )}
          {(item.statut === 'BROUILLON' || item.statut === 'SOUMISE') && (
            <button
              onClick={() => handleCancel(item.id)}
              className="rounded-lg p-1.5 text-error-500 hover:bg-error-50"
              title="Annuler"
            >
              <HiOutlineXCircle size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Demandes</h1>
        <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
          Gérer les demandes de congé, autorisation et télétravail
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent pl-10 pr-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
          />
        </div>
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
        >
          <option value="">Tous les statuts</option>
          {Object.values(StatutDemande).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">Chargement...</div>
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selectedDemande} onClose={() => setSelectedDemande(null)} title="Détails de la demande">
        {selectedDemande && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">Type</p>
                <p className="text-theme-sm font-medium text-gray-800 dark:text-white">{selectedDemande.type}</p>
              </div>
              <div>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">Statut</p>
                <Badge text={selectedDemande.statut} variant={statutBadgeMap[selectedDemande.statut] || 'neutral'} />
              </div>
              <div>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">Employé</p>
                <p className="text-theme-sm font-medium text-gray-800 dark:text-white">{selectedDemande.employeNom}</p>
              </div>
              <div>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">Date de création</p>
                <p className="text-theme-sm font-medium text-gray-800 dark:text-white">{selectedDemande.dateCreation}</p>
              </div>
              {selectedDemande.dateDebut && (
                <div>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">Date début</p>
                  <p className="text-theme-sm font-medium text-gray-800 dark:text-white">{selectedDemande.dateDebut}</p>
                </div>
              )}
              {selectedDemande.dateFin && (
                <div>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">Date fin</p>
                  <p className="text-theme-sm font-medium text-gray-800 dark:text-white">{selectedDemande.dateFin}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">Raison</p>
              <p className="text-theme-sm text-gray-700 dark:text-gray-300 mt-1">{selectedDemande.raison}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DemandesPage;
