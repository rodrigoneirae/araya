const urlCompraProv = (document.currentScript?.dataset.url) || '/';
let tablaInforme = null;
let tablaLibro = null;
let tabActivo = 'tabInforme';

function buscarXHR(action, datos, callback) {
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrfToken = getCookie('csrftoken');
    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', csrfToken);
    formData.append('action', action);
    for (let key in datos) { formData.append(key, datos[key]); }
    fetch(urlCompraProv, {
        method: 'POST',
        body: formData
    })
    .then(res => {
        if (!res.ok) throw new Error('HTTP error: ' + res.status);
        return res.json();
    })
    .then(data => callback(data))
    .catch(err => {
        console.error('Error:', err);
        ocultarSpinner();
        Toastify({text: 'Error: ' + err.message, style: {background: '#f44336'}}).showToast();
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('proFechaInicio').value = hoy;
    document.getElementById('proFechaCorte').value = hoy;

    document.getElementById('proRut')?.addEventListener('change', function() {
        buscarProveedor();
    });

    document.getElementById('proFechaInicio')?.addEventListener('change', function() {
        recargarTabActivo();
    });
    document.getElementById('proFechaCorte')?.addEventListener('change', function() {
        recargarTabActivo();
    });

    recargarTabActivo();
});

function mostrarSpinner() {
    document.getElementById('spinnerInforme').classList.remove('hidden');
}

function ocultarSpinner() {
    document.getElementById('spinnerInforme').classList.add('hidden');
}

function setSpan(id, val) {
    document.getElementById(id).textContent = val || '\u00a0';
}

function _getDatos() {
    const rut = document.getElementById('proRut').value.trim();
    const fecha_inicio = document.getElementById('proFechaInicio').value;
    const fecha_corte = document.getElementById('proFechaCorte').value;
    return { rut, fecha_inicio, fecha_corte };
}

function switchTab(tabId) {
    if (tabId === tabActivo) return;
    tabActivo = tabId;
    const btns = { tabInforme: 'btnTabInforme', tabLibro: 'btnTabLibro' };
    const tabs = { tabInforme: 'tabInforme', tabLibro: 'tabLibro' };
    const sinSel = document.getElementById('sinSeleccion');
    Object.keys(btns).forEach(key => {
        const btn = document.getElementById(btns[key]);
        const tabEl = document.getElementById(tabs[key]);
        if (key === tabId) {
            btn.className = 'px-4 py-3 text-sm font-semibold text-aq-primary border-b-2 border-aq-primary';
            tabEl.classList.remove('hidden');
        } else {
            btn.className = 'px-4 py-3 text-sm text-aq-text/60 hover:text-aq-text border-b-2 border-transparent';
            tabEl.classList.add('hidden');
        }
    });
    if (sinSel) sinSel.classList.add('hidden');
    recargarTabActivo();
}

function recargarTabActivo() {
    if (tabActivo === 'tabInforme') {
        cargarInforme();
    } else {
        cargarLibro();
    }
}

function cargarInforme() {
    const datos = _getDatos();
    if (!datos) return;
    buscarXHR('info_informe', datos, function(data) {
        if (!data.success) {
            Toastify({text: data.message || 'Error al cargar datos', style: {background: '#f44336'}}).showToast();
            return;
        }
        if (tablaInforme) { tablaInforme.destroy(); tablaInforme = null; }
        const movimientos = data.data || [];
        if (movimientos.length === 0) {
            document.getElementById('resumenInforme').classList.add('hidden');
            tablaInforme = new Tabulator("#tablaInforme", {
                data: [], columns: [], placeholder: "Sin movimientos para el período seleccionado", layout: "fitColumns", height: "100%"
            });
            return;
        }

        let totalCantidad = 0, totalMonto = 0;
        movimientos.forEach(m => {
            if (m._subtotal) {
                totalCantidad += m._cantidad || 0;
                totalMonto += m._monto || 0;
            }
        });

        const soloMovimientos = movimientos.filter(m => !m._subtotal);

        document.getElementById('resMovimientos').textContent = soloMovimientos.length.toLocaleString('es-CL');
        document.getElementById('resEntradas').textContent = totalCantidad.toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3});
        document.getElementById('resTotalMonto').textContent = '$' + totalMonto.toLocaleString('es-CL');
        document.getElementById('resumenInforme').classList.remove('hidden');

        tablaInforme = new Tabulator("#tablaInforme", {
            data: movimientos,
            layout: "fitColumns",
            height: "100%",
            pagination: true,
            paginationSize: 15,
            paginationSizeSelector: [10, 20, 50, 100],
            rowFormatter: function(row) {
                const d = row.getData();
                if (d._subtotal) {
                    row.getElement().style.backgroundColor = '#e5e7eb';
                    row.getElement().style.fontWeight = 'bold';
                }
            },
            columns: [
                { title: "RUT", field: "rut", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        if (d._subtotal) return `<b>Subtotal ${d._rut || ''}</b>`;
                        if (d._first_in_group) return d.rut || '';
                        return '';
                    }
                },
                { title: "Proveedor", field: "proveedor_nombre", widthGrow: 4,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        if (d._subtotal) return `<b>${d._proveedor || ''}</b>`;
                        if (d._first_in_group) return d.proveedor_nombre || '';
                        return '';
                    }
                },
                { title: "Artículo", field: "articulo_codigo", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        if (d._subtotal) return '';
                        return `${d.articulo_codigo || ''} ${d.articulo_nombre || ''}`;
                    }
                },
                { title: "Fecha", field: "fecha", widthGrow: 2,
                    formatter: function(cell) {
                        return cell.getRow().getData()._subtotal ? '' : cell.getValue();
                    }
                },
                { title: "Cantidad", field: "cantidad", hozAlign: "right", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        if (d._subtotal) return `<b>${Number(d._cantidad || 0).toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3})}</b>`;
                        const v = cell.getValue();
                        return v != null ? Number(v).toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3}) : '';
                    }
                },
                { title: "Part.", field: "_participacion_monto", hozAlign: "right", widthGrow: 1,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        if (d._subtotal) return `<b>${(d._participacion_monto || 0).toFixed(2)}%</b>`;
                        return '';
                    }
                },
                { title: "P.Unit", field: "punit", hozAlign: "right", widthGrow: 2,
                    formatter: function(cell) {
                        return cell.getRow().getData()._subtotal ? '' : (cell.getValue() != null ? '$' + Number(cell.getValue()).toLocaleString('es-CL') : '');
                    }
                },
                { title: "Total", field: "total", hozAlign: "right", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        if (d._subtotal) return `<b>$${Number(d._monto || 0).toLocaleString('es-CL')}</b>`;
                        const v = cell.getValue();
                        return v != null ? '$' + Number(v).toLocaleString('es-CL') : '';
                    }
                },
            ],
            placeholder: "Sin movimientos para el período seleccionado",
        });
    });
}

