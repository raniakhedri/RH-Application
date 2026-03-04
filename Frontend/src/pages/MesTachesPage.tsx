import React, { useState, useEffect } from 'react';
import { tacheService } from '../api/tacheService';
import { projetService } from '../api/projetService';
import { useAuth } from '../context/AuthContext';
import { Tache, Projet, StatutTache } from '../types';
import Badge from '../components/ui/Badge';

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

const MesTachesPage: React.FC = () => {
    const { user } = useAuth();
    const [taches, setTaches] = useState<Tache[]>([]);
    const [projets, setProjets] = useState<Projet[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterProjet, setFilterProjet] = useState<string>('');
    const [draggedTache, setDraggedTache] = useState<Tache | null>(null);
    const [dragOverStatut, setDragOverStatut] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [user?.employeId]);

    const loadData = async () => {
        if (!user?.employeId) return;
        try {
            const [tRes, pRes] = await Promise.all([
                tacheService.getByAssignee(user.employeId),
                projetService.getAll(),
            ]);
            setTaches(tRes.data.data || []);
            setProjets(pRes.data.data || []);
        } catch (err) {
            console.error('Erreur chargement mes tâches:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChangeStatut = async (id: number, statut: StatutTache) => {
        try {
            await tacheService.changeStatut(id, statut);
            setTaches((prev) =>
                prev.map((t) => (t.id === id ? { ...t, statut } : t))
            );
        } catch (err) {
            console.error('Erreur changement statut:', err);
        }
    };

    // Drag & Drop handlers
    const handleDragStart = (e: React.DragEvent, tache: Tache) => {
        setDraggedTache(tache);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', tache.id.toString());
        const target = e.currentTarget as HTMLElement;
        setTimeout(() => { target.style.opacity = '0.4'; }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '1';
        setDraggedTache(null);
        setDragOverStatut(null);
    };

    const handleDragOver = (e: React.DragEvent, statut: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverStatut(statut);
    };

    const handleDragLeave = () => {
        setDragOverStatut(null);
    };

    const handleDrop = async (e: React.DragEvent, targetStatut: string) => {
        e.preventDefault();
        setDragOverStatut(null);
        if (!draggedTache || draggedTache.statut === targetStatut) return;
        await handleChangeStatut(draggedTache.id, targetStatut as StatutTache);
        setDraggedTache(null);
    };

    const getProjetNom = (id: number) => projets.find((p) => p.id === id)?.nom || '-';

    const filtered = filterProjet
        ? taches.filter((t) => t.projetId === Number(filterProjet))
        : taches;

    const grouped = {
        TODO: filtered.filter((t) => t.statut === 'TODO'),
        IN_PROGRESS: filtered.filter((t) => t.statut === 'IN_PROGRESS'),
        DONE: filtered.filter((t) => t.statut === 'DONE'),
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Mes Tâches</h1>
                    <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
                        Tâches qui vous sont assignées — Glissez-déposez pour changer le statut
                    </p>
                </div>
                <select
                    value={filterProjet}
                    onChange={(e) => setFilterProjet(e.target.value)}
                    className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 dark:border-gray-600 dark:text-gray-300"
                >
                    <option value="">Tous les projets</option>
                    {projets.map((p) => (
                        <option key={p.id} value={p.id}>{p.nom}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="py-12 text-center text-gray-500">Chargement...</div>
            ) : taches.length === 0 ? (
                <div className="py-16 text-center">
                    <p className="text-gray-400 dark:text-gray-500 text-theme-sm">Aucune tâche ne vous est assignée pour le moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((statut) => (
                        <div
                            key={statut}
                            className={`rounded-2xl border-2 transition-colors duration-200 ${dragOverStatut === statut
                                    ? 'border-brand-400 bg-brand-50/30 dark:bg-brand-500/5'
                                    : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark'
                                }`}
                            onDragOver={(e) => handleDragOver(e, statut)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, statut)}
                        >
                            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <Badge text={statutLabels[statut]} variant={statutBadgeMap[statut]} />
                                    <span className="text-theme-xs text-gray-400">{grouped[statut].length}</span>
                                </div>
                            </div>
                            <div className="space-y-2 p-3 min-h-[100px]">
                                {grouped[statut].length === 0 ? (
                                    <p className="py-6 text-center text-theme-sm text-gray-400">
                                        {dragOverStatut === statut ? 'Déposez ici' : 'Aucune tâche'}
                                    </p>
                                ) : (
                                    grouped[statut].map((tache) => (
                                        <div
                                            key={tache.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, tache)}
                                            onDragEnd={handleDragEnd}
                                            className="cursor-grab rounded-xl border border-gray-100 bg-gray-50 p-3 transition-shadow hover:shadow-md active:cursor-grabbing dark:border-gray-700 dark:bg-gray-800"
                                        >
                                            <div className="flex items-start justify-between">
                                                <h4 className="text-theme-sm font-medium text-gray-800 dark:text-white">
                                                    {tache.titre}
                                                </h4>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-theme-xs text-gray-500">{getProjetNom(tache.projetId)}</span>
                                                <span className="text-theme-xs text-gray-400">{tache.dateEcheance}</span>
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
    );
};

export default MesTachesPage;
