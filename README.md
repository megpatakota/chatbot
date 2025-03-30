# MegBot with ChatGPT-like Sidebar

This implementation adds a collapsible sidebar to your MegBot chatbot that mimics the ChatGPT interface, allowing users to manage multiple conversations.

## Features Added

1. **Collapsible Sidebar**
   - Toggle between expanded and collapsed views
   - Mobile-responsive design that transforms into a slide-out menu on small screens
   - Persistent state that remembers your preference

2. **Chat Management**
   - Create new chat conversations
   - Browse conversation history 
   - Switch between different chats
   - Delete individual conversations
   - Automatically names chats based on the first message

3. **Enhanced UI Features**
   - Timestamps for messages
   - Timestamps for chat history items
   - Improved message formatting for code blocks
   - User avatar in the sidebar
   - Modern purple theme matching your website

4. **Advanced Chat Architecture**
   - Client-side storage of conversation history
   - Server-side session management for AI context
   - Synchronization between client and server states

## Implementation Steps

### 1. Update Your File Structure

Make sure your project is organized as follows:

```
chatbot_project/
├── megbot/
│   ├── static/
│   │   └── megbot/
│   │       ├── css/
│   │       │   └── styles.css  (updated)
│   │       ├── js/
│   │       │   └── script.js   (updated)
│   │       └── img/
│   │           └── avatar.png  (add your profile picture)
│   └── templates/
│       └── megbot/
│           └── chat.html       (updated)
├── views.py                    (updated)
└── urls.py                     (unchanged)
```

### 2. Copy the Updated Files

1. Replace your existing `styles.css` with the updated version
2. Replace your existing `script.js` with the updated version
3. Replace your existing `chat.html` with the updated version
4. Update your `views.py` with the new multi-chat support

### 3. Create Static Directory (if needed)

If you haven't set up static files yet:

```bash
mkdir -p megbot/static/megbot/css
mkdir -p megbot/static/megbot/js
mkdir -p megbot/static/megbot/img
```

### 4. Add Your Avatar

Place your profile picture at: `megbot/static/megbot/img/avatar.png`

If you don't have one, the UI will show a placeholder image.

### 5. Verify Django Settings

Ensure your `settings.py` has static files configured correctly:

```python
STATIC_URL = 'static/'
STATICFILES_DIRS = [
    BASE_DIR / "static",
]
```

### 6. Run collectstatic (for production)

```bash
python manage.py collectstatic
```

## How It Works

### Chat Storage

This implementation uses a dual-storage approach:

1. **Client-side Storage**: Uses `localStorage` to persist:
   - Chat metadata (IDs, titles, timestamps)
   - Message history (for UI display)
   - User preferences (dark mode, sidebar collapsed state)

2. **Server-side Storage**: Uses Django sessions to store:
   - Conversation history organized by chat ID
   - System messages and context for the AI

When a user switches between chats, the system:
1. Updates the UI with the chat history from localStorage
2. Syncs the server-side conversation context
3. Ensures the AI maintains the right context for each conversation

### Mobile Responsiveness

The sidebar automatically adapts to different screen sizes:

- **Desktop**: Shows as a collapsible sidebar
- **Mobile**: Transforms into a slide-out drawer with a toggle button

## Customization Options

You can easily customize:

1. **Colors**: Edit the CSS variables at the top of `styles.css` to match your branding
2. **Models**: Update the `AVAILABLE_MODELS` dictionary in `views.py` 
3. **System Message**: Change the default assistant behavior by modifying the system message in `views.py`

## Notes for Future Enhancement

1. **Database Integration**: For production, consider moving chat storage to a database
2. **Authentication**: Add user accounts to save chats across devices
3. **Export/Import**: Add functionality to export conversations
4. **Chat Sharing**: Enable sharing of conversation links

