// MegBot Chat UI - features/voice.js
// Voice recognition functionality

class VoiceInputManager {
    constructor(voiceInputButton, userInput) {
        this.voiceInputButton = voiceInputButton;
        this.userInput = userInput;
        this.isRecording = false;
        this.recognitionInstance = null;
        
        // Bind methods to this instance
        this.toggleVoiceInput = this.toggleVoiceInput.bind(this);
        this.startVoiceRecognition = this.startVoiceRecognition.bind(this);
        this.stopVoiceRecognition = this.stopVoiceRecognition.bind(this);
        
        // Set up event listener
        if (this.voiceInputButton) {
            this.voiceInputButton.addEventListener('click', this.toggleVoiceInput);
        }
    }
    
    // Toggle voice input on/off
    toggleVoiceInput() {
        if (!this.isRecording) {
            this.startVoiceRecognition();
        } else {
            this.stopVoiceRecognition();
        }
    }
    
    // Start voice recognition
    startVoiceRecognition() {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognitionInstance = new SpeechRecognition();

            this.recognitionInstance.continuous = false;
            this.recognitionInstance.interimResults = false;

            this.recognitionInstance.onstart = () => {
                this.isRecording = true;
                this.voiceInputButton.classList.add('recording');
                this.voiceInputButton.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                this.userInput.placeholder = 'Listening...';
            };

            this.recognitionInstance.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.userInput.value = transcript;
            };

            this.recognitionInstance.onend = () => {
                this.stopVoiceRecognition();
            };

            this.recognitionInstance.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopVoiceRecognition();
            };

            this.recognitionInstance.start();
        } else {
            alert('Speech recognition is not supported in your browser.');
        }
    }
    
    // Stop voice recognition
    stopVoiceRecognition() {
        if (this.recognitionInstance) {
            this.recognitionInstance.stop();
        }

        this.isRecording = false;
        this.voiceInputButton.classList.remove('recording');
        this.voiceInputButton.innerHTML = '<i class="fas fa-microphone"></i>';
        this.userInput.placeholder = 'Type your message here...';
    }
}