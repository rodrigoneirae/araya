/* Fechas visibles dd-mm-AAAA; valores de formularios y API en ISO. */
(function () {
    'use strict';

    function iso(value) {
        if (!value) return '';
        const text = String(value).trim();
        let parts = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/.exec(text);
        if (!parts) {
            const visible = /^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(text);
            if (!visible) return '';
            parts = [null, visible[3], visible[2], visible[1]];
        }
        const [, year, month, day] = parts;
        const date = new Date(0);
        date.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
        if (date.getUTCFullYear() !== Number(year) ||
            date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) return '';
        return `${year}-${month}-${day}`;
    }

    function mostrar(value) {
        const date = iso(value);
        if (!date) return value == null ? '' : String(value);
        const [year, month, day] = date.split('-');
        return `${day}-${month}-${year}`;
    }

    function hoy() {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    window.ArayaFechas = {iso, mostrar, hoy};

    if (window.Tabulator) {
        Tabulator.extendModule('format', 'formatters', {
            plaintext(cell) {
                const value = cell.getValue();
                const field = String(cell.getField() || '').toLowerCase();
                const span = document.createElement('span');
                span.textContent = /fecha|^fec_|date/.test(field) ? mostrar(value) : (value ?? '');
                return span;
            },
        });
    }

    const nativeValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    function iniciar(input) {
        if (input._flatpickr || input.type !== 'date') return;
        const required = input.required;
        const picker = flatpickr(input, {
            locale: 'es',
            dateFormat: 'Y-m-d',
            altInput: true,
            altFormat: 'd-m-Y',
            allowInput: true,
            disableMobile: true,
            parseDate(value) {
                if (value instanceof Date) return value;
                const normalized = iso(value);
                if (!normalized) return undefined;
                const [year, month, day] = normalized.split('-').map(Number);
                const date = new Date(0);
                date.setFullYear(year, month - 1, day);
                date.setHours(0, 0, 0, 0);
                return date;
            },
            onChange(dates, text, instance) {
                input.setCustomValidity('');
                instance.altInput.setCustomValidity('');
            },
        });
        // El desplegable interno de meses de flatpickr no es un select de la app:
        // select2 lo reemplaza, congela el texto del mes y abre la lista detrás
        // del calendario, impidiendo cambiar de mes con las flechas.
        if (picker.monthsDropdownContainer) {
            picker.monthsDropdownContainer.setAttribute('data-no-select2', '');
        }
        input.required = false;
        picker.altInput.required = required;
        picker.altInput.placeholder = 'dd-mm-aaaa';
        picker.altInput.setAttribute('aria-label', input.getAttribute('aria-label') || input.placeholder || 'Fecha (dd-mm-aaaa)');
        if (input.id) {
            picker.altInput.id = `${input.id}-visible`;
            document.querySelectorAll('label[for]').forEach(label => {
                if (label.htmlFor === input.id) label.htmlFor = picker.altInput.id;
            });
        }
        picker.altInput.addEventListener('input', () => {
            const value = picker.altInput.value.trim();
            const valid = !value || (/^\d{2}-\d{2}-\d{4}$/.test(value) && !!iso(value));
            picker.altInput.setCustomValidity(valid ? '' : 'Ingrese una fecha válida: dd-mm-aaaa');
            nativeValue.set.call(input, valid ? iso(value) : '');
        });
        const protegerFechaInvalida = event => {
            if (picker.altInput.validity.customError) event.stopImmediatePropagation();
        };
        picker.altInput.addEventListener('blur', protegerFechaInvalida, true);
        picker.altInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') protegerFechaInvalida(event);
        }, true);
        picker.altInput.addEventListener('change', () => {
            if (!picker.altInput.value) picker.altInput.setCustomValidity('');
        });

        // Los módulos existentes asignan .value directamente al cargar o limpiar documentos.
        let syncing = false;
        Object.defineProperty(input, 'value', {
            configurable: true,
            get() { return nativeValue.get.call(input); },
            set(value) {
                nativeValue.set.call(input, value || '');
                if (syncing) return;
                syncing = true;
                try {
                    picker.setDate(iso(value), false, 'Y-m-d');
                    picker.altInput.setCustomValidity('');
                } finally { syncing = false; }
            },
        });
        const syncAttributes = () => {
            picker.altInput.disabled = input.disabled;
            // allowInput no debe quitar el readonly de las pantallas de consulta.
            picker.altInput.readOnly = input.readOnly;
            picker.set('clickOpens', !input.disabled && !input.readOnly);
            picker.set('minDate', input.min || null);
            picker.set('maxDate', input.max || null);
        };
        syncAttributes();
        new MutationObserver(syncAttributes).observe(input, {
            attributes: true, attributeFilter: ['disabled', 'readonly', 'min', 'max'],
        });
        if (input.form) input.form.addEventListener('reset', () => {
            queueMicrotask(() => { input.value = input.defaultValue; });
        });
    }

    function iniciarEn(root) {
        if (root.matches?.('input[type="date"]')) iniciar(root);
        root.querySelectorAll?.('input[type="date"]').forEach(iniciar);
    }
    iniciarEn(document);
    new MutationObserver(records => {
        records.forEach(record => record.addedNodes.forEach(node => {
            if (node.nodeType === 1) iniciarEn(node);
        }));
    }).observe(document.body, {childList: true, subtree: true});
})();
