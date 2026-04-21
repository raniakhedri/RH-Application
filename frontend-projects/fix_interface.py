with open("c:/Users/alaou/OneDrive/Documents/test-merge-ala-antigonerh/RH-Application/frontend/src/pages/MesTachesPage.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("interface ProjectGroup {\n    projetId: number;", "interface ProjectGroup {\n    projetId: number;\n    clientId?: number | null;\n    clientNom?: string | null;")

with open("c:/Users/alaou/OneDrive/Documents/test-merge-ala-antigonerh/RH-Application/frontend/src/pages/MesTachesPage.tsx", "w", encoding="utf-8") as f:
    f.write(text)
