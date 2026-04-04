import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    HiOutlineTrash,
    HiOutlineSearch,
    HiOutlineCheck,
    HiOutlineX,
    HiOutlineUserAdd,
    HiOutlineChevronDown,
    HiOutlineChevronRight,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { mediaPlanService } from '../api/mediaPlanService';
import { mediaPlanAssignmentService } from '../api/mediaPlanAssignmentService';
import { referentielService } from '../api/referentielService';
import { clientService, ClientDTO } from '../api/clientService';
import {
    MediaPlan,
    MediaPlanAssignment,
    Referentiel,
    EtatPublication,
    EtatPublicationLabels,
    StatutMediaPlanLabels,
} from '../types';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

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
];

// ── Link detection ──
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

// ── Column resize styles ──
const resizeHandleStyle: React.CSSProperties = {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px',
    cursor: 'col-resize', zIndex: 10, borderRight: '2px solid transparent', transition: 'border-color 0.15s',
};
const resizeHandleHoverStyle: React.CSSProperties = {
    ...resizeHandleStyle, borderRight: '2px solid var(--color-brand-500, #6366f1)',
};

// ── Status helpers ──
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

// ── Batch type ──
interface PlanBatch {
    key: string;
    plans: MediaPlan[];
    monthLabel: string;
    employeeName: string;
    sentDate: string;
}

const getBatchLabel = (batch: PlanBatch) => {
    return `media plan de ${batch.monthLabel} ___a été envoyé par : ${batch.employeeName}  à ${batch.sentDate}`;
};

