// MegBot Chat UI - utils/dom.js
// Centralized DOM element references

const DOMUtils = {
    initializeElements() {
        return {
            // Main elements
            sidebar: document.getElementById('sidebar'),
            chatContainer: document.getElementById('chat-container'),
            messageForm: document.getElementById('message-form'),
            userInput: document.getElementById('user-input'),
            sendButton: document.getElementById('send-button'),
            
            // Buttons and controls
            clearButton: document.getElementById('clear-button'),
            settingsButton: document.getElementById('settings-button'),
            settingsPanel: document.getElementById('settings-panel'),
            themeToggle: document.getElementById('theme-toggle'),
            themeToggleSettings: document.getElementById('theme-toggle-settings'),
            voiceInputButton: document.getElementById('voice-input-btn'),
            modelSelector: document.getElementById('model-selector'),
            toggleSidebarBtn: document.getElementById('toggle-sidebar'),
            mobileSidebarToggle: document.getElementById('mobile-sidebar-toggle'),
            newChatButton: document.getElementById('new-chat-btn'),
            chatHistoryContainer: document.getElementById('chat-history'),
            
            // API Key elements
            apiKeyInput: document.getElementById('api-key-input'),
            saveApiKeyBtn: document.getElementById('save-api-key'),
            apiProviderSelect: document.getElementById('api-provider'),
            apiKeyOverlay: document.getElementById('api-key-overlay'),
            initialApiKeyInput: document.getElementById('initial-api-key'),
            initialApiProviderSelect: document.getElementById('initial-api-provider'),
            saveInitialKeyBtn: document.getElementById('save-initial-key'),
            
            // CSRF token
            csrfToken: document.querySelector('[name=csrfmiddlewaretoken]')
        };
    },
    
    // Create a message element
    createMessage(content, type, timestamp = new Date()) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;

        if (type === 'bot') {
            // Create a container for the formatted content
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.innerHTML = FormatterUtils.formatBotMessage(content);
            messageDiv.appendChild(contentDiv);
        } else {
            messageDiv.textContent = content;
        }

        // Add timestamp
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'message-timestamp';
        timestampDiv.textContent = FormatterUtils.formatTime(timestamp);
        messageDiv.appendChild(timestampDiv);

        return messageDiv;
    },
    
    // Create thinking indicator
    createThinkingIndicator() {
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'message message-thinking';
        thinkingDiv.innerHTML = `
            Thinking
            <div class="typing-animation">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        return thinkingDiv;
    },
    
    // Create API key status message
    createApiKeyStatus(message, isValid) {
        const statusElement = document.createElement('div');
        statusElement.className = `api-key-status ${isValid ? 'valid' : 'invalid'}`;
        statusElement.innerHTML = `
            <i class="fas fa-${isValid ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        return statusElement;
    }
};