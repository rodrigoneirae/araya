import os
import sys
import logging
import traceback
from pathlib import Path
from datetime import datetime

import django

from dotenv import load_dotenv, set_key

from django.conf import settings
from django.db import connections
from django.core.wsgi import get_wsgi_application

import ttkbootstrap as ttk
from ttkbootstrap.constants import *

from tkinter import messagebox, PhotoImage

from waitress import serve

from cryptography.fernet import Fernet

from django.core.management import call_command


LOG_FILE = None

logger = None


def write_log(msg):
    timestamp = datetime.now().isoformat()
    log_line = f"{timestamp} - {msg}"
    print(log_line)
    global LOG_FILE
    if LOG_FILE is None and 'APP_DIR' in globals():
        try:
            LOG_FILE = APP_DIR / "araya.log"
            LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(LOG_FILE, "a", encoding="utf-8") as f:
                f.write(log_line + "\n")
                f.flush()
        except Exception as e:
            print(f"LOG ERROR: {e}")
    elif LOG_FILE:
        try:
            with open(LOG_FILE, "a", encoding="utf-8") as f:
                f.write(log_line + "\n")
                f.flush()
        except Exception as e:
            print(f"LOG ERROR: {e}")


# =========================================================
# PATHS
# =========================================================

TAURI_BASE_DIR = os.environ.get('AQUAI_BASE_DIR')

if TAURI_BASE_DIR:
    APP_DIR = Path(TAURI_BASE_DIR)
    APP_DIR.mkdir(parents=True, exist_ok=True)
    BASE_DIR = Path(sys.executable).parent if getattr(sys, 'frozen', False) else Path(__file__).resolve().parent
elif getattr(sys, 'frozen', False):
    APP_DIR = Path.home() / "AppData" / "Local" / "Araya"
    APP_DIR.mkdir(parents=True, exist_ok=True)
    BASE_DIR = Path(sys.executable).parent
else:
    APP_DIR = Path(__file__).resolve().parent
    BASE_DIR = APP_DIR


if getattr(sys, 'frozen', False):
    STATIC_ROOT = BASE_DIR / 'staticfiles'
else:
    STATIC_ROOT = BASE_DIR / 'staticfiles'

ENV_FILE = APP_DIR / '.env-desktop'

KEY_FILE = APP_DIR / '.key'

write_log(f"=== INICIO APP ===")
write_log(f"sys.frozen: {getattr(sys, 'frozen', False)}")
write_log(f"TAURI_BASE_DIR: {TAURI_BASE_DIR}")
write_log(f"APP_DIR: {APP_DIR}")
write_log(f"ENV_FILE: {ENV_FILE}")
write_log(f"ENV_FILE exists: {ENV_FILE.exists()}")
write_log(f"KEY_FILE: {KEY_FILE}")
write_log(f"KEY_FILE exists: {KEY_FILE.exists()}")

if not ENV_FILE.exists():
    write_log("Creando .env-desktop inicial con valores por defecto")
    ENV_FILE.write_text(
        f"SECRET_KEY=araya-cl-z8mlzmq32hj*jhzqw7yn-5uc(_9w3cirh^koh=$7270xn_#&5o\n"
        f"FERNET_KEY=Xn6kYz8dR2p2R0cM5lMZx0C7yF3Xk3Wk8y8zqY9N0xE=\n"
        f"ALLOWED_HOSTS=127.0.0.1,localhost\n"
    )

tauri_version = os.environ.get('APP_VERSION')
if tauri_version:
    write_log(f"APP_VERSION desde Tauri: {tauri_version}")
    os.environ['APP_VERSION'] = tauri_version


logger = logging.getLogger(__name__)


# =========================================================
# SECURITY
# =========================================================

def obtener_key():
    if not KEY_FILE.exists():
        key = Fernet.generate_key()

        KEY_FILE.write_bytes(key)

    return KEY_FILE.read_bytes()


FERNET = Fernet(
    obtener_key()
)


def encrypt_password(password):
    return FERNET.encrypt(
        password.encode()
    ).decode()


