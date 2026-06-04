from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from modulos.inventario.models.movs import Movs
from modulos.maestros.models.docs import Docs
from modulos.maestros.models.empleados import Empleados

from .serializers import OTListSerializer, OTDetailSerializer


class OTFiltroPorEncargadoMixin:
    def get_encargado_cod(self, request):
        if hasattr(request, 'user') and request.user.is_authenticated:
            try:
                empleado = Empleados.objects.get(user=request.user)
                return empleado.cod
            except Empleados.DoesNotExist:
                pass
        return None


class OTListAPIView(OTFiltroPorEncargadoMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cod_encargado = self.get_encargado_cod(request)

        docs_ot = Docs.objects.filter(cod=8).first()
        if not docs_ot:
            return Response({'error': 'Tipo documento OT no encontrado'}, status=404)

        qs = Movs.objects.filter(tipo=docs_ot, linea=0)

        if cod_encargado is not None:
            qs = qs.filter(codencargado=cod_encargado)

        estado = self.request.query_params.get('estado')
        if estado:
            qs = qs.filter(estado__iexact=estado)
        else:
            qs = qs.filter(estado__iexact='Abierto')

        qs = qs.order_by('-fecha')[:50]

        serializer = OTListSerializer(qs, many=True)
        return Response(serializer.data)


class OTDetailAPIView(OTFiltroPorEncargadoMixin, APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, numero):
        cod_encargado = self.get_encargado_cod(request)

        docs_ot = Docs.objects.filter(cod=8).first()
        if not docs_ot:
            return Response({'error': 'Tipo documento OT no encontrado'}, status=404)

        try:
            numero_float = float(numero)
        except (ValueError, TypeError):
            return Response({'error': 'Número inválido'}, status=400)

        try:
            ot = Movs.objects.get(tipo=docs_ot, numero=numero_float, linea=0)
        except Movs.DoesNotExist:
            return Response({'error': 'OT no encontrada'}, status=404)

        if cod_encargado is not None and ot.codencargado != cod_encargado:
            return Response({'error': 'OT no pertenece a este encargado'}, status=403)

        serializer = OTDetailSerializer(ot)
        return Response(serializer.data)