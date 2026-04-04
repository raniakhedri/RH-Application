import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineClipboardList, HiOutlineDocumentText, HiOutlineDownload, HiOutlineChevronDown } from 'react-icons/hi';
import { projetService } from '../api/projetService';
import { employeService } from '../api/employeService';
import { demandeService } from '../api/demandeService';
import { clientService } from '../api/clientService';
import type { ClientDTO } from '../api/clientService';
import { useAuth } from '../context/AuthContext';
import { Projet, StatutProjet, Employe, StatutDemande } from '../types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

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
  const canManageProjets = perms.includes('MANAGE_PROJETS');
  const canCreationTaches = perms.includes('CREATION_DES_TACHES');
  const [projets, setProjets] = useState<Projet[]>([]);
  const [allClients, setAllClients] = useState<ClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState<Employe[]>([]);
  const [congeAujourdhuiIds, setCongeAujourdhuiIds] = useState<Set<number>>(new Set());

  // Accordion open states – key = clientId or 'none'
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());

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

  const loadData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const userId = user?.employeId;

      const [pResult, managersResult, demandesResult, clientsResult] = await Promise.allSettled([
        userId ? projetService.getByEmploye(userId) : projetService.getAll(),
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

  /* ── Toggle accordion ──────────────────────────────────────────────────── */
  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

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

  /* ─── RENDER ───────────────────────────────────────────────────────────── */
  if (loading) return <div className="py-20 text-center text-gray-500">Chargement...</div>;

  const sortedEntries = [...groupedByClient.entries()].sort((a, b) => {
    if (a[0] === 'none') return 1;
    if (b[0] === 'none') return -1;
    const diff = b[1].projects.length - a[1].projects.length;
    if (diff !== 0) return diff;
    return (a[1].client?.nom || '').localeCompare(b[1].client?.nom || '');
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Mes Projets</h1>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
            {projets.length} projet{projets.length !== 1 ? 's' : ''} — organisés par client
          </p>
        </div>
      </div>

      {/* ── Client accordions ── */}
      <div className="space-y-3">
        {sortedEntries.map(([key, { client, projects }]) => {
          const isOpen = openAccordions.has(key);

          return (
            <div key={key} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-dark overflow-hidden">
              {/* ── Accordion Header ── */}
              <button
                onClick={() => toggleAccordion(key)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <HiOutlineChevronDown
                    size={18}
                    className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                  />
                  {client ? (
                    <div className="flex items-center gap-3 flex-wrap min-w-0 text-left">
                      <span className="font-semibold text-gray-800 dark:text-white text-theme-sm">
                        projet de {client.nom}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500">___</span>
                      <span className="text-theme-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                        {client.description || <span className="italic">pas de description</span>}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500">___</span>
                      {client.fileName ? (
                        <span
                          onClick={(e) => { e.stopPropagation(); openFile(client); }}
                          className="flex items-center gap-1 text-brand-600 dark:text-brand-400 text-theme-xs font-medium hover:underline cursor-pointer"
                        >
                          <HiOutlineDocumentText size={14} />
                          <span className="max-w-[80px] truncate">{client.fileName}</span>
                          <HiOutlineDownload size={12} />
                        </span>
                      ) : (
                        <span className="text-theme-xs text-gray-300 italic">aucun fichier</span>
                      )}
                      <span className="text-gray-400 dark:text-gray-500">___</span>
                      <span className="text-theme-xs text-gray-400">
                        {client.dateCreation ? new Date(client.dateCreation).toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </div>
                  ) : (
                    <span className="font-semibold text-gray-500 dark:text-gray-400 text-theme-sm">Aucun client</span>
                  )}
                </div>
                <span className="shrink-0 ml-3 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  {projects.length}
                </span>
              </button>

              {/* ── Accordion Body ── */}
              {isOpen && (
                <div className="border-t border-gray-100 dark:border-gray-700">
                  {projects.length > 0 ? (
                    <table className="w-full text-left text-theme-sm">
                      <thead className="bg-gray-50/60 dark:bg-gray-800/30">
                        <tr>
                          <th className="px-5 py-2.5 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wide">Nom</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wide">Statut</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wide">Department Manager</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wide">Membres</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wide">Début</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wide">Fin</th>
                          <th className="px-4 py-2.5 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wide text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {projects.map(p => {
                          const chefs = getChefs(p);
                          return (
                            <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                              <td className="px-5 py-3">
                                <span className="font-medium text-gray-800 dark:text-white">{p.nom}</span>
                                {p.typeProjet === 'INDETERMINE' && (
                                  <span className="ml-2 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">Indéterminé</span>
                                )}
                              </td>
                              <td className="px-4 py-3"><Badge text={p.statut} variant={statutBadgeMap[p.statut] || 'neutral'} /></td>
                              <td className="px-4 py-3">
                                {chefs.length === 0 ? '-' : (
                                  <div className="flex flex-wrap gap-1">
                                    {chefs.map(c => (
                                      <span key={c.id} className="flex items-center gap-1 rounded-full bg-warning-50 px-2 py-0.5 text-[11px] font-medium text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
                                        {c.prenom} {c.nom}
                                        {congeAujourdhuiIds.has(c.id) && <span className="text-[9px]">🏖️</span>}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {!(p.membres ?? []).length ? <span className="text-gray-400">-</span> : (
                                  <div className="flex flex-wrap gap-1">
                                    {(p.membres ?? []).map(m => (
                                      <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-secondary-50 px-2 py-0.5 text-[11px] font-medium text-secondary-700 dark:bg-secondary-500/10 dark:text-secondary-400">
                                        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary-200 text-[9px] font-bold dark:bg-secondary-500/30">{m.prenom?.[0]}{m.nom?.[0]}</span>
                                        {m.prenom} {m.nom}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(p.dateDebut)}</td>
                              <td className="px-4 py-3">
                                {p.dateFin ? formatDate(p.dateFin) : <span className="text-purple-500 text-xs font-medium">Indéterminé</span>}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-1">
                                  {canManageProjets && p.statut === 'PLANIFIE' && (
                                    <button onClick={() => handleChangeStatut(p.id, StatutProjet.EN_COURS)} className="rounded-lg p-1.5 text-success-500 hover:bg-success-50" title="Démarrer">
                                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </button>
                                  )}
                                  {canManageProjets && p.statut === 'EN_COURS' && (
                                    <button onClick={() => handleChangeStatut(p.id, StatutProjet.CLOTURE)} className="rounded-lg p-1.5 text-success-500 hover:bg-success-50" title="Clôturer">
                                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </button>
                                  )}
                                  {canCreationTaches && (
                                    <button onClick={() => navigate(`/projets/${p.id}/taches`)} className="rounded-lg p-1.5 text-secondary-500 hover:bg-secondary-50" title="Tâches"><HiOutlineClipboardList size={16} /></button>
                                  )}
                                  {canCreationTaches && ((p.chefsDeProjet && p.chefsDeProjet.some(c => c.id === user?.employeId)) || p.chefDeProjet?.id === user?.employeId) && (
                                    <button onClick={() => handleAffectMembers(p)} className="rounded-lg p-1.5 text-warning-500 hover:bg-warning-50" title="Affecter des membres">👥</button>
                                  )}
                                  {canManageProjets && <button onClick={() => handleEdit(p)} className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50" title="Modifier"><HiOutlinePencil size={16} /></button>}
                                  {canManageProjets && <button onClick={() => handleDelete(p.id)} className="rounded-lg p-1.5 text-error-500 hover:bg-error-50"><HiOutlineTrash size={16} /></button>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="px-5 py-6 text-center text-gray-400 text-theme-sm">Aucun projet pour ce client</div>
                  )}

                  {/* ── Add project button (opens popup) ── */}
                  {canManageProjets && (
                    <div className="border-t border-dashed border-orange-300 dark:border-orange-500/30">
                      <button
                        onClick={() => openCreateModal(key)}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 text-theme-sm font-medium text-orange-600 hover:bg-orange-50/60 dark:text-orange-400 dark:hover:bg-orange-500/5 transition-colors"
                      >
                        <HiOutlinePlus size={16} /> Ajouter un nouveau projet
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
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
                <div className="h-10 flex items-center rounded-lg border border-gray-200 bg-gray-100 px-3 text-theme-sm text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  🤝 {clientObj ? clientObj.nom : 'Aucun client'}
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
                          {congeAujourdhuiIds.has(m.id) && <span className="text-[10px]">🏖️</span>}
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
            <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Chefs de projet</label>
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
                      {sub.departement && <p className="text-theme-xs text-gray-400">🏢 {sub.departement}</p>}
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
