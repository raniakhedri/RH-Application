const fs = require('fs');
const path = 'c:/Users/alaou/OneDrive/Documents/test-merge-ala-antigonerh/RH-Application/frontend/src/pages/ProjetsPage.tsx';

let content = fs.readFileSync(path, 'utf8');

// The new components string
const newViews = `
      {/* ── PROJECTS VIEW ── */}
      {viewState === 'PROJECTS' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <button 
                onClick={() => setViewState('CLIENTS')}
                className="mb-4 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#f29f44] transition-colors hover:text-[#d98b36]"
              >
                <HiOutlineArrowLeft size={14} />
                Retour aux clients
              </button>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                {getClientForKey(selectedClientKey || 'none')?.nom || 'Sans Client'} 
                <span className="font-normal text-gray-400 dark:text-gray-500"> / Projets</span>
              </h1>
              <p className="mt-1.5 text-[13px] text-gray-500 dark:text-gray-400">
                {(groupedByClient.get(selectedClientKey || 'none')?.projects || []).length} projets actifs pour ce client.
              </p>
            </div>
            
            {canManageAllProjets && (
              <button
                onClick={() => openCreateModal(selectedClientKey || 'none')}
                className="flex h-11 items-center gap-2 rounded-xl bg-[#f29f44] px-5 text-[13px] font-bold text-black shadow-lg shadow-orange-500/20 transition-all hover:bg-[#e0892f] hover:shadow-orange-500/30"
              >
                <HiOutlinePlus size={16} /> Nouveau Projet
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {(groupedByClient.get(selectedClientKey || 'none')?.projects || []).map(p => {
              const chefs = getChefs(p);
              
              let statusBadgeClass = 'bg-[#292c35] text-gray-300 border-[#3e424e]';
              if (p.statut === 'EN_COURS') statusBadgeClass = 'bg-[#1b3d3e] text-[#4dbfa2] border-[#2b5956]';
              else if (p.statut === 'CLOTURE') statusBadgeClass = 'bg-[#1b3e24] text-[#4dbf6a] border-[#2b5936]';
              else if (p.statut === 'ANNULE') statusBadgeClass = 'bg-[#3e1b1b] text-[#bf4d4d] border-[#592b2b]';

              return (
                <div 
                  key={p.id}
                  onClick={() => { setSelectedProject(p); setViewState('PROJECT_DETAILS'); }}
                  className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 dark:border-[#272a35] dark:bg-[#1a1c22] dark:shadow-xl dark:shadow-black/20 dark:hover:border-[#3a3e4d]"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 flex-1 text-[17px] font-bold leading-snug text-gray-900 dark:text-gray-100">
                      {p.nom}
                    </h3>
                    <span className={\`shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide \${statusBadgeClass}\`}>
                      {p.statut.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="mb-6 flex items-center gap-2 text-[12px] font-medium text-gray-500 dark:text-gray-400">
                    <HiOutlineCalendar size={15} className="text-gray-400 dark:text-gray-500" />
                    <span>{formatDate(p.dateDebut)} — {p.dateFin ? formatDate(p.dateFin) : 'Indéterminé'}</span>
                  </div>
                  
                  <div className="flex-1">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      Managers
                    </p>
                    {chefs.length === 0 ? (
                      <span className="text-[12px] font-medium text-gray-400 dark:text-gray-600">-</span>
                    ) : (
                      <div className="flex -space-x-2">
                        {chefs.slice(0, 3).map((c, i) => (
                          <div key={c.id} className="relative h-7 w-7 overflow-hidden rounded-full ring-2 ring-white dark:ring-[#1a1c22]">
                            {congeAujourdhuiIds.has(c.id) && (
                              <div className="absolute right-0 top-0 h-2 w-2 rounded-full border border-[#1a1c22] bg-orange-500 z-10" title="En congé"></div>
                            )}
                            {c.imageUrl ? (
                              <img src={c.imageUrl} alt={c.nom} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-[#2c303c] text-[9px] font-bold text-gray-700 dark:text-gray-300">
                                {c.prenom?.[0]}{c.nom?.[0]}
                              </div>
                            )}
                          </div>
                        ))}
                        {chefs.length > 3 && (
                          <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 ring-2 ring-white dark:bg-[#292c35] dark:text-gray-300 dark:ring-[#1a1c22] text-[10px] font-bold">
                            +{chefs.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-white/5">
                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-500">
                      {(p.membres || []).length} membres actifs
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-gray-400 transition-colors group-hover:text-[#f29f44] dark:text-gray-500">
                      Détails <span className="text-lg leading-none translate-y-[-1px]">→</span>
                    </span>
                  </div>
                </div>
              );
            })}
            
            {/* Nouveau Projet Card */}
            {canManageAllProjets && (
              <div 
                onClick={() => openCreateModal(selectedClientKey || 'none')}
                className="group flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed border-gray-200 bg-transparent transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-[#272a35] dark:hover:border-[#3a3e4d] dark:hover:bg-white/5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors group-hover:bg-gray-200 group-hover:text-gray-600 dark:bg-[#1f222b] dark:text-gray-500 dark:group-hover:bg-[#2a2e3a] dark:group-hover:text-gray-300">
                  <HiOutlinePlus size={20} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-bold text-gray-900 dark:text-gray-200">Nouveau Projet</p>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">Lancer une nouvelle initiative pour ce client</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PROJECT DETAILS VIEW ── */}
      {viewState === 'PROJECT_DETAILS' && selectedProject && (
        <div className="space-y-6 lg:space-y-8">
          {/* Top Header Back Button */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewState('PROJECTS')}
              className="flex items-center gap-2 text-[14px] font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <HiOutlineArrowLeft size={18} />
              Détails du Projet
            </button>
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            {/* Info Block (Left) */}
            <div className="max-w-2xl">
              <h1 className="mb-4 text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                {selectedProject.nom}
              </h1>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gray-600 dark:bg-[#252834] dark:text-[#a0a8c2]">
                  {selectedProject.statut.replace('_', ' ')}
                </span>
                {selectedProject.typeProjet === 'INDETERMINE' && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gray-600 dark:bg-[#252834] dark:text-[#a0a8c2]">
                    Projet Indéterminé
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500 dark:text-gray-400">
                <HiOutlineCalendar size={16} />
                <span>{formatDate(selectedProject.dateDebut)} au {selectedProject.dateFin ? formatDate(selectedProject.dateFin) : 'Non défini'}</span>
              </div>
            </div>

            {/* Actions Block (Right) */}
            <div className="flex shrink-0 flex-wrap gap-3">
              {(canManageAllProjets || canViewProjetsCreateTaches) && selectedProject.statut === 'PLANIFIE' && (
                <button 
                  onClick={() => {
                    handleChangeStatut(selectedProject.id, StatutProjet.EN_COURS);
                    setSelectedProject({...selectedProject, statut: StatutProjet.EN_COURS});
                  }} 
                  className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0ed96f] px-5 text-[13px] font-bold text-[#10301a] shadow-lg shadow-green-500/20 transition-colors hover:bg-[#0bc061]"
                >
                  Démarrer
                </button>
              )}
              {(canManageAllProjets || canViewProjetsCreateTaches) && selectedProject.statut === 'EN_COURS' && (
                <button 
                  onClick={() => {
                    handleChangeStatut(selectedProject.id, StatutProjet.CLOTURE);
                    setSelectedProject({...selectedProject, statut: StatutProjet.CLOTURE});
                  }} 
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#333745] bg-[#242731] px-4 text-[13px] font-medium text-gray-200 transition-colors hover:bg-[#2d313c]"
                >
                  Clôturer
                </button>
              )}
              {(canManageAllProjets || canViewProjetsCreateTaches) && (
                <button 
                  onClick={() => navigate(\`/projets/\${selectedProject.id}/taches\`)} 
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#333745] bg-[#242731] px-4 text-[13px] font-medium text-gray-200 transition-colors hover:bg-[#2d313c]"
                >
                  <HiOutlineClipboardList size={16} /> Tâches
                </button>
              )}
              {(canManageAllProjets || canViewProjetsCreateTaches) && ((selectedProject.chefsDeProjet && selectedProject.chefsDeProjet.some(c => c.id === user?.employeId)) || selectedProject.chefDeProjet?.id === user?.employeId) && (
                <button 
                  onClick={() => handleAffectMembers(selectedProject)} 
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#333745] bg-[#242731] px-4 text-[13px] font-medium text-gray-200 transition-colors hover:bg-[#2d313c]"
                >
                  <HiOutlineUserGroup size={16} /> Affecter
                </button>
              )}
              {canManageAllProjets && (
                <button 
                  onClick={() => handleEdit(selectedProject)} 
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#333745] bg-[#242731] px-4 text-[13px] font-medium text-gray-200 transition-colors hover:bg-[#2d313c]"
                >
                  <HiOutlinePencil size={16} /> Modifier
                </button>
              )}
              {canManageAllProjets && (
                <button 
                  onClick={() => handleDelete(selectedProject.id)} 
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#4a2e30] bg-[#2d1b1c] px-4 text-[13px] font-medium text-[#e06c75] transition-colors hover:bg-[#3d2425]"
                >
                  <HiOutlineTrash size={16} /> Supprimer
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Managers Panel */}
            <div>
              <h4 className="mb-4 flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest text-gray-800 dark:text-gray-100">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-[#f29f44]">&starf;</span>
                Department Managers
              </h4>
              <div className="rounded-[20px] border border-gray-100 bg-gray-50/50 p-6 dark:border-[#1e212b] dark:bg-[#14161d] min-h-[160px]">
                <div className="flex flex-col gap-3">
                  {getChefs(selectedProject).length === 0 ? (
                    <p className="py-4 text-center text-[13px] font-medium italic text-gray-400 dark:text-[#4d5265]">Aucun manager assigné</p>
                  ) : (
                    getChefs(selectedProject).map(m => (
                      <div key={m.id} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-[#262a36] dark:bg-[#1a1c23]">
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-[14px] font-bold text-brand-600 dark:bg-[#eb9d47] dark:text-white">
                          {congeAujourdhuiIds.has(m.id) && (
                            <div className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-error-500 dark:border-[#1a1c23] z-10" title="En congé"></div>
                          )}
                          {m.imageUrl ? (
                            <img src={m.imageUrl} alt={m.nom} className="h-full w-full object-cover" />
                          ) : (
                            <span>{m.prenom?.[0]}{m.nom?.[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-gray-900 dark:text-white">{m.prenom} {m.nom}</p>
                          <p className="text-[12px] font-medium text-gray-500 dark:text-[#8b93a8]">Manager</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Members Panel */}
            <div>
              <h4 className="mb-4 flex items-center gap-2 text-[13px] font-bold uppercase tracking-widest text-gray-800 dark:text-gray-100">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-[#f29f44]"><HiOutlineUserGroup size={12}/></span>
                Membres du projet
              </h4>
              <div className="rounded-[20px] border border-gray-100 bg-gray-50/50 p-6 dark:border-[#1e212b] dark:bg-[#14161d] min-h-[160px]">
                <div className="flex flex-col gap-3">
                  {!(selectedProject.membres ?? []).length ? (
                    <p className="flex h-[80px] items-center justify-center text-[13px] font-medium italic text-gray-400 dark:text-[#4d5265]">Aucun membre assigné</p>
                  ) : (
                    (selectedProject.membres ?? []).map(m => (
                      <div key={m.id} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-[#262a36] dark:bg-[#1a1c23]">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-[14px] font-bold text-gray-600 dark:bg-[#2c303c] dark:text-[#a5acbe]">
                          {m.imageUrl ? (
                            <img src={m.imageUrl} alt={m.nom} className="h-full w-full object-cover" />
                          ) : (
                            <span>{m.prenom?.[0]}{m.nom?.[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-gray-900 dark:text-white">{m.prenom} {m.nom}</p>
                          <p className="text-[12px] font-medium text-gray-500 dark:text-[#8b93a8]">{m.departement || 'Membre'}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}`;

const startIndex = content.indexOf('{/* ── PROJECTS VIEW ── */}');
const endIndex = content.indexOf('{/* ══════════════════════════════════════════════════════════════════════');

if (startIndex !== -1 && endIndex !== -1) {
    const updated = content.substring(0, startIndex) + newViews.substring(6) + '\\n\\n      ' + content.substring(endIndex);
    fs.writeFileSync(path, updated);
    console.log('Successfully updated ProjetsPage details layout.');
} else {
    console.error('Could not find bounds to inject the new components.');
}
