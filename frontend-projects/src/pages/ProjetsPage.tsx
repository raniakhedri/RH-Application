import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineClipboardList, HiOutlineDocumentText, HiOutlineDownload, HiOutlineChevronDown, HiOutlineArrowLeft, HiOutlineBriefcase, HiOutlineUserGroup, HiOutlineCalendar, HiOutlineOfficeBuilding, HiOutlineSun } from 'react-icons/hi';
import { projetService } from '../api/projetService';
import { employeService } from '../api/employeService';
import { demandeService } from '../api/demandeService';
import { clientService } from '../api/clientService';
import { mediaPlanService } from '../api/mediaPlanService';
import type { ClientDTO } from '../api/clientService';
import { API_BASE } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Projet, StatutProjet, Employe, StatutDemande, MediaPlan } from '../types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';
import '../pages/ProjetsPage.css';

const statutBadgeMap: Record<string, 'neutral' | 'primary' | 'success' | 'danger'> = {
  PLANIFIE: 'neutral',
  EN_COURS: 'primary',
  CLOTURE: 'success',
  ANNULE: 'danger',
};

/* ─── Single project form data ───────────────────────────────────────────── */
interface ProjectFormRow {
  nom: string;
  typeProjet: 'DETERMINE' | 'INDETERMINE';
  dateDebut: string;
  dateFin: string;
  chefIds: number[];
}

const emptyRow = (today: string): ProjectFormRow => ({
  nom: '',
  typeProjet: 'DETERMINE',
  dateDebut: today,
  dateFin: '',
  chefIds: [],
});

