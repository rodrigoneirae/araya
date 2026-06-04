from django.urls import path
from . import views, auth

urlpatterns = [
    path('auth/login/', auth.login_api, name='api-login'),
    path('articulos/', views.ArticuloSearchAPIView.as_view(), name='api-articulos-search'),
    path('empleados/', views.EmpleadoSearchAPIView.as_view(), name='api-empleados-search'),
    path('registros/', views.RegistroArticuloListCreateAPIView.as_view(), name='api-registros-list-create'),
    path('registros/<int:pk>/', views.RegistroArticuloDetailAPIView.as_view(), name='api-registros-detail'),
]
