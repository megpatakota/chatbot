from django.urls import path
from megbot import views

urlpatterns = [
    path("", views.home, name="home"),
]
