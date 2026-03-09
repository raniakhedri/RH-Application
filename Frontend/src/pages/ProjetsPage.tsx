import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineClipboardList } from 'react-icons/hi';
import { projetService } from '../api/projetService';
import { equipeService } from '../api/equipeService';
import { employeService } from '../api/employeService';
import { useAuth } from '../context/AuthContext';
import { Projet, Equipe, StatutProjet, Employe } from '../types';
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projets, setProjets] = useState<Projet[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProjet, setEditingProjet] = useState<Projet | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    dateDebut: '',
    dateFin: '',
    statut: StatutProjet.PLANIFIE,
    chefDeProjetId: null as number | null,
    equipeIds: [] as number[],
  });
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [dateError, setDateError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userId = user?.employeId;
      const [pRes, eqRes, empRes] = await Promise.all([
        userId ? projetService.getByEmploye(userId) : projetService.getAll(),
        equipeService.getAll(),
        employeService.getAll(),
      ]);
      setProjets(pRes.data.data || []);
      setEquipes(eqRes.data.data || []);
      setEmployes(empRes.data.data || []);
    } catch (err) {
      console.error('Erreur chargement projets:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateDates = (): boolean => {
    if (!editingProjet) {
      if (formData.dateDebut && formData.dateDebut < today) {
        setDateError('La date de début doit être aujourd\'hui ou plus tard');
        return false;
      }
    }
    if (formData.dateDebut && formData.dateFin && formData.dateFin <= formData.dateDebut) {
      setDateError('La date de fin doit être après la date de début');
      return false;
    }
    setDateError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validateDates()) return;
    try {
      const payload = {
        ...formData,
        chefDeProjetId: formData.chefDeProjetId || null,
        createurId: editingProjet ? undefined : user?.employeId,
        equipeIds: formData.equipeIds.length > 0 ? formData.equipeIds : [],
      };
      if (editingProjet) {
        await projetService.update(editingProjet.id, payload);
      } else {
        await projetService.create(payload as any);
      }
      setShowModal(false);
      setEditingProjet(null);
      resetForm();
      loadData();
    } catch (err: any) {
      console.error('Erreur sauvegarde projet:', err);
      const msg = err?.response?.data?.message || 'Erreur lors de la sauvegarde du projet';
      setDateError(msg);
    }
  };

  const handleEdit = (projet: Projet) => {
    setEditingProjet(projet);
    setFormData({
      nom: projet.nom,
      dateDebut: projet.dateDebut,
      dateFin: projet.dateFin,
      statut: projet.statut,
      chefDeProjetId: projet.chefDeProjet?.id || null,
      equipeIds: projet.equipeIds || (projet.equipeId ? [projet.equipeId] : []),
    });
    setDateError(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Supprimer ce projet ?')) {
      try {
        await projetService.delete(id);
        loadData();
      } catch (err) {
        console.error('Erreur suppression:', err);
      }
    }
  };

  const handleChangeStatut = async (id: number, statut: StatutProjet) => {
    try {
      await projetService.changeStatut(id, statut);
      loadData();
    } catch (err) {
      console.error('Erreur changement statut:', err);
    }
  };

  const toggleEquipe = (equipeId: number) => {
    setFormData(prev => {
      const exists = prev.equipeIds.includes(equipeId);
      return {
        ...prev,
        equipeIds: exists
          ? prev.equipeIds.filter(id => id !== equipeId)
          : [...prev.equipeIds, equipeId],
      };
    });
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      dateDebut: '',
      dateFin: '',
      statut: StatutProjet.PLANIFIE,
      chefDeProjetId: null,
      equipeIds: [],
    });
    setDateError(null);
  };

  const inputClass =
    'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300';

  // Available equipes: unassigned OR already linked to editing project
  const availableEquipes = equipes.filter(e =>
    !e.projetId ||
    (editingProjet && e.projetId === editingProjet.id)
  );

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
    {
      key: 'chef',
      label: 'Chef',
      render: (p: Projet) => p.chefDeProjet ? `${p.chefDeProjet.prenom} ${p.chefDeProjet.nom}` : '-',
    },
    {
      key: 'equipes',
      label: 'Équipes',
      render: (p: Projet) => p.equipeNoms?.join(', ') || '-',
    },
    {
      key: 'dateDebut',
      label: 'Début',
      render: (p: Projet) => {
        if (!p.dateDebut) return '-';
        const [y, m, d] = p.dateDebut.split('-');
        return `${d}/${m}/${y}`;
      }
    },
    {
      key: 'dateFin',
      label: 'Fin',
      render: (p: Projet) => {
        if (!p.dateFin) return '-';
        const [y, m, d] = p.dateFin.split('-');
        return `${d}/${m}/${y}`;
      }
    },
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
            onClick={() => navigate(`/projets/${item.id}/taches`)}
            className="rounded-lg p-1.5 text-secondary-500 hover:bg-secondary-50"
            title="Voir les tâches"
          >
            <HiOutlineClipboardList size={16} />
          </button>
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
          <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Mes Projets</h1>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
            Vos projets en tant que chef ou membre d'équipe
          </p>
        </div>
        <Button onClick={() => { resetForm(); setEditingProjet(null); setShowModal(true); }}>
          <HiOutlinePlus size={18} /> Nouveau projet
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Chargement...</div>
      ) : (
        <DataTable columns={columns} data={projets} onRowDoubleClick={handleEdit} />
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProjet ? 'Modifier le projet' : 'Nouveau projet'}
        size="lg"
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
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Chef de Projet (optionnel)</label>
            <select
              value={formData.chefDeProjetId || ''}
              onChange={(e) => setFormData({ ...formData, chefDeProjetId: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            >
              <option value="">Aucun chef assigné</option>
              {employes.map((e) => (
                <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
              ))}
            </select>
          </div>

          {/* Multi-select Équipes */}
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Équipes ({formData.equipeIds.length} sélectionnée{formData.equipeIds.length > 1 ? 's' : ''})
            </label>
            {availableEquipes.length === 0 ? (
              <div className="rounded-lg bg-warning-50 px-4 py-3 text-theme-sm text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
                Aucune équipe disponible. Créez-en dans la page Équipes.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-300 dark:border-gray-600">
                {availableEquipes.map((eq) => {
                  const isSelected = formData.equipeIds.includes(eq.id);
                  return (
                    <label
                      key={eq.id}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${isSelected ? 'bg-brand-50 dark:bg-brand-500/10' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleEquipe(eq.id)}
                        className="h-4 w-4 rounded text-brand-500 focus:ring-brand-500"
                      />
                      <div className="flex-1">
                        <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">{eq.nom}</span>
                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); toggleEquipe(eq.id); }}
                            className="ml-2 text-error-400 hover:text-error-600"
                          >
                            <HiOutlineX size={12} />
                          </button>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
            {/* Selected équipes chips */}
            {formData.equipeIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.equipeIds.map(id => {
                  const eq = equipes.find(e => e.id === id);
                  return eq ? (
                    <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-theme-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                      {eq.nom}
                      <button type="button" onClick={() => toggleEquipe(id)} className="text-brand-400 hover:text-brand-600">
                        <HiOutlineX size={12} />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Date début</label>
              <input
                type="date"
                value={formData.dateDebut}
                min={!editingProjet ? today : undefined}
                onChange={(e) => { setFormData({ ...formData, dateDebut: e.target.value }); setDateError(null); }}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Date fin</label>
              <input
                type="date"
                value={formData.dateFin}
                min={formData.dateDebut || today}
                onChange={(e) => { setFormData({ ...formData, dateFin: e.target.value }); setDateError(null); }}
                className={inputClass}
                required
              />
            </div>
          </div>
          {dateError && (
            <div className="rounded-lg bg-error-50 px-4 py-2 text-theme-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {dateError}
            </div>
          )}
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
