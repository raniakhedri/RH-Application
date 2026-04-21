const fs = require('fs');
const file = "c:/Users/yosrk/OneDrive/Bureau/Antigone Rh - Copie (3)/RH-Application/Frontend/src/pages/CalendrierProjetsAdminPage.tsx";
let text = fs.readFileSync(file, 'utf8');

const startSearch = "// ── Vue Manager ──";
const alternateSearch = "// â”€â”€ Vue Manager â”€â”€";

let startIdx = text.indexOf(startSearch);
if (startIdx === -1) startIdx = text.indexOf(alternateSearch);

if (startIdx !== -1) {
    const endSearch = "// ── Vue Social ──";
    const altEndSearch = "// â”€â”€ Vue Social â”€â”€";
    let endIdx = text.indexOf(endSearch, startIdx);
    if (endIdx === -1) endIdx = text.indexOf(altEndSearch, startIdx);

    if (endIdx !== -1) {
        const replacement = `// ── Vue Manager ──
                  if (role==='manager') {
                    const isAttente = booked && booked.statut === 'EN_ATTENTE';
                    const isValide = booked && booked.statut === 'VALIDE';
                    const isClickable = canManagerMode && (!busy || busyMap[key]) && (!booked || isAttente);

                    return (
                      <div
                        key={key}
                        onClick={() => handleManagerDayClick(key)}
                        className={\`min-h-[85px] border-r border-b border-gray-100 p-2 transition-all duration-150 relative group
                          \${isClickable ? 'cursor-pointer' : 'cursor-default'}
                          \${isAttente ? 'bg-yellow-50 hover:bg-yellow-100' :
                             isValide ? 'bg-blue-50' :
                             busy ? 'bg-orange-50 hover:bg-orange-100' : 
                             'bg-white hover:bg-gray-50'}\`}
                      >
                        <span className={\`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold
                          \${isToday ? 'bg-blue-500 text-white' : 
                             isAttente ? 'text-yellow-700' :
                             isValide ? 'text-blue-700' :
                             busy ? 'text-orange-600' : 'text-gray-600'}\`}>
                          {date.getDate()}
                        </span>
                        
                        {/* Display Booked EN_ATTENTE */}
                        {isAttente && (
                          <div className="mt-1.5 space-y-0.5 animate-pulse">
                            <div className="bg-yellow-100 border border-yellow-200 rounded px-1.5 py-0.5">
                              <p className="text-[10px] font-semibold text-yellow-700 truncate leading-tight">{booked.projectName} (À Valider)</p>
                            </div>
                            {booked.urgent && <p className="text-[9px] text-red-500 font-medium pl-0.5">🔴 Urgent</p>}
                          </div>
                        )}

                        {/* Display Booked VALIDE */}
                        {isValide && (
                          <div className="mt-1.5 space-y-0.5">
                            <div className="bg-blue-100 border border-blue-200 rounded px-1.5 py-0.5">
                              <p className="text-[10px] font-semibold text-blue-700 truncate leading-tight">{booked.projectName} (Planifié)</p>
                            </div>
                            {booked.urgent && <p className="text-[9px] text-red-500 font-medium pl-0.5">🔴 Urgent</p>}
                          </div>
                        )}

                        {/* Display Busy */}
                        {busy && !isValide && !isAttente && (
                          <div className="mt-1.5 space-y-0.5">
                            <div className="bg-orange-100 border border-orange-200 rounded px-1.5 py-0.5">
                              <p className="text-[10px] font-semibold text-orange-700 truncate leading-tight">{busy.projectName}</p>
                            </div>
                            {busy.urgent && <p className="text-[9px] text-red-400 font-medium pl-0.5">🔴 Urgent</p>}
                          </div>
                        )}

                        {/* Hover Actions */}
                        {isClickable && !isAttente && !isValide && (
                          <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <span className={\`text-[9px] font-semibold px-1.5 py-0.5 rounded-full
                              \${busy ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}\`}>
                              {busy ? 'Supprimer' : '+ Projet'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  `;

        text = text.substring(0, startIdx) + replacement + text.substring(endIdx);
        fs.writeFileSync(file, text, 'utf8');
        console.log("Replaced successfully!");
    } else {
        console.log("End marker not found.");
    }
} else {
    console.log("Start marker not found.");
}
