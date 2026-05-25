(function() {
    let tabulator = null;
    let currentOpts = null;

    window.abrirModalBusqueda = function(opts) {
        opts = opts || {};
        currentOpts = opts;

        document.getElementById('modalBusquedaTitle').textContent = opts.titulo || 'Lista';
        document.getElementById('modalBusqueda').classList.remove('hidden');

        var refreshBtn = document.getElementById('modalBusquedaRefresh');
        if (opts.onRefresh) {
            refreshBtn.classList.remove('hidden');
        } else {
            refreshBtn.classList.add('hidden');
        }

        var modalContent = document.getElementById('modalBusquedaContent');
        if (opts.ancho === 'sm') {
            modalContent.className = 'bg-aq-surface border border-aq-border rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl';
        } else if (opts.ancho === 'xl') {
            modalContent.className = 'bg-aq-surface border border-aq-border rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl';
        } else {
            modalContent.className = 'bg-aq-surface border border-aq-border rounded-xl w-full max-w-lg sm:max-w-3xl max-h-[90vh] flex flex-col shadow-xl';
        }

        if (opts.sinFiltro) {
            document.getElementById('modalBusquedaFiltroWrap').classList.add('hidden');
        } else {
            document.getElementById('modalBusquedaFiltroWrap').classList.remove('hidden');
        }

        if (tabulator) { tabulator.destroy(); tabulator = null; }

        var placeholder = document.getElementById('modalBusquedaFiltro');
        if (placeholder) placeholder.value = '';

        setTimeout(function() {
            var cols = (opts.columnas || []).map(function(c) {
                return { title: c.title, field: c.field, width: c.width, minWidth: c.minWidth || 60, headerFilter: false };
            });

            tabulator = new Tabulator('#modalBusquedaTable', {
                columns: cols,
                data: opts.data || [],
                layout: 'fitColumns',
                selectableRows: 1,
                pagination: opts.pagination !== false ? 'local' : false,
                paginationSize: opts.paginationSize || 15,
                placeholder: 'Sin datos',
            });

            tabulator.on("rowClick", function(e, row) {
                if (typeof opts.onSelect === 'function') {
                    opts.onSelect(row.getData());
                }
                cerrarModalBusqueda();
            });

            var filtro = document.getElementById('modalBusquedaFiltro');
            if (filtro && !opts.sinFiltro) {
                var newFiltro = filtro.cloneNode(true);
                filtro.parentNode.replaceChild(newFiltro, filtro);
                newFiltro.addEventListener('keyup', function() {
                    var val = this.value.trim().toLowerCase();
                    if (!tabulator) return;
                    if (!val) {
                        tabulator.clearFilter();
                        return;
                    }
                    var campos = opts.filtroCampos || ['codigo', 'descr'];
                    tabulator.setFilter(function(data) {
                        return campos.some(function(c) {
                            var v = data[c];
                            return v && v.toString().toLowerCase().includes(val);
                        });
                    });
                });
            }
        }, 50);
    };

    window.cerrarModalBusqueda = function() {
        document.getElementById('modalBusqueda').classList.add('hidden');
        if (tabulator) { tabulator.destroy(); tabulator = null; }
    };

    window.recargarModalBusqueda = function() {
        if (typeof currentOpts.onRefresh === 'function') {
            currentOpts.onRefresh(currentOpts);
        }
    };

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            var modal = document.getElementById('modalBusqueda');
            if (modal && !modal.classList.contains('hidden')) {
                cerrarModalBusqueda();
            }
        }
    });
})();
