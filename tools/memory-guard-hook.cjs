/**
 * memory-guard-hook.cjs — Hook PreToolUse Claude Code
 *
 * Déclenché AVANT chaque Edit/Write sur :
 *   • src/styles/**\/*.css    → Rappel anti-patterns CSS (::after, WAAPI)
 *   • src/components/**\/*.tsx → Rappel anti-patterns React (keys, audio, framer-motion)
 *   • src/components/ui/**   → Rappel supplémentaire UI tokens + pseudo-éléments
 *
 * Objectif : forcer la consultation de hallucination_patterns.md AVANT l'action.
 * Ne bloque PAS — affiche uniquement le contexte critique comme rappel obligatoire.
 *
 * Stdin  : JSON { tool_name, tool_input: { file_path } }
 * Stdout : JSON hookSpecificOutput avec additionalContext
 */

'use strict';

// ── Rappels par zone ──────────────────────────────────────────────────────────

const CSS_GUARD = [
  `⚠️  MEMORY GUARD — fichier CSS modifié`,
  ``,
  `Avant d'éditer, vérifier dans hallucination_patterns.md :`,
  ``,
  `§10 — CSS ::after qui génère du contenu structurel`,
  `  → Grep la classe ciblée pour détecter ::before / ::after avant d'ajouter du HTML`,
  `  → Si ::after existe : ajouter une classe modificatrice qui le supprime (.classe--animated::after { content: none })`,
  `  → ATTENTION spécificité : si la règle de suppression vient AVANT la règle originale dans le fichier,`,
  `    elle sera écrasée (même spécificité = ordre gagne). Utiliser double classe pour monter la spécificité.`,
  `    ✅ .sp-lbl.sp-lbl--animated::after (0,2,1) bat .sp-lbl::after (0,1,1)`,
  ``,
  `§11 — WAAPI / useAnimate ne supporte pas les CSS variables`,
  `  → Ne jamais animer var(--color-primary) via useAnimate ou l'API Web Animations`,
  `  → Pour les états stables (open/closed) : CSS transition natif (supporte var())`,
  `  → Pour les animations one-shot (particle) : motion.span avec valeurs hex résolues`,
  ``,
  `Rappel ordre de vérification :`,
  `  1. grep la classe CSS dans studio.css`,
  `  2. lire les pseudo-éléments ::before / ::after`,
  `  3. vérifier la cascade (ordre des règles dans le fichier)`,
  `  4. ALORS seulement éditer`,
];

const TSX_GUARD = [
  `⚠️  MEMORY GUARD — composant TSX modifié`,
  ``,
  `Avant d'éditer, vérifier dans hallucination_patterns.md :`,
  ``,
  `§1 — keys stables dans les listes`,
  `  → Jamais key={idx} sur liste mutable. Utiliser item.id ou combinaison stable.`,
  `  → Exception valide : tableaux de taille FIXE et CONSTANTE (ex: 6 points Braille)`,
  ``,
  `§2 — fuites mémoire Audio`,
  `  → new Audio(url) avec onended → cleanup dans useEffect (pause + onended = null)`,
  ``,
  `§3 — setTimeout sans cleanup`,
  `  → Toujours stocker la ref + clearTimeout dans useEffect cleanup`,
  ``,
  `§7 — localiser par grep du texte visible, jamais par le nom du composant`,
  `  → grep le texte visible exact dans src/ avant toute modification UI`,
  ``,
  `§8 — framer-motion invisible dans les overlays Tauri`,
  `  → Dans les overlays z-index élevé : utiliser HTML natif, pas motion.*`,
  ``,
  `§11 — WAAPI ne supporte pas les CSS variables`,
  `  → useAnimate + var(--color-primary) = ignoré silencieusement`,
  `  → Utiliser CSS transition ou motion.span avec valeurs hex résolues`,
];

const UI_EXTRA = [
  ``,
  `§10 (rappel spécifique ui/) — Vérifier les pseudo-éléments des classes utilisées`,
  `  → Grep la classe CSS avant d'ajouter un élément React qui en duplique la fonction`,
  `  → Ex : .sp-lbl::after génère une ligne grise — ajouter <span> dessus = deux lignes`,
];

// ── Détection de zone ─────────────────────────────────────────────────────────

function getGuard(filePath) {
  const p = filePath.replace(/\\/g, '/');
  if (/src\/styles.*\.css$/.test(p)) {
    return CSS_GUARD;
  }
  if (/src\/components\/ui.*\.tsx?$/.test(p)) {
    return [...TSX_GUARD, ...UI_EXTRA];
  }
  if (/src\/components.*\.tsx?$/.test(p)) {
    return TSX_GUARD;
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

let data = '';
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const input    = JSON.parse(data);
    const filePath = (input.tool_input || {}).file_path || '';
    const guard    = getGuard(filePath);
    if (!guard) return;

    const shortName = filePath.replace(/.*src[/\\]/, 'src/');

    const output = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext: [`📁 ${shortName}`, ...guard].join('\n'),
      },
    };

    process.stdout.write(JSON.stringify(output) + '\n');
  } catch (_) {
    // Échec silencieux — ne jamais bloquer le workflow
  }
});
