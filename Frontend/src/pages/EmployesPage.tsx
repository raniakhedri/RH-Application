import React, { useState, useEffect, useRef } from 'react';
import { HiOutlinePlus, HiOutlineSearch, HiOutlinePencil, HiOutlineTrash, HiOutlinePhotograph } from 'react-icons/hi';
import { employeService } from '../api/employeService';
import { referentielService } from '../api/referentielService';
import { Employe, Referentiel } from '../types';
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
    cin: '', cnss: '', nom: '', prenom: '', email: '', telephone: '',
    dateEmbauche: '', soldeConge: 30, poste: '', typeContrat: '', genre: '',
    departement: '', ribBancaire: '', salaireBase: '' as string | number, managerId: null as number | null,
  });

  // Server error
  const [serverError, setServerError] = useState<string | null>(null);

  // Image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Referentiel data
  const [postes, setPostes] = useState<Referentiel[]>([]);
  const [departements, setDepartements] = useState<Referentiel[]>([]);
  const [typesContrat, setTypesContrat] = useState<Referentiel[]>([]);

  // Track whether user has attempted to submit (to show errors)
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadEmployes();
    loadReferentiels();
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

  const loadReferentiels = async () => {
    try {
      const [postesRes, depRes, contratRes] = await Promise.all([
        referentielService.getActiveByType('POSTE'),
        referentielService.getActiveByType('DEPARTEMENT'),
        referentielService.getActiveByType('TYPE_CONTRAT'),
      ]);
      setPostes(postesRes.data.data || []);
      setDepartements(depRes.data.data || []);
      setTypesContrat(contratRes.data.data || []);
    } catch (err) {
      console.error('Erreur chargement référentiels:', err);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La taille de l\'image ne doit pas dépasser 5 Mo');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSubmitted(true);
    setServerError(null);
    const errors = validate();
    if (Object.keys(errors).length > 0) return;

    try {
      const payload: any = { ...formData, salaireBase: Number(formData.salaireBase) };

      if (editingEmploye) {
        await employeService.update(editingEmploye.id, payload);
        if (imageFile) {
          await employeService.uploadImage(editingEmploye.id, imageFile);
        }
      } else {
        const res = await employeService.create(payload);
        if (imageFile && res.data.data?.id) {
          await employeService.uploadImage(res.data.data.id, imageFile);
        }
      }
      setShowModal(false);
      setEditingEmploye(null);
      resetForm();
      loadEmployes();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur inconnue';
      console.error('Erreur sauvegarde:', msg, err?.response?.data);
      setServerError(msg);
    }
  };

  const handleEdit = (employe: Employe) => {
    setEditingEmploye(employe);
    setFormData({
      cin: employe.cin || '', cnss: employe.cnss || '',
      nom: employe.nom, prenom: employe.prenom, email: employe.email,
      telephone: employe.telephone || '', dateEmbauche: employe.dateEmbauche || '',
      soldeConge: employe.soldeConge, poste: employe.poste || '',
      typeContrat: employe.typeContrat || '', genre: employe.genre || '',
      departement: employe.departement || '', ribBancaire: employe.ribBancaire || '',
      salaireBase: employe.salaireBase ?? '',
      managerId: employe.managerId,
    });
    setImagePreview(null);
    setImageFile(null);
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
    setFormData({
      cin: '', cnss: '', nom: '', prenom: '', email: '', telephone: '',
      dateEmbauche: '', soldeConge: 30, poste: '', typeContrat: '', genre: '',
      departement: '', ribBancaire: '', salaireBase: '', managerId: null,
    });
    setImageFile(null);
    setImagePreview(null);
    setSubmitted(false);
    setServerError(null);
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
  const selectErrorClass = inputErrorClass + " dark:bg-gray-800";

  // Validation helpers
  const onlyDigits = (value: string) => value.replace(/[^0-9]/g, '');
  const onlyLetters = (value: string) => value.replace(/[^a-zA-ZÀ-ÿ\u0600-\u06FF\s'-]/g, '');
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Full validation rules
  const validate = () => {
    const errors: Record<string, string> = {};
    const d = formData;

    if (!d.cin.trim()) errors.cin = 'Le CIN est obligatoire.';
    else if (!/^\d{8}$/.test(d.cin)) errors.cin = 'Le CIN doit contenir exactement 8 chiffres.';

    if (!d.cnss.trim()) errors.cnss = 'Le numéro CNSS est obligatoire.';
    else if (!/^\d{8,12}$/.test(d.cnss)) errors.cnss = 'Numéro CNSS invalide (8 à 12 chiffres).';

    if (!d.prenom.trim()) errors.prenom = 'Le prénom est obligatoire.';
    else if (d.prenom.trim().length < 2) errors.prenom = 'Le prénom doit contenir au moins 2 caractères.';
    else if (d.prenom.trim().length > 50) errors.prenom = 'Le prénom ne doit pas dépasser 50 caractères.';
    else if (!/^[a-zA-ZÀ-ÿ\u0600-\u06FF\s'-]+$/.test(d.prenom)) errors.prenom = 'Le prénom doit contenir uniquement des lettres.';

    if (!d.nom.trim()) errors.nom = 'Le nom est obligatoire.';
    else if (d.nom.trim().length < 2) errors.nom = 'Le nom doit contenir au moins 2 caractères.';
    else if (d.nom.trim().length > 50) errors.nom = 'Le nom ne doit pas dépasser 50 caractères.';
    else if (!/^[a-zA-ZÀ-ÿ\u0600-\u06FF\s'-]+$/.test(d.nom)) errors.nom = 'Le nom doit contenir uniquement des lettres.';

    if (!d.email.trim()) errors.email = "L'email est obligatoire.";
    else if (d.email.length < 5) errors.email = "L'email doit contenir au moins 5 caractères.";
    else if (d.email.length > 100) errors.email = "L'email ne doit pas dépasser 100 caractères.";
    else if (!isValidEmail(d.email)) errors.email = 'Format email invalide.';

    if (!d.telephone.trim()) errors.telephone = 'Le téléphone est obligatoire.';
    else if (!/^[24579]\d{7}$/.test(d.telephone)) errors.telephone = 'Numéro de téléphone tunisien invalide (8 chiffres, commence par 2, 4, 5, 7 ou 9).';

    if (!d.ribBancaire.trim()) errors.ribBancaire = 'Le RIB bancaire est obligatoire.';
    else if (!/^\d{20}$/.test(d.ribBancaire)) errors.ribBancaire = 'RIB invalide (20 chiffres obligatoires).';

    if (!d.genre) errors.genre = 'Le genre est obligatoire.';
    if (!d.departement) errors.departement = 'Le département est obligatoire.';
    if (!d.poste) errors.poste = 'Le poste est obligatoire.';
    if (!d.typeContrat) errors.typeContrat = 'Le type de contrat est obligatoire.';

    if (!d.dateEmbauche) errors.dateEmbauche = "La date d'embauche est obligatoire.";
    else {
      const dt = new Date(d.dateEmbauche);
      if (dt > new Date()) errors.dateEmbauche = "La date d'embauche ne peut pas être dans le futur.";
      else if (dt < new Date('2020-01-01')) errors.dateEmbauche = "La date d'embauche ne peut pas être avant 2020.";
    }

    const salaire = Number(d.salaireBase);
    if (d.salaireBase === '' || d.salaireBase === null || d.salaireBase === undefined) errors.salaireBase = 'Le salaire de base est obligatoire.';
    else if (isNaN(salaire) || salaire < 0) errors.salaireBase = 'Le salaire doit être un nombre positif.';
    else if (salaire > 99999) errors.salaireBase = 'Le salaire ne peut pas dépasser 99 999 TND.';

    return errors;
  };

  const formErrors = submitted ? validate() : {};

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

        {/* Server Error Banner */}
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30">
            <p className="text-theme-sm text-error-600 dark:text-error-400 font-medium">⚠️ {serverError}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CIN *</label>
            <input type="text" maxLength={8} value={formData.cin} onChange={(e) => setFormData({ ...formData, cin: onlyDigits(e.target.value).slice(0, 8) })} placeholder="8 chiffres" className={formErrors.cin ? inputErrorClass : inputClass} />
            {formErrors.cin && <p className="text-theme-xs text-error-500 mt-1">{formErrors.cin}</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNSS *</label>
            <input type="text" maxLength={12} value={formData.cnss} onChange={(e) => setFormData({ ...formData, cnss: onlyDigits(e.target.value).slice(0, 12) })} placeholder="8 à 12 chiffres" className={formErrors.cnss ? inputErrorClass : inputClass} />
            {formErrors.cnss && <p className="text-theme-xs text-error-500 mt-1">{formErrors.cnss}</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Genre *</label>
            <select value={formData.genre} onChange={(e) => setFormData({ ...formData, genre: e.target.value })} className={formErrors.genre ? selectErrorClass : selectClass}>
              <option value="">Sélectionner</option>
              <option value="HOMME">Homme</option>
              <option value="FEMME">Femme</option>
            </select>
            {formErrors.genre && <p className="text-theme-xs text-error-500 mt-1">{formErrors.genre}</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom *</label>
            <input type="text" maxLength={50} value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: onlyLetters(e.target.value) })} placeholder="Lettres uniquement" className={formErrors.prenom ? inputErrorClass : inputClass} />
            {formErrors.prenom && <p className="text-theme-xs text-error-500 mt-1">{formErrors.prenom}</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
            <input type="text" maxLength={50} value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: onlyLetters(e.target.value) })} placeholder="Lettres uniquement" className={formErrors.nom ? inputErrorClass : inputClass} />
            {formErrors.nom && <p className="text-theme-xs text-error-500 mt-1">{formErrors.nom}</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input type="email" maxLength={100} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="exemple@email.com" className={formErrors.email ? inputErrorClass : inputClass} />
            {formErrors.email && <p className="text-theme-xs text-error-500 mt-1">{formErrors.email}</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone *</label>
            <input type="text" maxLength={8} value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: onlyDigits(e.target.value).slice(0, 8) })} placeholder="8 chiffres (ex: 55123456)" className={formErrors.telephone ? inputErrorClass : inputClass} />
            {formErrors.telephone && <p className="text-theme-xs text-error-500 mt-1">{formErrors.telephone}</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Poste *</label>
            <select value={formData.poste} onChange={(e) => setFormData({ ...formData, poste: e.target.value })} className={formErrors.poste ? selectErrorClass : selectClass}>
              <option value="">Sélectionner un poste</option>
              {postes.map((p) => (
                <option key={p.id} value={p.libelle}>{p.libelle}</option>
              ))}
            </select>
            {formErrors.poste && <p className="text-theme-xs text-error-500 mt-1">{formErrors.poste}</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Département *</label>
            <select value={formData.departement} onChange={(e) => setFormData({ ...formData, departement: e.target.value })} className={formErrors.departement ? selectErrorClass : selectClass}>
              <option value="">Sélectionner un département</option>
              {departements.map((d) => (
                <option key={d.id} value={d.libelle}>{d.libelle}</option>
              ))}
            </select>
            {formErrors.departement && <p className="text-theme-xs text-error-500 mt-1">{formErrors.departement}</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type contrat *</label>
            <select value={formData.typeContrat} onChange={(e) => setFormData({ ...formData, typeContrat: e.target.value })} className={formErrors.typeContrat ? selectErrorClass : selectClass}>
              <option value="">Sélectionner un type</option>
              {typesContrat.map((t) => (
                <option key={t.id} value={t.libelle}>{t.libelle}</option>
              ))}
            </select>
            {formErrors.typeContrat && <p className="text-theme-xs text-error-500 mt-1">{formErrors.typeContrat}</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RIB Bancaire *</label>
            <input type="text" maxLength={20} value={formData.ribBancaire} onChange={(e) => setFormData({ ...formData, ribBancaire: onlyDigits(e.target.value).slice(0, 20) })} placeholder="20 chiffres" className={formErrors.ribBancaire ? inputErrorClass : inputClass} />
            {formErrors.ribBancaire && <p className="text-theme-xs text-error-500 mt-1">{formErrors.ribBancaire}</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date d'embauche *</label>
            <input type="date" value={formData.dateEmbauche} min="2020-01-01" max={new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, dateEmbauche: e.target.value })} className={formErrors.dateEmbauche ? inputErrorClass : inputClass} />
            {formErrors.dateEmbauche && <p className="text-theme-xs text-error-500 mt-1">{formErrors.dateEmbauche}</p>}
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salaire de base (TND) *</label>
            <input type="number" min="0" max="99999" step="0.01" value={formData.salaireBase} onChange={(e) => setFormData({ ...formData, salaireBase: e.target.value })} placeholder="Ex: 1500.00" className={formErrors.salaireBase ? inputErrorClass : inputClass} />
            {formErrors.salaireBase && <p className="text-theme-xs text-error-500 mt-1">{formErrors.salaireBase}</p>}
          </div>
          {editingEmploye && (
            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Solde congé (jours)</label>
              <input type="number" min="0" value={formData.soldeConge} onChange={(e) => setFormData({ ...formData, soldeConge: Number(e.target.value) })} className={inputClass} />
            </div>
          )}
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
