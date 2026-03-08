import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineSearch,
    HiOutlineChevronDown,
    HiOutlineChevronRight,
    HiOutlineUserGroup,
    HiOutlineClipboardList,
    HiOutlineUser,
} from 'react-icons/hi';
import { projetService } from '../api/projetService';
import { equipeService } from '../api/equipeService';
import { tacheService } from '../api/tacheService';
import { Projet, Equipe, StatutProjet } from '../types';
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
interface EquipeWithMembers extends Equipe { membres: any[]; }

const TousProjetsAdminPage: React.FC = () => {
    const navigate = useNavigate();
    const [projets, setProjets] = useState<Projet[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statutFilter, setStatutFilter] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [detailData, setDetailData] = useState<Record<number, { equipes: EquipeWithMembers[]; taches: TacheItem[] }>>({});
    const [detailLoading, setDetailLoading] = useState<number | null>(null);

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
            const [eqRes, tRes] = await Promise.all([
                equipeService.getByProjet(projetId),
                tacheService.getByProjet(projetId),
            ]);
            const equipes: EquipeWithMembers[] = (eqRes.data?.data || eqRes.data || []);
            const taches: TacheItem[] = (tRes.data?.data || tRes.data || []).map((t: any) => ({
                id: t.id,
                titre: t.titre,
                statut: t.statut,
                dateEcheance: t.dateEcheance,
                assigneeNom: t.assignee ? `${t.assignee.prenom} ${t.assignee.nom}` : t.assigneeNom,
            }));
            setDetailData(prev => ({ ...prev, [projetId]: { equipes, taches } }));
        } catch (e) { console.error(e); }
        finally { setDetailLoading(null); }
    };

    const filtered = projets.filter(p => {
        const matchSearch = p.nom.toLowerCase().includes(search.toLowerCase());
        const matchStatut = statutFilter ? (p.statut as string) === statutFilter : true;
        return matchSearch && matchStatut;
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

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher un projet..."
                        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent pl-10 pr-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
                    />
                </div>
                <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)}
                    className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none dark:border-gray-600 dark:text-gray-300">
                    <option value="">Tous les statuts</option>
                    {Object.values(StatutProjet).map(s => <option key={s} value={s}>{statutLabels[s] || s}</option>)}
                </select>
            </div>

            {/* Projects list */}
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
                                            <div className="flex items-center gap-2 mt-0.5 text-theme-xs text-gray-400">
                                                <HiOutlineUser size={12} />
                                                <span>Manager: {projet.createurNom || 'Admin'}</span>
                                                <span className="text-gray-300 dark:text-gray-600">||</span>
                                                <span>Chef de projet: {projet.chefDeProjet ? `${projet.chefDeProjet.prenom} ${projet.chefDeProjet.nom}` : 'Non assigné'}</span>
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
                                        {(projet.equipeNoms?.length ?? 0) > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {projet.equipeNoms!.map(n => <Badge key={n} text={n} variant="primary" />)}
                                            </div>
                                        )}
                                        <button
                                            onClick={e => { e.stopPropagation(); navigate(`/projets/${projet.id}/taches`); }}
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
                                        ) : detail ? (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                {/* Equipes */}
                                                <div>
                                                    <h4 className="flex items-center gap-2 text-theme-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                                                        <HiOutlineUserGroup size={14} /> Équipes ({detail.equipes.length})
                                                    </h4>
                                                    {detail.equipes.length === 0 ? (
                                                        <p className="text-theme-xs text-gray-400 italic">Aucune équipe assignée</p>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {detail.equipes.map((eq: any) => (
                                                                <div key={eq.id} className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 p-3">
                                                                    <p className="font-semibold text-theme-sm text-gray-800 dark:text-white mb-2">{eq.nom}</p>
                                                                    {(eq.membres || []).length > 0 ? (
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {(eq.membres || []).map((m: any) => (
                                                                                <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-secondary-50 text-secondary-600 px-2 py-0.5 text-[10px] font-medium dark:bg-secondary-500/10">
                                                                                    {m.prenom} {m.nom}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-theme-xs text-gray-400 italic">Aucun membre</p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tâches */}
                                                <div>
                                                    <h4 className="flex items-center gap-2 text-theme-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                                                        <HiOutlineClipboardList size={14} /> Tâches ({detail.taches.length})
                                                    </h4>
                                                    {detail.taches.length === 0 ? (
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
                                        ) : null}
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
