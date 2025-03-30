from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),  # Keep your existing home view
    path("clear_history/", views.clear_history, name="clear_history"),
    path("save_api_key/", views.save_api_key, name="save_api_key"),
]