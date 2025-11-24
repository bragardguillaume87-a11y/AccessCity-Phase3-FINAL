export class SceneList {
  constructor(container, eventBus) {
    this.container = container;
    this.eventBus = eventBus;
    this.render([]);
  }
  render(scenes) {
    this.container.innerHTML = scenes.map(s => `<div class='scene'>${s.title}</div>`).join('');
  }
}