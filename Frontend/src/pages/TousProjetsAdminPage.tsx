import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineSearch,
    HiOutlineChevronDown,
    HiOutlineChevronRight,
    HiOutlineUsers,
    HiOutlineClipboardList,
    HiOutlineUser,
} from 'react-icons/hi';
import { projetService } from '../api/projetService';
import { tacheService } from '../api/tacheService';
import { Projet, StatutProjet } from '../types';
import Badge from '../components/ui/Badge';

const statutBadgeMap: Record<string, 'neutral' | 'primary' | 'success' | 'danger'> = {
    PLANIFIE: 'neutral',
    EN_COURS: 'primary',
    CLOTURE: 'success',
    ANNULE: 'danger',
};
const statutLabels: Record<string, string> = {
    PLANIFIE: 'Planifié', EN_COURS: 'En cours', CLOTURE: 'Clôturé', ANNULE: 'Annulé',
};
const tacheStatutMap: Record<string, 'neutral' | 'primary' | 'success'> = {
    TODO: 'neutral', IN_PROGRESS: 'primary', DONE: 'success',
};
const tacheStatutLabels: Record<string, string> = {
    TODO: 'À faire', IN_PROGRESS: 'En cours', DONE: 'Terminée',
};

interface TacheItem { id: number; titre: string; statut: string; dateEcheance?: string; assigneeNom?: string; }