function cargarLibro() {
    const datos = _getDatos();
    if (!datos) return;
    buscarXHR('info_libro', datos, function(data) {
        if (!data.success) {
            Toastify({text: data.message || 'Error al cargar datos', style: {background: '#f44336'}}).showToast();
            return;
        }
        if (tablaLibro) { tablaLibro.destroy(); tablaLibro = null; }
        const movimientos = data.data || [];
        if (movimientos.length === 0) {
            tablaLibro = new Tabulator("#tablaLibro", {
                data: [], columns: [], placeholder: "Sin movimientos para el período seleccionado", layout: "fitColumns", height: "100%"
            });
            return;
        }

        tablaLibro = new Tabulator("#tablaLibro", {
            data: movimientos,
            layout: "fitColumns",
            height: "100%",
            pagination: true,
            paginationSize: 15,
            paginationSizeSelector: [10, 20, 50, 100],
            columns: [
                { title: "Tipo", field: "tipo_nombre", widthGrow: 2 },
                { title: "Número", field: "numero", widthGrow: 2 },
                { title: "Cantidad", field: "cantidad", hozAlign: "right", widthGrow: 2,
                    formatter: function(cell) {
                        const v = cell.getValue();
                        return v != null ? Number(v).toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3}) : '';
                    }
                },
                { title: "Neto", field: "neto", hozAlign: "right", widthGrow: 2,
                    formatter: function(cell) {
                        const v = cell.getValue();
                        return v != null ? '$' + Number(v).toLocaleString('es-CL') : '';
                    }
                },
                { title: "Proveedor", field: "proveedor_nombre", widthGrow: 3 },
                { title: "Fecha", field: "fecha", widthGrow: 2 },
                { title: "RUT", field: "rut", widthGrow: 2 },
                { title: "DocRef", field: "docref", widthGrow: 2 },
            ],
            placeholder: "Sin movimientos para el período seleccionado",
        });
    });
}

