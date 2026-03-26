/**
 * audit-vn-panel.js — Audit Puppeteer du panel droit Visual Novel
 *
 * Usage : node tools/audit-vn-panel.js
 * Prérequis : npm run dev:vite en cours (port 5173)
 *
 * Tests :
 *  A. Rendu initial
 *  B. Ouverture de chaque section du UnifiedPanel
 *  C. Drag fond → canvas
 *  D. Drag personnage → canvas
 *  E. Drag emoji → canvas
 *  F. Bibliothèque assets (modal)
 */

import puppeteer from 'puppeteer';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = join(__dirname, '../tools/audit-screenshots');
const BASE_URL = 'http://localhost:5173';
const TIMEOUT = 8000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

async function screenshot(page, name) {
  const path = join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${name}.png`);
  return path;
}

function log(msg) {
  console.log(`\n${msg}`);
}
function ok(msg) {
  console.log(`  ✅ ${msg}`);
}
function warn(msg) {
  console.log(`  ⚠️  ${msg}`);
}
function fail(msg) {
  console.log(`  ❌ ${msg}`);
}

/**
 * Simulation HTML5 drag-and-drop via mouse events + dataTransfer synthétique.
 * Puppeteer ne supporte pas nativement le DnD HTML5 — on injecte via page.evaluate.
 */
async function simulateDrag(page, sourceSel, targetSel) {
  return page.evaluate(
    async (sourceSel, targetSel) => {
      const source = document.querySelector(sourceSel);
      const target = document.querySelector(targetSel);
      if (!source || !target)
        return { ok: false, reason: `selector not found: ${!source ? sourceSel : targetSel}` };

      const srcRect = source.getBoundingClientRect();
      const tgtRect = target.getBoundingClientRect();

      const dataStore = {};
      const dt = {
        types: [],
        effectAllowed: 'copy',
        dropEffect: 'copy',
        setData(type, val) {
          dataStore[type] = val;
          if (!this.types.includes(type)) this.types.push(type);
        },
        getData(type) {
          return dataStore[type] ?? '';
        },
        setDragImage() {},
        clearData() {
          Object.keys(dataStore).forEach((k) => delete dataStore[k]);
          this.types.length = 0;
        },
      };

      const makeEvent = (type, x, y) => {
        const e = new DragEvent(type, {
          bubbles: true,
          cancelable: true,
          composed: true,
          clientX: x,
          clientY: y,
          dataTransfer: dt,
        });
        // Override dataTransfer (read-only in real events, but we can patch prototype)
        Object.defineProperty(e, 'dataTransfer', { get: () => dt });
        return e;
      };

      const cx = srcRect.left + srcRect.width / 2;
      const cy = srcRect.top + srcRect.height / 2;
      const tx = tgtRect.left + tgtRect.width / 2;
      const ty = tgtRect.top + tgtRect.height / 2;

      source.dispatchEvent(makeEvent('dragstart', cx, cy));
      await new Promise((r) => setTimeout(r, 30));
      target.dispatchEvent(makeEvent('dragover', tx, ty));
      await new Promise((r) => setTimeout(r, 30));
      target.dispatchEvent(makeEvent('drop', tx, ty));
      source.dispatchEvent(makeEvent('dragend', tx, ty));
      await new Promise((r) => setTimeout(r, 60));

      return { ok: true, dataStore };
    },
    sourceSel,
    targetSel
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function run() {
  ensureDir(SCREENSHOTS_DIR);

  const errors = [];
  const results = { pass: 0, warn: 0, fail: 0 };

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(`PAGE ERROR: ${err.message}`));

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // A. Rendu initial
    // ─────────────────────────────────────────────────────────────────────────
    log('A. Rendu initial');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: TIMEOUT });
    await page.waitForSelector('#root', { timeout: TIMEOUT });

    // Attendre que React monte
    await page.waitForFunction(() => document.querySelector('#root')?.children?.length > 0, {
      timeout: TIMEOUT,
    });

    await screenshot(page, '01-init');
    ok('App chargée');
    results.pass++;

    // ─────────────────────────────────────────────────────────────────────────
    // B. Sections UnifiedPanel — ouverture
    // ─────────────────────────────────────────────────────────────────────────
    log('B. Ouverture des sections UnifiedPanel');

    // Les boutons du panel droit utilisent des aria-labels ou des data-section
    // On cherche par titre de tooltip ou aria-label
    const sections = [
      { name: 'backgrounds', aria: /fond|background|image/i, dataAttr: null },
      { name: 'characters', aria: /perso|character|person/i, dataAttr: null },
      { name: 'objects', aria: /objet|object|prop/i, dataAttr: null },
      { name: 'dialogue', aria: /dialogue|message/i, dataAttr: null },
      { name: 'text', aria: /texte|text/i, dataAttr: null },
      { name: 'audio', aria: /audio|son|music/i, dataAttr: null },
    ];

    // Trouver les boutons du UnifiedPanel (colonne droite 64px)
    const unifiedPanelBtns = await page.$$eval('button[title], button[aria-label]', (btns) =>
      btns.map((b) => ({
        title: b.title,
        aria: b.getAttribute('aria-label'),
        text: b.textContent?.trim(),
      }))
    );
    console.log('  Boutons détectés:', JSON.stringify(unifiedPanelBtns.slice(0, 20), null, 2));

    // Tenter d'ouvrir chaque section
    for (const sec of sections) {
      try {
        // Chercher bouton par title ou aria-label matching le pattern
        const btnHandle = await page.evaluateHandle((pattern) => {
          const btns = Array.from(document.querySelectorAll('button'));
          return (
            btns.find((b) =>
              new RegExp(pattern, 'i').test(
                b.title || b.getAttribute('aria-label') || b.textContent || ''
              )
            ) || null
          );
        }, sec.aria.source);

        const btn = btnHandle.asElement();
        if (btn) {
          await btn.click();
          await page.waitForTimeout(300);
          await screenshot(page, `02-section-${sec.name}`);
          ok(`Section "${sec.name}" ouverte`);
          results.pass++;
          // Fermer pour le prochain test
          await btn.click();
          await page.waitForTimeout(200);
        } else {
          warn(`Bouton section "${sec.name}" introuvable`);
          results.warn++;
        }
      } catch (e) {
        fail(`Section "${sec.name}" : ${e.message}`);
        results.fail++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // C. Section Fonds — état + drag
    // ─────────────────────────────────────────────────────────────────────────
    log('C. Section Fonds — drag vers canvas');

    // Ouvrir section backgrounds
    try {
      const bgBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return (
          btns.find((b) =>
            /fond|background|image/i.test(b.title + b.getAttribute('aria-label') + b.textContent)
          ) || null
        );
      });
      const bgBtnEl = bgBtn.asElement();
      if (bgBtnEl) {
        await bgBtnEl.click();
        await page.waitForTimeout(400);
      }
    } catch (_) {}

    // Vérifier présence des fonds
    const bgThumbs = await page.$$('[draggable="true"], [draggable]');
    const bgCount = bgThumbs.length;
    console.log(`  Éléments draggables trouvés : ${bgCount}`);

    if (bgCount > 0) {
      // Trouver le canvas
      const canvasSel = '[class*="canvas"], [class*="main-canvas"], [data-canvas]';
      const canvasExists = await page.$(canvasSel);

      if (canvasExists) {
        // Drag premier élément draggable → canvas
        const result = await simulateDrag(
          page,
          '[draggable="true"]:first-of-type, [draggable]:first-of-type',
          canvasSel
        );
        if (result.ok) {
          ok(`Drag simulé (dataStore: ${JSON.stringify(result.dataStore).slice(0, 80)}...)`);
          results.pass++;
        } else {
          warn(`Drag: ${result.reason}`);
          results.warn++;
        }
        await screenshot(page, '03-bg-drag');
      } else {
        warn('Canvas non trouvé pour le drop');
        results.warn++;
      }
    } else {
      warn("Aucun fond récent — section vide (expected si pas d'assets)");
      results.warn++;
    }

    // Bouton "Parcourir la bibliothèque"
    try {
      const libBtn = await page.$x('//button[contains(., "Parcourir") or contains(., "biblioth")]');
      if (libBtn.length > 0) {
        await libBtn[0].click();
        await page.waitForTimeout(500);
        await screenshot(page, '04-library-modal');

        const modalVisible = await page.$('[role="dialog"], [class*="modal"], [class*="Modal"]');
        if (modalVisible) {
          ok('Modal bibliothèque ouverte');
          results.pass++;
          // Fermer
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        } else {
          warn('Modal bibliothèque : pas de dialog détecté');
          results.warn++;
        }
      } else {
        warn('"Parcourir la bibliothèque" introuvable');
        results.warn++;
      }
    } catch (e) {
      warn(`Bibliothèque : ${e.message}`);
      results.warn++;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // D. Section Personnages
    // ─────────────────────────────────────────────────────────────────────────
    log('D. Section Personnages');

    try {
      const charBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return (
          btns.find((b) =>
            /perso|character|person/i.test(b.title + b.getAttribute('aria-label') + b.textContent)
          ) || null
        );
      });
      const charBtnEl = charBtn.asElement();
      if (charBtnEl) {
        await charBtnEl.click();
        await page.waitForTimeout(400);
        await screenshot(page, '05-section-characters');

        // Vérifier le contenu
        const charContent = await page.evaluate(() => {
          // Chercher le panneau de contenu visible
          const panel = document.querySelector(
            '[class*="section-content"], [class*="SectionContent"]'
          );
          return panel ? panel.textContent?.slice(0, 200) : 'panel not found';
        });
        console.log(`  Contenu section personnages: "${charContent?.slice(0, 100)}..."`);
        ok('Section personnages visible');
        results.pass++;
      } else {
        warn('Bouton personnages introuvable');
        results.warn++;
      }
    } catch (e) {
      fail(`Section personnages : ${e.message}`);
      results.fail++;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // E. Section Objets — drag emoji
    // ─────────────────────────────────────────────────────────────────────────
    log('E. Section Objets — drag emoji');

    try {
      const objBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return (
          btns.find((b) =>
            /objet|object|prop|package/i.test(
              b.title + b.getAttribute('aria-label') + b.textContent
            )
          ) || null
        );
      });
      const objBtnEl = objBtn.asElement();
      if (objBtnEl) {
        await objBtnEl.click();
        await page.waitForTimeout(400);
        await screenshot(page, '06-section-objects');

        // Chercher les emojis draggables
        const emojiDraggable = await page.evaluate(() => {
          const divs = Array.from(document.querySelectorAll('[draggable="true"], [draggable]'));
          return divs.map((d) => ({
            tag: d.tagName,
            text: d.textContent?.slice(0, 10),
            drag: d.getAttribute('draggable'),
          }));
        });
        console.log(`  Éléments draggables: ${JSON.stringify(emojiDraggable.slice(0, 5))}`);

        if (emojiDraggable.length > 0) {
          ok(`${emojiDraggable.length} éléments draggables dans la section objets`);
          results.pass++;
        } else {
          warn('Aucun emoji draggable trouvé dans la section objets');
          results.warn++;
        }
      } else {
        warn('Bouton objets introuvable');
        results.warn++;
      }
    } catch (e) {
      fail(`Section objets : ${e.message}`);
      results.fail++;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // F. Résumé console errors
    // ─────────────────────────────────────────────────────────────────────────
    log('F. Console errors');
    if (errors.length === 0) {
      ok('Aucune erreur console');
      results.pass++;
    } else {
      errors.forEach((e) => fail(`Console: ${e}`));
      results.fail += errors.length;
    }

    // Screenshot final
    await screenshot(page, '99-final');
  } catch (err) {
    console.error('\n💥 Erreur fatale:', err.message);
    await screenshot(page, '00-error').catch(() => {});
  } finally {
    await browser.close();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Résumé
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log(`RÉSUMÉ : ✅ ${results.pass} OK  ⚠️  ${results.warn} WARN  ❌ ${results.fail} FAIL`);
  console.log(`Screenshots : ${SCREENSHOTS_DIR}`);
  console.log('═'.repeat(50));

  if (results.fail > 0) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
