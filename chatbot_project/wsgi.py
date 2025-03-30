# chatbot_project/wsgi.py
import os
from django.core.wsgi import get_wsgi_application
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chatbot_project.settings')

# Get WSGI application
application = get_wsgi_application()