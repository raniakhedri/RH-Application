import React, { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineUserRemove, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi';
import { equipeService } from '../api/equipeService';
import { projetService } from '../api/projetService';
import { employeService } from '../api/employeService';
import { demandeService } from '../api/demandeService';
import { Equipe, Projet, Employe, EquipeCreateRequest, StatutDemande } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

const EquipesPage: React.FC = () => {
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [congeAujourdhuiIds, setCongeAujourdhuiIds] = useState<Set<number>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedEquipe, setSelectedEquipe] = useState<Equipe | null>(null);
  const [editingEquipe, setEditingEquipe] = useState<Equipe | null>(null);
  const [selectedEmployeId, setSelectedEmployeId] = useState<number>(0);

  const [createForm, setCreateForm] = useState<EquipeCreateRequest>({
    nom: '',
    projetId: null,
    memberIds: [],
  });
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [eqRes, pRes, empRes, demandesRes] = await Promise.all([
        equipeService.getAll(),
        projetService.getAll(),
        employeService.getAll(),
        demandeService.getByStatut(StatutDemande.APPROUVEE),
      ]);
      setEquipes(eqRes.data.data || []);
      setProjets(pRes.data.data || []);
      setEmployes(empRes.data.data || []);
      // Build set of employeIds on congé today
      const demandes = demandesRes.data.data || [];
      const onConge = new Set<number>();
      demandes.forEach(d => {
        if (d.dateDebut && d.dateFin && d.employeId) {
          const debut = d.dateDebut.toString().substring(0, 10);
          const fin = d.dateFin.toString().substring(0, 10);
          if (debut <= today && today <= fin) {
            onConge.add(d.employeId);
          }
        }
      });
      setCongeAujourdhuiIds(onConge);
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.nom.trim()) {
      setCreateError('Le nom de l\'équipe est obligatoire');
      return;
    }
    setCreateError(null);
    try {
      if (editingEquipe) {
        await equipeService.update(editingEquipe.id, createForm);
      } else {
        await equipeService.create(createForm);
      }
      setShowCreateModal(false);
      setEditingEquipe(null);
      resetCreateForm();
      loadData();
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
      const msg = err?.response?.data?.message || 'Erreur lors de la sauvegarde';
      setCreateError(msg);
    }
  };

  const handleEdit = (equipe: Equipe) => {
    setEditingEquipe(equipe);
    setCreateForm({
      nom: equipe.nom,
      projetId: equipe.projetId,
      memberIds: equipe.membres?.map(m => m.id) || [],
    });
    setCreateError(null);
    setShowCreateModal(true);
  };

  const resetCreateForm = () => {
    setCreateForm({ nom: '', projetId: null, memberIds: [] });
    setCreateError(null);
  };

  const toggleMember = (employeId: number) => {
    setCreateForm(prev => {
      const exists = prev.memberIds.includes(employeId);
      return {
        ...prev,
        memberIds: exists
          ? prev.memberIds.filter(id => id !== employeId)
          : [...prev.memberIds, employeId],
      };
    });
  };

  const handleAddMember = async () => {
    if (!selectedEquipe || !selectedEmployeId) return;
    try {
      await equipeService.addMembre(selectedEquipe.id, selectedEmployeId);
      setShowAddMemberModal(false);
      loadData();
    } catch (err) {
      console.error('Erreur ajout membre:', err);
    }
  };

  const handleRemoveMember = async (equipeId: number, employeId: number) => {
    try {
      await equipeService.removeMembre(equipeId, employeId);
      loadData();
    } catch (err) {
      console.error('Erreur retrait membre:', err);
    }
  };

  const handleDelete = async (id: number) => {
    confirm('Supprimer cette équipe ?', async () => {
      try {
        await equipeService.delete(id);
        loadData();
      } catch (err) {
        console.error('Erreur suppression:', err);
      }
    }, 'Supprimer l\'équipe');
  };

  const getProjetNom = (id: number | null) => {
    if (!id) return 'Aucun projet';
    return projets.find((p) => p.id === id)?.nom || '-';
  };

  const inputClass =
    'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Équipes</h1>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérer les équipes et leurs membres
          </p>
        </div>
        <Button onClick={() => { resetCreateForm(); setEditingEquipe(null); setShowCreateModal(true); }}>
          <HiOutlinePlus size={18} /> Nouvelle équipe
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Chargement...</div>
      ) : equipes.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-dark">
          <p className="text-gray-500 dark:text-gray-400">Aucune équipe créée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {equipes.map((equipe) => (
            <div
              key={equipe.id}
              className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark"
            >
              {/* Equipe Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                <div>
                  <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white">
                    {equipe.nom}
                  </h3>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Projet : {getProjetNom(equipe.projetId)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(equipe)}
                    className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50"
                    title="Modifier"
                  >
                    <HiOutlinePencil size={16} />
                  </button>
                  <button
                    onClick={() => { setSelectedEquipe(equipe); setSelectedEmployeId(employes[0]?.id || 0); setShowAddMemberModal(true); }}
                    className="rounded-lg p-1.5 text-secondary-500 hover:bg-secondary-50"
                    title="Ajouter un membre"
                  >
                    <HiOutlinePlus size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(equipe.id)}
                    className="rounded-lg p-1.5 text-error-500 hover:bg-error-50"
                    title="Supprimer"
                  >
                    <HiOutlineTrash size={18} />
                  </button>
                </div>
              </div>

              {/* Members */}
              <div className="p-4">
                <p className="mb-2 text-theme-xs font-medium text-gray-400 uppercase">
                  Membres ({equipe.membres?.length || 0})
                </p>
                {!equipe.membres || equipe.membres.length === 0 ? (
                  <p className="text-theme-sm text-gray-400 py-2">Aucun membre</p>
                ) : (
                  <ul className="space-y-2">
                    {equipe.membres.map((membre) => (
                      <li
                        key={membre.id}
                        className="flex items-start justify-between rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800"
                      >
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-secondary-50 text-secondary-500 text-theme-xs font-semibold dark:bg-secondary-500/[0.12] dark:text-secondary-400 mt-0.5">
                            {membre.prenom?.[0]}{membre.nom?.[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-theme-sm font-medium text-gray-800 dark:text-white truncate flex items-center gap-2">
                              {membre.prenom} {membre.nom}
                              {congeAujourdhuiIds.has(membre.id) && (
                                <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-semibold text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
                                  En congé
                                </span>
                              )}
                            </p>
                            {(membre.telephonePro || membre.telephone) && (
                              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                                📞 {membre.telephonePro || membre.telephone}
                              </p>
                            )}
                            {membre.departement && (
                              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                                🏢 {membre.departement}
                              </p>
                            )}
                            {membre.email && (
                              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                                ✉️ {membre.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(equipe.id, membre.id)}
                          className="flex-shrink-0 rounded p-1 text-error-400 hover:text-error-500 hover:bg-error-50 ml-1"
                          title="Retirer"
                        >
                          <HiOutlineUserRemove size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Equipe Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditingEquipe(null); }}
        title={editingEquipe ? 'Modifier l\'équipe' : 'Nouvelle équipe'}
        size="lg"
      >
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Nom de l'équipe *</label>
            <input
              type="text"
              value={createForm.nom}
              onChange={(e) => setCreateForm({ ...createForm, nom: e.target.value })}
              className={inputClass}
              placeholder="Ex: Équipe Design"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Projet (optionnel)</label>
            <select
              value={createForm.projetId || ''}
              onChange={(e) => setCreateForm({ ...createForm, projetId: e.target.value ? Number(e.target.value) : null })}
              className={inputClass}
            >
              <option value="">Aucun projet</option>
              {projets.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>

          {/* Members multi-select with full info */}
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
              Membres ({createForm.memberIds.length} sélectionné{createForm.memberIds.length > 1 ? 's' : ''})
            </label>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-300 dark:border-gray-600">
              {employes.map((emp) => {
                const isSelected = createForm.memberIds.includes(emp.id);
                return (
                  <label
                    key={emp.id}
                    className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${isSelected ? 'bg-secondary-50 dark:bg-secondary-500/10' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMember(emp.id)}
                      className="mt-1 h-4 w-4 rounded text-brand-500 focus:ring-brand-500"
                    />
                    <div className="flex items-start gap-2 flex-1">
                      <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-secondary-50 text-secondary-500 text-theme-xs font-semibold dark:bg-secondary-500/[0.12] dark:text-secondary-400">
                        {emp.prenom?.[0]}{emp.nom?.[0]}
                      </div>
                      <div>
                        <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                          {emp.prenom} {emp.nom}
                        </p>
                        {emp.telephone && (
                          <p className="text-theme-xs text-gray-500 dark:text-gray-400">📞 {emp.telephone}</p>
                        )}
                        {emp.departement && (
                          <p className="text-theme-xs text-gray-500 dark:text-gray-400">🏢 {emp.departement}</p>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {createError && (
            <div className="rounded-lg bg-error-50 px-4 py-2 text-theme-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
              {createError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Annuler</Button>
            <Button onClick={handleCreate}>{editingEquipe ? 'Modifier' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} title="Ajouter un membre">
        <div className="space-y-4">
          <p className="text-theme-sm text-gray-600 dark:text-gray-300">
            Ajouter un membre à <span className="font-medium">{selectedEquipe?.nom}</span>
          </p>
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Employé</label>
            <select
              value={selectedEmployeId}
              onChange={(e) => setSelectedEmployeId(Number(e.target.value))}
              className={inputClass}
            >
              {employes.map((e) => (
                <option key={e.id} value={e.id}>{e.prenom} {e.nom} {e.departement ? `— ${e.departement}` : ''}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddMemberModal(false)}>Annuler</Button>
            <Button onClick={handleAddMember}>
              <HiOutlinePlus size={16} /> Ajouter
            </Button>
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

export default EquipesPage;
