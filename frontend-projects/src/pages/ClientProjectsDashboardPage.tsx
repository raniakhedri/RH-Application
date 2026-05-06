import React, { useState, useEffect, useMemo } from 'react';
import { HiOutlineSearch, HiOutlineExternalLink } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { projetService } from '../api/projetService';
import { tacheService } from '../api/tacheService';
import { clientService } from '../api/clientService';
import { Projet } from '../types';

const statutColors: Record<string, string> = {
    PLANIFIE: 'bg-gray-100 text-gray-600',
    EN_COURS: 'bg-orange-50 text-orange-600',
    CLOTURE: 'bg-[#1D9E75]/10 text-[#1D9E75]',
    CLOTURE_INCOMPLET: 'bg-yellow-50 text-yellow-600',
    ANNULE: 'bg-red-50 text-red-600',
};
const progressBarColors: Record<string, string> = {
    PLANIFIE: 'bg-gray-300',
    EN_COURS: 'bg-orange-400',
    CLOTURE: 'bg-[#1D9E75]',
    CLOTURE_INCOMPLET: 'bg-yellow-400',
    ANNULE: 'bg-red-400',
};
const statutLabels: Record<string, string> = {
    PLANIFIE: 'Planifié', EN_COURS: 'En cours', CLOTURE: 'Clôturé ✅',
    CLOTURE_INCOMPLET: 'Clôturé incomplet ⚠️', ANNULE: 'Annulé',
};
const tacheStatutLabels: Record<string, string> = { TODO: 'À faire', IN_PROGRESS: 'En cours', DONE: 'Terminée' };

const ClientProjectsDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const clientId = user?.clientId;
    const clientNom = user?.nom || 'Mon espace';

    const [projets, setProjets] = useState<Projet[]>([]);
    const [loading, setLoading] = useState(true);
    const [driveLink, setDriveLink] = useState<string | null>(null);
    const [driveLoading, setDriveLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [expandedProjet, setExpandedProjet] = useState<number | null>(null);
    const [projetTaches, setProjetTaches] = useState<Record<number, any[]>>({});
    const [loadingTaches, setLoadingTaches] = useState<number | null>(null);

    useEffect(() => {
        if (!clientId) return;
        const load = async () => {
            try {
                const res = await projetService.getByClient(clientId);
                setProjets(res.data.data || []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, [clientId]);

    // Fetch the Drive folder link (viewer-only)
    useEffect(() => {
        if (!clientId) return;
        setDriveLoading(true);
        clientService.getClientPortalDriveLink(clientId)
            .then(res => {
                const link = (res as any)?.data?.data ?? (res as any)?.data ?? null;
                setDriveLink(typeof link === 'string' ? link : null);
            })
            .catch(() => setDriveLink(null))
            .finally(() => setDriveLoading(false));
    }, [clientId]);

    const filtered = useMemo(() => {
        if (!search) return projets;
        const q = search.toLowerCase();
        return projets.filter(p => p.nom.toLowerCase().includes(q));
    }, [projets, search]);

    const loadTaches = async (projetId: number) => {
        if (projetTaches[projetId]) return;
        setLoadingTaches(projetId);
        try {
            const res = await tacheService.getByProjet(projetId);
            setProjetTaches(prev => ({ ...prev, [projetId]: (res.data as any)?.data || res.data || [] }));
        } catch (e) { console.error(e); }
        finally { setLoadingTaches(null); }
    };

    const toggleProjet = (id: number) => {
        if (expandedProjet === id) { setExpandedProjet(null); return; }
        setExpandedProjet(id);
        loadTaches(id);
    };

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="relative h-12 w-12">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin" />
            </div>
        </div>
    );

    return (
        <div className="space-y-8 bg-[#F5F4F1] min-h-screen p-2 sm:p-4 -m-4 sm:-m-6 lg:-m-8">
            <div className="max-w-[1200px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex flex-col justify-center">
                            <h1 className="text-2xl font-medium text-gray-900 tracking-tight">Mes Projets</h1>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[13px] font-medium text-[#E8521A] bg-[#E8521A]/10 px-2.5 py-0.5 rounded-[6px]">
                                    {clientNom}
                                </span>
                                <span className="text-gray-300">•</span>
                                <p className="text-[13px] text-gray-500">Vue de vos projets en cours</p>
                            </div>
                        </div>
                        {/* Google Drive button */}
                        {driveLoading ? (
                            <div className="flex h-10 w-10 items-center justify-center">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                            </div>
                        ) : driveLink ? (
                            <a
                                href={driveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Ouvrir mon dossier Google Drive"
                                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-brand-500 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                            >
                                <svg viewBox="0 0 87.3 78" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
                                    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
                                    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
                                    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
                                    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
                                    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
                                </svg>
                                Mon Drive
                                <HiOutlineExternalLink size={14} className="opacity-60" />
                            </a>
                        ) : null}
                    </div>

                    {/* KPIs */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 bg-white rounded-[12px] border border-gray-200 p-4 shadow-sm">
                            <p className="text-xs text-gray-500">Projets</p>
                            <p className="text-lg font-medium text-gray-900">{projets.length}</p>
                        </div>
                        <div className="flex-1 bg-white rounded-[12px] border border-gray-200 p-4 shadow-sm">
                            <p className="text-xs text-gray-500">En cours</p>
                            <p className="text-lg font-medium text-gray-900">{projets.filter(p => p.statut === 'EN_COURS').length}</p>
                        </div>
                        <div className="flex-1 bg-white rounded-[12px] border border-gray-200 p-4 shadow-sm">
                            <p className="text-xs text-gray-500">Clôturés</p>
                            <p className="text-lg font-medium text-gray-900">{projets.filter(p => p.statut === 'CLOTURE').length}</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative max-w-md group mb-6">
                    <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Rechercher un projet…"
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full rounded-[20px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-1 focus:ring-gray-300 focus:border-gray-300 dark:text-white outline-none transition-all shadow-sm" />
                </div>

            {/* Project list */}
            {filtered.length === 0 ? (
                <div className="py-20 text-center">
                    <span className="text-4xl opacity-20">🔍</span>
                    <p className="text-gray-400 mt-3">Aucun projet trouvé</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(projet => {
                        const isExpanded = expandedProjet === projet.id;
                        const taches = projetTaches[projet.id];
                        const done = taches ? taches.filter((t: any) => t.statut === 'DONE').length : 0;
                        const total = taches ? taches.length : 0;
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                        return (
                            <div key={projet.id} className="flex flex-col rounded-[12px] border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-gray-700 dark:bg-gray-800">
                                <button onClick={() => toggleProjet(projet.id)} className="w-full text-left p-4 pb-3 flex flex-col group">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="shrink-0 h-10 w-10 rounded-[8px] bg-[#E8521A]/10 flex items-center justify-center text-[#E8521A] font-medium text-lg">
                                                {projet.nom.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                                                    {projet.nom}
                                                </h3>
                                                {projet.chefsDeProjet && projet.chefsDeProjet.length > 0 && (
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                                                        Chef : {projet.chefsDeProjet.map(c => c.prenom).join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`shrink-0 px-2 py-0.5 rounded-[20px] text-[11px] font-medium ${statutColors[projet.statut] || 'bg-gray-100 text-gray-600'}`}>
                                            {statutLabels[projet.statut] || projet.statut}
                                        </div>
                                    </div>
                                    
                                    {/* Progress bar */}
                                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mt-1 mb-2">
                                        <div className={`h-full ${progressBarColors[projet.statut] || 'bg-gray-400'}`} style={{ width: taches ? `${pct}%` : '0%' }}></div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center w-full">
                                        <span className="text-[10px] text-gray-400">{taches ? `${pct}% · ${done}/${total} tâches` : 'Chargement...'}</span>
                                        <div className={`transition-transform duration-300 text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}>▼</div>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 px-5 py-4">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-xs text-gray-500 dark:text-gray-400">
                                            {projet.dateDebut && <div><span className="font-semibold text-gray-700 dark:text-gray-300">Début :</span> {projet.dateDebut}</div>}
                                            {projet.dateFin && <div><span className="font-semibold text-gray-700 dark:text-gray-300">Fin :</span> {projet.dateFin}</div>}
                                        </div>
                                        {loadingTaches === projet.id ? (
                                            <div className="py-4 text-center text-xs text-gray-400">Chargement des tâches…</div>
                                        ) : !taches || taches.length === 0 ? (
                                            <div className="py-4 text-center text-xs text-gray-400">Aucune tâche</div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {taches.map((t: any) => (
                                                    <div key={t.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700/30 ${t.statut === 'DONE' ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : t.statut === 'IN_PROGRESS' ? 'bg-brand-50/50 dark:bg-brand-500/5' : 'bg-white dark:bg-gray-dark'}`}>
                                                        <div className={`h-2 w-2 rounded-full shrink-0 ${t.statut === 'DONE' ? 'bg-emerald-500' : t.statut === 'IN_PROGRESS' ? 'bg-brand-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                                        <span className="flex-1 text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{t.titre}</span>
                                                        {t.dateEcheance && <span className="text-[10px] text-gray-400 shrink-0">📅 {t.dateEcheance}</span>}
                                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold shrink-0 ${t.statut === 'DONE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : t.statut === 'IN_PROGRESS' ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400' : 'bg-gray-100 text-gray-500'}`}>
                                                            {tacheStatutLabels[t.statut] || t.statut}
                                                        </span>
                                                    </div>
                                                ))}
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
        </div>
    );
};

export default ClientProjectsDashboardPage;