function abrirListaProveedores() {
    buscarXHR('listar_proveedores', {}, function(data) {
        window.listaProveedores = data.proveedores || [];
        document.getElementById('modalProveedores').classList.remove('hidden');
        document.getElementById('filtroProveedores').value = '';
        renderizarListaProveedores(window.listaProveedores);
    });
}

function cerrarListaProveedores() {
    document.getElementById('modalProveedores').classList.add('hidden');
}

function renderizarListaProveedores(lista) {
    const tbody = document.getElementById('tablaListaProveedores');
    tbody.innerHTML = '';
    lista.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            document.getElementById('proRut').value = p.rut;
            setSpan('proNombre', p.nombre);
            cerrarListaProveedores();
            recargarTabActivo();
        };
        tr.innerHTML = `
            <td class="px-3 py-2 text-aq-text">${p.rut}</td>
            <td class="px-3 py-2 text-aq-text">${p.nombre || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarProveedores() {
    const filtro = document.getElementById('filtroProveedores').value.toLowerCase();
    const filtradas = window.listaProveedores.filter(p =>
        (p.rut && p.rut.toLowerCase().includes(filtro)) ||
        (p.nombre && p.nombre.toLowerCase().includes(filtro))
    );
    renderizarListaProveedores(filtradas);
}

function buscarProveedor() {
    const rut = document.getElementById('proRut').value.trim();
    if (!rut) return;
    buscarXHR('buscar_proveedor', { rut: rut }, function(data) {
        if (data.success) {
            setSpan('proNombre', data.data.nombre);
            recargarTabActivo();
        } else {
            setSpan('proNombre', '');
            Toastify({text: 'Proveedor no encontrado', style: {background: '#f44336'}}).showToast();
        }
    });
}

function _fetchYDescargar(formdata, filename) {
    mostrarSpinner();
    return fetch(urlCompraProv, { method: 'POST', body: formdata })
    .then(res => {
        if (!res.ok) throw new Error('Error HTTP ' + res.status);
        return res.blob();
    })
    .then(blob => {
        ocultarSpinner();
        if (typeof window.downloadBlobTauri === 'function') {
            window.downloadBlobTauri(blob, filename);
        } else {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }
    })
    .catch(err => {
        ocultarSpinner();
        console.error('Error:', err);
        Toastify({text: 'Error al generar informe: ' + err.message, style: {background: '#f44336'}}).showToast();
    });
}

function _getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function _formDataBasico(action) {
    const rut = document.getElementById('proRut').value.trim();
    const fecha_inicio = document.getElementById('proFechaInicio').value;
    const fecha_corte = document.getElementById('proFechaCorte').value;
    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', _getCookie('csrftoken'));
    formData.append('action', action);
    formData.append('rut', rut);
    formData.append('fecha_inicio', fecha_inicio);
    formData.append('fecha_corte', fecha_corte);
    return formData;
}

function generarPDF() {
    const rut = document.getElementById('proRut').value.trim();
    const action = tabActivo === 'tabInforme' ? 'generar_pdf_informe' : 'generar_pdf_libro';
    const suffix = tabActivo === 'tabInforme' ? 'informe' : 'libro';
    const formData = _formDataBasico(action);
    _fetchYDescargar(formData, `compra_proveedores_${suffix}_${rut || 'todos'}.pdf`);
}

function generarEXCEL() {
    const rut = document.getElementById('proRut').value.trim();
    const action = tabActivo === 'tabInforme' ? 'generar_excel_informe' : 'generar_excel_libro';
    const suffix = tabActivo === 'tabInforme' ? 'informe' : 'libro';
    const formData = _formDataBasico(action);
    _fetchYDescargar(formData, `compra_proveedores_${suffix}_${rut || 'todos'}.xlsx`);
}