def decrypt_password(password):
    if not password:
        return ""

    try:

        return FERNET.decrypt(
            password.encode()
        ).decode()

    except Exception:

        return ""


# =========================================================
# LOAD ENV
# =========================================================

write_log(f"Cargando ENV_FILE: {ENV_FILE}")
write_log(f"ENV_FILE existe: {ENV_FILE.exists()}")

if ENV_FILE.exists():
    write_log(f"ENV_FILE contenido: {ENV_FILE.read_text()[:300]}")

load_dotenv(ENV_FILE)

write_log(f"APPHOST luego de load_dotenv: {os.getenv('APPHOST')}")
write_log(f"APPDB luego de load_dotenv: {os.getenv('APPDB')}")
write_log(f"APPUSER luego de load_dotenv: {os.getenv('APPUSER')}")

os.environ['SECRET_KEY'] = os.getenv('SECRET_KEY', 'araya-desktop-secret-key-fallback')
os.environ['APP_VERSION'] = os.getenv('APP_VERSION', '0.1.0')
os.environ['DEBUG'] = 'False'
os.environ['WEB'] = 'False'
os.environ['ALLOWED_HOSTS'] = '127.0.0.1,localhost'
os.environ['USE_ASGI'] = 'False'
os.environ['USE_REDIS'] = 'False'

if not os.getenv('SECRET_KEY'):
    write_log("WARNING: SECRET_KEY no encontrada en .env-desktop")

write_log(f"DEBUG setting: {os.getenv('DEBUG')}")
write_log(f"SECRET_KEY: {os.getenv('SECRET_KEY')[:20]}...")

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "araya.settings.desktop"
)

os.environ['STATIC_ROOT'] = str(STATIC_ROOT)

# =========================================================
# DJANGO INIT
# =========================================================

write_log("Ejecutando django.setup()...")
django.setup()
write_log("django.setup() completado")


# =========================================================
# HELPERS
# =========================================================

def actualizar_database_settings():
    settings.DATABASES['default']['NAME'] = os.getenv("APPDB")

    settings.DATABASES['default']['USER'] = os.getenv("APPUSER")

    settings.DATABASES['default']['PASSWORD'] = decrypt_password(
        os.getenv("APPPASSWORD", "")
    )

    settings.DATABASES['default']['HOST'] = os.getenv("APPHOST")

    settings.DATABASES['default']['PORT'] = os.getenv("APPPORT")


actualizar_database_settings()


def probar_conexion():
    try:

        connections.close_all()

        connection = connections['default']

        connection.ensure_connection()

        return True, "Conexión exitosa"

    except Exception as e:

        return False, str(e)


def guardar_credenciales():
    write_log("=== GUARDANDO CREDENCIALES ===")

    encrypted_password = encrypt_password(password_var.get())
    fields = [
        ("APPHOST", host_var.get()),
        ("APPPORT", port_var.get()),
        ("APPDB", name_var.get()),
        ("APPUSER", user_var.get()),
        ("APPPASSWORD", encrypted_password),
    ]

    for key, value in fields:
        try:
            set_key(str(ENV_FILE), key, value, quote_mode="never")
            write_log(f"{key} guardado")
        except Exception as e:
            write_log(f"ERROR {key}: {e}")

    write_log("Credenciales guardadas correctamente")

    load_dotenv(ENV_FILE, override=True)

    os.environ["APPDB"] = name_var.get()
    os.environ["APPUSER"] = user_var.get()
    os.environ["APPPASSWORD"] = encrypted_password
    os.environ["APPHOST"] = host_var.get()
    os.environ["APPPORT"] = port_var.get()

    actualizar_database_settings()
    connections.close_all()


def test_conexion():
    guardar_credenciales()

    ok, mensaje = probar_conexion()

    if ok:

        status_label.config(
            text="✓ Conexión exitosa",
            bootstyle="success"
        )

        messagebox.showinfo(
            "Conexión",
            "Conexión exitosa"
        )

    else:

        status_label.config(
            text="✗ Error de conexión",
            bootstyle="danger"
        )

        messagebox.showerror(
            "Error conexión",
            mensaje
        )