// ══════════════════════════════════════
// ── MAIN COMPONENT ──
// ══════════════════════════════════════
const TousLesMediaPlanPage: React.FC = () => {
    const { user } = useAuth();
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

    const [clients, setClients] = useState<ClientDTO[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [mediaPlans, setMediaPlans] = useState<MediaPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatut, setFilterStatut] = useState('');

    // Referentiels
    const [formats, setFormats] = useState<Referentiel[]>([]);
    const [types, setTypes] = useState<Referentiel[]>([]);
    const [platformes, setPlateformes] = useState<Referentiel[]>([]);

    // Accordion state
    const [openBatches, setOpenBatches] = useState<Set<string>>(new Set());

    // Assign employee modal
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [socialMediaEmployees, setSocialMediaEmployees] = useState<{ id: number; nom: string; prenom: string; departement: string; email: string }[]>([]);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
    const [existingAssignments, setExistingAssignments] = useState<MediaPlanAssignment[]>([]);

    // Column widths
    const [colWidths, setColWidths] = useState<number[]>(COLUMNS.map(c => c.defaultWidth));
    const [resizingCol, setResizingCol] = useState<number | null>(null);
    const [hoveredHandle, setHoveredHandle] = useState<number | null>(null);
    const resizeStartX = useRef(0);
    const resizeStartW = useRef(0);

    useEffect(() => { loadClients(); loadReferentiels(); }, []);
    useEffect(() => {
        if (selectedClientId) { loadMediaPlans(selectedClientId); loadAssignments(selectedClientId); }
    }, [selectedClientId]);

    // ── Column resize handlers ──
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

    const loadClients = async () => {
        try {
            const res = await clientService.getAllClients();
            const list = res.data.data || [];
            setClients(list);
            if (list.length > 0) setSelectedClientId(list[0].id);
        } catch (e) { console.error('Error loading clients:', e); }
        finally { setLoading(false); }
    };

    const loadMediaPlans = async (clientId: number) => {
        try {
            const res = await mediaPlanService.getByClient(clientId);
            setMediaPlans(res.data.data || []);
        } catch (e) { console.error('Error loading media plans:', e); }
    };

    const loadAssignments = async (clientId: number) => {
        try {
            const res = await mediaPlanAssignmentService.getByClient(clientId);
            setExistingAssignments(res.data.data || []);
        } catch (e) { console.error('Error loading assignments:', e); }
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

    // ── Helper to build batch metadata ──
    const createBatch = (index: number, plans: MediaPlan[]): PlanBatch => {
        const first = plans[0];
        let monthLabel = '';
        if (first.datePublication) {
            const d = new Date(first.datePublication);
            monthLabel = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
        }
        const employeeName = `${first.createurPrenom || ''} ${first.createurNom || ''}`.trim() || 'Inconnu';
        let sentDate = '';
        if (first.dateCreation) {
            const d = new Date(first.dateCreation);
            sentDate = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
        return { key: `batch-${index}`, plans, monthLabel, employeeName, sentDate };
    };

    // ── Group plans into batches by dateCreation time gap (>5s = new batch) ──
    const batches = useMemo((): PlanBatch[] => {
        let filtered = mediaPlans;
        if (filterStatut) filtered = filtered.filter(mp => mp.statut === filterStatut);
        if (search) {
            const s = search.toLowerCase();
            filtered = filtered.filter(mp =>
                mp.titre?.toLowerCase().includes(s) ||
                mp.createurNom?.toLowerCase().includes(s) ||
                mp.createurPrenom?.toLowerCase().includes(s) ||
                mp.format?.toLowerCase().includes(s)
            );
        }

        const sorted = [...filtered].sort((a, b) => {
            const da = a.dateCreation ? new Date(a.dateCreation).getTime() : 0;
            const db = b.dateCreation ? new Date(b.dateCreation).getTime() : 0;
            return da - db;
        });
        const groups: PlanBatch[] = [];
        let currentBatch: MediaPlan[] = [];
        let lastTime = 0;

        for (const mp of sorted) {
            const t = mp.dateCreation ? new Date(mp.dateCreation).getTime() : 0;
            if (currentBatch.length === 0 || (t - lastTime) < 5000) {
                currentBatch.push(mp);
            } else {
                groups.push(createBatch(groups.length, currentBatch));
                currentBatch = [mp];
            }
            lastTime = t;
        }
        if (currentBatch.length > 0) {
            groups.push(createBatch(groups.length, currentBatch));
        }
        return groups.reverse(); // newest on top
    }, [mediaPlans, filterStatut, search]);

    const toggleBatch = (key: string) => {
        setOpenBatches(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    // ── Approve / Disapprove all plans in a batch ──
    const handleApproveBatch = async (batch: PlanBatch) => {
        confirm(`Approuver les ${batch.plans.length} ligne(s) de ce plan ?`, async () => {
            try {
                for (const mp of batch.plans) {
                    if (mp.statut !== 'APPROUVE') {
                        await mediaPlanService.approve(mp.id, user?.employeId || 0);
                    }
                }
                if (selectedClientId) loadMediaPlans(selectedClientId);
            } catch (e: any) {
                alert(e.response?.data?.message || 'Erreur lors de l\'approbation');
            }
        });
    };

    const handleDisapproveBatch = async (batch: PlanBatch) => {
        confirm(`Désapprouver les ${batch.plans.length} ligne(s) de ce plan ?`, async () => {
            try {
                for (const mp of batch.plans) {
                    if (mp.statut !== 'DESAPPROUVE') {
                        await mediaPlanService.disapprove(mp.id);
                    }
                }
                if (selectedClientId) loadMediaPlans(selectedClientId);
            } catch (e: any) {
                alert(e.response?.data?.message || 'Erreur');
            }
        });
    };

    // ── Assign Employee ──
    const openAssignModal = async () => {
        try {
            const res = await mediaPlanAssignmentService.getSocialMediaEmployees();
            setSocialMediaEmployees(res.data.data || []);
            setSelectedEmployeeIds([]);
            setShowAssignModal(true);
        } catch (e) { console.error('Error loading SM employees:', e); }
    };

    const toggleEmployee = (id: number) => {
        setSelectedEmployeeIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleAssign = async () => {
        if (!selectedClientId || selectedEmployeeIds.length === 0) return;
        try {
            await mediaPlanAssignmentService.assign({ clientId: selectedClientId, employeIds: selectedEmployeeIds });
            setShowAssignModal(false);
            loadAssignments(selectedClientId);
        } catch (e: any) { alert(e.response?.data?.message || 'Erreur'); }
    };

    const handleRemoveAssignment = (assignmentId: number) => {
        confirm('Retirer cet employé de ce client ?', async () => {
            try {
                await mediaPlanAssignmentService.remove(assignmentId);
                if (selectedClientId) loadAssignments(selectedClientId);
            } catch (e: any) { alert(e.response?.data?.message || 'Erreur'); }
        });
    };

    const getStatusBadge = (statut: string) => {
        const colors: Record<string, string> = { EN_ATTENTE: 'warning', APPROUVE: 'success', DESAPPROUVE: 'danger' };
        return <Badge variant={(colors[statut] || 'neutral') as any}>{StatutMediaPlanLabels[statut as keyof typeof StatutMediaPlanLabels] || statut}</Badge>;
    };

    const inputClass = 'w-full bg-transparent border-0 text-sm text-gray-700 dark:text-gray-300 px-1 py-2.5 cursor-default opacity-70';

    const tableWidth = colWidths.reduce((s, w) => s + w, 0);

    // ── Render table header ──
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

    // ── Render existing row (read-only) ──
    const renderRow = (mp: MediaPlan) => (
        <tr key={mp.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50" style={{ height: '104px' }}>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[0] }}>
                <span className={inputClass}>{mp.datePublication || '-'}</span>
            </td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[1] }}>
                <span className={inputClass}>{mp.heure || '-'}</span>
            </td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[2] }}>
                <span className={inputClass}>{mp.format || '-'}</span>
            </td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[3] }}>
                <span className={inputClass}>{mp.type || '-'}</span>
            </td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[4] }}>
                <span className={`${inputClass} font-medium truncate block`}>{mp.titre || '-'}</span>
            </td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[5] }}>
                <span className={`${inputClass} truncate block`}>{renderCellValue(mp.texteSurVisuel)}</span>
            </td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[6] }}>
                <span className={`${inputClass} truncate block`}>{renderCellValue(mp.inspiration)}</span>
            </td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[7] }}>
                <span className={`${inputClass} truncate block`}>{renderCellValue(mp.autresElements)}</span>
            </td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[8] }}>
                <span className={inputClass}>{mp.platforme || '-'}</span>
            </td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[9] }}>
                <span className={`${inputClass} truncate block`}>{renderCellValue(mp.lienDrive)}</span>
            </td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[10] }}>
                <Badge variant="neutral">{EtatPublicationLabels[mp.etatPublication as keyof typeof EtatPublicationLabels] || mp.etatPublication || '-'}</Badge>
            </td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[11] }}>
                <span className={`${inputClass} truncate block`}>{renderCellValue(mp.rectifs)}</span>
            </td>
            <td className="px-2 py-1 border-r border-gray-100 dark:border-gray-800 overflow-hidden" style={{ width: colWidths[12] }}>
                <span className={`${inputClass} truncate block`}>{renderCellValue(mp.remarques)}</span>
            </td>
            <td className="px-2 py-1 overflow-hidden" style={{ width: colWidths[13] }}>
                {getStatusBadge(mp.statut)}
            </td>
        </tr>
    );

    // ══════════════════════════════════════
    // ── RENDER ──
    // ══════════════════════════════════════

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tous les Media Plans</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gestion et approbation des media plans</p>
                </div>
                <button onClick={openAssignModal}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors">
                    <HiOutlineUserAdd size={18} /> Assigner Employé
                </button>
            </div>

            {/* Client Selector + Assigned Employees */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sélectionner un client</label>
                    <select value={selectedClientId || ''} onChange={e => setSelectedClientId(Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-brand-500">
                        {clients.map(c => (<option key={c.id} value={c.id}>{c.nom}</option>))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Employés assignés</label>
                    <div className="flex flex-wrap gap-2">
                        {existingAssignments.length === 0 ? (
                            <span className="text-sm text-gray-400">Aucun employé assigné</span>
                        ) : existingAssignments.map(a => (
                            <span key={a.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 text-xs font-medium">
                                {a.employePrenom} {a.employeNom}
                                <button onClick={() => handleRemoveAssignment(a.id)} className="ml-1 hover:text-red-500 transition-colors" title="Retirer">
                                    <HiOutlineX size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Rechercher par titre, créateur, format..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 dark:text-white" />
                </div>
                <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm dark:text-white">
                    <option value="">Tous les statuts</option>
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="APPROUVE">Approuvé</option>
                    <option value="DESAPPROUVE">Désapprouvé</option>
                </select>
            </div>

            {/* ── Batch Accordions ── */}
            {batches.length === 0 ? (
                <div className="py-12 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                    {selectedClientId ? 'Aucun media plan pour ce client' : 'Sélectionnez un client'}
                </div>
            ) : (
                <div className="space-y-3">
                    {batches.map(batch => {
                        const batchStatus = getStatusInfo(batch.plans);
                        const isOpen = openBatches.has(batch.key);
                        const allApproved = batch.plans.every(p => p.statut === 'APPROUVE');
                        const allDisapproved = batch.plans.every(p => p.statut === 'DESAPPROUVE');

                        return (
                            <div key={batch.key} className={`rounded-xl border-2 overflow-hidden transition-all duration-300 ${statusColorClasses[batchStatus.color]}`}>
                                {/* Accordion header */}
                                <div className="flex items-center justify-between px-5 py-4">
                                    <button onClick={() => toggleBatch(batch.key)}
                                        className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
                                        {isOpen
                                            ? <HiOutlineChevronDown size={20} className="transition-transform flex-shrink-0" />
                                            : <HiOutlineChevronRight size={20} className="transition-transform flex-shrink-0" />}
                                        <div className="min-w-0">
                                            <span className="text-base font-semibold">{getBatchLabel(batch)}</span>
                                            <span className="text-sm opacity-70 ml-2">— {batch.plans.length} ligne(s)</span>
                                        </div>
                                    </button>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                        {!allApproved && (
                                            <button onClick={() => handleApproveBatch(batch)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors">
                                                <HiOutlineCheck size={14} /> Approuver
                                            </button>
                                        )}
                                        {!allDisapproved && (
                                            <button onClick={() => handleDisapproveBatch(batch)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors">
                                                <HiOutlineX size={14} /> Désapprouver
                                            </button>
                                        )}
                                        <Badge variant={
                                            batchStatus.color === 'green' ? 'success' :
                                                batchStatus.color === 'red' ? 'danger' :
                                                    batchStatus.color === 'warning' ? 'warning' : 'neutral' as any
                                        }>{batchStatus.label}</Badge>
                                    </div>
                                </div>

                                {/* Accordion content */}
                                {isOpen && (
                                    <div className="overflow-x-auto border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                        <table className="divide-y divide-gray-200 dark:divide-gray-700" style={{ tableLayout: 'fixed', width: tableWidth }}>
                                            {renderTableHeader()}
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {batch.plans.map(mp => renderRow(mp))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Assign Employee Modal */}
            <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assigner des employés Social Media" size="md">
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                    {socialMediaEmployees.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">Aucun employé trouvé dans le département Social Media</p>
                    ) : socialMediaEmployees.map(emp => {
                        const alreadyAssigned = existingAssignments.some(a => a.employeId === emp.id);
                        return (
                            <label key={emp.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${alreadyAssigned
                                    ? 'border-green-300 bg-green-50 dark:bg-green-900/10 dark:border-green-700'
                                    : selectedEmployeeIds.includes(emp.id)
                                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}>
                                <input type="checkbox" checked={alreadyAssigned || selectedEmployeeIds.includes(emp.id)}
                                    disabled={alreadyAssigned} onChange={() => !alreadyAssigned && toggleEmployee(emp.id)}
                                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{emp.prenom} {emp.nom}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{emp.email}</p>
                                </div>
                                {alreadyAssigned && <Badge variant="success">Assigné</Badge>}
                            </label>
                        );
                    })}
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Annuler</button>
                    <button onClick={handleAssign} disabled={selectedEmployeeIds.length === 0}
                        className="px-4 py-2 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Assigner ({selectedEmployeeIds.length})
                    </button>
                </div>
            </Modal>

            <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
        </div>
    );
};

export default TousLesMediaPlanPage;
