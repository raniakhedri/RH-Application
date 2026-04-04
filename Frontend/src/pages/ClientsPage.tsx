import React, { useState, useEffect, useCallback } from 'react';
import {
    HiOutlinePlus,
    HiOutlineSearch,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineDocumentText,
    HiOutlineDownload,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { clientService, ClientDTO } from '../api/clientService';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useConfirm } from '../hooks/useConfirm';

/* ─── Page ─────────────────────────────────────────────────────────────────── */
const ClientsPage: React.FC = () => {
    const { user } = useAuth();
    const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();
    const perms = user?.permissions ?? [];

    const canManage = perms.includes('MANAGE_CLIENTS') || perms.includes('CREATE_CLIENT') || perms.includes('EDIT_CLIENT');
    const canCreate = canManage || perms.includes('CREATE_CLIENT');
    const canEdit = canManage || perms.includes('EDIT_CLIENT');
    const canDelete = canManage || perms.includes('DELETE_CLIENT');

    const [clients, setClients] = useState<ClientDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<ClientDTO | null>(null);
    const [form, setForm] = useState({ nom: '', description: '', telephone: '', responsable: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* ── Load ─────────────────────────────────────────────────────────────── */
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await clientService.getAllClients();
            setClients((res.data as any).data ?? res.data ?? []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = clients.filter(c =>
        c.nom.toLowerCase().includes(search.toLowerCase()) ||
        (c.description ?? '').toLowerCase().includes(search.toLowerCase())
    );

    /* ── Modal helpers ────────────────────────────────────────────────────── */
    const openCreate = () => {
        setEditing(null);
        setForm({ nom: '', description: '', telephone: '', responsable: '' });
        setSelectedFile(null);
        setError(null);
        setShowModal(true);
    };

    const openEdit = (c: ClientDTO) => {
        setEditing(c);
        setForm({ nom: c.nom, description: c.description ?? '', telephone: c.telephone ?? '', responsable: c.responsable ?? '' });
        setSelectedFile(null);
        setError(null);
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditing(null); };

    const handleSave = async () => {
        if (!form.nom.trim()) { setError('Le nom est obligatoire.'); return; }
        setSaving(true); setError(null);
        try {
            if (editing) {
                await clientService.updateClient(editing.id, form.nom, form.description, form.telephone, form.responsable, selectedFile ?? undefined);
            } else {
                await clientService.createClient(form.nom, form.description, form.telephone, form.responsable, selectedFile ?? undefined);
            }
            closeModal();
            await load();
        } catch (e: any) {
            setError(e?.response?.data?.message ?? 'Erreur lors de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        confirm('Supprimer ce client ?', async () => {
            try { await clientService.deleteClient(id); await load(); }
            catch (e: any) { alert(e?.response?.data?.message ?? 'Erreur.'); }
        }, 'Supprimer le client');
    };

    /* ── File open ───────────────────────────────────────────────────────── */
    const openFile = (c: ClientDTO) => {
        if (c.fileUrl) {
            const base = window.location.hostname === 'localhost'
                ? 'http://localhost:8080'
                : 'https://rh-antigone.onrender.com';
            window.open(`${base}${c.fileUrl}`, '_blank');
        }
    };

    /* ── Render ──────────────────────────────────────────────────────────── */
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-title-sm font-bold text-gray-800 dark:text-white">Clients</h1>
                    <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des clients</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-theme-sm font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                        {filtered.length} client{filtered.length !== 1 ? 's' : ''}
                    </span>
                    {canCreate && (
                        <Button size="sm" onClick={openCreate}>
                            <HiOutlinePlus size={16} className="mr-1" /> Nouveau client
                        </Button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher un client..."
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent pl-10 pr-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
                />
            </div>

            {/* Table */}
            {loading ? (
                <div className="py-20 text-center text-gray-500">Chargement...</div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center text-gray-400">Aucun client trouvé</div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
                    <table className="w-full text-left text-theme-sm">
                        <thead className="border-b border-gray-100 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-800/40">
                            <tr>
                                <th className="px-5 py-3.5 font-semibold text-gray-600 dark:text-gray-300">Client</th>
                                <th className="px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-300">Description</th>
                                <th className="px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-300">Fichier</th>
                                <th className="px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-300">Date création</th>
                                <th className="px-4 py-3.5 font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filtered.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                    {/* Client info */}
                                    <td className="px-5 py-3.5">
                                        <p className="font-semibold text-gray-800 dark:text-white">{c.nom}</p>
                                        {c.telephone && <p className="text-theme-xs text-gray-400">📞 {c.telephone}</p>}
                                        {c.responsable && <p className="text-theme-xs text-brand-500 font-medium">👤 {c.responsable}</p>}
                                    </td>

                                    {/* Description */}
                                    <td className="px-4 py-3.5 max-w-[200px]">
                                        <p className="text-theme-xs text-gray-500 dark:text-gray-400 line-clamp-2">{c.description || <span className="italic text-gray-300">—</span>}</p>
                                    </td>

                                    {/* File */}
                                    <td className="px-4 py-3.5">
                                        {c.fileName ? (
                                            <button
                                                onClick={() => openFile(c)}
                                                className="flex items-center gap-1.5 text-brand-600 hover:text-brand-700 dark:text-brand-400 text-theme-xs font-medium hover:underline"
                                            >
                                                <HiOutlineDocumentText size={14} />
                                                <span className="max-w-[100px] truncate">{c.fileName}</span>
                                                <HiOutlineDownload size={12} />
                                            </button>
                                        ) : (
                                            <span className="text-gray-300 text-theme-xs italic">Aucun fichier</span>
                                        )}
                                    </td>

                                    {/* Date creation */}
                                    <td className="px-4 py-3.5">
                                        <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                                            {c.dateCreation ? new Date(c.dateCreation).toLocaleDateString('fr-FR') : '—'}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {canEdit && (
                                                <button
                                                    onClick={() => openEdit(c)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-700 transition-colors"
                                                    title="Modifier"
                                                >
                                                    <HiOutlinePencil size={16} />
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10 transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <HiOutlineTrash size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create / Edit Modal */}
            <Modal isOpen={showModal} onClose={closeModal} title={editing ? 'Modifier le client' : 'Nouveau client'}>
                <div className="space-y-4 p-1">
                    {error && (
                        <div className="rounded-lg bg-error-50 px-4 py-3 text-theme-sm text-error-700 dark:bg-error-500/10 dark:text-error-400">
                            {error}
                        </div>
                    )}

                    {/* Nom */}
                    <div>
                        <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                            Nom <span className="text-error-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.nom}
                            onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
                            placeholder="Nom du client"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300 resize-none"
                            placeholder="Description optionnelle..."
                        />
                    </div>

                    {/* Telephone */}
                    <div>
                        <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
                        <input
                            type="tel"
                            value={form.telephone}
                            onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
                            placeholder="Ex: +216 xx xxx xxx"
                        />
                    </div>

                    {/* Responsable */}
                    <div>
                        <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                            Employé responsable <span className="text-gray-400 font-normal">(optionnel)</span>
                        </label>
                        <input
                            type="text"
                            value={form.responsable}
                            onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-600 dark:text-gray-300"
                            placeholder="Nom du responsable..."
                        />
                    </div>

                    {/* File */}
                    <div>
                        <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                            Fichier (PDF, PNG, JPEG)
                        </label>
                        {editing?.fileName && !selectedFile && (
                            <p className="mb-2 text-theme-xs text-gray-400">
                                Fichier actuel : <span className="font-medium text-gray-600 dark:text-gray-300">{editing.fileName}</span>
                            </p>
                        )}
                        <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
                            className="w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-theme-sm text-gray-500 cursor-pointer dark:border-gray-600 dark:bg-gray-800 file:mr-3 file:rounded file:border-0 file:bg-brand-500 file:px-3 file:py-1 file:text-xs file:font-medium file:text-white"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={closeModal} disabled={saving}>Annuler</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Enregistrement...' : (editing ? 'Modifier' : 'Créer')}
                        </Button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                confirmLabel="Supprimer"
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </div>
    );
};

export default ClientsPage;
