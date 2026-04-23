import React, { useState, useEffect } from 'react';
import { HiOutlineSearch, HiOutlineEye, HiOutlinePencil, HiOutlineBan } from 'react-icons/hi';
import { demandePapierService } from '../api/demandePapierService';
import { referentielService } from '../api/referentielService';
import { useAuth } from '../context/AuthContext';
import { DemandeResponse, Referentiel } from '../types';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

const statutBadgeMap: Record<string, 'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'neutral'> = {
    BROUILLON: 'neutral',
    SOUMISE: 'primary',
    EN_VALIDATION: 'warning',
    VALIDEE: 'success',
    REFUSEE: 'danger',
    ANNULEE: 'neutral',
};

const extractLibelle = (raison: string): string => {
    const match = raison?.match(/^\[([^\]]+)\]/);
    return match ? match[1] : raison || '-';
};

const extractRaison = (raison: string): string => {
    return raison?.replace(/^\[[^\]]+\]\s*/, '') || '-';
};

const labelToColor = (label: string): { bg: string; text: string; border: string } => {
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
        hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return {
        bg: `hsla(${hue}, 70%, 50%, 0.15)`,
        text: `hsl(${hue}, 65%, 55%)`,
        border: `hsla(${hue}, 70%, 50%, 0.3)`,
    };
};

const TypeBadge: React.FC<{ libelle: string }> = ({ libelle }) => {
    const colors = labelToColor(libelle);
    return (
        <span
            style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
            className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide"
        >
            {libelle}
        </span>
    );
};

