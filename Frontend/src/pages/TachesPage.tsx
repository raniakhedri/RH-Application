import React, { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { tacheService } from '../api/tacheService';
import { projetService } from '../api/projetService';
import { employeService } from '../api/employeService';
import { Tache, Projet, Employe, StatutTache } from '../types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const statutBadgeMap: Record<string, 'neutral' | 'primary' | 'success'> = {
  TODO: 'neutral',
  IN_PROGRESS: 'primary',
  DONE: 'success',
};

const statutLabels: Record<string, string> = {
  TODO: 'À faire',
  IN_PROGRESS: 'En cours',
  DONE: 'Terminée',
};

const TachesPage: React.FC = () => {
  const [taches, setTaches] = useState<Tache[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterProjet, setFilterProjet] = useState<string>('');
  const [formData, setFormData] = useState({
    titre: '',
    dateEcheance: '',
    projetId: 0,
    assigneeId: null as number | null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tRes, pRes, eRes] = await Promise.all([
        tacheService.getAll(),
        projetService.getAll(),
        employeService.getAll(),
      ]);
      setTaches(tRes.data.data || []);
      setProjets(pRes.data.data || []);
      setEmployes(eRes.data.data || []);
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const created = await tacheService.create(formData.projetId, {
        titre: formData.titre,
        dateEcheance: formData.dateEcheance,
      });
      if (formData.assigneeId && created.data.data) {
        await tacheService.assign(created.data.data.id, formData.assigneeId);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Erreur création tâche:', err);
    }
  };

  const handleChangeStatut = async (id: number, statut: StatutTache) => {
    try {
      await tacheService.changeStatut(id, statut);
      loadData();
    } catch (err) {
      console.error('Erreur changement statut:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Supprimer cette tâche ?')) {
      try {
        await tacheService.delete(id);
        loadData();
      } catch (err) {
        console.error('Erreur suppression:', err);
      }
    }
  };

  const getProjetNom = (id: number) => projets.find((p) => p.id === id)?.nom || '-';
  const getEmployeNom = (id: number | null) => {
    if (!id) return 'Non assignée';
    const e = employes.find((emp) => emp.id === id);
    return e ? `${e.prenom} ${e.nom}` : '-';
  };

  const filtered = filterProjet
    ? taches.filter((t) => t.projetId === Number(filterProjet))
    : taches;

  const inputClass =
    'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300';

  // Group tasks by status for Kanban-like view
  const grouped = {
    TODO: filtered.filter((t) => t.statut === 'TODO'),
    IN_PROGRESS: filtered.filter((t) => t.statut === 'IN_PROGRESS'),
    DONE: filtered.filter((t) => t.statut === 'DONE'),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Tâches</h1>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
            Suivi des tâches par projet
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={filterProjet}
            onChange={(e) => setFilterProjet(e.target.value)}
            className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 dark:border-gray-600 dark:text-gray-300"
          >
            <option value="">Tous les projets</option>
            {projets.map((p) => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
          <Button onClick={() => { setFormData({ titre: '', dateEcheance: '', projetId: projets[0]?.id || 0, assigneeId: null }); setShowModal(true); }}>
            <HiOutlinePlus size={18} /> Nouvelle tâche
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((statut) => (
            <div key={statut} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Badge text={statutLabels[statut]} variant={statutBadgeMap[statut]} />
                  <span className="text-theme-xs text-gray-400">{grouped[statut].length}</span>
                </div>
              </div>
              <div className="space-y-2 p-3">
                {grouped[statut].length === 0 ? (
                  <p className="py-6 text-center text-theme-sm text-gray-400">Aucune tâche</p>
                ) : (
                  grouped[statut].map((tache) => (
                    <div
                      key={tache.id}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-theme-sm font-medium text-gray-800 dark:text-white">
                          {tache.titre}
                        </h4>
                        <div className="flex gap-0.5">
                          {statut !== 'DONE' && (
                            <button
                              onClick={() =>
                                handleChangeStatut(
                                  tache.id,
                                  statut === 'TODO' ? StatutTache.IN_PROGRESS : StatutTache.DONE
                                )
                              }
                              className="rounded p-1 text-success-500 hover:bg-success-50"
                              title="Avancer"
                            >
                              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(tache.id)}
                            className="rounded p-1 text-error-500 hover:bg-error-50"
                          >
                            <HiOutlineTrash size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-theme-xs text-gray-500">{getProjetNom(tache.projetId)}</span>
                        <span className="text-theme-xs text-gray-400">{tache.dateEcheance}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-theme-xs text-secondary-500">
                          {getEmployeNom(tache.assigneeId)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle tâche">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Titre</label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Projet</label>
            <select
              value={formData.projetId}
              onChange={(e) => setFormData({ ...formData, projetId: Number(e.target.value) })}
              className={inputClass}
            >
              {projets.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Date d'échéance</label>
            <input
              type="date"
              value={formData.dateEcheance}
              onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Assigné à</label>
            <select
              value={formData.assigneeId || ''}
              onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            >
              <option value="">Non assignée</option>
              {employes.map((e) => (
                <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleCreate}>Créer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TachesPage;
