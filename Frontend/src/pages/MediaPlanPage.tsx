import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    HiOutlineTrash,
    HiOutlineCheck,
    HiOutlineSearch,
    HiOutlinePlus,
    HiOutlineX,
    HiOutlineRefresh,
    HiOutlineChevronDown,
    HiOutlineChevronRight,
} from 'react-icons/hi';
import { SiGoogledrive } from 'react-icons/si';
import { useAuth } from '../context/AuthContext';
import { mediaPlanService } from '../api/mediaPlanService';
import { referentielService } from '../api/referentielService';
import { mediaPlanAssignmentService } from '../api/mediaPlanAssignmentService';
import {
    MediaPlan,
    MediaPlanRequest,
    Referentiel,
    EtatPublication,
    EtatPublicationLabels,
    StatutMediaPlanLabels,
    MediaPlanAssignment,
} from '../types';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

const HOURS = ['', ...Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)];
const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MIN_ROWS = 14;

const COLUMNS = [
    { key: 'datePublication', label: 'Date Pub.', defaultWidth: 130 },
    { key: 'heure', label: 'Heure', defaultWidth: 90 },
    { key: 'format', label: 'Format', defaultWidth: 110 },
    { key: 'type', label: 'Type', defaultWidth: 110 },
    { key: 'titre', label: 'Titre', defaultWidth: 140 },
    { key: 'texteSurVisuel', label: 'Texte/Visuel', defaultWidth: 130 },
    { key: 'inspiration', label: 'Inspiration', defaultWidth: 120 },
    { key: 'autresElements', label: 'Autres', defaultWidth: 110 },
    { key: 'platforme', label: 'Platforme', defaultWidth: 110 },
    { key: 'lienDrive', label: 'Lien Drive', defaultWidth: 120 },
    { key: 'etatPublication', label: 'État Pub.', defaultWidth: 110 },
    { key: 'rectifs', label: 'Rectifs', defaultWidth: 110 },
    { key: 'remarques', label: 'Remarques', defaultWidth: 120 },
    { key: 'statut', label: 'Statut', defaultWidth: 100 },
    { key: 'actions', label: 'Actions', defaultWidth: 80 },
];

// ── Draft row ──
interface DraftRow {
    _draft: true;
    _key: string;
    datePublication: string;
    heure: string;
    format: string;
    type: string;
    titre: string;
    texteSurVisuel: string;
    inspiration: string;
    autresElements: string;
    platforme: string;
    lienDrive: string;
    etatPublication: string;
    rectifs: string;
    remarques: string;
}

const emptyDraft = (): DraftRow => ({
    _draft: true,
    _key: `draft-${Date.now()}-${Math.random()}`,
    datePublication: '',
    heure: '',
    format: '',
    type: '',
    titre: '',
    texteSurVisuel: '',
    inspiration: '',
    autresElements: '',
    platforme: '',
    lienDrive: '',
    etatPublication: '',
    rectifs: '',
    remarques: '',
});

// datePublication is excluded because it's always pre-filled with the month's first day
const isDraftFilled = (d: DraftRow) => !!(d.titre || d.heure || d.format || d.type || d.texteSurVisuel || d.inspiration || d.autresElements || d.platforme || d.lienDrive || d.etatPublication || d.rectifs || d.remarques || d.texteSurVisuel);

// ── Expanded cell overlay ──
const ExpandedCell: React.FC<{
    value: string;
    readOnly?: boolean;
    onConfirm: (text: string) => void;
    onCancel: () => void;
}> = ({ value, readOnly, onConfirm, onCancel }) => {
    const [text, setText] = useState(value);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!readOnly) onConfirm(text); else onCancel();
        }
        if (e.key === 'Escape') onCancel();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onCancel}>
            <div className="absolute inset-0 bg-gray-900/40" />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{readOnly ? 'Aperçu' : 'Modifier'}</span>
                    <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <HiOutlineX size={18} className="text-gray-500" />
                    </button>
                </div>
                <div className="px-4">
                    <textarea autoFocus value={readOnly ? value : text} readOnly={readOnly}
                        onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
                        className={`w-full h-40 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 ${readOnly ? 'cursor-default opacity-80' : ''}`}
                    />
                </div>
                {!readOnly && (
                    <div className="flex justify-end gap-2 px-4 pb-4 pt-2">
                        <button onClick={onCancel} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Annuler</button>
                        <button onClick={() => onConfirm(text)} className="px-3 py-1.5 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors">Confirmer</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Detect links ──
const renderCellValue = (value: string | null) => {
    if (!value) return '-';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (urlRegex.test(value)) {
        return value.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
            /^https?:\/\//.test(part) ? (
                <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-brand-500 underline hover:text-brand-600 break-all" onClick={e => e.stopPropagation()}>
                    {part.length > 25 ? part.substring(0, 25) + '…' : part}
                </a>
            ) : <span key={i}>{part}</span>
        );
    }
    return value;
};

