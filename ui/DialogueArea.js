// ui/DialogueArea.js
export class DialogueArea extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._text = "";
        this._speaker = "";
        this._choices = [];
    }

    connectedCallback() {
        if (!this.hasAttribute('data-variant')) {
            this.setAttribute('data-variant', 'panel');
        }
        this.render();
    }

    setDialogue(speaker, text) {
        this._speaker = speaker;
        this._text = text;
        this._choices = []; // Clear choices on new dialogue
        this.render();
    }

    setChoices(choices) {
        this._choices = choices;
        this.render();
    }

    render() {
        const style = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                }
                :host([data-variant="panel-contrast"]) .dialogue-box {
                    background: rgba(30, 30, 30, 0.98);
                    border-color: var(--color-border-strong, #555);
                    backdrop-filter: blur(8px);
                }
                :host([data-variant="stage"]) .dialogue-box {
                    background: rgba(20, 20, 22, 0.95);
                    border: 2px solid var(--color-accent, #0e639c);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(14, 99, 156, 0.25);
                    backdrop-filter: blur(12px);
                    padding: 24px;
                }
                .dialogue-box {
                    background: linear-gradient(135deg, rgba(37, 37, 38, 0.98) 0%, rgba(30, 30, 30, 0.95) 100%);
                    color: var(--color-text-primary, #e0e0e0);
                    padding: 20px;
                    border-radius: var(--radius-lg, 8px);
                    border: 1px solid var(--color-border, #3e3e42);
                    height: 100%;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    box-shadow: var(--shadow-lg, 0 8px 24px rgba(0,0,0,0.5));
                    backdrop-filter: blur(10px);
                }
                .speaker {
                    font-weight: 600;
                    color: var(--color-accent-hover, #1177bb);
                    margin-bottom: 12px;
                    font-size: 1.1em;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
                }
                .text {
                    flex-grow: 1;
                    line-height: 1.6;
                    font-size: 1.05em;
                    margin-bottom: 16px;
                    color: var(--color-text-secondary, #cccccc);
                }
                .choices {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-sm, 8px);
                }
                .choice-btn {
                    background: var(--color-surface, #2d2d30);
                    color: var(--color-text-primary, #e0e0e0);
                    border: 1px solid var(--color-border, #3e3e42);
                    padding: 12px 16px;
                    text-align: left;
                    cursor: pointer;
                    border-radius: var(--radius-md, 6px);
                    transition: all var(--transition-fast, 150ms ease);
                    font-size: 0.95em;
                }
                .choice-btn:hover {
                    background: var(--color-accent, #0e639c);
                    border-color: var(--color-accent-hover, #1177bb);
                    transform: translateX(4px);
                    box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.3));
                }
                .choice-btn:active {
                    background: var(--color-accent-active, #094771);
                }
            </style>
        `;

        let choicesHtml = '';
        if (this._choices && this._choices.length > 0) {
            choicesHtml = `<div class="choices">
                ${this._choices.map((choice, index) => `
                    <button class="choice-btn" data-index="${index}">${choice.text}</button>
                `).join('')}
            </div>`;
        }

        this.shadowRoot.innerHTML = `
            ${style}
            <div class="dialogue-box">
                <div class="speaker">${this._speaker || '???'}</div>
                <div class="text">${this._text || '...'}</div>
                ${choicesHtml}
            </div>
        `;

        // Add event listeners for choices
        this.shadowRoot.querySelectorAll('.choice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                const choice = this._choices[index];
                this.dispatchEvent(new CustomEvent('choice-selected', { 
                    detail: { choice },
                    bubbles: true,
                    composed: true
                }));
            });
        });
    }
}

customElements.define('dialogue-area', DialogueArea);