def iniciar_servidor():
    write_log("=== INICIANDO SERVER ===")
    logger.info("=== INICIANDO ARAYA SERVER ===")

    try:
        guardar_credenciales()
        write_log("Credenciales guardadas")
    except Exception as e:
        write_log(f"ERROR guardar_credenciales: {e}")
        logger.error(f"ERROR guardar_credenciales: {e}")

    os.environ['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback-secret-key')
    os.environ['APP_VERSION'] = os.getenv('APP_VERSION', '0.0.0')
    os.environ['DEBUG'] = 'False'
    os.environ['ALLOWED_HOSTS'] = '127.0.0.1,localhost'

    try:
        ok, mensaje = probar_conexion()
        write_log(f"Conexión DB: {ok} - {mensaje}")
    except Exception as e:
        write_log(f"ERROR probar_conexion: {e}")
        ok, mensaje = False, str(e)

    logger.info(f"Conexión DB: {ok} - {mensaje}")

    if not ok:
        status_label.config(
            text="✗ Error de conexión",
            bootstyle="danger"
        )

        messagebox.showerror(
            "Error conexión",
            mensaje
        )

        logger.error(f"Error conexión: {mensaje}")
        write_log(f"Error conexión: {mensaje}")

        return

    status_label.config(
        text="✓ Iniciando servidor...",
        bootstyle="success"
    )

    try:

        logger.info("Cerrando conexiones DB...")
        connections.close_all()

        logger.info("Actualizando settings de Django...")
        actualizar_database_settings()

        settings.DEBUG = False
        settings.SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-secret-key')
        settings.ALLOWED_HOSTS = ['127.0.0.1', 'localhost']

        write_log("Obteniendo WSGI application...")
        logger.info("Obteniendo WSGI application...")

        # =========================
        # COLLECTSTATIC
        # =========================

        write_log("Ejecutando collectstatic...")

        call_command(
            'collectstatic',
            interactive=False,
            verbosity=0,
            clear=True,
        )

        write_log("collectstatic completado")

        try:
            app = get_wsgi_application()
            write_log("WSGI app obtenida")
        except Exception as e:
            write_log(f"ERROR get_wsgi_application: {e}\n{traceback.format_exc()}")
            raise

        logger.info("Cerrando UI...")
        root.destroy()

        write_log("Iniciando servidor Waitress en 127.0.0.1:1111...")
        logger.info("Iniciando servidor Waitress en 127.0.0.1:1111...")

        serve(
            app,
            host="127.0.0.1",
            port=1111,
            threads=6,
            channel_timeout=120,
            cleanup_interval=30,
        )

    except Exception as e:

        error_msg = f"{str(e)}\n\n{traceback.format_exc()}"
        logger.error(f"ERROR EN SERVIDOR: {error_msg}")
        write_log(f"ERROR EN SERVIDOR: {error_msg}")

        messagebox.showerror(
            "Error servidor",
            f"Error: {str(e)}\n\nConsulta el log en: {LOG_FILE}"
        )


# =========================================================
# UI
# =========================================================

root = ttk.Window(
    title="Araya Ltda.",
    themename="darkly",
    resizable=(True, True)
)

root.geometry("520x780")

root.minsize(520, 780)

# =========================================================
# CUSTOM STYLE
# =========================================================

style = ttk.Style()

style.configure(
    "Title.TLabel",
    background="#1a1a2e",
    foreground="#4a7c59",
    font=("Segoe UI", 22, "bold"),
)

style.configure(
    "Sub.TLabel",
    background="#1a1a2e",
    foreground="#6b8a6b",
    font=("Segoe UI", 9),
)

style.configure(
    "Field.TLabel",
    background="#1a1a2e",
    foreground="#c9d6c9",
    font=("Segoe UI", 10, "bold"),
)

style.configure(
    "Status.TLabel",
    background="#1a1a2e",
    font=("Segoe UI", 10),
)

# =========================================================
# VARIABLES
# =========================================================

