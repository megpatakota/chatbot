from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("clear_history/", views.clear_history, name="clear_history"),
]