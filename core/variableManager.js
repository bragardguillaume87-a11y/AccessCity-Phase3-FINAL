// core/variableManager.js
// Gestion des variables narratives typées avec ranges et validation

export class VariableManager {
  /**
   * @param {import('./eventBus.js').EventBus} eventBus - Optionnel, pour notifier les changements
   */
  constructor(eventBus = null) {
    this.variables = new Map();
    this.eventBus = eventBus;
  }

  /**
   * Définit une nouvelle variable
   * @param {string} name - Nom unique
   * @param {'number'|'boolean'|'string'} type - Type de la variable
   * @param {any} defaultValue - Valeur par défaut
   * @param {number|null} min - Minimum (pour numbers)
   * @param {number|null} max - Maximum (pour numbers)
   */
  define(name, type, defaultValue, min = null, max = null) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error('Variable name must be non-empty string');
    }
    
    const allowedTypes = ['number', 'boolean', 'string'];
    if (!allowedTypes.includes(type)) {
      throw new Error('Type must be number, boolean or string');
    }

    // Validation initiale de la valeur par défaut
    if (type === 'number' && typeof defaultValue !== 'number') throw new Error(`Default value for ${name} must be a number`);
    if (type === 'boolean' && typeof defaultValue !== 'boolean') throw new Error(`Default value for ${name} must be a boolean`);
    if (type === 'string' && typeof defaultValue !== 'string') throw new Error(`Default value for ${name} must be a string`);

    this.variables.set(name, {
      type,
      value: defaultValue,
      defaultValue,
      min,
      max
    });
  }

  /**
   * Récupère la valeur d'une variable
   * @param {string} name 
   * @returns {any}
   */
  get(name) {
    const variable = this.variables.get(name);
    return variable ? variable.value : undefined;
  }

  /**
   * Modifie la valeur d'une variable avec validation et clamp
   * @param {string} name 
   * @param {any} value 
   */
  set(name, value) {
    const variable = this.variables.get(name);
    if (!variable) {
      console.warn(`Variable '${name}' not defined`);
      return;
    }

    let finalValue = value;

    // Validation de type et Clamp
    if (variable.type === 'number') {
      if (typeof finalValue !== 'number') {
        finalValue = parseFloat(finalValue);
        if (isNaN(finalValue)) {
          console.warn(`Invalid number value for '${name}':`, value);
          return;
        }
      }
      
      if (variable.min !== null && finalValue < variable.min) {
        finalValue = variable.min;
      }
      if (variable.max !== null && finalValue > variable.max) {
        finalValue = variable.max;
      }
    } else if (variable.type === 'boolean') {
        if (typeof finalValue !== 'boolean') {
            // Conversion permissive pour boolean (ex: "true", 1 -> true)
            finalValue = String(finalValue) === 'true' || finalValue === '1' || finalValue === 1 || finalValue === true;
        }
    } else if (variable.type === 'string') {
        finalValue = String(finalValue);
    }

    const oldValue = variable.value;
    variable.value = finalValue;

    // Notification via EventBus si la valeur a changé
    if (this.eventBus && oldValue !== finalValue) {
        this.eventBus.emit('variable:changed', { name, value: finalValue, oldValue });
    }
  }

  /**
   * Incrémente une variable numérique
   * @param {string} name 
   * @param {number} delta 
   */
  increment(name, delta) {
    const current = this.get(name);
    if (typeof current !== 'number') {
      console.warn(`Cannot increment non-number variable '${name}'`);
      return;
    }
    this.set(name, current + delta);
  }

  /**
   * Réinitialise une variable à sa valeur par défaut
   * @param {string} name 
   */
  reset(name) {
    const variable = this.variables.get(name);
    if (variable) {
      this.set(name, variable.defaultValue);
    }
  }

  /**
   * Récupère toutes les variables (pour export ou debug)
   * @returns {Object}
   */
  getAll() {
    const entries = {};
    this.variables.forEach((value, key) => {
      entries[key] = { ...value };
    });
    return entries;
  }

  /**
   * Récupère les définitions complètes (pour UI debug)
   */
  getDefinitions() {
      const defs = {};
      this.variables.forEach((v, k) => defs[k] = { ...v });
      return defs;
  }

  /**
   * Exporte l'état actuel en JSON
   */
  exportToJSON() {
    const data = {};
    this.variables.forEach((variable, name) => {
      data[name] = {
        type: variable.type,
        value: variable.value,
        defaultValue: variable.defaultValue,
        min: variable.min,
        max: variable.max
      };
    });
    return JSON.stringify(data, null, 2);
  }

  /**
   * Importe des définitions et valeurs depuis JSON
   * @param {string} jsonString 
   */
  importFromJSON(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        this.variables.clear();
        
        Object.keys(data).forEach(name => {
          const variable = data[name];
          this.define(
            name,
            variable.type,
            variable.defaultValue,
            variable.min,
            variable.max
          );
          // On utilise set pour bénéficier du clamp si jamais le JSON est hors bornes
          this.set(name, variable.value);
        });
        return true;
    } catch (e) {
        console.error('Failed to import variables from JSON:', e);
        return false;
    }
  }
}
