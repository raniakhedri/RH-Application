const fs = require('fs');
const path = 'c:/Users/alaou/OneDrive/Documents/test-merge-ala-antigonerh/RH-Application/frontend/src/pages/MesTachesPage.tsx';

let code = fs.readFileSync(path, 'utf8');

// 1. Add imports
code = code.replace(/HiDotsHorizontal( } from 'react-icons\/hi';)/g, "HiDotsHorizontal, HiOutlineBriefcase, HiOutlineArrowLeft$1");

// 2. Add properties to ProjectGroup and define ClientGroup
code = code.replace(/projetId: number;\n    projetNom: string;/, "projetId: number;\n    projetNom: string;\n    clientId: number | null;\n    clientNom: string | null;");
if (!code.includes('interface ClientGroup')) {
    code = code.replace(/const statutBadgeMap:/, "interface ClientGroup {\n    clientId: number | null;\n    clientNom: string;\n    projects: ProjectGroup[];\n}\n\nconst statutBadgeMap:");
}

// 3. Add state hook
if (!code.includes('selectedClientId')) {
    code = code.replace(/const \[selectedProject, setSelectedProject\] = useState<ProjectGroup \| null>\(null\);/,
        "const [selectedProject, setSelectedProject] = useState<ProjectGroup | null>(null);\n    const [selectedClientId, setSelectedClientId] = useState<number | null | undefined>(undefined);");
}

// 4. Inject clientId / clientNom into projectGroups creation
code = code.replace(/projetId: t\.projetId,\n(\s*)projetNom: t\.projetNom \|\| 'Projet sans nom',/,
    "projetId: t.projetId,\n$1projetNom: t.projetNom || 'Projet sans nom',\n$1clientId: fullProjet?.clientId || null,\n$1clientNom: fullProjet?.clientNom || 'Projets Internes',");

// 5. Add clientGroups hook
if (!code.includes('clientGroups: ClientGroup[]')) {
    code = code.replace(/const handleChangeStatut = async /,
        `const clientGroups: ClientGroup[] = React.useMemo(() => {
        const cMap = new Map<number | null, ClientGroup>();
        for (const pg of projectGroups) {
            const cid = pg.clientId;
            if (!cMap.has(cid)) {
                cMap.set(cid, {
                    clientId: cid,
                    clientNom: pg.clientNom || 'Projets Internes',
                    projects: [],
                });
            }
            cMap.get(cid)!.projects.push(pg);
        }
        return Array.from(cMap.values());
    }, [projectGroups]);

    const handleChangeStatut = async `);
}

// 6. Rewrite UI section
const startBreadcrumb = "{/* Breadcrumb */}";
const startMembres = "{/* Level 2 — Membres du projet */}";

const split1 = code.split(startBreadcrumb);
const split2 = split1[1].split(startMembres);

const oldMiddle = startBreadcrumb + split2[0];

// The new breadcrumb + client cards + project cards
const newMiddle = `{/* Breadcrumb */}
                        {selectedClientId !== undefined && (
                            <nav className="flex items-center gap-1.5 text-theme-xs">
                                <button
                                    onClick={() => { setSelectedClientId(undefined); setSelectedProject(null); }}
                                    className="text-brand-500 hover:underline"
                                >
                                    Clients
                                </button>
                                {selectedClientId !== undefined && (
                                    <>
                                        <HiOutlineChevronRight size={12} className="text-gray-300" />
                                        <button onClick={() => setSelectedProject(null)} className="font-semibold text-gray-700 dark:text-gray-200 hover:underline">
                                            {selectedClientId === null ? 'Projets Internes' : clientGroups.find(c => c.clientId === selectedClientId)?.clientNom}
                                        </button>
                                    </>
                                )}
                                {selectedProject && (
                                    <>
                                        <HiOutlineChevronRight size={12} className="text-gray-300" />
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                                            {selectedProject.projetNom}
                                        </span>
                                    </>
                                )}
                            </nav>
                        )}
                    </div>

                    {/* Level 1 — Client cards */}
                    {selectedClientId === undefined && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {clientGroups.map(cg => (
                                <button
                                    key={cg.clientId ?? 'interne'}
                                    onClick={() => setSelectedClientId(cg.clientId)}
                                    className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-dark"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
                                            <HiOutlineBriefcase size={22} />
                                        </div>
                                        <HiOutlineChevronRight size={16} className="mt-1 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-400" />
                                    </div>
                                    <p className="mt-3 text-theme-sm font-semibold text-gray-800 dark:text-white">{cg.clientNom}</p>
                                    <div className="mt-3 flex gap-2">
                                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-theme-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                            {cg.projects.length} projet{cg.projects.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Level 2 — Project cards for selected client */}
                    {selectedClientId !== undefined && !selectedProject && (() => {
                        const clientProjects = clientGroups.find(c => c.clientId === selectedClientId)?.projects || [];
                        return (
                            <div className="space-y-4">
                                <button
                                    onClick={() => setSelectedClientId(undefined)}
                                    className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                >
                                    <HiOutlineArrowLeft size={14} /> Retour aux clients
                                </button>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {clientProjects.map(pg => (
                                        <button
                                            key={pg.projetId}
                                            onClick={() => setSelectedProject(pg)}
                                            className="group rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-dark"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
                                                    <HiOutlineFolder size={22} />
                                                </div>
                                                <HiOutlineChevronRight size={16} className="mt-1 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-400" />
                                            </div>
                                            <p className="mt-3 text-theme-sm font-semibold text-gray-800 dark:text-white">{pg.projetNom}</p>
                                            {pg.projetStatut && (
                                                <span className={\`mt-1 inline-block rounded-full px-2 py-0.5 text-theme-xs font-medium \${pg.projetStatut === 'EN_COURS' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10' :
                                                    pg.projetStatut === 'CLOTURE' ? 'bg-success-50 text-success-600 dark:bg-success-500/10' :
                                                        pg.projetStatut === 'ANNULE' ? 'bg-error-50 text-error-600 dark:bg-error-500/10' :
                                                            'bg-gray-100 text-gray-600 dark:bg-gray-700'
                                                    }\`}>
                                                    {pg.projetStatut}
                                                </span>
                                            )}
                                            {pg.chefDeProjetNom && (
                                                <p className="mt-0.5 text-theme-xs text-gray-500 flex items-center gap-2">
                                                    Chef : {pg.chefDeProjetNom}
                                                    {congeAujourdhuiNoms.has(pg.chefDeProjetNom) && (
                                                        <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-semibold text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
                                                            En congé
                                                        </span>
                                                    )}
                                                </p>
                                            )}
                                            {pg.projetDateFin && <p className="text-theme-xs text-warning-500">Fin : {pg.projetDateFin}</p>}
                                            <div className="mt-3 flex gap-2">
                                                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-theme-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                    {pg.tacheCount} tâche{pg.tacheCount > 1 ? 's' : ''}
                                                </span>
                                                <span className="rounded-full bg-secondary-50 px-2.5 py-0.5 text-theme-xs font-medium text-secondary-600 dark:bg-secondary-500/10 dark:text-secondary-400">
                                                    {pg.membres.length} membre{pg.membres.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    `;

code = code.replace(oldMiddle, newMiddle);

fs.writeFileSync(path, code, 'utf8');
