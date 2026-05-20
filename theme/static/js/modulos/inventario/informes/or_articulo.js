const urlOrArt = (document.currentScript?.dataset.url) || '/';
let tablaProv = null;
let tablaMensual = null;

function buscarXHROr(action, datos, callback) {
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
    fetch(urlOrArt, {
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
    document.getElementById('oarFechaInicio').value = hoy;
    document.getElementById('oarFechaCorte').value = hoy;

    document.getElementById('oarCodigo')?.addEventListener('change', function() {
        buscarArticulo();
    });

    document.getElementById('oarFechaInicio')?.addEventListener('change', function() {
        consultarActual();
    });
    document.getElementById('oarFechaCorte')?.addEventListener('change', function() {
        consultarActual();
    });

    poblarAnos();
});

function poblarAnos() {
    const sel = document.getElementById('oarAno');
    const anoActual = new Date().getFullYear();
    sel.innerHTML = '';
    for (let y = anoActual; y >= anoActual - 5; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        sel.appendChild(opt);
    }
}

function cambiarTab(tab) {
    const btns = { proveedor: 'btnTabProv', mensual: 'btnTabMensual' };
    const tabs = { proveedor: 'tabProveedor', mensual: 'tabMensual' };
    const sinSel = document.getElementById('sinSeleccion');

    Object.keys(btns).forEach(key => {
        const btn = document.getElementById(btns[key]);
        const tabEl = document.getElementById(tabs[key]);
        if (key === tab) {
            btn.className = 'px-4 py-3 text-sm font-semibold text-aq-primary border-b-2 border-aq-primary';
            tabEl.classList.remove('hidden');
        } else {
            btn.className = 'px-4 py-3 text-sm text-aq-text/60 hover:text-aq-text border-b-2 border-transparent';
            tabEl.classList.add('hidden');
        }
    });

    if (sinSel) sinSel.classList.add('hidden');

    if (tab === 'mensual') cargarInformeMensual();
    else cargarInfoProveedor();
}

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
    const codigo = document.getElementById('oarCodigo').value.trim();
    const fecha_inicio = document.getElementById('oarFechaInicio').value;
    const fecha_corte = document.getElementById('oarFechaCorte').value;
    if (!codigo) {
        Toastify({text: 'Seleccione un artículo', style: {background: '#f44336'}}).showToast();
        return null;
    }
    return { codigo, fecha_inicio, fecha_corte };
}

function consultarActual() {
    const datos = _getDatos();
    if (!datos) return;
    document.getElementById('sinSeleccion')?.classList.add('hidden');
    const tabActiva = document.querySelector('[id^="tab"]:not(.hidden)');
    if (tabActiva && tabActiva.id === 'tabMensual') {
        cargarInformeMensual();
    } else {
        cargarInfoProveedor();
    }
}

function cargarInfoProveedor() {
    const datos = _getDatos();
    if (!datos) return;
    buscarXHROr('info_proveedor', datos, function(data) {
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

        let totalEntradas = 0, totalSalidas = 0, totalMonto = 0;
        movimientos.forEach(m => {
            if (!m._subtotal) {
                if (m.signo > 0) totalEntradas += m.cantidad || 0;
                if (m.signo < 0) totalSalidas += Math.abs(m.cantidad || 0);
                totalMonto += m.total || 0;
            }
        });
        const saldo = totalEntradas - totalSalidas;
        const soloMovimientos = movimientos.filter(m => !m._subtotal);

        document.getElementById('resMovimientos').textContent = soloMovimientos.length.toLocaleString('es-CL');
        document.getElementById('resEntradas').textContent = totalEntradas.toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3});
        document.getElementById('resSalidas').textContent = totalSalidas.toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3});
        document.getElementById('resSaldo').textContent = saldo.toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3});
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
                    row.getElement().style.color = '#4b5563';
                }
            },
            columns: [
                { title: "Fecha", field: "fecha", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        return d._subtotal ? '' : cell.getValue();
                    }
                },
                { title: "RUT", field: "rut", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        return d._subtotal ? `<b>Subtotal ${d._rut}</b>` : cell.getValue();
                    }
                },
                { title: "Proveedor", field: "proveedor_nombre", widthGrow: 4,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        return d._subtotal ? '' : cell.getValue();
                    }
                },
                { title: "Cantidad", field: "cantidad", hozAlign: "right", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        if (d._subtotal) return `<b>${Number(d._saldo || 0).toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3})}</b>`;
                        const v = cell.getValue();
                        return v != null ? Number(v).toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3}) : '';
                    }
                },
                { title: "P.Unit", field: "punit", hozAlign: "right", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        if (d._subtotal) return '';
                        const v = cell.getValue();
                        return v != null ? '$' + Number(v).toLocaleString('es-CL') : '';
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
                        const d = cell.getRow().getData();
                        return d._subtotal ? '' : cell.getValue();
                    }
                },
                { title: "Número", field: "numero", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        return d._subtotal ? '' : cell.getValue();
                    }
                },
                { title: "Bodega", field: "bodega_nombre", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        return d._subtotal ? '' : cell.getValue();
                    }
                },
            ],
            placeholder: "Sin movimientos para el período seleccionado",
        });
    });
}

