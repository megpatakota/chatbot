// MegBot Chat UI - features/sidebar.js
// Sidebar toggle and chat history

class SidebarManager {
    constructor(domElements, userPrefs) {
        this.elements = domElements;
        this.userPrefs = userPrefs;
        this.chatModel = null; // Will be set by connectChatModel
        this.sidebarManuallyToggled = false;
        
        // Bind methods to this instance
        this.toggleSidebar = this.toggleSidebar.bind(this);
        this.toggleMobileSidebar = this.toggleMobileSidebar.bind(this);
        this.renderChatsList = this.renderChatsList.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        this.handleWindowResize = this.handleWindowResize.bind(this);
        
        // Set up event listeners
        if (this.elements.toggleSidebarBtn) {
            this.elements.toggleSidebarBtn.addEventListener('click', this.toggleSidebar);
        }
        
        if (this.elements.mobileSidebarToggle) {
            this.elements.mobileSidebarToggle.addEventListener('click', this.toggleMobileSidebar);
        }
        
        if (this.elements.newChatButton) {
            this.elements.newChatButton.addEventListener('click', () => {
                if (this.chatModel) {
                    this.onChatSelected(this.chatModel.createChat().id);
                }
            });
        }
    }
    
    // Connect to chat model and set callback
    connectChatModel(chatModel, onChatSelected) {
        this.chatModel = chatModel;
        this.onChatSelected = onChatSelected;
    }
    
    // Toggle sidebar visibility
    toggleSidebar() {
        if (!this.elements.sidebar) return;
        
        // Toggle the collapsed class
        this.elements.sidebar.classList.toggle('collapsed');
        
        // Update user preferences
        this.userPrefs.set('sidebarCollapsed', this.elements.sidebar.classList.contains('collapsed'));
        
        // Mark that the sidebar was manually toggled
        this.sidebarManuallyToggled = true;
        
        // Set a timeout to reset the manually toggled flag after a short delay
        // This prevents the resize handler from immediately collapsing a just-expanded sidebar
        setTimeout(() => {
            this.sidebarManuallyToggled = false;
        }, 500);
    }
    
    // Toggle mobile sidebar
    toggleMobileSidebar() {
        if (!this.elements.sidebar) return;
        this.elements.sidebar.classList.toggle('mobile-visible');
    }
    
    // Handle window resize
    handleWindowResize() {
        if (this.elements.sidebar && !this.sidebarManuallyToggled) {
            // When window is being resized, force the sidebar to collapsed state
            this.elements.sidebar.classList.add('collapsed');
            
            // Update user preferences to match
            this.userPrefs.set('sidebarCollapsed', true);
            
            // On mobile, also ensure mobile-visible is removed (for the mobile view)
            if (window.innerWidth <= 768) {
                this.elements.sidebar.classList.remove('mobile-visible');
            }
        }
    }
    
    // Handle clicks outside the mobile sidebar to close it
    handleDocumentClick(e) {
        if (window.innerWidth <= 768 && 
            this.elements.sidebar &&
            this.elements.sidebar.classList.contains('mobile-visible')) {
            if (!this.elements.sidebar.contains(e.target) && 
                e.target !== this.elements.mobileSidebarToggle) {
                this.elements.sidebar.classList.remove('mobile-visible');
            }
        }
    }
    
    // Render the list of chats in the sidebar
    renderChatsList() {
        if (!this.elements.chatHistoryContainer || !this.chatModel) return;

        // Clear the container
        this.elements.chatHistoryContainer.innerHTML = '';
        
        const chats = this.chatModel.chats;
        const currentChatId = this.chatModel.currentChatId;

        // If no chats, show a message
        if (chats.length === 0) {
            this.elements.chatHistoryContainer.innerHTML = `
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
            const formattedDate = FormatterUtils.formatDate(chatDate);

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
            chatElement.addEventListener('click', () => {
                this.onChatSelected(chat.id);
            });

            // Add click event to delete button
            const deleteButton = chatElement.querySelector('.delete-chat');
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteChat(chat.id);
            });

            this.elements.chatHistoryContainer.appendChild(chatElement);
        });
    }
    
    // Delete a chat
    deleteChat(chatId) {
        if (!this.chatModel) return;
        
        // Delete from model
        const newCurrentChatId = this.chatModel.deleteChat(chatId);
        
        // If we have a new current chat, load it
        if (newCurrentChatId) {
            this.onChatSelected(newCurrentChatId);
        } else {
            // If no chats left, create a new one
            const newChat = this.chatModel.createChat();
            this.onChatSelected(newChat.id);
        }
    }
}