/**
 * ux-audit-hook.cjs — Hook PostToolUse Claude Code
 *
 * Déclenché après chaque Edit/Write sur :
 *   • src/components/**\/*.tsx → Audit UX (Miyamoto + Will Wright)
 *   • src/stores/**\/*.ts      → Audit Perf stores (Carmack / Acton)
 *   • src/hooks/**\/*.ts       → Audit Perf hooks (références stables, memoisation)
 *   • src/core/**\/*.ts        → Audit Architecture (zero deps React/Zustand)
 *   • src/facades/**\/*.ts     → Audit Architecture (API agrégée, retours sync)
 *
 * Stdin  : JSON { tool_name: string, tool_input: { file_path: string } }
 * Stdout : JSON hookSpecificOutput si fichier concerné, rien sinon
 */

'use strict';

// ── Règles par zone ─────────────────────────────────────────────────────────

const UX_RULES = [
  `[UX AUDIT] Composant modifié`,
  `Vérifier selon .claude/rules/nintendo-ux.md :`,
  ``,
  `Miyamoto`,
  `  • Feedback visuel <100ms sur hover, tap, input`,
  `  • Emoji + label (jamais label seul)`,
  `  • Composant masqué si contexte non pertinent`,
  `  • Animations spring pour éléments physiques, ease pour transitions`,
  ``,
  `Will Wright`,
  `  • Taux utilisation espace ≥70% (pixels porteurs d'info / pixels totaux)`,
  `  • Aucun placeholder générique si la donnée réelle est dans les stores`,
  `  • Layout adapté au type de contenu (pas de layout universel)`,
  `  • Portrait/avatar du speaker si speaker sélectionné`,
  ``,
  `Anti-patterns`,
  `  ❌ maxHeight: '90vh' sur conteneur racine (shrinks to content)`,
  `  ❌ Zone preview >40% de vide`,
  `  ❌ Placeholder générique si donnée réelle disponible`,
  `  ❌ getState() pendant le render (→ données stale)`,
  `  ❌ [] ou {} inline dans les props memo (→ boucle infinie)`,
];

const PERF_STORE_RULES = [
  `[PERF AUDIT] Store modifié`,
  `Vérifier selon principes Carmack / Acton :`,
  ``,
  `Références stables (Acton)`,
  `  • Constante EMPTY_* module-level pour les fallbacks [] et {}`,
  `  • Pas de || [] inline dans les selectors (→ nouvelle référence à chaque render)`,
  `  • Selectors memoïsés via createSelector ou useMemo si calcul coûteux`,
  ``,
  `getState() — render vs handler (invariant critique)`,
  `  ✅ getState() dans un callback/handler uniquement`,
  `  ❌ getState() pendant le render → données stale, pas réactif`,
  ``,
  `Perf Zustand (Carmack)`,
  `  • Selector granulaire : s => s.field (pas s => s) — évite les re-renders globaux`,
  `  • Actions dans set() uniquement, pas dans des useEffect`,
  `  • temporal middleware : vérifier que les snapshots ne clonent pas des objets lourds`,
  ``,
  `Architecture store (invariant Phase 3)`,
  `  • scenesStore.scenes : dialogues TOUJOURS [] — utiliser useSceneWithElements()`,
  `  • Ne jamais importer depuis src/components/ dans un store`,
];

const PERF_HOOK_RULES = [
  `[PERF AUDIT] Hook modifié`,
  `Vérifier références stables et memoisation :`,
  ``,
  `useMemo / useCallback`,
  `  • Données filtrées passées à un hook → useMemo sur le filtre (évite effect loop)`,
  `  • Handlers passés en props → useCallback avec deps minimales`,
  `  • EMPTY_* module-level pour les fallbacks arrays/objects dans les deps`,
  ``,
  `useEffect`,
  `  • Cleanup pour les opérations async (new Image, fetch) : flag cancelled`,
  `  • Pas de setState dans un useEffect sans guard sur composant monté`,
  `  • Deps array : pas d'objet/array créé inline (→ effect infini)`,
  ``,
  `Acton — Data-Oriented`,
  `  • Transformer les données une fois au bord (hook/selector), pas dans chaque render`,
  `  • Eviter les .find() dans le render — pré-calculer en useMemo`,
];

const ARCH_CORE_RULES = [
  `[ARCHI AUDIT] Module core/ ou facades/ modifié`,
  `Vérifier selon .claude/rules/store-patterns.md + règles Muratori :`,
  ``,
  `Invariant core/ (zéro dépendance React/Zustand)`,
  `  ❌ import React, useState, useEffect dans core/`,
  `  ❌ import from stores/ dans core/`,
  `  ✅ Types uniquement depuis src/types/`,
  `  ✅ Fonctions pures, pas d'effets de bord`,
  ``,
  `Muratori — "Éviter l'abstraction prématurée"`,
  `  • 3 usages similaires avant d'abstraire (pas d'abstraction pour 1 cas)`,
  `  • Pas de helper/util pour une opération one-shot`,
  `  • Interface minimale : exposer seulement ce qui est consommé`,
  ``,
  `facades/ — API agrégée`,
  `  • Retours synchrones (pas de Promise dans les handlers éditeur)`,
  `  • Ne pas dupliquer la logique des stores — déléguer`,
  `  • Pas d'état local dans les facades`,
];

// ── Détection de zone ────────────────────────────────────────────────────────

function getZone(filePath) {
  const p = filePath.replace(/\\/g, '/');
  if (/src\/components.*\.tsx?$/.test(p)) return 'ux';
  if (/src\/stores.*\.ts$/.test(p))       return 'store';
  if (/src\/hooks.*\.ts$/.test(p))        return 'hook';
  if (/src\/core.*\.ts$/.test(p))         return 'arch';
  if (/src\/facades.*\.ts$/.test(p))      return 'arch';
  return null;
}

function getRules(zone) {
  switch (zone) {
    case 'ux':    return UX_RULES;
    case 'store': return PERF_STORE_RULES;
    case 'hook':  return PERF_HOOK_RULES;
    case 'arch':  return ARCH_CORE_RULES;
    default:      return null;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

let data = '';
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const input    = JSON.parse(data);
    const filePath = (input.tool_input || {}).file_path || '';
    const zone     = getZone(filePath);
    if (!zone) return;

    const rules    = getRules(zone);
    const shortName = filePath.replace(/.*src[/\\]/, 'src/');

    const lines = [
      `📁 ${shortName}`,
      ...rules,
    ];

    const output = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: lines.join('\n'),
      },
    };

    process.stdout.write(JSON.stringify(output) + '\n');
  } catch (_) {
    // Échec silencieux — ne pas bloquer le workflow
  }
});
