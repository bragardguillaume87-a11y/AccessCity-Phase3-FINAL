export class DevToolsPanel {
  constructor(container, eventBus) {
    this.container = container;
    this.eventBus = eventBus;
    eventBus.on('ready', (state) => this.log('Ready', state));
  }
  log(msg, data) { console.log(`[DevTools] ${msg}`, data); }
}