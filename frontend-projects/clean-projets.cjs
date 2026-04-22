const fs = require('fs');
let content = fs.readFileSync('src/pages/ProjetsPage.tsx', 'utf8');

// 1. Replace the "Retour aux clients" button text color
content = content.replace(/text-\\[#f29f44\\] transition-colors hover:text-\\[#d98b36\\]/g, "text-brand-500 transition-colors hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300");

// 2. Replace Nouveau Projet button
content = content.replace(/bg-\\[#f29f44\\] px-5 text-\\[13px\\] font-bold text-black shadow-lg shadow-orange-500\\/20 transition - all hover: bg -\\[#e0892f\\] hover: shadow - orange - 500\\/30/g, "bg-brand-500 px-5 text-[13px] font-bold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-600 hover:shadow-brand-500/30");

// 3. Status badges logic
content = content.replace(/let statusBadgeClass = 'bg-\\[#292c35\\] text-gray-300 border-\\[#3e424e\\]';/, "let statusBadgeClass = 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';");
content = content.replace(/statusBadgeClass = 'bg-\\[#1b3d3e\\] text-\\[#4dbfa2\\] border-\\[#2b5956\\]';/, "statusBadgeClass = 'bg-brand-50 text-brand-600 border-brand-200 dark:bg-brand-900/20 dark:text-brand-400 dark:border-brand-800';");
content = content.replace(/statusBadgeClass = 'bg-\\[#1b3e24\\] text-\\[#4dbf6a\\] border-\\[#2b5936\\]';/, "statusBadgeClass = 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';");
content = content.replace(/statusBadgeClass = 'bg-\\[#3e1b1b\\] text-\\[#bf4d4d\\] border-\\[#592b2b\\]';/, "statusBadgeClass = 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';");

// 4. Action Buttons in Details View
content = content.replace(/bg-\\[#0ed96f\\] px-5 text-\\[13px\\] font-bold text-\\[#10301a\\] shadow-lg shadow-green-500\\/20 transition - colors hover: bg -\\[#0bc061\\] / g, "bg-green-600 px-5 text-[13px] font-bold text-white shadow-lg shadow-green-600/20 transition-colors hover:bg-green-700");
content = content.replace(/border-\\[#333745\\] bg-\\[#242731\\] px-4 text-\\[13px\\] font-medium text-gray-200 transition-colors hover:bg-\\[#2d313c\\]/g, "border-gray-200 bg-white px-4 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700");
content = content.replace(/border-\\[#4a2e30\\] bg-\\[#2d1b1c\\] px-4 text-\\[13px\\] font-medium text-\\[#e06c75\\] transition-colors hover:bg-\\[#3d2425\\]/g, "border-red-200 bg-red-50 px-4 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20");

// 5. Media Plan Details text colors (orange -> brand)
content = content.replace(/text-\\[#f29f44\\] dark:text-\\[#f29f44\\]/g, "text-brand-600 dark:text-brand-400");
content = content.replace(/text-\\[#f29f44\\] underline hover:text-\\[#e0892f\\]/g, "text-brand-600 underline hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-500");
content = content.replace(/text-\\[#f29f44\\] hover:underline/g, "text-brand-600 hover:underline dark:text-brand-400");

// 6. Media Plan Block container outline
content = content.replace(/border-\\[#2d251d\\] dark:bg-\\[#1a1612\\]/g, "border-brand-200 dark:bg-brand-900/5 dark:border-brand-900/20");

// 7. Text colors in Manager/Member cards
content = content.replace(/text-\\[#8b93a8\\]/g, "text-gray-400");
content = content.replace(/text-\\[#a5acbe\\]/g, "text-gray-400");
content = content.replace(/text-\\[#4d5265\\]/g, "text-gray-500");

// 8. Dark container backgrounds logic: #1a1c22, #272a35 -> standard gray-900/gray-800
content = content.replace(/dark:border-\\[#272a35\\] dark:bg-\\[#1a1c22\\]/g, "dark:border-gray-700 dark:bg-gray-800");
content = content.replace(/dark:border-\\[#3a3e4d\\]/g, "dark:border-brand-500/50");

// 9. Details -> button / text hover color
content = content.replace(/group-hover:text-\\[#f29f44\\]/g, "group-hover:text-brand-500");

// 10. Star / User group icons backgrounds for Headers
content = content.replace(/bg-orange-100 text-orange-600 dark:bg-orange-500\\/20 dark: text -\\[#f29f44\\] / g, "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400");
content = content.replace(/bg-brand-100 text-brand-600 dark:bg-brand-500\\/20 dark: text -\\[#f29f44\\] / g, "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400");

// 11. Profile picture bubbles backgrounds
content = content.replace(/bg-\\[#1f222b\\]/g, "bg-gray-100 dark:bg-gray-800");
content = content.replace(/bg-\\[#2a2e3a\\]/g, "bg-gray-200 dark:bg-gray-700");
content = content.replace(/bg-\\[#eb9d47\\]/g, "bg-brand-500");
content = content.replace(/dark:bg-\\[#2c303c\\]/g, "dark:bg-gray-700");
content = content.replace(/dark:bg-\\[#292c35\\]/g, "dark:bg-gray-700");

fs.writeFileSync('src/pages/ProjetsPage.tsx', content);
console.log("Replaced dark colors in ProjetsPage");
