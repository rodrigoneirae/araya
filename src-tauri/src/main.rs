// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::{
    atomic::{AtomicBool},
    Mutex,
};
use std::thread;
use std::time::Duration;
use tauri::{Manager, RunEvent};

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

static CHECKING_UPDATES: AtomicBool = AtomicBool::new(false);

#[tauri::command]
async fn open_file(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .manage(Mutex::new(None::<Child>))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            let handle = app.handle();
            let app_dir = handle.path().app_data_dir().expect("Error AppData");
            let resource_dir = handle.path().resource_dir().expect("Error Resources");

            let loading_html = if cfg!(debug_assertions) {
                PathBuf::from(".").join("loading.html")
            } else {
                resource_dir.join("loading.html")
            };

            if !loading_html.exists() {
                eprintln!("⚠️ Loading HTML no encontrado!");
            } else {
                println!("📄 Loading HTML encontrado");
            }

            let backend_exec = if cfg!(debug_assertions) {
                let use_dev = std::env::var("USE_DEV_BACKEND").unwrap_or_default();
                if use_dev == "1" {
                    None
                } else {
                    let bin_path = PathBuf::from("..")
                        .join("dist-nuitka")
                        .join("bin")
                        .join(if cfg!(windows) { "araya-backend.exe" } else { "araya-backend" });
                    Some(bin_path)
                }
            } else {
                let bin_path = resource_dir.join("bin");
                #[cfg(windows)]
                {
                    let exe_path = bin_path.join("araya-backend.exe");
                    if exe_path.exists() {
                        Some(exe_path)
                    } else {
                        Some(bin_path.join("araya-backend"))
                    }
                }
                #[cfg(not(windows))]
                {
                    Some(bin_path.join("araya-backend"))
                }
            };

            let use_dev_mode = backend_exec.is_none();
            println!("🔍 Modo: {}", if use_dev_mode { "Desarrollo (servidor externo)" } else { "Normal" });

            if use_dev_mode {
                println!("⚠️ Modo dev: esperando servidor en http://127.0.0.1:1111/");

                if let Some(win) = handle.get_webview_window("main") {
                    let js = r#"
                        document.body.innerHTML = `
                        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:rgb(12,16,20);font-family:'Nunito Sans',Roboto,system-ui,sans-serif;gap:1.5rem;">
                            <svg viewBox="0 0 100 100" fill="none" style="width:80px;height:80px;">
                                <circle cx="50" cy="50" r="45" stroke="rgb(74,140,90)" stroke-width="4"/>
                                <path d="M30 50 L45 65 L70 35" stroke="rgb(74,140,90)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <div style="text-align:center;">
                                <h1 style="color:rgb(230,235,240);font-size:1.75rem;font-weight:700;letter-spacing:3px;margin:0;">ARAYA LTDA</h1>
                                <p style="color:rgb(140,150,160);font-size:0.875rem;font-weight:300;margin:0.25rem 0 0 0;">Sistema de Gestión</p>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.75rem;margin-top:1rem;">
                                <div style="width:24px;height:24px;border:3px solid rgba(74,140,90,0.2);border-top:3px solid rgb(74,140,90);border-radius:50%;animation:spin 1s linear infinite;"></div>
                                <span style="color:rgb(140,150,160);font-size:0.875rem;">Esperando servidor dev...</span>
                            </div>
                            <style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
                        </div>`;
                    "#;
                    win.eval(js).ok();

                    let handle_clone = handle.clone();
                    thread::spawn(move || {
                        let window = handle_clone.clone();
                        let client = reqwest::blocking::Client::builder()
                            .timeout(Duration::from_secs(10))
                            .build()
                            .unwrap();

                        loop {
                            thread::sleep(Duration::from_millis(500));
                            if let Ok(response) = client.get("http://127.0.0.1:1111/").send() {
                                let status = response.status().as_u16();
                                if status == 200 || status == 302 || status == 301 {
                                    println!("✅ Servidor listo!");
                                    if let Some(win) = window.get_webview_window("main") {
                                        win.eval("window.location.href = 'http://127.0.0.1:1111/';").ok();
                                    }
                                    break;
                                }
                            }
                        }
                    });
                }
            } else {
                let backend_exec = backend_exec.unwrap();
                if !backend_exec.exists() {
                    eprintln!("❌ ERROR: El binario NO existe en la ruta esperada.");
                    return Ok(());
                }

                let backend_exec_abs = fs::canonicalize(&backend_exec).unwrap_or(backend_exec.clone());
                let backend_dir = backend_exec_abs.parent().unwrap().to_path_buf();

                #[cfg(unix)]
                {
                    if let Ok(metadata) = fs::metadata(&backend_exec_abs) {
                        let mut perms = metadata.permissions();
                        perms.set_mode(0o755);
                        let _ = fs::set_permissions(&backend_exec_abs, perms);
                    }
                }

                if !app_dir.exists() {
                    fs::create_dir_all(&app_dir).ok();
                }

                let logs_dir = app_dir.join("logs");
                if !logs_dir.exists() {
                    fs::create_dir_all(&logs_dir).expect("No se pudo crear directorio de logs");
                }

                let stdout_log = logs_dir.join("backend_stdout.log");
                let stderr_log = logs_dir.join("backend_stderr.log");

                let stdout_file = fs::File::create(&stdout_log).expect("No se pudo crear stdout.log");
                let stderr_file = fs::File::create(&stderr_log).expect("No se pudo crear stderr.log");

                println!("📂 Logs en: {:?}", logs_dir);

                let mut cmd = Command::new(&backend_exec_abs);
                cmd.current_dir(backend_dir)
                    .env("DJANGO_SETTINGS_MODULE", "araya.settings.desktop")
                    .env("AQUAI_BASE_DIR", &app_dir)
                    .env("PYTHONUNBUFFERED", "1")
                    .stdout(Stdio::from(stdout_file))
                    .stderr(Stdio::from(stderr_file));

                #[cfg(target_os = "linux")]
                cmd.env("LD_LIBRARY_PATH", backend_dir);

                match cmd.spawn() {
                    Ok(child) => {
                        let state = app.state::<Mutex<Option<Child>>>();
                        *state.lock().unwrap() = Some(child);

                        if let Some(win) = handle.get_webview_window("main") {
                            let js = r#"
                                document.body.innerHTML = `
                                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:rgb(12,16,20);font-family:'Nunito Sans',Roboto,system-ui,sans-serif;gap:1.5rem;">
                                    <svg viewBox="0 0 100 100" fill="none" style="width:80px;height:80px;">
                                        <circle cx="50" cy="50" r="45" stroke="rgb(74,140,90)" stroke-width="4"/>
                                        <path d="M30 50 L45 65 L70 35" stroke="rgb(74,140,90)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <div style="text-align:center;">
                                        <h1 style="color:rgb(230,235,240);font-size:1.75rem;font-weight:700;letter-spacing:3px;margin:0;">ARAYA LTDA</h1>
                                        <p style="color:rgb(140,150,160);font-size:0.875rem;font-weight:300;margin:0.25rem 0 0 0;">Sistema de Gestión</p>
                                    </div>
                                    <div style="display:flex;align-items:center;gap:0.75rem;margin-top:1rem;">
                                        <div style="width:24px;height:24px;border:3px solid rgba(74,140,90,0.2);border-top:3px solid rgb(74,140,90);border-radius:50%;animation:spin 1s linear infinite;"></div>
                                        <span style="color:rgb(140,150,160);font-size:0.875rem;">Cargando aplicación...</span>
                                    </div>
                                    <style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
                                </div>`;
                                fetch('http://127.0.0.1:1111', {method:'HEAD', cache:'no-cache'})
                                    .then(() => window.location.href = 'http://127.0.0.1:1111/')
                                    .catch(() => setTimeout(() => window.location.href = 'http://127.0.0.1:1111/', 2000));
                            "#;
                            win.eval(js).ok();
                        }

                        println!("🚀 Backend lanzado correctamente");

                        let handle_clone = handle.clone();
                        thread::spawn(move || {
                            let window = handle_clone.clone();
                            let client = reqwest::blocking::Client::builder()
                                .timeout(Duration::from_secs(30))
                                .build()
                                .unwrap();

                            loop {
                                thread::sleep(Duration::from_millis(200));
                                if let Ok(response) = client.get("http://127.0.0.1:1111/").send() {
                                    let status = response.status().as_u16();
                                    if status == 200 || status == 302 || status == 301 {
                                        println!("✅ Servidor listo!");
                                        if let Some(win) = window.get_webview_window("main") {
                                            println!("🔄 Redirigiendo a http://127.0.0.1:1111/");
                                            win.eval("window.location.href = 'http://127.0.0.1:1111/';").ok();
                                        }
                                        break;
                                    }
                                }
                            }
                        });

                        #[cfg(not(debug_assertions))]
                        {
                            let handle = handle.clone();
                            tauri::async_runtime::spawn(async move {
                                check_for_updates(handle).await;
                            });
                        }
                    }
                    Err(e) => {
                        eprintln!("❌ Error lanzando backend: {}", e);
                    }
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![open_file])
        .build(tauri::generate_context!())
        .expect("error building tauri app")
        .run(|app_handle, e| {
            if let RunEvent::ExitRequested { .. } = e {
                println!("🛑 Cerrando aplicación...");

                let state = app_handle.state::<Mutex<Option<Child>>>();
                if let Some(mut child) = state.lock().unwrap().take() {
                    kill_process(&mut child);
                } else {
                    println!("⚠️ No había backend activo");
                }

                println!("✅ Aplicación cerrada correctamente");
            }
        });
}

fn kill_process(child: &mut Child) {
    println!("🔻 Terminando proceso PID: {}", child.id());

    #[cfg(unix)]
    {
        use nix::sys::signal::{self, Signal};
        use nix::unistd::Pid;

        let pid = Pid::from_raw(child.id() as i32);

        let _ = signal::kill(pid, Signal::SIGTERM);

        for _ in 0..30 {
            if let Ok(Some(status)) = child.try_wait() {
                println!("✅ Backend terminado: {}", status);
                return;
            }
            thread::sleep(Duration::from_millis(100));
        }

        println!("⚠️ Forzando cierre...");
        let _ = signal::kill(pid, Signal::SIGKILL);

        let _ = child.wait();
    }

    #[cfg(windows)]
    {
        let _ = Command::new("taskkill")
            .args(&["/F", "/T", "/PID", &child.id().to_string()])
            .status();

        let _ = child.wait();
    }
}

#[cfg(not(debug_assertions))]
async fn check_for_updates(app_handle: tauri::AppHandle) {
    use std::sync::atomic::Ordering;
    use tauri_plugin_updater::UpdaterExt;

    if CHECKING_UPDATES.swap(true, Ordering::SeqCst) {
        return;
    }

    println!("🔄 Buscando updates...");

    match app_handle.updater() {
        Ok(updater) => match updater.check().await {
            Ok(Some(update)) => {
                println!("🆕 Nueva versión: {}", update.version);

                match update
                    .download_and_install(
                        |chunk, total| {
                            if let Some(t) = total {
                                println!("⬇️ {} / {}", chunk, t);
                            }
                        },
                        || println!("✅ Descarga completa"),
                    )
                    .await
                {
                    Ok(_) => {
                        println!("🚀 Update instalado, reiniciando...");

                        let state = app_handle.state::<Mutex<Option<Child>>>();
                        if let Some(mut child) = state.lock().unwrap().take() {
                            kill_process(&mut child);
                        }

                        app_handle.restart();
                    }
                    Err(e) => println!("❌ Error update: {:?}", e),
                }
            }
            Ok(None) => println!("✅ Sin updates"),
            Err(e) => println!("❌ Error check: {:?}", e),
        },
        Err(e) => println!("❌ Updater error: {:?}", e),
    }

    CHECKING_UPDATES.store(false, Ordering::SeqCst);
}