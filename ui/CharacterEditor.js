export class CharacterEditor {
    constructor(container, eventBus, charactersData) {
        this.container = container;
        this.eventBus = eventBus;
        this.charactersData = charactersData;
        this.selectedCharId = null;

        this.render();
    }

    render() {
        if (!this.charactersData) return;

        const listHtml = this.charactersData.characters.map(char => `
            <div class="char-item ${char.id === this.selectedCharId ? 'active' : ''}" data-id="${char.id}">
                <strong>${char.name}</strong>
            </div>
        `).join('');

        this.container.innerHTML = `
            <div style="display:flex; height:100%;">
                <!-- Liste des personnages -->
                <div style="width:250px; border-right:1px solid #333; overflow-y:auto; padding:10px;">
                    <h3>Mes Personnages</h3>
                    <div id="char-list">${listHtml}</div>
                    <button id="btn-add-char" style="width:100%; margin-top:10px; padding:8px; background:#444;">+ Créer un personnage</button>
                </div>

                <!-- Formulaire d'édition -->
                <div style="flex:1; padding:20px; overflow-y:auto;" id="char-form">
                    ${this.selectedCharId ? this.renderForm() : '<p style="color:#888; text-align:center; margin-top:50px;">Sélectionnez un personnage dans la liste pour le modifier.</p>'}
                </div>
            </div>
        `;

        this.attachListeners();
    }

    renderForm() {
        const char = this.charactersData.characters.find(c => c.id === this.selectedCharId);
        if (!char) return '';

        // Génération des champs pour les sprites (humeurs)
        const moods = ['neutral', 'happy', 'sad', 'thoughtful', 'angry', 'surprised'];
        const moodLabels = {
            'neutral': 'Neutre (Défaut)',
            'happy': 'Joyeux',
            'sad': 'Triste',
            'thoughtful': 'Pensif',
            'angry': 'En colère',
            'surprised': 'Surpris'
        };

        const spritesHtml = moods.map(mood => {
            const currentVal = char.sprites[mood] || '';
            return `
                <div style="margin-bottom:10px; border-bottom:1px solid #444; padding-bottom:10px;">
                    <label style="display:inline-block; width:120px; font-weight:bold;">${moodLabels[mood] || mood}:</label>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <input type="text" class="sprite-input" data-mood="${mood}" value="${currentVal}" placeholder="(Laissez vide ou utilisez le bouton dossier)" style="flex:1; padding:5px; background:#1e1e1e; border:1px solid #333; color:#ddd;">
                        <label class="file-upload-btn" style="cursor:pointer; background:#444; padding:5px 10px; border-radius:4px;" title="Choisir une image depuis votre ordinateur">
                            📂
                            <input type="file" class="sprite-file" data-mood="${mood}" accept="image/*" style="display:none;">
                        </label>
                    </div>
                    <div style="margin-top:5px;">
                        ${currentVal ? `<img src="${currentVal}" height="60" style="vertical-align:middle; border:1px solid #555; background:#000;">` : '<small style="color:#666;">Aucune image définie</small>'}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <h2>Modifier : ${char.name}</h2>
            <div style="margin-bottom:15px;">
                <label style="display:block; color:#aaa; margin-bottom:5px;">Nom affiché en jeu :</label>
                <input type="text" id="edit-char-name" value="${char.name}" style="width:100%; padding:8px; font-size:1.1em;">
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block; color:#aaa; margin-bottom:5px;">Notes sur le personnage :</label>
                <textarea id="edit-char-desc" rows="2" style="width:100%; padding:8px;">${char.description || ''}</textarea>
            </div>
            
            <h3 style="margin-top:30px;">Galerie d'images</h3>
            <p style="color:#aaa; font-size:0.9em; margin-bottom:15px;">Choisissez une image pour chaque émotion du personnage. Ces images s'afficheront automatiquement lors des dialogues.</p>
            <div style="background:#252526; padding:15px; border-radius:4px;">
                ${spritesHtml}
            </div>
        `;
    }

    validateInput(value, type) {
        if (type === 'name') {
            return value.trim().length > 0;
        } else if (type === 'sprite') {
            return value.trim().length === 0 || value.startsWith('data:image/') || value.startsWith('http');
        }
        return true;
    }

    attachListeners() {
        // Sélection dans la liste
        this.container.querySelectorAll('.char-item').forEach(el => {
            el.addEventListener('click', () => {
                this.selectedCharId = el.dataset.id;
                this.render();
            });
        });

        // Ajout personnage
        const btnAdd = this.container.querySelector('#btn-add-char');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                const newId = 'char_' + Date.now();
                this.charactersData.characters.push({
                    id: newId,
                    name: "Nouveau Perso",
                    description: "",
                    sprites: { "neutral": "" },
                    moods: ["neutral"]
                });
                this.selectedCharId = newId;
                this.eventBus.emit('character:update', this.charactersData);
                this.render();
            });
        }

        // Modification Nom/Desc
        const nameInput = this.container.querySelector('#edit-char-name');
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                const char = this.charactersData.characters.find(c => c.id === this.selectedCharId);
                if (char) {
                    if (this.validateInput(e.target.value, 'name')) {
                        char.name = e.target.value;
                        this.eventBus.emit('character:update', this.charactersData);
                    } else {
                        alert('Le nom ne peut pas être vide.');
                    }
                }
            });
        }

        // Modification Sprites
        this.container.querySelectorAll('.sprite-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const char = this.charactersData.characters.find(c => c.id === this.selectedCharId);
                if (char) {
                    const mood = e.target.dataset.mood;
                    if (this.validateInput(e.target.value, 'sprite')) {
                        char.sprites[mood] = e.target.value;

                        // Mise à jour de la liste des moods supportés
                        if (!char.moods.includes(mood) && e.target.value) {
                            char.moods.push(mood);
                        }
                        this.eventBus.emit('character:update', this.charactersData);
                        this.render(); // Re-render pour afficher la preview
                    } else {
                        alert('L\'URL de l\'image est invalide.');
                    }
                }
            });
        });

        // Upload Image (Base64)
        this.container.querySelectorAll('.sprite-file').forEach(input => {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (evt) => {
                    const base64 = evt.target.result;
                    const mood = e.target.dataset.mood;

                    // Update data
                    const char = this.charactersData.characters.find(c => c.id === this.selectedCharId);
                    if (char) {
                        if (this.validateInput(base64, 'sprite')) {
                            char.sprites[mood] = base64;
                            if (!char.moods.includes(mood)) char.moods.push(mood);
                            this.eventBus.emit('character:update', this.charactersData);
                            this.render();
                        } else {
                            alert('Le fichier image est invalide.');
                        }
                    }
                };
                reader.readAsDataURL(file);
            });
        });
    }
}
