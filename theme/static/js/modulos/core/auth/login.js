import {showToast} from "../../../ui/toast.js";

const initLogin = () => {
    const signinBtn = document.getElementById("signin-btn");
    const signinUsername = document.getElementById("signin-username");
    const signinPassword = document.getElementById("signin-password");
    const errorMessage = document.getElementById("errorMessage");
    const loginForm = document.getElementById("loginForm");

    if (!signinBtn || !signinUsername || !signinPassword) return;

    signinBtn.addEventListener("click", async () => {
        const username = signinUsername.value.trim();
        const password = signinPassword.value;

        if (!username || !password) {
            showToast("Ingrese usuario y contraseña", "danger");
            return;
        }

        signinBtn.disabled = true;
        signinBtn.textContent = "Cargando...";

        try {
            const formData = new FormData(loginForm);
            formData.set("login", username);
            formData.set("password", password);

            const data = await window.apiFetch(window.location.pathname, {
                method: "POST",
                body: formData
            });

            if (data.status === "success") {
                window.location.href = data.next || "/";
            } else {
                const msg = data.message || "Error de autenticación";
                if (errorMessage) {
                    errorMessage.textContent = msg;
                    errorMessage.classList.remove("hidden");
                }
                showToast(msg, "danger");
            }
        } catch (err) {
            let message = "Error de conexión";
            if (typeof err === "object" && err !== null) {
                message = err.message || err.error || JSON.stringify(err);
            } else if (typeof err === "string") {
                message = err;
            }
            if (errorMessage) {
                errorMessage.textContent = message;
                errorMessage.classList.remove("hidden");
            }
            showToast(message, "danger");
        } finally {
            signinBtn.disabled = false;
            signinBtn.textContent = "Entrar";
        }
    });

    signinPassword.addEventListener("keypress", e => {
        if (e.key === "Enter") signinBtn.click();
    });
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLogin);
} else {
    initLogin();
}
