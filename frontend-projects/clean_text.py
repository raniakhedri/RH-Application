import os

path = 'src/pages/ProjetsPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

reps = [
    # 1. Project Names in the Kanban Board (e.g. oneshot, gdgfhvjbkl)
    # They are text-[17px] font-bold
    ('text-[17px] font-bold', 'text-base font-semibold'),
    
    # 2. Client Names / Big Headers (e.g. clientyosr)
    # text-3xl font-black
    ('text-3xl font-black tracking-tight', 'text-2xl font-bold'),
    
    # 3. Project Name in Details Header
    # text-4xl font-black
    ('text-4xl font-black tracking-tight', 'text-2xl font-bold'),
    
    # 4. Nouveau Projet Button (previously bg-brand-500 with text-white and shadow)
    ('className="flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-[13px] font-bold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-600 hover:shadow-brand-500/30"',
     'className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"'),
    
    # 5. Démarrer Button (previously bg-green-600 with white text)
    ('className="flex h-10 items-center justify-center gap-2 rounded-lg bg-green-600 px-5 text-[13px] font-bold text-white shadow-lg shadow-green-600/20 transition-colors hover:bg-green-700"',
     'className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"'),
     
    # 6. Star icon in Department Managers
    ('&starf;', '<HiOutlineUserGroup size={16} />'),
    
    # Let's also tone down the other action buttons so they match Démarrer
    ('className="flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"',
     'className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"'),
    ('className="flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20"',
     'className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none dark:border-red-900/50 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700"')
]

for old, new in reps:
    c = c.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print("Text styles and button refinements done.")
