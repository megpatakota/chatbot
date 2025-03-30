// MegBot Chat UI - script.js

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const chatContainer = document.getElementById('chat-container');
    const messageForm = document.getElementById('message-form');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const clearButton = document.getElementById('clear-button');
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleSettings = document.getElementById('theme-toggle-settings');
    const voiceInputButton = document.getElementById('voice-input-btn');
    const modelSelector = document.getElementById('model-selector');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
    const newChatButton = document.getElementById('new-chat-btn');
    const chatHistoryContainer = document.getElementById('chat-history');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    // State
    let firstMessage = true;
    let isRecording = false;
    let recognitionInstance = null;
    let userPreferences = loadUserPreferences();
    let currentChatId = null;
    let chats = loadChats();
    
    // Initialize
    initializeUI();
    renderChatsList();
    
    // Event Listeners
    messageForm.addEventListener('submit', handleSubmitMessage);
    clearButton.addEventListener('click', handleClearChat);
    settingsButton.addEventListener('click', toggleSettingsPanel);
    themeToggle.addEventListener('change', toggleDarkMode);
    if (themeToggleSettings) {
        themeToggleSettings.addEventListener('change', toggleDarkMode);
    }
    voiceInputButton.addEventListener('click', toggleVoiceInput);
    userInput.addEventListener('keydown', handleInputKeydown);
    document.addEventListener('click', handleDocumentClick);
    
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', toggleSidebar);
    }
    
    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener('click', toggleMobileSidebar);
    }
    
    if (newChatButton) {
        newChatButton.addEventListener('click', createNewChat);
    }
    
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
            if (themeToggleSettings) themeToggleSettings.checked = true;
        }
        
        // Apply sidebar collapse state
        if (userPreferences.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
        }
        
        // Set model selection if available
        if (modelSelector && userPreferences.model) {
            modelSelector.value = userPreferences.model;
        }
        
        // Load current chat or create one
        if (!currentChatId && chats.length > 0) {
            // Load the most recent chat
            currentChatId = chats[0].id;
            loadChat(currentChatId);
        } else if (!currentChatId) {
            // Create a new chat if none exists
            createNewChat();
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
        
        // Remove welcome message if this is the first message
        if (firstMessage) {
            chatContainer.innerHTML = '';
            firstMessage = false;
        }
        
        // Add user message to chat
        addMessage(message, 'user');
        
        // Update the current chat in storage
        updateCurrentChat(message);
        
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
                'chat_id': currentChatId,
                ...(selectedModel && {'model': selectedModel})
            })
        })
        .then(response => response.json())
        .then(data => {
            // Remove thinking indicator
            thinkingElement.remove();
            
            // Add bot response to chat
            const botResponse = data.response;
            addMessage(botResponse, 'bot');
            
            // Update chat with bot response
            updateCurrentChat(null, botResponse);
            
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
     * Create a new chat
     */
    function createNewChat() {
        // Generate a random chat ID
        const newChatId = 'chat_' + Date.now();
        
        // Create a new chat object
        const newChat = {
            id: newChatId,
            title: 'New Chat',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            messages: []
        };
        
        // Add to chats array
        chats.unshift(newChat);
        
        // Save chats
        saveChats();
        
        // Set as current chat
        currentChatId = newChatId;
        
        // Clear current chat window
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
        .catch(error => console.error('Error clearing history:', error));
        
        // Update the chat list
        renderChatsList();
        
        // Focus input field
        userInput.focus();
    }
    
    /**
     * Update the current chat
     */
    function updateCurrentChat(userMessage, botResponse) {
        // Find the current chat
        const chatIndex = chats.findIndex(chat => chat.id === currentChatId);
        if (chatIndex === -1) return;
        
        // Update the chat
        if (userMessage) {
            // Add user message
            chats[chatIndex].messages.push({
                role: 'user',
                content: userMessage,
                timestamp: new Date().toISOString()
            });
            
            // Update title with the first user message
            if (chats[chatIndex].title === 'New Chat' && chats[chatIndex].messages.length === 1) {
                chats[chatIndex].title = userMessage.length > 30 ? userMessage.substring(0, 30) + '...' : userMessage;
            }
        }
        
        if (botResponse) {
            // Add bot response
            chats[chatIndex].messages.push({
                role: 'assistant',
                content: botResponse,
                timestamp: new Date().toISOString()
            });
        }
        
        // Update the last updated timestamp
        chats[chatIndex].updated = new Date().toISOString();
        
        // Save chats
        saveChats();
        
        // Update the chat list
        renderChatsList();
    }
    
    /**
     * Load a specific chat
     */
    function loadChat(chatId) {
        // Find the chat
        const chat = chats.find(chat => chat.id === chatId);
        if (!chat) return;
        
        // Set as current chat
        currentChatId = chatId;
        
        // Clear chat container
        chatContainer.innerHTML = '';
        
        // If no messages, show welcome
        if (chat.messages.length === 0) {
            chatContainer.innerHTML = `
                <div class="chat-welcome">
                    <i class="fas fa-robot chat-welcome-icon"></i>
                    <h3>Welcome to MegBot!</h3>
                    <p>I'm your AI assistant, ready to help with information, answer questions, and have insightful conversations. How can I assist you today?</p>
                </div>
            `;
            firstMessage = true;
        } else {
            // Add messages
            chat.messages.forEach(message => {
                addMessage(message.content, message.role === 'user' ? 'user' : 'bot', new Date(message.timestamp));
            });
            firstMessage = false;
        }
        
        // Update the chat list to highlight the active chat
        renderChatsList();
        
        // Focus input field
        userInput.focus();
        
        // Sync server-side history (in a real implementation, this would send the chat history to the server)
        syncServerHistory(chat.messages);
    }
    
    /**
     * Sync server history with client history
     */
    function syncServerHistory(messages) {
        // Clear server-side history first
        fetch('/clear_history/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': csrfToken
            }
        })
        .then(() => {
            // In a real implementation, you would now send the messages to the server
            // to rebuild the conversation history
            console.log('Server history cleared, would now sync', messages);
        })
        .catch(error => console.error('Error syncing history:', error));
    }
    
    /**
     * Delete a chat
     */
    function deleteChat(chatId, event) {
        // Stop event propagation
        if (event) {
            event.stopPropagation();
        }
        
        // Remove the chat
        chats = chats.filter(chat => chat.id !== chatId);
        
        // Save chats
        saveChats();
        
        // If the deleted chat was the current one, load the most recent chat or create a new one
        if (chatId === currentChatId) {
            if (chats.length > 0) {
                loadChat(chats[0].id);
            } else {
                createNewChat();
            }
        } else {
            // Just update the chat list
            renderChatsList();
        }
    }
    
    /**
     * Render the list of chats in the sidebar
     */
    function renderChatsList() {
        if (!chatHistoryContainer) return;
        
        // Clear the container
        chatHistoryContainer.innerHTML = '';
        
        // If no chats, show a message
        if (chats.length === 0) {
            chatHistoryContainer.innerHTML = `
                <div class="no-chats-message">
                    No chats yet. Start a new conversation!
                </div>
            `;
            return;
        }
        
        // Add each chat
        chats.forEach(chat => {
            const chatElement = document.createElement('div');
            chatElement.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
            chatElement.dataset.id = chat.id;
            
            // Format the date
            const chatDate = new Date(chat.updated);
            const formattedDate = formatDate(chatDate);
            
            chatElement.innerHTML = `
                <i class="fas fa-comment chat-icon"></i>
                <div>
                    <div class="chat-title">${chat.title}</div>
                    <div class="chat-time">${formattedDate}</div>
                </div>
                <button class="delete-chat" title="Delete chat">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            // Add click event to load the chat
            chatElement.addEventListener('click', function() {
                loadChat(chat.id);
            });
            
            // Add click event to delete button
            const deleteButton = chatElement.querySelector('.delete-chat');
            deleteButton.addEventListener('click', function(e) {
                deleteChat(chat.id, e);
            });
            
            chatHistoryContainer.appendChild(chatElement);
        });
    }
    
    /**
     * Format date for display
     */
    function formatDate(date) {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === now.toDateString()) {
            return 'Today, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }

    /**
     * Handle clearing the current chat
     */
    function handleClearChat() {
        // Find the current chat
        const chatIndex = chats.findIndex(chat => chat.id === currentChatId);
        if (chatIndex === -1) return;
        
        // Clear the messages
        chats[chatIndex].messages = [];
        chats[chatIndex].title = 'New Chat';
        chats[chatIndex].updated = new Date().toISOString();
        
        // Save chats
        saveChats();
        
        // Reset UI with welcome message
        chatContainer.innerHTML = `
            <div class="chat-welcome">
                <i class="fas fa-robot chat-welcome-icon"></i>
                <h3>Welcome to MegBot!</h3>
                <p>I'm your AI assistant, ready to help with information, answer questions, and have insightful conversations. How can I assist you today?</p>
            </div>
        `;
        
        firstMessage = true;
        
        // Update the chat list
        renderChatsList();
        
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
     * Toggle sidebar visibility
     */
    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
        userPreferences.sidebarCollapsed = sidebar.classList.contains('collapsed');
        saveUserPreferences();
    }
    
    /**
     * Toggle mobile sidebar
     */
    function toggleMobileSidebar() {
        sidebar.classList.toggle('mobile-visible');
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
        
        // Close mobile sidebar when clicking outside
        if (window.innerWidth <= 768 && sidebar.classList.contains('mobile-visible')) {
            if (!sidebar.contains(e.target) && e.target !== mobileSidebarToggle) {
                sidebar.classList.remove('mobile-visible');
            }
        }
    }

    /**
     * Toggle dark mode
     */
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        
        // Sync the checkboxes
        const isDarkMode = document.body.classList.contains('dark-mode');
        if (themeToggle) themeToggle.checked = isDarkMode;
        if (themeToggleSettings) themeToggleSettings.checked = isDarkMode;
        
        userPreferences.darkMode = isDarkMode;
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
    function addMessage(content, type, timestamp = new Date()) {
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
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'message-timestamp';
        timestampDiv.textContent = formatTime(timestamp);
        messageDiv.appendChild(timestampDiv);
        
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
            sidebarCollapsed: false,
            model: 'gpt-3.5-turbo'
        };
    }

    /**
     * Save user preferences to localStorage
     */
    function saveUserPreferences() {
        localStorage.setItem('megbot_preferences', JSON.stringify(userPreferences));
    }
    
    /**
     * Load chats from localStorage
     */
    function loadChats() {
        const storedChats = localStorage.getItem('megbot_chats');
        return storedChats ? JSON.parse(storedChats) : [];
    }
    
    /**
     * Save chats to localStorage
     */
    function saveChats() {
        localStorage.setItem('megbot_chats', JSON.stringify(chats));
    }
});