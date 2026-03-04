import React, { useEffect, useState } from 'react';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { roleService } from '../api/roleService';

interface Permission {
  id: number;
  permission: string;
  label: string;
}

interface Role {
  id: number;
  nom: string;
  permissions: Permission[];
}

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modal, setModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form, setForm] = useState({ nom: '', permissionIds: new Set<number>() });

  const loadRoles = async () => {
    try {
      const response = await roleService.getAll();
      setRoles(response.data.data || []);
    } catch (err) {
      console.error('Erreur chargement rôles:', err);
    }
  };

  const loadPermissions = async () => {
    try {
      const response = await roleService.getAllPermissions();
      setPermissions(response.data.data || []);
    } catch (err) {
      console.error('Erreur chargement permissions:', err);
    }
  };

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const openCreate = () => {
    setEditingRole(null);
    setForm({ nom: '', permissionIds: new Set() });
    setModal(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setForm({
      nom: role.nom,
      permissionIds: new Set(role.permissions.map((p) => p.id)),
    });
    setModal(true);
  };

  const togglePermission = (id: number) => {
    setForm((prev) => {
      const next = new Set(prev.permissionIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, permissionIds: next };
    });
  };

  const handleSave = async () => {
    try {
      const payload = { nom: form.nom, permissionIds: Array.from(form.permissionIds) };
      if (editingRole) {
        await roleService.update(editingRole.id, payload);
      } else {
        await roleService.create(payload);
      }
      setModal(false);
      loadRoles();
    } catch (err) {
      console.error('Erreur sauvegarde rôle:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce rôle ?')) return;
    try {
      await roleService.delete(id);
      loadRoles();
    } catch (err) {
      console.error('Erreur suppression rôle:', err);
    }
  };

  const columns = [
    { key: 'id', label: '#' },
    { key: 'nom', label: 'Nom' },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (r: Role) => r.permissions.map((p) => p.label).join(', '),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r: Role) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => openEdit(r)}>Modifier</Button>
          <Button size="sm" variant="outline" onClick={() => handleDelete(r.id)}>Supprimer</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestion des Rôles</h1>
        <Button onClick={openCreate}>Nouveau rôle</Button>
      </div>
      <DataTable columns={columns} data={roles} />

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editingRole ? 'Modifier le rôle' : 'Nouveau rôle'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Permissions</label>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {permissions.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.permissionIds.has(p.id)}
                    onChange={() => togglePermission(p.id)}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModal(false)}>Annuler</Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RolesPage;
