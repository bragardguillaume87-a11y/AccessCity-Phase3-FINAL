export class SceneList {
    constructor(container, eventBus) {
        this.container = container;
        this.eventBus = eventBus;
        this.selectedSceneId = null;
        this.scenes = [];
        this.render([]);
    }

    render(scenes) {
        this.scenes = scenes;
        this.container.innerHTML = `
            <h3>Mes Scènes</h3>
            <button id="add-scene-btn" style="width:100%; padding:8px; margin-bottom:10px; background:#444;">+ Créer une nouvelle scène</button>
            <div id="scenes-container">
                ${scenes.map(s => `
                    <div class="scene-item ${s.id === this.selectedSceneId ? 'active' : ''}" data-id="${s.id}">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div style="flex:1;">
                                <strong>${s.title || 'Sans titre'}</strong>
                                ${s.description ? `<div style="font-size:0.9em;opacity:0.7; margin-top:4px;">${s.description.substring(0, 50)}${s.description.length > 50 ? '...' : ''}</div>` : ''}
                                <div style="font-size:0.8em; color:#666; margin-top:2px;">ID: ${s.id}</div>
                            </div>
                            <button class="play-scene-btn" data-id="${s.id}" style="background:#4CAF50; padding:6px 12px; font-size:12px; margin-left:8px;" title="Lire cette scène">▶</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        const addBtn = this.container.querySelector('#add-scene-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                console.log('Add Scene button clicked');
                this.eventBus.emit('scene:create');
            });
        }

        this.container.querySelectorAll('.scene-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('play-scene-btn')) return;
                const sceneId = item.getAttribute('data-id');
                this.selectedSceneId = sceneId;
                const scene = scenes.find(s => s.id === sceneId);
                this.eventBus.emit('scene:select', scene);
                this.render(scenes);
            });

            item.addEventListener('dblclick', (e) => {
                if (e.target.classList.contains('play-scene-btn')) return;
                const sceneId = item.getAttribute('data-id');
                const scene = scenes.find(s => s.id === sceneId);
                if (scene) {
                    this.eventBus.emit('director:play_scene', scene);
                }
            });
        });

        this.container.querySelectorAll('.play-scene-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sceneId = btn.getAttribute('data-id');
                const scene = scenes.find(s => s.id === sceneId);
                if (scene) {
                    this.eventBus.emit('director:play_scene', scene);
                }
            });
        });
    }
}
