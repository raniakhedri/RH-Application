const fs = require('fs');
const pathLib = require('path');
const path = pathLib.join(__dirname, 'src', 'pages', 'ProjetTachesPage.tsx');

let content = fs.readFileSync(path, 'utf8');

if (!content.includes('getMemberInfo')) {
    content = content.replace(
        "const getMemberNom = (id: number | null) => {",
        `const getMemberInfo = (id: number | null) => {
        if (!id) return null;
        return allMembers.find(e => e.id === id) || null;
    };

    const getMemberNom = (id: number | null) => {`
    );
}

const newKanbanBlock = `
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map(colStatut => (
                        <div
                            key={colStatut}
                            onDragOver={e => handleDragOver(e, colStatut)}
                            onDrop={e => handleDrop(e, colStatut as StatutTache)}
                            onDragLeave={handleDragLeave}
                            className={\`flex flex-col gap-4 rounded-xl border-2 transition-colors min-h-[60vh] \${dragOverCol === colStatut ? 'border-brand-500/50 bg-[#161922]' : 'border-transparent bg-transparent'}\`}
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-bold tracking-wider text-gray-800 dark:text-gray-100 uppercase">
                                        {colStatut === 'TODO' ? 'To Do' : colStatut === 'IN_PROGRESS' ? 'In Progress' : 'Done'}
                                    </h3>
                                    <span className={\`flex h-5 items-center justify-center rounded px-2 text-[11px] font-bold \${
                                        colStatut === 'TODO' ? 'bg-gray-200 text-gray-500 dark:bg-[#292e3c] dark:text-gray-400' :
                                        colStatut === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-600 dark:bg-[#362b24] dark:text-[#eeb374]' :
                                        'bg-success-100 text-success-600 dark:bg-[#193231] dark:text-[#42b998]'
                                    }\`}>
                                        {grouped[colStatut].length}
                                    </span>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                    <svg width="16" height="4" viewBox="0 0 16 4" fill="currentColor">
                                      <circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/><circle cx="14" cy="2" r="1.5"/>
                                    </svg>
                                </button>
                            </div>

                            {/* Task List */}
                            <div className="flex flex-col gap-3 flex-1">
                                {grouped[colStatut].map(tache => {
                                    const assignee = getMemberInfo(tache.assigneeId);
                                    let driveTag = '';
                                    if ((tache as any).typeDrive) {
                                        driveTag = ((tache as any).typeDrive as string).split(',')[0].toUpperCase();
                                    }
                                    
                                    return (
                                        <div
                                            key={tache.id}
                                            draggable
                                            onDragStart={e => handleDragStart(e, tache.id)}
                                            onClick={() => setViewingTache(tache)}
                                            className="group relative cursor-grab active:cursor-grabbing flex flex-col rounded-2xl bg-white dark:bg-[#1d212b] p-4 shadow-sm border border-gray-200 dark:border-[#2c3241] hover:border-gray-300 dark:hover:border-[#41485c] transition-all"
                                        >
                                            {/* Top Row: Tag & Date/Status */}
                                            <div className="flex items-center justify-between mb-4">
                                                {/* Left Tag */}
                                                {driveTag ? (
                                                    <span className="rounded bg-gray-100 text-gray-500 dark:bg-[#2e3445] dark:text-gray-300 px-2.5 py-1 text-[9px] font-bold tracking-wide">
                                                        {driveTag}
                                                    </span>
                                                ) : (
                                                    <div /> // Spacing
                                                )}

                                                {/* Right Status/Date */}
                                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                                    {colStatut === 'DONE' ? (
                                                        <span className="flex items-center gap-1 text-success-600 dark:text-[#42b998]"><svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> Complete</span>
                                                    ) : colStatut === 'IN_PROGRESS' ? (
                                                        <span className="flex items-center gap-1 text-orange-500 dark:text-[#eeb374]"><svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg> In Progress</span>
                                                    ) : tache.dateEcheance ? (
                                                        <span className="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg> {tache.dateEcheance}</span>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <h4 className="mb-6 text-[15px] font-semibold leading-snug text-gray-900 dark:text-white pr-2">
                                                {tache.titre}
                                            </h4>

                                            {/* Bottom Row: Assignee & Priority */}
                                            <div className="mt-auto flex items-end justify-between px-0.5">
                                                {/* Left: Assignee Avatar */}
                                                <div className="flex -space-x-2">
                                                    {assignee ? (
                                                        <div className="relative h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#1d212b] overflow-hidden bg-gray-200 dark:bg-gray-600">
                                                            {assignee.imageUrl ? (
                                                                <img src={assignee.imageUrl} alt={assignee.nom} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center bg-brand-500 text-[9px] font-bold text-white">
                                                                    {assignee.prenom?.[0]}{assignee.nom?.[0]}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="relative flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white dark:ring-[#1d212b] bg-gray-200 text-gray-500 dark:bg-gray-700 text-[10px] font-medium dark:text-gray-300">
                                                            ?
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right: Priority */}
                                                <div className="flex items-center gap-1">
                                                    {tache.urgente ? (
                                                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-error-500 dark:text-[#f76a6a]">
                                                            <span className="text-base leading-none translate-y-[-1px]">!</span> High
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 dark:text-gray-500">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M4 19V10h4v9H4zm6 0V5h4v14h-4zm6 0v-6h4v6h-4z"/></svg> Low
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Hidden edit/delete actions that appear on hover */}
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={e => { e.stopPropagation(); openEdit(tache); }}
                                                    className="rounded p-1.5 bg-gray-100 text-gray-500 hover:text-brand-600 dark:bg-[#2c3241] dark:text-gray-300 dark:hover:text-white"
                                                    title="Modifier"
                                                >
                                                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleDelete(tache.id); }}
                                                    className="rounded p-1.5 bg-error-50 text-error-400 hover:text-error-600 dark:bg-[#2c3241] dark:hover:text-error-300"
                                                    title="Supprimer"
                                                >
                                                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Add New Task button specifically at the bottom of TO DO column */}
                                {colStatut === 'TODO' && (
                                    <button 
                                        onClick={() => setShowCreate(true)}
                                        className="mt-2 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-brand-400 hover:text-brand-500 dark:border-[#2c3241] bg-transparent py-4 dark:text-[#d48a47] dark:hover:border-[#d48a47] transition-colors"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mb-1">
                                            <path d="M12 5v14M5 12h14"/>
                                        </svg>
                                        <span className="text-[11px] font-bold tracking-wider">NEW TASK</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>`;

const oldKanbanStart = '<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">';
const oldKanbanContent = content.substring(content.indexOf(oldKanbanStart));
const showCreateModalIndex = oldKanbanContent.indexOf('{/* ── Create Modal ─────────────────────────────────────── */}');

if (content.indexOf(oldKanbanStart) !== -1 && showCreateModalIndex !== -1) {
    const kanbanReplaced = content.substring(0, content.indexOf(oldKanbanStart)) + newKanbanBlock + '\\n\\n            ' + oldKanbanContent.substring(showCreateModalIndex);
    fs.writeFileSync(path, kanbanReplaced);
    console.log('Successfully replaced Kanban structure.');
} else {
    console.error('Could not find injection boundaries.');
}
