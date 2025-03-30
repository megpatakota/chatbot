// MegBot Chat UI - models/user-prefs.js
// User preferences model

class UserPreferences {
    constructor() {
        this.defaults = {
            darkMode: false,
            sidebarCollapsed: false,
            model: 'gpt-3.5-turbo',
            hasApiKey: false,
            apiProvider: 'openai'
        };
        
        this.preferences = this.load();
    }
    
    // Get a preference value
    get(key) {
        return this.preferences[key];
    }
    
    // Set a preference value
    set(key, value) {
        this.preferences[key] = value;
        this.save();
        return value;
    }
    
    // Update multiple preferences at once
    update(newPrefs) {
        this.preferences = { ...this.preferences, ...newPrefs };
        this.save();
        return this.preferences;
    }
    
    // Load preferences from storage
    load() {
        return StorageUtils.loadData(
            StorageUtils.KEYS.USER_PREFERENCES, 
            this.defaults
        );
    }
    
    // Save preferences to storage
    save() {
        return StorageUtils.saveData(
            StorageUtils.KEYS.USER_PREFERENCES, 
            this.preferences
        );
    }
    
    // Reset preferences to defaults
    reset() {
        this.preferences = { ...this.defaults };
        this.save();
        return this.preferences;
    }
}