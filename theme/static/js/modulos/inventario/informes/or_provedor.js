const urlOrProv = (document.currentScript?.dataset.url) || '/';
let tablaArt = null;
let tablaOcat = null;
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
    fetch(urlOrProv, {
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
    document.getElementById('oprFechaInicio').value = hoy;
    document.getElementById('oprFechaCorte').value = hoy;

    document.getElementById('oprRut')?.addEventListener('change', function() {
        buscarProveedor();
    });

    document.getElementById('oprFechaInicio')?.addEventListener('change', function() {
        consultarActual();
    });
    document.getElementById('oprFechaCorte')?.addEventListener('change', function() {
        consultarActual();
    });

    poblarAnos();
});

function poblarAnos() {
    const sel = document.getElementById('oprAno');
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
    const btns = { articulo: 'btnTabArt', ocat: 'btnTabOcat', mensual: 'btnTabMensual' };
    const tabs = { articulo: 'tabArticulo', ocat: 'tabOcat', mensual: 'tabMensual' };
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

    if (tab === 'ocat') cargarInfoOcat();
    else if (tab === 'mensual') cargarInformeMensual();
    else cargarInfoArticulo();
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
    const rut = document.getElementById('oprRut').value.trim();
    const fecha_inicio = document.getElementById('oprFechaInicio').value;
    const fecha_corte = document.getElementById('oprFechaCorte').value;
    if (!rut) {
        Toastify({text: 'Seleccione un proveedor', style: {background: '#f44336'}}).showToast();
        return null;
    }
    return { rut, fecha_inicio, fecha_corte };
}

function consultarActual() {
    const datos = _getDatos();
    if (!datos) return;
    document.getElementById('sinSeleccion')?.classList.add('hidden');
    const tabActiva = document.querySelector('[id^="tab"]:not(.hidden)');
    if (tabActiva && tabActiva.id === 'tabOcat') {
        cargarInfoOcat();
    } else if (tabActiva && tabActiva.id === 'tabMensual') {
        cargarInformeMensual();
    } else {
        cargarInfoArticulo();
    }
}

