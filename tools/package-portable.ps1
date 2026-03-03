# package-portable.ps1
# Empaquette l'exe portable dans un ZIP prêt à distribuer.
# Structure finale :
#   AccessCity-Studio-Portable.zip
#   └── AccessCity-Studio.exe

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

# Dossier de staging propre
if (Test-Path $OutDir) { Remove-Item $OutDir -Recurse -Force }
New-Item -ItemType Directory $OutDir | Out-Null

# Copie + renommage
Copy-Item $ExeSrc (Join-Path $OutDir "AccessCity-Studio.exe")

# ZIP
if (Test-Path $ZipDest) { Remove-Item $ZipDest -Force }
Compress-Archive -Path "$OutDir\*" -DestinationPath $ZipDest

# Nettoyage staging
Remove-Item $OutDir -Recurse -Force

Write-Host ""
Write-Host "OK  Package portable cree : $ZipDest" -ForegroundColor Green
Write-Host "    Contient : AccessCity-Studio.exe" -ForegroundColor Cyan
Write-Host "    Donnees sauvegardees dans : [dossier exe]\data\" -ForegroundColor Cyan
Write-Host ""
