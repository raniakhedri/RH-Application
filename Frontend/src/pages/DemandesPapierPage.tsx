import React, { useState, useEffect } from 'react';
import { HiOutlineSearch, HiOutlineEye, HiOutlineXCircle } from 'react-icons/hi';
import { demandeService } from '../api/demandeService';
import { DemandeResponse, StatutDemande, TypeDemande } from '../types';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

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

const DemandesPapierPage: React.FC = () => {
    const { user } = useAuth();
    const [demandes, setDemandes] = useState<DemandeResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatut, setFilterStatut] = useState<string>('');
    const [selectedDemande, setSelectedDemande] = useState<DemandeResponse | null>(null);

    useEffect(() => {
        loadDemandes();
    }, []);

    const loadDemandes = async () => {
        try {
            const response = await demandeService.getAll();
            const all = response.data.data || [];
            // Only keep ADMINISTRATION type demandes
            setDemandes(all.filter((d) => d.type === TypeDemande.ADMINISTRATION));
        } catch (err) {
            console.error('Erreur chargement demandes papier:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: number) => {
        try {
            await demandeService.cancel(id);
            loadDemandes();
        } catch (err) {
            console.error('Erreur annulation:', err);
        }
    };

    const filtered = demandes.filter((d) => {
        const libelle = extractLibelle(d.raison || '');
        const matchSearch =
            d.employeNom?.toLowerCase().includes(search.toLowerCase()) ||
            libelle.toLowerCase().includes(search.toLowerCase()) ||
            d.raison?.toLowerCase().includes(search.toLowerCase());
        const matchStatut = filterStatut ? d.statut === filterStatut : true;
        return matchSearch && matchStatut;
    });

    const columns = [
        { key: 'id', label: '#' },
        {
            key: 'type',
            label: 'Type de demande',
            render: (item: DemandeResponse) => (
                <span className="font-medium text-gray-800 dark:text-white">
                    {extractLibelle(item.raison || '')}
                </span>
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
                <span className="text-theme-xs text-gray-500">
                    {d.dateCreation || '-'}
                </span>
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
                    {(item.statut === 'BROUILLON' || item.statut === 'SOUMISE') && (
                        <button
                            onClick={() => handleCancel(item.id)}
                            className="rounded-lg p-1.5 text-error-500 hover:bg-error-50"
                            title="Annuler"
                        >
                            <HiOutlineXCircle size={16} />
                        </button>
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
                    {Object.values(StatutDemande).map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">Chargement...</div>
            ) : (
                <DataTable columns={columns} data={filtered} />
            )}

            {/* Detail Modal */}
            <Modal isOpen={!!selectedDemande} onClose={() => setSelectedDemande(null)} title="Détails de la demande papier">
                {selectedDemande && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-theme-xs text-gray-500 dark:text-gray-400">Type de demande</p>
                                <p className="text-theme-sm font-medium text-gray-800 dark:text-white">
                                    {extractLibelle(selectedDemande.raison || '')}
                                </p>
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
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default DemandesPapierPage;