host_var = ttk.StringVar(
    value=os.getenv("APPHOST", "localhost")
)

port_var = ttk.StringVar(
    value=os.getenv("APPPORT", "1433")
)

name_var = ttk.StringVar(
    value=os.getenv("APPDB", "Prod")
)

user_var = ttk.StringVar(
    value=os.getenv("APPUSER", "sa")
)

password_var = ttk.StringVar(
    value=decrypt_password(
        os.getenv("APPPASSWORD", "")
    )
)

# =========================================================
# MAIN CONTAINER
# =========================================================

main = ttk.Frame(
    root,
    padding=30
)

main.pack(
    fill=BOTH,
    expand=True
)

# =========================================================
# LOGO
# =========================================================

logo_path = (
        BASE_DIR
        / 'theme'
        / 'static'
        / 'assets'
        / 'images'
        / 'brand-logos'
        / 'desktop-logo.png'
)

logo_img = None

if logo_path.exists():
    logo_img = PhotoImage(
        file=str(logo_path)
    )

    logo_img = logo_img.subsample(2, 2)

    logo_label = ttk.Label(
        main,
        image=logo_img,
        bootstyle="primary"
    )

    logo_label.pack(
        pady=(0, 10)
    )

# =========================================================
# FORM
# =========================================================

form = ttk.Frame(main)

form.pack(
    fill=X,
    expand=True
)


def create_field(label, variable, show=None):
    container = ttk.Frame(form)

    container.pack(
        fill=X,
        pady=10
    )

    lbl = ttk.Label(
        container,
        text=label,
        style="Field.TLabel"
    )

    lbl.pack(
        anchor=W,
        pady=(0, 5)
    )

    entry = ttk.Entry(
        container,
        textvariable=variable,
        show=show,
        font=("Segoe UI", 11)
    )

    entry.pack(
        fill=X,
        ipady=10
    )

    return entry


create_field("Servidor SQL", host_var)

create_field("Puerto", port_var)

create_field("Base de Datos", name_var)

create_field("Usuario", user_var)

create_field("Contraseña", password_var, show="•")

# =========================================================
# STATUS
# =========================================================

status_label = ttk.Label(
    main,
    text="",
    style="Status.TLabel"
)

status_label.pack(
    pady=(20, 10)
)

# =========================================================
# BUTTONS
# =========================================================

buttons = ttk.Frame(main)

buttons.pack(
    fill=X,
    pady=(10, 0)
)

btn_test = ttk.Button(
    buttons,
    text="Probar conexión",
    bootstyle="info",
    command=test_conexion
)

btn_test.pack(
    side=LEFT,
    expand=True,
    fill=X,
    padx=(0, 10),
    ipady=12
)

btn_start = ttk.Button(
    buttons,
    text="Iniciar servidor",
    bootstyle="success",
    command=iniciar_servidor
)

btn_start.pack(
    side=LEFT,
    expand=True,
    fill=X,
    padx=(10, 0),
    ipady=12
)

# =========================================================
# VERSION
# =========================================================

version_label = ttk.Label(
    main,
    text="v1.0.0",
    style="Sub.TLabel"
)

version_label.pack(
    side=BOTTOM,
    pady=(20, 0)
)

# =========================================================
# AUTO TEST & AUTO START
# =========================================================

ok, _ = probar_conexion()

if ok:
    status_label.config(
        text="✓ Conexión encontrada — iniciando servidor...",
        bootstyle="success"
    )

    root.after(
        1000,
        iniciar_servidor
    )

else:

    status_label.config(
        text="Configura las credenciales",
        bootstyle="warning"
    )


# =========================================================
# CENTER WINDOW
# =========================================================

root.update_idletasks()

width = root.winfo_width()

height = root.winfo_height()

x = (root.winfo_screenwidth() // 2) - (width // 2)

y = (root.winfo_screenheight() // 2) - (height // 2)

root.geometry(
    f"{width}x{height}+{x}+{y}"
)


# =========================================================
# RUN
# =========================================================

root.mainloop()
