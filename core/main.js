import { EventBus } from './eventBus.js';
import { loadScenesFromJson } from './jsonSceneLoader.js';
import { loadUiLayoutFromJson } from './uiLayoutLoader.js';
import { sampleScenes, sampleUiLayout } from './sampleData.js';

class AccessCityApp {
  constructor() {
    this.eventBus = new EventBus();
    this.state = { scenes: null, uiLayout: null };
  }
  async init() {
    try {
      this.state.scenes = await loadScenesFromJson('./data/scenes.json', {}) .catch(() => sampleScenes);
      this.state.uiLayout = await loadUiLayoutFromJson('./data/ui_layout.json', {}) .catch(() => sampleUiLayout);
      console.log('App initialized', this.state);
      this.eventBus.emit('ready', this.state);
    } catch (e) { console.error('Init failed', e); }
  }
}
new AccessCityApp().init();