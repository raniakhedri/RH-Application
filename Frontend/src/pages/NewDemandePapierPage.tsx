import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { demandeService } from '../api/demandeService';
import { referentielService } from '../api/referentielService';
import { Referentiel, TypeDemande } from '../types';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const NewDemandePapierPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [referentiels, setReferentiels] = useState<Referentiel[]>([]);
    const [selectedLibelle, setSelectedLibelle] = useState('');
    const [raison, setRaison] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingRef, setLoadingRef] = useState(true);

    useEffect(() => {
        const fetchReferentiels = async () => {
            try {
                const res = await referentielService.getActiveByType('TYPE_DEMANDE');
                const data = res.data.data || [];
                setReferentiels(data);
                if (data.length > 0) setSelectedLibelle(data[0].libelle);
            } catch (err) {
                console.error('Erreur chargement types de demande:', err);
            } finally {
                setLoadingRef(false);
            }
        };
        fetchReferentiels();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setError('');
        setLoading(true);

        try {
            await demandeService.create({
                type: TypeDemande.ADMINISTRATION,
                raison: `[${selectedLibelle}] ${raison}`,
                employeId: user.employeId,
            });
            navigate('/demandes-papier');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la création');
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Demande papier</h1>
                <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
                    Créer une demande administrative (papier)
                </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
                {error && (
                    <div className="mb-4 rounded-lg border border-error-200 bg-error-50 p-3 text-theme-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Type de demande */}
                    <div>
                        <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                            Type de demande
                        </label>
                        {loadingRef ? (
                            <div className="h-11 flex items-center text-theme-sm text-gray-400">Chargement...</div>
                        ) : referentiels.length === 0 ? (
                            <div className="h-11 flex items-center text-theme-sm text-error-500">
                                Aucun type de demande disponible. Veuillez en créer dans les Référentiels.
                            </div>
                        ) : (
                            <select
                                value={selectedLibelle}
                                onChange={(e) => setSelectedLibelle(e.target.value)}
                                className={inputClass}
                                required
                            >
                                {referentiels.map((ref) => (
                                    <option key={ref.id} value={ref.libelle}>
                                        {ref.libelle}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Raison */}
                    <div>
                        <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                            Raison
                        </label>
                        <textarea
                            value={raison}
                            onChange={(e) => setRaison(e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
                            placeholder="Décrivez la raison de votre demande..."
                            required
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button variant="outline" type="button" onClick={() => navigate('/demandes')}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading || loadingRef || referentiels.length === 0}>
                            {loading ? 'Création...' : 'Créer la demande'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewDemandePapierPage;
