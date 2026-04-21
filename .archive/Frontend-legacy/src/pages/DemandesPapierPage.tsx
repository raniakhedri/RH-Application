import React, { useState, useEffect } from 'react';
import { HiOutlineSearch, HiOutlineEye, HiOutlineXCircle, HiOutlineCheck } from 'react-icons/hi';
import { demandePapierService } from '../api/demandePapierService';
import { DemandeResponse } from '../types';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { useNotifications } from '../context/NotificationContext';

const statutBadgeMap: Record<string, 'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'neutral'> = {
    BROUILLON: 'neutral',
    SOUMISE: 'primary',
    EN_VALIDATION: 'warning',
    VALIDEE: 'success',
    REFUSEE: 'danger',
    ANNULEE: 'neutral',
};

/** Extract the libellé stored between brackets: "[libellé] raison" → "libellé" */
const extractLibelle = (raison: string): string => {
    const match = raison?.match(/^\[([^\]]+)\]/);
    return match ? match[1] : raison || '-';
};

/** Extract the raison part after the bracketed libellé */
const extractRaison = (raison: string): string => {
    return raison?.replace(/^\[[^\]]+\]\s*/, '') || '-';
};

/** Generate a stable pastel color from a string label */
const labelToColor = (label: string): { bg: string; text: string; border: string } => {
    // Simple hash → hue
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
            style={{
                backgroundColor: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.border}`,
            }}
            className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide"
        >
            {libelle}
        </span>
    );
};

const DemandesPapierPage: React.FC = () => {
    const { addNotification } = useNotifications();
    const [demandes, setDemandes] = useState<DemandeResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatut, setFilterStatut] = useState<string>('');
    const [selectedDemande, setSelectedDemande] = useState<DemandeResponse | null>(null);
    const [accepting, setAccepting] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        loadDemandes();
    }, []);

    const loadDemandes = async () => {
        try {
            const response = await demandePapierService.getAll();
            const all = response.data.data || [];
            setDemandes(all);
        } catch (err) {
            console.error('Erreur chargement demandes papier:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (demande: DemandeResponse) => {
        setAccepting(true);
        try {
            await demandePapierService.accept(demande.id);
            addNotification(
                demande.employeId,
                `Votre demande papier "${extractLibelle(demande.raison || '')}" a été acceptée ✓`
            );
            setSelectedDemande(null);
            loadDemandes();
        } catch (err) {
            console.error('Erreur acceptation:', err);
        } finally {
            setAccepting(false);
        }
    };

    const handleCancel = async (demande: DemandeResponse) => {
        setCancelling(true);
        try {
            await demandePapierService.cancel(demande.id);
            addNotification(
                demande.employeId,
                `Votre demande papier "${extractLibelle(demande.raison || '')}" a été refusée ✗`
            );
            setSelectedDemande(null);
            loadDemandes();
        } catch (err) {
            console.error('Erreur annulation:', err);
        } finally {
            setCancelling(false);
        }
    };

    const filtered = demandes.filter((d) => {
        const libelle = extractLibelle(d.raison || '');
        const matchSearch =
            d.employeNom?.toLowerCase().includes(search.toLowerCase()) ||
            libelle.toLowerCase().includes(search.toLowerCase()) ||
            d.raison?.toLowerCase().includes(search.toLowerCase());
        const matchStatut = filterStatut ? (d.statut as string) === filterStatut : true;
        return matchSearch && matchStatut;
    });

    const canActOn = (statut: string) =>
        statut === 'SOUMISE' || statut === 'EN_VALIDATION' || statut === 'BROUILLON';

    const columns = [
        { key: 'id', label: '#' },
        {
            key: 'type',
            label: 'Type de demande',
            render: (item: DemandeResponse) => (
                <TypeBadge libelle={extractLibelle(item.raison || '')} />
            ),
        },
        { key: 'employeNom', label: 'Employé' },
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
                <div className="flex gap-1">
                    <button
                        onClick={() => setSelectedDemande(item)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Voir"
                    >
                        <HiOutlineEye size={16} />
                    </button>
                    {canActOn(item.statut) && (
                        <>
                            <button
                                onClick={() => handleAccept(item)}
                                className="rounded-lg p-1.5 text-success-500 hover:bg-success-50"
                                title="Accepter"
                            >
                                <HiOutlineCheck size={16} />
                            </button>
                            <button
                                onClick={() => handleCancel(item)}
                                className="rounded-lg p-1.5 text-error-500 hover:bg-error-50"
                                title="Refuser"
                            >
                                <HiOutlineXCircle size={16} />
                            </button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Demandes papier</h1>
                <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
                    Liste des demandes administratives (papier)
                </p>
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

            {/* Table — double-click a row to open detail */}
            {loading ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">Chargement...</div>
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
                                <p className="text-theme-xs text-gray-500 dark:text-gray-400">Employé</p>
                                <p className="text-theme-sm font-medium text-gray-800 dark:text-white">{selectedDemande.employeNom}</p>
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

                        {/* Action buttons visible only for actionable statuses */}
                        {canActOn(selectedDemande.statut) && (
                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => handleCancel(selectedDemande)}
                                    disabled={cancelling || accepting}
                                >
                                    {cancelling ? 'Refus...' : 'Refuser'}
                                </Button>
                                <Button
                                    onClick={() => handleAccept(selectedDemande)}
                                    disabled={accepting || cancelling}
                                >
                                    {accepting ? 'Acceptation...' : 'Accepter'}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default DemandesPapierPage;
