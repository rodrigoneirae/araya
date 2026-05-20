/**
 * Aquai ERP - Password Toggle Component (Boxicons Only)
 * Simplificado para usar solo Boxicons (bx-hide/bx-show)
 */

(function () {
    'use strict';

    /**
     * Toggle la visibilidad de la contraseña
     * @param {string} inputId - ID del input
     * @param {HTMLElement} button - Botón que activó el toggle
     */
    window.togglePassword = function (inputId, button) {
        const input = document.getElementById(inputId);
        if (!input) {
            console.warn(`Password toggle: No se encontró el input con id "${inputId}"`);
            return;
        }

        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';

        // Encontrar el icono de Boxicons dentro del botón
        const icon = button.querySelector('i.bx');

        if (icon) {
            if (isPassword) {
                // Cambiar a eye (mostrar)
                icon.classList.remove('bx-hide');
                icon.classList.add('bx-show');
            } else {
                // Cambiar a eye-off (ocultar)
                icon.classList.remove('bx-show');
                icon.classList.add('bx-hide');
            }
        }

        // Actualizar atributos ARIA
        button.setAttribute('aria-pressed', String(isPassword));
        button.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
        button.setAttribute('title', isPassword ? 'Ocultar' : 'Mostrar');
    };

    /**
     * Inicializa automáticamente los toggles de contraseña
     * Busca inputs con data-toggle="password"
     */
    function initPasswordToggles() {
        // Por data-toggle="password"
        document.querySelectorAll('[data-toggle="password"]').forEach(input => {
            const wrapper = input.closest('.relative, .input-group, [class*="password"]');
            if (!wrapper) return;

            // Verificar si ya tiene botón
            if (wrapper.querySelector('[data-password-toggle]')) return;

            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'password-toggle-btn';
            toggleBtn.setAttribute('data-password-toggle', '');
            toggleBtn.setAttribute('aria-label', 'Mostrar contraseña');
            toggleBtn.setAttribute('aria-pressed', 'false');
            toggleBtn.setAttribute('title', 'Mostrar');
            toggleBtn.innerHTML = '<i class="bx bx-hide"></i>';

            toggleBtn.addEventListener('click', () => togglePassword(input.id, toggleBtn));

            wrapper.appendChild(toggleBtn);
        });
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPasswordToggles);
    } else {
        initPasswordToggles();
    }

    // Exponer función global para uso manual
    window.PasswordToggle = {
        toggle: togglePassword,
        init: initPasswordToggles
    };
})();
