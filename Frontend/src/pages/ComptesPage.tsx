import React, { useEffect, useState } from 'react';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { compteService } from '../api/compteService';
import { roleService } from '../api/roleService';
import { Compte } from '../types';

const ComptesPage: React.FC = () => {
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [roles, setRoles] = useState<{ id: number; nom: string }[]>([]);
  const [editModal, setEditModal] = useState(false);
  const [selectedCompte, setSelectedCompte] = useState<Compte | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');

  const loadComptes = async () => {
    try {
      const response = await compteService.getAll();
      setComptes(response.data.data || []);
    } catch (err) {
      console.error('Erreur chargement comptes:', err);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await roleService.getAll();
      setRoles(response.data.data || []);
    } catch (err) {
      console.error('Erreur chargement rôles:', err);
    }
  };

  useEffect(() => {
    loadComptes();
    loadRoles();
  }, []);

  const handleEdit = (compte: Compte) => {
    setSelectedCompte(compte);
    setSelectedRoleId(roles.length > 0 ? roles[0].id : '');
    setEditModal(true);
  };

  const handleToggle = async (id: number) => {
    try {
      await compteService.toggle(id);
      loadComptes();
    } catch (err) {
      console.error('Erreur toggle compte:', err);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedCompte || !selectedRoleId) return;
    try {
      await compteService.updateRole(selectedCompte.id, Number(selectedRoleId));
      setEditModal(false);
      loadComptes();
    } catch (err) {
      console.error('Erreur modification rôle:', err);
    }
  };

  const columns = [
    { key: 'id', label: '#' },
    { key: 'username', label: 'Username' },
    {
      key: 'roles',
      label: 'Rôles',
      render: (c: Compte) => c.roles.join(', '),
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (c: Compte) => (
        <Badge text={c.enabled ? 'Actif' : 'Inactif'} variant={c.enabled ? 'success' : 'danger'} />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (c: Compte) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleEdit(c)}>
            Modifier rôle
          </Button>
          <Button
            size="sm"
            variant={c.enabled ? 'outline' : 'primary'}
            onClick={() => handleToggle(c.id)}
          >
            {c.enabled ? 'Désactiver' : 'Activer'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Gestion des Comptes</h1>
      <DataTable columns={columns} data={comptes} />

      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Modifier le rôle">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Compte: <strong>{selectedCompte?.username}</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rôle</label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveRole}>Enregistrer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ComptesPage;
