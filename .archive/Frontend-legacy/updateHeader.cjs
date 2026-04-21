const fs = require('fs');
const file = "c:/Users/yosrk/OneDrive/Bureau/Antigone Rh - Copie (3)/RH-Application/Frontend/src/components/layout/Header.tsx";
let text = fs.readFileSync(file, 'utf8');

const oldStr = `      if (notif.demandeId) {
        navigate('/mes-demandes');`;

const newStr = `      if (notif.titre.includes('PLANIFICATION_PROJET')) {
        navigate('/admin/calendrier-projets');
      } else if (notif.demandeId) {
        navigate('/mes-demandes');`;

text = text.replace(oldStr, newStr);
fs.writeFileSync(file, text, 'utf8');
console.log('Header updated!');
