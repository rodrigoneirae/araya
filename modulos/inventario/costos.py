"""Costo promedio por artículo y valoración de ingresos OCAT y PE."""
from decimal import Decimal
from collections import Counter
from math import isfinite

from modulos.inventario.models.movs import Movs
from modulos.maestros.models.articulos import Articulos


def decimal(valor):
    return Decimal(str(valor or 0))


def stock_actual(codigo):
    movimientos = (Movs.objects.filter(codigo_id=codigo, linea__gt=0)
                   .exclude(tipo_id__in=[8, 15]).select_related('tipo'))
    saldo = Decimal(0)
    for mov in movimientos:
        cantidad = decimal(mov.cantidad)
        if mov.tipo_id in (10, 12) or (mov.tipo and (mov.tipo.signo or 0) < 0):
            saldo -= abs(cantidad)
        elif mov.tipo_id in (6, 7, 11) or (mov.tipo and (mov.tipo.signo or 0) > 0):
            saldo += cantidad
    return saldo


def cup_reemplazo(articulo, anteriores, nuevos, permitir_eliminacion=False, advertencias=None):
    """Reemplaza el valor del ingreso, sin revalorizar consumos ya registrados."""
    stock = stock_actual(articulo.codigo)
    cantidad_anterior = sum((decimal(m.cantidad) for m in anteriores), Decimal(0))
    valor_anterior = sum((decimal(m.cantidad) * decimal(m.punit) for m in anteriores), Decimal(0))
    cantidad_nueva = sum((decimal(d['cantidad']) for d in nuevos), Decimal(0))
    valor_nuevo = sum((decimal(d['cantidad']) * decimal(d['punit']) for d in nuevos), Decimal(0))
    if not anteriores and stock <= 0 and cantidad_nueva > 0:
        return float(valor_nuevo / cantidad_nueva)
    restante = stock - cantidad_anterior
    saldo = restante + cantidad_nueva
    if saldo > 0:
        valor = stock * decimal(articulo.cup) - valor_anterior + valor_nuevo
        if valor < 0:
            mensaje = 'La corrección deja una valoración negativa; revise los ingresos y consumos del artículo.'
            viejas_lineas = Counter((decimal(m.cantidad), decimal(m.punit)) for m in anteriores)
            nuevas_lineas = Counter((decimal(d['cantidad']), decimal(d['punit'])) for d in nuevos)
            # Solo quitar líneas existentes: no habilita cambios de precio/cantidad ni otros ingresos.
            if permitir_eliminacion and nuevas_lineas < viejas_lineas:
                if advertencias is not None:
                    advertencias.append(f'{articulo.codigo}: {mensaje} Se conserva el CUP actual al eliminar.')
                return float(articulo.cup or 0)
            raise ValueError(mensaje)
        return float(valor / saldo)
    if cantidad_nueva > 0:
        return float(valor_nuevo / cantidad_nueva)
    return float(articulo.cup or 0)


def cup_manual_ingreso(detalles):
    valores = {decimal(d['cup_manual']) for d in detalles
               if d.get('cup_manual') not in (None, '')}
    if any(not valor.is_finite() or valor < 0 or not isfinite(float(valor)) for valor in valores):
        raise ValueError('El CUP manual debe ser un número finito no negativo.')
    if len(valores) > 1:
        raise ValueError('Todas las líneas de un artículo deben usar el mismo CUP manual.')
    return float(next(iter(valores))) if valores else None


def actualizar_cup_ingreso(numero, detalles, tipo, permitir_cup_manual=False,
                           permitir_eliminacion=False, advertencias=None):
    anteriores = list(Movs.objects.filter(numero=numero, tipo_id=tipo, linea__gt=0))
    codigos = {m.codigo_id for m in anteriores if m.codigo_id}
    for det in detalles:
        cantidad = float(det.get('cantidad', 0))
        precio = float(det.get('punit', 0))
        if not det.get('codigo') or not isfinite(cantidad) or not isfinite(precio) or cantidad <= 0 or precio < 0:
            raise ValueError('Cada ingreso requiere artículo, cantidad positiva y precio no negativo.')
        codigos.add(det['codigo'])
    articulos = list(Articulos.objects.select_for_update().filter(codigo__in=codigos).order_by('codigo'))
    if len(articulos) != len(codigos):
        raise ValueError('Artículo no encontrado')
    cups = {}
    for articulo in articulos:
        viejos = [m for m in anteriores if m.codigo_id == articulo.codigo]
        nuevos = [d for d in detalles if d['codigo'] == articulo.codigo]
        cup_manual = cup_manual_ingreso(nuevos) if permitir_cup_manual else None
        if cup_manual is not None:
            articulo.cup = cup_manual
            articulo.save(update_fields=['cup'])
            cups[articulo.codigo] = cup_manual
            continue
        # Guardar sin cambios no debe alterar el costo por redondeos.
        if sorted((m.cantidad or 0, m.punit or 0) for m in viejos) == sorted(
                (float(d['cantidad']), float(d['punit'])) for d in nuevos):
            cups[articulo.codigo] = articulo.cup or 0
            continue
        articulo.cup = cup_reemplazo(
            articulo, viejos, nuevos, permitir_eliminacion=permitir_eliminacion,
            advertencias=advertencias)
        articulo.save(update_fields=['cup'])
        cups[articulo.codigo] = articulo.cup
    return cups
