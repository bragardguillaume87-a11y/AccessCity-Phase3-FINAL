# ACCESS CITY AGENTIC WORKFLOW (v2.0 Optimized)

## ⚡ PERFORMANCE FIRST : Règles de Densité
1. **Ne JAMAIS creer de documentation textuelle** si un Schema JSON peut suffire.
2. **Regle des 10 lignes** : Si une explication depasse 10 lignes, elle doit etre synthetisee.
3. **Priorite au Code** : Le code doit etre "Self-Documenting" (noms de variables clairs) plutot que commente.

## 🔄 Boucle de Travail (Humain + IA)
1. **Humain** : Definit le besoin (ex: "Ajoute un panneau d'inventaire").
2. **IA (Architecte)** : Lit `PROJECT_MEMORY_SEED.md`. Verifie si c'est coherent avec la Vision.
3. **IA (Ouvrier)** :
   - Modifie `schemas.json` (Structure).
   - Modifie `ui_layout.json` (Visuel).
   - Modifie le code JS (Logique).
4. **IA (Controleur)** : Lance `node test/ascii-check.js` ET `node test/run-all.js`.
5. **Validation** : Si tout est vert, commit.

## 🛡️ Gestion de Crise
- **Si le code plante** : Ne pas ecrire de patch au hasard. Revenir au dernier etat stable.
- **Si l'IA hallucine** : Lui demander de relire `PROJECT_MEMORY_SEED.md` exclusivement.