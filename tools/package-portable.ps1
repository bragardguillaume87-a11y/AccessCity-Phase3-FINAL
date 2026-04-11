# package-portable.ps1
# Empaquette l'exe portable + données projet en un ZIP prêt à distribuer.
#
# Structure finale :
#   AccessCity-Studio-Portable.zip
#   ├── AccessCity-Studio.exe
#   └── data\
#       ├── autoload.zip          ← backup projet (scènes + assets + cartes)
#       └── assets\               ← assets copiés depuis AppData (fallback)
#
# Workflow :
#   1. L'utilisateur exporte son projet via Settings → Exporter (*-backup.zip)
#   2. npm run build:portable
#   3. Ce script trouve automatiquement le backup ZIP le plus récent
#   4. Au premier lancement du .exe, le projet est importé automatiquement

$ErrorActionPreference = "Stop"

$Root    = Split-Path $PSScriptRoot -Parent
$ExeName = "accesscity-player.exe"
$ExeSrc  = Join-Path $Root "src-tauri\target\release\$ExeName"
$OutDir  = Join-Path $Root "dist-portable"
$ZipDest = Join-Path $Root "AccessCity-Studio-Portable.zip"

if (-not (Test-Path $ExeSrc)) {
    Write-Error "Exe introuvable : $ExeSrc`nLance d'abord : npm run build:portable"
    exit 1
}

# ── Dossier de staging propre ────────────────────────────────────────────────
if (Test-Path $OutDir) { Remove-Item $OutDir -Recurse -Force }
New-Item -ItemType Directory $OutDir | Out-Null
New-Item -ItemType Directory (Join-Path $OutDir "data") | Out-Null

# ── Copie exe ────────────────────────────────────────────────────────────────
Copy-Item $ExeSrc (Join-Path $OutDir "AccessCity-Studio.exe")
Write-Host "  [OK] Exe copie" -ForegroundColor Cyan

# ── Recherche du backup ZIP le plus recent ───────────────────────────────────
# Ordre de recherche : racine du projet → Downloads → Desktop
$SearchDirs = @(
    $Root,
    (Join-Path $env:USERPROFILE "Downloads"),
    (Join-Path $env:USERPROFILE "Desktop")
)

$BackupZip = $null
foreach ($dir in $SearchDirs) {
    if (-not (Test-Path $dir)) { continue }
    $found = Get-ChildItem -Path $dir -Filter "*-backup.zip" -File -ErrorAction SilentlyContinue |
             Sort-Object LastWriteTime -Descending |
             Select-Object -First 1
    if ($found) {
        $BackupZip = $found.FullName
        break
    }
}

if ($BackupZip) {
    Copy-Item $BackupZip (Join-Path $OutDir "data\autoload.zip")
    $BackupName = Split-Path $BackupZip -Leaf
    Write-Host "  [OK] Backup inclus : $BackupName" -ForegroundColor Cyan
    Write-Host "       (sera auto-importe au premier lancement)" -ForegroundColor DarkCyan
} else {
    Write-Host "  [!] Aucun backup *-backup.zip trouve." -ForegroundColor Yellow
    Write-Host "      Pour inclure ton projet : Settings -> Exporter dans le projet" -ForegroundColor Yellow
    Write-Host "      puis relance npm run build:portable" -ForegroundColor Yellow
}

# ── Fallback : copie les assets depuis AppData (mode installe) ───────────────
# Utile si le backup ZIP ne contient pas certains assets (ancien format JSON sans assets)
$AppDataAssets = Join-Path $env:APPDATA "fr.accesscity.studio\assets"
if (-not (Test-Path $AppDataAssets)) {
    # Tenter aussi le chemin LocalAppData
    $AppDataAssets = Join-Path $env:LOCALAPPDATA "fr.accesscity.studio\assets"
}

if ((Test-Path $AppDataAssets) -and (-not $BackupZip)) {
    $DataAssetsDir = Join-Path $OutDir "data\assets"
    New-Item -ItemType Directory $DataAssetsDir -Force | Out-Null
    Copy-Item -Path "$AppDataAssets\*" -Destination $DataAssetsDir -Recurse -Force
    $AssetCount = (Get-ChildItem $DataAssetsDir -Recurse -File).Count
    Write-Host "  [OK] Assets AppData copies : $AssetCount fichier(s)" -ForegroundColor Cyan
}

# ── README.txt ───────────────────────────────────────────────────────────────
$ReadmeContent = @"
AccessCity Studio — Version Portable
======================================

PREREQUIS
---------
Windows 10 (21H2+) ou Windows 11 : WebView2 est deja installe par defaut.
Windows 10 ancien : telecharger WebView2 Runtime sur https://developer.microsoft.com/microsoft-edge/webview2/

LANCEMENT
---------
Double-cliquer sur AccessCity-Studio.exe
Pas d'installation requise. Le dossier peut etre copie sur cle USB.

DONNEES & SAUVEGARDE
--------------------
Les donnees sont stockees dans le sous-dossier "data\" a cote de l'exe :
  data\webview\   — profil navigateur + localStorage (sauvegarde automatique)
  data\assets\    — images, sons et fichiers uploades

Pour sauvegarder ou transporter votre projet :
  Ouvrir AccessCity Studio -> Parametres (icone engrenage) -> Exporter
  Un fichier *-backup.zip est genere, contenant toutes les scenes et assets.

Pour restaurer sur un autre PC :
  Copier le *-backup.zip dans le dossier, renommer en "data\autoload.zip",
  puis lancer l'exe (import automatique au premier lancement).

SUPPORT
-------
Projet : AccessCity Visual Novel Editor
"@

$ReadmePath = Join-Path $OutDir "README.txt"
Set-Content -Path $ReadmePath -Value $ReadmeContent -Encoding UTF8
Write-Host "  [OK] README.txt cree" -ForegroundColor Cyan

# ── ZIP final ────────────────────────────────────────────────────────────────
if (Test-Path $ZipDest) { Remove-Item $ZipDest -Force }
Compress-Archive -Path "$OutDir\*" -DestinationPath $ZipDest

# Nettoyage staging
Remove-Item $OutDir -Recurse -Force

$ZipSize = [math]::Round((Get-Item $ZipDest).Length / 1MB, 1)

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Build portable cree : AccessCity-Studio-Portable.zip ($ZipSize MB)" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
if ($BackupZip) {
    Write-Host "  Contient : exe + projet complet (autoload au 1er lancement)" -ForegroundColor Cyan
} else {
    Write-Host "  Contient : exe uniquement (projet vide)" -ForegroundColor Yellow
    Write-Host "  Pour inclure ton projet :" -ForegroundColor Yellow
    Write-Host "    1. Ouvre AccessCity Studio" -ForegroundColor Yellow
    Write-Host "    2. Settings -> Exporter (genere un *-backup.zip)" -ForegroundColor Yellow
    Write-Host "    3. npm run build:portable" -ForegroundColor Yellow
}
Write-Host ""