/* ─── Page ──────────────────────────────────────────────────────────────── */
const ProjetsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();
  const perms = user?.permissions ?? [];
  const canManageAllProjets = perms.includes('MANAGE_ALL_PROJETS');
  const canViewProjetsCreateTaches = perms.includes('VIEW_PROJETS_CREATE_TACHES');
  const [projets, setProjets] = useState<Projet[]>([]);
  const [allClients, setAllClients] = useState<ClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState<Employe[]>([]);
  const [congeAujourdhuiIds, setCongeAujourdhuiIds] = useState<Set<number>>(new Set());
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(() => new Date());

  type ViewState = 'CLIENTS' | 'PROJECTS' | 'PROJECT_DETAILS';
  const [viewState, setViewState] = useState<ViewState>('CLIENTS');
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 6;
  const [selectedClientKey, setSelectedClientKey] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Projet | null>(null);
  const [mediaPlanDetails, setMediaPlanDetails] = useState<MediaPlan | null>(null);
  const [loadingMediaPlan, setLoadingMediaPlan] = useState(false);

  type ClientsTab = 'TOUS' | 'ACTIFS' | 'NON_ASSIGNE' | 'RECENTS';
  const [clientsTab, setClientsTab] = useState<ClientsTab>('TOUS');
  const [clientSearch, setClientSearch] = useState('');

  useEffect(() => {
    if (viewState === 'PROJECT_DETAILS' && selectedProject?.isMediaPlanProject && selectedProject?.mediaPlanLigneId) {
      const fetchMp = async () => {
        setLoadingMediaPlan(true);
        try {
          const res = await mediaPlanService.getById(selectedProject.mediaPlanLigneId!);
          setMediaPlanDetails(res.data.data);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingMediaPlan(false);
        }
      };
      fetchMp();
    } else {
      setMediaPlanDetails(null);
    }
  }, [viewState, selectedProject]);

  // Multi-project creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createClientKey, setCreateClientKey] = useState<string>('none');
  const [createRows, setCreateRows] = useState<ProjectFormRow[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProjet, setEditingProjet] = useState<Projet | null>(null);
  const [editForm, setEditForm] = useState({ nom: '', typeProjet: 'DETERMINE' as 'DETERMINE' | 'INDETERMINE', dateDebut: '', dateFin: '', statut: StatutProjet.PLANIFIE, clientId: null as number | null });
  const [editChefIds, setEditChefIds] = useState<number[]>([]);
  const [editDateError, setEditDateError] = useState<string | null>(null);

  // Member modal
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberProjet, setMemberProjet] = useState<Projet | null>(null);
  const [subordinates, setSubordinates] = useState<Employe[]>([]);
  const [selectedMembreIds, setSelectedMembreIds] = useState<number[]>([]);
  const [loadingSubordinates, setLoadingSubordinates] = useState(false);
  const [memberChefIds, setMemberChefIds] = useState<number[]>([]);

  const today = new Date().toISOString().split('T')[0];
  const inputClass = 'h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300';

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatLastUpdated = (value: Date | null, reference: Date) => {
    if (!value) return '—';
    const diffMs = Math.max(0, reference.getTime() - value.getTime());
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "A l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `il y a ${diffHours} h`;

    const diffDays = Math.floor(diffHours / 24);
    return `il y a ${diffDays} j`;
  };

  const loadData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const userId = user?.employeId;

      const [pResult, managersResult, demandesResult, clientsResult] = await Promise.allSettled([
        canManageAllProjets ? projetService.getAll() : (userId ? projetService.getByEmploye(userId) : projetService.getAll()),
        employeService.getByRole('MANAGER'),
        demandeService.getByStatut(StatutDemande.APPROUVEE),
        clientService.getAllClients(),
      ]);

      if (pResult.status === 'fulfilled') setProjets(pResult.value.data.data || []);
      if (managersResult.status === 'fulfilled') setManagers(managersResult.value.data.data || []);

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
        const clients: ClientDTO[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
        setAllClients(clients);
      }

      setLastUpdatedAt(new Date());
    } catch (err) {
      console.error('Erreur chargement projets:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Group projects by client ──────────────────────────────────────────── */
  const groupedByClient = useMemo(() => {
    const map = new Map<string, { client: ClientDTO | null; projects: Projet[] }>();

    allClients.forEach(c => {
      map.set(String(c.id), { client: c, projects: [] });
    });

    map.set('none', { client: null, projects: [] });

    projets.forEach(p => {
      const key = p.clientId ? String(p.clientId) : 'none';
      if (!map.has(key)) {
        map.set(key, { client: null, projects: [] });
      }
      map.get(key)!.projects.push(p);
    });

    return map;
  }, [projets, allClients]);



  /* ── Open multi-project creation modal ─────────────────────────────────── */
  const openCreateModal = (clientKey: string) => {
    setCreateClientKey(clientKey);
    setCreateRows([emptyRow(today)]);
    setCreateError(null);
    setShowCreateModal(true);
  };

  const addRow = () => {
    setCreateRows(prev => [...prev, emptyRow(today)]);
  };

  const removeRow = (idx: number) => {
    setCreateRows(prev => prev.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, partial: Partial<ProjectFormRow>) => {
    setCreateRows(prev => prev.map((r, i) => i === idx ? { ...r, ...partial } : r));
    setCreateError(null);
  };

  const toggleRowChef = (idx: number, mgrId: number) => {
    setCreateRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const ids = r.chefIds.includes(mgrId) ? r.chefIds.filter(x => x !== mgrId) : [...r.chefIds, mgrId];
      return { ...r, chefIds: ids };
    }));
  };

  /* ── Save all projects ─────────────────────────────────────────────────── */
  const handleCreateAll = async () => {
    // Validate
    for (let i = 0; i < createRows.length; i++) {
      const r = createRows[i];
      if (!r.nom.trim()) { setCreateError(`Projet ${i + 1}: le nom est obligatoire.`); return; }
      if (r.typeProjet === 'DETERMINE' && r.dateFin && r.dateFin <= r.dateDebut) {
        setCreateError(`Projet ${i + 1}: la date de fin doit être après la date de début.`);
        return;
      }
    }

    setCreating(true);
    setCreateError(null);
    try {
      for (const r of createRows) {
        await projetService.create({
          nom: r.nom,
          dateDebut: r.dateDebut,
          dateFin: r.typeProjet === 'DETERMINE' ? r.dateFin : null,
          statut: StatutProjet.PLANIFIE,
          typeProjet: r.typeProjet,
          clientId: createClientKey === 'none' ? null : Number(createClientKey),
          chefDeProjetIds: r.chefIds,
          createurId: user?.employeId,
        } as any);
      }
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  /* ── Edit modal ────────────────────────────────────────────────────────── */
  const handleEdit = (projet: Projet) => {
    setEditingProjet(projet);
    setEditForm({
      nom: projet.nom,
      dateDebut: projet.dateDebut,
      dateFin: projet.dateFin ?? '',
      statut: projet.statut,
      typeProjet: (projet.typeProjet as any) ?? 'DETERMINE',
      clientId: projet.clientId ?? null,
    });
    setEditChefIds(
      (projet.chefsDeProjet && projet.chefsDeProjet.length > 0
        ? projet.chefsDeProjet
        : projet.chefDeProjet ? [projet.chefDeProjet] : []
      ).map(c => c.id)
    );
    setEditDateError(null);
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (editForm.typeProjet === 'DETERMINE' && editForm.dateFin && editForm.dateFin <= editForm.dateDebut) {
      setEditDateError('La date de fin doit être après la date de début');
      return;
    }
    try {
      await projetService.update(editingProjet!.id, {
        nom: editForm.nom,
        dateDebut: editForm.dateDebut,
        dateFin: editForm.typeProjet === 'DETERMINE' ? editForm.dateFin : null,
        statut: editForm.statut,
        typeProjet: editForm.typeProjet,
        chefDeProjetIds: editChefIds,
        clientId: editForm.clientId,
      } as any);
      setShowEditModal(false);
      setEditingProjet(null);
      loadData();
    } catch (err: any) {
      setEditDateError(err?.response?.data?.message || 'Erreur');
    }
  };

  /* ── Member management ─────────────────────────────────────────────────── */
  const handleAffectMembers = (projet: Projet) => {
    setMemberProjet(projet);
    setSelectedMembreIds((projet.membres ?? []).map(m => m.id));
    setMemberChefIds(
      (projet.chefsDeProjet && projet.chefsDeProjet.length > 0
        ? projet.chefsDeProjet
        : projet.chefDeProjet ? [projet.chefDeProjet] : []
      ).map(c => c.id)
    );
    setLoadingSubordinates(true);
    if (user?.employeId) {
      employeService.getSubordinates(user.employeId)
        .then(res => setSubordinates(res.data.data || []))
        .catch(console.error)
        .finally(() => setLoadingSubordinates(false));
    } else {
      setLoadingSubordinates(false);
    }
    setShowMemberModal(true);
  };

  const handleMemberSave = async () => {
    if (!memberProjet) return;
    try {
      await projetService.update(memberProjet.id, {
        nom: memberProjet.nom,
        dateDebut: memberProjet.dateDebut as any,
        dateFin: memberProjet.dateFin as any,
        statut: memberProjet.statut as any,
        typeProjet: memberProjet.typeProjet,
        chefDeProjetIds: memberChefIds,
        clientId: memberProjet.clientId,
        membreIds: selectedMembreIds,
      } as any);
      setShowMemberModal(false);
      setMemberProjet(null);
      loadData();
    } catch (err) { console.error(err); }
  };

  /* ── Other actions ─────────────────────────────────────────────────────── */
  const handleDelete = (id: number) => {
    confirm('Supprimer ce projet ?', async () => {
      try { await projetService.delete(id); loadData(); } catch (err) { console.error(err); }
    }, 'Supprimer le projet');
  };

  const handleChangeStatut = async (id: number, statut: StatutProjet) => {
    try { await projetService.changeStatut(id, statut); loadData(); } catch (err) { console.error(err); }
  };

  const openFile = (c: ClientDTO) => {
    if (c.fileUrl) {
      const base = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://rh-antigone.onrender.com';
      window.open(`${base}${c.fileUrl}`, '_blank');
    }
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const getChefs = (p: Projet) =>
    (p.chefsDeProjet && p.chefsDeProjet.length > 0) ? p.chefsDeProjet : (p.chefDeProjet ? [p.chefDeProjet] : []);

  const getClientForKey = (key: string) => allClients.find(c => String(c.id) === key) || null;

  const getClientInitials = (name: string) => {
    const cleaned = name
      .replace(/\(.*?\)/g, '')
      .replace(/[\/]/g, ' ')
      .trim();
    if (!cleaned) return 'CL';
    const parts = cleaned.split(/\s+/g).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
    return cleaned.slice(0, 2).toUpperCase();
  };

  const getClientKey = (clientName: string) => {
    const n = clientName.trim().toLowerCase();
    if (n.includes('tecnocasa')) return 'tecnocasa';
    if (n.includes('gmir')) return 'gmir';
    if (n.includes('skinlab')) return 'skinlab';
    if (n.includes('eshuji') || n.includes('client')) return 'eshuji';
    if (n.includes('shemi')) return 'shemi';
    if (n.includes('zen')) return 'zen';
    return 'default';
  };

  const getClientProgress = (clientKey: string, projects: Projet[]) => {
    if (!projects.length) return 0;

    const weights: Record<string, number> = {
      [StatutProjet.CLOTURE]: 1,
      [StatutProjet.EN_COURS]: 0.5,
      [StatutProjet.PLANIFIE]: 0.2,
      [StatutProjet.ANNULE]: 0,
    };
    const score = projects.reduce((acc, p) => acc + (weights[p.statut] ?? 0), 0);
    return Math.max(0, Math.min(100, Math.round((score / projects.length) * 100)));
  };

  const getClientPreviewMembers = (projects: Projet[]) => {
    const map = new Map<number, Employe>();
    projects.forEach(p => {
      getChefs(p).forEach(c => {
        if (c?.id != null && !map.has(c.id)) map.set(c.id, c);
      });
    });
    return [...map.values()];
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [clientsTab, clientSearch]);

  /* ─── RENDER ───────────────────────────────────────────────────────────── */
  const sortedEntries = [...groupedByClient.entries()].sort((a, b) => {
    if (a[0] === 'none') return 1;
    if (b[0] === 'none') return -1;
    const diff = b[1].projects.length - a[1].projects.length;
    if (diff !== 0) return diff;
    return (a[1].client?.nom || '').localeCompare(b[1].client?.nom || '');
  });

  const clientEntries = sortedEntries.filter(([key]) => key !== 'none');

  const filteredClientEntries = clientEntries
    .filter(([_, { client, projects }]) => {
      if (clientsTab === 'ACTIFS') return projects.length > 0;
      if (clientsTab === 'NON_ASSIGNE') return projects.length === 0;
      if (clientsTab === 'RECENTS') return projects.length > 0;
      return true;
    })
    .filter(([_, { client }]) => {
      const q = clientSearch.trim().toLowerCase();
      if (!q) return true;
      return (client?.nom || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (clientsTab !== 'RECENTS') return 0;
      const lastDate = (projects: Projet[]) => {
        const dates = projects
          .map(p => p.dateDebut || p.dateFin)
          .filter(Boolean)
          .map(d => String(d).substring(0, 10));
        const sorted = dates.sort();
        return sorted.length ? sorted[sorted.length - 1] : '';
      };
      return lastDate(b[1].projects).localeCompare(lastDate(a[1].projects));
    });

  const statsClientsCount = clientEntries.length;
  const statsProjects = clientEntries.flatMap(([_, { projects }]) => projects);
  const statsTotalProjects = statsProjects.length;
  const statsNoProjectsClients = clientEntries.filter(([_, { projects }]) => projects.length === 0).length;

  const monthKey = new Date().toISOString().substring(0, 7);
  const statsNewThisMonth = statsProjects.filter(p => String(p.dateDebut || '').substring(0, 7) === monthKey).length;

  const statsPending = statsProjects.filter(p => {
    const hasChefs = (p.chefsDeProjet && p.chefsDeProjet.length > 0) || !!p.chefDeProjet;
    return !hasChefs;
  }).length;

  /* ── Pagination Logic (clients dashboard) ── */
  const totalPages = Math.max(1, Math.ceil(filteredClientEntries.length / clientsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(prev => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedEntries = filteredClientEntries.slice(
    (safePage - 1) * clientsPerPage,
    safePage * clientsPerPage
  );

  if (loading) return (
    <div className="pp-loading">
      <div className="pp-spinner" />
      Chargement des projets...
    </div>
  );

  return (
    <div className="pp-page pp-tousprojets">
      {/* ── CLIENTS DASHBOARD (Tous les Projets) ── */}
      {viewState === 'CLIENTS' && (
        <>
          <div className="pp-topbar">
            <div>
              <h1 className="pp-title">
                Tous les <span className="pp-accent">Projets</span>
              </h1>
              
            </div>

            <div className="pp-topbar-actions">
              <input
                className="pp-search"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Rechercher..."
                aria-label="Rechercher un client"
              />
            
            </div>
          </div>

          <div className="pp-stats">
            <div className="pp-stat-card">
              <div className="pp-stat-label">TOTAL PROJETS</div>
              <div className="pp-stat-value">{statsTotalProjects}</div>
              <div className="pp-stat-sub text-green-600">+{statsNewThisMonth} ce mois</div>
            </div>
            <div className="pp-stat-card">
              <div className="pp-stat-label">CLIENTS ACTIFS</div>
              <div className="pp-stat-value">{statsClientsCount}</div>
              <div className="pp-stat-sub text-blue-600">{statsNoProjectsClients} sans assigné</div>
            </div>
            <div className="pp-stat-card">
              <div className="pp-stat-label">EN ATTENTE</div>
              <div className="pp-stat-value">{statsPending}</div>
              <div className="pp-stat-sub text-amber-700">À assigner</div>
            </div>
          </div>

          <div className="pp-tabs" role="tablist" aria-label="Filtres">
            <button type="button" className={`pp-tab ${clientsTab === 'TOUS' ? 'active' : ''}`} onClick={() => setClientsTab('TOUS')}>Tous</button>
            <button type="button" className={`pp-tab ${clientsTab === 'ACTIFS' ? 'active' : ''}`} onClick={() => setClientsTab('ACTIFS')}>Actifs</button>
            <button type="button" className={`pp-tab ${clientsTab === 'NON_ASSIGNE' ? 'active' : ''}`} onClick={() => setClientsTab('NON_ASSIGNE')}>Non assignés</button>
            <button type="button" className={`pp-tab ${clientsTab === 'RECENTS' ? 'active' : ''}`} onClick={() => setClientsTab('RECENTS')}>Récents</button>
          </div>

          <div className="pp-clients-grid">
            {paginatedEntries.map(([key, { client, projects }]) => {
              const name = client?.nom || 'Client';
              const clientKey = getClientKey(name);
              const progress = getClientProgress(clientKey, projects);
              const previewMembers = getClientPreviewMembers(projects);
              const hasLogo = Boolean(client?.logoUrl);

              const mark = (() => {
                if (clientKey === 'tecnocasa') return { text: getClientInitials(name), cls: 'pp-mark-tecnocasa' };
                if (clientKey === 'skinlab') return { text: getClientInitials(name), cls: 'pp-mark-skinlab' };
                if (clientKey === 'zen') return { text: getClientInitials(name), cls: 'pp-mark-zen' };
                if (clientKey === 'gmir') return { text: getClientInitials(name), cls: 'pp-mark-gmir' };
                if (clientKey === 'eshuji') return { text: getClientInitials(name), cls: 'pp-mark-eshuji' };
                if (clientKey === 'shemi') return { text: getClientInitials(name), cls: 'pp-mark-shemi' };
                return { text: getClientInitials(name), cls: 'pp-mark-default' };
              })();

            

              return (
                <div
                  key={key}
                  className="pp-client-card pp-dashboard-card"
                  onClick={() => { setSelectedClientKey(key); setViewState('PROJECTS'); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedClientKey(key);
                      setViewState('PROJECTS');
                    }
                  }}
                >
                  <div className="pp-dashboard-card-head">
                    <div className={`pp-client-mark ${mark.cls} ${hasLogo ? 'pp-client-mark--logo' : ''}`}>
                      {hasLogo ? (
                        <img src={`${API_BASE}${client!.logoUrl}`} alt={name} />
                      ) : (
                        mark.text
                      )}
                    </div>
                    <div className="pp-client-head-text">
                      <div className="pp-client-name">{name}</div>
                    </div>
                    
                  </div>

                  <div className="pp-progress">
                    <div className="pp-progress-bar" aria-label={`Progression ${progress}%`}>
                      <div className="pp-progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                    {projects.length === 0 ? (
                      <>
                        <div className="pp-progress-note">Pas encore démarré</div>
                        <div className="pp-progress-pct">0%</div>
                      </>
                    ) : (
                      <div className="pp-progress-pct">{progress}%</div>
                    )}
                  </div>

                  <div className="pp-dashboard-card-foot">
                    <span className="pp-pill">{projects.length} projet{projects.length !== 1 ? 's' : ''}</span>
                    <div className="pp-foot-right">
                      {projects.length === 0 ? (
                        <button
                          type="button"
                          className="pp-assign-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCreateModal(key);
                          }}
                        >
                          + Assigner
                        </button>
                      ) : (
                        <>
                          <div className="pp-avatars" aria-label="Membres">
                            {previewMembers.slice(0, 3).map(m => (
                              <div key={m.id} className="pp-avatar" title={`${m.prenom} ${m.nom}`}>
                                {m.imageUrl
                                  ? <img src={m.imageUrl} alt={m.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : <>{(m.prenom?.[0] || '')}{(m.nom?.[0] || '')}</>}
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="pp-view-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClientKey(key);
                              setViewState('PROJECTS');
                            }}
                          >
                            Voir →
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pp-pagination" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={safePage === 1}
              className="pp-page-btn"
            >
              Précédent
            </button>
            <div className="pp-page-numbers">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`pp-page-number ${safePage === index + 1 ? 'active' : ''}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={safePage === totalPages}
              className="pp-page-btn"
            >
              Suivant
            </button>
          </div>
        </>
      )}

      {/* ── PROJECTS VIEW ── */}
      {viewState === 'PROJECTS' && (
        <div className="pp-projects-view">
          <div className="pp-projects-header">
            <div>
              <button className="pp-back" onClick={() => setViewState('CLIENTS')}>
                <HiOutlineArrowLeft size={14} /> Retour aux clients
              </button>
              <h2 className="pp-section-title">
                {getClientForKey(selectedClientKey || 'none')?.nom || 'Sans Client'}
              </h2>
              <p className="pp-section-meta">
                {(groupedByClient.get(selectedClientKey || 'none')?.projects || []).length} projets pour ce client
              </p>
            </div>
            {canManageAllProjets && (
              <button className="pp-btn-new" onClick={() => openCreateModal(selectedClientKey || 'none')}>
                <HiOutlinePlus size={16} /> Nouveau Projet
              </button>
            )}
          </div>

          <div className="pp-projects-grid">
            {(groupedByClient.get(selectedClientKey || 'none')?.projects || []).map((p, i) => {
              const chefs = getChefs(p);
              const statusKey = p.statut.toLowerCase().replace('_', '-');
              return (
                <div
                  key={p.id}
                  onClick={() => { setSelectedProject(p); setViewState('PROJECT_DETAILS'); }}
                  className={`pp-project-card status-${statusKey}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="pp-project-card-head">
                    <h3 className="pp-project-name">{p.nom}</h3>
                    <span className={`pp-status-badge ${statusKey}`}>{p.statut.replace('_', ' ')}</span>
                  </div>
                  <div className="pp-project-date">
                    <HiOutlineCalendar size={13} />
                    <span>{formatDate(p.dateDebut)} — {p.dateFin ? formatDate(p.dateFin) : 'Indéterminé'}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="pp-managers-label">Managers</p>
                    {chefs.length === 0 ? (
                      <span className="pp-avatar-none">Non assigné</span>
                    ) : (
                      <div className="pp-avatars">
                        {chefs.slice(0, 3).map(c => (
                          <div key={c.id} className="pp-avatar" title={`${c.prenom} ${c.nom}`}>
                            {congeAujourdhuiIds.has(c.id) && <div className="pp-on-leave-dot" title="En congé" />}
                            {c.imageUrl
                              ? <img src={c.imageUrl} alt={c.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <>{c.prenom?.[0]}{c.nom?.[0]}</>}
                          </div>
                        ))}
                        {chefs.length > 3 && <div className="pp-avatar pp-avatar-overflow">+{chefs.length - 3}</div>}
                      </div>
                    )}
                  </div>
                  <div className="pp-project-footer">
                    <span className="pp-members-count">{(p.membres || []).length} membres</span>
                    <span className="pp-details-cta">Détails →</span>
                  </div>
                </div>
              );
            })}
            {canManageAllProjets && (
              <div onClick={() => openCreateModal(selectedClientKey || 'none')} className="pp-new-project-card">
                <div className="pp-new-icon"><HiOutlinePlus size={20} /></div>
                <p className="pp-new-label">Nouveau Projet</p>
                <p className="pp-new-hint">Lancer une nouvelle initiative</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PROJECT DETAILS VIEW ── */}
      {viewState === 'PROJECT_DETAILS' && selectedProject && (
        <div className="space-y-6 lg:space-y-8">
          {/* Top Header Back Button */}
          <div className="flex items-center gap-4">
            <button className="pp-back" onClick={() => setViewState('PROJECTS')}>
              <HiOutlineArrowLeft size={16} /> Détails du Projet
            </button>
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            {/* Info Block (Left) */}
            <div className="max-w-2xl pp-detail-header">
              <h1 className="pp-detail-title">
                {selectedProject.isMediaPlanProject && <span style={{ marginRight: '8px' }}>👉</span>}
                {selectedProject.nom}
              </h1>
              <div className="pp-detail-meta">
                <span className={`pp-status-badge ${selectedProject.statut.toLowerCase().replace('_', '-')}`}>
                  {selectedProject.statut.replace('_', ' ')}
                </span>
                {selectedProject.typeProjet === 'INDETERMINE' && (
                  <span className="pp-status-badge planifie">
                    Projet Indéterminé
                  </span>
                )}
                <div className="pp-detail-date-chip">
                  <HiOutlineCalendar size={14} />
                  <span>{formatDate(selectedProject.dateDebut)} au {selectedProject.dateFin ? formatDate(selectedProject.dateFin) : 'Non défini'}</span>
                </div>
              </div>
            </div>

            {/* Actions Block (Right) */}
            <div className="pp-actions-bar">
              {(canManageAllProjets || canViewProjetsCreateTaches) && selectedProject.statut === 'PLANIFIE' && (
                <button className="pp-btn-action" onClick={() => { handleChangeStatut(selectedProject.id, StatutProjet.EN_COURS); setSelectedProject({ ...selectedProject, statut: StatutProjet.EN_COURS }); }}>
                  Démarrer
                </button>
              )}
              {(canManageAllProjets || canViewProjetsCreateTaches) && selectedProject.statut === 'EN_COURS' && (
                <button className="pp-btn-action" onClick={() => { handleChangeStatut(selectedProject.id, StatutProjet.CLOTURE); setSelectedProject({ ...selectedProject, statut: StatutProjet.CLOTURE }); }}>
                  Clôturer
                </button>
              )}
              {(canManageAllProjets || canViewProjetsCreateTaches) && (
                <button className="pp-btn-action" onClick={() => navigate(`/projets/${selectedProject.id}/taches`)}>
                  <HiOutlineClipboardList size={16} /> Tâches
                </button>
              )}
              {(canManageAllProjets || canViewProjetsCreateTaches) && ((selectedProject.chefsDeProjet && selectedProject.chefsDeProjet.some(c => c.id === user?.employeId)) || selectedProject.chefDeProjet?.id === user?.employeId) && (
                <button className="pp-btn-action" onClick={() => handleAffectMembers(selectedProject)}>
                  <HiOutlineUserGroup size={16} /> Affecter
                </button>
              )}
              {canManageAllProjets && (
                <button className="pp-btn-action" onClick={() => handleEdit(selectedProject)}>
                  <HiOutlinePencil size={16} /> Modifier
                </button>
              )}
              {canManageAllProjets && (
                <button className="pp-btn-action pp-btn-danger" onClick={() => handleDelete(selectedProject.id)}>
                  <HiOutlineTrash size={16} /> Supprimer
                </button>
              )}
            </div>
          </div>

          {/* Media Plan Details Panel */}
          {selectedProject.isMediaPlanProject && mediaPlanDetails && (
            <div className="pp-mediaplan">
              <h4 className="pp-mediaplan-title">
                <HiOutlineDocumentText size={16} /> Détails Media Plan
              </h4>
              <div className="pp-mediaplan-grid">
                <div className="pp-mediaplan-field"><label>Format</label><span>{mediaPlanDetails.format}</span></div>
                <div className="pp-mediaplan-field"><label>Type</label><span>{mediaPlanDetails.type || '-'}</span></div>
                <div className="pp-mediaplan-field"><label>Publication</label><span>{mediaPlanDetails.datePublication ? formatDate(mediaPlanDetails.datePublication) : '-'}</span></div>
                <div className="pp-mediaplan-field"><label>Lien Drive</label>
                  {mediaPlanDetails.lienDrive ? <a href={mediaPlanDetails.lienDrive} target="_blank" rel="noreferrer">Ouvrir Drive</a> : <span>-</span>}
                </div>
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(232, 106, 46, 0.2)' }}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="pp-mediaplan-field">
                    <label>Texte sur Visuel</label>
                    <span style={{ fontWeight: 'normal' }}>{mediaPlanDetails.texteSurVisuel || '-'}</span>
                  </div>
                  <div className="pp-mediaplan-field">
                    <label>Inspiration / Autres</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontWeight: 'normal' }}>
                      {mediaPlanDetails.inspiration ? (
                        mediaPlanDetails.inspiration.startsWith('http') || mediaPlanDetails.inspiration.startsWith('www') ?
                          <a href={mediaPlanDetails.inspiration.startsWith('http') ? mediaPlanDetails.inspiration : `https://${mediaPlanDetails.inspiration}`} target="_blank" rel="noreferrer">Inspiration (Lien)</a>
                          : <span>{mediaPlanDetails.inspiration}</span>
                      ) : '-'}
                      {mediaPlanDetails.autresElements && <span style={{ borderLeft: '1px solid #ffc299', paddingLeft: 8 }}>{mediaPlanDetails.autresElements}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pp-panels-grid">
            {/* Managers Panel */}
            <div className="pp-panel">
              <h4 className="pp-panel-title">
                <div className="pp-panel-title-icon"><HiOutlineUserGroup size={14} /></div>
                Department Managers
              </h4>
              <div className="pp-panel-list">
                {getChefs(selectedProject).length === 0 ? (
                  <p className="pp-empty-panel">Aucun manager assigné</p>
                ) : (
                  getChefs(selectedProject).map(m => (
                    <div key={m.id} className="pp-member-row">
                      <div className="pp-member-avatar">
                        {congeAujourdhuiIds.has(m.id) && <div className="pp-on-leave-dot" title="En congé" />}
                        {m.imageUrl ? <img src={m.imageUrl} alt={m.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{m.prenom?.[0]}{m.nom?.[0]}</span>}
                      </div>
                      <div>
                        <p className="pp-member-name">{m.prenom} {m.nom}</p>
                        <p className="pp-member-role">Manager</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Members Panel */}
            <div className="pp-panel">
              <h4 className="pp-panel-title">
                <div className="pp-panel-title-icon" style={{ background: '#f2f4f7', color: '#667085' }}><HiOutlineUserGroup size={14} /></div>
                Membres du projet
              </h4>
              <div className="pp-panel-list">
                {!(selectedProject.membres ?? []).length ? (
                  <p className="pp-empty-panel">Aucun membre assigné</p>
                ) : (
                  (selectedProject.membres ?? []).map(m => (
                    <div key={m.id} className="pp-member-row">
                      <div className="pp-member-avatar member">
                        {m.imageUrl ? <img src={m.imageUrl} alt={m.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{m.prenom?.[0]}{m.nom?.[0]}</span>}
                      </div>
                      <div>
                        <p className="pp-member-name">{m.prenom} {m.nom}</p>
                        <p className="pp-member-role">{m.departement || 'Membre'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}     {/* ══════════════════════════════════════════════════════════════════════
          MULTI-PROJECT CREATION MODAL
         ══════════════════════════════════════════════════════════════════════ */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Créer des projets" size="lg">
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {createRows.map((row, idx) => {
            const clientObj = getClientForKey(createClientKey);
            return (
              <div key={idx} className="relative rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-dark space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <p className="text-theme-sm font-semibold text-gray-800 dark:text-white">Projet {idx + 1}</p>
                  {createRows.length > 1 && (
                    <button onClick={() => removeRow(idx)} className="text-error-500 hover:text-error-600 text-theme-xs font-medium">Supprimer</button>
                  )}
                </div>

                {/* Client (read-only) */}
                <div className="h-10 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-3 text-theme-sm text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <HiOutlineBriefcase className="pp-anim-float text-brand-500" size={16} />
                  <span>{clientObj ? clientObj.nom : 'Aucun client'}</span>
                </div>

                {/* Nom */}
                <input
                  type="text"
                  value={row.nom}
                  onChange={e => updateRow(idx, { nom: e.target.value })}
                  className={inputClass}
                  placeholder="Titre du projet *"
                />

                {/* Chefs de projet */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Department Manager</label>
                  <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                    {managers.map(m => {
                      const sel = row.chefIds.includes(m.id);
                      return (
                        <label key={m.id} className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${sel ? 'bg-warning-50 dark:bg-warning-500/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                          <input type="checkbox" checked={sel} onChange={() => toggleRowChef(idx, m.id)} className="h-3.5 w-3.5 rounded text-warning-500" />
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning-100 text-[9px] font-bold text-warning-700">{m.prenom?.[0]}{m.nom?.[0]}</span>
                          <span className="text-theme-xs font-medium text-gray-700 dark:text-gray-300 truncate">{m.prenom} {m.nom}</span>
                          {congeAujourdhuiIds.has(m.id) && <span className="text-[10px] text-warning-500 pp-anim-pulse"><HiOutlineSun size={14} /></span>}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Type de projet */}
                <div className="flex gap-5">
                  {(['DETERMINE', 'INDETERMINE'] as const).map(type => (
                    <label key={type} className="flex cursor-pointer items-center gap-2">
                      <input type="radio" name={`createType-${idx}`} checked={row.typeProjet === type}
                        onChange={() => updateRow(idx, { typeProjet: type, dateFin: '' })}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500" />
                      <span className="text-theme-sm text-gray-700 dark:text-gray-300">
                        {type === 'DETERMINE' ? 'Déterminé' : 'Indéterminé'}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Dates */}
                <div className={`grid gap-3 ${row.typeProjet === 'DETERMINE' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <input type="date" value={row.dateDebut} min={today}
                    onChange={e => updateRow(idx, { dateDebut: e.target.value })}
                    className={inputClass} style={{ colorScheme: 'dark' }} />
                  {row.typeProjet === 'DETERMINE' && (
                    <input type="date" value={row.dateFin} min={row.dateDebut || today}
                      onChange={e => updateRow(idx, { dateFin: e.target.value })}
                      className={inputClass} style={{ colorScheme: 'dark' }} />
                  )}
                </div>
              </div>
            );
          })}

          {/* ── Add another project ── */}
          <button
            onClick={addRow}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-orange-300 py-3 text-theme-sm font-medium text-orange-600 hover:bg-orange-50/40 dark:border-orange-500/30 dark:text-orange-400 dark:hover:bg-orange-500/5 transition-colors"
          >
            <HiOutlinePlus size={16} /> Ajouter un autre projet
          </button>
        </div>

        {createError && <div className="mt-3 rounded-lg bg-error-50 px-4 py-2 text-theme-sm text-error-600 dark:bg-error-500/10">{createError}</div>}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          <span className="text-theme-xs text-gray-500 dark:text-gray-400">
            {createRows.length} projet{createRows.length !== 1 ? 's' : ''} en attente
          </span>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Annuler</Button>
            <Button onClick={handleCreateAll} disabled={creating}>
              {creating ? 'Création...' : `Créer ${createRows.length > 1 ? 'les projets' : 'le projet'}`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Modifier le projet" size="lg">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
            <input type="text" value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} className={inputClass} />
          </div>

          <div>
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Chefs des department</label>
            <div className="max-h-44 overflow-y-auto space-y-1.5 rounded-lg border border-gray-200 p-2 dark:border-gray-700">
              {managers.map(m => {
                const sel = editChefIds.includes(m.id);
                return (
                  <label key={m.id} className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${sel ? 'bg-warning-50 dark:bg-warning-500/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <input type="checkbox" checked={sel} onChange={() => setEditChefIds(prev => prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id])} className="h-4 w-4 rounded text-warning-500" />
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning-100 text-[11px] font-bold text-warning-700">{m.prenom?.[0]}{m.nom?.[0]}</div>
                    <span className="text-theme-sm font-medium text-gray-800 dark:text-white truncate">{m.prenom} {m.nom}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
            <div className="flex gap-6">
              {(['DETERMINE', 'INDETERMINE'] as const).map(type => (
                <label key={type} className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="editType" value={type} checked={editForm.typeProjet === type}
                    onChange={() => setEditForm(f => ({ ...f, typeProjet: type, dateFin: '' }))}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500" />
                  <span className="text-theme-sm text-gray-700 dark:text-gray-300">{type === 'DETERMINE' ? 'Déterminé' : 'Indéterminé'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={`grid gap-4 ${editForm.typeProjet === 'DETERMINE' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Date début</label>
              <input type="date" value={editForm.dateDebut} onChange={e => { setEditForm(f => ({ ...f, dateDebut: e.target.value })); setEditDateError(null); }} className={inputClass} style={{ colorScheme: 'dark' }} />
            </div>
            {editForm.typeProjet === 'DETERMINE' && (
              <div>
                <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Date fin</label>
                <input type="date" value={editForm.dateFin} min={editForm.dateDebut || today} onChange={e => { setEditForm(f => ({ ...f, dateFin: e.target.value })); setEditDateError(null); }} className={inputClass} style={{ colorScheme: 'dark' }} />
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
            <select value={editForm.statut} onChange={e => setEditForm(f => ({ ...f, statut: e.target.value as StatutProjet }))} className={inputClass}>
              {Object.values(StatutProjet).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {editDateError && <div className="rounded-lg bg-error-50 px-4 py-2 text-theme-sm text-error-600 dark:bg-error-500/10">{editDateError}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Annuler</Button>
            <Button onClick={handleEditSave}>Modifier</Button>
          </div>
        </div>
      </Modal>

      {/* ── Member Modal ── */}
      <Modal isOpen={showMemberModal} onClose={() => setShowMemberModal(false)} title="Gérer les membres du projet" size="lg">
        <div className="space-y-4">
          <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 dark:border-brand-500/20 dark:bg-brand-500/5">
            <p className="text-theme-sm font-semibold text-brand-700 dark:text-brand-300">{memberProjet?.nom}</p>
            <p className="mt-0.5 text-theme-xs text-brand-500">Sélectionnez les employés à ajouter à ce projet.</p>
          </div>
          {loadingSubordinates ? (
            <div className="py-6 text-center text-gray-400 text-theme-sm">Chargement...</div>
          ) : subordinates.length === 0 ? (
            <div className="rounded-lg bg-warning-50 px-4 py-3 text-theme-sm text-warning-600 dark:bg-warning-500/10">Aucun employé sous votre responsabilité.</div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {subordinates.map(sub => {
                const sel = selectedMembreIds.includes(sub.id);
                return (
                  <label key={sub.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${sel ? 'border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10' : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'}`}>
                    <input type="checkbox" checked={sel} onChange={() => setSelectedMembreIds(prev => prev.includes(sub.id) ? prev.filter(x => x !== sub.id) : [...prev, sub.id])} className="h-4 w-4 rounded text-brand-500" />
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-theme-xs font-bold text-brand-600">{sub.prenom?.[0]}{sub.nom?.[0]}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-theme-sm font-semibold text-gray-800 dark:text-white truncate">{sub.prenom} {sub.nom}</p>
                      {sub.departement && <p className="text-theme-xs text-gray-400 flex items-center gap-1"><HiOutlineOfficeBuilding className="pp-anim-float" size={12} /> {sub.departement}</p>}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowMemberModal(false)}>Annuler</Button>
            <Button onClick={handleMemberSave}>Enregistrer ({selectedMembreIds.length} sélectionné{selectedMembreIds.length !== 1 ? 's' : ''})</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={confirmState.isOpen} message={confirmState.message} title={confirmState.title} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
};

export default ProjetsPage;
