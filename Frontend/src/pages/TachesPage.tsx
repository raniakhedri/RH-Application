import React, { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { tacheService } from '../api/tacheService';
import { projetService } from '../api/projetService';
import { Tache, Projet, StatutTache } from '../types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

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
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();
  const [taches, setTaches] = useState<Tache[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterProjet, setFilterProjet] = useState<string>('');
  const [draggedTache, setDraggedTache] = useState<Tache | null>(null);
  const [dragOverStatut, setDragOverStatut] = useState<string | null>(null);
  const [editingTache, setEditingTache] = useState<Tache | null>(null);
  const [formData, setFormData] = useState({
    titre: '',
    dateEcheance: '',
    projetId: 0,
    assigneeId: null as number | null,
  });
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tRes, pRes] = await Promise.all([
        tacheService.getAll(),
        projetService.getAll(),
      ]);
      setTaches(tRes.data.data || []);
      setProjets(pRes.data.data || []);
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute assignable members for the currently selected project: chef + selected membres
  const getMembresForProjet = (projetId: number) => {
    const p = projets.find(pr => pr.id === projetId);
    if (!p) return [];
    const map = new Map<number, { id: number; prenom: string; nom: string }>();
    if (p.chefDeProjet) map.set(p.chefDeProjet.id, p.chefDeProjet);
    (p.membres ?? []).forEach(m => { if (!map.has(m.id)) map.set(m.id, m); });
    return Array.from(map.values());
  };

  const handleSubmit = async () => {
    // Validate dates against project range
    const selectedProjet = projets.find(p => p.id === formData.projetId);
    if (selectedProjet && formData.dateEcheance) {
      if (formData.dateEcheance < selectedProjet.dateDebut) {
        setDateError(`L'échéance ne peut pas être avant le début du projet (${selectedProjet.dateDebut})`);
        return;
      }
      if (formData.dateEcheance > selectedProjet.dateFin) {
        setDateError(`L'échéance ne peut pas être après la fin du projet (${selectedProjet.dateFin})`);
        return;
      }
    }
    setDateError(null);

    try {
      if (editingTache) {
        await tacheService.update(editingTache.id, {
          titre: formData.titre,
          dateEcheance: formData.dateEcheance,
        });
        if (formData.assigneeId !== editingTache.assigneeId) {
          if (formData.assigneeId) {
            await tacheService.assign(editingTache.id, formData.assigneeId);
          }
        }
      } else {
        const created = await tacheService.create(formData.projetId, {
          titre: formData.titre,
          dateEcheance: formData.dateEcheance,
        });
        if (formData.assigneeId && created.data.data) {
          await tacheService.assign(created.data.data.id, formData.assigneeId);
        }
      }
      setShowModal(false);
      setEditingTache(null);
      loadData();
    } catch (err: any) {
      console.error('Erreur sauvegarde tâche:', err);
      setDateError(err?.response?.data?.message || 'Erreur lors de la sauvegarde');
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
    confirm('Supprimer cette tâche ?', async () => {
      try {
        await tacheService.delete(id);
        loadData();
      } catch (err) {
        console.error('Erreur suppression:', err);
      }
    }, 'Supprimer la tâche');
  };

  const getProjetNom = (id: number) => projets.find((p) => p.id === id)?.nom || '-';
  const getEmployeNom = (id: number | null) => {
    if (!id) return 'Non assignée';
    // Search across all projets' members
    for (const p of projets) {
      if (p.chefDeProjet?.id === id) return `${p.chefDeProjet.prenom} ${p.chefDeProjet.nom}`;
      const m = (p.membres ?? []).find(m => m.id === id);
      if (m) return `${m.prenom} ${m.nom}`;
    }
    return '-';
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, tache: Tache) => {
    setDraggedTache(tache);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tache.id.toString());
    // Add drag styling
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => {
      target.style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    setDraggedTache(null);
    setDragOverStatut(null);
  };

  const handleDragOver = (e: React.DragEvent, statut: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatut(statut);
  };

  const handleDragLeave = () => {
    setDragOverStatut(null);
  };

  const handleDoubleClick = (tache: Tache) => {
    setEditingTache(tache);
    setFormData({
      titre: tache.titre,
      dateEcheance: tache.dateEcheance,
      projetId: tache.projetId,
      assigneeId: tache.assigneeId,
    });
    setDateError(null);
    setShowModal(true);
  };

  const handleDrop = async (e: React.DragEvent, targetStatut: string) => {
    e.preventDefault();
    setDragOverStatut(null);

    if (!draggedTache || draggedTache.statut === targetStatut) return;

    await handleChangeStatut(draggedTache.id, targetStatut as StatutTache);
    setDraggedTache(null);
  };

  const filtered = filterProjet
    ? taches.filter((t) => t.projetId === Number(filterProjet))
    : taches;

  const inputClass =
    'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300';

  // Group tasks by status for Kanban view
  const grouped = {
    TODO: filtered.filter((t) => t.statut === 'TODO'),
    IN_PROGRESS: filtered.filter((t) => t.statut === 'IN_PROGRESS'),
    DONE: filtered.filter((t) => t.statut === 'DONE'),
  };

  const openCreateModal = () => {
    const firstProjetId = projets[0]?.id || 0;
    setEditingTache(null);
    setFormData({ titre: '', dateEcheance: '', projetId: firstProjetId, assigneeId: null });
    setDateError(null);
    setShowModal(true);
  };

  const handleProjetChange = (projetId: number) => {
    setFormData({ ...formData, projetId, assigneeId: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Tâches</h1>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
            Suivi des tâches par projet — Glissez-déposez pour changer le statut
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
          <Button onClick={openCreateModal}>
            <HiOutlinePlus size={18} /> Nouvelle tâche
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((statut) => (
            <div
              key={statut}
              className={`rounded-2xl border-2 transition-colors duration-200 ${dragOverStatut === statut
                ? 'border-brand-400 bg-brand-50/30 dark:bg-brand-500/5'
                : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark'
                }`}
              onDragOver={(e) => handleDragOver(e, statut)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, statut)}
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Badge text={statutLabels[statut]} variant={statutBadgeMap[statut]} />
                  <span className="text-theme-xs text-gray-400">{grouped[statut].length}</span>
                </div>
              </div>
              <div className="space-y-2 p-3 min-h-[100px]">
                {grouped[statut].length === 0 ? (
                  <p className="py-6 text-center text-theme-sm text-gray-400">
                    {dragOverStatut === statut ? 'Déposez ici' : 'Aucune tâche'}
                  </p>
                ) : (
                  grouped[statut].map((tache) => (
                    <div
                      key={tache.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, tache)}
                      onDragEnd={handleDragEnd}
                      onDoubleClick={() => handleDoubleClick(tache)}
                      className="cursor-grab rounded-xl border border-gray-100 bg-gray-50 p-3 transition-shadow hover:shadow-md active:cursor-grabbing dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-theme-sm font-medium text-gray-800 dark:text-white">
                          {tache.titre}
                        </h4>
                        <button
                          onClick={() => handleDelete(tache.id)}
                          className="rounded p-1 text-error-500 hover:bg-error-50"
                        >
                          <HiOutlineTrash size={14} />
                        </button>
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingTache(null); }}
        title={editingTache ? 'Modifier la tâche' : 'Nouvelle tâche'}
      >
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
              onChange={(e) => handleProjetChange(Number(e.target.value))}
              className={inputClass}
              disabled={!!editingTache}
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
              {getMembresForProjet(formData.projetId).length > 0 ? (
                getMembresForProjet(formData.projetId).map((m) => (
                  <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>
                ))
              ) : (
                <option value="" disabled>Aucun membre pour ce projet</option>
              )}
            </select>
            {getMembresForProjet(formData.projetId).length === 0 && formData.projetId > 0 && (
              <p className="mt-1 text-theme-xs text-warning-500">
                Ce projet n'a pas encore de membres assignés.
              </p>
            )}
          </div>
          {dateError && (
            <div className="rounded-lg bg-error-50 px-4 py-2 text-theme-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {dateError}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowModal(false); setEditingTache(null); }}>Annuler</Button>
            <Button onClick={handleSubmit}>{editingTache ? 'Modifier' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel="Supprimer"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default TachesPage;
