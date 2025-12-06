export class DialogueList {
  constructor(container, eventBus) {
    this.container = container;
    this.eventBus = eventBus;
  }
  render(dialogues) {
    this.container.innerHTML = dialogues.map(d => `<div class='dialogue'><b>${d.speaker}:</b> ${d.text}</div>`).join('');
  }
}