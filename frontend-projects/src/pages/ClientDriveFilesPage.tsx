import React, { useState, useEffect } from 'react';
import { HiOutlineExternalLink, HiOutlineDownload, HiOutlineDocument, HiOutlinePhotograph } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { clientService, DriveFile, MonthFilesGroup } from '../api/clientService';

// ─── Type helpers ────────────────────────────────────────────────────────────

const isImage = (mime: string) => mime.startsWith('image/');
const isVideo = (mime: string) =>
    mime.startsWith('video/') || mime === 'application/vnd.google-apps.video';
const isGoogleDoc = (mime: string) => mime.startsWith('application/vnd.google-apps.');

const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / 1_048_576).toFixed(1)} Mo`;
};

const driveEmbedUrl = (id: string) => `https://drive.google.com/file/d/${id}/preview`;
const driveThumbnail = (id: string) =>
    `https://drive.google.com/thumbnail?id=${id}&sz=w400`;

// ─── File Card ────────────────────────────────────────────────────────────────

const FileCard: React.FC<{ file: DriveFile }> = ({ file }) => {
    const [imgError, setImgError] = useState(false);
    const [videoExpanded, setVideoExpanded] = useState(false);

    const thumbSrc = file.thumbnailLink || driveThumbnail(file.id);

    if (isImage(file.mimeType)) {
        return (
            <a
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-dark shadow-sm hover:shadow-xl transition-all block"
            >
                {!imgError ? (
                    <img
                        src={thumbSrc}
                        alt={file.name}
                        className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="h-44 w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <HiOutlinePhotograph size={40} className="text-gray-300" />
                    </div>
                )}
                <div className="p-3">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
                    {file.subFolder && (
                        <span className="text-[10px] text-gray-400">{file.subFolder}</span>
                    )}
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="rounded-lg bg-white/90 dark:bg-gray-900/90 p-1.5 shadow">
                        <HiOutlineExternalLink size={14} className="text-gray-600 dark:text-gray-300" />
                    </span>
                </div>
            </a>
        );
    }

    if (isVideo(file.mimeType)) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-dark shadow-sm overflow-hidden">
                {videoExpanded ? (
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                            src={driveEmbedUrl(file.id)}
                            className="absolute inset-0 w-full h-full"
                            allow="autoplay"
                            allowFullScreen
                            title={file.name}
                        />
                    </div>
                ) : (
                    <button
                        onClick={() => setVideoExpanded(true)}
                        className="relative h-44 w-full overflow-hidden group"
                    >
                        <img
                            src={thumbSrc}
                            alt={file.name}
                            className="h-full w-full object-cover"
                            onError={() => { }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                            <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                                <svg viewBox="0 0 24 24" className="h-7 w-7 text-gray-800 ml-1" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                        </div>
                    </button>
                )}
                <div className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
                        {file.subFolder && <span className="text-[10px] text-gray-400">{file.subFolder}</span>}
                    </div>
                    <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                    >
                        <HiOutlineExternalLink size={15} />
                    </a>
                </div>
            </div>
        );
    }

    // Generic file (PDF, doc, spreadsheet, etc.)
    const iconColor = isGoogleDoc(file.mimeType) ? 'text-emerald-500' : 'text-brand-500';
    const bgColor = isGoogleDoc(file.mimeType) ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-brand-50 dark:bg-brand-500/10';

    return (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-dark shadow-sm p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
                    <HiOutlineDocument size={22} className={iconColor} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        {file.subFolder && <span className="text-[10px] text-gray-400">{file.subFolder}</span>}
                        {file.size != null && (
                            <span className="text-[10px] text-gray-400">{formatSize(file.size)}</span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-brand-400 hover:text-brand-600 transition-colors"
                >
                    <HiOutlineExternalLink size={13} /> Ouvrir
                </a>
                <a
                    href={`https://drive.google.com/uc?id=${file.id}&export=download`}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 py-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors"
                >
                    <HiOutlineDownload size={13} /> Télécharger
                </a>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const ClientDriveFilesPage: React.FC = () => {
    const { user } = useAuth();
    const clientId = user?.clientId;

    const [months, setMonths] = useState<MonthFilesGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!clientId) return;
        setLoading(true);
        clientService.getDriveFiles(clientId)
            .then(res => {
                const data = (res as any)?.data?.data ?? (res as any)?.data ?? [];
                setMonths(Array.isArray(data) ? data : []);
            })
            .catch(() => setError('Impossible de charger les fichiers Drive.'))
            .finally(() => setLoading(false));
    }, [clientId]);

    if (loading) return (
        <div className="flex items-center justify-center py-40">
            <div className="relative h-14 w-14">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin" />
            </div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center py-32 text-red-500">{error}</div>
    );

    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    Mes Fichiers
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                    {user?.nom} — fichiers organisés par mois depuis votre dossier Google Drive
                </p>
            </div>

            {months.length === 0 ? (
                <div className="py-24 text-center">
                    <p className="text-5xl mb-4 opacity-20">📁</p>
                    <p className="text-gray-400">Aucun fichier trouvé dans votre dossier Drive.</p>
                </div>
            ) : (
                months.map(month => (
                    <section key={month.monthLabel}>
                        {/* Month heading */}
                        <div className="flex items-center gap-3 mb-5">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{month.monthLabel}</h2>
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                            <span className="text-xs text-gray-400 font-medium">
                                {month.files.length} fichier{month.files.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* File grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {month.files.map(file => (
                                <FileCard key={file.id} file={file} />
                            ))}
                        </div>
                    </section>
                ))
            )}
        </div>
    );
};

export default ClientDriveFilesPage;
