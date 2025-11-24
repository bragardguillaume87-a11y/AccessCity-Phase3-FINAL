// ui/CharacterPortrait.js
export class CharacterPortrait extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['character-id', 'mood', 'alignment', 'image-src']; // alignment: left/right
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    setCharacter(characterId, mood = 'neutral', imageSrc = null) {
        this.setAttribute('character-id', characterId);
        this.setAttribute('mood', mood);
        if (imageSrc) {
            this.setAttribute('image-src', imageSrc);
        } else {
            this.removeAttribute('image-src');
        }
    }

    render() {
        const charId = this.getAttribute('character-id');
        const mood = this.getAttribute('mood') || 'neutral';
        const alignment = this.getAttribute('alignment') || 'left';
        const imageSrc = this.getAttribute('image-src');

        // Placeholder style
        const style = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    pointer-events: none; /* Let clicks pass through if transparent */
                }
                .portrait-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: flex-end;
                    justify-content: ${alignment === 'right' ? 'flex-end' : 'flex-start'};
                }
                .sprite {
                    max-height: 100%;
                    max-width: 100%;
                    /* Placeholder visual */
                    /* background-color: ${charId && !imageSrc ? '#ccc' : 'transparent'}; */
                    /* border: ${charId && !imageSrc ? '2px solid #333' : 'none'}; */
                    min-width: 100px;
                    min-height: 200px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: monospace;
                    font-size: 1.2em;
                    color: #333;
                }
                .sprite img {
                    max-height: 100%;
                    max-width: 100%;
                    object-fit: contain;
                }
            </style>
        `;

        let content = '';
        if (charId) {
            if (imageSrc) {
                content = `
                    <div class="portrait-container">
                        <div class="sprite">
                            <img src="${imageSrc}" alt="${charId} - ${mood}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'padding:20px; border:2px solid red; background:#fee;\\'>Image Error<br>${charId}</div>'">
                        </div>
                    </div>
                `;
            } else {
                content = `
                    <div class="portrait-container">
                        <div class="sprite" style="background-color: #ccc; border: 2px solid #333;">
                            <div>
                                <strong>${charId}</strong><br>
                                (${mood})
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        this.shadowRoot.innerHTML = `${style}${content}`;
    }
}

customElements.define('character-portrait', CharacterPortrait);
