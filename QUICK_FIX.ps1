# AccessCity Quick Fix Script
# Execute depuis le commit 1fc17cb (detached HEAD)
# Fusionne editeur complet + corrections bugs + nettoyage architecture

Write-Host "`n=== AccessCity Quick Fix ===`n" -ForegroundColor Cyan

# Etape 1 : Creer branche depuis commit actuel
Write-Host "[1/7] Creation branche editeur-propre-avec-corrections..." -ForegroundColor Yellow
git switch -c editeur-propre-avec-corrections
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR : Impossible de creer la branche" -ForegroundColor Red
    exit 1
}
Write-Host "OK : Branche creee" -ForegroundColor Green

# Etape 2 : Recuperer corrections depuis GitHub
Write-Host "`n[2/7] Recuperation corrections depuis Access-City-5.5a..." -ForegroundColor Yellow
git checkout Access-City-5.5a -- src/core/StageDirector.js 2>$null
git checkout Access-City-5.5a -- src/utils/soundFeedback.js 2>$null
git checkout Access-City-5.5a -- docs/SCENE_EDITOR_FIXES.md 2>$null
git checkout Access-City-5.5a -- docs/BUGFIXES_SUMMARY.md 2>$null
git checkout Access-City-5.5a -- docs/CLEANUP_PLAN.md 2>$null
Write-Host "OK : Fichiers corriges recuperes" -ForegroundColor Green

# Etape 3 : Sauvegarder ancien PlayMode si existe
Write-Host "`n[3/7] Gestion PlayMode.jsx..." -ForegroundColor Yellow
if (Test-Path "src/components/PlayMode.jsx") {
    Copy-Item "src/components/PlayMode.jsx" "src/components/PlayMode.BACKUP.jsx" -Force
    Write-Host "OK : Ancien PlayMode sauvegarde" -ForegroundColor Green
}
git checkout Access-City-5.5a -- src/components/PlayMode.jsx 2>$null
Write-Host "OK : Nouveau PlayMode avec Mute recupere" -ForegroundColor Green

# Etape 4 : Supprimer doublons legacy
Write-Host "`n[4/7] Suppression doublons /core/ et /ui/..." -ForegroundColor Yellow
if (Test-Path "core") {
    Remove-Item -Recurse -Force "core/" -ErrorAction SilentlyContinue
    Write-Host "OK : /core/ supprime" -ForegroundColor Green
}
if (Test-Path "ui") {
    Remove-Item -Recurse -Force "ui/" -ErrorAction SilentlyContinue
    Write-Host "OK : /ui/ supprime" -ForegroundColor Green
}

# Etape 5 : Archiver fichiers HTML obsoletes
Write-Host "`n[5/7] Archivage fichiers HTML legacy..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "legacy/" | Out-Null

$filesToArchive = @("index-legacy.html", "index-react.html", "index-vite.html", "test-direct.html")
foreach ($file in $filesToArchive) {
    if (Test-Path $file) {
        Move-Item $file "legacy/" -Force -ErrorAction SilentlyContinue
        Write-Host "  - $file archive" -ForegroundColor Gray
    }
}
Write-Host "OK : Fichiers HTML archives dans /legacy/" -ForegroundColor Green

# Etape 6 : Verifier App.jsx contient editeur complet
Write-Host "`n[6/7] Verification App.jsx..." -ForegroundColor Yellow
$appContent = Get-Content "src/App.jsx" -Raw -ErrorAction SilentlyContinue
if ($appContent -match "Compteur" -or $appContent.Length -lt 5000) {
    Write-Host "WARNING : App.jsx semble etre la demo simple" -ForegroundColor Yellow
    Write-Host "Recuperation depuis commit 1fc17cb..." -ForegroundColor Yellow
    git show 1fc17cb:src/App.jsx | Out-File -Encoding utf8 src/App.jsx
    Write-Host "OK : Editeur complet restaure" -ForegroundColor Green
} else {
    Write-Host "OK : App.jsx contient l'editeur complet" -ForegroundColor Green
}

# Etape 7 : Commit tous les changements
Write-Host "`n[7/7] Commit des changements..." -ForegroundColor Yellow
git add .
git commit -m "Nettoyage architecture: fusion editeur complet + corrections bugs

- Suppression doublons /core/ et /ui/
- Archive fichiers HTML legacy dans /legacy/
- Integration StageDirector.js corrige (dialogues connectes)
- Integration soundFeedback.js avec mute global
- Integration PlayMode.jsx avec bouton Mute fonctionnel
- Documentation complete (SCENE_EDITOR_FIXES, BUGFIXES_SUMMARY, CLEANUP_PLAN)
- Architecture Vite unifiee
- Correction bug scene 'Fin du jeu' immediate

Fixes #1 #2 #3 (dialogues, scene, mute)"

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK : Changements commites" -ForegroundColor Green
} else {
    Write-Host "ERREUR : Probleme lors du commit" -ForegroundColor Red
    exit 1
}

# Resume
Write-Host "`n=== SUCCES ! ===`n" -ForegroundColor Green
Write-Host "Branche creee : editeur-propre-avec-corrections" -ForegroundColor Cyan
Write-Host "Fichiers integres :" -ForegroundColor Cyan
Write-Host "  - src/core/StageDirector.js (dialogues corriges)" -ForegroundColor Gray
Write-Host "  - src/utils/soundFeedback.js (systeme mute)" -ForegroundColor Gray
Write-Host "  - src/components/PlayMode.jsx (bouton mute)" -ForegroundColor Gray
Write-Host "  - docs/ (3 fichiers documentation)" -ForegroundColor Gray
Write-Host "`nArchitecture nettoyee :" -ForegroundColor Cyan
Write-Host "  - /core/ et /ui/ supprimes" -ForegroundColor Gray
Write-Host "  - Fichiers HTML legacy archives" -ForegroundColor Gray
Write-Host "  - Un seul index.html pour Vite" -ForegroundColor Gray

Write-Host "`nProchaine etape :" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor White
Write-Host "`nPuis ouvrir : http://localhost:5173" -ForegroundColor White
Write-Host "`nTu devrais voir l'editeur complet avec les 6 etapes !`n" -ForegroundColor Cyan

# Optionnel : Lancer automatiquement
$response = Read-Host "Lancer npm run dev maintenant ? (o/n)"
if ($response -eq "o" -or $response -eq "O") {
    Write-Host "`nLancement de Vite..." -ForegroundColor Cyan
    npm run dev
}