// ── Month key helper ──
const getMonthKey = (year: number, month: number) => `${year}-${String(month + 1).padStart(2, '0')}`;
const parseMonthKey = (key: string) => {
    const [y, m] = key.split('-').map(Number);
    return { year: y, month: m - 1 };
};

// ── LocalStorage helpers ──
const DRAFT_STORAGE_PREFIX = 'mp_drafts_';
const getDraftStorageKey = (clientId: number, monthKey: string) => `${DRAFT_STORAGE_PREFIX}${clientId}_${monthKey}`;

const saveDraftsToStorage = (clientId: number, monthKey: string, drafts: DraftRow[]) => {
    try {
        const filled = drafts.filter(isDraftFilled);
        if (filled.length > 0) {
            localStorage.setItem(getDraftStorageKey(clientId, monthKey), JSON.stringify(filled));
        } else {
            localStorage.removeItem(getDraftStorageKey(clientId, monthKey));
        }
    } catch (e) { /* */ }
};

const loadDraftsFromStorage = (clientId: number, monthKey: string): DraftRow[] => {
    try {
        const raw = localStorage.getItem(getDraftStorageKey(clientId, monthKey));
        if (raw) {
            const parsed = JSON.parse(raw) as DraftRow[];
            return parsed.map(d => ({ ...d, _key: `draft-${Date.now()}-${Math.random()}` }));
        }
    } catch (e) { /* */ }
    return [];
};

const clearDraftsFromStorage = (clientId: number, monthKey: string) => {
    try { localStorage.removeItem(getDraftStorageKey(clientId, monthKey)); } catch (e) { /* */ }
};

// ── Column resize styles ──
const resizeHandleStyle: React.CSSProperties = {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px',
    cursor: 'col-resize', zIndex: 10, borderRight: '2px solid transparent', transition: 'border-color 0.15s',
};
const resizeHandleHoverStyle: React.CSSProperties = {
    ...resizeHandleStyle, borderRight: '2px solid var(--color-brand-500, #6366f1)',
};

// ── Get status label and color for accordion header ──
const getStatusInfo = (plans: MediaPlan[]) => {
    if (plans.length === 0) return { label: 'Vide', color: 'gray' };
    if (plans.every(p => p.statut === 'APPROUVE')) return { label: 'Approuvé', color: 'green' };
    if (plans.some(p => p.statut === 'DESAPPROUVE')) return { label: 'Désapprouvé', color: 'red' };
    if (plans.some(p => p.statut === 'EN_ATTENTE')) return { label: 'En attente', color: 'warning' };
    return { label: 'Brouillon', color: 'brand' };
};

const statusColorClasses: Record<string, string> = {
    green: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 text-green-700 dark:text-green-400',
    red: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400',
    brand: 'bg-brand-50 border-brand-200 dark:bg-brand-900/20 dark:border-brand-800 text-brand-700 dark:text-brand-400',
    gray: 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-600 dark:text-gray-400',
};

