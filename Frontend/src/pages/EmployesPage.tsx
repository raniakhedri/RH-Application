import React, { useState, useEffect, useRef } from 'react';
import { HiOutlinePlus, HiOutlineSearch, HiOutlinePencil, HiOutlineTrash, HiOutlinePhotograph } from 'react-icons/hi';
import { employeService } from '../api/employeService';
import { referentielService } from '../api/referentielService';
import { roleService } from '../api/roleService';
import { compteService } from '../api/compteService';
import { Employe, Referentiel, RoleDTO } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';

const EmployesPage: React.FC = () => {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmploye, setEditingEmploye] = useState<Employe | null>(null);
  const [loading, setLoading] = useState(true);

  // Referentiel lists
  const [departements, setDepartements] = useState<Referentiel[]>([]);
  const [postes, setPostes] = useState<Referentiel[]>([]);
  const [typesContrat, setTypesContrat] = useState<Referentiel[]>([]);
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [managers, setManagers] = useState<Employe[]>([]);

  const [formData, setFormData] = useState({
    cin: '', cnss: '', nom: '', prenom: '', email: '', telephone: '',
    telephonePro: '', salaire: '' as string | number,
    dateEmbauche: '', soldeConge: 0, poste: '', typeContrat: '', genre: '',
    departement: '', ribBancaire: '', managerId: null as number | null,
    useInitialSolde: false, soldeCongeInitial: '' as string | number,
  });

  // Compte creation (only for new employee)
  const [createCompte, setCreateCompte] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string; email: string } | null>(null);

  // Image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [empRes, depRes, postRes, contratRes, rolesRes] = await Promise.all([
        employeService.getAll(),
        referentielService.getByType('DEPARTEMENT'),
        referentielService.getByType('POSTE'),
        referentielService.getByType('TYPE_CONTRAT'),
        roleService.getAll(),
      ]);
      setEmployes(empRes.data.data || []);
      setDepartements((depRes.data.data || []).filter((r: Referentiel) => r.actif));
      setPostes((postRes.data.data || []).filter((r: Referentiel) => r.actif));
      setTypesContrat((contratRes.data.data || []).filter((r: Referentiel) => r.actif));
      setRoles(rolesRes.data.data || []);
      try {
        const managersRes = await employeService.getByRole('MANAGER');
        setManagers(managersRes.data.data || []);
      } catch { setManagers([]); }
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Clean empty strings to null for backend
      const payload: any = { ...formData };
      if (!payload.dateEmbauche) payload.dateEmbauche = null;
      if (!payload.genre) payload.genre = null;
      if (!payload.cin) payload.cin = null;
      if (!payload.cnss) payload.cnss = null;
      if (!payload.telephone) payload.telephone = null;
      if (!payload.telephonePro) payload.telephonePro = null;
      if (payload.salaire === '' || payload.salaire === null) payload.salaire = null; else payload.salaire = Number(payload.salaire);
      if (!payload.poste) payload.poste = null;
      if (!payload.typeContrat) payload.typeContrat = null;
      if (!payload.departement) payload.departement = null;
      if (!payload.ribBancaire) payload.ribBancaire = null;

      // Initial solde congé
      if (payload.useInitialSolde && payload.soldeCongeInitial !== '' && payload.soldeCongeInitial !== null) {
        payload.soldeCongeInitial = Number(payload.soldeCongeInitial);
      } else {
        payload.soldeCongeInitial = null;
        payload.useInitialSolde = false;
      }

      if (editingEmploye) {
        await employeService.update(editingEmploye.id, payload);
        // Upload image if selected
        if (imageFile) {
          await employeService.uploadImage(editingEmploye.id, imageFile);
        }
      } else {
        // Create employee
        const res = await employeService.create(payload);
        const newEmploye = res.data.data;

        // Upload image if selected
        if (imageFile && newEmploye?.id) {
          await employeService.uploadImage(newEmploye.id, imageFile);
        }

        // If "create account" is checked, create a compte + assign role
        if (createCompte && selectedRoleId && newEmploye?.id) {
          try {
            const compteRes = await compteService.create({ employeId: newEmploye.id, roleId: selectedRoleId });
            const newCompte = compteRes.data.data;
            if (newCompte) {
              setCredentials({
                username: newCompte.username,
                password: newCompte.generatedPassword || '(envoyé par email)',
                email: newCompte.employeEmail,
              });
              setShowCredentialsModal(true);
            }
          } catch (compteErr) {
            console.error('Employé créé mais erreur création compte:', compteErr);
          }
        }
      }
      setShowModal(false);
      setEditingEmploye(null);
      resetForm();
      loadAll();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur inconnue';
      console.error('Erreur sauvegarde:', msg, err?.response?.data);
      alert('Erreur : ' + msg);
    }
  };

  const handleEdit = (employe: Employe) => {
    setEditingEmploye(employe);
    setFormData({
      cin: employe.cin || '', cnss: employe.cnss || '',
      nom: employe.nom, prenom: employe.prenom, email: employe.email,
      telephone: employe.telephone || '', telephonePro: employe.telephonePro || '',
      salaire: employe.salaire ?? '',
      dateEmbauche: employe.dateEmbauche || '',
      soldeConge: employe.soldeConge, poste: employe.poste || '',
      typeContrat: employe.typeContrat || '', genre: employe.genre || '',
      departement: employe.departement || '', ribBancaire: employe.ribBancaire || '',
      managerId: employe.managerId,
      useInitialSolde: employe.soldeCongeInitial != null, soldeCongeInitial: employe.soldeCongeInitial ?? '',
    });
    setCreateCompte(false);
    setSelectedRoleId(0);
    setShowModal(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("L'image ne doit pas dépasser 5 Mo");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      try {
        await employeService.delete(id);
        loadAll();
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Impossible de supprimer cet employé.';
        alert(msg);
        console.error('Erreur suppression:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      cin: '', cnss: '', nom: '', prenom: '', email: '', telephone: '',
      telephonePro: '', salaire: '',
      dateEmbauche: '', soldeConge: 0, poste: '', typeContrat: '', genre: '',
      departement: '', ribBancaire: '', managerId: null,
      useInitialSolde: false, soldeCongeInitial: '',
    });
    setCreateCompte(false);
    setSelectedRoleId(0);
    setImageFile(null);
    setImagePreview(null);
  };

  const filteredEmployes = employes.filter(
    (e) =>
      e.nom.toLowerCase().includes(search.toLowerCase()) ||
      e.prenom.toLowerCase().includes(search.toLowerCase()) ||
      e.matricule.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      (e.poste && e.poste.toLowerCase().includes(search.toLowerCase())) ||
      (e.departement && e.departement.toLowerCase().includes(search.toLowerCase()))
  );

  const columns = [
    { key: 'matricule', label: 'Matricule' },
    {
      key: 'nom',
      label: 'Nom complet',
      render: (item: Employe) => (
        <div className="flex items-center gap-3">
          {item.imageUrl ? (
            <img src={`http://localhost:8080${item.imageUrl}`} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary-50 text-secondary-500 dark:bg-secondary-500/[0.12] dark:text-secondary-400 flex items-center justify-center text-xs font-semibold">
              {item.prenom[0]}{item.nom[0]}
            </div>
          )}
          <div>
            <span className="font-medium">{item.prenom} {item.nom}</span>
            {item.genre && <span className="text-theme-xs text-gray-400 ml-1">({item.genre})</span>}
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    { key: 'poste', label: 'Poste', render: (item: Employe) => item.poste || '—' },
    { key: 'departement', label: 'Département', render: (item: Employe) => item.departement || '—' },
    {
      key: 'typeContrat',
      label: 'Contrat',
      render: (item: Employe) => item.typeContrat ? <Badge variant="light" color="primary">{item.typeContrat}</Badge> : <span>—</span>,
    },
    { key: 'soldeConge', label: 'Solde congé', render: (item: Employe) => <span>{item.soldeConge} jours</span> },
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

  const inputClass = "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300";
  const inputErrorClass = "h-11 w-full rounded-lg border border-error-500 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-error-300 focus:outline-none focus:ring focus:ring-error-500/10 dark:border-error-500 dark:text-gray-300";
  const selectClass = inputClass + " dark:bg-gray-800";

  // Validation helpers
  const onlyDigits = (value: string) => value.replace(/[^0-9]/g, '');
  const onlyLetters = (value: string) => value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '');
  const isValidEmail = (email: string) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const formErrors = {
    nom: !formData.nom.trim(),
    prenom: !formData.prenom.trim(),
    email: !formData.email.trim() || !isValidEmail(formData.email),
    cin: !!formData.cin && formData.cin.length !== 8,
    cnss: !!formData.cnss && (formData.cnss.length < 8 || formData.cnss.length > 12),
    ribBancaire: !!formData.ribBancaire && formData.ribBancaire.length !== 20,
    telephonePro: !!formData.telephonePro && !/^[0-9]+$/.test(formData.telephonePro),
  };
  const hasErrors = formErrors.nom || formErrors.prenom || formErrors.email || formErrors.cin || formErrors.cnss || formErrors.ribBancaire || formErrors.telephonePro;

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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingEmploye ? "Modifier l'employé" : 'Nouvel employé'} size="lg">
        {/* Image Upload */}
        <div className="flex items-center gap-5 mb-6 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-20 h-20 rounded-2xl overflow-hidden cursor-pointer group shrink-0 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-brand-400 transition-colors"
          >
            {imagePreview || editingEmploye?.imageUrl ? (
              <img
                src={imagePreview || `http://localhost:8080${editingEmploye?.imageUrl}`}
                alt="Photo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700">
                <HiOutlinePhotograph className="text-gray-400" size={24} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <HiOutlinePhotograph className="text-white" size={22} />
            </div>
          </div>
          <div>
            <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">Photo de l'employé</p>
            <p className="text-theme-xs text-gray-400 mt-0.5">JPG, PNG — Max 5 Mo</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-theme-xs text-brand-500 hover:text-brand-600 font-medium"
            >
              {imagePreview || editingEmploye?.imageUrl ? 'Changer la photo' : 'Ajouter une photo'}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {editingEmploye && (
            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Matricule (login)</label>
              <input type="text" value={editingEmploye.matricule} disabled className={inputClass + ' bg-gray-100 dark:bg-gray-700 cursor-not-allowed'} />
            </div>
          )}
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CIN</label>
            <input type="text" value={formData.cin} onChange={(e) => setFormData({ ...formData, cin: onlyDigits(e.target.value).slice(0, 8) })} placeholder="8 chiffres" maxLength={8} className={formErrors.cin ? inputErrorClass : inputClass} />
            {formErrors.cin && <p className="text-theme-xs text-error-500 mt-1">Le CIN doit contenir exactement 8 chiffres</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNSS</label>
            <input type="text" value={formData.cnss} onChange={(e) => setFormData({ ...formData, cnss: onlyDigits(e.target.value).slice(0, 12) })} placeholder="8 à 12 chiffres" maxLength={12} className={formErrors.cnss ? inputErrorClass : inputClass} />
            {formErrors.cnss && <p className="text-theme-xs text-error-500 mt-1">Le CNSS doit contenir entre 8 et 12 chiffres</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Genre</label>
            <select value={formData.genre} onChange={(e) => setFormData({ ...formData, genre: e.target.value })} className={selectClass}>
              <option value="">Sélectionner</option>
              <option value="HOMME">Homme</option>
              <option value="FEMME">Femme</option>
            </select>
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom *</label>
            <input type="text" value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: onlyLetters(e.target.value) })} placeholder="Lettres uniquement" className={formErrors.prenom && formData.prenom !== undefined ? inputErrorClass : inputClass} />
            {formErrors.prenom && <p className="text-theme-xs text-error-500 mt-1">Le prénom est obligatoire</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
            <input type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: onlyLetters(e.target.value) })} placeholder="Lettres uniquement" className={formErrors.nom && formData.nom !== undefined ? inputErrorClass : inputClass} />
            {formErrors.nom && <p className="text-theme-xs text-error-500 mt-1">Le nom est obligatoire</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="exemple@email.com" className={formErrors.email && formData.email !== undefined ? inputErrorClass : inputClass} />
            {formErrors.email && formData.email && <p className="text-theme-xs text-error-500 mt-1">Format email invalide</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
            <input type="text" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: onlyDigits(e.target.value) })} placeholder="Chiffres uniquement" className={inputClass} />
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone professionnel</label>
            <input type="text" value={formData.telephonePro} onChange={(e) => setFormData({ ...formData, telephonePro: onlyDigits(e.target.value) })} placeholder="Chiffres uniquement" className={formErrors.telephonePro ? inputErrorClass : inputClass} />
            {formErrors.telephonePro && <p className="text-theme-xs text-error-500 mt-1">Le téléphone professionnel doit contenir uniquement des chiffres</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Poste</label>
            <select value={formData.poste} onChange={(e) => setFormData({ ...formData, poste: e.target.value })} className={selectClass}>
              <option value="">Sélectionner un poste</option>
              {postes.map((p) => (
                <option key={p.id} value={p.libelle}>{p.libelle}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Département</label>
            <select value={formData.departement} onChange={(e) => setFormData({ ...formData, departement: e.target.value })} className={selectClass}>
              <option value="">Sélectionner un département</option>
              {departements.map((d) => (
                <option key={d.id} value={d.libelle}>{d.libelle}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type contrat</label>
            <select value={formData.typeContrat} onChange={(e) => setFormData({ ...formData, typeContrat: e.target.value })} className={selectClass}>
              <option value="">Sélectionner un type</option>
              {typesContrat.map((t) => (
                <option key={t.id} value={t.libelle}>{t.libelle}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RIB Bancaire</label>
            <input type="text" value={formData.ribBancaire} onChange={(e) => setFormData({ ...formData, ribBancaire: onlyDigits(e.target.value).slice(0, 20) })} placeholder="20 chiffres" maxLength={20} className={formErrors.ribBancaire ? inputErrorClass : inputClass} />
            {formErrors.ribBancaire && <p className="text-theme-xs text-error-500 mt-1">Le RIB doit contenir exactement 20 chiffres</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date d'embauche</label>
            <input type="date" value={formData.dateEmbauche} onChange={(e) => setFormData({ ...formData, dateEmbauche: e.target.value })} className={inputClass} />
          </div>

          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salaire</label>
            <input type="number" min="0" step="0.01" value={formData.salaire} onChange={(e) => setFormData({ ...formData, salaire: e.target.value })} placeholder="Montant en DT" className={inputClass} />
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manager</label>
            <select value={formData.managerId ?? ''} onChange={(e) => setFormData({ ...formData, managerId: e.target.value ? Number(e.target.value) : null })} className={selectClass}>
              <option value="">Aucun manager</option>
              {managers.filter(m => m.id !== editingEmploye?.id).map((m) => (
                <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Solde congé initial */}
        <div className="mt-5 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.useInitialSolde}
                onChange={(e) => {
                  setFormData({ ...formData, useInitialSolde: e.target.checked, soldeCongeInitial: e.target.checked ? formData.soldeCongeInitial : '' });
                }}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
              />
              <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                Définir le solde congé manuellement
              </span>
            </label>
            {formData.useInitialSolde && (
              <div className="mt-3">
                <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Solde congé actuel (jours)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.soldeCongeInitial}
                  onChange={(e) => setFormData({ ...formData, soldeCongeInitial: e.target.value })}
                  placeholder="Ex: 10"
                  className={inputClass}
                />
                <p className="text-theme-xs text-gray-400 mt-1">
                  Saisissez le solde congé actuel de l'employé. Le calcul automatique basé sur la date d'embauche sera désactivé.
                </p>
              </div>
            )}
          </div>

        {/* Compte + Role assignment (only for new employee) */}
        {!editingEmploye && (
          <div className="mt-5 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={createCompte}
                onChange={(e) => { setCreateCompte(e.target.checked); if (!e.target.checked) setSelectedRoleId(0); }}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
              />
              <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                Créer un compte utilisateur et lui affecter un rôle
              </span>
            </label>
            {createCompte && (
              <div className="mt-3">
                <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rôle à affecter *</label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                  className={selectClass}
                >
                  <option value={0}>Sélectionner un rôle</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.nom}</option>
                  ))}
                </select>
                <p className="text-theme-xs text-gray-400 mt-1">
                  Le matricule (généré automatiquement à partir du département) sera utilisé comme login. Le mot de passe sera généré et envoyé par email.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setShowModal(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={hasErrors || (createCompte && !selectedRoleId)}>
            {editingEmploye ? 'Modifier' : 'Créer'}
          </Button>
        </div>
      </Modal>

      {/* Credentials Modal */}
      <Modal isOpen={showCredentialsModal} onClose={() => setShowCredentialsModal(false)} title="✅ Compte créé avec succès" size="md">
        {credentials && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-theme-sm text-green-800 dark:text-green-300 font-medium mb-3">
                Les identifiants de connexion ont été générés :
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-theme-sm text-gray-600 dark:text-gray-400 w-32">Login (matricule) :</span>
                  <code className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm font-mono font-bold text-brand-600 dark:text-brand-400">
                    {credentials.username}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-theme-sm text-gray-600 dark:text-gray-400 w-32">Mot de passe :</span>
                  <code className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm font-mono font-bold text-brand-600 dark:text-brand-400">
                    {credentials.password}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-theme-sm text-gray-600 dark:text-gray-400 w-32">Email :</span>
                  <span className="text-theme-sm text-gray-700 dark:text-gray-300">{credentials.email}</span>
                </div>
              </div>
            </div>
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              ⚠️ Ces identifiants ont été envoyés par email à l'employé. Notez-les si nécessaire, ils ne seront plus visibles après fermeture.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setShowCredentialsModal(false)}>Fermer</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EmployesPage;