function cargarInformeMensual() {
    const codigo = document.getElementById('oarCodigo').value.trim();
    const ano = document.getElementById('oarAno').value;
    if (!codigo) {
        Toastify({text: 'Seleccione un artículo', style: {background: '#f44336'}}).showToast();
        return;
    }
    buscarXHROr('informe_mensual', { codigo: codigo, ano: ano }, function(data) {
        if (!data.success) {
            Toastify({text: data.message || 'Error al cargar datos', style: {background: '#f44336'}}).showToast();
            return;
        }
        if (tablaMensual) { tablaMensual.destroy(); tablaMensual = null; }
        const proveedores = data.data || [];
        if (proveedores.length === 0) {
            document.getElementById('resumenMensual').classList.add('hidden');
            tablaMensual = new Tabulator("#tablaMensual", {
                data: [], columns: [], placeholder: "Sin datos para el año seleccionado", layout: "fitColumns", height: "100%"
            });
            return;
        }

        let totalCant = 0, totalValor = 0;
        proveedores.forEach(p => {
            totalCant += p.tot_cant || 0;
            totalValor += p.tot_valor || 0;
        });

        document.getElementById('resNetoAnual').textContent = '$' + totalValor.toLocaleString('es-CL');
        document.getElementById('resMontoAnual').textContent = totalCant.toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3});
        document.getElementById('resProvAno').textContent = proveedores.length.toLocaleString('es-CL');
        document.getElementById('resPromMensual').textContent = '$' + Math.round(totalValor / 12).toLocaleString('es-CL');
        document.getElementById('resumenMensual').classList.remove('hidden');

        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const fmtNum = (v) => v != null ? Number(v).toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3}) : '';
        const fmt$ = (v) => v != null ? '$' + Number(v).toLocaleString('es-CL') : '';

        const columns = [
            { title: "RUT", field: "rut", widthGrow: 2 },
            { title: "Proveedor", field: "nombre", widthGrow: 4 },
        ];
        for (let m = 1; m <= 12; m++) {
            columns.push({ title: monthNames[m - 1], columns: [
                { title: "Cant", field: `m${m}_cant`, hozAlign: "right", widthGrow: 2,
                    formatter: (cell) => fmtNum(cell.getValue())
                },
                { title: "Valor", field: `m${m}_valor`, hozAlign: "right", widthGrow: 3,
                    formatter: (cell) => fmt$(cell.getValue())
                },
            ]});
        }
        columns.push({ title: "Total", columns: [
            { title: "Cant", field: "tot_cant", hozAlign: "right", widthGrow: 2,
                formatter: (cell) => `<b>${fmtNum(cell.getValue())}</b>`
            },
            { title: "Valor", field: "tot_valor", hozAlign: "right", widthGrow: 3,
                formatter: (cell) => `<b>${fmt$(cell.getValue())}</b>`
            },
        ]});

        tablaMensual = new Tabulator("#tablaMensual", {
            data: proveedores,
            layout: "fitDataTable",
            height: "100%",
            columns: columns,
            placeholder: "Sin datos para el año seleccionado",
        });
    });
}

function abrirListaArticulos() {
    buscarXHROr('listar_articulos', {}, function(data) {
        window.listaArticulos = data.articulos || [];
        document.getElementById('modalArticulos').classList.remove('hidden');
        document.getElementById('filtroArticulos').value = '';
        renderizarListaArticulos(window.listaArticulos);
    });
}

