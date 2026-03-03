import React, { useState, useEffect, useRef } from 'react';
import { demandeService } from '../api/demandeService';
import { referentielService } from '../api/referentielService';
import { Referentiel, TypeDemande } from '../types';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const NewDemandePapierPage: React.FC = () => {
    const { user } = useAuth();

    const [referentiels, setReferentiels] = useState<Referentiel[]>([]);
    const [selectedLibelle, setSelectedLibelle] = useState('');
    const [raison, setRaison] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingRef, setLoadingRef] = useState(true);
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        return () => {
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            await demandeService.create({
                type: TypeDemande.ADMINISTRATION,
                raison: `[${selectedLibelle}] ${raison}`,
                employeId: user.employeId,
            });
            // Reset fields and show success banner
            setRaison('');
            if (referentiels.length > 0) setSelectedLibelle(referentiels[0].libelle);
            setSuccess(true);
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
            successTimerRef.current = setTimeout(() => setSuccess(false), 5000);
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

            {/* Success banner */}
            {success && (
                <div className="flex items-center gap-3 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-theme-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400 animate-fade-in">
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Demande créée avec succès !
                </div>
            )}

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
