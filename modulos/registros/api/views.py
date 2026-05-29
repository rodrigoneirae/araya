from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from modulos.maestros.models.articulos import Articulos
from modulos.registros.models import RegistroArticuloCabecera
from .serializers import (
    ArticuloSerializer,
    RegistroArticuloCabeceraSerializer,
    RegistroArticuloCreateSerializer,
)


class ArticuloSearchAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if len(query) < 2:
            return Response([])
        articulos = Articulos.objects.filter(
            Q(descr__icontains=query) | Q(codigo__icontains=query)
        ).distinct()[:20]
        serializer = ArticuloSerializer(articulos, many=True)
        return Response(serializer.data)


class RegistroArticuloListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = RegistroArticuloCabecera.objects.filter(
            usuario=self.request.user,
        ).prefetch_related('detalles__articulo')
        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado=estado.upper())
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return RegistroArticuloCreateSerializer
        return RegistroArticuloCabeceraSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        read_serializer = RegistroArticuloCabeceraSerializer(instance)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)


class RegistroArticuloDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RegistroArticuloCabecera.objects.filter(
            usuario=self.request.user,
        ).prefetch_related('detalles__articulo')

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return RegistroArticuloCreateSerializer
        return RegistroArticuloCabeceraSerializer

    def perform_update(self, serializer):
        if self.request.method == 'PATCH':
            estado = self.request.data.get('estado')
            if estado:
                instance = self.get_object()
                instance.estado = estado
                instance.save(update_fields=['estado'])
                return
        super().perform_update(serializer)

    def update(self, request, *args, **kwargs):
        if request.method == 'PATCH':
            estado = request.data.get('estado')
            if estado:
                instance = self.get_object()
                instance.estado = estado
                instance.save(update_fields=['estado'])
                read_serializer = RegistroArticuloCabeceraSerializer(instance)
                return Response(read_serializer.data)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        read_serializer = RegistroArticuloCabeceraSerializer(instance)
        return Response(read_serializer.data)
