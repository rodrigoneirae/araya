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

import tkinter as tk
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
        f"APPHOST=localhost\n"
        f"APPPORT=1433\n"
        f"APPDB=Prod\n"
        f"APPUSER=sa\n"
        f"APPPASSWORD=\n"
        f"SOFTLAND_HOST=localhost\n"
        f"SOFTLAND_PORT=1433\n"
        f"SOFTLAND_DB=\n"
        f"SOFTLAND_USER=sa\n"
        f"SOFTLAND_PASSWORD=\n"
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

    if 'softland' in settings.DATABASES:
        settings.DATABASES['softland']['NAME'] = os.getenv("SOFTLAND_DB")

        settings.DATABASES['softland']['USER'] = os.getenv("SOFTLAND_USER")

        settings.DATABASES['softland']['PASSWORD'] = decrypt_password(
            os.getenv("SOFTLAND_PASSWORD", "")
        )

        settings.DATABASES['softland']['HOST'] = os.getenv("SOFTLAND_HOST")

        settings.DATABASES['softland']['PORT'] = os.getenv("SOFTLAND_PORT")


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
    encrypted_soft_password = encrypt_password(soft_password_var.get())
    fields = [
        ("APPHOST", host_var.get()),
        ("APPPORT", port_var.get()),
        ("APPDB", name_var.get()),
        ("APPUSER", user_var.get()),
        ("APPPASSWORD", encrypted_password),
        ("SOFTLAND_HOST", soft_host_var.get()),
        ("SOFTLAND_PORT", soft_port_var.get()),
        ("SOFTLAND_DB", soft_name_var.get()),
        ("SOFTLAND_USER", soft_user_var.get()),
        ("SOFTLAND_PASSWORD", encrypted_soft_password),
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

    os.environ["SOFTLAND_DB"] = soft_name_var.get()
    os.environ["SOFTLAND_USER"] = soft_user_var.get()
    os.environ["SOFTLAND_PASSWORD"] = encrypted_soft_password
    os.environ["SOFTLAND_HOST"] = soft_host_var.get()
    os.environ["SOFTLAND_PORT"] = soft_port_var.get()

    actualizar_database_settings()
    connections.close_all()


def test_conexion():
    guardar_credenciales()

    ok, mensaje = probar_conexion()

    if ok:

        status_label_araya.config(
            text="✓ Conexión exitosa",
            bootstyle="success"
        )

        messagebox.showinfo(
            "Conexión",
            "Conexión exitosa"
        )

    else:

        status_label_araya.config(
            text="✗ Error de conexión",
            bootstyle="danger"
        )

        messagebox.showerror(
            "Error conexión",
            mensaje
        )


def probar_conexion_softland():
    try:
        connections.close_all()

        connection = connections['softland']

        connection.ensure_connection()

        return True, "Conexión exitosa"

    except Exception as e:

        return False, str(e)


def test_conexion_softland():
    guardar_credenciales()

    ok, mensaje = probar_conexion_softland()

    if ok:

        status_label_softland.config(
            text="✓ Conexión exitosa",
            bootstyle="success"
        )

        messagebox.showinfo(
            "Conexión Softland",
            "Conexión exitosa"
        )

    else:

        status_label_softland.config(
            text="✗ Error de conexión",
            bootstyle="danger"
        )

        messagebox.showerror(
            "Error conexión Softland",
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
        ok_def, msg_def = probar_conexion()
        write_log(f"Conexión Araya DB: {ok_def} - {msg_def}")
        ok_soft, msg_soft = probar_conexion_softland()
        write_log(f"Conexión Softland DB: {ok_soft} - {msg_soft}")
    except Exception as e:
        write_log(f"ERROR probar_conexion: {e}")
        ok_def, msg_def = False, str(e)
        ok_soft, msg_soft = False, str(e)

    logger.info(f"Conexión Araya DB: {ok_def} - {msg_def}")
    logger.info(f"Conexión Softland DB: {ok_soft} - {msg_soft}")

    if not ok_def:
        status_label.config(
            text="✗ Error conexión Araya",
            bootstyle="danger"
        )

        messagebox.showerror(
            "Error conexión Araya",
            msg_def
        )

        logger.error(f"Error conexión Araya: {msg_def}")
        write_log(f"Error conexión Araya: {msg_def}")

        return

    if not ok_soft:
        status_label.config(
            text="✗ Error conexión Softland",
            bootstyle="danger"
        )

        messagebox.showerror(
            "Error conexión Softland",
            msg_soft
        )

        logger.error(f"Error conexión Softland: {msg_soft}")
        write_log(f"Error conexión Softland: {msg_soft}")

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
        # MIGRATIONS
        # =========================

        write_log("Ejecutando migrate...")

        call_command(
            'migrate',
            interactive=False,
            verbosity=0,
        )

        write_log("migrate completado")

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

root.geometry("600x860")

root.minsize(600, 860)

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

soft_host_var = ttk.StringVar(
    value=os.getenv("SOFTLAND_HOST", "localhost")
)

soft_port_var = ttk.StringVar(
    value=os.getenv("SOFTLAND_PORT", "1433")
)

soft_name_var = ttk.StringVar(
    value=os.getenv("SOFTLAND_DB", "")
)

soft_user_var = ttk.StringVar(
    value=os.getenv("SOFTLAND_USER", "sa")
)

soft_password_var = ttk.StringVar(
    value=decrypt_password(
        os.getenv("SOFTLAND_PASSWORD", "")
    )
)

# =========================================================
# MAIN CONTAINER
# =========================================================

main = ttk.Frame(
    root,
    padding=15
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
        pady=(0, 8)
    )

# =========================================================
# NOTEBOOK WITH TABS
# =========================================================

notebook = ttk.Notebook(main)
notebook.pack(fill=BOTH, expand=True)


def create_field(parent, label, variable, show=None):
    container = ttk.Frame(parent)

    container.pack(
        fill=X,
        pady=8
    )

    lbl = ttk.Label(
        container,
        text=label,
        style="Field.TLabel"
    )

    lbl.pack(
        anchor=W,
        pady=(0, 4)
    )

    entry = ttk.Entry(
        container,
        textvariable=variable,
        show=show,
        font=("Segoe UI", 11)
    )

    entry.pack(
        fill=X,
        ipady=8
    )

    return entry


def make_tab(parent, fields, test_cmd):
    frame = ttk.Frame(parent, padding=8)
    frame.pack(fill=BOTH, expand=True)

    try:
        canvas_bg = style.lookup("TFrame", "background")
    except Exception:
        canvas_bg = "#1a1a2e"
    canvas = tk.Canvas(frame, highlightthickness=0, bg=canvas_bg)
    scrollbar = ttk.Scrollbar(frame, orient="vertical", command=canvas.yview)
    scrollable = ttk.Frame(canvas)

    scrollable.bind(
        "<Configure>",
        lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
    )

    canvas.create_window((0, 0), window=scrollable, anchor="nw")
    canvas.configure(yscrollcommand=scrollbar.set)

    canvas.pack(side="left", fill=BOTH, expand=True)
    scrollbar.pack(side="right", fill="y")

    def _on_mousewheel(event):
        canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

    canvas.bind("<Enter>", lambda e: canvas.bind_all("<MouseWheel>", _on_mousewheel, add="+"))
    canvas.bind("<Leave>", lambda e: canvas.unbind_all("<MouseWheel>"))

    row = ttk.Frame(scrollable)
    row.pack(fill=BOTH, expand=True)

    left = ttk.Frame(row)
    left.pack(side=LEFT, fill=BOTH, expand=True)

    for label, var, show in fields:
        create_field(left, label, var, show=show)

    right = ttk.Frame(row, padding=(20, 0, 0, 0))
    right.pack(side=RIGHT, fill=Y)

    status = ttk.Label(
        right,
        text="",
        style="Status.TLabel"
    )
    status.pack(pady=(0, 10))

    btn = ttk.Button(
        right,
        text="Probar\nconexión",
        bootstyle="info",
        command=test_cmd
    )
    btn.pack(ipady=12, ipadx=10)

    return status


# --- Tab Araya ---
tab_araya = ttk.Frame(notebook)
notebook.add(tab_araya, text="  Araya  ")

araya_fields = [
    ("Servidor SQL", host_var, None),
    ("Puerto", port_var, None),
    ("Base de Datos", name_var, None),
    ("Usuario", user_var, None),
    ("Contraseña", password_var, "•"),
]
status_label_araya = make_tab(tab_araya, araya_fields, test_conexion)

# --- Tab Softland ---
tab_softland = ttk.Frame(notebook)
notebook.add(tab_softland, text="  Softland  ")

softland_fields = [
    ("Servidor SQL", soft_host_var, None),
    ("Puerto", soft_port_var, None),
    ("Base de Datos", soft_name_var, None),
    ("Usuario", soft_user_var, None),
    ("Contraseña", soft_password_var, "•"),
]
status_label_softland = make_tab(tab_softland, softland_fields, test_conexion_softland)

# =========================================================
# BOTTOM STATUS
# =========================================================

status_label = ttk.Label(
    main,
    text="",
    style="Status.TLabel"
)

status_label.pack(
    pady=(8, 5)
)

# =========================================================
# BUTTONS
# =========================================================

buttons = ttk.Frame(main)

buttons.pack(
    fill=X,
    pady=(5, 0)
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
    pady=(12, 0)
)

# =========================================================
# AUTO TEST & AUTO START
# =========================================================

ok_def, _ = probar_conexion()
ok_soft, _ = probar_conexion_softland()

if ok_def and ok_soft:
    status_label.config(
        text="✓ Conexiones encontradas — iniciando servidor...",
        bootstyle="success"
    )

    root.after(
        1000,
        iniciar_servidor
    )

else:
    if not ok_def:
        status_label_araya.config(
            text="✗ Error de conexión",
            bootstyle="danger"
        )
    if not ok_soft:
        status_label_softland.config(
            text="✗ Error de conexión",
            bootstyle="danger"
        )

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
