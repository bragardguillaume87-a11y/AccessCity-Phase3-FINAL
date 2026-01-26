import { test, expect } from '@playwright/test';
import './coverage-hook';
import type { Page } from '@playwright/test';

/**
 * Tests E2E pour build Vite (React)
 * Ce fichier cible l'application React/Vite et vérifie la collecte de couverture.
 * 
 * L'interface React est différente de index-react.html legacy:
 * - Structure simplifiée (pas d'onboarding, scènes, etc.)
 * - Focus: validation moteur DialogueEngine + couverture
 */

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:8000';

async function openApp(page: Page) {
  await page.goto(BASE_URL + '/');
  await page.waitForLoadState('networkidle');
  const title = page.getByTestId('app-title');
  await expect(title).toBeVisible({ timeout: 10000 });
}

test.describe('Vite React App - Coverage & Engine', () => {
  test('Page charge et affiche moteur DialogueEngine', async ({ page }) => {
    await openApp(page);
    
    // Vérifier titre principal
    await expect(page.getByTestId('app-title')).toBeVisible();
    
    // Vérifier présence HUD variables
    const hud = page.locator('text=HUD Variables');
    await expect(hud).toBeVisible();
    
    // Vérifier dialogues affichés par moteur
    const dialogueText = page.locator('text=/Bienvenue explorateur|Bienvenue dans la version moteur/');
    await expect(dialogueText.first()).toBeVisible();
  });

  test('Choix modifient variables (HUD réactif)', async ({ page }) => {
    await openApp(page);

    // Avancer jusqu'à afficher les choix
    const nextBtn = page.getByRole('button', { name: /Suivant/ });
    while (await nextBtn.isVisible()) {
      const hasChoices = await page.getByRole('button', { name: /Boost|Fatigue/ }).first().isVisible().catch(() => false);
      if (hasChoices) break;
      await nextBtn.click();
      await page.waitForTimeout(200);
    }
    
    // Capturer snapshot initial variables via HUD
    const getVariables = async () => {
      return page.evaluate(() => {
        const hudItems = Array.from(document.querySelectorAll('[class*="slate-700/60"]'));
        const vars: Record<string, string> = {};
        hudItems.forEach(item => {
          const text = item.textContent || '';
          const match = text.match(/(\w+)\s*([\d\w.-]+)/);
          if (match) vars[match[1]] = match[2];
        });
        return vars;
      });
    };
    
    const beforeVars = await getVariables();
    expect(Object.keys(beforeVars).length).toBeGreaterThan(0);
    
    // Cliquer sur un choix (ex: "Boost Mentale")
    const choiceBtn = page.getByRole('button', { name: /Boost Mentale|Fatigue/ }).first();
    await expect(choiceBtn).toBeVisible();
    await choiceBtn.click();
    
    // Attendre mise à jour HUD
    await page.waitForTimeout(300);
    
    const afterVars = await getVariables();
    
    // Vérifier qu'au moins une variable a changé
    const changed = Object.keys(beforeVars).some(k => beforeVars[k] !== afterVars[k]);
    expect(changed).toBeTruthy();
  });

  test('Reset restaure scène sans reload', async ({ page }) => {
    await openApp(page);
    
    // Faire un choix pour modifier l'état
    const choiceBtn = page.getByRole('button', { name: /Boost|Fatigue|Alerte/ }).first();
    if (await choiceBtn.isVisible()) {
      await choiceBtn.click();
      await page.waitForTimeout(200);
    }
    
    // Cliquer Reset
    const resetBtn = page.getByRole('button', { name: /Reset/ });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    
    // Vérifier retour au dialogue initial
    await page.waitForTimeout(300);
    const initialDialogue = page.locator('text=/Bienvenue explorateur|Bienvenue dans la version/');
    await expect(initialDialogue.first()).toBeVisible();
  });

  test('EventLog capture événements moteur', async ({ page }) => {
    await openApp(page);

    // Vérifier heading Event Log
    const logHeading = page.getByRole('heading', { name: 'Event Log' });
    await expect(logHeading).toBeVisible();
    
    // Faire une action (choix) pour générer événement
    const choiceBtn = page.getByRole('button', { name: /Boost|Fatigue|Alerte/ }).first();
    if (await choiceBtn.isVisible()) {
      await choiceBtn.click();
      await page.waitForTimeout(500);
      
      // Vérifier qu'au moins un événement est loggé
      const logEntries = page.locator('[class*="border-slate-700/40"]');
      const count = await logEntries.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('window.__coverage__ est collecté (instrumentation active)', async ({ page }) => {
    await openApp(page);
    
    // Interagir pour générer couverture
    const choiceBtn = page.getByRole('button', { name: /Boost|Fatigue/ }).first();
    if (await choiceBtn.isVisible()) {
      await choiceBtn.click();
    }
    
    // Vérifier présence de window.__coverage__
    const hasCoverage = await page.evaluate(() => {
      return typeof (window as any).__coverage__ === 'object' && 
             Object.keys((window as any).__coverage__).length > 0;
    });
    
    expect(hasCoverage).toBeTruthy();
  });
});
