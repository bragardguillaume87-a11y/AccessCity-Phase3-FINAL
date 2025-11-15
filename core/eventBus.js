// core/eventBus.js
// Pattern Pub/Sub pour communication decouple entre composants
// Version 2.1 - Phase 3 (corrections QA)
// ASCII strict : ' et " uniquement

  import { EVENT_BUS_CONFIG } from './constants.js';

  /**
 * EventBus - Pattern Pub/Sub pour decouplage complet
 * 
 * Permet aux composants de communiquer sans dependances directes
 * 
 * Nouveautes v2.1:
 * - FIX: once() preserve contexte this
 * - once() pour ecoute unique
 * - listenerCount() ameliore (total ou par event)
 * - Mode debug optionnel
 * - off() robuste
 * 
 * @example
 * import eventBus from './core/eventBus.js';
 * 
 * // S'abonner a un evenement
 * const callback = (data) => console.log(data);
 * eventBus.subscribe('sceneCreated', callback);
 * 
 * // Publier un evenement
 * eventBus.publish('sceneCreated', { id: 'scene1', name: 'Intro' });
 * 
 * // Se desabonner
 * eventBus.unsubscribe('sceneCreated', callback);
 * 
 * // Ecoute unique
 * eventBus.once('gameStarted', (data) => console.log('Demarrage', data));
 * 
 * // Mode debug
 * eventBus.debug = true;
 */
  class EventBus {
  constructor() {
    // Map: eventName => Set(callback)
    this.listeners = new Map();
    
    // Flag debug (false par defaut)
    this.debug = false;
  }
  
  /**
   * S'abonner a un evenement
   * @param {string} event - Nom de l'evenement
   * @param {Function} callback - Fonction a appeler quand l'evenement est publie
   * @throws {Error} Si l'evenement ou le callback est invalide
   */
  subscribe(event, callback) {
    if (typeof event !== 'string' || !event.trim()) {
      throw new Error('[EventBus] Le nom de l\'evenement doit etre une chaine non vide');
    }
    
    if (typeof callback !== 'function') {
      throw new Error('[EventBus] Le callback doit etre une fonction');
    }
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const callbacks = this.listeners.get(event);
    
    // Verifier limite listeners
    if (callbacks.size >= EVENT_BUS_CONFIG.MAX_LISTENERS_PER_EVENT) {
      console.warn(`[EventBus] ${event} a atteint la limite de ${EVENT_BUS_CONFIG.MAX_LISTENERS_PER_EVENT} listeners`);
    }
    
    callbacks.add(callback);
    
    if (this.debug) {
      console.log(`[EventBus:DEBUG] subscribe '${event}' -> ${callbacks.size} listener(s)`);
    }
  }
  
  /**
   * S'abonner a un evenement pour UNE SEULE invocation (auto-desabonnement)
   * Preserve le contexte this du callback original
   * @param {string} event - Nom de l'evenement
   * @param {Function} callback - Fonction a appeler une seule fois
   */
  once(event, callback) {
    // CORRECTION QA: Preserver contexte this avec Function.prototype.call
    const wrapper = (data) => {
      // Appeler callback avec son contexte original
      callback.call(this, data);
      this.unsubscribe(event, wrapper);
    };
    
    // Stocker reference callback original pour debugage
    wrapper.originalCallback = callback;
    
    this.subscribe(event, wrapper);
  }
  
  /**
   * Se desabonner d'un evenement
   * @param {string} event - Nom de l'evenement
   * @param {Function} callback - Fonction a retirer
   */
  unsubscribe(event, callback) {
    if (!this.listeners.has(event)) {
      return; // Silencieux si event inexistant
    }
    
    const callbacks = this.listeners.get(event);
    callbacks.delete(callback);
    
    // Nettoyer si plus de listeners
    if (callbacks.size === 0) {
      this.listeners.delete(event);
    }
    
    if (this.debug) {
      console.log(`[EventBus:DEBUG] unsubscribe '${event}' -> ${callbacks.size} listener(s) restant(s)`);
    }
  }
  
  /**
   * Alias robuste de unsubscribe
   * @param {string} event - Nom de l'evenement
   * @param {Function} callback - Fonction a retirer
   */
  off(event, callback) {
    this.unsubscribe(event, callback);
  }
  
  /**
   * Publier un evenement
   * @param {string} event - Nom de l'evenement
   * @param {*} data - Donnees a transmettre aux listeners
   */
  publish(event, data) {
    if (!this.listeners.has(event)) {
      if (this.debug) {
        console.log(`[EventBus:DEBUG] publish '${event}' -> 0 listener (event non ecoute)`);
      }
      return;
    }
    
    const callbacks = this.listeners.get(event);
    
    if (this.debug) {
      console.log(`[EventBus:DEBUG] publish '${event}' -> ${callbacks.size} listener(s)`);
    }
    
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventBus] Erreur dans listener ${event}:`, error);
      }
    });
  }
  
  /**
   * Obtenir le nombre de listeners
   * @param {string} [event] - Nom de l'evenement (optionnel)
   * @returns {number} Nombre de listeners (pour event specifique ou total)
   */
  listenerCount(event) {
    if (event !== undefined) {
      // Compte pour un event specifique
      return this.listeners.has(event) ? this.listeners.get(event).size : 0;
    } else {
      // Compte total tous events
      let total = 0;
      this.listeners.forEach(callbacks => {
        total += callbacks.size;
      });
      return total;
    }
  }
  
  /**
   * Alias de listenerCount (retrocompatibilite)
   * @param {string} event - Nom de l'evenement
   * @returns {number} Nombre de listeners
   */
  getListenerCount(event) {
    return this.listenerCount(event);
  }
  
  /**
   * Retirer tous les listeners d'un evenement
   * @param {string} [event] - Nom de l'evenement (optionnel, sinon tous)
   */
  clear(event) {
    if (event) {
      this.listeners.delete(event);
      
      if (this.debug) {
        console.log(`[EventBus:DEBUG] clear '${event}'`);
      }
    } else {
      this.listeners.clear();
      
      if (this.debug) {
        console.log('[EventBus:DEBUG] clear ALL events');
      }
    }
  }
  
  /**
   * Obtenir tous les evenements enregistres
   * @returns {Array<string>} Liste des noms d'evenements
   */
  getEvents() {
    return Array.from(this.listeners.keys());
  }
  }

// Singleton
  const eventBus = new EventBus();

  export default eventBus;