function cargarInfoArticulo() {
    const datos = _getDatos();
    if (!datos) return;
    buscarXHROr('info_articulo', datos, function(data) {
        if (!data.success) {
            Toastify({text: data.message || 'Error al cargar datos', style: {background: '#f44336'}}).showToast();
            return;
        }
        if (tablaArt) { tablaArt.destroy(); tablaArt = null; }
        const movimientos = data.data || [];
        if (movimientos.length === 0) {
            document.getElementById('resumenArticulo').classList.add('hidden');
            tablaArt = new Tabulator("#tablaArticulo", {
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
        document.getElementById('resumenArticulo').classList.remove('hidden');

        tablaArt = new Tabulator("#tablaArticulo", {
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
                { title: "Código", field: "codigo", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        return d._subtotal ? `<b>Subtotal ${d._codigo}</b>` : cell.getValue();
                    }
                },
                { title: "Nombre", field: "nombre", widthGrow: 4,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        return d._subtotal ? '' : cell.getValue();
                    }
                },
                { title: "UM", field: "um", widthGrow: 1,
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

function cargarInfoOcat() {
    const datos = _getDatos();
    if (!datos) return;
    buscarXHROr('info_ocat', datos, function(data) {
        if (!data.success) {
            Toastify({text: data.message || 'Error al cargar datos', style: {background: '#f44336'}}).showToast();
            return;
        }
        if (tablaOcat) { tablaOcat.destroy(); tablaOcat = null; }
        const ocatList = data.data || [];
        if (ocatList.length === 0) {
            document.getElementById('resumenOcat').classList.add('hidden');
            tablaOcat = new Tabulator("#tablaOcat", {
                data: [], columns: [], placeholder: "Sin OCAT para el período seleccionado", layout: "fitColumns", height: "100%"
            });
            return;
        }

        const flatData = [];
        ocatList.forEach(o => {
            flatData.push({
                _isHeader: true,
                numero: o.numero,
                fecha: o.fecha,
                estado: o.estado,
                neto: o.neto,
                total: o.total,
                encargado_nombre: o.encargado_nombre,
                docref: o.docref,
            });
            if (o.detalles && o.detalles.length > 0) {
                o.detalles.forEach(det => {
                    flatData.push({
                        _isDetail: true,
                        linea: det.linea,
                        codigo: det.codigo,
                        nombre: det.nombre,
                        cantidad: det.cantidad,
                        punit: det.punit,
                        det_total: det.total,
                    });
                });
            }
        });

        let totalNeto = 0, totalMonto = 0;
        ocatList.forEach(o => {
            totalNeto += o.neto || 0;
            totalMonto += o.total || 0;
        });

        document.getElementById('resTotalOcat').textContent = ocatList.length.toLocaleString('es-CL');
        document.getElementById('resNetoOcat').textContent = '$' + totalNeto.toLocaleString('es-CL');
        document.getElementById('resMontoOcat').textContent = '$' + totalMonto.toLocaleString('es-CL');
        document.getElementById('resumenOcat').classList.remove('hidden');

        tablaOcat = new Tabulator("#tablaOcat", {
            data: flatData,
            layout: "fitColumns",
            height: "100%",
            pagination: true,
            paginationSize: 15,
            paginationSizeSelector: [10, 20, 50, 100],
            rowFormatter: function(row) {
                const d = row.getData();
                const el = row.getElement();
                el.classList.remove('ocat-header');
                if (d._isHeader) el.classList.add('ocat-header');
            },
            columns: [
                { title: "Número", field: "numero", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        return d._isHeader ? cell.getValue() : '';
                    }
                },
                { title: "Fecha", field: "fecha", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        return d._isHeader ? cell.getValue() : '';
                    }
                },
                { title: "Estado", field: "estado", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        return d._isHeader ? cell.getValue() : '';
                    }
                },
                { title: "Neto", field: "neto", hozAlign: "right", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        if (!d._isHeader) return '';
                        const v = cell.getValue();
                        return v != null ? '$' + Number(v).toLocaleString('es-CL') : '$0';
                    }
                },
                { title: "Total OCAT", field: "total", hozAlign: "right", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        if (!d._isHeader) return '';
                        const v = d.total;
                        return v != null ? '$' + Number(v).toLocaleString('es-CL') : '$0';
                    }
                },
                { title: "Encargado", field: "encargado_nombre", widthGrow: 3,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        return d._isHeader ? cell.getValue() : '';
                    }
                },
                { title: "Doc Ref", field: "docref", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        return d._isHeader ? cell.getValue() : '';
                    }
                },
                { title: "Código", field: "codigo", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        return d._isDetail ? d.codigo || '' : '';
                    }
                },
                { title: "Nombre", field: "nombre", widthGrow: 4,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        return d._isDetail ? d.nombre || '' : '';
                    }
                },
                { title: "Cantidad", field: "cantidad", hozAlign: "right", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        if (!d._isDetail) return '';
                        const v = d.cantidad;
                        return v != null ? Number(v).toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3}) : '';
                    }
                },
                { title: "P.Unit", field: "punit", hozAlign: "right", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        if (!d._isDetail) return '';
                        const v = d.punit;
                        return v != null ? '$' + Number(v).toLocaleString('es-CL') : '';
                    }
                },
                { title: "Total Det", field: "det_total", hozAlign: "right", widthGrow: 2,
                    formatter: function(cell) {
                        const d = cell.getRow().getData();
                        if (!d._isDetail) return '';
                        const v = d.det_total;
                        return v != null ? '$' + Number(v).toLocaleString('es-CL') : '';
                    }
                },
            ],
            placeholder: "Sin OCAT para el período seleccionado",
        });
    });
}

function cargarInformeMensual() {
    const rut = document.getElementById('oprRut').value.trim();
    const ano = document.getElementById('oprAno').value;
    if (!rut) {
        Toastify({text: 'Seleccione un proveedor', style: {background: '#f44336'}}).showToast();
        return;
    }
    buscarXHROr('informe_mensual', { rut: rut, ano: ano }, function(data) {
        if (!data.success) {
            Toastify({text: data.message || 'Error al cargar datos', style: {background: '#f44336'}}).showToast();
            return;
        }
        if (tablaMensual) { tablaMensual.destroy(); tablaMensual = null; }
        const articulos = data.data || [];
        if (articulos.length === 0) {
            document.getElementById('resumenMensual').classList.add('hidden');
            tablaMensual = new Tabulator("#tablaMensual", {
                data: [], columns: [], placeholder: "Sin datos para el año seleccionado", layout: "fitColumns", height: "100%"
            });
            return;
        }

        let totalCant = 0, totalValor = 0;
        articulos.forEach(a => {
            totalCant += a.tot_cant || 0;
            totalValor += a.tot_valor || 0;
        });

        document.getElementById('resNetoAnual').textContent = '$' + totalValor.toLocaleString('es-CL');
        document.getElementById('resMontoAnual').textContent = totalCant.toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3});
        document.getElementById('resOcatAno').textContent = articulos.length.toLocaleString('es-CL');
        document.getElementById('resPromMensual').textContent = '$' + Math.round(totalValor / 12).toLocaleString('es-CL');
        document.getElementById('resumenMensual').classList.remove('hidden');

        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const fmtNum = (v) => v != null ? Number(v).toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3}) : '';
        const fmt$ = (v) => v != null ? '$' + Number(v).toLocaleString('es-CL') : '';

        const columns = [
            { title: "Código", field: "codigo", widthGrow: 2 },
            { title: "Nombre", field: "nombre", widthGrow: 4 },
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
            data: articulos,
            layout: "fitDataTable",
            height: "100%",
            columns: columns,
            placeholder: "Sin datos para el año seleccionado",
        });
    });
}

