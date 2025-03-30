// MegBot Chat UI - script.js (Main Entry Point)

document.addEventListener('DOMContentLoaded', function () {
    // Initialize all modules
    const domElements = DOMUtils.initializeElements();

    // Get CSRF token for API requests
    const csrfToken = domElements.csrfToken.value;

    // Initialize models
    const userPrefs = new UserPreferences();
    const chatModel = new ChatModel();

    // Initialize features with dependencies
    const apiService = new APIService(csrfToken);

    const sidebarManager = new SidebarManager(
        domElements,
        userPrefs
    );

    const settingsManager = new SettingsManager(
        domElements,
        userPrefs,
        apiService
    );

    const voiceInput = new VoiceInputManager(
        domElements.voiceInputButton,
        domElements.userInput
    );

    const chatManager = new ChatManager(
        domElements,
        chatModel,
        userPrefs,
        apiService,
        sidebarManager
    );
    // In script.js, after creating chatManager:
    sidebarManager.connectChatModel(chatModel, (chatId) => {
        chatManager.loadChat(chatId);
    });

    // Initialize UI based on saved preferences
    settingsManager.initializeUI();
    sidebarManager.renderChatsList();

    // Define what happens when document is clicked (for closing panels)
    document.addEventListener('click', function (e) {
        settingsManager.handleDocumentClick(e);
        sidebarManager.handleDocumentClick(e);
    });

    // Handle window resize
    window.addEventListener('resize', function () {
        sidebarManager.handleWindowResize();
    });
});