function cerrarListaArticulos() {
    document.getElementById('modalArticulos').classList.add('hidden');
}

function renderizarListaArticulos(lista) {
    const tbody = document.getElementById('tablaListaArticulos');
    tbody.innerHTML = '';
    lista.forEach(a => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            document.getElementById('oarCodigo').value = a.codigo;
            setSpan('oarNombre', a.descr);
            cerrarListaArticulos();
            consultarActual();
        };
        tr.innerHTML = `
            <td class="px-3 py-2 text-aq-text">${a.codigo}</td>
            <td class="px-3 py-2 text-aq-text">${a.descr || ''}</td>
            <td class="px-3 py-2 text-aq-text">${a.um || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarArticulos() {
    const filtro = document.getElementById('filtroArticulos').value.toLowerCase();
    const filtradas = window.listaArticulos.filter(a =>
        (a.codigo && a.codigo.toLowerCase().includes(filtro)) ||
        (a.descr && a.descr.toLowerCase().includes(filtro))
    );
    renderizarListaArticulos(filtradas);
}

function buscarArticulo() {
    const codigo = document.getElementById('oarCodigo').value.trim();
    if (!codigo) return;
    buscarXHROr('buscar_articulo', { codigo: codigo }, function(data) {
        if (data.success) {
            setSpan('oarNombre', data.data.descr);
            consultarActual();
        } else {
            setSpan('oarNombre', '');
            Toastify({text: 'Artículo no encontrado', style: {background: '#f44336'}}).showToast();
        }
    });
}

function _fetchYDescargar(formdata, filename) {
    mostrarSpinner();
    return fetch(urlOrArt, { method: 'POST', body: formdata })
    .then(res => {
        if (!res.ok) throw new Error('Error HTTP ' + res.status);
        return res.blob();
    })
    .then(blob => {
        ocultarSpinner();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
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
    const codigo = document.getElementById('oarCodigo').value.trim();
    const fecha_inicio = document.getElementById('oarFechaInicio').value;
    const fecha_corte = document.getElementById('oarFechaCorte').value;
    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', _getCookie('csrftoken'));
    formData.append('action', action);
    formData.append('codigo', codigo);
    formData.append('fecha_inicio', fecha_inicio);
    formData.append('fecha_corte', fecha_corte);
    return formData;
}

function getTabActiva() {
    return 'proveedor';
}

function generarPDFInfo() {
    const codigo = document.getElementById('oarCodigo').value.trim();
    if (!codigo) { Toastify({text: 'Seleccione un artículo', style: {background: '#f44336'}}).showToast(); return; }
    const formData = _formDataBasico('generar_pdf_info');
    _fetchYDescargar(formData, `info_proveedor_${codigo}.pdf`);
}

function generarEXCELInfo() {
    const codigo = document.getElementById('oarCodigo').value.trim();
    if (!codigo) { Toastify({text: 'Seleccione un artículo', style: {background: '#f44336'}}).showToast(); return; }
    const formData = _formDataBasico('generar_excel_info');
    _fetchYDescargar(formData, `info_proveedor_${codigo}.xlsx`);
}

function generarPDFMensual() {
    const codigo = document.getElementById('oarCodigo').value.trim();
    const ano = document.getElementById('oarAno').value;
    if (!codigo) { Toastify({text: 'Seleccione un artículo', style: {background: '#f44336'}}).showToast(); return; }
    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', _getCookie('csrftoken'));
    formData.append('action', 'generar_pdf_mensual');
    formData.append('codigo', codigo);
    formData.append('ano', ano);
    _fetchYDescargar(formData, `informe_mensual_${codigo}_${ano}.pdf`);
}

function generarEXCELMensual() {
    const codigo = document.getElementById('oarCodigo').value.trim();
    const ano = document.getElementById('oarAno').value;
    if (!codigo) { Toastify({text: 'Seleccione un artículo', style: {background: '#f44336'}}).showToast(); return; }
    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', _getCookie('csrftoken'));
    formData.append('action', 'generar_excel_mensual');
    formData.append('codigo', codigo);
    formData.append('ano', ano);
    _fetchYDescargar(formData, `informe_mensual_${codigo}_${ano}.xlsx`);
}
