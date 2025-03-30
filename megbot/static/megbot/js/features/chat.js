// MegBot Chat UI - features/chat.js
// Chat functionality

class ChatManager {
    constructor(domElements, chatModel, userPrefs, apiService, sidebarManager) {
        this.elements = domElements;
        this.chatModel = chatModel;
        this.userPrefs = userPrefs;
        this.apiService = apiService;
        this.sidebarManager = sidebarManager;
        
        // State
        this.firstMessage = true;
        
        // Bind handlers to this instance
        this.handleSubmitMessage = this.handleSubmitMessage.bind(this);
        this.handleClearChat = this.handleClearChat.bind(this);
        this.handleInputKeydown = this.handleInputKeydown.bind(this);
        
        // Set up event listeners
        this.elements.messageForm.addEventListener('submit', this.handleSubmitMessage);
        this.elements.clearButton.addEventListener('click', this.handleClearChat);
        this.elements.userInput.addEventListener('keydown', this.handleInputKeydown);
        
        // If no current chat exists, create one
        if (!this.chatModel.currentChatId && this.chatModel.chats.length > 0) {
            this.chatModel.setCurrentChat(this.chatModel.chats[0].id);
            this.loadChat(this.chatModel.currentChatId);
        } else if (!this.chatModel.currentChatId) {
            this.createNewChat();
        }
    }
    
    // Handle message submission
    handleSubmitMessage(e) {
        e.preventDefault();
        
        // Check if API key is set
        if (!this.userPrefs.get('hasApiKey') && this.elements.apiKeyOverlay) {
            this.elements.apiKeyOverlay.classList.remove('hidden');
            return; // Prevent message from being sent
        }
        
        const message = this.elements.userInput.value.trim();
        if (!message) return;
        
        // Remove welcome message if this is the first message
        if (this.firstMessage) {
            this.elements.chatContainer.innerHTML = '';
            this.firstMessage = false;
        }
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Add message to the model
        this.chatModel.addMessage(message, 'user');
        
        // Update the sidebar
        this.sidebarManager.renderChatsList();
        
        // Clear input field
        this.elements.userInput.value = '';
        
        // Show thinking indicator
        const thinkingElement = this.addThinkingIndicator();
        
        // Disable send button
        this.elements.sendButton.disabled = true;
        
        // Get selected model
        const selectedModel = this.elements.modelSelector ? 
            this.elements.modelSelector.value : null;
        
        // Send request to server
        this.apiService.sendMessage(message, this.chatModel.currentChatId, selectedModel)
            .then(data => {
                // Remove thinking indicator
                thinkingElement.remove();
                
                // Add bot response to chat
                const botResponse = data.response;
                this.addMessage(botResponse, 'bot');
                
                // Add bot response to the model
                this.chatModel.addMessage(botResponse, 'assistant');
                
                // Update the sidebar
                this.sidebarManager.renderChatsList();
                
                // Re-enable send button
                this.elements.sendButton.disabled = false;
                
                // Focus input field
                this.elements.userInput.focus();
            })
            .catch(error => {
                console.error('Error:', error);
                
                // Remove thinking indicator
                thinkingElement.remove();
                
                // Show error message
                if (error.message && error.message.includes('400')) {
                    this.addMessage('API key required to use the chatbot. Please add your API key in the settings panel.', 'bot');
                    if (this.elements.apiKeyOverlay) {
                        this.elements.apiKeyOverlay.classList.remove('hidden');
                    }
                } else {
                    this.addMessage('Sorry, an error occurred. Please try again.', 'bot');
                }
                
                // Re-enable send button
                this.elements.sendButton.disabled = false;
            });
    }
    
    // Handle clearing the current chat
    handleClearChat() {
        // Clear the chat in the model
        this.chatModel.clearCurrentChat();
        
        // Update the sidebar
        this.sidebarManager.renderChatsList();
        
        // Reset UI with welcome message
        this.elements.chatContainer.innerHTML = `
            <div class="chat-welcome">
                <i class="fas fa-robot chat-welcome-icon"></i>
                <h3>Welcome to MegBot!</h3>
                <p>I'm your AI assistant, ready to help with information, answer questions, and have insightful conversations. How can I assist you today?</p>
            </div>
        `;
        
        this.firstMessage = true;
        
        // Clear server-side history
        this.apiService.clearHistory()
            .then(data => console.log('History cleared:', data))
            .catch(error => console.error('Error clearing history:', error));
    }
    
    // Handle keyboard shortcuts
    handleInputKeydown(e) {
        // Ctrl+Enter to submit
        if (e.key === 'Enter' && e.ctrlKey) {
            this.elements.messageForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Create a new chat
    createNewChat() {
        // Create a new chat in the model
        const newChat = this.chatModel.createChat();
        
        // Reset UI with welcome message
        this.elements.chatContainer.innerHTML = `
            <div class="chat-welcome">
                <i class="fas fa-robot chat-welcome-icon"></i>
                <h3>Welcome to MegBot!</h3>
                <p>I'm your AI assistant, ready to help with information, answer questions, and have insightful conversations. How can I assist you today?</p>
            </div>
        `;
        
        this.firstMessage = true;
        
        // Update the sidebar
        this.sidebarManager.renderChatsList();
        
        // Clear server-side history
        this.apiService.clearHistory()
            .catch(error => console.error('Error clearing history:', error));
        
        // Focus input field
        this.elements.userInput.focus();
        
        return newChat;
    }
    
    // Load a specific chat
    loadChat(chatId) {
        // Set the current chat in the model
        const chat = this.chatModel.setCurrentChat(chatId);
        if (!chat) return false;
        
        // Clear chat container
        this.elements.chatContainer.innerHTML = '';
        
        // If no messages, show welcome
        if (chat.messages.length === 0) {
            this.elements.chatContainer.innerHTML = `
                <div class="chat-welcome">
                    <i class="fas fa-robot chat-welcome-icon"></i>
                    <h3>Welcome to MegBot!</h3>
                    <p>I'm your AI assistant, ready to help with information, answer questions, and have insightful conversations. How can I assist you today?</p>
                </div>
            `;
            this.firstMessage = true;
        } else {
            // Add messages
            chat.messages.forEach(message => {
                this.addMessage(
                    message.content, 
                    message.role === 'user' ? 'user' : 'bot', 
                    new Date(message.timestamp)
                );
            });
            this.firstMessage = false;
        }
        
        // Update the sidebar
        this.sidebarManager.renderChatsList();
        
        // Focus input field
        this.elements.userInput.focus();
        
        // Sync server-side history
        this.apiService.syncServerHistory(chat.messages)
            .catch(error => console.error('Error syncing history:', error));
        
        return true;
    }
    
    // Add a message to the chat UI
    addMessage(content, type, timestamp = new Date()) {
        const messageDiv = DOMUtils.createMessage(content, type, timestamp);
        this.elements.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
        return messageDiv;
    }
    
    // Add thinking indicator
    addThinkingIndicator() {
        const thinkingDiv = DOMUtils.createThinkingIndicator();
        this.elements.chatContainer.appendChild(thinkingDiv);
        this.scrollToBottom();
        return thinkingDiv;
    }
    
    // Scroll chat to bottom
    scrollToBottom() {
        this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
    }
}