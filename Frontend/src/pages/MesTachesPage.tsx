import React, { useState, useEffect } from 'react';
import { tacheService } from '../api/tacheService';
import { demandeService } from '../api/demandeService';
import { compteService } from '../api/compteService';
import { projetService } from '../api/projetService';
import { useAuth } from '../context/AuthContext';
import { TacheDetail, TacheMembreInfo, StatutTache, StatutDemande, Projet } from '../types';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { HiOutlinePencil, HiOutlineChevronRight, HiOutlineUsers, HiOutlineFolder } from 'react-icons/hi';

interface ProjectGroup {
    projetId: number;
    projetNom: string;
    projetDateFin: string | null;
    projetStatut: string | null;
    chefDeProjetNom: string | null;
    chefsDeProjetIds: Set<number>;
    membres: TacheMembreInfo[];
    tacheCount: number;
}

const statutBadgeMap: Record<string, 'neutral' | 'primary' | 'success'> = {
    TODO: 'neutral',
    IN_PROGRESS: 'primary',
    DONE: 'success',
};

const statutLabels: Record<string, string> = {
    TODO: 'À faire',
    IN_PROGRESS: 'En cours',
    DONE: 'Terminée',
};

const inputClass =
    'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300';

const MemberCard: React.FC<{ membre: TacheMembreInfo }> = ({ membre }) => {
    const isChef = membre.isChef;
    return (
        <div className={`flex items-start gap-3 rounded-xl border p-3.5 shadow-sm ${isChef
            ? 'border-warning-200 bg-warning-50 dark:border-warning-500/20 dark:bg-warning-500/5'
            : 'border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800'
            }`}>
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow ${isChef
                ? 'bg-gradient-to-br from-warning-400 to-warning-600'
                : 'bg-gradient-to-br from-secondary-400 to-secondary-600'
                }`}>
                {membre.prenom?.[0]}{membre.nom?.[0]}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className={`text-theme-sm font-semibold ${isChef ? 'text-warning-700 dark:text-warning-400' : 'text-gray-800 dark:text-white'}`}>
                        {membre.prenom} {membre.nom}
                    </p>
                    {isChef && (
                        <span className="rounded-full bg-warning-100 px-2 py-0.5 text-[10px] font-bold text-warning-600 dark:bg-warning-500/20 dark:text-warning-400">
                            Manager
                        </span>
                    )}
                </div>
                {membre.poste && (
                    <p className="mt-0.5 text-theme-xs text-gray-600 dark:text-gray-300">💼 {membre.poste}</p>
                )}
                {membre.departement && (
                    <p className="mt-0.5 text-theme-xs text-brand-500 dark:text-brand-400">🏢 {membre.departement}</p>
                )}
                {membre.managerNom && (
                    <p className="text-theme-xs text-gray-500 dark:text-gray-400">👤 Manager: {membre.managerNom}</p>
                )}
                {(membre.telephonePro || membre.telephone) && (
                    <p className="text-theme-xs text-gray-500 dark:text-gray-400">📞 {membre.telephonePro || membre.telephone}</p>
                )}
                {membre.email && (
                    <p className="text-theme-xs text-gray-500 dark:text-gray-400">✉️ {membre.email}</p>
                )}
            </div>
        </div>
    );
};

const MesTachesPage: React.FC = () => {
    const { user } = useAuth();
    const [taches, setTaches] = useState<TacheDetail[]>([]);
    const [loading, setLoading] = useState(true);

    const [draggedTache, setDraggedTache] = useState<TacheDetail | null>(null);
    const [dragOverStatut, setDragOverStatut] = useState<string | null>(null);

    const [editingTache, setEditingTache] = useState<TacheDetail | null>(null);
    const [editForm, setEditForm] = useState({ titre: '', dateEcheance: '', statut: 'TODO' as StatutTache });
    const [editError, setEditError] = useState<string | null>(null);
    const [editLoading, setEditLoading] = useState(false);

    const [selectedProject, setSelectedProject] = useState<ProjectGroup | null>(null);
    // Set of employeNom strings for people on congé today
    const [congeAujourdhuiNoms, setCongeAujourdhuiNoms] = useState<Set<string>>(new Set());
    // Set of employeIds that have the MANAGER role
    const [managerEmpIds, setManagerEmpIds] = useState<Set<number>>(new Set());
    // Full project details keyed by projetId (to get all chefsDeProjet)
    const [projetDetails, setProjetDetails] = useState<Map<number, Projet>>(new Map());

    useEffect(() => { loadData(); }, [user?.employeId]);

    const loadData = async () => {
        if (!user?.employeId) {
            setLoading(false); // ← fix: always stop the spinner
            return;
        }
        try {
            const today = new Date().toISOString().split('T')[0];
            const [res, demandesRes, comptesRes] = await Promise.allSettled([
                tacheService.getByAssignee(user.employeId),
                demandeService.getByStatut(StatutDemande.APPROUVEE),
                compteService.getAll(),
            ]);
            if (res.status === 'fulfilled') {
                const tachesData = res.value.data.data || [];
                setTaches(tachesData);

                // Fetch full project details (to get all chefsDeProjet)
                const uniqueProjetIds = Array.from(new Set(tachesData.filter((t: any) => t.projetId).map((t: any) => t.projetId)));
                const projetResults = await Promise.allSettled(
                    uniqueProjetIds.map(id => projetService.getById(id))
                );
                const pMap = new Map<number, Projet>();
                projetResults.forEach((r, i) => {
                    if (r.status === 'fulfilled') {
                        const p = r.value.data.data;
                        if (p) pMap.set(uniqueProjetIds[i], p);
                    }
                });
                setProjetDetails(pMap);
            }
            // Build set of employeIds with the MANAGER role
            if (comptesRes.status === 'fulfilled') {
                const comptes = comptesRes.value.data.data || [];
                const mgrIds = new Set<number>();
                comptes.forEach((c: any) => {
                    const hasManagerRole = (c.roles || []).some((r: any) =>
                        r.nom?.toUpperCase() === 'MANAGER'
                    );
                    if (hasManagerRole && c.employeId) mgrIds.add(c.employeId);
                });
                setManagerEmpIds(mgrIds);
            }
            if (demandesRes.status === 'fulfilled') {
                const demandes = demandesRes.value.data.data || [];
                const onConge = new Set<string>();
                demandes.forEach(d => {
                    if (d.dateDebut && d.dateFin && d.employeNom) {
                        const debut = d.dateDebut.toString().substring(0, 10);
                        const fin = d.dateFin.toString().substring(0, 10);
                        if (debut <= today && today <= fin) {
                            onConge.add(d.employeNom);
                        }
                    }
                });
                setCongeAujourdhuiNoms(onConge);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const projectGroups: ProjectGroup[] = React.useMemo(() => {
        const map = new Map<number, ProjectGroup>();
        for (const t of taches) {
            if (!t.projetId) continue;
            if (!map.has(t.projetId)) {
                const fullProjet = projetDetails.get(t.projetId);

                // Build set of chef IDs from full project details
                const chefIds = new Set<number>();
                if (t.chefDeProjetId) chefIds.add(t.chefDeProjetId);
                if (fullProjet?.chefDeProjet) chefIds.add(fullProjet.chefDeProjet.id);
                if (fullProjet?.chefsDeProjet) fullProjet.chefsDeProjet.forEach(c => chefIds.add(c.id));
                if (t.chefsDeProjetIds) t.chefsDeProjetIds.forEach(id => chefIds.add(id));

                // Start with membresProjet from tache data
                const memberMap = new Map<number, TacheMembreInfo>();
                (t.membresProjet ?? []).forEach(m => memberMap.set(m.id, m));

                // Merge all chefs from full project details (fills in missing managers)
                if (fullProjet?.chefsDeProjet) {
                    fullProjet.chefsDeProjet.forEach(c => {
                        if (!memberMap.has(c.id)) {
                            memberMap.set(c.id, {
                                id: c.id,
                                nom: c.nom,
                                prenom: c.prenom,
                                telephone: c.telephone || '',
                                telephonePro: c.telephonePro,
                                departement: c.departement || '',
                                email: c.email,
                                managerNom: c.managerNom ?? undefined,
                                poste: c.poste ?? undefined,
                            });
                        }
                    });
                }
                if (fullProjet?.chefDeProjet) {
                    const c = fullProjet.chefDeProjet;
                    if (!memberMap.has(c.id)) {
                        memberMap.set(c.id, {
                            id: c.id,
                            nom: c.nom,
                            prenom: c.prenom,
                            telephone: c.telephone || '',
                            telephonePro: c.telephonePro,
                            departement: c.departement || '',
                            email: c.email,
                            managerNom: (c as any).managerNom ?? undefined,
                            poste: (c as any).poste ?? undefined,
                        });
                    }
                }
                // Also merge regular membres from full project
                if (fullProjet?.membres) {
                    fullProjet.membres.forEach(m => {
                        if (!memberMap.has(m.id)) {
                            memberMap.set(m.id, {
                                id: m.id,
                                nom: m.nom,
                                prenom: m.prenom,
                                telephone: m.telephone || '',
                                telephonePro: m.telephonePro,
                                departement: m.departement || '',
                                email: m.email,
                                managerNom: m.managerNom ?? undefined,
                                poste: m.poste ?? undefined,
                            });
                        }
                    });
                }

                // Mark each member: isChef if they are a project chef OR have the MANAGER role
                const enriched = Array.from(memberMap.values()).map(m => ({
                    ...m,
                    isChef: chefIds.has(m.id) || managerEmpIds.has(m.id),
                }));
                enriched.sort((a, b) => (a.isChef === b.isChef ? 0 : a.isChef ? -1 : 1));

                // Build chef names string from full project
                let chefNom = t.chefDeProjetNom;
                if (fullProjet?.chefsDeProjet && fullProjet.chefsDeProjet.length > 0) {
                    chefNom = fullProjet.chefsDeProjet.map(c => `${c.prenom} ${c.nom}`).join(', ');
                }

                map.set(t.projetId, {
                    projetId: t.projetId,
                    projetNom: t.projetNom || 'Projet sans nom',
                    projetDateFin: t.projetDateFin,
                    projetStatut: t.projetStatut,
                    chefDeProjetNom: chefNom,
                    chefsDeProjetIds: chefIds,
                    membres: enriched,
                    tacheCount: 0,
                });
            }
            map.get(t.projetId)!.tacheCount += 1;
        }
        return Array.from(map.values());
    }, [taches, managerEmpIds, projetDetails]);

    const handleChangeStatut = async (id: number, statut: StatutTache) => {
        try {
            await tacheService.changeStatut(id, statut);
            setTaches(prev => prev.map(t => t.id === id ? { ...t, statut } : t));
        } catch (err) { console.error(err); }
    };

    const handleDragStart = (e: React.DragEvent, tache: TacheDetail) => {
        setDraggedTache(tache);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => { (e.currentTarget as HTMLElement).style.opacity = '0.4'; }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        (e.currentTarget as HTMLElement).style.opacity = '1';
        setDraggedTache(null);
        setDragOverStatut(null);
    };

    const handleDrop = async (e: React.DragEvent, targetStatut: string) => {
        e.preventDefault();
        setDragOverStatut(null);
        if (!draggedTache || draggedTache.statut === targetStatut) return;
        await handleChangeStatut(draggedTache.id, targetStatut as StatutTache);
        setDraggedTache(null);
    };

    const openEdit = (tache: TacheDetail, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingTache(tache);
        setEditForm({ titre: tache.titre, dateEcheance: tache.dateEcheance || '', statut: tache.statut });
        setEditError(null);
    };

    const handleEditSave = async () => {
        if (!editingTache) return;
        setEditLoading(true);
        setEditError(null);
        try {
            await tacheService.update(editingTache.id, {
                titre: editForm.titre,
                dateEcheance: editForm.dateEcheance || undefined,
                statut: editForm.statut,
            } as any);
            setTaches(prev =>
                prev.map(t =>
                    t.id === editingTache.id
                        ? { ...t, titre: editForm.titre, dateEcheance: editForm.dateEcheance, statut: editForm.statut }
                        : t
                )
            );
            setEditingTache(null);
        } catch (err: any) {
            setEditError(err?.response?.data?.message || 'Erreur lors de la modification');
        } finally {
            setEditLoading(false);
        }
    };

    const grouped = {
        TODO: taches.filter(t => t.statut === 'TODO'),
        IN_PROGRESS: taches.filter(t => t.statut === 'IN_PROGRESS'),
        DONE: taches.filter(t => t.statut === 'DONE'),
    };

    return (
        <div className="space-y-0">

            {/* ══════════════════════ MES PROJETS (TOP) ══════════════════════ */}
            {projectGroups.length > 0 && (
                <div className="space-y-6 pb-10">
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Mes Projets</h1>
                            <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
                                Explorez vos projets et les membres de chaque projet
                            </p>
                        </div>
                        {/* Breadcrumb */}
                        {selectedProject && (
                            <nav className="flex items-center gap-1.5 text-theme-xs">
                                <button
                                    onClick={() => setSelectedProject(null)}
                                    className="text-brand-500 hover:underline"
                                >
                                    Projets
                                </button>
                                <HiOutlineChevronRight size={12} className="text-gray-300" />
                                <span className="font-semibold text-gray-700 dark:text-gray-200">
                                    {selectedProject.projetNom}
                                </span>
                            </nav>
                        )}
                    </div>

                    {/* Level 1 — Project cards */}
                    {!selectedProject && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {projectGroups.map(pg => (
                                <button
                                    key={pg.projetId}
                                    onClick={() => setSelectedProject(pg)}
                                    className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-dark"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
                                            <HiOutlineFolder size={22} />
                                        </div>
                                        <HiOutlineChevronRight size={16} className="mt-1 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-400" />
                                    </div>
                                    <p className="mt-3 text-theme-sm font-semibold text-gray-800 dark:text-white">{pg.projetNom}</p>
                                    {pg.projetStatut && (
                                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-theme-xs font-medium ${pg.projetStatut === 'EN_COURS' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10' :
                                            pg.projetStatut === 'CLOTURE' ? 'bg-success-50 text-success-600 dark:bg-success-500/10' :
                                                pg.projetStatut === 'ANNULE' ? 'bg-error-50 text-error-600 dark:bg-error-500/10' :
                                                    'bg-gray-100 text-gray-600 dark:bg-gray-700'
                                            }`}>
                                            {pg.projetStatut}
                                        </span>
                                    )}
                                    {pg.chefDeProjetNom && (
                                        <p className="mt-0.5 text-theme-xs text-gray-500 flex items-center gap-2">
                                            Chef : {pg.chefDeProjetNom}
                                            {congeAujourdhuiNoms.has(pg.chefDeProjetNom) && (
                                                <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-semibold text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
                                                    En congé
                                                </span>
                                            )}
                                        </p>
                                    )}
                                    {pg.projetDateFin && <p className="text-theme-xs text-warning-500">Fin : {pg.projetDateFin}</p>}
                                    <div className="mt-3 flex gap-2">
                                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-theme-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                            {pg.tacheCount} tâche{pg.tacheCount > 1 ? 's' : ''}
                                        </span>
                                        <span className="rounded-full bg-secondary-50 px-2.5 py-0.5 text-theme-xs font-medium text-secondary-600 dark:bg-secondary-500/10 dark:text-secondary-400">
                                            {pg.membres.length} membre{pg.membres.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Level 2 — Membres du projet */}
                    {selectedProject && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 dark:border-brand-500/20 dark:bg-brand-500/5">
                                <p className="text-theme-sm font-semibold text-brand-700 dark:text-brand-300">{selectedProject.projetNom}</p>
                                <div className="mt-1 flex flex-wrap gap-4 text-theme-xs text-brand-600 dark:text-brand-400">
                                    {selectedProject.chefDeProjetNom && (
                                        <span className="flex items-center gap-2">
                                            👤 {selectedProject.chefDeProjetNom}
                                            {congeAujourdhuiNoms.has(selectedProject.chefDeProjetNom) && (
                                                <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-semibold text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
                                                    En congé
                                                </span>
                                            )}
                                        </span>
                                    )}
                                    {selectedProject.projetDateFin && <span>📅 Fin : {selectedProject.projetDateFin}</span>}
                                </div>
                            </div>
                            {selectedProject.membres.length === 0 ? (
                                <p className="py-6 text-center text-theme-sm text-gray-400">Aucun membre assigné à ce projet.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {selectedProject.membres.map(m => <MemberCard key={m.id} membre={m} />)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════ DIVIDER ════════════════════════════ */}
            {projectGroups.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700" />
            )}

            {/* ══════════════════════ MES TÂCHES (BOTTOM) ══════════════════ */}
            <div className="space-y-6 pt-10">
                <div>
                    <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Mes Tâches</h1>
                    <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
                        Glissez-déposez pour changer le statut · Cliquez ✏️ pour modifier
                    </p>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-gray-500">Chargement...</div>
                ) : taches.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center dark:border-gray-800 dark:bg-gray-dark">
                        <p className="text-gray-400">Aucune tâche ne vous est assignée.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map(statut => (
                            <div
                                key={statut}
                                className={`rounded-2xl border-2 transition-colors duration-200 ${dragOverStatut === statut
                                    ? 'border-brand-400 bg-brand-50/30 dark:bg-brand-500/5'
                                    : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark'
                                    }`}
                                onDragOver={e => { e.preventDefault(); setDragOverStatut(statut); }}
                                onDragLeave={() => setDragOverStatut(null)}
                                onDrop={e => handleDrop(e, statut)}
                            >
                                <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                                    <Badge text={statutLabels[statut]} variant={statutBadgeMap[statut]} />
                                    <span className="text-theme-xs text-gray-400">{grouped[statut].length}</span>
                                </div>
                                <div className="min-h-[80px] space-y-2 p-3">
                                    {grouped[statut].length === 0 ? (
                                        <p className="py-6 text-center text-theme-sm text-gray-400">
                                            {dragOverStatut === statut ? 'Déposez ici' : 'Aucune tâche'}
                                        </p>
                                    ) : (
                                        grouped[statut].map(tache => (
                                            <div
                                                key={tache.id}
                                                draggable
                                                onDragStart={e => handleDragStart(e, tache)}
                                                onDragEnd={handleDragEnd}
                                                className="cursor-grab rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 transition-shadow hover:shadow-md active:cursor-grabbing dark:border-gray-700 dark:bg-gray-800"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-theme-sm font-medium text-gray-800 dark:text-white">
                                                            {tache.titre}
                                                        </p>
                                                        {tache.projetNom && (
                                                            <p className="mt-0.5 truncate text-theme-xs text-brand-500 dark:text-brand-400 flex items-center gap-1.5">
                                                                {tache.projetNom}
                                                                {tache.chefDeProjetNom && (
                                                                    <span className="text-gray-400">
                                                                        · Chef: {tache.chefDeProjetNom}
                                                                        {congeAujourdhuiNoms.has(tache.chefDeProjetNom) && (
                                                                            <span className="ml-1 rounded-full bg-warning-50 px-1.5 py-0.5 text-[10px] font-semibold text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
                                                                                En congé
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </p>
                                                        )}
                                                        {tache.dateEcheance && (
                                                            <p className="mt-0.5 text-theme-xs text-gray-400">⏰ {tache.dateEcheance}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <Modal isOpen={!!editingTache} onClose={() => setEditingTache(null)} title="Modifier la tâche">
                {editingTache && (
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Titre</label>
                            <input type="text" value={editForm.titre} onChange={e => setEditForm({ ...editForm, titre: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Date d'échéance</label>
                            <input type="date" value={editForm.dateEcheance} onChange={e => setEditForm({ ...editForm, dateEcheance: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
                            <select value={editForm.statut} onChange={e => setEditForm({ ...editForm, statut: e.target.value as StatutTache })} className={inputClass}>
                                {Object.entries(statutLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        {editError && (
                            <div className="rounded-lg bg-error-50 px-4 py-2 text-theme-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">{editError}</div>
                        )}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => setEditingTache(null)}>Annuler</Button>
                            <Button onClick={handleEditSave} disabled={editLoading}>{editLoading ? 'Enregistrement...' : 'Enregistrer'}</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MesTachesPage;