function abrirListaProveedores() {
    buscarXHROr('listar_proveedores', {}, function(data) {
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
            document.getElementById('oprRut').value = p.rut;
            setSpan('oprNombre', p.nombre);
            cerrarListaProveedores();
            consultarActual();
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
    const rut = document.getElementById('oprRut').value.trim();
    if (!rut) return;
    buscarXHROr('buscar_proveedor', { rut: rut }, function(data) {
        if (data.success) {
            setSpan('oprNombre', data.data.nombre);
            consultarActual();
        } else {
            setSpan('oprNombre', '');
            Toastify({text: 'Proveedor no encontrado', style: {background: '#f44336'}}).showToast();
        }
    });
}

function _fetchYDescargar(formdata, filename) {
    mostrarSpinner();
    return fetch(urlOrProv, { method: 'POST', body: formdata })
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
    const rut = document.getElementById('oprRut').value.trim();
    const fecha_inicio = document.getElementById('oprFechaInicio').value;
    const fecha_corte = document.getElementById('oprFechaCorte').value;
    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', _getCookie('csrftoken'));
    formData.append('action', action);
    formData.append('rut', rut);
    formData.append('fecha_inicio', fecha_inicio);
    formData.append('fecha_corte', fecha_corte);
    return formData;
}

function getTabActiva() {
    const tabArticulo = document.getElementById('tabArticulo');
    const tabOcat = document.getElementById('tabOcat');
    if (tabOcat && !tabOcat.classList.contains('hidden')) {
        return 'ocat';
    }
    return 'articulo';
}

function generarPDFInfo() {
    const rut = document.getElementById('oprRut').value.trim();
    if (!rut) { Toastify({text: 'Seleccione un proveedor', style: {background: '#f44336'}}).showToast(); return; }
    const tab = getTabActiva();
    const action = tab === 'ocat' ? 'generar_pdf_ocat' : 'generar_pdf_info';
    const filename = tab === 'ocat' ? `info_ocat_${rut}.pdf` : `info_articulo_${rut}.pdf`;
    const formData = _formDataBasico(action);
    _fetchYDescargar(formData, filename);
}

function generarEXCELInfo() {
    const rut = document.getElementById('oprRut').value.trim();
    if (!rut) { Toastify({text: 'Seleccione un proveedor', style: {background: '#f44336'}}).showToast(); return; }
    const tab = getTabActiva();
    const action = tab === 'ocat' ? 'generar_excel_ocat' : 'generar_excel_info';
    const filename = tab === 'ocat' ? `info_ocat_${rut}.xlsx` : `info_articulo_${rut}.xlsx`;
    const formData = _formDataBasico(action);
    _fetchYDescargar(formData, filename);
}

function generarPDFMensual() {
    const rut = document.getElementById('oprRut').value.trim();
    const ano = document.getElementById('oprAno').value;
    if (!rut) { Toastify({text: 'Seleccione un proveedor', style: {background: '#f44336'}}).showToast(); return; }
    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', _getCookie('csrftoken'));
    formData.append('action', 'generar_pdf_mensual');
    formData.append('rut', rut);
    formData.append('ano', ano);
    _fetchYDescargar(formData, `informe_mensual_${rut}_${ano}.pdf`);
}

function generarEXCELMensual() {
    const rut = document.getElementById('oprRut').value.trim();
    const ano = document.getElementById('oprAno').value;
    if (!rut) { Toastify({text: 'Seleccione un proveedor', style: {background: '#f44336'}}).showToast(); return; }
    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', _getCookie('csrftoken'));
    formData.append('action', 'generar_excel_mensual');
    formData.append('rut', rut);
    formData.append('ano', ano);
    _fetchYDescargar(formData, `informe_mensual_${rut}_${ano}.xlsx`);
}
