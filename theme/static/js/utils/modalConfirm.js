(function() {
    let callback = null;

    window.mostrarModalConfirm = function(opts) {
        opts = opts || {};
        callback = opts.onConfirm || null;

        const iconWrap = document.getElementById('modalConfirmIconWrap');
        const icon = document.getElementById('modalConfirmIcon');
        const title = document.getElementById('modalConfirmTitle');
        const message = document.getElementById('modalConfirmMessage');
        const btn = document.getElementById('modalConfirmBtn');
        const dataContainer = document.getElementById('modalConfirmData');
        const dataBody = document.getElementById('modalConfirmDataBody');

        if (opts.tipo === 'confirm') {
            iconWrap.classList.add('hidden');
            title.textContent = opts.titulo || 'Confirmar';
            btn.className = opts.colorBoton ? ('px-4 py-2 rounded-lg ' + opts.colorBoton) : 'px-4 py-2 rounded-lg bg-aq-primary text-white hover:opacity-85';
            btn.textContent = opts.textoBoton || 'Confirmar';
        } else {
            iconWrap.classList.remove('hidden');
            if (opts.icono) {
                icon.className = opts.icono;
            } else {
                icon.className = 'bx bx-trash text-xl sm:text-2xl text-red-500';
            }
            title.textContent = opts.titulo || 'Confirmar Eliminación';
            btn.className = opts.colorBoton ? ('px-4 py-2 rounded-lg ' + opts.colorBoton) : 'px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600';
            btn.textContent = opts.textoBoton || 'Eliminar';
        }

        message.textContent = opts.mensaje || '';

        if (opts.datos && opts.datos.length > 0) {
            dataBody.innerHTML = '';
            opts.datos.forEach(function(d) {
                var row = document.createElement('div');
                row.className = 'flex justify-between items-center px-3 py-2';
                row.innerHTML = '<span class="font-medium text-aq-text">' + escapeHtml(d.label) + '</span>' +
                    '<span class="text-aq-muted text-right ml-4 max-w-[60%] truncate">' + escapeHtml(d.value) + '</span>';
                dataBody.appendChild(row);
            });
            dataContainer.classList.remove('hidden');
        } else {
            dataContainer.classList.add('hidden');
        }

        document.getElementById('modalConfirm').classList.remove('hidden');
    };

    window.cerrarModalConfirm = function() {
        document.getElementById('modalConfirm').classList.add('hidden');
        callback = null;
    };

    window.ejecutarModalConfirm = function() {
        if (typeof callback === 'function') {
            callback();
        }
        cerrarModalConfirm();
    };

    function escapeHtml(str) {
        if (typeof str !== 'string') return String(str);
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
})();
