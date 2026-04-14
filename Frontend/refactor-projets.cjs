const fs = require('fs');
const path = 'c:/Users/alaou/OneDrive/Documents/test-merge-ala-antigonerh/RH-Application/Frontend/src/pages/ProjetsPage.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Update Imports
if (!content.includes('HiOutlineArrowLeft')) {
    content = content.replace(
        "import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineClipboardList, HiOutlineDocumentText, HiOutlineDownload, HiOutlineChevronDown } from 'react-icons/hi';",
        "import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineClipboardList, HiOutlineDocumentText, HiOutlineDownload, HiOutlineChevronDown, HiOutlineArrowLeft, HiOutlineBriefcase, HiOutlineUserGroup, HiOutlineCalendar } from 'react-icons/hi';"
    );
}

// 2. Replace Accordion state with View state
content = content.replace(
    "// Accordion open states – key = clientId or 'none'\n  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());",
    `type ViewState = 'CLIENTS' | 'PROJECTS' | 'PROJECT_DETAILS';
  const [viewState, setViewState] = useState<ViewState>('CLIENTS');
  const [selectedClientKey, setSelectedClientKey] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Projet | null>(null);`
);

// 3. Remove toggleAccordion function
content = content.replace(/\/\* ── Toggle accordion ──[\s\S]+?\}\;\n\n/m, '');

