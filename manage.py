#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from dotenv import load_dotenv
from django.shortcuts import render
from django.http import JsonResponse
from litellm import completion  # Importing Litellm's completion function
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def main():
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "chatbot_project.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


def home(request):
    if request.method == "POST":
        user_input = request.POST.get("message", "")
        if user_input:
            # Use Litellm's completion function to get a response
            response = completion(
                model="gpt-4o-mini",  # Gemini model = gemini/gemini-1.5-pro
                messages=[{"role": "user", "content": "Hello, how are you?"}],
            )
            return response.choices[0].message.content
    return render(request, "megbot/chat.html")


if __name__ == "__main__":
    main()
