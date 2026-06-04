from django.urls import path
from . import views

urlpatterns = [
    path('ot/', views.OTListAPIView.as_view(), name='api-ot-list'),
    path('ot/<str:numero>/', views.OTDetailAPIView.as_view(), name='api-ot-detail'),
]