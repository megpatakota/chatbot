// MegBot Chat UI - features/settings.js
// Settings panel & preferences

class SettingsManager {
    constructor(domElements, userPrefs, apiService) {
        this.elements = domElements;
        this.userPrefs = userPrefs;
        this.apiService = apiService;
        
        // Bind methods to this instance
        this.toggleSettingsPanel = this.toggleSettingsPanel.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
        this.toggleDarkMode = this.toggleDarkMode.bind(this);
        this.handleModelChange = this.handleModelChange.bind(this);
        this.handleSaveApiKey = this.handleSaveApiKey.bind(this);
        this.handleApiProviderChange = this.handleApiProviderChange.bind(this);
        this.handleSaveInitialKey = this.handleSaveInitialKey.bind(this);
        
        // Set up event listeners
        if (this.elements.settingsButton) {
            this.elements.settingsButton.addEventListener('click', this.toggleSettingsPanel);
        }
        
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('change', this.toggleDarkMode);
        }
        
        if (this.elements.themeToggleSettings) {
            this.elements.themeToggleSettings.addEventListener('change', this.toggleDarkMode);
        }
        
        if (this.elements.modelSelector) {
            this.elements.modelSelector.addEventListener('change', this.handleModelChange);
        }
        
        if (this.elements.apiKeyInput && this.elements.saveApiKeyBtn) {
            this.elements.saveApiKeyBtn.addEventListener('click', this.handleSaveApiKey);
        }
        
        if (this.elements.apiProviderSelect) {
            this.elements.apiProviderSelect.addEventListener('change', this.handleApiProviderChange);
        }
        
