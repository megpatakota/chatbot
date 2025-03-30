from django.shortcuts import render
from django.http import JsonResponse
from litellm import completion  # Importing Litellm's completion function
import json

# Define available models
AVAILABLE_MODELS = {
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'gpt-4o-mini': 'GPT-4o Mini',
    'claude-3-haiku': 'Claude 3 Haiku',
    'gemini-1.5-pro': 'Gemini 1.5 Pro'
}

def home(request):
    # Initialize or get chat sessions from the session if it doesn't exist
    if 'chat_sessions' not in request.session:
        request.session['chat_sessions'] = {}
    
    # Get chat_id from POST or query parameters
    chat_id = request.POST.get('chat_id') or request.GET.get('chat_id')
    
    # Initialize conversation history for this chat if needed
    if chat_id and chat_id not in request.session['chat_sessions']:
        request.session['chat_sessions'][chat_id] = [
            {"role": "system", "content": "You are a helpful assistant."}
        ]
    
    if request.method == "POST":
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
                
                # Use Litellm's completion function with conversation history
                response = completion(
                    model=selected_model,  # Use the selected model
                    messages=conversation_history,
                    max_tokens=500
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
        "available_models": AVAILABLE_MODELS
    }
    return render(request, "megbot/chat.html", context)

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