const MesDemandesPapierPage: React.FC = () => {
    const { user } = useAuth();
    const [demandes, setDemandes] = useState<DemandeResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatut, setFilterStatut] = useState<string>('');
    const [selectedDemande, setSelectedDemande] = useState<DemandeResponse | null>(null);

    // Cancel state
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [cancelMotif, setCancelMotif] = useState('');
    const [cancelLoading, setCancelLoading] = useState(false);

    // Edit state
    const [editingDemande, setEditingDemande] = useState<DemandeResponse | null>(null);
    const [editRaison, setEditRaison] = useState('');
    const [editLibelle, setEditLibelle] = useState('');
    const [referentiels, setReferentiels] = useState<Referentiel[]>([]);
    const [editLoading, setEditLoading] = useState(false);

    const inputClass =
        'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300';

    useEffect(() => {
        loadDemandes();
    }, [user?.employeId]);

    const loadDemandes = async () => {
        if (!user?.employeId) return;
        try {
            const response = await demandePapierService.getAll();
            const all = response.data.data || [];
            setDemandes(all.filter((d: DemandeResponse) => d.employeId === user.employeId));
        } catch (err) {
            console.error('Erreur chargement mes demandes papier:', err);
        } finally {
            setLoading(false);
        }
    };

    const canEdit = (d: DemandeResponse) =>
        !['VALIDEE', 'REFUSEE', 'ANNULEE'].includes(d.statut as string);

    const handleCancelConfirm = async () => {
        if (!cancellingId) return;
        setCancelLoading(true);
        try {
            await demandePapierService.cancel(cancellingId, cancelMotif || undefined);
            setCancellingId(null);
            setCancelMotif('');
            loadDemandes();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de l\'annulation');
        } finally {
            setCancelLoading(false);
        }
    };

    const openEdit = async (d: DemandeResponse) => {
        setEditingDemande(d);
        setEditLibelle(extractLibelle(d.raison || ''));
        setEditRaison(extractRaison(d.raison || ''));
        if (referentiels.length === 0) {
            try {
                const res = await referentielService.getActiveByType('TYPE_DEMANDE');
                setReferentiels(res.data.data || []);
            } catch { /* ignore */ }
        }
    };

    const handleEditSave = async () => {
        if (!editingDemande) return;
        setEditLoading(true);
        try {
            await demandePapierService.update(editingDemande.id, {
                raison: `[${editLibelle}] ${editRaison}`,
                employeId: editingDemande.employeId,
            });
            setEditingDemande(null);
            loadDemandes();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Erreur lors de la modification');
        } finally {
            setEditLoading(false);
        }
    };

    const filtered = demandes.filter((d) => {
        const libelle = extractLibelle(d.raison || '');
        const matchSearch =
            libelle.toLowerCase().includes(search.toLowerCase()) ||
            d.raison?.toLowerCase().includes(search.toLowerCase());
        const matchStatut = filterStatut ? (d.statut as string) === filterStatut : true;
        return matchSearch && matchStatut;
    });

    const columns = [
        { key: 'id', label: '#' },
        {
            key: 'type',
            label: 'Type de demande',
            render: (item: DemandeResponse) => (
                <TypeBadge libelle={extractLibelle(item.raison || '')} />
            ),
        },
        {
            key: 'raison',
            label: 'Raison',
            render: (d: DemandeResponse) => (
                <span className="truncate max-w-[200px] block">{extractRaison(d.raison || '')}</span>
            ),
        },
        {
            key: 'dateCreation',
            label: 'Date de création',
            render: (d: DemandeResponse) => (
                <span className="text-theme-xs text-gray-500">{d.dateCreation || '-'}</span>
            ),
        },
        {
            key: 'statut',
            label: 'Statut',
            render: (item: DemandeResponse) => (
                <Badge text={item.statut} variant={statutBadgeMap[item.statut] || 'neutral'} />
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (item: DemandeResponse) => (
                <div className="flex items-center gap-0.5">
                    {/* Voir */}
                    <div className="relative group">
                        <button
                            onClick={() => setSelectedDemande(item)}
                            className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                        >
                            <HiOutlineEye size={16} />
                        </button>
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded bg-gray-800 px-2 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">Voir</span>
                    </div>
                    {canEdit(item) && (
                        <>
                            {/* Modifier */}
                            <div className="relative group">
                                <button
                                    onClick={() => openEdit(item)}
                                    className="rounded-lg p-1.5 text-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-500/10 transition-colors"
                                >
                                    <HiOutlinePencil size={16} />
                                </button>
                                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded bg-gray-800 px-2 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">Modifier</span>
                            </div>
                            {/* Annuler */}
                            <div className="relative group">
                                <button
                                    onClick={() => { setCancellingId(item.id); setCancelMotif(''); }}
                                    className="rounded-lg p-1.5 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                                >
                                    <HiOutlineBan size={16} />
                                </button>
                                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded bg-gray-800 px-2 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">Annuler</span>
                            </div>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Mes Demandes Papier</h1>
                    <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
                        Historique de vos demandes administratives
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher..."
                        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent pl-10 pr-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
                    />
                </div>
                <select
                    value={filterStatut}
                    onChange={(e) => setFilterStatut(e.target.value)}
                    className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
                >
                    <option value="">Tous les statuts</option>
                    {['BROUILLON', 'SOUMISE', 'EN_VALIDATION', 'VALIDEE', 'REFUSEE', 'ANNULEE'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">Chargement...</div>
            ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                    <p className="text-gray-400 dark:text-gray-500 text-theme-sm">Aucune demande papier trouvée.</p>
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={filtered}
                    onRowDoubleClick={(item) => setSelectedDemande(item)}
                />
            )}

            {/* Detail Modal */}
            <Modal isOpen={!!selectedDemande} onClose={() => setSelectedDemande(null)} title="Détails de la demande papier">
                {selectedDemande && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-theme-xs text-gray-500 dark:text-gray-400">Type de demande</p>
                                <TypeBadge libelle={extractLibelle(selectedDemande.raison || '')} />
                            </div>
                            <div>
                                <p className="text-theme-xs text-gray-500 dark:text-gray-400">Statut</p>
                                <Badge text={selectedDemande.statut} variant={statutBadgeMap[selectedDemande.statut] || 'neutral'} />
                            </div>
                            <div>
                                <p className="text-theme-xs text-gray-500 dark:text-gray-400">Date de création</p>
                                <p className="text-theme-sm font-medium text-gray-800 dark:text-white">{selectedDemande.dateCreation}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-theme-xs text-gray-500 dark:text-gray-400">Raison</p>
                            <p className="text-theme-sm text-gray-700 dark:text-gray-300 mt-1">
                                {extractRaison(selectedDemande.raison || '')}
                            </p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Cancel Confirmation Modal */}
            <Modal isOpen={!!cancellingId} onClose={() => setCancellingId(null)} title="Annuler la demande">
                <div className="space-y-4">
                    <p className="text-theme-sm text-gray-600 dark:text-gray-300">
                        Êtes-vous sûr de vouloir annuler cette demande ?
                    </p>
                    <div>
                        <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                            Motif d'annulation (optionnel)
                        </label>
                        <textarea
                            value={cancelMotif}
                            onChange={e => setCancelMotif(e.target.value)}
                            rows={3}
                            className={inputClass + ' !h-auto py-3'}
                            placeholder="Précisez la raison de l'annulation..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setCancellingId(null)}>Retour</Button>
                        <Button onClick={handleCancelConfirm} disabled={cancelLoading}>
                            {cancelLoading ? 'Annulation...' : 'Confirmer l\'annulation'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Demande Modal */}
            <Modal isOpen={!!editingDemande} onClose={() => setEditingDemande(null)} title="Modifier la demande">
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Type de demande</label>
                        <select
                            value={editLibelle}
                            onChange={e => setEditLibelle(e.target.value)}
                            className={inputClass}
                        >
                            {referentiels.length === 0
                                ? <option value={editLibelle}>{editLibelle}</option>
                                : referentiels.map(r => <option key={r.id} value={r.libelle}>{r.libelle}</option>)
                            }
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Raison</label>
                        <textarea
                            value={editRaison}
                            onChange={e => setEditRaison(e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setEditingDemande(null)}>Annuler</Button>
                        <Button onClick={handleEditSave} disabled={editLoading}>
                            {editLoading ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default MesDemandesPapierPage;