// 4. Construct the new View Renders
const newRenderContent = `
      {/* ── CLIENTS VIEW ── */}
      {viewState === 'CLIENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedEntries.map(([key, { client, projects }]) => (
            <div 
              key={key} 
              onClick={() => { setSelectedClientKey(key); setViewState('PROJECTS'); }}
              className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 hover:border-brand-300 hover:shadow-md transition-all dark:border-gray-700 dark:bg-gray-dark dark:hover:border-brand-500/50"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    <HiOutlineBriefcase size={20} />
                  </div>
                  <div>
                    <h3 className="text-theme-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {client ? client.nom : 'Sans Client'}
                    </h3>
                    <p className="text-theme-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                      {client?.description || 'Projets internes / Non assignés'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700/50">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  {projects.length} projet{projects.length !== 1 ? 's' : ''}
                </span>
                <span className="text-theme-xs font-medium text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity dark:text-brand-400">
                  Voir les projets →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PROJECTS VIEW ── */}
      {viewState === 'PROJECTS' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewState('CLIENTS')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <HiOutlineArrowLeft size={16} />
            </button>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              {getClientForKey(selectedClientKey || 'none')?.nom || 'Sans Client'}
            </h2>
            {canManageAllProjets && (
              <Button 
                onClick={() => openCreateModal(selectedClientKey || 'none')}
                variant="primary" 
                className="col-span-full ml-auto"
              >
                <HiOutlinePlus size={16} className="mr-1" />
                Nouveau Projet
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(groupedByClient.get(selectedClientKey || 'none')?.projects || []).map(p => {
              const chefs = getChefs(p);
              return (
                <div 
                  key={p.id}
                  onClick={() => { setSelectedProject(p); setViewState('PROJECT_DETAILS'); }}
                  className="cursor-pointer border border-gray-200 bg-white rounded-2xl p-5 hover:border-brand-300 hover:shadow-md transition-all flex flex-col h-full dark:border-gray-700 dark:bg-gray-dark dark:hover:border-brand-500/50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-theme-sm font-semibold text-gray-900 dark:text-white line-clamp-2 pr-2 leading-tight flex-1">
                      {p.nom}
                    </h3>
                    <Badge text={p.statut} variant={statutBadgeMap[p.statut] || 'neutral'} />
                  </div>
                  
                  {p.typeProjet === 'INDETERMINE' && (
                    <span className="inline-block mb-3 px-2 py-0.5 rounded-full bg-purple-50 text-[10px] font-semibold text-purple-600 w-max dark:bg-purple-500/10 dark:text-purple-400">
                      Indéterminé
                    </span>
                  )}
                  
                  <div className="flex-1 space-y-3 mt-1">
                    <div className="flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
                      <HiOutlineCalendar size={14} className="opacity-70" />
                      <span>{formatDate(p.dateDebut)} — {p.dateFin ? formatDate(p.dateFin) : '∞'}</span>
                    </div>
                    
                    <div className="pt-2">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">Managers</p>
                      {chefs.length === 0 ? <span className="text-theme-xs text-gray-400">-</span> : (
                        <div className="flex flex-wrap gap-1">
                          {chefs.map(c => (
                            <span key={c.id} className="flex items-center gap-1 rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-medium text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
                              {c.prenom} {c.nom}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center text-theme-xs">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <HiOutlineUserGroup size={14} />
                      <span>{(p.membres || []).length} membre(s)</span>
                    </div>
                    <span className="font-medium text-brand-600 dark:text-brand-400">
                      Détails →
                    </span>
                  </div>
                </div>
              );
            })}
            
            {(groupedByClient.get(selectedClientKey || 'none')?.projects || []).length === 0 && (
              <div className="col-span-full py-12 text-center text-theme-sm text-gray-500 border border-dashed border-gray-200 rounded-2xl dark:border-gray-700">
                Aucun projet pour ce client.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PROJECT DETAILS VIEW ── */}
      {viewState === 'PROJECT_DETAILS' && selectedProject && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewState('PROJECTS')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <HiOutlineArrowLeft size={16} />
            </button>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Détails du Projet
            </h2>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-dark">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedProject.nom}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge text={selectedProject.statut} variant={statutBadgeMap[selectedProject.statut] || 'neutral'} />
                  {selectedProject.typeProjet === 'INDETERMINE' && (
                    <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                      Projet Indéterminé
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-theme-sm text-gray-500 dark:text-gray-400">
                    <HiOutlineCalendar size={16} />
                    {formatDate(selectedProject.dateDebut)} au {selectedProject.dateFin ? formatDate(selectedProject.dateFin) : 'Non défini'}
                  </span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-wrap gap-2">
                {(canManageAllProjets || canViewProjetsCreateTaches) && selectedProject.statut === 'PLANIFIE' && (
                  <Button onClick={() => {
                    handleChangeStatut(selectedProject.id, StatutProjet.EN_COURS);
                    setSelectedProject({...selectedProject, statut: StatutProjet.EN_COURS});
                  }} variant="primary" className="bg-success-600 hover:bg-success-700 !border-success-600 text-white">
                     Démarrer
                  </Button>
                )}
                {(canManageAllProjets || canViewProjetsCreateTaches) && selectedProject.statut === 'EN_COURS' && (
                  <Button onClick={() => {
                    handleChangeStatut(selectedProject.id, StatutProjet.CLOTURE);
                    setSelectedProject({...selectedProject, statut: StatutProjet.CLOTURE});
                  }} variant="outline" className="text-success-600 !border-success-200 hover:bg-success-50">
                    Clôturer
                  </Button>
                )}
                {(canManageAllProjets || canViewProjetsCreateTaches) && (
                  <Button onClick={() => navigate(\`/projets/\${selectedProject.id}/taches\`)} variant="outline">
                    <HiOutlineClipboardList size={16} className="mr-1.5" /> Tâches
                  </Button>
                )}
                {(canManageAllProjets || canViewProjetsCreateTaches) && ((selectedProject.chefsDeProjet && selectedProject.chefsDeProjet.some(c => c.id === user?.employeId)) || selectedProject.chefDeProjet?.id === user?.employeId) && (
                  <Button onClick={() => handleAffectMembers(selectedProject)} variant="outline">
                    <HiOutlineUserGroup size={16} className="mr-1.5" /> Affecter
                  </Button>
                )}
                {canManageAllProjets && (
                  <Button onClick={() => handleEdit(selectedProject)} variant="outline" className="text-brand-600 border-brand-200 hover:bg-brand-50">
                    <HiOutlinePencil size={16} className="mr-1.5" /> Modifier
                  </Button>
                )}
                {canManageAllProjets && (
                  <Button onClick={() => handleDelete(selectedProject.id)} variant="outline" className="text-error-600 !border-error-200 hover:bg-error-50">
                    <HiOutlineTrash size={16} className="mr-1.5" /> Supprimer
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Managers */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                <h4 className="text-theme-sm font-semibold text-gray-700 mb-3 dark:text-gray-300 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-warning-100 text-warning-600">👑</span>
                  Department Managers
                </h4>
                <div className="space-y-2">
                  {getChefs(selectedProject).length === 0 ? (
                    <p className="text-theme-sm text-gray-400 italic">Aucun manager</p>
                  ) : (
                    getChefs(selectedProject).map(m => (
                      <div key={m.id} className="flex items-center gap-3 rounded-lg bg-white p-2 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning-100 text-xs font-bold text-warning-700">
                          {m.prenom?.[0]}{m.nom?.[0]}
                        </div>
                        <div>
                          <p className="text-theme-sm font-medium text-gray-800 dark:text-gray-200">{m.prenom} {m.nom}</p>
                          {congeAujourdhuiIds.has(m.id) && <p className="text-[10px] text-gray-500">🏖️ En congé aujourd'hui</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Members */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                <h4 className="text-theme-sm font-semibold text-gray-700 mb-3 dark:text-gray-300 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary-100 text-secondary-600"><HiOutlineUserGroup /></span>
                  Membres du projet
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {!(selectedProject.membres ?? []).length ? (
                    <p className="text-theme-sm text-gray-400 italic">Aucun membre assigné</p>
                  ) : (
                    (selectedProject.membres ?? []).map(m => (
                      <div key={m.id} className="flex items-center gap-3 rounded-lg bg-white p-2 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100 text-xs font-bold text-secondary-700">
                          {m.prenom?.[0]}{m.nom?.[0]}
                        </div>
                        <div>
                          <p className="text-theme-sm font-medium text-gray-800 dark:text-gray-200">{m.prenom} {m.nom}</p>
                          <p className="text-theme-xs text-gray-500">{m.departement || '-'}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
`;

// Find where to splice the new render content
const startIndex = content.indexOf('{/* ── Client accordions ── */}');
const endIndex = content.indexOf('      {/* ══════════════════════════════════════════════════════════════════════');

if (startIndex !== -1 && endIndex !== -1) {
    const newContent = content.substring(0, startIndex) + newRenderContent.trim() + '\\n\\n      ' + content.substring(endIndex);
    fs.writeFileSync(path, newContent);
    console.log('Successfully updated ProjetsPage.tsx');
} else {
    console.error('Could not find injection boundaries.');
}