        if (this.elements.saveInitialKeyBtn) {
            this.elements.saveInitialKeyBtn.addEventListener('click', this.handleSaveInitialKey);
        }
    }
    
    // Initialize UI based on saved preferences
    initializeUI() {
        // Apply dark mode if enabled
        if (this.userPrefs.get('darkMode')) {
            document.body.classList.add('dark-mode');
            if (this.elements.themeToggle) this.elements.themeToggle.checked = true;
            if (this.elements.themeToggleSettings) this.elements.themeToggleSettings.checked = true;
        }

        // Apply sidebar collapse state
        if (this.userPrefs.get('sidebarCollapsed') && this.elements.sidebar) {
            this.elements.sidebar.classList.add('collapsed');
        }

        // Set model selection if available
        if (this.elements.modelSelector && this.userPrefs.get('model')) {
            this.elements.modelSelector.value = this.userPrefs.get('model');
        }

        // Initialize API provider if saved
        if (this.elements.apiProviderSelect && this.userPrefs.get('apiProvider')) {
            this.elements.apiProviderSelect.value = this.userPrefs.get('apiProvider');
        }

        // Show masked API key if one is saved
        if (this.elements.apiKeyInput && this.userPrefs.get('hasApiKey')) {
            this.elements.apiKeyInput.value = '••••••••••••••••';
            if (this.elements.saveApiKeyBtn) {
                this.elements.saveApiKeyBtn.textContent = 'Update';
            }
        }

        // Check if API key is set, show overlay if not
        if (!this.userPrefs.get('hasApiKey') && this.elements.apiKeyOverlay) {
            this.elements.apiKeyOverlay.classList.remove('hidden');
        } else if (this.elements.apiKeyOverlay) {
            this.elements.apiKeyOverlay.classList.add('hidden');
        }

        // Focus input field
        if (this.elements.userInput) {
            this.elements.userInput.focus();
        }
    }
    
    // Toggle settings panel visibility
    toggleSettingsPanel(e) {
        if (e) e.stopPropagation();
        this.elements.settingsPanel.classList.toggle('visible');
    }
    
    // Handle clicks outside the settings panel to close it
    handleDocumentClick(e) {
        if (this.elements.settingsPanel && this.elements.settingsPanel.classList.contains('visible')) {
            if (!this.elements.settingsPanel.contains(e.target) && e.target !== this.elements.settingsButton) {
                this.elements.settingsPanel.classList.remove('visible');
            }
        }
    }
    
    // Toggle dark mode
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');

        // Sync the checkboxes
        const isDarkMode = document.body.classList.contains('dark-mode');
        if (this.elements.themeToggle) this.elements.themeToggle.checked = isDarkMode;
        if (this.elements.themeToggleSettings) this.elements.themeToggleSettings.checked = isDarkMode;

        this.userPrefs.set('darkMode', isDarkMode);
    }
    
    // Handle model selection change
    handleModelChange() {
        this.userPrefs.set('model', this.elements.modelSelector.value);
    }
    
    // Handle API provider change
    handleApiProviderChange() {
        const newProvider = this.elements.apiProviderSelect.value;
        
        // Reset API key if provider changes
        if (this.userPrefs.get('hasApiKey')) {
            if (confirm('Changing the provider will require you to enter a new API key. Continue?')) {
                this.userPrefs.update({
                    hasApiKey: false,
                    apiProvider: newProvider
                });
                
                if (this.elements.apiKeyInput) {
                    this.elements.apiKeyInput.value = '';
                }
                
                if (this.elements.saveApiKeyBtn) {
                    this.elements.saveApiKeyBtn.textContent = 'Save';
                }
            } else {
                // Revert selection
                this.elements.apiProviderSelect.value = this.userPrefs.get('apiProvider');
            }
        } else {
            this.userPrefs.set('apiProvider', newProvider);
        }
    }
    
    // Handle saving API key from settings
    handleSaveApiKey() {
        const apiKey = this.elements.apiKeyInput.value.trim();

        // If the input is empty, show error
        if (!apiKey) {
            this.showApiKeyStatus('Please enter a valid API key', false);
            return;
        }

        // Skip validation for masked keys - allow submitting the form
        // even if the key hasn't changed (for testing connection)
        if (apiKey === '••••••••••••••••') {
            this.showApiKeyStatus('API key is already saved', true);
            return;
        }

        // Send API key to server for encryption and storage
        this.apiService.saveApiKey(apiKey, this.elements.apiProviderSelect.value)
            .then(data => {
                if (data.status === 'success') {
                    // Update UI
                    this.elements.apiKeyInput.value = '••••••••••••••••';
                    this.elements.saveApiKeyBtn.textContent = 'Update';

                    // Update preferences
                    this.userPrefs.update({
                        hasApiKey: true,
                        apiProvider: this.elements.apiProviderSelect.value
                    });

                    this.showApiKeyStatus('API key saved successfully!', true);
                } else {
                    this.showApiKeyStatus(data.message || 'Failed to save API key', false);
                }
            })
            .catch(error => {
                console.error('Error saving API key:', error);
                this.showApiKeyStatus('Error saving API key. Please try again.', false);
            });
    }
    
    // Handle saving initial API key
    handleSaveInitialKey() {
        const apiKey = this.elements.initialApiKeyInput.value.trim();

        if (!apiKey) {
            this.elements.initialApiKeyInput.classList.add('highlight-required');
            setTimeout(() => {
                this.elements.initialApiKeyInput.classList.remove('highlight-required');
            }, 2000);
            return;
        }

        // Show loading state
        this.elements.saveInitialKeyBtn.textContent = 'Saving...';
        this.elements.saveInitialKeyBtn.disabled = true;

        // Send API key to server for encryption and storage
        this.apiService.saveApiKey(apiKey, this.elements.initialApiProviderSelect.value)
            .then(data => {
                // Reset button state
                this.elements.saveInitialKeyBtn.textContent = 'Save Key & Start Chatting';
                this.elements.saveInitialKeyBtn.disabled = false;

                if (data.status === 'success') {
                    console.log('API key saved successfully!');

                    // Update preferences
                    this.userPrefs.update({
                        hasApiKey: true,
                        apiProvider: this.elements.initialApiProviderSelect.value
                    });

                    // Update the settings panel if it exists
                    if (this.elements.apiKeyInput) {
                        this.elements.apiKeyInput.value = '••••••••••••••••';
                    }
                    if (this.elements.saveApiKeyBtn) {
                        this.elements.saveApiKeyBtn.textContent = 'Update';
                    }
                    if (this.elements.apiProviderSelect) {
                        this.elements.apiProviderSelect.value = this.elements.initialApiProviderSelect.value;
                    }

                    // Hide overlay - Force this with direct style manipulation too
                    if (this.elements.apiKeyOverlay) {
                        this.elements.apiKeyOverlay.classList.add('hidden');
                        this.elements.apiKeyOverlay.style.display = 'none';
                    }
                } else {
                    alert('Failed to save API key: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Detailed error:', error);

                // Reset button state
                this.elements.saveInitialKeyBtn.textContent = 'Save Key & Start Chatting';
                this.elements.saveInitialKeyBtn.disabled = false;

                alert('Error saving API key. Please try again.');
            });
    }
    
    // Show API key status message
    showApiKeyStatus(message, isValid) {
        // Remove existing status if any
        const existingStatus = document.querySelector('.api-key-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        // Create status element
        const statusElement = DOMUtils.createApiKeyStatus(message, isValid);

        // Add to DOM after the input container
        const container = document.querySelector('.api-key-container');
        if (container) {
            container.insertAdjacentElement('afterend', statusElement);

            // Auto remove after 5 seconds
            setTimeout(() => {
                statusElement.remove();
            }, 5000);
        }
    }
}