// MegBot Chat UI - utils/formatters.js
// Text and date formatting functions

const FormatterUtils = {
    // Format bot messages with markdown-like syntax
    formatBotMessage(content) {
        // Replace code blocks
        let formatted = content.replace(/```([\s\S]*?)```/g, function (match, code) {
            return `<pre>${code.trim()}</pre>`;
        });

        // Replace inline code
        formatted = formatted.replace(/`([^`]+)`/g, function (match, code) {
            return `<code>${code}</code>`;
        });

        // Replace links
        formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, function (match, text, url) {
            return `<a href="${url}" target="_blank">${text}</a>`;
        });

        // Replace line breaks with paragraphs
        formatted = '<p>' + formatted.replace(/\n\n+/g, '</p><p>') + '</p>';

        // Replace single line breaks
        formatted = formatted.replace(/\n/g, '<br>');

        return formatted;
    },
    
    // Format time for message timestamps
    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    // Format date for chat history
    formatDate(date) {
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
};