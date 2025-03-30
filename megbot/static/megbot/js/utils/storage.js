// MegBot Chat UI - utils/storage.js
// Local storage operations

const StorageUtils = {
    // Keys used for localStorage
    KEYS: {
        USER_PREFERENCES: 'megbot_preferences',
        CHATS: 'megbot_chats'
    },
    
    // Save data to localStorage
    saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error saving data to localStorage (${key}):`, error);
            return false;
        }
    },
    
    // Load data from localStorage
    loadData(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error loading data from localStorage (${key}):`, error);
            return defaultValue;
        }
    },
    
    // Clear data from localStorage
    clearData(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error clearing data from localStorage (${key}):`, error);
            return false;
        }
    }
};