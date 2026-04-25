import React, { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineShieldCheck } from 'react-icons/hi';
import { roleService } from '../api/roleService';
import { RoleDTO, PermissionDTO } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

const RolesPage: React.FC = () => {
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionDTO[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const [formNom, setFormNom] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        roleService.getAll(),
        roleService.getAllPermissions(),
      ]);
      setRoles(rolesRes.data.data || []);
      const filteredPermissions = (permsRes.data.data || []).filter((perm) => {
        const permissionCode = perm.permission?.toLowerCase?.() || '';
        const permissionLabel = perm.label?.toLowerCase?.() || '';
        return !permissionCode.includes('papier') && !permissionLabel.includes('papier');
      });
      setAllPermissions(filteredPermissions);
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingRole(null);
    setFormNom('');
    setSelectedPermissionIds(new Set());
    setShowModal(true);
  };

  const openEdit = (role: RoleDTO) => {
    setEditingRole(role);
    setFormNom(role.nom);
    setSelectedPermissionIds(new Set(role.permissions.map((p) => p.id)));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formNom.trim()) return;
    try {
      const request = {
        nom: formNom,
        permissionIds: Array.from(selectedPermissionIds),
      };

      if (editingRole) {
        await roleService.update(editingRole.id, request);
      } else {
        await roleService.create(request);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    }
  };

  const handleDelete = async (id: number) => {
    confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?', async () => {
      try {
        await roleService.delete(id);
        loadData();
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        alert(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }, 'Supprimer le rôle');
  };

  const togglePermission = (permId: number) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedPermissionIds.size === allPermissions.length) {
      setSelectedPermissionIds(new Set());
    } else {
      setSelectedPermissionIds(new Set(allPermissions.map((p) => p.id)));
    }
  };

  const columns = [
    {
      key: 'nom',
      label: 'Nom du rôle',
      render: (item: RoleDTO) => (
        <div className="flex items-center gap-2">
          <HiOutlineShieldCheck size={18} className="text-brand-500" />
          <span className="font-semibold text-gray-800 dark:text-white">{item.nom}</span>
        </div>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (item: RoleDTO) => (
        <div className="flex flex-wrap gap-1 max-w-md">
          {item.permissions?.length > 0 ? (
            item.permissions.map((p) => (
              <Badge key={p.id} variant="light" color="primary">{p.label}</Badge>
            ))
          ) : (
            <span className="text-gray-400 text-theme-sm">Aucune permission</span>
          )}
        </div>
      ),
    },
    {
      key: 'nbPermissions',
      label: 'Nb permissions',
      render: (item: RoleDTO) => (
        <span className="text-theme-sm text-gray-600 dark:text-gray-300">
          {item.permissions?.length || 0} / {allPermissions.length}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: RoleDTO) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-500 transition-colors" title="Modifier">
            <HiOutlinePencil size={16} />
          </button>
          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-error-50 text-error-500 transition-colors" title="Supprimer">
            <HiOutlineTrash size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Gestion des Rôles</h1>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">Définir les rôles et leurs permissions d'accès aux vues</p>
        </div>
        <Button onClick={openCreate}>
          <HiOutlinePlus size={18} /> Nouveau rôle
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Chargement...</div>
      ) : (
        <DataTable columns={columns} data={roles} />
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRole ? 'Modifier le rôle' : 'Nouveau rôle'} size="md">
        <div className="space-y-5">
          {/* Role name */}
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du rôle</label>
            <input
              type="text"
              value={formNom}
              onChange={(e) => setFormNom(e.target.value)}
              placeholder="Ex: ADMIN, MANAGER, EMPLOYE..."
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
            />
          </div>

          {/* Permissions checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Permissions (vues accessibles)</label>
              <button
                type="button"
                onClick={selectAll}
                className="text-theme-xs text-brand-500 hover:text-brand-600 transition-colors"
              >
                {selectedPermissionIds.size === allPermissions.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              {allPermissions.map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissionIds.has(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
                  />
                  <div>
                    <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">{perm.label}</span>
                    <span className="text-theme-xs text-gray-400 ml-2">({perm.permission})</span>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-theme-xs text-gray-400 mt-1">
              {selectedPermissionIds.size} permission(s) sélectionnée(s) sur {allPermissions.length}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={!formNom.trim()}>
            {editingRole ? 'Modifier' : 'Créer'}
          </Button>
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

export default RolesPage;
