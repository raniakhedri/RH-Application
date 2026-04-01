const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/CalendrierProjetsAdminPage.tsx');
let text = fs.readFileSync(file, 'utf8');

const oldClick = `const handleManagerDayClick = (key: string) => {
      if (!canManagerMode) return;
      if (busyMap[key]) { setRemoveTarget(key); return; }
      setModalDate(key); setModalMode('busy'); setInputName(''); setInputUrgent(false);
    };`;

const newClick = `const handleManagerDayClick = (key: string) => {
      if (!canManagerMode) return;
      const booked = bookedMap[key];
      if (booked && booked.statut === 'EN_ATTENTE') {
        setValidateTarget(booked);
        return;
      }
      if (busyMap[key]) { setRemoveTarget(key); return; }
      setModalDate(key); setModalMode('busy'); setInputName(''); setInputUrgent(false);
    };`;

text = text.replace(oldClick, newClick);

const modalAnchor = "{/* ── Modale Suppression ── */}";
const modalAnchorAlternate = "{/* â”€â”€ Modale Suppression â”€â”€ */}";

const modalHtml = `        {/* Validation Modal */}
        {validateTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <h3 className="text-base font-bold text-gray-900 mb-1">Validation de planification</h3>
              <p className="text-sm text-gray-600 mb-6">
                Le Social Manager a planifié le projet <strong>{validateTarget.projectName}</strong> le <strong>{validateTarget.date}</strong>.<br/>
                Souhaitez-vous le valider ?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const updated = await calendrierProjetService.updateSlotStatus(validateTarget.id!, 'REJETE');
                      setBookedSlots(p => p.map(s => s.id === updated.id ? { ...s, statut: 'REJETE' } : s));
                      showToast('Planification refusée', 'success');
                      setValidateTarget(null);
                    } catch (e) { showToast('Erreur', 'error'); }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50"
                  type="button"
                >
                  Refuser
                </button>
                <button
                  onClick={async () => {
                    try {
                      const updated = await calendrierProjetService.updateSlotStatus(validateTarget.id!, 'VALIDE');
                      setBookedSlots(p => p.map(s => s.id === updated.id ? { ...s, statut: 'VALIDE' } : s));
                      showToast('Planification validée', 'success');
                      setValidateTarget(null);
                    } catch (e) { showToast('Erreur', 'error'); }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                  type="button"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modale Suppression ── */}`;

if (text.includes(modalAnchor)) {
    text = text.replace(modalAnchor, modalHtml);
} else if (text.includes(modalAnchorAlternate)) {
    text = text.replace(modalAnchorAlternate, modalHtml);
}

fs.writeFileSync(file, text, 'utf8');
console.log('Done!');
