// MegBot Chat UI - script.js

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatContainer = document.getElementById('chat-container');
    const messageForm = document.getElementById('message-form');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const clearButton = document.getElementById('clear-button');
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const themeToggle = document.getElementById('theme-toggle');
    const voiceInputButton = document.getElementById('voice-input-btn');
    const modelSelector = document.getElementById('model-selector');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    // State
    let firstMessage = true;
    let isRecording = false;
    let recognitionInstance = null;
    let userPreferences = loadUserPreferences();

    // Initialize
    initializeUI();
    
    // Event Listeners
    messageForm.addEventListener('submit', handleSubmitMessage);
    clearButton.addEventListener('click', handleClearChat);
    settingsButton.addEventListener('click', toggleSettingsPanel);
    themeToggle.addEventListener('change', toggleDarkMode);
    voiceInputButton.addEventListener('click', toggleVoiceInput);
    userInput.addEventListener('keydown', handleInputKeydown);
    document.addEventListener('click', handleDocumentClick);
    
    if (modelSelector) {
        modelSelector.addEventListener('change', handleModelChange);
    }

    /**
     * Initialize the UI based on saved preferences
     */
    function initializeUI() {
        // Apply dark mode if enabled
        if (userPreferences.darkMode) {
            document.body.classList.add('dark-mode');
            if (themeToggle) themeToggle.checked = true;
        }
        
        // Set model selection if available
        if (modelSelector && userPreferences.model) {
            modelSelector.value = userPreferences.model;
        }
        
        // Focus input field
        userInput.focus();
    }

    /**
     * Handle message submission
     */
    function handleSubmitMessage(e) {
        e.preventDefault();
        
        const message = userInput.value.trim();
        if (!message) return;
        
        // Remove welcome message if this is the first user message
        if (firstMessage) {
            chatContainer.innerHTML = '';
            firstMessage = false;
        }
        
        // Add user message to chat
        addMessage(message, 'user');
        
        // Clear input field
        userInput.value = '';
        
        // Show thinking indicator
        const thinkingElement = addThinkingIndicator();
        
        // Disable send button
        sendButton.disabled = true;
        
        // Get selected model
        const selectedModel = modelSelector ? modelSelector.value : null;
        
        // Send request to server
        fetch('', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': csrfToken
            },
            body: new URLSearchParams({
                'message': message,
                ...(selectedModel && {'model': selectedModel})
            })
        })
        .then(response => response.json())
        .then(data => {
            // Remove thinking indicator
            thinkingElement.remove();
            
            // Add bot response to chat
            addMessage(data.response, 'bot');
            
            // Re-enable send button
            sendButton.disabled = false;
            
            // Focus input field
            userInput.focus();
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Remove thinking indicator
            thinkingElement.remove();
            
            // Show error message
            addMessage('Sorry, an error occurred. Please try again.', 'bot');
            
            // Re-enable send button
            sendButton.disabled = false;
        });
    }

    /**
     * Handle clearing the chat
     */
    function handleClearChat() {
        // Reset UI with welcome message
        chatContainer.innerHTML = `
            <div class="chat-welcome">
                <i class="fas fa-robot chat-welcome-icon"></i>
                <h3>Welcome to MegBot!</h3>
                <p>I'm your AI assistant, ready to help with information, answer questions, and have insightful conversations. How can I assist you today?</p>
            </div>
        `;
        
        firstMessage = true;
        
        // Clear server-side history
        fetch('/clear_history/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => response.json())
        .then(data => console.log('History cleared:', data))
        .catch(error => console.error('Error clearing history:', error));
    }

    /**
     * Toggle settings panel visibility
     */
    function toggleSettingsPanel(e) {
        e.stopPropagation();
        settingsPanel.classList.toggle('visible');
    }

    /**
     * Handle clicks outside the settings panel to close it
     */
    function handleDocumentClick(e) {
        if (settingsPanel && settingsPanel.classList.contains('visible')) {
            if (!settingsPanel.contains(e.target) && e.target !== settingsButton) {
                settingsPanel.classList.remove('visible');
            }
        }
    }

    /**
     * Toggle dark mode
     */
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        userPreferences.darkMode = document.body.classList.contains('dark-mode');
        saveUserPreferences();
    }

    /**
     * Handle model selection change
     */
    function handleModelChange() {
        userPreferences.model = modelSelector.value;
        saveUserPreferences();
    }

    /**
     * Toggle voice input
     */
    function toggleVoiceInput() {
        if (!isRecording) {
            startVoiceRecognition();
        } else {
            stopVoiceRecognition();
        }
    }

    /**
     * Start voice recognition
     */
    function startVoiceRecognition() {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionInstance = new SpeechRecognition();
            
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            
            recognitionInstance.onstart = function() {
                isRecording = true;
                voiceInputButton.classList.add('recording');
                voiceInputButton.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                userInput.placeholder = 'Listening...';
            };
            
            recognitionInstance.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                userInput.value = transcript;
            };
            
            recognitionInstance.onend = function() {
                stopVoiceRecognition();
            };
            
            recognitionInstance.onerror = function(event) {
                console.error('Speech recognition error:', event.error);
                stopVoiceRecognition();
            };
            
            recognitionInstance.start();
        } else {
            alert('Speech recognition is not supported in your browser.');
        }
    }

    /**
     * Stop voice recognition
     */
    function stopVoiceRecognition() {
        if (recognitionInstance) {
            recognitionInstance.stop();
        }
        
        isRecording = false;
        voiceInputButton.classList.remove('recording');
        voiceInputButton.innerHTML = '<i class="fas fa-microphone"></i>';
        userInput.placeholder = 'Type your message here...';
    }

    /**
     * Handle keyboard shortcuts
     */
    function handleInputKeydown(e) {
        // Ctrl+Enter to submit
        if (e.key === 'Enter' && e.ctrlKey) {
            messageForm.dispatchEvent(new Event('submit'));
        }
    }

    /**
     * Add a message to the chat
     */
    function addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        
        // Process markdown in bot messages
        if (type === 'bot') {
            // Create a container for the formatted content
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            
            // Basic markdown processing (for code blocks)
            const formattedContent = formatBotMessage(content);
            contentDiv.innerHTML = formattedContent;
            
            messageDiv.appendChild(contentDiv);
        } else {
            messageDiv.textContent = content;
        }
        
        // Add timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = formatTime(new Date());
        messageDiv.appendChild(timestamp);
        
        chatContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        scrollToBottom();
        
        return messageDiv;
    }

    /**
     * Format bot messages (with code blocks, etc.)
     */
    function formatBotMessage(content) {
        // Replace code blocks
        let formatted = content.replace(/```([\s\S]*?)```/g, function(match, code) {
            return `<pre>${code.trim()}</pre>`;
        });
        
        // Replace inline code
        formatted = formatted.replace(/`([^`]+)`/g, function(match, code) {
            return `<code>${code}</code>`;
        });
        
        // Replace links
        formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, function(match, text, url) {
            return `<a href="${url}" target="_blank">${text}</a>`;
        });
        
        // Replace line breaks with paragraphs
        formatted = '<p>' + formatted.replace(/\n\n+/g, '</p><p>') + '</p>';
        
        // Replace single line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    /**
     * Add thinking indicator
     */
    function addThinkingIndicator() {
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
        chatContainer.appendChild(thinkingDiv);
        
        // Scroll to bottom
        scrollToBottom();
        
        return thinkingDiv;
    }

    /**
     * Format time for message timestamps
     */
    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Scroll chat to bottom
     */
    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    /**
     * Load user preferences from localStorage
     */
    function loadUserPreferences() {
        const storedPrefs = localStorage.getItem('megbot_preferences');
        return storedPrefs ? JSON.parse(storedPrefs) : {
            darkMode: false,
            model: 'gpt-3.5-turbo'
        };
    }

    /**
     * Save user preferences to localStorage
     */
    function saveUserPreferences() {
        localStorage.setItem('megbot_preferences', JSON.stringify(userPreferences));
    }
});