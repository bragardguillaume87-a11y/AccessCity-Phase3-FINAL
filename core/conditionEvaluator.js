// core/conditionEvaluator.js
// Évaluation des conditions pour le branching des dialogues

/**
 * Évalue une seule condition
 * @param {Object} condition - {variable, operator, value}
 * @param {import('./variableManager.js').VariableManager} variableManager - Gestionnaire variables
 * @returns {boolean} - True si condition respectée
 */
export function evaluateCondition(condition, variableManager) {
  if (!condition || !condition.variable || !condition.operator) {
    console.warn('[ConditionEvaluator] Invalid condition structure:', condition);
    return false;
  }

  const currentValue = variableManager.get(condition.variable);
  
  if (currentValue === undefined) {
    console.warn('[ConditionEvaluator] Variable not found:', condition.variable);
    return false;
  }

  const compareValue = condition.value;

  // Gestion des types pour la comparaison
  let valA = currentValue;
  let valB = compareValue;

  // Si on compare des nombres, on parse
  if (typeof currentValue === 'number') {
      valB = parseFloat(compareValue);
  } else if (typeof currentValue === 'boolean') {
      // Pour les booléens, on compare souvent avec "true"/"false" string
      if (compareValue === 'true') valB = true;
      else if (compareValue === 'false') valB = false;
  }

  switch (condition.operator) {
    case '>':
      return valA > valB;
    case '>=':
      return valA >= valB;
    case '==':
      // Loose equality pour permettre "50" == 50 si le parsing a échoué ou pour strings
      return valA == valB;
    case '<':
      return valA < valB;
    case '<=':
      return valA <= valB;
    case '!=':
      return valA != valB;
    default:
      console.warn('[ConditionEvaluator] Unknown operator:', condition.operator);
      return false;
  }
}

/**
 * Évalue plusieurs conditions (Logique ET)
 * @param {Array} conditions - Array de {variable, operator, value}
 * @param {import('./variableManager.js').VariableManager} variableManager - Gestionnaire variables
 * @returns {boolean} - True si toutes les conditions sont respectées
 */
export function evaluateConditions(conditions, variableManager) {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return true; // Pas de conditions = toujours vrai (par défaut pour afficher un choix)
  }

  return conditions.every(condition => {
    return evaluateCondition(condition, variableManager);
  });
}
