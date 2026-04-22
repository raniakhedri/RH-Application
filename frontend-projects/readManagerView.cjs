const fs = require('fs');
const file = "c:/Users/yosrk/OneDrive/Bureau/Antigone Rh - Copie (3)/RH-Application/Frontend/src/pages/CalendrierProjetsAdminPage.tsx";
let text = fs.readFileSync(file, 'utf8');

const regex = /if\s*\(role\s*===\s*'manager'\)\s*\{([\s\S]*?)(export\s+default|if\s*\(role\s*===\s*'social'\))/i;
let match = text.match(regex);

if (match) {
    console.log(match[0].substring(0, 2000));
} else {
    console.log('Not found');
}
