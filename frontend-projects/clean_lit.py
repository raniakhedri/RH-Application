with open("c:/Users/alaou/OneDrive/Documents/test-merge-ala-antigonerh/RH-Application/frontend/src/pages/TousLesMediaPlanPage.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("\\`", "`").replace("\\$", "$")

with open("c:/Users/alaou/OneDrive/Documents/test-merge-ala-antigonerh/RH-Application/frontend/src/pages/TousLesMediaPlanPage.tsx", "w", encoding="utf-8") as f:
    f.write(text)
