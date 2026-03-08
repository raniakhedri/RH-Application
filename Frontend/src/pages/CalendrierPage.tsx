import React, { useState, useEffect } from 'react';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineExclamation,
} from 'react-icons/hi';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import { calendrierService } from '../api/calendrierService';
import { equipeService } from '../api/equipeService';
import { tacheObligatoireService, TacheObligatoireDTO } from '../api/tacheObligatoireService';
import { CalendrierJour, HoraireTravail, TypeJour, OrigineJour, Equipe, Employe } from '../types';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';

type Tab = 'jours' | 'horaires' | 'taches-obligatoires';

const JOURS_SEMAINE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

const typeJourLabels: Record<TypeJour, string> = {
  [TypeJour.OUVRABLE]: 'Ouvrable',
  [TypeJour.FERIE]: 'Férié',
  [TypeJour.CONGE_PAYE]: 'Congé payé',
  [TypeJour.CONGE_NON_PAYE]: 'Congé non payé',
  [TypeJour.TELETRAVAIL]: 'Télétravail',
};

const typeJourVariant: Record<TypeJour, 'success' | 'danger' | 'warning' | 'neutral' | 'info'> = {
  [TypeJour.OUVRABLE]: 'success',
  [TypeJour.FERIE]: 'danger',
  [TypeJour.CONGE_PAYE]: 'warning',
  [TypeJour.CONGE_NON_PAYE]: 'neutral',
  [TypeJour.TELETRAVAIL]: 'info',
};

function eachDayBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (cur <= last) {
    dates.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

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
    dateFinJour: '',
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
    joursTeletravail: [] as string[],
    dateDebut: '',
    dateFin: '',
  });

  // ============ Tâches Obligatoires state ============
  const [tachesObl, setTachesObl] = useState<TacheObligatoireDTO[]>([]);
  const [tachesOblLoading, setTachesOblLoading] = useState(true);
  const [showTacheOblModal, setShowTacheOblModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TacheObligatoireDTO[] | null>(null);
  const [editTacheOblForm, setEditTacheOblForm] = useState({ nom: '', equipeIds: [] as string[], employeIds: [] as string[], dates: [] as string[] });
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [selectedEquipe, setSelectedEquipe] = useState<Equipe | null>(null);
  const [tacheOblForm, setTacheOblForm] = useState({
    nom: '',
    equipeIds: [] as string[],
    employeIds: [] as string[],
    dates: [] as string[],
  });
  // Mini date-picker state for tache obl
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());

  useEffect(() => {
    loadJours();
    loadHoraires();
    loadTachesObl();
    loadEquipes();
  }, []);

  const loadEquipes = async () => {
    try {
      const res = await equipeService.getAll();
      setEquipes(res.data.data || []);
    } catch { /* ignore */ }
  };

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
      if (!editingJour && jourForm.dateFinJour && jourForm.dateFinJour > jourForm.dateJour) {
        const days = eachDayBetween(jourForm.dateJour, jourForm.dateFinJour);
        for (const day of days) {
          await calendrierService.createJour({
            dateJour: day, nomJour: jourForm.nomJour, typeJour: jourForm.typeJour,
            origine: jourForm.origine || null, description: jourForm.description, estPaye: jourForm.estPaye,
          });
        }
      } else {
        const payload = {
          dateJour: jourForm.dateJour, nomJour: jourForm.nomJour, typeJour: jourForm.typeJour,
          origine: jourForm.origine || null, description: jourForm.description, estPaye: jourForm.estPaye,
        };
        if (editingJour) await calendrierService.updateJour(editingJour.id, payload);
        else await calendrierService.createJour(payload);
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
      dateFinJour: '',
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
      dateFinJour: '',
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
        joursTeletravail: horaireForm.joursTeletravail.length > 0 ? horaireForm.joursTeletravail.join(',') : null,
        pauseDebutMidi: horaireForm.pauseDebutMidi || null,
        pauseFinMidi: horaireForm.pauseFinMidi || null,
        dateDebut: horaireForm.dateDebut || null,
        dateFin: horaireForm.dateFin || null,
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
      joursTeletravail: horaire.joursTeletravail ? horaire.joursTeletravail.split(',').filter(Boolean) : [],
      dateDebut: horaire.dateDebut || '',
      dateFin: horaire.dateFin || '',
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
      joursTeletravail: [],
      dateDebut: '',
      dateFin: '',
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

  const toggleJourTeletravail = (jour: string) => {
    setHoraireForm((prev) => ({
      ...prev,
      joursTeletravail: prev.joursTeletravail.includes(jour)
        ? prev.joursTeletravail.filter((j) => j !== jour)
        : [...prev.joursTeletravail, jour],
    }));
  };

  const filteredHoraires = horaires.filter(
    (h) =>
      h.nom.toLowerCase().includes(horaireSearch.toLowerCase()) ||
      h.joursTravail.toLowerCase().includes(horaireSearch.toLowerCase())
  );

  // ============ Tâches Obligatoires logic ============
  const loadTachesObl = async () => {
    try {
      const res = await tacheObligatoireService.getAll();
      setTachesObl(res.data.data || []);
    } catch { /* ignore */ } finally {
      setTachesOblLoading(false);
    }
  };

  const toggleEquipeId = (equipeId: string) => {
    setTacheOblForm((f) => {
      const next = f.equipeIds.includes(equipeId)
        ? f.equipeIds.filter((id) => id !== equipeId)
        : [...f.equipeIds, equipeId];
      return { ...f, equipeIds: next, employeIds: [] };
    });
    // Update selectedEquipe to ALL selected equipes combined members
    const eq = equipes.find((e) => String(e.id) === equipeId) || null;
    setSelectedEquipe(eq);
  };

  const selectedEquipes = equipes.filter((e) => tacheOblForm.equipeIds.includes(String(e.id)));
  const allMembers = selectedEquipes.flatMap((e) => e.membres).filter(
    (m, i, arr) => arr.findIndex((x) => x.id === m.id) === i
  );

  const toggleEmployeId = (employeId: string) => {
    setTacheOblForm((f) => ({
      ...f,
      employeIds: f.employeIds.includes(employeId)
        ? f.employeIds.filter((id) => id !== employeId)
        : [...f.employeIds, employeId],
    }));
  };

  const togglePickerDate = (dateStr: string) => {
    setTacheOblForm((f) => ({
      ...f,
      dates: f.dates.includes(dateStr)
        ? f.dates.filter((d) => d !== dateStr)
        : [...f.dates, dateStr],
    }));
  };

  const handleSaveTacheObl = async () => {
    if (!tacheOblForm.nom.trim()) {
      alert('Veuillez renseigner le nom de la tâche.');
      return;
    }
    if (tacheOblForm.equipeIds.length === 0) {
      alert('Veuillez sélectionner au moins une équipe.');
      return;
    }
    if (tacheOblForm.dates.length === 0) {
      alert('Veuillez sélectionner au moins une date dans le calendrier.');
      return;
    }
    try {
      // Create one tache obl per equipe × member combination
      for (const equipeId of tacheOblForm.equipeIds) {
        if (tacheOblForm.employeIds.length === 0) {
          // Whole equipe
          await tacheObligatoireService.create({
            nom: tacheOblForm.nom,
            equipeId: Number(equipeId),
            employeId: null,
            dates: tacheOblForm.dates,
          });
        } else {
          for (const employeId of tacheOblForm.employeIds) {
            await tacheObligatoireService.create({
              nom: tacheOblForm.nom,
              equipeId: Number(equipeId),
              employeId: Number(employeId),
              dates: tacheOblForm.dates,
            });
          }
        }
      }
      setShowTacheOblModal(false);
      setTacheOblForm({ nom: '', equipeIds: [], employeIds: [], dates: [] });
      setSelectedEquipe(null);
      loadTachesObl();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteTacheObl = async (id: number) => {
    if (window.confirm('Supprimer cette restriction ?')) {
      try {
        await tacheObligatoireService.delete(id);
        loadTachesObl();
      } catch { /* ignore */ }
    }
  };

  const handleDeleteGroup = async (records: TacheObligatoireDTO[]) => {
    if (window.confirm(`Supprimer la restriction "${records[0]?.nom}" et toutes ses entrées ?`)) {
      try {
        await Promise.all(records.map(r => tacheObligatoireService.delete(r.id)));
        loadTachesObl();
      } catch { /* ignore */ }
    }
  };

  const openEditGroup = (records: TacheObligatoireDTO[]) => {
    setEditingGroup(records);
    const equipeIds = [...new Set(records.map(r => String(r.equipeId)))];
    const employeIds = [...new Set(records.filter(r => r.employeId).map(r => String(r.employeId)))];
    const dates = [...new Set(records.flatMap(r => r.dates))].sort();
    setEditTacheOblForm({ nom: records[0].nom, equipeIds, employeIds, dates });
    setPickerYear(new Date().getFullYear());
    setPickerMonth(new Date().getMonth());
  };

  const handleEditTacheOblSave = async () => {
    if (!editingGroup) return;
    if (!editTacheOblForm.nom.trim()) { alert('Veuillez renseigner le nom.'); return; }
    if (editTacheOblForm.equipeIds.length === 0) { alert('Veuillez sélectionner au moins une équipe.'); return; }
    if (editTacheOblForm.dates.length === 0) { alert('Veuillez sélectionner au moins une date.'); return; }
    try {
      // Delete all old records in the group
      await Promise.all(editingGroup.map(r => tacheObligatoireService.delete(r.id)));
      // Recreate with new equipes × members
      for (const equipeId of editTacheOblForm.equipeIds) {
        if (editTacheOblForm.employeIds.length === 0) {
          await tacheObligatoireService.create({ nom: editTacheOblForm.nom, equipeId: Number(equipeId), employeId: null, dates: editTacheOblForm.dates });
        } else {
          for (const employeId of editTacheOblForm.employeIds) {
            await tacheObligatoireService.create({ nom: editTacheOblForm.nom, equipeId: Number(equipeId), employeId: Number(employeId), dates: editTacheOblForm.dates });
          }
        }
      }
      setEditingGroup(null);
      loadTachesObl();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const toggleEditDate = (dateStr: string) => {
    setEditTacheOblForm(f => ({ ...f, dates: f.dates.includes(dateStr) ? f.dates.filter(d => d !== dateStr) : [...f.dates, dateStr] }));
  };
  const toggleEditEquipeId = (equipeId: string) => {
    setEditTacheOblForm(f => {
      const next = f.equipeIds.includes(equipeId) ? f.equipeIds.filter(id => id !== equipeId) : [...f.equipeIds, equipeId];
      return { ...f, equipeIds: next, employeIds: [] };
    });
  };
  const toggleEditEmployeId = (employeId: string) => {
    setEditTacheOblForm(f => ({ ...f, employeIds: f.employeIds.includes(employeId) ? f.employeIds.filter(id => id !== employeId) : [...f.employeIds, employeId] }));
  };
  // Members visible when editing = from the selected equipes
  const editSelectedEquipes = equipes.filter(e => editTacheOblForm.equipeIds.includes(String(e.id)));
  const editAllMembers = editSelectedEquipes.flatMap(e => e.membres || []).filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i);

  // Grouped view for table
  const groupedRestrictions = React.useMemo(() => {
    const map = new Map<string, TacheObligatoireDTO[]>();
    for (const t of tachesObl) {
      if (!map.has(t.nom)) map.set(t.nom, []);
      map.get(t.nom)!.push(t);
    }
    return Array.from(map.values()).map(records => ({
      nom: records[0].nom,
      equipeNoms: [...new Set(records.map(r => r.equipeNom))],
      membreNoms: [...new Set(records.filter(r => r.employeNom).map(r => r.employeNom!))],
      toutesEquipes: records.every(r => !r.employeId),
      dates: [...new Set(records.flatMap(r => r.dates))].sort(),
      records,
    }));
  }, [tachesObl]);

  // Mini picker helpers
  const pickerDays = () => {
    const days: (number | null)[] = [];
    const firstDay = new Date(pickerYear, pickerMonth, 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const total = new Date(pickerYear, pickerMonth + 1, 0).getDate();
    for (let i = 0; i < offset; i++) days.push(null);
    for (let d = 1; d <= total; d++) days.push(d);
    return days;
  };
  const pickerDateStr = (day: number) =>
    `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const tacheOblColumns = [
    { key: 'nom', label: 'Restriction', render: (t: TacheObligatoireDTO) => <span className="font-medium">{t.nom}</span> },
    { key: 'equipeNom', label: 'Équipe', render: (t: TacheObligatoireDTO) => <Badge text={t.equipeNom} variant="primary" /> },
    {
      key: 'employeNom', label: 'Assigné à', render: (t: TacheObligatoireDTO) => (
        <span className="text-theme-sm">{t.employeNom || <span className="text-gray-400 italic">Toute l'équipe</span>}</span>
      )
    },
    {
      key: 'dates', label: 'Dates', render: (t: TacheObligatoireDTO) => (
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          {t.dates.slice(0, 4).map((d) => (
            <span key={d} className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-700 px-2 py-0.5 text-[10px] font-medium dark:bg-yellow-500/20 dark:text-yellow-400 whitespace-nowrap">{d}</span>
          ))}
          {t.dates.length > 4 && (
            <span className="col-span-2 text-theme-xs text-gray-400">+{t.dates.length - 4} autres</span>
          )}
        </div>
      )
    },
    {
      key: 'actions', label: '', render: (t: TacheObligatoireDTO) => (
        <div className="flex gap-1">
          <button onClick={() => openEditGroup([t])} className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-500 transition-colors" title="Modifier">
            <HiOutlinePencil size={16} />
          </button>
          <button onClick={() => handleDeleteTacheObl(t.id)} className="p-1.5 rounded-lg hover:bg-error-50 text-error-500 transition-colors" title="Supprimer">
            <HiOutlineTrash size={16} />
          </button>
        </div>
      )
    },
  ];

  // ============ Table columns ============
  const jourColumns = [
    {
      key: 'dateJour',
      label: 'Date',
      render: (item: CalendrierJour) => (
        <span className="font-medium text-gray-800 dark:text-white">
          {new Date(item.dateJour + 'T00:00:00').toLocaleDateString('fr-FR', {
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
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${item.joursTravail.includes(jour)
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
      key: 'joursTeletravail',
      label: 'Télétravail',
      render: (item: HoraireTravail) => (
        <div className="flex gap-1 flex-wrap">
          {item.joursTeletravail ? JOURS_SEMAINE.filter((j) => item.joursTeletravail!.includes(j)).map((jour) => (
            <span
              key={jour}
              className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-500/[0.12] dark:text-blue-400"
            >
              {jour.substring(0, 3)}
            </span>
          )) : <span className="text-gray-400 text-[10px] italic">Aucun</span>}
        </div>
      ),
    },
    {
      key: 'periode',
      label: 'Période',
      render: (item: HoraireTravail) => {
        if (!item.dateDebut && !item.dateFin) {
          return <span className="text-theme-xs text-gray-400 italic">Toute l'année</span>;
        }
        const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        return (
          <span className="text-theme-xs font-medium text-gray-700 dark:text-gray-300">
            {item.dateDebut ? fmt(item.dateDebut) : '...'} → {item.dateFin ? fmt(item.dateFin) : '...'}
          </span>
        );
      },
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
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-theme-sm font-medium transition-colors ${activeTab === 'jours'
            ? 'bg-white text-brand-500 shadow-sm dark:bg-gray-700 dark:text-brand-400'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
        >
          <HiOutlineCalendar size={16} />
          Jours fériés / spéciaux
        </button>
        <button
          onClick={() => setActiveTab('horaires')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-theme-sm font-medium transition-colors ${activeTab === 'horaires'
            ? 'bg-white text-brand-500 shadow-sm dark:bg-gray-700 dark:text-brand-400'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
        >
          <HiOutlineClock size={16} />
          Horaires de travail
        </button>
        <button
          onClick={() => setActiveTab('taches-obligatoires')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-theme-sm font-medium transition-colors ${activeTab === 'taches-obligatoires'
            ? 'bg-white text-yellow-600 shadow-sm dark:bg-gray-700 dark:text-yellow-400'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
        >
          <HiOutlineExclamation size={16} />
          Restriction De congés
        </button>
      </div>

      {/* Jours tab */}
      {activeTab === 'jours' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-1 max-w-md">
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

      {/* Tâches Obligatoires tab */}
      {activeTab === 'taches-obligatoires' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">Jours de travail obligatoires pour une équipe ou un membre</p>
            <Button onClick={() => { setShowTacheOblModal(true); setTacheOblForm({ nom: '', equipeIds: [], employeIds: [], dates: [] }); setSelectedEquipe(null); }}>
              <HiOutlinePlus size={18} /> Ajouter
            </Button>
          </div>
          {tachesOblLoading ? (
            <div className="text-center py-12 text-gray-500">Chargement...</div>
          ) : tachesObl.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineExclamation className="mx-auto text-yellow-400" size={40} />
              <p className="mt-3 text-gray-500">Aucune restriction configurée</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
              <p className="px-4 pt-3 pb-1 text-theme-xs text-gray-400 italic">Double-cliquez sur une ligne pour modifier</p>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    {['Restriction', 'Équipes', 'Assigné à', 'Dates', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupedRestrictions.map((g) => (
                    <tr
                      key={g.nom}
                      onDoubleClick={() => openEditGroup(g.records)}
                      className="border-b border-gray-50 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-theme-sm text-gray-800 dark:text-white max-w-[160px] truncate">{g.nom}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {g.equipeNoms.map(e => <Badge key={e} text={e} variant="primary" />)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-theme-sm">
                        {g.toutesEquipes && g.membreNoms.length === 0 ? (
                          <span className="text-gray-400 italic">Toute l'équipe</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {g.membreNoms.map(m => (
                              <span key={m} className="inline-flex items-center rounded-full bg-secondary-50 text-secondary-600 px-2 py-0.5 text-[10px] font-medium dark:bg-secondary-500/10">{m}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                          {g.dates.slice(0, 4).map(d => (
                            <span key={d} className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-700 px-2 py-0.5 text-[10px] font-medium dark:bg-yellow-500/20 dark:text-yellow-400 whitespace-nowrap">{d}</span>
                          ))}
                          {g.dates.length > 4 && <span className="col-span-2 text-theme-xs text-gray-400">+{g.dates.length - 4} autres</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEditGroup(g.records)} className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-500" title="Modifier">
                            <HiOutlinePencil size={15} />
                          </button>
                          <button onClick={() => handleDeleteGroup(g.records)} className="p-1.5 rounded-lg hover:bg-error-50 text-error-500" title="Supprimer">
                            <HiOutlineTrash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tâche Obligatoire Modal */}
      <Modal isOpen={showTacheOblModal} onClose={() => setShowTacheOblModal(false)} title="Nouvelle tâche obligatoire" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
            <input
              type="text"
              value={tacheOblForm.nom}
              onChange={(e) => setTacheOblForm((f) => ({ ...f, nom: e.target.value }))}
              placeholder="Ex: Déploiement sprint 3"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Choisir les équipes * ({tacheOblForm.equipeIds.length} sélectionnée{tacheOblForm.equipeIds.length > 1 ? 's' : ''})</label>
            <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-300 dark:border-gray-600">
              {equipes.map((eq) => (
                <label key={eq.id} className={`flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 ${tacheOblForm.equipeIds.includes(String(eq.id)) ? 'bg-brand-50 dark:bg-brand-500/10' : ''}`}>
                  <input
                    type="checkbox"
                    checked={tacheOblForm.equipeIds.includes(String(eq.id))}
                    onChange={() => toggleEquipeId(String(eq.id))}
                    className="h-4 w-4 rounded text-brand-500"
                  />
                  <span className="text-theme-sm text-gray-700 dark:text-gray-300">{eq.nom}</span>
                </label>
              ))}
            </div>
          </div>
          {tacheOblForm.equipeIds.length > 0 && allMembers.length > 0 && (
            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigner à ({tacheOblForm.employeIds.length === 0 ? 'toute l\'équipe' : `${tacheOblForm.employeIds.length} membre${tacheOblForm.employeIds.length > 1 ? 's' : ''}`})</label>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-300 dark:border-gray-600">
                {allMembers.map((m) => (
                  <label key={m.id} className={`flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 ${tacheOblForm.employeIds.includes(String(m.id)) ? 'bg-secondary-50 dark:bg-secondary-500/10' : ''}`}>
                    <input
                      type="checkbox"
                      checked={tacheOblForm.employeIds.includes(String(m.id))}
                      onChange={() => toggleEmployeId(String(m.id))}
                      className="h-4 w-4 rounded text-secondary-500"
                    />
                    <span className="text-theme-sm text-gray-700 dark:text-gray-300">{m.prenom} {m.nom}</span>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-theme-xs text-gray-400">Laisser vide = toute l'équipe</p>
            </div>
          )}
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sélectionner les jours obligatoires * <span className="text-theme-xs text-gray-400 font-normal">({tacheOblForm.dates.length} sélectionné{tacheOblForm.dates.length > 1 ? 's' : ''})</span></label>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => { if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(pickerYear - 1); } else setPickerMonth(pickerMonth - 1); }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                  <HiOutlineChevronLeft size={16} />
                </button>
                <span className="text-theme-sm font-semibold text-gray-800 dark:text-white">{MONTHS_FR[pickerMonth]} {pickerYear}</span>
                <button type="button" onClick={() => { if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(pickerYear + 1); } else setPickerMonth(pickerMonth + 1); }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                  <HiOutlineChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d) => (
                  <div key={d} className="text-theme-xs font-medium text-gray-400 py-1">{d}</div>
                ))}
                {pickerDays().map((day, i) => {
                  if (!day) return <div key={`e-${i}`} />;
                  const ds = pickerDateStr(day);
                  const selected = tacheOblForm.dates.includes(ds);
                  return (
                    <button
                      key={ds}
                      type="button"
                      onClick={() => togglePickerDate(ds)}
                      className={`w-8 h-8 mx-auto flex items-center justify-center rounded-md text-theme-xs font-medium transition-colors ${selected
                        ? 'bg-yellow-400 text-white dark:bg-yellow-500'
                        : 'hover:bg-yellow-50 text-gray-700 dark:text-gray-300 dark:hover:bg-yellow-500/20'
                        }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
            {tacheOblForm.dates.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tacheOblForm.dates.sort().map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-700 px-2 py-0.5 text-[10px] font-medium dark:bg-yellow-500/20 dark:text-yellow-400">
                    {d}
                    <button type="button" onClick={() => togglePickerDate(d)} className="hover:text-yellow-900">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setShowTacheOblModal(false)}>Annuler</Button>
          <Button onClick={handleSaveTacheObl}>Créer</Button>
        </div>
      </Modal>

      {/* Edit Restriction Modal */}
      <Modal isOpen={!!editingGroup} onClose={() => setEditingGroup(null)} title="Modifier la restriction" size="lg">
        {editingGroup && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
              <input
                type="text"
                value={editTacheOblForm.nom}
                onChange={e => setEditTacheOblForm(f => ({ ...f, nom: e.target.value }))}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
              />
            </div>
            {/* Equipe multi-select */}
            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Équipes * <span className="text-theme-xs text-brand-500 font-normal">({editTacheOblForm.equipeIds.length} sélectionnée{editTacheOblForm.equipeIds.length > 1 ? 's' : ''})</span>
              </label>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-300 dark:border-gray-600">
                {equipes.map(eq => (
                  <label key={eq.id} className={`flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 ${editTacheOblForm.equipeIds.includes(String(eq.id)) ? 'bg-brand-50 dark:bg-brand-500/10' : ''}`}>
                    <input type="checkbox" checked={editTacheOblForm.equipeIds.includes(String(eq.id))} onChange={() => toggleEditEquipeId(String(eq.id))} className="h-4 w-4 rounded text-brand-500" />
                    <span className="text-theme-sm text-gray-700 dark:text-gray-300">{eq.nom}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Member multi-select */}
            {editTacheOblForm.equipeIds.length > 0 && editAllMembers.length > 0 && (
              <div>
                <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assigner à <span className="text-theme-xs text-gray-400 font-normal">({editTacheOblForm.employeIds.length === 0 ? 'toute l\'équipe' : `${editTacheOblForm.employeIds.length} membre${editTacheOblForm.employeIds.length > 1 ? 's' : ''}`})</span>
                </label>
                <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-300 dark:border-gray-600">
                  {editAllMembers.map(m => (
                    <label key={m.id} className={`flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 ${editTacheOblForm.employeIds.includes(String(m.id)) ? 'bg-secondary-50 dark:bg-secondary-500/10' : ''}`}>
                      <input type="checkbox" checked={editTacheOblForm.employeIds.includes(String(m.id))} onChange={() => toggleEditEmployeId(String(m.id))} className="h-4 w-4 rounded text-secondary-500" />
                      <span className="text-theme-sm text-gray-700 dark:text-gray-300">{m.prenom} {m.nom}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-theme-xs text-gray-400">Laisser vide = toute l'équipe</p>
              </div>
            )}
            {/* Date picker */}
            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dates <span className="text-theme-xs text-gray-400 font-normal">({editTacheOblForm.dates.length} sélectionnée{editTacheOblForm.dates.length > 1 ? 's' : ''})</span>
              </label>
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => { if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(pickerYear - 1); } else setPickerMonth(pickerMonth - 1); }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><HiOutlineChevronLeft size={16} /></button>
                  <span className="text-theme-sm font-semibold text-gray-800 dark:text-white">{MONTHS_FR[pickerMonth]} {pickerYear}</span>
                  <button type="button" onClick={() => { if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(pickerYear + 1); } else setPickerMonth(pickerMonth + 1); }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><HiOutlineChevronRight size={16} /></button>
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map(d => <div key={d} className="text-theme-xs font-medium text-gray-400 py-1">{d}</div>)}
                  {pickerDays().map((day, i) => {
                    if (!day) return <div key={`e-${i}`} />;
                    const ds = pickerDateStr(day);
                    const sel = editTacheOblForm.dates.includes(ds);
                    return <button key={ds} type="button" onClick={() => toggleEditDate(ds)} className={`w-8 h-8 mx-auto flex items-center justify-center rounded-md text-theme-xs font-medium transition-colors ${sel ? 'bg-yellow-400 text-white' : 'hover:bg-yellow-50 text-gray-700 dark:text-gray-300 dark:hover:bg-yellow-500/20'}`}>{day}</button>;
                  })}
                </div>
              </div>
              {editTacheOblForm.dates.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {editTacheOblForm.dates.sort().map(d => (
                    <span key={d} className="inline-flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-700 px-2 py-0.5 text-[10px] font-medium">
                      {d}<button type="button" onClick={() => toggleEditDate(d)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setEditingGroup(null)}>Annuler</Button>
              <Button onClick={handleEditTacheOblSave}>Enregistrer</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Jour Modal */}
      <Modal isOpen={showJourModal} onClose={() => setShowJourModal(false)} title={editingJour ? 'Modifier le jour' : 'Nouveau jour'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{editingJour ? 'Date *' : 'Date début *'}</label>
            <input
              type="date"
              value={jourForm.dateJour}
              onChange={(e) => setJourForm({ ...jourForm, dateJour: e.target.value })}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
            />
          </div>
          {!editingJour && (
            <div>
              <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date fin <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <input
                type="date"
                value={jourForm.dateFinJour}
                min={jourForm.dateJour || undefined}
                onChange={(e) => setJourForm({ ...jourForm, dateFinJour: e.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
              />
              {jourForm.dateFinJour && jourForm.dateJour && jourForm.dateFinJour > jourForm.dateJour && (
                <p className="mt-1 text-theme-xs text-brand-500">{eachDayBetween(jourForm.dateJour, jourForm.dateFinJour).length} jours seront créés</p>
              )}
            </div>
          )}
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
          <div>
            <label className="flex items-center gap-2 cursor-pointer mt-7">
              <input
                type="checkbox"
                checked={jourForm.estPaye}
                onChange={(e) => setJourForm({ ...jourForm, estPaye: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">Jour payé</span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={jourForm.description}
              onChange={(e) => setJourForm({ ...jourForm, description: e.target.value })}
              rows={2}
              placeholder="Description optionnelle..."
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
            />
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
                  className={`rounded-lg px-3 py-2 text-theme-xs font-medium transition-colors ${horaireForm.joursTravail.includes(jour)
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                    }`}
                >
                  {jour.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jours de télétravail</label>
            <p className="text-theme-xs text-gray-400 dark:text-gray-500 mb-2">Sélectionnez les jours où le télétravail est autorisé</p>
            <div className="flex gap-2 flex-wrap">
              {JOURS_SEMAINE.map((jour) => (
                <button
                  key={jour}
                  type="button"
                  onClick={() => toggleJourTeletravail(jour)}
                  className={`rounded-lg px-3 py-2 text-theme-xs font-medium transition-colors ${horaireForm.joursTeletravail.includes(jour)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                    }`}
                >
                  {jour.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Période d'application</label>
            <p className="text-theme-xs text-gray-400 dark:text-gray-500 mb-2">Laisser vide pour appliquer toute l'année</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-theme-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Du</label>
                <input
                  type="date"
                  value={horaireForm.dateDebut}
                  onChange={(e) => setHoraireForm({ ...horaireForm, dateDebut: e.target.value })}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-theme-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Au</label>
                <input
                  type="date"
                  value={horaireForm.dateFin}
                  onChange={(e) => setHoraireForm({ ...horaireForm, dateFin: e.target.value })}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
                />
              </div>
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
