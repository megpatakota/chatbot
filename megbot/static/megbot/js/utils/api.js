// MegBot Chat UI - utils/api.js
// API calls to the server

class APIService {
    constructor(csrfToken) {
        this.csrfToken = csrfToken;
    }
    
    // Send a message to the chatbot API
    async sendMessage(message, chatId, model = null) {
        try {
            const params = new URLSearchParams({
                'message': message,
                'chat_id': chatId,
                ...(model && { 'model': model })
            });
            
            const response = await fetch('', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': this.csrfToken
                },
                body: params
            });
            
            if (!response.ok) {
                throw new Error('Server error: ' + response.status);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // Save API key
    async saveApiKey(apiKey, provider) {
        try {
            const params = new URLSearchParams({
                'api_key': apiKey,
                'provider': provider
            });
            
            const response = await fetch('/save_api_key/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': this.csrfToken
                },
                body: params
            });
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // Clear chat history on the server
    async clearHistory() {
        try {
            const response = await fetch('/clear_history/', {
                method: 'GET',
                headers: {
                    'X-CSRFToken': this.csrfToken
                }
            });
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // Sync server history with client history
    async syncServerHistory(messages) {
        try {
            // First clear existing history
            await this.clearHistory();
            
            // In a real implementation, you would now send the messages to rebuild the conversation
            console.log('Server history cleared, would now sync', messages);
            
            return { status: 'success' };
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
}