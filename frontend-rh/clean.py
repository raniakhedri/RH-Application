import os

path = 'src/pages/ProjetsPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Strings to replace
reps = [
    ("text-[#f29f44] transition-colors hover:text-[#d98b36]", "text-brand-500 transition-colors hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"),
    ("bg-[#f29f44] px-5 text-[13px] font-bold text-black shadow-lg shadow-orange-500/20 transition-all hover:bg-[#e0892f] hover:shadow-orange-500/30", "bg-brand-500 px-5 text-[13px] font-bold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-600 hover:shadow-brand-500/30"),
    ("bg-[#292c35] text-gray-300 border-[#3e424e]", "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"),
    ("bg-[#1b3d3e] text-[#4dbfa2] border-[#2b5956]", "bg-brand-50 text-brand-600 border-brand-200 dark:bg-brand-900/20 dark:text-brand-400 dark:border-brand-800"),
    ("bg-[#1b3e24] text-[#4dbf6a] border-[#2b5936]", "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"),
    ("bg-[#3e1b1b] text-[#bf4d4d] border-[#592b2b]", "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"),
    ("bg-[#0ed96f] px-5 text-[13px] font-bold text-[#10301a] shadow-lg shadow-green-500/20 transition-colors hover:bg-[#0bc061]", "bg-green-600 px-5 text-[13px] font-bold text-white shadow-lg shadow-green-600/20 transition-colors hover:bg-green-700"),
    ("border-[#333745] bg-[#242731] px-4 text-[13px] font-medium text-gray-200 transition-colors hover:bg-[#2d313c]", "border-gray-200 bg-white px-4 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"),
    ("border-[#4a2e30] bg-[#2d1b1c] px-4 text-[13px] font-medium text-[#e06c75] transition-colors hover:bg-[#3d2425]", "border-red-200 bg-red-50 px-4 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20"),
    ("text-[#f29f44] dark:text-[#f29f44]", "text-brand-600 dark:text-brand-400"),
    ("text-[#f29f44] underline hover:text-[#e0892f]", "text-brand-600 underline hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-500"),
    ("text-[#f29f44] hover:underline", "text-brand-600 hover:underline dark:text-brand-400"),
    ("border-[#2d251d] dark:bg-[#1a1612]", "border-brand-200 dark:bg-brand-900/5 dark:border-brand-900/20"),
    ("text-[#8b93a8]", "text-gray-400"),
    ("text-[#a5acbe]", "text-gray-400"),
    ("text-[#4d5265]", "text-gray-500"),
    ("dark:border-[#272a35] dark:bg-[#1a1c22]", "dark:border-gray-700 dark:bg-gray-800"),
    ("dark:border-[#3a3e4d]", "dark:border-brand-500/50"),
    ("group-hover:text-[#f29f44]", "group-hover:text-brand-500"),
    ("bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-[#f29f44]", "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"),
    ("bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-[#f29f44]", "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"),
    ("bg-[#1f222b]", "bg-gray-100 dark:bg-gray-800"),
    ("bg-[#2a2e3a]", "bg-gray-200 dark:bg-gray-700"),
    ("bg-[#eb9d47]", "bg-brand-500"),
    ("dark:bg-[#2c303c]", "dark:bg-gray-700"),
    ("dark:bg-[#292c35]", "dark:bg-gray-700"),
    ("hover:border-[#3a3e4d] dark:hover:bg-white/5", "hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"),
    ("text-[#f29f44] transition-colors hover:text-[#d98b36]", "text-brand-500 transition-colors hover:text-brand-600"),
    ("text-[#10301a]", "text-white")
]

for old, new in reps:
    c = c.replace(old, new)

# And specifically handle Projets modal backgrounds where applicable
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print("Python replace done.")
