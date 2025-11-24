// ui/StageDirector.js
export class StageDirector {
    constructor(eventBus, charactersData = null) {
        this.eventBus = eventBus;
        this.charactersData = charactersData;
        
        // Références aux éléments du DOM
        this.appContainer = document.getElementById('app');
        this.dialogueContainer = document.getElementById('dialogues'); // Panel bas de l'éditeur
        
        // Éléments narratifs (Le "Stage")
        this.background = document.getElementById('stage-background');
        this.hud = document.getElementById('stage-hud');
        this.portraitLeft = document.getElementById('character-portrait-left');
        this.portraitRight = document.getElementById('character-portrait-right');
        this.dialogueArea = document.getElementById('dialogue-area');
        
        // État
        this.isPlaying = false;
        this.currentLayoutProfile = null;
        this.exitButton = null;

        this.injectStyles();
        this.setupListeners();
        this.setupExitButton();
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInLeft {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .slide-in-left { animation: slideInLeft 0.5s ease-out forwards; }
            .slide-in-right { animation: slideInRight 0.5s ease-out forwards; }
            .fade-in { animation: fadeIn 1s ease-out forwards; }
        `;
        document.head.appendChild(style);
    }

    setCharactersData(data) {
        this.charactersData = data;
    }

    setupListeners() {
        // Commandes globales
        this.eventBus.on('director:play', () => this.enterPlayMode());
        this.eventBus.on('director:stop', () => this.exitPlayMode());
        this.eventBus.on('ui:layout:applied', (payload) => this.applyLayoutProfile(payload));

        // Raccourci clavier Échap pour quitter
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPlaying) {
                this.eventBus.emit('director:stop');
            }
        });

        // Événements du moteur (Le Cerveau parle, le Régisseur agit)
        this.eventBus.on('engine:dialogue_show', (data) => this.showDialogue(data));
        this.eventBus.on('engine:choices_show', (choices) => this.showChoices(choices));
        this.eventBus.on('engine:scene_end', () => this.exitPlayMode());
        
        // Variables pour le HUD
        this.eventBus.on('variable:changed', (data) => this.updateHUD(data));

        // Écoute des choix utilisateur (depuis l'UI)
        // Le composant DialogueArea émet un événement DOM standard 'choice-selected'
        // Nous devons le capter et le renvoyer au moteur via l'EventBus
        if (this.dialogueArea) {
            this.dialogueArea.addEventListener('choice-selected', (e) => {
                // On transmet le choix au moteur
                // Note: Le moteur attend l'objet choix complet
                // DialogueArea renvoie { choice: ... } dans e.detail
                // Mais le moteur a besoin de savoir QUEL choix a été fait pour avancer.
                // Idéalement, le moteur devrait exposer une méthode selectChoice.
                // Ici, on va tricher un peu et émettre un event que le main.js devra relayer au moteur,
                // OU on connecte le moteur directement ici ? 
                // Pour rester propre : StageDirector gère l'affichage. 
                // L'interaction utilisateur remonte via l'EventBus.
                this.eventBus.emit('player:choice_selected', e.detail.choice);
            });
        }
    }

    applyLayoutProfile(payload) {
        if (!payload) return;
        this.currentLayoutProfile = payload.profile || null;

        const stageVariant = (payload.profile && payload.profile.stageVariant) || 'hidden';
        const dialogueVariant = (payload.profile && payload.profile.dialogueVariant) || 'panel';

        if (document && document.body) {
            document.body.dataset.stageVariant = stageVariant;
        }

        if (this.dialogueArea) {
            this.dialogueArea.setAttribute('data-variant', dialogueVariant);
        }
    }

    setupExitButton() {
        this.exitButton = document.createElement('button');
        this.exitButton.id = 'exit-play-mode-btn';
        this.exitButton.textContent = '⏹ Quitter la lecture';
        this.exitButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 200;
            background: rgba(220, 53, 69, 0.9);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            display: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            transition: background 0.2s;
        `;
        this.exitButton.addEventListener('mouseenter', () => {
            this.exitButton.style.background = 'rgba(200, 35, 51, 0.95)';
        });
        this.exitButton.addEventListener('mouseleave', () => {
            this.exitButton.style.background = 'rgba(220, 53, 69, 0.9)';
        });
        this.exitButton.addEventListener('click', () => {
            this.eventBus.emit('director:stop');
        });
        document.body.appendChild(this.exitButton);
    }

    enterPlayMode() {
        console.log('[StageDirector] Entering Play Mode');
        this.isPlaying = true;

        // Afficher le bouton de sortie
        if (this.exitButton) {
            this.exitButton.style.display = 'block';
        }

        // 1. Cacher l'éditeur
        if (this.appContainer) this.appContainer.style.display = 'none';
        if (this.dialogueContainer) this.dialogueContainer.style.display = 'none';

        // 2. Afficher la scène
        if (this.background) {
            this.background.style.display = 'block';
            this.background.style.backgroundImage = "url('assets/backgrounds/city_street.svg')"; // Default
        }
        if (this.hud) this.hud.style.display = 'block';
        if (this.portraitLeft) this.portraitLeft.style.display = 'block';
        if (this.portraitRight) this.portraitRight.style.display = 'block';
        if (this.dialogueArea) this.dialogueArea.style.display = 'block';

        // Reset visuel
        // Par défaut, on affiche le joueur en 'neutral' s'il existe
        this.portraitLeft.setCharacter('player', 'neutral');
        this.updateCharacterVisual(this.portraitLeft, 'player', 'neutral');
        
        this.portraitRight.setCharacter(null);
        this.dialogueArea.setDialogue('', '');
    }

    resetAnimation(element, animationClass) {
        element.style.animation = 'none';
        element.offsetHeight; // Trigger reflow
        element.style.animation = null;
        element.classList.add(animationClass);
    }

    updateCharacterVisual(portraitElement, charId, mood) {
        let imageSrc = null;
        if (this.charactersData && this.charactersData.characters) {
             const charData = this.charactersData.characters.find(c => c.id === charId);
             if (charData && charData.sprites) {
                 imageSrc = charData.sprites[mood] || charData.sprites['neutral'];
             }
        }
        portraitElement.setCharacter(charId, mood, imageSrc);
    }

    updatePortrait(portraitElement, speakerId, mood, imageSrc, animationClass) {
        portraitElement.setCharacter(speakerId, mood, imageSrc);
        this.resetAnimation(portraitElement, animationClass);
    }

    exitPlayMode() {
        console.log('[StageDirector] Exiting Play Mode');
        this.isPlaying = false;

        // Masquer le bouton de sortie
        if (this.exitButton) {
            this.exitButton.style.display = 'none';
        }

        // 1. Cacher la scène
        if (this.background) this.background.style.display = 'none';
        if (this.hud) this.hud.style.display = 'none';
        if (this.portraitLeft) this.portraitLeft.style.display = 'none';
        if (this.portraitRight) this.portraitRight.style.display = 'none';
        if (this.dialogueArea) this.dialogueArea.style.display = 'none';

        // 2. Réafficher l'éditeur
        if (this.appContainer) this.appContainer.style.display = 'flex';
        // Le dialogueContainer (panel du bas) est géré par le layout, on le laisse masqué par défaut ou géré par uiManager
        // Pour l'instant on le laisse masqué pour ne pas encombrer
    }

    showDialogue(data) {
        if (!this.isPlaying) return;

        // Update Background if specified
        if (data.background && this.background) {
            this.background.style.backgroundImage = `url('${data.background}')`;
        }

        // Mise à jour du texte
        this.dialogueArea.setDialogue(data.speaker, data.text);

        // Mise à jour des portraits
        const speakerId = data.speaker.toLowerCase();
        const mood = data.mood || 'neutral';
        let imageSrc = null;

        if (this.charactersData && this.charactersData.characters) {
            const charData = this.charactersData.characters.find(c => c.id === speakerId);
            if (charData && charData.sprites) {
                imageSrc = charData.sprites[mood] || charData.sprites['neutral'];
            }
        }

        if (speakerId === 'narrator') {
            // Narrateur : on cache les portraits ou on les laisse tels quels ?
        } else if (speakerId === 'player') {
            this.updatePortrait(this.portraitLeft, speakerId, mood, imageSrc, 'slide-in-left');
        } else {
            this.updatePortrait(this.portraitRight, speakerId, mood, imageSrc, 'slide-in-right');
        }
    }

    showChoices(choices) {
        if (!this.isPlaying) return;
        this.dialogueArea.setChoices(choices);
    }

    updateHUD(data) {
        if (!this.hud) return;

        const hudElements = {
            'Moral': {
                value: 'hud-moral-val',
                bar: 'hud-moral-bar'
            },
            'Physique': {
                value: 'hud-physique-val',
                bar: 'hud-physique-bar'
            }
        };

        const hudData = hudElements[data.name];
        if (hudData) {
            const valEl = document.getElementById(hudData.value);
            const barEl = document.getElementById(hudData.bar);
            if (valEl) valEl.textContent = data.value;
            if (barEl) barEl.style.width = `${data.value}%`;
        }
    }
}
