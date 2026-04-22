import os
import re

frontend_dir = r"c:\Users\alaou\OneDrive\Documents\test-merge-ala-antigonerh\RH-Application\frontend\src"

# 1. index.ts
index_path = os.path.join(frontend_dir, r"types\index.ts")
with open(index_path, "r", encoding="utf-8") as f:
    c = f.read()

c = re.sub(r"  clientLienDrive\?: string \| null;\n", "", c)
c = re.sub(r"  lienDrive\?: string \| null;\n", "", c)

with open(index_path, "w", encoding="utf-8") as f:
    f.write(c)

# 2. MesTachesPage.tsx
mes_taches = os.path.join(frontend_dir, r"pages\MesTachesPage.tsx")
with open(mes_taches, "r", encoding="utf-8") as f:
    mt = f.read()

mt = re.sub(r"    clientLienDrive\?: string \| null;\n", "", mt)
mt = re.sub(r"    clientLienDrive: string \| null;\n", "", mt)
mt = re.sub(r"                    clientLienDrive: fullProjet\?\.clientLienDrive \|\| null,\n", "", mt)
mt = re.sub(r"                    clientLienDrive: pg\.clientLienDrive \|\| null,\n", "", mt)

with open(mes_taches, "w", encoding="utf-8") as f:
    f.write(mt)
