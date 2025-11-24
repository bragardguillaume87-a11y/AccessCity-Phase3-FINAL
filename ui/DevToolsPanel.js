export class DevToolsPanel {
  constructor(container, eventBus, variableManager) {
    this.container = container;
    this.eventBus = eventBus;
    this.variableManager = variableManager;

    this.render();

    if (this.eventBus) {
      this.eventBus.on('variable:changed', (data) => {
        this.updateVariableUI(data.name, data.value);
      });
      this.eventBus.on('ui:layout:applied', (payload) => {
        this.applyLayoutProfile(payload);
      });
    }
  }

  render() {
    this.container.innerHTML = `
      <h3>DevTools</h3>
      <div class="variables-section">
        <h4>Narrative Variables</h4>
        <table style="width:100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="text-align:left; border-bottom: 1px solid #555;">
              <th>Name</th>
              <th>Value</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody id="variables-list">
            ${this.renderVariablesList()}
          </tbody>
        </table>
        <button id="refresh-vars-btn" style="margin-top:10px; width:100%;">Refresh</button>
      </div>
    `;

    this.attachEventListeners();
  }

  renderVariablesList() {
    if (!this.variableManager) return '<tr><td colspan="3">No Variable Manager</td></tr>';

    const variables = this.variableManager.getAll();
    return Object.entries(variables).map(([name, def]) => {
      return `
        <tr data-var="${name}">
          <td style="padding: 4px;">${name}</td>
          <td style="padding: 4px;">
            ${this.renderInput(name, def)}
          </td>
          <td style="padding: 4px; color: #888;">${def.type}</td>
        </tr>
      `;
    }).join('');
  }

  renderInput(name, def) {
    if (def.type === 'boolean') {
      return `<input type="checkbox" class="var-input" data-name="${name}" ${def.value ? 'checked' : ''}>`;
    } else if (def.type === 'number') {
      return `<input type="number" class="var-input" data-name="${name}" value="${def.value}" style="width: 60px;" ${def.min !== null ? `min="${def.min}"` : ''} ${def.max !== null ? `max="${def.max}"` : ''}>`;
    } else {
      return `<input type="text" class="var-input" data-name="${name}" value="${def.value}" style="width: 80px;">`;
    }
  }

  attachEventListeners() {
    this.container.querySelectorAll('.var-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const name = e.target.getAttribute('data-name');
        let value;
        if (e.target.type === 'checkbox') {
          value = e.target.checked;
        } else if (e.target.type === 'number') {
          value = parseFloat(e.target.value);
        } else {
          value = e.target.value;
        }
        
        console.log(`[DevTools] Setting ${name} to`, value);
        this.variableManager.set(name, value);
      });
    });

    const refreshBtn = this.container.querySelector('#refresh-vars-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        const tbody = this.container.querySelector('#variables-list');
        if (tbody) tbody.innerHTML = this.renderVariablesList();
        this.attachEventListeners(); // Re-attach for new inputs
      });
    }
  }

  updateVariableUI(name, value) {
    const input = this.container.querySelector(`.var-input[data-name="${name}"]`);
    if (input) {
      if (input.type === 'checkbox') {
        input.checked = value;
      } else {
        input.value = value;
      }
      // Highlight change
      const row = input.closest('tr');
      if (row) {
        row.style.backgroundColor = '#444';
        setTimeout(() => row.style.backgroundColor = 'transparent', 500);
      }
    }
  }

  applyLayoutProfile(payload) {
    if (!payload || !payload.profile) return;
    const mode = payload.profile.devtoolsPanel || 'balanced';
    this.container.dataset.mode = mode;

    const header = this.container.querySelector('h3');
    if (header) {
      header.dataset.modeLabel = mode;
      header.title = `Disposition actuelle : ${payload.name}`;
    }

    if (mode === 'hidden') {
      this.container.setAttribute('aria-hidden', 'true');
    } else {
      this.container.removeAttribute('aria-hidden');
    }
  }
}