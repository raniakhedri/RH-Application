const fs = require('fs');
const file = "c:/Users/yosrk/OneDrive/Bureau/Antigone Rh - Copie (3)/RH-Application/Frontend/src/pages/CalendrierProjetsAdminPage.tsx";
let text = fs.readFileSync(file, 'utf8');

const regex = /const handleManagerDayClick = \(key: string\) => \{\s*if \(!canManagerMode\) return;\s*if \(busyMap\[key\]\) \{ setRemoveTarget\(key\); return; \}\s*setModalDate\(key\); setModalMode\('busy'\); setInputName\(''\); setInputUrgent\(false\);\s*\};/g;

text = text.replace(regex, `const handleManagerDayClick = (key: string) => {
      if (!canManagerMode) return;
      const booked = bookedMap[key];
      if (booked && booked.statut === 'EN_ATTENTE') {
        setValidateTarget(booked);
        return;
      }
      if (busyMap[key]) { setRemoveTarget(key); return; }
      setModalDate(key); setModalMode('busy'); setInputName(''); setInputUrgent(false);
    };`);
fs.writeFileSync(file, text, 'utf8');
