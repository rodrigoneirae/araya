from modulos.softland.models.cwtauxi import Cwtauxi
from django.db.models import Q
class SoftlandCtaCteAPI:
    def __init__(self):
        pass

    def get_ctacte_softland_data(self):
        try:

            data=[]
            resultados = Cwtauxi.objects.all().exclude(email=None).using('softland')

            # Usamos un diccionario para eliminar duplicados por email
            data_dict = {}
            for cliente in resultados:
                email = cliente.email.lower() if cliente.email else None
                if email and email not in data_dict and not '@sii.cl' in email:
                    item = {
                        'nombre': cliente.nomaux.title() if cliente.nomaux else None,
                        'correo': email,
                        'origen': 'softland',
                    }
                    data_dict[email] = item
                    data.append(data_dict)


            data = list(data_dict.values())

            #verificar si hay correos duplicados
            unique_data = {}
            for item in data:
                if item['correo'] not in unique_data:
                    unique_data[item['correo']] = item
            data = list(unique_data.values())




            return data

        except Exception as e:
            print(f"Error al obtener datos de Correos: {e}")
            return []

    def get_ctacte_softland_codigo(self, codigo):
        try:
            data = []
            clientes = Cwtauxi.objects.filter(Q(codaux__contains=codigo) |
        Q(nomaux__icontains=codigo)).using('softland')[0:5]
            if clientes:
                for cliente in clientes:
                    data.append(cliente.to_json())
                return data
            return None
        except Exception as e:
            print(f"Error al obtener datos del cliente con código {codigo}: {e}")
            return None