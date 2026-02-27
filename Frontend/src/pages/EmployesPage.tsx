import React, { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineSearch, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { employeService } from '../api/employeService';
import { Employe } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import DataTable from '../components/ui/DataTable';

const EmployesPage: React.FC = () => {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmploye, setEditingEmploye] = useState<Employe | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    matricule: '', cin: '', nom: '', prenom: '', email: '', telephone: '', dateEmbauche: '', soldeConge: 0, sexe: '' as string, managerId: null as number | null,
  });

  useEffect(() => {
    loadEmployes();
  }, []);

  const loadEmployes = async () => {
    try {
      const response = await employeService.getAll();
      setEmployes(response.data.data || []);
    } catch (err) {
      console.error('Erreur chargement employés:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingEmploye) {
        await employeService.update(editingEmploye.id, formData);
      } else {
        await employeService.create(formData);
      }
      setShowModal(false);
      setEditingEmploye(null);
      resetForm();
      loadEmployes();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    }
  };

  const handleEdit = (employe: Employe) => {
    setEditingEmploye(employe);
    setFormData({
      matricule: employe.matricule, cin: employe.cin, nom: employe.nom, prenom: employe.prenom,
      email: employe.email, telephone: employe.telephone, dateEmbauche: employe.dateEmbauche,
      soldeConge: employe.soldeConge, sexe: employe.sexe || '', managerId: employe.managerId,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      try {
        await employeService.delete(id);
        loadEmployes();
      } catch (err) {
        console.error('Erreur suppression:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({ matricule: '', cin: '', nom: '', prenom: '', email: '', telephone: '', dateEmbauche: '', soldeConge: 0, sexe: '', managerId: null });
  };

  const filteredEmployes = employes.filter(
    (e) =>
      e.nom.toLowerCase().includes(search.toLowerCase()) ||
      e.prenom.toLowerCase().includes(search.toLowerCase()) ||
      e.matricule.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'matricule', label: 'Matricule' },
    {
      key: 'nom',
      label: 'Nom complet',
      render: (item: Employe) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary-50 text-secondary-500 dark:bg-secondary-500/[0.12] dark:text-secondary-400 flex items-center justify-center text-xs font-semibold">
            {item.prenom[0]}{item.nom[0]}
          </div>
          <span>{item.prenom} {item.nom}</span>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'soldeConge', label: 'Solde congé', render: (item: Employe) => <span>{item.soldeConge} jours</span> },
    {
      key: 'sexe',
      label: 'Sexe',
      render: (item: Employe) => <span>{item.sexe === 'HOMME' ? 'Homme' : item.sexe === 'FEMME' ? 'Femme' : '-'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: Employe) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-500 transition-colors">
            <HiOutlinePencil size={16} />
          </button>
          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-error-50 text-error-500 transition-colors">
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
          <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Employés</h1>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">Gérer les employés de l'agence</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingEmploye(null); setShowModal(true); }}>
          <HiOutlinePlus size={18} /> Ajouter un employé
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un employé..."
          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent pl-10 pr-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Chargement...</div>
      ) : (
        <DataTable columns={columns} data={filteredEmployes} />
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingEmploye ? 'Modifier l\'employé' : 'Nouvel employé'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Matricule</label>
            <input type="text" value={formData.matricule} onChange={(e) => setFormData({ ...formData, matricule: e.target.value })} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CIN</label>
            <input type="text" value={formData.cin} onChange={(e) => setFormData({ ...formData, cin: e.target.value })} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom</label>
            <input type="text" value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
            <input type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
            <input type="text" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date d'embauche</label>
            <input type="date" value={formData.dateEmbauche} onChange={(e) => setFormData({ ...formData, dateEmbauche: e.target.value })} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Solde congé</label>
            <input type="number" value={formData.soldeConge} onChange={(e) => setFormData({ ...formData, soldeConge: Number(e.target.value) })} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sexe</label>
            <select value={formData.sexe} onChange={(e) => setFormData({ ...formData, sexe: e.target.value })} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300">
              <option value="">-- Sélectionner --</option>
              <option value="HOMME">Homme</option>
              <option value="FEMME">Femme</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
          <Button onClick={handleSave}>{editingEmploye ? 'Modifier' : 'Créer'}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default EmployesPage;
