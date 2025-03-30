// MegBot Chat UI - models/chat-model.js
// Chat data structure model

class ChatModel {
    constructor() {
        this.chats = this.loadChats();
        this.currentChatId = null;
    }
    
    // Load chats from storage
    loadChats() {
        return StorageUtils.loadData(StorageUtils.KEYS.CHATS, []);
    }
    
    // Save chats to storage
    saveChats() {
        return StorageUtils.saveData(StorageUtils.KEYS.CHATS, this.chats);
    }
    
    // Get current chat
    getCurrentChat() {
        if (!this.currentChatId) return null;
        return this.chats.find(chat => chat.id === this.currentChatId);
    }
    
    // Set current chat
    setCurrentChat(chatId) {
        this.currentChatId = chatId;
        return this.getCurrentChat();
    }
    
    // Create a new chat
    createChat() {
        const newChatId = 'chat_' + Date.now();
        
        const newChat = {
            id: newChatId,
            title: 'New Chat',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            messages: []
        };
        
        this.chats.unshift(newChat);
        this.currentChatId = newChatId;
        this.saveChats();
        
        return newChat;
    }
    
    // Add a message to the current chat
    addMessage(content, role) {
        if (!this.currentChatId) {
            this.createChat();
        }
        
        const chat = this.getCurrentChat();
        if (!chat) return null;
        
        const message = {
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        chat.messages.push(message);
        chat.updated = new Date().toISOString();
        
        // Update title with first user message if it's a new chat
        if (role === 'user' && chat.title === 'New Chat' && chat.messages.length === 1) {
            chat.title = content.length > 30 ? content.substring(0, 30) + '...' : content;
        }
        
        this.saveChats();
        return message;
    }
    
    // Delete a chat
    deleteChat(chatId) {
        this.chats = this.chats.filter(chat => chat.id !== chatId);
        
        if (this.currentChatId === chatId) {
            this.currentChatId = this.chats.length > 0 ? this.chats[0].id : null;
        }
        
        this.saveChats();
        return this.currentChatId;
    }
    
    // Clear messages in the current chat
    clearCurrentChat() {
        const chat = this.getCurrentChat();
        if (!chat) return false;
        
        chat.messages = [];
        chat.title = 'New Chat';
        chat.updated = new Date().toISOString();
        
        this.saveChats();
        return true;
    }
}