export class InspectorPanel {
  constructor(container) { this.container = container; }
  update(data) { this.container.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`; }
}