import React, { useState, useEffect } from 'react';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCalendar,
  HiOutlineClock,
} from 'react-icons/hi';
import { calendrierService } from '../api/calendrierService';
import { CalendrierJour, HoraireTravail, TypeJour, OrigineJour } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';

type Tab = 'jours' | 'horaires';

const JOURS_SEMAINE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

const typeJourLabels: Record<TypeJour, string> = {
  [TypeJour.OUVRABLE]: 'Ouvrable',
  [TypeJour.FERIE]: 'Férié',
  [TypeJour.CONGE_PAYE]: 'Congé payé',
  [TypeJour.CONGE_NON_PAYE]: 'Congé non payé',
};

const typeJourVariant: Record<TypeJour, 'success' | 'danger' | 'warning' | 'neutral'> = {
  [TypeJour.OUVRABLE]: 'success',
  [TypeJour.FERIE]: 'danger',
  [TypeJour.CONGE_PAYE]: 'warning',
  [TypeJour.CONGE_NON_PAYE]: 'neutral',
};

const CalendrierPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('jours');

  // ============ Jours state ============
  const [jours, setJours] = useState<CalendrierJour[]>([]);
  const [joursLoading, setJoursLoading] = useState(true);
  const [jourSearch, setJourSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showJourModal, setShowJourModal] = useState(false);
  const [editingJour, setEditingJour] = useState<CalendrierJour | null>(null);
  const [jourForm, setJourForm] = useState({
    dateJour: '',
    nomJour: '',
    typeJour: TypeJour.FERIE as TypeJour,
    origine: null as OrigineJour | null,
    description: '',
    estPaye: true,
  });

  // ============ Horaires state ============
  const [horaires, setHoraires] = useState<HoraireTravail[]>([]);
  const [horairesLoading, setHorairesLoading] = useState(true);
  const [horaireSearch, setHoraireSearch] = useState('');
  const [showHoraireModal, setShowHoraireModal] = useState(false);
  const [editingHoraire, setEditingHoraire] = useState<HoraireTravail | null>(null);
  const [horaireForm, setHoraireForm] = useState({
    nom: '',
    heureDebut: '08:00',
    heureFin: '17:00',
    pauseDebutMidi: '12:00',
    pauseFinMidi: '13:00',
    joursTravail: ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'] as string[],
  });

  useEffect(() => {
    loadJours();
    loadHoraires();
  }, []);

  // ============ Jours logic ============

  const loadJours = async () => {
    try {
      const response = await calendrierService.getAllJours();
      setJours(response.data.data || []);
    } catch (err) {
      console.error('Erreur chargement jours:', err);
    } finally {
      setJoursLoading(false);
    }
  };

  const handleSaveJour = async () => {
    try {
      const payload = {
        ...jourForm,
        origine: jourForm.origine || null,
      };
      if (editingJour) {
        await calendrierService.updateJour(editingJour.id, payload);
      } else {
        await calendrierService.createJour(payload);
      }
      setShowJourModal(false);
      setEditingJour(null);
      resetJourForm();
      loadJours();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEditJour = (jour: CalendrierJour) => {
    setEditingJour(jour);
    setJourForm({
      dateJour: jour.dateJour,
      nomJour: jour.nomJour,
      typeJour: jour.typeJour,
      origine: jour.origine,
      description: jour.description || '',
      estPaye: jour.estPaye,
    });
    setShowJourModal(true);
  };

  const handleDeleteJour = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce jour ?')) {
      try {
        await calendrierService.deleteJour(id);
        loadJours();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const resetJourForm = () => {
    setJourForm({
      dateJour: '',
      nomJour: '',
      typeJour: TypeJour.FERIE,
      origine: null,
      description: '',
      estPaye: true,
    });
  };

  const filteredJours = jours.filter((j) => {
    const matchSearch =
      j.nomJour.toLowerCase().includes(jourSearch.toLowerCase()) ||
      j.dateJour.includes(jourSearch) ||
      (j.description && j.description.toLowerCase().includes(jourSearch.toLowerCase()));
    const matchType = typeFilter ? j.typeJour === typeFilter : true;
    return matchSearch && matchType;
  });

  // ============ Horaires logic ============

  const loadHoraires = async () => {
    try {
      const response = await calendrierService.getAllHoraires();
      setHoraires(response.data.data || []);
    } catch (err) {
      console.error('Erreur chargement horaires:', err);
    } finally {
      setHorairesLoading(false);
    }
  };

  const handleSaveHoraire = async () => {
    try {
      const payload = {
        ...horaireForm,
        joursTravail: horaireForm.joursTravail.join(','),
        pauseDebutMidi: horaireForm.pauseDebutMidi || null,
        pauseFinMidi: horaireForm.pauseFinMidi || null,
      };
      if (editingHoraire) {
        await calendrierService.updateHoraire(editingHoraire.id, payload);
      } else {
        await calendrierService.createHoraire(payload);
      }
      setShowHoraireModal(false);
      setEditingHoraire(null);
      resetHoraireForm();
      loadHoraires();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEditHoraire = (horaire: HoraireTravail) => {
    setEditingHoraire(horaire);
    setHoraireForm({
      nom: horaire.nom,
      heureDebut: horaire.heureDebut,
      heureFin: horaire.heureFin,
      pauseDebutMidi: horaire.pauseDebutMidi || '',
      pauseFinMidi: horaire.pauseFinMidi || '',
      joursTravail: horaire.joursTravail.split(',').filter(Boolean),
    });
    setShowHoraireModal(true);
  };

  const handleDeleteHoraire = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet horaire ?')) {
      try {
        await calendrierService.deleteHoraire(id);
        loadHoraires();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const resetHoraireForm = () => {
    setHoraireForm({
      nom: '',
      heureDebut: '08:00',
      heureFin: '17:00',
      pauseDebutMidi: '12:00',
      pauseFinMidi: '13:00',
      joursTravail: ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'],
    });
  };

  const toggleJourTravail = (jour: string) => {
    setHoraireForm((prev) => ({
      ...prev,
      joursTravail: prev.joursTravail.includes(jour)
        ? prev.joursTravail.filter((j) => j !== jour)
        : [...prev.joursTravail, jour],
    }));
  };

  const filteredHoraires = horaires.filter(
    (h) =>
      h.nom.toLowerCase().includes(horaireSearch.toLowerCase()) ||
      h.joursTravail.toLowerCase().includes(horaireSearch.toLowerCase())
  );

  // ============ Table columns ============

  const jourColumns = [
    {
      key: 'dateJour',
      label: 'Date',
      render: (item: CalendrierJour) => (
        <span className="font-medium text-gray-800 dark:text-white">
          {new Date(item.dateJour).toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'nomJour',
      label: 'Nom',
      render: (item: CalendrierJour) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-error-50 text-error-500 dark:bg-error-500/[0.12] dark:text-error-400 flex items-center justify-center">
            <HiOutlineCalendar size={16} />
          </div>
          <span className="font-medium text-gray-800 dark:text-white">{item.nomJour}</span>
        </div>
      ),
    },
    {
      key: 'typeJour',
      label: 'Type',
      render: (item: CalendrierJour) => (
        <Badge text={typeJourLabels[item.typeJour]} variant={typeJourVariant[item.typeJour]} />
      ),
    },
    {
      key: 'origine',
      label: 'Origine',
      render: (item: CalendrierJour) =>
        item.origine ? (
          <Badge text={item.origine} variant={item.origine === 'NATIONAL' ? 'primary' : 'info'} />
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'estPaye',
      label: 'Payé',
      render: (item: CalendrierJour) => (
        <Badge text={item.estPaye ? 'Oui' : 'Non'} variant={item.estPaye ? 'success' : 'neutral'} />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: CalendrierJour) => (
        <div className="flex gap-2">
          <button onClick={() => handleEditJour(item)} className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-500 transition-colors">
            <HiOutlinePencil size={16} />
          </button>
          <button onClick={() => handleDeleteJour(item.id)} className="p-1.5 rounded-lg hover:bg-error-50 text-error-500 transition-colors">
            <HiOutlineTrash size={16} />
          </button>
        </div>
      ),
    },
  ];

  const horaireColumns = [
    {
      key: 'nom',
      label: 'Nom',
      render: (item: HoraireTravail) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400 flex items-center justify-center">
            <HiOutlineClock size={16} />
          </div>
          <span className="font-medium text-gray-800 dark:text-white">{item.nom}</span>
        </div>
      ),
    },
    {
      key: 'heureDebut',
      label: 'Début',
      render: (item: HoraireTravail) => <span className="font-mono">{item.heureDebut}</span>,
    },
    {
      key: 'heureFin',
      label: 'Fin',
      render: (item: HoraireTravail) => <span className="font-mono">{item.heureFin}</span>,
    },
    {
      key: 'pauseDej',
      label: 'Pause déjeuner',
      render: (item: HoraireTravail) => (
        <span className="font-mono">
          {item.pauseDebutMidi && item.pauseFinMidi
            ? `${item.pauseDebutMidi} - ${item.pauseFinMidi}`
            : <span className="text-gray-400 italic">Non définie</span>}
        </span>
      ),
    },
    {
      key: 'joursTravail',
      label: 'Jours de travail',
      render: (item: HoraireTravail) => (
        <div className="flex gap-1 flex-wrap">
          {JOURS_SEMAINE.map((jour) => (
            <span
              key={jour}
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                item.joursTravail.includes(jour)
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/[0.12] dark:text-brand-400'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
              }`}
            >
              {jour.substring(0, 3)}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: HoraireTravail) => (
        <div className="flex gap-2">
          <button onClick={() => handleEditHoraire(item)} className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-500 transition-colors">
            <HiOutlinePencil size={16} />
          </button>
          <button onClick={() => handleDeleteHoraire(item.id)} className="p-1.5 rounded-lg hover:bg-error-50 text-error-500 transition-colors">
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
          <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Calendrier entreprise</h1>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérer les jours fériés, jours spéciaux et les horaires de travail
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800 w-fit">
        <button
          onClick={() => setActiveTab('jours')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-theme-sm font-medium transition-colors ${
            activeTab === 'jours'
              ? 'bg-white text-brand-500 shadow-sm dark:bg-gray-700 dark:text-brand-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <HiOutlineCalendar size={16} />
          Jours fériés / spéciaux
        </button>
        <button
          onClick={() => setActiveTab('horaires')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-theme-sm font-medium transition-colors ${
            activeTab === 'horaires'
              ? 'bg-white text-brand-500 shadow-sm dark:bg-gray-700 dark:text-brand-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <HiOutlineClock size={16} />
          Horaires de travail
        </button>
      </div>

      {/* Jours tab */}
      {activeTab === 'jours' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative max-w-md flex-1">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={jourSearch}
                  onChange={(e) => setJourSearch(e.target.value)}
                  placeholder="Rechercher un jour..."
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent pl-10 pr-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
              >
                <option value="">Tous les types</option>
                {Object.values(TypeJour).map((t) => (
                  <option key={t} value={t}>{typeJourLabels[t]}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => { resetJourForm(); setEditingJour(null); setShowJourModal(true); }}>
              <HiOutlinePlus size={18} /> Ajouter un jour
            </Button>
          </div>

          {joursLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : filteredJours.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineCalendar className="mx-auto text-gray-300 dark:text-gray-600" size={48} />
              <p className="mt-3 text-gray-500 dark:text-gray-400">Aucun jour configuré</p>
              <Button variant="ghost" className="mt-4" onClick={() => { resetJourForm(); setEditingJour(null); setShowJourModal(true); }}>
                <HiOutlinePlus size={16} /> Ajouter le premier jour
              </Button>
            </div>
          ) : (
            <DataTable columns={jourColumns} data={filteredJours} />
          )}
        </div>
      )}

      {/* Horaires tab */}
      {activeTab === 'horaires' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-md flex-1">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={horaireSearch}
                onChange={(e) => setHoraireSearch(e.target.value)}
                placeholder="Rechercher un horaire..."
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent pl-10 pr-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
              />
            </div>
            <Button onClick={() => { resetHoraireForm(); setEditingHoraire(null); setShowHoraireModal(true); }}>
              <HiOutlinePlus size={18} /> Ajouter un horaire
            </Button>
          </div>

          {horairesLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : filteredHoraires.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineClock className="mx-auto text-gray-300 dark:text-gray-600" size={48} />
              <p className="mt-3 text-gray-500 dark:text-gray-400">Aucun horaire configuré</p>
              <Button variant="ghost" className="mt-4" onClick={() => { resetHoraireForm(); setEditingHoraire(null); setShowHoraireModal(true); }}>
                <HiOutlinePlus size={16} /> Créer le premier horaire
              </Button>
            </div>
          ) : (
            <DataTable columns={horaireColumns} data={filteredHoraires} />
          )}
        </div>
      )}

      {/* Jour Modal */}
      <Modal isOpen={showJourModal} onClose={() => setShowJourModal(false)} title={editingJour ? 'Modifier le jour' : 'Nouveau jour'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
            <input
              type="date"
              value={jourForm.dateJour}
              onChange={(e) => setJourForm({ ...jourForm, dateJour: e.target.value })}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du jour *</label>
            <input
              type="text"
              value={jourForm.nomJour}
              onChange={(e) => setJourForm({ ...jourForm, nomJour: e.target.value })}
              placeholder="Ex: Fête du Trône, Aïd Al Fitr..."
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
            <select
              value={jourForm.typeJour}
              onChange={(e) => setJourForm({ ...jourForm, typeJour: e.target.value as TypeJour })}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
            >
              {Object.values(TypeJour).map((t) => (
                <option key={t} value={t}>{typeJourLabels[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Origine</label>
            <select
              value={jourForm.origine || ''}
              onChange={(e) => setJourForm({ ...jourForm, origine: e.target.value ? (e.target.value as OrigineJour) : null })}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="">-- Aucune --</option>
              <option value="NATIONAL">National</option>
              <option value="INTERNATIONAL">International</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={jourForm.description}
              onChange={(e) => setJourForm({ ...jourForm, description: e.target.value })}
              rows={2}
              placeholder="Description optionnelle..."
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
            />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={jourForm.estPaye}
                onChange={(e) => setJourForm({ ...jourForm, estPaye: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">Jour payé</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setShowJourModal(false)}>Annuler</Button>
          <Button onClick={handleSaveJour} disabled={!jourForm.dateJour || !jourForm.nomJour}>
            {editingJour ? 'Modifier' : 'Créer'}
          </Button>
        </div>
      </Modal>

      {/* Horaire Modal */}
      <Modal isOpen={showHoraireModal} onClose={() => setShowHoraireModal(false)} title={editingHoraire ? 'Modifier l\'horaire' : 'Nouvel horaire'}>
        <div className="space-y-4">
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
            <input
              type="text"
              value={horaireForm.nom}
              onChange={(e) => setHoraireForm({ ...horaireForm, nom: e.target.value })}
              placeholder="Ex: Horaire standard, Mi-temps..."
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heure début *</label>
              <input
                type="time"
                value={horaireForm.heureDebut}
                onChange={(e) => setHoraireForm({ ...horaireForm, heureDebut: e.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heure fin *</label>
              <input
                type="time"
                value={horaireForm.heureFin}
                onChange={(e) => setHoraireForm({ ...horaireForm, heureFin: e.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Début pause déjeuner</label>
              <input
                type="time"
                value={horaireForm.pauseDebutMidi}
                onChange={(e) => setHoraireForm({ ...horaireForm, pauseDebutMidi: e.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
              />
            </div>
            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fin pause déjeuner</label>
              <input
                type="time"
                value={horaireForm.pauseFinMidi}
                onChange={(e) => setHoraireForm({ ...horaireForm, pauseFinMidi: e.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jours de travail *</label>
            <div className="flex gap-2 flex-wrap">
              {JOURS_SEMAINE.map((jour) => (
                <button
                  key={jour}
                  type="button"
                  onClick={() => toggleJourTravail(jour)}
                  className={`rounded-lg px-3 py-2 text-theme-xs font-medium transition-colors ${
                    horaireForm.joursTravail.includes(jour)
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                  }`}
                >
                  {jour.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setShowHoraireModal(false)}>Annuler</Button>
          <Button
            onClick={handleSaveHoraire}
            disabled={!horaireForm.nom || !horaireForm.heureDebut || !horaireForm.heureFin || horaireForm.joursTravail.length === 0}
          >
            {editingHoraire ? 'Modifier' : 'Créer'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CalendrierPage;
