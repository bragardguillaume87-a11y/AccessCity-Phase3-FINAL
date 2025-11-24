export class UIManager {
    constructor(appContainer) {
        this.appContainer = appContainer;
        this.panelComponents = new Map();
        this.currentLayoutName = null;
    }

    applyLayout(uiLayoutData, requestedLayout) {
        if (!uiLayoutData || !uiLayoutData.layouts) {
            console.warn('Aucune donnée de disposition fournie');
            return null;
        }

        const layouts = uiLayoutData.layouts;
        const fallbackLayoutName = uiLayoutData.defaultLayout || Object.keys(layouts)[0];
        const targetLayoutName = layouts[requestedLayout] ? requestedLayout : fallbackLayoutName;
        const layoutDefinition = layouts[targetLayoutName];

        if (!layoutDefinition) {
            console.warn(`Disposition introuvable: ${targetLayoutName}`);
            return null;
        }

        const panelDefinitions = Array.isArray(layoutDefinition.panels) ? layoutDefinition.panels : [];
        console.log(`Application de la disposition "${targetLayoutName}" (${panelDefinitions.length} panneaux)`);

        panelDefinitions.forEach((panelConfig) => this.configurePanel(panelConfig));

        this.currentLayoutName = targetLayoutName;
        if (this.appContainer) {
            this.appContainer.dataset.layout = targetLayoutName;
        }

        return targetLayoutName;
    }

    configurePanel(panelConfig) {
        if (!panelConfig || !panelConfig.id) {
            return;
        }

        const panelElement = document.getElementById(panelConfig.id);
        if (!panelElement) {
            console.warn(`Panel #${panelConfig.id} introuvable dans le DOM`);
            return;
        }

        if (panelConfig.visible !== undefined) {
            panelElement.style.display = panelConfig.visible ? '' : 'none';
        }

        if (panelConfig.width !== undefined) {
            panelElement.style.width = panelConfig.width > 0 ? `${panelConfig.width}px` : '0px';
        } else {
            panelElement.style.width = '';
        }

        if (panelConfig.height !== undefined) {
            panelElement.style.height = panelConfig.height > 0 ? `${panelConfig.height}px` : '0px';
        } else {
            panelElement.style.height = '';
        }

        if (panelConfig.flex !== undefined) {
            panelElement.style.flex = panelConfig.flex;
        } else {
            panelElement.style.flex = '';
        }

        if (panelConfig.position) {
            panelElement.setAttribute('data-position', panelConfig.position);
        }

        console.log(`  - Panel #${panelConfig.id} configuré`);
    }

    registerPanel(id, component) {
        this.panelComponents.set(id, component);
    }

    getPanel(id) {
        return this.panelComponents.get(id);
    }

    getCurrentLayoutName() {
        return this.currentLayoutName;
    }
}
