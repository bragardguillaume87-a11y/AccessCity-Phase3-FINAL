# Script PowerShell pour relancer le serveur Vite proprement
# Arrête tous les processus node liés à Vite, puis relance npm run dev

Write-Host "Arrêt des serveurs Vite en cours..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Redémarrage du serveur Vite..." -ForegroundColor Green
npm run dev