const TousProjetsAdminPage: React.FC = () => {
    const navigate = useNavigate();
    const [projets, setProjets] = useState<Projet[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statutFilter, setStatutFilter] = useState('');
    const [filterDateFin, setFilterDateFin] = useState('');
    const [filterClient, setFilterClient] = useState('');
    const [filterManager, setFilterManager] = useState('');
    const [filterCreatedBy, setFilterCreatedBy] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [detailData, setDetailData] = useState<Record<number, { taches: TacheItem[] }>>({});
    const [detailLoading, setDetailLoading] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => { loadProjets(); }, []);

    const loadProjets = async () => {
        try {
            const res = await projetService.getAll();
            setProjets(res.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const toggleExpand = async (projetId: number) => {
        if (expandedId === projetId) { setExpandedId(null); return; }
        setExpandedId(projetId);
        if (detailData[projetId]) return; // already loaded
        setDetailLoading(projetId);
        try {
            const tRes = await tacheService.getByProjet(projetId);
            const taches: TacheItem[] = (tRes.data?.data || tRes.data || []).map((t: any) => ({
                id: t.id,
                titre: t.titre,
                statut: t.statut,
                dateEcheance: t.dateEcheance,
                assigneeNom: t.assignee ? `${t.assignee.prenom} ${t.assignee.nom}` : t.assigneeNom,
            }));
            setDetailData(prev => ({ ...prev, [projetId]: { taches } }));
        } catch (e) { console.error(e); }
        finally { setDetailLoading(null); }
    };

    /** Build a deduped list of all members: chef first, then selected membres */
    const getAllMembres = (projet: Projet) => {
        const map = new Map<number, any>();
        if (projet.chefDeProjet) map.set(projet.chefDeProjet.id, { ...projet.chefDeProjet, isChef: true });
        if (projet.chefsDeProjet && projet.chefsDeProjet.length > 0) {
            projet.chefsDeProjet.forEach((c) => { if (!map.has(c.id)) map.set(c.id, { ...c, isChef: true }); });
        }
        (projet.membres ?? []).forEach(m => { if (!map.has(m.id)) map.set(m.id, m); });
        return Array.from(map.values());
    };

    const uniqueClients = Array.from(new Set(projets.filter(p => p.clientNom).map(p => p.clientNom as string)));
    const uniqueManagers = Array.from(new Map(projets.flatMap(p => (p.chefsDeProjet && p.chefsDeProjet.length > 0 ? p.chefsDeProjet : p.chefDeProjet ? [p.chefDeProjet] : []).map(c => [c!.id, c!])) as any).values());
    const uniqueCreators = Array.from(new Map(projets.map(p => [p.createurId, { id: p.createurId, nom: p.createurNom }])).values()).filter(Boolean as any);

    const filtered = projets.filter(p => {
        const matchSearch = p.nom.toLowerCase().includes(search.toLowerCase());
        const matchStatut = statutFilter ? (p.statut as string) === statutFilter : true;
        let matchDateFin = true;
        if (filterDateFin) {
            if (!p.dateFin) matchDateFin = false;
            else matchDateFin = p.dateFin <= filterDateFin;
        }
        let matchClient = filterClient ? p.clientNom === filterClient : true;
        let matchManager = true;
        if (filterManager) {
            const mgrNames = (p.chefsDeProjet && p.chefsDeProjet.length > 0 ? p.chefsDeProjet : p.chefDeProjet ? [p.chefDeProjet] : []).map(c => `${c?.prenom} ${c?.nom}`);
            matchManager = mgrNames.includes(filterManager);
        }
        let matchCreatedBy = filterCreatedBy ? (p.createurNom || '').includes(filterCreatedBy) : true;
        return matchSearch && matchStatut && matchDateFin && matchClient && matchManager && matchCreatedBy;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Tous les projets</h1>
                    <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
                        Vue globale de tous les projets de l'entreprise
                    </p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-theme-sm font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    {filtered.length} projet{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Filters (collapsible, similar to ProjetsPage) */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-dark overflow-hidden">
                <button
                    onClick={() => setShowFilters(f => !f)}
                    className="flex w-full items-center justify-between px-4 py-3 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50"
                >
                    <span className="flex items-center gap-2">
                        <HiOutlineSearch size={16} />
                        Filtres
                        {(search || statutFilter || filterDateFin || filterClient || filterManager || filterCreatedBy) && (
                            <span className="ml-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">actifs</span>
                        )}
                    </span>
                    {showFilters ? <HiOutlineChevronDown size={16} /> : <HiOutlineChevronRight size={16} />}
                </button>
                {showFilters && (
                <div className="border-t border-gray-100 dark:border-gray-700 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Nom du projet</label>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300" />
                    </div>

                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Date fin (avant le)</label>
                        <input type="date" value={filterDateFin} onChange={e => setFilterDateFin(e.target.value)} className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300" />
                    </div>

                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Client</label>
                        <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300">
                            <option value="">Tous les clients</option>
                            {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Managers de projet</label>
                        <select value={filterManager} onChange={e => setFilterManager(e.target.value)} className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300">
                            <option value="">Tous les managers</option>
                            {uniqueManagers.map((m: any) => <option key={m.id} value={`${m.prenom} ${m.nom}`}>{m.prenom} {m.nom} {m.departement ? `(${m.departement})` : ''}</option>)}
                        </select>
                    </div>
                    
                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Créé par</label>
                        <select value={filterCreatedBy} onChange={e => setFilterCreatedBy(e.target.value)} className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300">
                            <option value="">Tous</option>
                            {uniqueCreators.map((c: any) => <option key={c.id} value={c.nom || ''}>{c.nom}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Statut</label>
                        <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)} className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300">
                            <option value="">Tous les statuts</option>
                            {Object.values(StatutProjet).map(s => <option key={s} value={s}>{statutLabels[s] || s}</option>)}
                        </select>
                    </div>
                </div>
                </div>
                )}
            </div>
            {loading ? (
                <div className="py-16 text-center text-gray-500">Chargement...</div>
            ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-gray-400">Aucun projet trouvé</div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(projet => {
                        const isExpanded = expandedId === projet.id;
                        const isLoading = detailLoading === projet.id;
                        const detail = detailData[projet.id];
                        const membres = getAllMembres(projet);

                        return (
                            <div key={projet.id} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark overflow-hidden">
                                {/* Project row — click to expand */}
                                <button
                                    onClick={() => toggleExpand(projet.id)}
                                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                                >
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                                        <div className="sm:col-span-2">
                                            <p className="font-semibold text-gray-800 dark:text-white text-theme-sm">{projet.nom}</p>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-0.5 text-theme-xs text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <HiOutlineUser size={12} />
                                                    <span>Créé par: {projet.createurNom || 'Admin'}</span>
                                                </div>
                                                <span className="text-gray-300 dark:text-gray-600">||</span>
                                                <div className="flex items-center gap-2">
                                                    <span>Managers de projet: </span>
                                                    <span>
                                                        {(projet.chefsDeProjet && projet.chefsDeProjet.length > 0 ? projet.chefsDeProjet : projet.chefDeProjet ? [projet.chefDeProjet] : [])
                                                            .map(c => `${c?.prenom} ${c?.nom}${c?.departement ? ` (${c.departement})` : ''}`).join(', ')
                                                        || 'Non assigné'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge text={statutLabels[projet.statut as string] || projet.statut as string} variant={statutBadgeMap[projet.statut as string] || 'neutral'} />
                                        </div>
                                        <div className="text-theme-xs text-gray-400">
                                            {projet.dateDebut && <span>{projet.dateDebut}</span>}
                                            {projet.dateFin && <span> → {projet.dateFin}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-400">
                                        {/* Member chips in the row */}
                                        {membres.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {membres.map(m => (
                                                    <span key={m.id}
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${m.isChef
                                                            ? 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
                                                            : 'bg-secondary-50 text-secondary-700 dark:bg-secondary-500/10 dark:text-secondary-400'}`}
                                                    >
                                                        <span className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${m.isChef ? 'bg-warning-200 dark:bg-warning-500/30' : 'bg-secondary-200 dark:bg-secondary-500/30'}`}>
                                                            {m.prenom?.[0]}{m.nom?.[0]}
                                                        </span>
                                                        {m.prenom} {m.nom}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <button
                                            onClick={e => { e.stopPropagation(); navigate(`/admin/projets/${projet.id}/taches`); }}
                                            className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 text-theme-xs font-medium hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400"
                                        >
                                            Tâches
                                        </button>
                                        {isExpanded ? <HiOutlineChevronDown size={18} /> : <HiOutlineChevronRight size={18} />}
                                    </div>
                                </button>

                                {/* Expanded detail */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50/50 dark:bg-gray-800/20">
                                        {isLoading ? (
                                            <div className="py-6 text-center text-gray-400 text-theme-sm">Chargement des détails...</div>
                                        ) : (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {/* Membres */}
                                                <div>
                                                    <h4 className="flex items-center gap-2 text-theme-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                                                        <HiOutlineUsers size={14} /> Membres ({membres.length})
                                                    </h4>
                                                    {membres.length === 0 ? (
                                                        <p className="text-theme-xs text-gray-400 italic">Aucun membre assigné</p>
                                                    ) : (
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {membres.map(m => (
                                                                <div key={m.id} className={`rounded-xl border px-3 py-2 text-theme-sm ${m.isChef ? 'border-warning-200 bg-warning-50 dark:border-warning-500/20 dark:bg-warning-500/5' : 'border-secondary-100 bg-secondary-50 dark:border-secondary-500/20 dark:bg-secondary-500/5'}`}>
                                                                    <div className="flex items-start gap-3">
                                                                        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${m.isChef ? 'bg-warning-400' : 'bg-secondary-400'}`}>{m.prenom?.[0]}{m.nom?.[0]}</span>
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center justify-between gap-3">
                                                                                <p className={`font-semibold leading-none ${m.isChef ? 'text-warning-700 dark:text-warning-400' : 'text-secondary-700 dark:text-secondary-400'}`}>{m.prenom} {m.nom}</p>
                                                                                <span className="text-theme-xs text-gray-400">{m.poste}</span>
                                                                            </div>
                                                                            <div className="mt-1 text-theme-xs text-gray-500">
                                                                                <span className="mr-3">🏢 {m.departement || '-'}</span>
                                                                                <span className="mr-3">Manager: {m.managerNom || '-'}</span>
                                                                                <span className="mr-3">📞 {m.telephonePro || m.telephone || '-'}</span>
                                                                                <span>✉️ {m.email || '-'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tâches */}
                                                <div>
                                                    <h4 className="flex items-center gap-2 text-theme-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                                                        <HiOutlineClipboardList size={14} /> Tâches ({detail?.taches.length ?? 0})
                                                    </h4>
                                                    {!detail || detail.taches.length === 0 ? (
                                                        <p className="text-theme-xs text-gray-400 italic">Aucune tâche</p>
                                                    ) : (
                                                        <div className="space-y-1.5 max-h-60 overflow-y-auto">
                                                            {detail.taches.map(t => (
                                                                <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300 truncate">{t.titre}</p>
                                                                        {t.assigneeNom && (
                                                                            <p className="text-[10px] text-gray-400">{t.assigneeNom}</p>
                                                                        )}
                                                                    </div>
                                                                    <div className="ml-3 flex items-center gap-2 shrink-0">
                                                                        {t.dateEcheance && (
                                                                            <span className="text-[10px] text-gray-400">{t.dateEcheance}</span>
                                                                        )}
                                                                        <Badge text={tacheStatutLabels[t.statut] || t.statut} variant={tacheStatutMap[t.statut] || 'neutral'} />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TousProjetsAdminPage;
