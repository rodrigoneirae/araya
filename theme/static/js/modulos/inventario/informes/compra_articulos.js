const urlCompraArt = (document.currentScript?.dataset.url) || '/';
let tablaProv = null;

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
    fetch(urlCompraArt, {
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
    document.getElementById('carFechaInicio').value = hoy;
    document.getElementById('carFechaCorte').value = hoy;

    document.getElementById('carCodigo')?.addEventListener('change', function() {
        buscarArticulo();
    });

    document.getElementById('carFechaInicio')?.addEventListener('change', function() {
        cargarInfoProveedor();
    });
    document.getElementById('carFechaCorte')?.addEventListener('change', function() {
        cargarInfoProveedor();
    });

    document.getElementById('sinSeleccion')?.classList.add('hidden');
    cargarInfoProveedor();
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
    const codigo = document.getElementById('carCodigo').value.trim();
    const fecha_inicio = document.getElementById('carFechaInicio').value;
    const fecha_corte = document.getElementById('carFechaCorte').value;
    return { codigo, fecha_inicio, fecha_corte };
}

function cargarInfoProveedor() {
    const datos = _getDatos();
    if (!datos) return;
    buscarXHR('info_proveedor', datos, function(data) {
        if (!data.success) {
            Toastify({text: data.message || 'Error al cargar datos', style: {background: '#f44336'}}).showToast();
            return;
        }
        if (tablaProv) { tablaProv.destroy(); tablaProv = null; }
        const movimientos = data.data || [];
        if (movimientos.length === 0) {
            document.getElementById('resumenProveedor').classList.add('hidden');
            tablaProv = new Tabulator("#tablaProveedor", {
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
        document.getElementById('resumenProveedor').classList.remove('hidden');

        tablaProv = new Tabulator("#tablaProveedor", {
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
                { title: "Artículo", field: "articulo_codigo", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        if (d._subtotal) return `<b>Subtotal ${d._codigo}</b>`;
                        return `${d.articulo_codigo || ''} ${d.articulo_nombre || ''}`;
                    }
                },
                { title: "Fecha", field: "fecha", widthGrow: 2,
                    formatter: function(cell) {
                        return cell.getRow().getData()._subtotal ? '' : cell.getValue();
                    }
                },
                { title: "RUT", field: "rut", widthGrow: 2,
                    formatter: function(cell) {
                        return cell.getRow().getData()._subtotal ? '' : cell.getValue();
                    }
                },
                { title: "Proveedor", field: "proveedor_nombre", widthGrow: 4,
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
                { title: "Part.", field: "_participacion_cant", hozAlign: "right", widthGrow: 1,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        if (d._subtotal) return `<b>${(d._participacion_cant || 0).toFixed(2)}%</b>`;
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
                { title: "Tipo", field: "tipo_nombre", widthGrow: 3,
                    formatter: function(cell) {
                        return cell.getRow().getData()._subtotal ? '' : cell.getValue();
                    }
                },
                { title: "Número", field: "numero", widthGrow: 2,
                    formatter: function(cell) {
                        return cell.getRow().getData()._subtotal ? '' : cell.getValue();
                    }
                },
            ],
            placeholder: "Sin movimientos para el período seleccionado",
        });
    });
}

function abrirListaArticulos() {
    buscarXHR('listar_articulos', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Buscar Artículo',
            columnas: [
                { title: 'Código', field: 'codigo', width: 100 },
                { title: 'Nombre', field: 'descr' },
                { title: 'UM', field: 'um', width: 80 },
            ],
            data: data.articulos || [],
            filtroCampos: ['codigo', 'descr'],
            onSelect: function(row) {
                document.getElementById('carCodigo').value = row.codigo;
                setSpan('carNombre', row.descr);
                cargarInfoProveedor();
            },
            onRefresh: function(opts) {
                buscarXHR('listar_articulos', {}, function(data) {
                    opts.data = data.articulos || [];
                    abrirModalBusqueda(opts);
                });
            },
        });
    });
}

function buscarArticulo() {
    const codigo = document.getElementById('carCodigo').value.trim();
    if (!codigo) return;
    buscarXHR('buscar_articulo', { codigo: codigo }, function(data) {
        if (data.success) {
            setSpan('carNombre', data.data.descr);
            cargarInfoProveedor();
        } else {
            setSpan('carNombre', '');
            Toastify({text: 'Artículo no encontrado', style: {background: '#f44336'}}).showToast();
        }
    });
}

function _fetchYDescargar(formdata, filename) {
    mostrarSpinner();
    return fetch(urlCompraArt, { method: 'POST', body: formdata })
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
    const codigo = document.getElementById('carCodigo').value.trim();
    const fecha_inicio = document.getElementById('carFechaInicio').value;
    const fecha_corte = document.getElementById('carFechaCorte').value;
    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', _getCookie('csrftoken'));
    formData.append('action', action);
    formData.append('codigo', codigo);
    formData.append('fecha_inicio', fecha_inicio);
    formData.append('fecha_corte', fecha_corte);
    return formData;
}

function generarPDF() {
    const codigo = document.getElementById('carCodigo').value.trim();
    const formData = _formDataBasico('generar_pdf');
    _fetchYDescargar(formData, `compra_articulos_${codigo || 'todos'}.pdf`);
}

function generarEXCEL() {
    const codigo = document.getElementById('carCodigo').value.trim();
    const formData = _formDataBasico('generar_excel');
    _fetchYDescargar(formData, `compra_articulos_${codigo || 'todos'}.xlsx`);
}
