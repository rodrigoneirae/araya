const urlPE = (document.currentScript?.dataset.url) || '/';
let tablaEncargado = null;

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

function mostrarSpinner() {
    document.getElementById('spinnerInforme').classList.remove('hidden');
}

function ocultarSpinner() {
    document.getElementById('spinnerInforme').classList.add('hidden');
}

function _post(action, datos, callback) {
    const formData = new FormData();
    formData.append('action', action);
    Object.keys(datos).forEach(k => { if (datos[k]) formData.append(k, datos[k]); });

    fetch(urlPE, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        body: formData
    })
    .then(res => {
        if (!res.ok) throw new Error('Error HTTP ' + res.status);
        return res.json();
    })
    .then(data => callback(data))
    .catch(err => {
        ocultarSpinner();
        Toastify({ text: 'Error: ' + err.message, style: { background: '#f44336' } }).showToast();
    });
}

function _getFiltros() {
    return {
        encargado: document.getElementById('encargadoSelect').value,
        fecha_inicio: document.querySelector('input[name="fecha_inicio"]').value,
        fecha_fin: document.querySelector('input[name="fecha_fin"]').value,
    };
}

function formatNum(v) {
    return v != null ? Number(v).toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3}) : '';
}

function formatDec(v) {
    return v != null ? Number(v).toLocaleString('es-CL', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '';
}

function cargarTabla() {
    const filtros = _getFiltros();
    if (!filtros.encargado) {
        if (tablaEncargado) { tablaEncargado.destroy(); tablaEncargado = null; }
        tablaEncargado = new Tabulator("#tablaEncargado", {
            data: [], layout: "fitColumns",
            placeholder: "Seleccione un encargado para ver los movimientos"
        });
        return;
    }
    mostrarSpinner();
    _post('info_encargado', filtros, function(data) {
        ocultarSpinner();
        if (!data.success) return;
        if (tablaEncargado) { tablaEncargado.destroy(); tablaEncargado = null; }

        const movimientos = data.data || [];
        if (movimientos.length === 0) {
            tablaEncargado = new Tabulator("#tablaEncargado", {
                data: [], layout: "fitColumns", placeholder: "Sin movimientos para los filtros seleccionados"
            });
            return;
        }

        tablaEncargado = new Tabulator("#tablaEncargado", {
            data: movimientos,
            layout: "fitDataStretch",
            height: "100%",
            pagination: true,
            paginationSize: 20,
            paginationSizeSelector: [10, 20, 50, 100],
            rowFormatter: function(row) {
                const d = row.getData();
                if (d._subtotal) {
                    row.getElement().style.backgroundColor = '#e5e7eb';
                    row.getElement().style.fontWeight = 'bold';
                }
            },
            columns: [
                { title: "Artículo", field: "articulo", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        return d._subtotal ? '' : (d.articulo || '');
                    }
                },
                { title: "Nombre", field: "nombre", widthGrow: 4,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        if (d._subtotal) return '<b>Total Encargado</b>';
                        return d.nombre || '';
                    }
                },
                { title: "Fecha", field: "fecha", hozAlign: "center", widthGrow: 2,
                    formatter: function(cell) {
                        return cell.getRow().getData()._subtotal ? '' : cell.getValue();
                    }
                },
                { title: "N° OT", field: "ot", hozAlign: "center", widthGrow: 1,
                    formatter: function(cell) {
                        return cell.getRow().getData()._subtotal ? '' : cell.getValue();
                    }
                },
                { title: "Tipo", field: "tipo", hozAlign: "center", widthGrow: 2,
                    formatter: function(cell) {
                        return cell.getRow().getData()._subtotal ? '' : cell.getValue();
                    }
                },
                { title: "Cant", field: "cantidad", hozAlign: "right", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        return d._subtotal ? '' : formatNum(d.cantidad);
                    }
                },
                { title: "UM", field: "um", hozAlign: "center", widthGrow: 1,
                    formatter: function(cell) {
                        return cell.getRow().getData()._subtotal ? '' : cell.getValue();
                    }
                },
                { title: "Precio", field: "precio", hozAlign: "right", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        return d._subtotal ? '' : formatDec(d.precio);
                    }
                },
                { title: "Totalizado", field: "totalizado", hozAlign: "right", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        if (d._subtotal) return '<b>' + formatDec(d.totalizado) + '</b>';
                        return formatDec(d.totalizado);
                    }
                },
                { title: "Proceso", field: "proceso", widthGrow: 2,
                    formatter: function(cell) {
                        return cell.getRow().getData()._subtotal ? '' : cell.getValue();
                    }
                },
                { title: "Encargado", field: "encargado", widthGrow: 2,
                    formatter: function(cell) {
                        return cell.getRow().getData()._subtotal ? '' : cell.getValue();
                    }
                },
            ],
            placeholder: "Sin movimientos para los filtros seleccionados",
        });
    });
}

function _fetchInforme(action, filename) {
    const filtros = _getFiltros();
    mostrarSpinner();
    const formData = new FormData();
    formData.append('action', action);
    Object.keys(filtros).forEach(k => { if (filtros[k]) formData.append(k, filtros[k]); });

    fetch(urlPE, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        body: formData
    })
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
        Toastify({ text: 'Error al generar informe: ' + err.message, style: { background: '#f44336' } }).showToast();
    });
}

function generarInforme(formato) {
    if (formato === 'pdf') {
        _fetchInforme('generar_pdf', 'produccion_encargado.pdf');
    } else {
        _fetchInforme('generar_excel', 'produccion_encargado.xlsx');
    }
}

function cargarEncargados() {
    _post('listar_encargados', {}, function(data) {
        const select = document.querySelector('select[name="encargado"]');
        (data.encargados || []).forEach(enc => {
            const option = document.createElement('option');
            option.value = enc.cod;
            option.textContent = enc.nombre;
            select.appendChild(option);
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const hoy = new Date();
    const hace30 = new Date();
    hace30.setDate(hace30.getDate() - 30);
    document.querySelector('input[name="fecha_inicio"]').value = hace30.toISOString().split('T')[0];
    document.querySelector('input[name="fecha_fin"]').value = hoy.toISOString().split('T')[0];

    document.querySelector('input[name="fecha_inicio"]').addEventListener('change', cargarTabla);
    document.querySelector('input[name="fecha_fin"]').addEventListener('change', cargarTabla);

    cargarEncargados();

    var checkSelect2 = setInterval(function() {
        var sel = document.getElementById('encargadoSelect');
        if (sel && sel.options.length > 1 && typeof jQuery !== 'undefined' && jQuery(sel).data('select2')) {
            clearInterval(checkSelect2);
            jQuery(sel).on('select2:select select2:unselect', cargarTabla);
            cargarTabla();
        }
    }, 100);
});