// ══════════════════════════════════════════════════
// ── MAIN COMPONENT ──
// ══════════════════════════════════════════════════
const MediaPlanPage: React.FC = () => {
    const { user } = useAuth();
    const { clientId: clientIdParam } = useParams<{ clientId: string }>();
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

    const [mediaPlans, setMediaPlans] = useState<MediaPlan[]>([]);
    const [assignments, setAssignments] = useState<MediaPlanAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [draftRows, setDraftRows] = useState<DraftRow[]>([]);

    // Expanded cell
    const [expandedCell, setExpandedCell] = useState<{
        value: string; readOnly: boolean; onSave: (v: string) => void;
    } | null>(null);

    // Month navigation
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(getMonthKey(now.getFullYear(), now.getMonth()));

    // Accordion states: track which batch accordions are open by batch key
    const [openBatches, setOpenBatches] = useState<Set<string>>(new Set());
    const [newPlanOpen, setNewPlanOpen] = useState(false);
    const [isGoogleAuthorized, setIsGoogleAuthorized] = useState<boolean | null>(null);

    const toggleBatch = (batchKey: string) => {
        setOpenBatches(prev => {
            const next = new Set(prev);
            if (next.has(batchKey)) next.delete(batchKey); else next.add(batchKey);
            return next;
        });
    };

    // Column widths
    const [colWidths, setColWidths] = useState<number[]>(COLUMNS.map(c => c.defaultWidth));
    const [resizingCol, setResizingCol] = useState<number | null>(null);
    const [hoveredHandle, setHoveredHandle] = useState<number | null>(null);
    const resizeStartX = useRef(0);
    const resizeStartW = useRef(0);

    // Referentiels
    const [formats, setFormats] = useState<Referentiel[]>([]);
    const [types, setTypes] = useState<Referentiel[]>([]);
    const [platformes, setPlateformes] = useState<Referentiel[]>([]);

    const selectedClientId = clientIdParam ? Number(clientIdParam) : null;

    useEffect(() => { loadReferentiels(); checkGoogleAuth(); }, []);
    useEffect(() => { loadData(); }, [selectedClientId]);

    // ── Column resize ──
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (resizingCol === null) return;
        const delta = e.clientX - resizeStartX.current;
        const newWidth = Math.max(50, resizeStartW.current + delta);
        setColWidths(prev => { const next = [...prev]; next[resizingCol] = newWidth; return next; });
    }, [resizingCol]);

    const handleMouseUp = useCallback(() => {
        setResizingCol(null);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    useEffect(() => {
        if (resizingCol !== null) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingCol, handleMouseMove, handleMouseUp]);

    const startResize = (colIndex: number, e: React.MouseEvent) => {
        e.preventDefault();
        resizeStartX.current = e.clientX;
        resizeStartW.current = colWidths[colIndex];
        setResizingCol(colIndex);
    };

    const checkGoogleAuth = async () => {
        try {
            const statusRes = await mediaPlanService.getGoogleAuthStatus();
            setIsGoogleAuthorized(!!statusRes.data.data);
        } catch (e) { console.error(e); }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            if (!user?.employeId) return;
            if (selectedClientId) {
                const mpRes = await mediaPlanService.getByClient(selectedClientId);
                setMediaPlans(mpRes.data.data || []);
            } else {
                const [mpRes, assignRes] = await Promise.all([
                    mediaPlanService.getByEmploye(user.employeId),
                    mediaPlanAssignmentService.getByEmploye(user.employeId),
                ]);
                setMediaPlans(mpRes.data.data || []);
                setAssignments(assignRes.data.data || []);
            }
        } catch (e) {
            console.error('Error loading:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadReferentiels = async () => {
        try {
            const [fRes, tRes, pRes] = await Promise.all([
                referentielService.getActiveByType('FORMAT_MEDIA_PLAN'),
                referentielService.getActiveByType('TYPE_MEDIA_PLAN'),
                referentielService.getActiveByType('PLATFORME_MEDIA_PLAN'),
            ]);
            setFormats(fRes.data.data || []);
            setTypes(tRes.data.data || []);
            setPlateformes(pRes.data.data || []);
        } catch (e) { console.error(e); }
    };

    const clientName = useMemo(() => {
        if (!selectedClientId) return null;
        const fromPlan = mediaPlans.find(mp => mp.clientId === selectedClientId);
        if (fromPlan?.clientNom) return fromPlan.clientNom;
        const fromAssign = assignments.find(a => a.clientId === selectedClientId);
        return fromAssign?.clientNom || `Client #${selectedClientId}`;
    }, [selectedClientId, mediaPlans, assignments]);

    // ── Month list ──
    const monthList = useMemo(() => {
        const months: { key: string; label: string; year: number; month: number }[] = [];
        for (let offset = -6; offset <= 6; offset++) {
            const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
            months.push({
                key: getMonthKey(d.getFullYear(), d.getMonth()),
                label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
                year: d.getFullYear(), month: d.getMonth(),
            });
        }
        return months;
    }, []);

    // ── Filter media plans by selected month ──
    const monthMediaPlans = useMemo(() => {
        const { year, month } = parseMonthKey(selectedMonth);
        return mediaPlans.filter(mp => {
            if (!mp.datePublication) return false;
            const d = new Date(mp.datePublication);
            return d.getFullYear() === year && d.getMonth() === month;
        });
    }, [mediaPlans, selectedMonth]);

    // ── Check if month has sent plans ──
    const isMonthSent = useMemo(() => {
        return monthMediaPlans.some(mp => mp.statut === 'EN_ATTENTE' || mp.statut === 'APPROUVE');
    }, [monthMediaPlans]);

    // ── Group sent plans into batches by dateCreation time gap (>5s gap = new batch) ──
    const sentBatches = useMemo(() => {
        if (!isMonthSent) return [];
        const sorted = [...monthMediaPlans].sort((a, b) => {
            const da = a.dateCreation ? new Date(a.dateCreation).getTime() : 0;
            const db = b.dateCreation ? new Date(b.dateCreation).getTime() : 0;
            return da - db;
        });
        const batches: { key: string; plans: MediaPlan[] }[] = [];
        let currentBatch: MediaPlan[] = [];
        let lastTime = 0;
        for (const mp of sorted) {
            const t = mp.dateCreation ? new Date(mp.dateCreation).getTime() : 0;
            // Within a submission, consecutive API calls are <1s apart
            // Between submissions, there's always 10+ seconds of user interaction
            if (currentBatch.length === 0 || (t - lastTime) < 5000) {
                currentBatch.push(mp);
            } else {
                batches.push({ key: `batch-${batches.length}`, plans: currentBatch });
                currentBatch = [mp];
            }
            lastTime = t;
        }
        if (currentBatch.length > 0) {
            batches.push({ key: `batch-${batches.length}`, plans: currentBatch });
        }
        return batches;
    }, [monthMediaPlans, isMonthSent]);

    // ── Load drafts ──
    useEffect(() => {
        if (!selectedClientId) return;
        // If month is sent and new plan is not open, clear drafts
        if (isMonthSent && !newPlanOpen) {
            setDraftRows([]);
            return;
        }
        const saved = loadDraftsFromStorage(selectedClientId, selectedMonth);
        const totalExisting = (isMonthSent ? 0 : monthMediaPlans.length) + saved.length;
        const needed = Math.max(0, MIN_ROWS - totalExisting);
        const { year, month } = parseMonthKey(selectedMonth);
        const emptyPad = Array.from({ length: needed }, () => {
            const d = emptyDraft();
            d.datePublication = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            return d;
        });
        setDraftRows([...saved, ...emptyPad]);
    }, [selectedMonth, monthMediaPlans.length, selectedClientId, isMonthSent]);

    // Reset accordion states on month change
    useEffect(() => {
        setOpenBatches(new Set());
        setNewPlanOpen(false);
    }, [selectedMonth]);

    // ── Month status for tab coloring ──
    const getMonthStatus = (monthKey: string): 'approved' | 'declined' | 'pending' | 'empty' => {
        const { year, month } = parseMonthKey(monthKey);
        const mps = mediaPlans.filter(mp => {
            if (!mp.datePublication) return false;
            const d = new Date(mp.datePublication);
            return d.getFullYear() === year && d.getMonth() === month;
        });
        if (mps.length === 0) return 'empty';
        if (mps.some(mp => mp.statut === 'DESAPPROUVE')) return 'declined';
        if (mps.every(mp => mp.statut === 'APPROUVE')) return 'approved';
        if (mps.some(mp => mp.statut === 'EN_ATTENTE' || mp.statut === 'APPROUVE')) return 'pending';
        return 'empty';
    };

    const monthTabClass = (monthKey: string) => {
        const status = getMonthStatus(monthKey);
        const base = 'px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 cursor-pointer border ';
        if (monthKey === selectedMonth) {
            if (status === 'approved') return base + 'bg-green-500 text-white border-green-600 shadow-md';
            if (status === 'declined') return base + 'bg-red-500 text-white border-red-600 shadow-md';
            if (status === 'pending') return base + 'bg-warning-500 text-white border-warning-600 shadow-md';
            return base + 'bg-brand-500 text-white border-brand-600 shadow-md';
        }
        if (status === 'approved') return base + 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 hover:bg-green-100';
        if (status === 'declined') return base + 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 hover:bg-red-100';
        if (status === 'pending') return base + 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800 hover:bg-warning-100';
        return base + 'bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700';
    };

    const handleGoogleAuth = async () => {
        try {
            const res = await mediaPlanService.getGoogleAuthUrl();
            if (res.data.data) {
                const url = res.data.data as string;
                window.open(url, '_blank');
                // Poll for status change
                const interval = setInterval(async () => {
                    const status = await mediaPlanService.getGoogleAuthStatus();
                    if (status.data.data) {
                        setIsGoogleAuthorized(true);
                        clearInterval(interval);
                    }
                }, 3000);
                setTimeout(() => clearInterval(interval), 60000);
            }
        } catch (e: any) {
            alert('Erreur lors de la récupération de l\'URL d\'autorisation');
        }
    };

    // ===== CELL EDIT =====
    const handleCellChange = async (mp: MediaPlan, field: string, value: string) => {
        if (mp.statut === 'EN_ATTENTE' || mp.statut === 'APPROUVE') return;
        try {
            await mediaPlanService.update(mp.id, { [field]: value } as any);
            setMediaPlans(prev => prev.map(p => p.id === mp.id ? { ...p, [field]: value } : p));
        } catch (e: any) { console.error(e); }
    };

    const openExpanded = (value: string, readOnly: boolean, onSave: (v: string) => void) => {
        setExpandedCell({ value, readOnly, onSave });
    };

    // ===== ADD ROW =====
    const handleAddRow = () => {
        const { year, month } = parseMonthKey(selectedMonth);
        const draft = emptyDraft();
        draft.datePublication = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        setDraftRows(prev => {
            const next = [...prev, draft];
            if (selectedClientId) saveDraftsToStorage(selectedClientId, selectedMonth, next);
            return next;
        });
    };

    const handleDraftChange = (index: number, field: keyof DraftRow, value: string) => {
        setDraftRows(prev => {
            const updated = [...prev];
            (updated[index] as any)[field] = value;
            if (selectedClientId) saveDraftsToStorage(selectedClientId, selectedMonth, updated);
            return updated;
        });
    };

    // ===== BULK CONFIRM =====
    const handleBulkConfirm = async () => {
        if (!selectedClientId) return alert('Sélectionnez un client');
        const filledDrafts = draftRows.filter(isDraftFilled);
        if (filledDrafts.length === 0) return alert('Aucune ligne remplie à confirmer');

        confirm(`Confirmer et envoyer ${filledDrafts.length} ligne(s) remplie(s) au manager ?`, async () => {
            try {
                const requests: MediaPlanRequest[] = filledDrafts.map(draft => ({
                    titre: draft.titre || 'Sans titre',
                    datePublication: draft.datePublication || undefined,
                    heure: draft.heure || undefined,
                    format: draft.format || undefined,
                    type: draft.type || undefined,
                    texteSurVisuel: draft.texteSurVisuel || undefined,
                    inspiration: draft.inspiration || undefined,
                    autresElements: draft.autresElements || undefined,
                    platforme: draft.platforme || undefined,
                    lienDrive: draft.lienDrive || undefined,
                    etatPublication: draft.etatPublication || undefined,
                    rectifs: draft.rectifs || undefined,
                    remarques: draft.remarques || undefined,
                    clientId: selectedClientId,
                    createurId: user?.employeId || 0,
                }));

                await mediaPlanService.createBulk(requests);

                if (selectedClientId) clearDraftsFromStorage(selectedClientId, selectedMonth);
                setNewPlanOpen(false);
                await loadData();
            } catch (e: any) {
                alert(e.response?.data?.message || 'Erreur');
            }
        });
    };

    // ===== CLEAR ROW =====
    const handleClearRow = async (mp: MediaPlan) => {
        if (mp.statut === 'EN_ATTENTE' || mp.statut === 'APPROUVE') return;
        try {
            await mediaPlanService.update(mp.id, {
                titre: mp.titre, heure: '', format: '', type: '', texteSurVisuel: '',
                inspiration: '', autresElements: '', platforme: '', lienDrive: '',
                etatPublication: '', rectifs: '', remarques: '',
            } as any);
            setMediaPlans(prev => prev.map(p => p.id === mp.id ? {
                ...p, heure: null, format: null, type: null, texteSurVisuel: null,
                inspiration: null, autresElements: null, platforme: null, lienDrive: null,
                etatPublication: null, rectifs: null, remarques: null,
            } : p));
        } catch (e: any) { console.error(e); }
    };

    const removeDraft = (index: number) => {
        setDraftRows(prev => {
            const updated = prev.filter((_, i) => i !== index);
            if (selectedClientId) saveDraftsToStorage(selectedClientId, selectedMonth, updated);
            return updated;
        });
    };

    const getStatusBadge = (statut: string) => {
        const variants: Record<string, string> = { EN_ATTENTE: 'warning', APPROUVE: 'success', DESAPPROUVE: 'danger' };
        return <Badge variant={(variants[statut] || 'neutral') as any}>{StatutMediaPlanLabels[statut as keyof typeof StatutMediaPlanLabels] || statut}</Badge>;
    };

    const isReadOnly = (mp: MediaPlan) => mp.statut === 'EN_ATTENTE' || mp.statut === 'APPROUVE';

    const inputClass = (ro?: boolean) =>
        `w-full bg-transparent border-0 text-sm text-gray-700 dark:text-gray-300 px-1 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded ${ro ? 'cursor-default opacity-70' : 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-text'}`;

    const selectClass = (ro?: boolean) =>
        `w-full bg-transparent border-0 text-sm text-gray-700 dark:text-gray-300 px-0 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500 rounded ${ro ? 'cursor-default opacity-70 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`;

    // ── Text cell ──
    const TextCell: React.FC<{
        value: string; readOnly?: boolean; placeholder?: string; className?: string;
        onSave: (v: string) => void;
    }> = ({ value, readOnly, placeholder, className = '', onSave }) => {
        const cellValue = value || '';
        const hasLink = cellValue && /(https?:\/\/[^\s]+)/.test(cellValue);
        return (
            <div className={`relative ${className}`}
                onDoubleClick={() => { if (readOnly) openExpanded(cellValue, true, () => { }); }}>
                {readOnly ? (
                    <div className={`${inputClass(true)} truncate cursor-pointer`} title="Double-cliquez pour voir">
                        {hasLink ? renderCellValue(cellValue) : (cellValue || '-')}
                    </div>
                ) : (
                    <input type="text" value={cellValue} readOnly className={`${inputClass(false)} truncate`}
                        placeholder={placeholder} onFocus={() => openExpanded(cellValue, false, onSave)} />
                )}
            </div>
        );
    };

    // ── Open new plan section ──
    const handleOpenNewPlan = () => {
        setNewPlanOpen(true);
        // Load or create draft rows for the new plan
        if (!selectedClientId) return;
        const saved = loadDraftsFromStorage(selectedClientId, selectedMonth);
        const needed = Math.max(0, MIN_ROWS - saved.length);
        const { year, month } = parseMonthKey(selectedMonth);
        const emptyPad = Array.from({ length: needed }, () => {
            const d = emptyDraft();
            d.datePublication = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            return d;
        });
        setDraftRows([...saved, ...emptyPad]);
    };

    // ══════════════════════════════════════════════════
    // ── RENDER TABLE (reusable for both sent & drafts) ──
    // ══════════════════════════════════════════════════
    const renderTableHeader = () => (
        <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
                {COLUMNS.map((col, ci) => (
                    <th key={col.key}
                        className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap border-r border-gray-200 dark:border-gray-700 relative select-none"
                        style={{ width: colWidths[ci], minWidth: 50, overflow: 'hidden' }}>
                        {col.label}
                        {ci < COLUMNS.length - 1 && (
                            <div style={hoveredHandle === ci || resizingCol === ci ? resizeHandleHoverStyle : resizeHandleStyle}
                                onMouseDown={e => startResize(ci, e)}
                                onMouseEnter={() => setHoveredHandle(ci)}
                                onMouseLeave={() => setHoveredHandle(null)} />
                        )}
                    </th>
                ))}
            </tr>
        </thead>
    );

    const renderExistingRow = (mp: MediaPlan) => {
        const ro = isReadOnly(mp);
        return (
            <tr key={mp.id} className={`transition-colors ${ro ? 'bg-gray-50/50 dark:bg-gray-800/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`} style={{ height: '104px' }}>
                <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[0] }}><input type="date" value={mp.datePublication || ''} readOnly={ro} onChange={e => handleCellChange(mp, 'datePublication', e.target.value)} className={inputClass(ro)} /></td>
                <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[1] }}>
                    <select value={mp.heure || ''} disabled={ro} onChange={e => handleCellChange(mp, 'heure', e.target.value)} className={selectClass(ro)}>
                        {HOURS.map(h => <option key={h} value={h}>{h || '-'}</option>)}
                    </select>
                </td>
                <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[2] }}>
                    <select value={mp.format || ''} disabled={ro} onChange={e => handleCellChange(mp, 'format', e.target.value)} className={selectClass(ro)}>
                        <option value="">-</option>
                        {formats.map(f => <option key={f.id} value={f.libelle}>{f.libelle}</option>)}
                    </select>
                </td>
                <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[3] }}>
                    <select value={mp.type || ''} disabled={ro} onChange={e => handleCellChange(mp, 'type', e.target.value)} className={selectClass(ro)}>
                        <option value="">-</option>
                        {types.map(t => <option key={t.id} value={t.libelle}>{t.libelle}</option>)}
                    </select>
                </td>
                <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[4] }}><TextCell value={mp.titre} readOnly={ro} onSave={v => handleCellChange(mp, 'titre', v)} className="font-medium" /></td>
                <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[5] }}><TextCell value={mp.texteSurVisuel || ''} readOnly={ro} onSave={v => handleCellChange(mp, 'texteSurVisuel', v)} /></td>
                <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[6] }}><TextCell value={mp.inspiration || ''} readOnly={ro} onSave={v => handleCellChange(mp, 'inspiration', v)} /></td>
                <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[7] }}><TextCell value={mp.autresElements || ''} readOnly={ro} onSave={v => handleCellChange(mp, 'autresElements', v)} /></td>
                <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[8] }}>
                    <select value={mp.platforme || ''} disabled={ro} onChange={e => handleCellChange(mp, 'platforme', e.target.value)} className={selectClass(ro)}>
                        <option value="">-</option>
                        {platformes.map(p => <option key={p.id} value={p.libelle}>{p.libelle}</option>)}
                    </select>
                </td>
                <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[9] }}><TextCell value={mp.lienDrive || ''} readOnly={ro} onSave={v => handleCellChange(mp, 'lienDrive', v)} /></td>
                <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[10] }}>
                    <select value={mp.etatPublication || ''} disabled={ro} onChange={e => handleCellChange(mp, 'etatPublication', e.target.value)} className={selectClass(ro)}>
                        <option value="">-</option>
                        {Object.values(EtatPublication).map(ep => <option key={ep} value={ep}>{EtatPublicationLabels[ep]}</option>)}
                    </select>
                </td>
                <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[11] }}><TextCell value={mp.rectifs || ''} readOnly={ro} onSave={v => handleCellChange(mp, 'rectifs', v)} /></td>
                <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[12] }}><TextCell value={mp.remarques || ''} readOnly={ro} onSave={v => handleCellChange(mp, 'remarques', v)} /></td>
                <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[13] }}>{getStatusBadge(mp.statut)}</td>
                <td className="px-2 py-1 overflow-hidden" style={{ width: colWidths[14] }}>
                    {!ro && (
                        <button onClick={() => handleClearRow(mp)} className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Vider la ligne">
                            <HiOutlineTrash size={15} />
                        </button>
                    )}
                </td>
            </tr>
        );
    };

    const renderDraftRow = (draft: DraftRow, idx: number) => (
        <tr key={draft._key} className="bg-brand-50/30 dark:bg-brand-900/5 hover:bg-brand-50/60 dark:hover:bg-brand-900/10 transition-colors" style={{ height: '104px' }}>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[0] }}><input type="date" value={draft.datePublication} onChange={e => handleDraftChange(idx, 'datePublication', e.target.value)} className={inputClass()} /></td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[1] }}>
                <select value={draft.heure} onChange={e => handleDraftChange(idx, 'heure', e.target.value)} className={selectClass()}>
                    {HOURS.map(h => <option key={h} value={h}>{h || '-'}</option>)}
                </select>
            </td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[2] }}>
                <select value={draft.format} onChange={e => handleDraftChange(idx, 'format', e.target.value)} className={selectClass()}>
                    <option value="">-</option>
                    {formats.map(f => <option key={f.id} value={f.libelle}>{f.libelle}</option>)}
                </select>
            </td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[3] }}>
                <select value={draft.type} onChange={e => handleDraftChange(idx, 'type', e.target.value)} className={selectClass()}>
                    <option value="">-</option>
                    {types.map(t => <option key={t.id} value={t.libelle}>{t.libelle}</option>)}
                </select>
            </td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[4] }}><TextCell value={draft.titre} placeholder="Titre..." onSave={v => handleDraftChange(idx, 'titre', v)} className="font-medium" /></td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[5] }}><TextCell value={draft.texteSurVisuel} placeholder="..." onSave={v => handleDraftChange(idx, 'texteSurVisuel', v)} /></td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[6] }}><TextCell value={draft.inspiration} placeholder="..." onSave={v => handleDraftChange(idx, 'inspiration', v)} /></td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[7] }}><TextCell value={draft.autresElements} placeholder="..." onSave={v => handleDraftChange(idx, 'autresElements', v)} /></td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[8] }}>
                <select value={draft.platforme} onChange={e => handleDraftChange(idx, 'platforme', e.target.value)} className={selectClass()}>
                    <option value="">-</option>
                    {platformes.map(p => <option key={p.id} value={p.libelle}>{p.libelle}</option>)}
                </select>
            </td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[9] }}><TextCell value={draft.lienDrive} placeholder="https://..." onSave={v => handleDraftChange(idx, 'lienDrive', v)} /></td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[10] }}>
                <select value={draft.etatPublication} onChange={e => handleDraftChange(idx, 'etatPublication', e.target.value)} className={selectClass()}>
                    <option value="">-</option>
                    {Object.values(EtatPublication).map(ep => <option key={ep} value={ep}>{EtatPublicationLabels[ep]}</option>)}
                </select>
            </td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[11] }}><TextCell value={draft.rectifs} placeholder="..." onSave={v => handleDraftChange(idx, 'rectifs', v)} /></td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[12] }}><TextCell value={draft.remarques} placeholder="..." onSave={v => handleDraftChange(idx, 'remarques', v)} /></td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[13] }}><Badge variant="light">Brouillon</Badge></td>
            <td className="px-2 py-1 overflow-hidden" style={{ width: colWidths[14] }}>
                <div className="flex gap-1">
                    <button onClick={() => {
                        const { year, month } = parseMonthKey(selectedMonth);
                        setDraftRows(prev => {
                            const updated = [...prev];
                            updated[idx] = { ...emptyDraft(), datePublication: `${year}-${String(month + 1).padStart(2, '0')}-01` };
                            if (selectedClientId) saveDraftsToStorage(selectedClientId, selectedMonth, updated);
                            return updated;
                        });
                    }} className="p-1 rounded text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Vider les champs">
                        <HiOutlineRefresh size={15} />
                    </button>
                    <button onClick={() => removeDraft(idx)} className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Supprimer la ligne">
                        <HiOutlineTrash size={15} />
                    </button>
                </div>
            </td>
        </tr>
    );

    const tableWidth = colWidths.reduce((s, w) => s + w, 0);

    // ══════════════════════════════════════════════════
    // ── RENDER ──
    // ══════════════════════════════════════════════════

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    if (!selectedClientId) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
                <HiOutlineSearch size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">Sélectionnez un client</p>
                <p className="text-sm mt-1">Choisissez un client dans le menu latéral sous "Media Plan"</p>
            </div>
        );
    }

    const sentStatus = getStatusInfo(monthMediaPlans);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Media Plan</h1>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Client : <span className="text-brand-500 font-medium">{clientName}</span>
                        </p>
                        <div
                            className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded ${isGoogleAuthorized
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                }`}
                        >
                            <SiGoogledrive size={14} className={isGoogleAuthorized ? 'text-green-600' : 'text-brand-500'} />
                            {isGoogleAuthorized === null ? 'Vérification...' : isGoogleAuthorized ? 'Drive (Bot Connecté)' : 'Drive (Non configuré)'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Month tabs ── */}
            <div className="overflow-x-auto pb-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-2">
                <div className="flex gap-2 min-w-max">
                    {monthList.map(m => (
                        <button key={m.key} onClick={() => setSelectedMonth(m.key)} className={monthTabClass(m.key)}>
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════ */}
            {/* CASE 1: Month has sent plans → collapsible accordion + "add new" button */}
            {/* ══════════════════════════════════════════════════ */}
            {isMonthSent && (
                <>
                    {/* ── Sent plans accordions — one per batch ── */}
                    {sentBatches.map((batch, batchIdx) => {
                        const batchStatus = getStatusInfo(batch.plans);
                        const isOpen = openBatches.has(batch.key);
                        return (
                            <div key={batch.key} className={`rounded-xl border-2 overflow-hidden transition-all duration-300 ${statusColorClasses[batchStatus.color]}`}>
                                <button onClick={() => toggleBatch(batch.key)}
                                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:opacity-80 transition-opacity">
                                    <div className="flex items-center gap-3">
                                        {isOpen
                                            ? <HiOutlineChevronDown size={20} className="transition-transform" />
                                            : <HiOutlineChevronRight size={20} className="transition-transform" />}
                                        <span className="text-base font-semibold">{batchStatus.label}</span>
                                        <span className="text-sm opacity-70">— {batch.plans.length} ligne(s)</span>
                                    </div>
                                    <Badge variant={
                                        batchStatus.color === 'green' ? 'success' :
                                            batchStatus.color === 'red' ? 'danger' :
                                                batchStatus.color === 'warning' ? 'warning' : 'neutral' as any
                                    }>{batchStatus.label}</Badge>
                                </button>

                                {isOpen && (
                                    <div className="overflow-x-auto border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                        <table className="divide-y divide-gray-200 dark:divide-gray-700" style={{ tableLayout: 'fixed', width: tableWidth }}>
                                            {renderTableHeader()}
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {batch.plans.map(mp => renderExistingRow(mp))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* ── "Add new plan" button ── */}
                    {!newPlanOpen && (
                        <button onClick={handleOpenNewPlan}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-brand-300 dark:border-brand-700 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors font-medium text-sm">
                            <HiOutlinePlus size={18} />
                            Ajouter un nouveau plan média pour ce mois
                        </button>
                    )}

                    {/* ── New plan accordion (draft table) ── */}
                    {newPlanOpen && (
                        <div className="rounded-xl border-2 border-brand-200 dark:border-brand-800 overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-3 bg-brand-50 dark:bg-brand-900/20 border-b border-brand-200 dark:border-brand-800">
                                <div className="flex items-center gap-3">
                                    <HiOutlineChevronDown size={20} className="text-brand-500" />
                                    <span className="text-base font-semibold text-brand-700 dark:text-brand-400">Nouveau plan média</span>
                                    <Badge variant="light">Brouillon</Badge>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleAddRow}
                                        className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition-colors">
                                        <HiOutlinePlus size={14} /> Ajouter ligne
                                    </button>
                                    <button onClick={handleBulkConfirm}
                                        className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors">
                                        <HiOutlineCheck size={14} /> Confirmer et envoyer
                                    </button>
                                    <button onClick={() => { setNewPlanOpen(false); setDraftRows([]); }}
                                        className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <HiOutlineX size={14} /> Fermer
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto bg-white dark:bg-gray-900">
                                <table className="divide-y divide-gray-200 dark:divide-gray-700" style={{ tableLayout: 'fixed', width: tableWidth }}>
                                    {renderTableHeader()}
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {draftRows.map((draft, idx) => renderDraftRow(draft, idx))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ══════════════════════════════════════════════════ */}
            {/* CASE 2: Month not sent yet → original table with drafts */}
            {/* ══════════════════════════════════════════════════ */}
            {!isMonthSent && (
                <>
                    <div className="flex gap-2 items-center justify-end">
                        <button onClick={handleAddRow}
                            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600 transition-colors">
                            <HiOutlinePlus size={16} /> Ajouter ligne
                        </button>
                        <button onClick={handleBulkConfirm}
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 transition-colors">
                            <HiOutlineCheck size={16} /> Confirmer et envoyer
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                        <table className="divide-y divide-gray-200 dark:divide-gray-700" style={{ tableLayout: 'fixed', width: tableWidth }}>
                            {renderTableHeader()}
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {monthMediaPlans.map(mp => renderExistingRow(mp))}
                                {draftRows.map((draft, idx) => renderDraftRow(draft, idx))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Expanded cell overlay */}
            {expandedCell && (
                <ExpandedCell
                    value={expandedCell.value}
                    readOnly={expandedCell.readOnly}
                    onConfirm={(text) => {
                        if (!expandedCell.readOnly) expandedCell.onSave(text);
                        setExpandedCell(null);
                    }}
                    onCancel={() => setExpandedCell(null)}
                />
            )}

            <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
        </div>
    );
};

export default MediaPlanPage;
