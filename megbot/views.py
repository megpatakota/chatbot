from django.shortcuts import render
from django.http import JsonResponse
from litellm import completion  # Importing Litellm's completion function
import json
from django.conf import settings
from cryptography.fernet import Fernet
import os
import base64

# Define available models
AVAILABLE_MODELS = {
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'gpt-4o-mini': 'GPT-4o Mini',
    'claude-3-haiku': 'Claude 3 Haiku',
    'gemini-1.5-pro': 'Gemini 1.5 Pro'
}

# Generate an encryption key if not already created
def get_or_create_key():
    key = getattr(settings, 'FERNET_KEY', None)
    if not key:
        # Generate a key and store it in settings (for this session only)
        key = Fernet.generate_key()
        settings.FERNET_KEY = key
    return key

# Initialize the encryption utility
def get_cipher():
    key = get_or_create_key()
    return Fernet(key)

def home(request):
    # Initialize or get chat sessions from the session if it doesn't exist
    if 'chat_sessions' not in request.session:
        request.session['chat_sessions'] = {}
    
    # Check if API key is set
    api_key_set = 'encrypted_api_key' in request.session
    
    # Get chat_id from POST or query parameters
    chat_id = request.POST.get('chat_id') or request.GET.get('chat_id')
    
    # Initialize conversation history for this chat if needed
    if chat_id and chat_id not in request.session['chat_sessions']:
        request.session['chat_sessions'][chat_id] = [
            {"role": "system", "content": "You are a helpful assistant."}
        ]
    
    if request.method == "POST":
        # If no API key is set, return an error
        if not api_key_set:
            return JsonResponse({
                "response": "API key required to use the chatbot. Please add your API key in the settings panel."
            }, status=400)
            
        user_input = request.POST.get("message", "")
        # Get the selected model or use default
        selected_model = request.POST.get("model", "gpt-3.5-turbo") 
        
        print(f"Received message: {user_input} (Model: {selected_model}, Chat ID: {chat_id})")
        
        if user_input and chat_id:
            try:
                # Get this chat's conversation history
                conversation_history = request.session['chat_sessions'][chat_id]
                
                # Add user message to conversation history
                conversation_history.append(
                    {"role": "user", "content": user_input}
                )
                
                # Check if user has their own API key
                user_api_key = None
                api_provider = None
                
                # Inside your home function, update this part:
                if 'encrypted_api_key' in request.session:
                    try:
                        # Decrypt the API key
                        cipher = get_cipher()
                        encrypted_key_str = request.session['encrypted_api_key']
                        encrypted_key = encrypted_key_str.encode('latin-1')  # Convert back to bytes
                        user_api_key = cipher.decrypt(encrypted_key).decode('utf-8')
                        api_provider = request.session.get('api_provider', 'openai')
                    except Exception as e:
                        print(f"Error decrypting API key: {e}")
                # Use Litellm's completion function with conversation history
                response = completion(
                    model=selected_model,  # Use the selected model
                    messages=conversation_history,
                    max_tokens=500,
                    api_key=user_api_key,  # Use user's API key if available
                    api_base=None  # This would be configured based on provider if needed
                )
                
                print("Bot response:", response)
                
                # Extract the response text correctly
                response_text = response.choices[0].message.content
                
                # Add assistant response to conversation history
                conversation_history.append(
                    {"role": "assistant", "content": response_text}
                )
                
                # Update the chat session
                request.session['chat_sessions'][chat_id] = conversation_history
                
                # Save the updated session
                request.session.modified = True
                
                return JsonResponse({"response": response_text})
            except Exception as e:
                print(f"Error: {e}")
                return JsonResponse({"response": f"Sorry, an error occurred: {str(e)}"}, status=500)
    
    # For GET requests, pass the available models to the template
    context = {
        "available_models": AVAILABLE_MODELS,
        "api_key_set": api_key_set
    }
    return render(request, "megbot/chat.html", context)
def save_api_key(request):
    """Save and encrypt user's API key"""
    if request.method == "POST":
        api_key = request.POST.get("api_key")
        provider = request.POST.get("provider", "openai")
        
        if not api_key:
            return JsonResponse({
                "status": "error", 
                "message": "API key is required"
            })
        
        try:
            # Encrypt the API key
            cipher = get_cipher()
            encrypted_key = cipher.encrypt(api_key.encode('utf-8'))
            
            # Convert bytes to string for storage in session
            encrypted_key_str = encrypted_key.decode('latin-1')  # Use latin-1 to preserve all byte values
            
            # Store in session
            request.session['encrypted_api_key'] = encrypted_key_str
            request.session['api_provider'] = provider
            request.session.modified = True
            
            return JsonResponse({
                "status": "success",
                "message": "API key saved successfully"
            })
        except Exception as e:
            print(f"Error encrypting API key: {e}")
            return JsonResponse({
                "status": "error",
                "message": "Failed to encrypt API key"
            })
    
    return JsonResponse({
        "status": "error",
        "message": "Invalid request method"
    })

def clear_history(request):
    """API endpoint to clear conversation history of a specific chat or all chats"""
    chat_id = request.GET.get('chat_id')
    
    if 'chat_sessions' not in request.session:
        request.session['chat_sessions'] = {}
    
    if chat_id:
        # Clear a specific chat
        if chat_id in request.session['chat_sessions']:
            request.session['chat_sessions'][chat_id] = [
                {"role": "system", "content": "You are a helpful assistant."}
            ]
    else:
        # Clear all chats (create a new empty dict)
        request.session['chat_sessions'] = {}
    
    request.session.modified = True
    return JsonResponse({"status": "success", "message": "Conversation history cleared"})