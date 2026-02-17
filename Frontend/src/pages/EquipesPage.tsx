import React, { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineUserAdd, HiOutlineUserRemove, HiOutlineTrash } from 'react-icons/hi';
import { equipeService } from '../api/equipeService';
import { projetService } from '../api/projetService';
import { employeService } from '../api/employeService';
import { Equipe, Projet, Employe } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const EquipesPage: React.FC = () => {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedEquipe, setSelectedEquipe] = useState<Equipe | null>(null);
  const [newEquipeNom, setNewEquipeNom] = useState('');
  const [newEquipeProjetId, setNewEquipeProjetId] = useState<number>(0);
  const [selectedEmployeId, setSelectedEmployeId] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eqRes, pRes, empRes] = await Promise.all([
        equipeService.getAll(),
        projetService.getAll(),
        employeService.getAll(),
      ]);
      setEquipes(eqRes.data.data || []);
      setProjets(pRes.data.data || []);
      setEmployes(empRes.data.data || []);
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await equipeService.create(newEquipeProjetId, newEquipeNom);
      setShowCreateModal(false);
      setNewEquipeNom('');
      loadData();
    } catch (err) {
      console.error('Erreur création:', err);
    }
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
    if (window.confirm('Supprimer cette équipe ?')) {
      try {
        await equipeService.delete(id);
        loadData();
      } catch (err) {
        console.error('Erreur suppression:', err);
      }
    }
  };

  const getProjetNom = (id: number) => projets.find((p) => p.id === id)?.nom || '-';

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
        <Button onClick={() => { setNewEquipeNom(''); setNewEquipeProjetId(projets[0]?.id || 0); setShowCreateModal(true); }}>
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
                    onClick={() => { setSelectedEquipe(equipe); setSelectedEmployeId(employes[0]?.id || 0); setShowAddMemberModal(true); }}
                    className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50"
                    title="Ajouter un membre"
                  >
                    <HiOutlineUserAdd size={18} />
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
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary-50 text-secondary-500 text-theme-xs font-semibold dark:bg-secondary-500/[0.12] dark:text-secondary-400">
                            {membre.prenom[0]}{membre.nom[0]}
                          </div>
                          <span className="text-theme-sm text-gray-700 dark:text-gray-300">
                            {membre.prenom} {membre.nom}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(equipe.id, membre.id)}
                          className="rounded p-1 text-error-400 hover:text-error-500 hover:bg-error-50"
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

      {/* Create Equipe Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nouvelle équipe">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Nom de l'équipe</label>
            <input
              type="text"
              value={newEquipeNom}
              onChange={(e) => setNewEquipeNom(e.target.value)}
              className={inputClass}
              placeholder="Ex: Équipe Design"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Projet</label>
            <select
              value={newEquipeProjetId}
              onChange={(e) => setNewEquipeProjetId(Number(e.target.value))}
              className={inputClass}
            >
              {projets.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Annuler</Button>
            <Button onClick={handleCreate}>Créer</Button>
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
                <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddMemberModal(false)}>Annuler</Button>
            <Button onClick={handleAddMember}>
              <HiOutlineUserAdd size={16} /> Ajouter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EquipesPage;
