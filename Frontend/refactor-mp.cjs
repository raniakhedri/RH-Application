const fs = require('fs');
let code = fs.readFileSync('src/pages/TousLesMediaPlanPage.tsx', 'utf8');

// 1. Add missing imports
if (!code.includes('HiOutlineBriefcase')) {
    code = code.replace(/HiOutlineChevronRight,\n} from 'react-icons\/hi';/g, "HiOutlineChevronRight,\n    HiOutlineBriefcase,\n    HiOutlineArrowLeft,\n} from 'react-icons/hi';");
}

// 2. Replace state definitions
code = code.replace(
    /const \[openBatches, setOpenBatches\] = useState<Set<string>>\(new Set\(\)\);/,
    "const [viewState, setViewState] = useState<'CLIENTS' | 'BATCHES' | 'BATCH_DETAILS'>('CLIENTS');\n    const [selectedBatchKey, setSelectedBatchKey] = useState<string | null>(null);"
);

// 3. Remove toggleBatch
code = code.replace(
    /const toggleBatch = \(key: string\) => \{[\\s\\S]*?\};\n/,
    ""
);

// 4. Overhaul the render return block completely.
// We chop everything after `<div className="space-y-6">` up to `{/* Assign Employee Modal */}`

const startMarker = "<div className=\"space-y-6\">";
const endMarker = "{/* Assign Employee Modal */}";

const topPart = code.split(startMarker)[0];
const bottomPart = code.split(endMarker)[1];

const newRender = `
            {/* ── CLIENTS VIEW ── */}
            {viewState === 'CLIENTS' && (
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tous les Media Plans</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sélectionnez un client pour gérer ses media plans</p>
                    </div>

                    {clients.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                            Aucun client disponible.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {clients.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => { setSelectedClientId(c.id); setViewState('BATCHES'); }}
                                    className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 hover:border-brand-300 hover:shadow-md transition-all dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500/50"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                                            <HiOutlineBriefcase size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{c.nom}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{c.description || 'Projets internes / Non assignés'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700/50">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Gérer les media plans →
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── BATCHES VIEW ── */}
            {viewState === 'BATCHES' && selectedClientId && (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <button
                                onClick={() => setViewState('CLIENTS')}
                                className="mb-4 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            >
                                <HiOutlineArrowLeft size={14} /> Retour aux clients
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {clients.find(c => c.id === selectedClientId)?.nom || 'Client Inconnu'}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Groupes de la ligne de temps</p>
                        </div>
                        <button onClick={openAssignModal}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors">
                            <HiOutlineUserAdd size={18} /> Assigner Employé
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Employés assignés au client</label>
                            <div className="flex flex-wrap gap-2">
                                {existingAssignments.length === 0 ? (
                                    <span className="text-sm text-gray-400 italic">Aucun employé assigné</span>
                                ) : existingAssignments.map(a => (
                                    <span key={a.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 text-xs font-semibold">
                                        {a.employePrenom} {a.employeNom}
                                        <button onClick={() => handleRemoveAssignment(a.id)} className="ml-1 hover:text-red-500 transition-colors" title="Retirer">
                                            <HiOutlineX size={14} />
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

                    {/* Batch Cards Grid */}
                    {batches.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                            Aucun media plan pour ce client
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2">
                            {batches.map(batch => {
                                const batchStatus = getStatusInfo(batch.plans);
                                return (
                                    <div key={batch.key} onClick={() => { setSelectedBatchKey(batch.key); setViewState('BATCH_DETAILS'); }}
                                        className={\`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:shadow-xl dark:hover:border-brand-500/50\`}>
                                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                            <h3 className="line-clamp-2 flex-1 text-base font-semibold leading-snug text-gray-900 dark:text-gray-100">
                                                {getBatchLabel(batch)}
                                            </h3>
                                            <Badge variant={
                                                batchStatus.color === 'green' ? 'success' :
                                                    batchStatus.color === 'red' ? 'danger' :
                                                        batchStatus.color === 'warning' ? 'warning' : 'neutral' as any
                                            }>{batchStatus.label}</Badge>
                                        </div>

                                        <div className="flex-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            {batch.plans.length} ligne(s) dans ce lot.
                                        </div>

                                        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700/50">
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Voir Détails →
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── BATCH DETAILS VIEW ── */}
            {viewState === 'BATCH_DETAILS' && selectedBatchKey && (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <button
                                onClick={() => setViewState('BATCHES')}
                                className="mb-4 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            >
                                <HiOutlineArrowLeft size={14} /> Retour aux groupes
                            </button>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                {getBatchLabel(batches.find(b => b.key === selectedBatchKey)!)}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                        {(() => {
                            const activeBatch = batches.find(b => b.key === selectedBatchKey);
                            if (!activeBatch) return null;
                            const allApproved = activeBatch.plans.every(p => p.statut === 'APPROUVE');
                            const allDisapproved = activeBatch.plans.every(p => p.statut === 'DESAPPROUVE');
                            
                            return (
                                <>
                                    {!allApproved && (
                                        <button onClick={() => handleApproveBatch(activeBatch)}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
                                            <HiOutlineCheck size={16} className="text-green-500" /> Approuver
                                        </button>
                                    )}
                                    {!allDisapproved && (
                                        <button onClick={() => handleDisapproveBatch(activeBatch)}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-medium dark:bg-red-900/10 dark:border-red-900/50 dark:text-red-400 hover:bg-red-100 transition-colors">
                                            <HiOutlineX size={16} /> Désapprouver
                                        </button>
                                    )}
                                </>
                            );
                        })()}
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                        <table className="divide-y divide-gray-200 dark:divide-gray-700" style={{ tableLayout: 'fixed', width: tableWidth }}>
                            {renderTableHeader()}
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {batches.find(b => b.key === selectedBatchKey)?.plans.map(mp => renderRow(mp))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            `;

code = topPart + startMarker + newRender + endMarker + bottomPart;
fs.writeFileSync('src/pages/TousLesMediaPlanPage.tsx', code);
console.log("3-Tier refactor complete.");
