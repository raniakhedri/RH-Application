import React, { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { projetService } from '../api/projetService';
import { Projet, StatutProjet } from '../types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';

const statutBadgeMap: Record<string, 'neutral' | 'primary' | 'success' | 'danger'> = {
  PLANIFIE: 'neutral',
  EN_COURS: 'primary',
  CLOTURE: 'success',
  ANNULE: 'danger',
};

const ProjetsPage: React.FC = () => {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProjet, setEditingProjet] = useState<Projet | null>(null);
  const [formData, setFormData] = useState({ nom: '', dateDebut: '', dateFin: '', statut: StatutProjet.PLANIFIE });

  useEffect(() => {
    loadProjets();
  }, []);

  const loadProjets = async () => {
    try {
      const response = await projetService.getAll();
      setProjets(response.data.data || []);
    } catch (err) {
      console.error('Erreur chargement projets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingProjet) {
        await projetService.update(editingProjet.id, formData);
      } else {
        await projetService.create(formData);
      }
      setShowModal(false);
      setEditingProjet(null);
      resetForm();
      loadProjets();
    } catch (err) {
      console.error('Erreur sauvegarde projet:', err);
    }
  };

  const handleEdit = (projet: Projet) => {
    setEditingProjet(projet);
    setFormData({ nom: projet.nom, dateDebut: projet.dateDebut, dateFin: projet.dateFin, statut: projet.statut });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Supprimer ce projet ?')) {
      try {
        await projetService.delete(id);
        loadProjets();
      } catch (err) {
        console.error('Erreur suppression:', err);
      }
    }
  };

  const handleChangeStatut = async (id: number, statut: StatutProjet) => {
    try {
      await projetService.changeStatut(id, statut);
      loadProjets();
    } catch (err) {
      console.error('Erreur changement statut:', err);
    }
  };

  const resetForm = () => {
    setFormData({ nom: '', dateDebut: '', dateFin: '', statut: StatutProjet.PLANIFIE });
  };

  const inputClass =
    'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300';

  const columns = [
    { key: 'id', label: '#' },
    {
      key: 'nom',
      label: 'Nom',
      render: (p: Projet) => (
        <span className="font-medium text-gray-800 dark:text-white">{p.nom}</span>
      ),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (p: Projet) => <Badge text={p.statut} variant={statutBadgeMap[p.statut] || 'neutral'} />,
    },
    { key: 'dateDebut', label: 'Début' },
    { key: 'dateFin', label: 'Fin' },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Projet) => (
        <div className="flex gap-1">
          {item.statut === 'PLANIFIE' && (
            <button
              onClick={() => handleChangeStatut(item.id, StatutProjet.EN_COURS)}
              className="rounded-lg p-1.5 text-success-500 hover:bg-success-50"
              title="Démarrer"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          )}
          {item.statut === 'EN_COURS' && (
            <button
              onClick={() => handleChangeStatut(item.id, StatutProjet.CLOTURE)}
              className="rounded-lg p-1.5 text-success-500 hover:bg-success-50"
              title="Clôturer"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          )}
          <button
            onClick={() => handleEdit(item)}
            className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50"
          >
            <HiOutlinePencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="rounded-lg p-1.5 text-error-500 hover:bg-error-50"
          >
            <HiOutlineTrash size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Projets</h1>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérer les projets de l'agence
          </p>
        </div>
        <Button onClick={() => { resetForm(); setEditingProjet(null); setShowModal(true); }}>
          <HiOutlinePlus size={18} /> Nouveau projet
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Chargement...</div>
      ) : (
        <DataTable columns={columns} data={projets} />
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProjet ? 'Modifier le projet' : 'Nouveau projet'}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Date début</label>
              <input
                type="date"
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Date fin</label>
              <input
                type="date"
                value={formData.dateFin}
                onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                className={inputClass}
                required
              />
            </div>
          </div>
          {editingProjet && (
            <div>
              <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
              <select
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value as StatutProjet })}
                className={inputClass}
              >
                {Object.values(StatutProjet).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleSave}>{editingProjet ? 'Modifier' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjetsPage;
