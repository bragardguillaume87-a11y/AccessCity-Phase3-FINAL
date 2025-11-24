export class StateJournal {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = 50;
    }

    record(action, data) {
        const entry = {
            timestamp: new Date().toISOString(),
            action: action,
            data: JSON.parse(JSON.stringify(data))
        };

        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        this.history.push(entry);
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.currentIndex = this.history.length - 1;
        } else {
            this.currentIndex++;
        }

        console.log(`[Journal] ${action}`, data);
    }

    canUndo() {
        return this.currentIndex > 0;
    }

    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    undo() {
        if (this.canUndo()) {
            this.currentIndex--;
            return this.history[this.currentIndex];
        }
        return null;
    }

    redo() {
        if (this.canRedo()) {
            this.currentIndex++;
            return this.history[this.currentIndex];
        }
        return null;
    }

    getHistory() {
        return this.history;
    }

    exportToJson() {
        return {
            history: this.history,
            currentIndex: this.currentIndex,
            exportDate: new Date().toISOString()
        };
    }

    importFromJson(journalData) {
        if (journalData && journalData.history) {
            this.history = journalData.history;
            this.currentIndex = journalData.currentIndex || this.history.length - 1;
            console.log(`[Journal] Imported ${this.history.length} entries`);
        }
    }
}
