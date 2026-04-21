import { useState, useEffect, useCallback } from 'react';
import { tacheObligatoireService, TacheObligatoireDTO } from '../api/tacheObligatoireService';

interface UseTachesObligatoiresResult {
    tachesObligatoires: TacheObligatoireDTO[];
    blockedDates: Set<string>;
    loading: boolean;
    reload: () => void;
}

/**
 * Custom hook that fetches all Tâches Obligatoires for a given employee.
 * Returns a flat Set<string> of all blocked date strings (YYYY-MM-DD).
 */
export function useTachesObligatoires(employeId: number | undefined): UseTachesObligatoiresResult {
    const [tachesObligatoires, setTachesObligatoires] = useState<TacheObligatoireDTO[]>([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        if (!employeId) return;
        setLoading(true);
        try {
            const res = await tacheObligatoireService.getByEmploye(employeId);
            setTachesObligatoires(res.data.data || []);
        } catch {
            setTachesObligatoires([]);
        } finally {
            setLoading(false);
        }
    }, [employeId]);

    useEffect(() => {
        load();
    }, [load]);

    const blockedDates = new Set<string>(
        tachesObligatoires.flatMap((t) => t.dates)
    );

    return { tachesObligatoires, blockedDates, loading, reload: load };
}
