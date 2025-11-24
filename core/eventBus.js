export class EventBus {
  constructor() { this.listeners = new Map(); }
  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);
  }
  emit(event, data) {
    if (this.listeners.has(event)) this.listeners.get(event).forEach(cb => cb(data));
  }
  off(event, callback) {
    if (this.listeners.has(event)) {
      const cbs = this.listeners.get(event).filter(cb => cb !== callback);
      this.listeners.set(event, cbs);
    }
  }
}