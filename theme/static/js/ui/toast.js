const TOAST_TYPES = {
    success: { color: "#22c55e", icon: "bx bx-check-circle" },
    danger: { color: "#ef4444", icon: "bx bx-x-circle" },
    warning: { color: "#f59e0b", icon: "bx bx-error" },
    info: { color: "#3b82f6", icon: "bx bx-info-circle" },
};

export function showToast(message, type = "success", duration = 4000) {
    if (typeof window.Toastify === "undefined") {
        console.error("Toastify no está cargado");
        return;
    }

    const toast = TOAST_TYPES[type] || TOAST_TYPES.success;
    const position = window.matchMedia("(max-width: 767px)").matches ? "center" : "right";

    window.Toastify({
        text: `<div class="inline-flex items-center gap-2 whitespace-nowrap"><i class="${toast.icon} text-lg"></i><span>${message}</span></div>`,
        escapeMarkup: false,
        duration: duration,
        gravity: "top",
        position: position,
        close: true,
        stopOnFocus: true,
        style: {
            background: `linear-gradient(to right, ${toast.color}, ${toast.color})`,
            width: "fit-content",
            maxWidth: "100%",
        },
    }).showToast();
}