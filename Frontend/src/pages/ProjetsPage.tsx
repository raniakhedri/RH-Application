import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineClipboardList } from 'react-icons/hi';
import { projetService } from '../api/projetService';
import { employeService } from '../api/employeService';
import { demandeService } from '../api/demandeService';
import { clientService } from '../api/clientService';
import type { ClientDTO } from '../api/clientService';
import { useAuth } from '../context/AuthContext';
import { Projet, StatutProjet, Employe, StatutDemande } from '../types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

const statutBadgeMap: Record<string, 'neutral' | 'primary' | 'success' | 'danger'> = {
  PLANIFIE: 'neutral',
  EN_COURS: 'primary',
  CLOTURE: 'success',
  ANNULE: 'danger',
};

const ProjetsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProjet, setEditingProjet] = useState<Projet | null>(null);
  // modalMode: 'full' => full create/edit form; 'members' => chef member-picker
  const [modalMode, setModalMode] = useState<'full' | 'members'>('full');
  const [formData, setFormData] = useState({
    nom: '',
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '',
    statut: StatutProjet.PLANIFIE,
    typeProjet: 'DETERMINE' as 'DETERMINE' | 'INDETERMINE',
    clientId: null as number | null,
  });
  const [selectedChefIds, setSelectedChefIds] = useState<number[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [managers, setManagers] = useState<Employe[]>([]);
  const [subordinates, setSubordinates] = useState<Employe[]>([]);
  const [selectedMembreIds, setSelectedMembreIds] = useState<number[]>([]);
  const [loadingSubordinates, setLoadingSubordinates] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [congeAujourdhuiIds, setCongeAujourdhuiIds] = useState<Set<number>>(new Set());
  const [validatedClients, setValidatedClients] = useState<ClientDTO[]>([]);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [filterNom, setFilterNom] = useState('');
  const [filterDateFin, setFilterDateFin] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterChef, setFilterChef] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const hasFilters = filterNom || filterDateFin || filterClient || filterChef;

  const resetFilters = () => {
    setFilterNom(''); setFilterDateFin(''); setFilterClient(''); setFilterChef('');
  };

  const today = new Date().toISOString().split('T')[0];

  // ── Unique filter options derived from loaded projects ─────────────────────
  const uniqueClients = useMemo(() =>
    [...new Set(projets.filter(p => p.clientNom).map(p => p.clientNom!))],
    [projets]
  );

  const uniqueChefs = useMemo(() =>
    [...new Set(
      projets.flatMap(p =>
        (p.chefsDeProjet && p.chefsDeProjet.length > 0
          ? p.chefsDeProjet
          : p.chefDeProjet ? [p.chefDeProjet] : []
        ).map(c => `${c.prenom} ${c.nom}`)
      )
    )],
    [projets]
  );

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filteredProjets = useMemo(() => {
    return projets.filter(p => {
      if (filterNom && !p.nom.toLowerCase().includes(filterNom.toLowerCase())) return false;
      if (filterDateFin) {
        if (!p.dateFin) return false;                // exclude INDETERMINE when date filter active
        if (p.dateFin > filterDateFin) return false; // exclude projects ending after the filter date
      }
      if (filterClient && p.clientNom !== filterClient) return false;
      if (filterChef) {
        const chefs = (p.chefsDeProjet && p.chefsDeProjet.length > 0
          ? p.chefsDeProjet
          : p.chefDeProjet ? [p.chefDeProjet] : []
        ).map(c => `${c.prenom} ${c.nom}`);
        if (!chefs.includes(filterChef)) return false;
      }
      return true;
    });
  }, [projets, filterNom, filterDateFin, filterClient, filterChef]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const userId = user?.employeId;

      // Use allSettled so a single failing call doesn't break everything
      const [pResult, empResult, managersResult, demandesResult, clientsResult] = await Promise.allSettled([
        userId ? projetService.getByEmploye(userId) : projetService.getAll(),
        employeService.getAll(),
        employeService.getByRole('MANAGER'),
        demandeService.getByStatut(StatutDemande.APPROUVEE),
        clientService.getAllClients(),
      ]);

      if (pResult.status === 'fulfilled') setProjets(pResult.value.data.data || []);
      if (empResult.status === 'fulfilled') setEmployes(empResult.value.data.data || []);
      if (managersResult.status === 'fulfilled') {
        setManagers(managersResult.value.data.data || []);
      } else {
        console.warn('Managers load failed:', managersResult.reason);
      }

      if (demandesResult.status === 'fulfilled') {
        const demandes = demandesResult.value.data.data || [];
        const onConge = new Set<number>();
        demandes.forEach(d => {
          if (d.dateDebut && d.dateFin && d.employeId) {
            const debut = d.dateDebut.toString().substring(0, 10);
            const fin = d.dateFin.toString().substring(0, 10);
            if (debut <= todayStr && todayStr <= fin) onConge.add(d.employeId);
          }
        });
        setCongeAujourdhuiIds(onConge);
      }

      if (clientsResult.status === 'fulfilled') {
        const raw = clientsResult.value.data as any;
        const allClients: ClientDTO[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
        setValidatedClients(allClients.filter(c => c.ceoValidated && c.cooValidated && c.daValidated));
      } else {
        console.warn('Clients load failed:', (clientsResult as any).reason);
      }
    } catch (err) {
      console.error('Erreur chargement projets:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateDates = (): boolean => {
    if (!editingProjet && formData.dateDebut && formData.dateDebut < today) {
      setDateError("La date de début doit être aujourd'hui ou plus tard");
      return false;
    }
    if (formData.typeProjet === 'DETERMINE' &&
      formData.dateDebut && formData.dateFin && formData.dateFin <= formData.dateDebut) {
      setDateError('La date de fin doit être après la date de début');
      return false;
    }
    setDateError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validateDates()) return;
    try {
      const payload: any = {
        nom: formData.nom,
        dateDebut: formData.dateDebut,
        dateFin: formData.typeProjet === 'DETERMINE' ? formData.dateFin : null,
        statut: formData.statut,
        typeProjet: formData.typeProjet,
        chefDeProjetIds: selectedChefIds,
        clientId: formData.clientId,
        createurId: editingProjet ? undefined : user?.employeId,
      };
      if (editingProjet) {
        await projetService.update(editingProjet.id, payload);
      } else {
        await projetService.create(payload);
      }
      setShowModal(false);
      setEditingProjet(null);
      resetForm();
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors de la sauvegarde du projet';
      setDateError(msg);
    }
  };

  const handleEdit = (projet: Projet) => {
    setEditingProjet(projet);
    setModalMode('full');
    setFormData({
      nom: projet.nom,
      dateDebut: projet.dateDebut,
      dateFin: projet.dateFin ?? '',
      statut: projet.statut,
      typeProjet: (projet.typeProjet as any) ?? 'DETERMINE',
      clientId: projet.clientId ?? null,
    });
    setSelectedChefIds(
      (projet.chefsDeProjet && projet.chefsDeProjet.length > 0
        ? projet.chefsDeProjet
        : projet.chefDeProjet ? [projet.chefDeProjet] : []
      ).map(c => c.id)
    );
    setDateError(null);
    const isChef = projet.chefDeProjet?.id === user?.employeId ||
      (projet.chefsDeProjet ?? []).some(c => c.id === user?.employeId);
    if (isChef && user?.employeId) {
      setSelectedMembreIds((projet.membres ?? []).map(m => m.id));
      setLoadingSubordinates(true);
      employeService.getSubordinates(user.employeId)
        .then(res => setSubordinates(res.data.data || []))
        .catch(console.error)
        .finally(() => setLoadingSubordinates(false));
    }
    setShowModal(true);
  };

  const handleAffectMembers = (projet: Projet) => {
    setEditingProjet(projet);
    setModalMode('members');
    setSelectedMembreIds((projet.membres ?? []).map(m => m.id));
    setLoadingSubordinates(true);
    // load subordinates for current user (chef) so they can pick underlings
    if (user?.employeId) {
      employeService.getSubordinates(user.employeId)
        .then(res => setSubordinates(res.data.data || []))
        .catch(console.error)
        .finally(() => setLoadingSubordinates(false));
    } else {
      setLoadingSubordinates(false);
    }
    setShowModal(true);
  };

  const handleChefSave = async () => {
    if (!editingProjet) return;
    try {
      await projetService.update(editingProjet.id, {
        nom: editingProjet.nom,
        dateDebut: editingProjet.dateDebut as any,
        dateFin: editingProjet.dateFin as any,
        statut: editingProjet.statut as any,
        typeProjet: editingProjet.typeProjet,
        chefDeProjetIds: selectedChefIds,
        clientId: editingProjet.clientId,
        equipeIds: editingProjet.equipeIds || [],
        membreIds: selectedMembreIds,
      } as any);
      setShowModal(false);
      setEditingProjet(null);
      setSubordinates([]); setSelectedMembreIds([]);
      loadData();
    } catch (err: any) {
      console.error('Erreur sauvegarde membres:', err);
    }
  };

  const toggleMembre = (id: number) =>
    setSelectedMembreIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleChef = (id: number) =>
    setSelectedChefIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleDelete = async (id: number) => {
    confirm('Supprimer ce projet ?', async () => {
      try { await projetService.delete(id); loadData(); } catch (err) { console.error(err); }
    }, 'Supprimer le projet');
  };

  const handleChangeStatut = async (id: number, statut: StatutProjet) => {
    try { await projetService.changeStatut(id, statut); loadData(); } catch (err) { console.error(err); }
  };

  const resetForm = () => {
    setFormData({ nom: '', dateDebut: today, dateFin: '', statut: StatutProjet.PLANIFIE, typeProjet: 'DETERMINE', clientId: null });
    setSelectedChefIds([]);
    setDateError(null);
  };

  const inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300';

  const columns = [
    { key: 'id', label: '#' },
    {
      key: 'nom', label: 'Nom',
      render: (p: Projet) => (
        <div>
          <span className="font-medium text-gray-800 dark:text-white">{p.nom}</span>
          {p.typeProjet === 'INDETERMINE' && (
            <span className="ml-2 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">Indéterminé</span>
          )}
          {p.clientNom && (
            <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">🤝 {p.clientNom}</span>
          )}
        </div>
      ),
    },
    { key: 'statut', label: 'Statut', render: (p: Projet) => <Badge text={p.statut} variant={statutBadgeMap[p.statut] || 'neutral'} /> },
    {
      key: 'chefs', label: 'Chefs',
      render: (p: Projet) => {
        const chefs = (p.chefsDeProjet && p.chefsDeProjet.length > 0) ? p.chefsDeProjet : (p.chefDeProjet ? [p.chefDeProjet] : []);
        if (!chefs.length) return '-';
        return (
          <div className="flex flex-wrap gap-1">
            {chefs.map(c => (
              <span key={c.id} className="flex items-center gap-1 rounded-full bg-warning-50 px-2 py-0.5 text-[11px] font-medium text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
                {c.prenom} {c.nom}
                {congeAujourdhuiIds.has(c.id) && <span className="text-[9px]">🏖️</span>}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'membres', label: 'Membres',
      render: (p: Projet) => {
        const all = p.membres ?? [];
        if (!all.length) return <span className="text-gray-400">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {all.map(m => (
              <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-secondary-50 px-2 py-0.5 text-[11px] font-medium text-secondary-700 dark:bg-secondary-500/10 dark:text-secondary-400">
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary-200 text-[9px] font-bold dark:bg-secondary-500/30">{m.prenom?.[0]}{m.nom?.[0]}</span>
                {m.prenom} {m.nom}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'dateDebut', label: 'Début',
      render: (p: Projet) => { if (!p.dateDebut) return '-'; const [y, m, d] = p.dateDebut.split('-'); return `${d}/${m}/${y}`; }
    },
    {
      key: 'dateFin', label: 'Fin',
      render: (p: Projet) => {
        if (!p.dateFin) return <span className="text-purple-500 text-xs font-medium">Indéterminé</span>;
        const [y, m, d] = p.dateFin.split('-');
        return `${d}/${m}/${y}`;
      }
    },
    {
      key: 'actions', label: 'Actions',
      render: (item: Projet) => (
        <div className="flex gap-1">
          {item.statut === 'PLANIFIE' && (
            <button onClick={() => handleChangeStatut(item.id, StatutProjet.EN_COURS)} className="rounded-lg p-1.5 text-success-500 hover:bg-success-50" title="Démarrer">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          )}
          {item.statut === 'EN_COURS' && (
            <button onClick={() => handleChangeStatut(item.id, StatutProjet.CLOTURE)} className="rounded-lg p-1.5 text-success-500 hover:bg-success-50" title="Clôturer">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          )}
          <button onClick={() => navigate(`/projets/${item.id}/taches`)} className="rounded-lg p-1.5 text-secondary-500 hover:bg-secondary-50" title="Tâches"><HiOutlineClipboardList size={16} /></button>
          {/* New: Affect members button - visible to chefs of project */}
          {((item.chefsDeProjet && item.chefsDeProjet.some(c => c.id === user?.employeId)) || item.chefDeProjet?.id === user?.employeId) && (
            <button onClick={() => handleAffectMembers(item)} className="rounded-lg p-1.5 text-warning-500 hover:bg-warning-50" title="Affecter des membres">👥</button>
          )}
          {/* Edit opens full form (name/date/type) */}
          <button onClick={() => handleEdit(item)} className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50" title="Modifier projet"><HiOutlinePencil size={16} /></button>
          <button onClick={() => handleDelete(item.id)} className="rounded-lg p-1.5 text-error-500 hover:bg-error-50"><HiOutlineTrash size={16} /></button>
        </div>
      ),
    },
  ];

  // determine if the logged-in user is one of the chefs (member-picker candidate)
  const isChefEdit = !!editingProjet && (
    editingProjet.chefDeProjet?.id === user?.employeId ||
    (editingProjet.chefsDeProjet ?? []).some(c => c.id === user?.employeId)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Mes Projets</h1>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">Vos projets en tant que chef ou membre d'équipe</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingProjet(null); setShowModal(true); }}>
          <HiOutlinePlus size={18} /> Nouveau projet
        </Button>
      </div>

      {/* ── Filter bar ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-2 text-theme-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-brand-600 transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filtres
            {hasFilters && (
              <span className="ml-1 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">
                actif
              </span>
            )}
            <svg
              width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              className={`ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="text-theme-xs text-error-500 hover:text-error-600 font-medium transition-colors"
            >
              Effacer les filtres
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Nom */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Nom du projet</label>
              <input
                type="text"
                value={filterNom}
                onChange={e => setFilterNom(e.target.value)}
                placeholder="Rechercher..."
                className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
              />
            </div>

            {/* Date fin */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Date fin (avant le)</label>
              <input
                type="date"
                value={filterDateFin}
                onChange={e => setFilterDateFin(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* Client */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Client</label>
              <select
                value={filterClient}
                onChange={e => setFilterClient(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
              >
                <option value="">Tous les clients</option>
                {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Chef */}
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Chef de projet</label>
              <select
                value={filterChef}
                onChange={e => setFilterChef(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
              >
                <option value="">Tous les chefs</option>
                {uniqueChefs.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Active filter summary */}
        {hasFilters && (
          <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
            {filteredProjets.length} projet{filteredProjets.length !== 1 ? 's' : ''} correspond{filteredProjets.length === 1 ? '' : 'ent'} aux filtres
          </p>
        )}
      </div>

      {loading ? <div className="py-12 text-center text-gray-500">Chargement...</div>
        : <DataTable columns={columns} data={filteredProjets} onRowDoubleClick={handleEdit} />}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={modalMode === 'members' ? 'Gérer les membres du projet' : editingProjet ? 'Modifier le projet' : 'Nouveau projet'}
        size="lg">
        {modalMode === 'members' ? (
          /* ── CHEF VIEW: member picker ── */
          <div className="space-y-4">
            <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 dark:border-brand-500/20 dark:bg-brand-500/5">
              <p className="text-theme-sm font-semibold text-brand-700 dark:text-brand-300">{editingProjet!.nom}</p>
              <p className="mt-0.5 text-theme-xs text-brand-500">Sélectionnez les employés à ajouter à ce projet.</p>
            </div>
            {loadingSubordinates ? (
              <div className="py-6 text-center text-gray-400 text-theme-sm">Chargement...</div>
            ) : subordinates.length === 0 ? (
              <div className="rounded-lg bg-warning-50 px-4 py-3 text-theme-sm text-warning-600 dark:bg-warning-500/10">Aucun employé sous votre responsabilité.</div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {subordinates.map(sub => {
                  const isSelected = selectedMembreIds.includes(sub.id);
                  return (
                    <label key={sub.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${isSelected ? 'border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10' : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'}`}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleMembre(sub.id)} className="h-4 w-4 rounded text-brand-500" />
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-theme-xs font-bold text-brand-600">{sub.prenom?.[0]}{sub.nom?.[0]}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-theme-sm font-semibold text-gray-800 dark:text-white truncate">{sub.prenom} {sub.nom}</p>
                        {sub.departement && <p className="text-theme-xs text-gray-400">🏢 {sub.departement}</p>}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button onClick={handleChefSave}>Enregistrer ({selectedMembreIds.length} sélectionné{selectedMembreIds.length !== 1 ? 's' : ''})</Button>
            </div>
          </div>
        ) : (
          /* ── FULL FORM ── */
          <div className="space-y-4">

            {/* Nom */}
            <div>
              <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
              <input type="text" value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} className={inputClass} required />
            </div>

            {/* Chefs de projet multi-select */}
            <div>
              <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                Chefs de projet <span className="text-gray-400 font-normal">(optionnel — plusieurs possibles)</span>
              </label>
              {managers.length === 0 ? (
                <p className="text-theme-xs text-gray-400">Aucun manager disponible</p>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-1.5 rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                  {managers.map(m => {
                    const isSelected = selectedChefIds.includes(m.id);
                    return (
                      <label key={m.id} className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${isSelected ? 'bg-warning-50 dark:bg-warning-500/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleChef(m.id)} className="h-4 w-4 rounded text-warning-500" />
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning-100 text-[11px] font-bold text-warning-700">{m.prenom?.[0]}{m.nom?.[0]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-theme-sm font-medium text-gray-800 dark:text-white truncate">{m.prenom} {m.nom}</p>
                          {m.poste && <p className="text-theme-xs text-gray-400 truncate">{m.poste}</p>}
                        </div>
                        {congeAujourdhuiIds.has(m.id) && <span className="rounded-full bg-warning-100 px-1.5 py-0.5 text-[10px] font-semibold text-warning-600">🏖️ Congé</span>}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Client (fully validated) */}
            <div>
              <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                Client <span className="text-gray-400 font-normal">(optionnel — entièrement validé)</span>
              </label>
              <select value={formData.clientId ?? ''} onChange={e => setFormData({ ...formData, clientId: e.target.value ? Number(e.target.value) : null })} className={inputClass}>
                <option value="">Aucun client</option>
                {validatedClients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>

            {/* Type de projet */}
            <div>
              <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Type de projet</label>
              <div className="flex gap-6">
                {(['DETERMINE', 'INDETERMINE'] as const).map(type => (
                  <label key={type} className="flex cursor-pointer items-center gap-2">
                    <input type="radio" name="typeProjet" value={type} checked={formData.typeProjet === type}
                      onChange={() => setFormData(f => ({ ...f, typeProjet: type, dateFin: '' }))}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500" />
                    <span className="text-theme-sm text-gray-700 dark:text-gray-300">
                      {type === 'DETERMINE' ? 'Projet déterminé' : 'Projet indéterminé'}
                    </span>
                  </label>
                ))}
              </div>
              {formData.typeProjet === 'INDETERMINE' && (
                <p className="mt-1 text-theme-xs text-purple-500">ℹ️ Pas de date de fin requise.</p>
              )}
            </div>

            {/* Dates */}
            <div className={`grid gap-4 ${formData.typeProjet === 'DETERMINE' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div>
                <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Date début</label>
                <input type="date" value={formData.dateDebut} min={!editingProjet ? today : undefined}
                  onChange={e => { setFormData({ ...formData, dateDebut: e.target.value }); setDateError(null); }}
                  className={inputClass}
                  style={{ colorScheme: 'dark' }}
                  required />
              </div>
              {formData.typeProjet === 'DETERMINE' && (
                <div>
                  <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Date fin</label>
                  <input type="date" value={formData.dateFin} min={formData.dateDebut || today}
                    onChange={e => { setFormData({ ...formData, dateFin: e.target.value }); setDateError(null); }}
                    className={inputClass}
                    style={{ colorScheme: 'dark' }}
                    required />
                </div>
              )}
            </div>

            {dateError && <div className="rounded-lg bg-error-50 px-4 py-2 text-theme-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">{dateError}</div>}

            {/* Statut (edit only) */}
            {editingProjet && (
              <div>
                <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
                <select value={formData.statut} onChange={e => setFormData({ ...formData, statut: e.target.value as StatutProjet })} className={inputClass}>
                  {Object.values(StatutProjet).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button onClick={handleSave}>{editingProjet ? 'Modifier' : 'Créer'}</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={confirmState.isOpen} message={confirmState.message} title={confirmState.title} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
};

export default ProjetsPage;
