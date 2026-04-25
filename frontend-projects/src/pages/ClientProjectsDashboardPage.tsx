import React, { useState, useEffect, useMemo } from 'react';
import { HiOutlineSearch, HiOutlineExternalLink } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { projetService } from '../api/projetService';
import { tacheService } from '../api/tacheService';
import { clientService } from '../api/clientService';
import { Projet } from '../types';

const statutColors: Record<string, string> = {
    PLANIFIE: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    EN_COURS: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    CLOTURE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    CLOTURE_INCOMPLET: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    ANNULE: 'bg-red-500/10 text-red-500 dark:text-red-400',
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
        <div className="space-y-8 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Mes Projets</h1>
                    <p className="text-sm text-gray-400 mt-1">{clientNom} — vue de vos projets en cours</p>
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
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-brand-500 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <KpiCard label="Projets" value={projets.length} icon="📁" gradient="from-brand-500/10 to-violet-500/10 dark:from-brand-500/5 dark:to-violet-500/5" border="border-brand-200/50 dark:border-brand-500/20" />
                <KpiCard label="En cours" value={projets.filter(p => p.statut === 'EN_COURS').length} icon="🔄" gradient="from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5" border="border-emerald-200/50 dark:border-emerald-500/20" />
                <KpiCard label="Clôturés" value={projets.filter(p => p.statut === 'CLOTURE').length} icon="✅" gradient="from-violet-500/10 to-purple-500/10 dark:from-violet-500/5 dark:to-purple-500/5" border="border-violet-200/50 dark:border-violet-500/20" />
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <HiOutlineSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher un projet…"
                    className="h-11 w-full rounded-2xl border border-gray-200 bg-white/80 backdrop-blur pl-11 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-dark/80 dark:text-gray-300 transition-all" />
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
                            <div key={projet.id} className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-white dark:bg-gray-dark ${isExpanded ? 'border-brand-300 dark:border-brand-500/30 shadow-xl' : 'border-gray-200 dark:border-gray-700/60 hover:border-gray-300 hover:shadow-lg'}`}>
                                <button onClick={() => toggleProjet(projet.id)} className="w-full text-left p-5 flex items-center gap-4 group">
                                    {/* Avatar */}
                                    <div className="shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-brand-500/20">
                                        {projet.nom.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-base font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                                {projet.nom}
                                            </span>
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statutColors[projet.statut] || ''}`}>
                                                {statutLabels[projet.statut] || projet.statut}
                                            </span>
                                        </div>
                                        {projet.chefsDeProjet && projet.chefsDeProjet.length > 0 && (
                                            <p className="text-xs text-gray-400 mt-0.5">Chef : {projet.chefsDeProjet.map(c => `${c.prenom} ${c.nom}`).join(', ')}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="h-1.5 w-24 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: taches ? `${pct}%` : '0%' }} />
                                            </div>
                                            {taches && <span className="text-[10px] text-gray-400">{pct}% · {done}/{total} tâches</span>}
                                        </div>
                                    </div>
                                    {/* Progress ring */}
                                    <div className="shrink-0 relative h-11 w-11">
                                        <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44">
                                            <circle cx="22" cy="22" r="18" fill="none" strokeWidth="4" className="stroke-gray-100 dark:stroke-gray-800" />
                                            <circle cx="22" cy="22" r="18" fill="none" strokeWidth="4" strokeLinecap="round"
                                                className={`${pct >= 80 ? 'stroke-emerald-500' : pct >= 40 ? 'stroke-brand-500' : 'stroke-amber-500'}`}
                                                strokeDasharray={`${pct * 1.13} 113`}
                                                style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-300">{pct}%</span>
                                    </div>
                                    <div className={`shrink-0 transition-transform duration-300 text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}>▼</div>
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
    );
};

const KpiCard: React.FC<{ label: string; value: string | number; icon: string; gradient: string; border: string }> = ({ label, value, icon, gradient, border }) => (
    <div className={`relative overflow-hidden rounded-2xl border ${border} bg-gradient-to-br ${gradient} p-5`}>
        <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{icon}</span>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
    </div>
);

export default ClientProjectsDashboardPage;
