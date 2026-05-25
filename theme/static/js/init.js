(function () {

    /* =========================
     * DETECT TAURI
     * ========================= */

    const isTauri = typeof window.__TAURI__ !== "undefined";

    /* =========================
     * OPEN URL EXTERNALLY
     * ========================= */

    window.openExternalUrl = async function (url) {

        try {

            if (
                isTauri &&
                window.__TAURI__.shell &&
                typeof window.__TAURI__.shell.openUrl === "function"
            ) {

                await window.__TAURI__.shell.openUrl(url);

                return;
            }
            
            if (
                isTauri &&
                window.__TAURI__.shell &&
                typeof window.__TAURI__.shell.open === "function"
            ) {
                // open de shell solo soporta http/https/mailto/tel
                if (url.startsWith('http')) {
                    await window.__TAURI__.shell.open(url);
                    return;
                }
            }

        } catch (err) {

            console.error(
                "Error abriendo URL externa:",
                err
            );
        }

        window.open(url, "_blank");
    };

    /* =========================
     * DOWNLOAD FILE
     * ========================= */

    window.downloadBlobTauri = async function(blob, filename) {
    Toastify({
        text: `🔄 Preparando descarga: ${filename}`,
        duration: 2000,
        style: { background: '#2196F3' }
    }).showToast();

    console.log('=== downloadBlobTauri ===');
    console.log('isTauri:', isTauri);
    console.log('location:', window.location.href);

    const canUseTauri = isTauri &&
                        window.__TAURI__ != null &&
                        window.location.hostname === '127.0.0.1';

    console.log('canUseTauri:', canUseTauri);

    if (canUseTauri) {
        Toastify({
            text: '🚀 Usando Tauri para descargar...',
            duration: 2000,
            style: { background: '#FF9800' }
        }).showToast();

        try {
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const { invoke } = window.__TAURI__.core;

            const savedPath = await invoke('save_to_downloads', {
                filename: filename,
                data: Array.from(uint8Array)
            });

            console.log('Saved to:', savedPath);

            Toastify({
                text: '✅ Guardado en Downloads\n' + filename,
                duration: 5000,
                style: {
                    background: '#4CAF50',
                    whiteSpace: 'pre-wrap'
                }
            }).showToast();

            try {
                await invoke('open_file', { path: savedPath });
            } catch (openErr) {
                Toastify({
                    text: '📂 ' + savedPath,
                    duration: 10000,
                    style: {
                        background: '#2196F3',
                        whiteSpace: 'pre-wrap'
                    }
                }).showToast();
            }

        } catch (err) {
            console.error('Error:', err);
            Toastify({
                text: '⚠️ Error al guardar: ' + (err.message || err.toString()),
                duration: 8000,
                style: { background: '#f44336', whiteSpace: 'pre-wrap' }
            }).showToast();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    } else {
        Toastify({
            text: '🌐 Fallback a descarga nativa',
            duration: 2000,
            style: { background: '#9C27B0' }
        }).showToast();

        console.log('Falling back to native download');

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

    /* =========================
     * GLOBAL PAGE LOADER
     * ========================= */

    const pageLoader = document.getElementById("pageLoader");

    const hidePageLoader = () => {

        if (
            pageLoader &&
            !pageLoader.classList.contains("hidden")
        ) {

            pageLoader.classList.add("hidden");

            setTimeout(() => {

                if (pageLoader) {
                    pageLoader.style.display = "none";
                }

            }, 300);
        }
    };

    if (pageLoader) {

        if (document.readyState === "complete") {

            hidePageLoader();

        } else {

            window.addEventListener(
                "load",
                hidePageLoader
            );
        }

        setTimeout(
            hidePageLoader,
            5000
        );
    }

    /* =========================
     * THEME
     * ========================= */

    const root = document.documentElement;

    const saved = localStorage.getItem("theme");

    const mql =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)");

    const systemPrefersDark =
        !!(mql && mql.matches);

    const shouldUseDark =
        saved
            ? saved === "dark"
            : systemPrefersDark;

    root.classList.toggle(
        "dark",
        shouldUseDark
    );

    const updateThemeIcon = () => {

        const isDark =
            root.classList.contains("dark");

        const icon =
            document.getElementById("themeIcon");

        if (icon) {

            icon.className = isDark
                ? "bx bx-sun text-xl"
                : "bx bx-moon text-xl";
        }
    };

    const toggleTheme = () => {

        const isDark =
            root.classList.contains("dark");

        root.classList.toggle("dark");

        localStorage.setItem(
            "theme",
            isDark ? "light" : "dark"
        );

        updateThemeIcon();
    };

    const btn =
        document.getElementById("themeToggle");

    if (btn) {
        btn.addEventListener(
            "click",
            toggleTheme
        );
    }

    updateThemeIcon();

    if (!saved && mql) {

        mql.addEventListener(
            "change",
            (e) => {

                root.classList.toggle(
                    "dark",
                    e.matches
                );

                updateThemeIcon();
            }
        );
    }

    /* =========================
     * DROPDOWNS
     * ========================= */

    document
        .querySelectorAll(".dropdown > button")
        .forEach(btn => {

            btn.addEventListener(
                "click",
                function (e) {

                    e.preventDefault();
                    e.stopPropagation();

                    const dropdown =
                        this.closest(".dropdown");

                    const menu =
                        dropdown.querySelector(".absolute");

                    if (menu) {

                        document
                            .querySelectorAll(".dropdown > .absolute")
                            .forEach(otherMenu => {

                                if (otherMenu !== menu) {
                                    otherMenu.classList.add("hidden");
                                }
                            });

                        menu.classList.toggle("hidden");
                    }
                }
            );
        });

    document.addEventListener(
        "click",
        (e) => {

            if (!e.target.closest(".dropdown")) {

                document
                    .querySelectorAll(".dropdown > .absolute")
                    .forEach(menu => {
                        menu.classList.add("hidden");
                    });
            }
        }
    );

    document
        .querySelectorAll(".group > button")
        .forEach(btn => {

            btn.addEventListener(
                "click",
                function (e) {

                    e.preventDefault();
                    e.stopPropagation();

                    const group =
                        this.closest(".group");

                    const menu =
                        group.querySelector(".absolute");

                    if (menu) {
                        menu.classList.toggle("hidden");
                    }
                }
            );
        });

    /* =========================
     * USER DROPDOWN
     * ========================= */

    const userDropdown =
        document.getElementById("userDropdown");

    const userMenuBtn =
        document.getElementById("userMenuBtn");

    const userDropdownMenu =
        document.getElementById("userDropdownMenu");

    if (
        userDropdown &&
        userMenuBtn &&
        userDropdownMenu
    ) {

        userMenuBtn.addEventListener(
            "click",
            (e) => {

                e.preventDefault();
                e.stopPropagation();

                userDropdownMenu.classList.toggle("hidden");
            }
        );

        document.addEventListener(
            "click",
            (e) => {

                if (!userDropdown.contains(e.target)) {
                    userDropdownMenu.classList.add("hidden");
                }
            }
        );
    }

    /* =========================
     * SIDEBAR MOBILE
     * ========================= */

    const sidebar =
        document.getElementById("sidebar");

    const sidebarOverlay =
        document.getElementById("sidebarOverlay");

    window.toggleSidebar = function () {

        if (sidebar) {

            sidebar.classList.toggle("-translate-x-full");

            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle("hidden");
            }
        }
    };

    window.cerrarSidebar = function () {

        if (sidebar) {
            sidebar.classList.add("-translate-x-full");
        }

        if (sidebarOverlay) {
            sidebarOverlay.classList.add("hidden");
        }
    };

    window.toggleMobileMenu = function (id) {

        const menu =
            document.getElementById(id + "Menu");

        const btn =
            document.getElementById(id);

        if (menu) {

            menu.classList.toggle("hidden");

            const icon =
                btn.querySelector(".bx-chevron-right");

            if (icon) {
                icon.classList.toggle("rotate-90");
            }
        }
    };

    if (sidebarOverlay) {

        sidebarOverlay.addEventListener(
            "click",
            cerrarSidebar
        );
    }

    window.addEventListener(
        "resize",
        () => {

            if (window.innerWidth >= 1024) {
                cerrarSidebar();
            }
        }
    );

    /* =========================
     * CSRF
     * ========================= */

    const getCSRFToken = () => {

        const match =
            document.cookie.match(
                /(^|;\s*)csrftoken=([^;]+)/
            );

        return match
            ? decodeURIComponent(match[2])
            : null;
    };

    /* =========================
     * FETCH WRAPPER
     * ========================= */

    window.apiFetch = async (
        url,
        options = {}
    ) => {

        const unsafeMethods = [
            "POST",
            "PUT",
            "PATCH",
            "DELETE"
        ];

        const method =
            (options.method || "GET").toUpperCase();

        const headers = {
            "X-Requested-With": "XMLHttpRequest",
            ...(options.headers || {})
        };

        let body = options.body;

        if (body instanceof FormData) {

            delete headers["Content-Type"];

        } else if (
            body &&
            typeof body === "object" &&
            !(body instanceof Blob)
        ) {

            headers["Content-Type"] =
                "application/json";

            body = JSON.stringify(body);
        }

        if (unsafeMethods.includes(method)) {

            const csrf = getCSRFToken();

            if (csrf) {
                headers["X-CSRFToken"] = csrf;
            }
        }

        const response = await fetch(
            url,
            {
                method,
                headers,
                body,
                credentials: "same-origin"
            }
        );

        let data;

        try {

            data = await response.json();

        } catch {

            data = await response
                .text()
                .then(text => ({ text }));
        }

        if (!response.ok) {
            throw data;
        }

        return data;
    };

    /* =========================
     * NAV ACTIVE LINK
     * ========================= */

    const normalize = (p) => {

        if (!p) return "/";

        return (
            p.length > 1 &&
            p.endsWith("/")
        )
            ? p.slice(0, -1)
            : p;
    };

    const currentPath =
        normalize(window.location.pathname);

    const allLinks =
        document.querySelectorAll(
            "#sidebar a[href], nav a[href]"
        );

    allLinks.forEach(a => {

        const href =
            a.getAttribute("href");

        if (!href || href === "#") {
            return;
        }

        try {

            const linkPath =
                normalize(
                    new URL(
                        href,
                        window.location.origin
                    ).pathname
                );

            if (linkPath === currentPath) {

                a.classList.add("active-link");

                a.setAttribute(
                    "aria-current",
                    "page"
                );

                const parentDropdown =
                    a.closest(".dropdown");

                if (parentDropdown) {

                    const parentButton =
                        parentDropdown.querySelector("button");

                    if (parentButton) {
                        parentButton.classList.add(
                            "active-link-padre"
                        );
                    }
                }
            }

        } catch (e) {}
    });

})();