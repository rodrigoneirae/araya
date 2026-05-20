const urlPE = (document.currentScript?.dataset.url) || '/';

let detallesPE = [];
let modoEdicionPE = false;
let callbackConfirmar = null;
let tabulatorSubOTRef = null;
let tabulatorSubVCRef = null;

function mostrarConfirmar(titulo, mensaje, callback) {
    document.getElementById('modalConfirmarTitulo').textContent = titulo;
    document.getElementById('modalConfirmarMensaje').textContent = mensaje;
    callbackConfirmar = callback;
    document.getElementById('modalConfirmar').classList.remove('hidden');
}

function cerrarModalConfirmar() {
    document.getElementById('modalConfirmar').classList.add('hidden');
    callbackConfirmar = null;
}

function ejecutarModalConfirmar() {
    const callback = callbackConfirmar;
    document.getElementById('modalConfirmar').classList.add('hidden');
    callbackConfirmar = null;
    if (callback) callback();
}

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

function buscarXHRPE(action, datos, callback) {
    const csrfToken = getCookie('csrftoken');
    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', csrfToken);
    formData.append('action', action);
    for (let key in datos) {
        if (Array.isArray(datos[key])) {
            formData.append(key, JSON.stringify(datos[key]));
        } else {
            formData.append(key, datos[key]);
        }
    }
    fetch(urlPE, {
        method: 'POST',
        body: formData
    })
    .then(res => {
        if (!res.ok) {
            throw new Error('HTTP error: ' + res.status);
        }
        return res.json();
    })
    .then(data => {
        callback(data);
    })
    .catch(err => {
        console.error('Error:', err);
        Toastify({text: 'Error: ' + err.message, style: {background: '#f44336'}}).showToast();
    });
}

document.addEventListener('DOMContentLoaded', function() {
    inicializarTabulatorPE();
    cargarDatosInicialesPE();
});

function inicializarTabulatorPE() {
    tabulatorSubOTRef = new Tabulator("#tabulatorSubOTRef", {
        layout: "fitColumns",
        headerSort: false,
        minHeight: "100px",
        columns: [
            { title: "Fecha", field: "fecha", minWidth: 80 },
            { title: "Código", field: "codigo", minWidth: 80 },
            { title: "Descripción", field: "nombre", minWidth: 150 },
            { title: "Cant", field: "cantidad", minWidth: 60, hozAlign: "right" },
            { title: "UM", field: "um", minWidth: 50 },
            { title: "Tipo", field: "tipo", minWidth: 60 },
            { title: "Proceso", field: "proceso", minWidth: 100 },
        ],
        data: [],
        locale: "es",
        langs: {
            es: {
                "pagination": {
                    "page_size": "",
                }
            }
        }
    });

    tabulatorSubVCRef = new Tabulator("#tabulatorSubVCRef", {
        layout: "fitColumns",
        headerSort: false,
        minHeight: "100px",
        columns: [
            { title: "Fecha", field: "fecha", minWidth: 80 },
            { title: "Código", field: "codigo", minWidth: 80 },
            { title: "Descripción", field: "nombre", minWidth: 150 },
            { title: "Cant", field: "cantidad", minWidth: 60, hozAlign: "right" },
            { title: "UM", field: "um", minWidth: 50 },
            { title: "Tipo", field: "tipo", minWidth: 60 },
            { title: "Proceso", field: "proceso", minWidth: 100 },
            { title: "CUP", field: "cup", minWidth: 70, hozAlign: "right" },
        ],
        data: [],
        locale: "es",
        langs: {
            es: {
                "pagination": {
                    "page_size": "",
                }
            }
        }
    });
}

function cargarDatosInicialesPE() {
    buscarXHRPE('listar_encargados', {}, function(data) {
        const select = document.getElementById('peEncargado');
        if (select && data.encargados) {
            data.encargados.forEach(e => {
                const option = document.createElement('option');
                option.value = e.cod;
                option.textContent = e.nombre;
                select.appendChild(option);
            });
        }
    });

    buscarXHRPE('listar_procesos', {}, function(data) {
        const select = document.getElementById('peProceso');
        if (select && data.procesos) {
            data.procesos.forEach(p => {
                const option = document.createElement('option');
                option.value = p.cod;
                option.textContent = p.nombre;
                select.appendChild(option);
            });
        }
    });

    buscarXHRPE('listar_bodegas', {}, function(data) {
        const select = document.getElementById('peArtBodega');
        if (select && data.bodegas) {
            data.bodegas.forEach(b => {
                const option = document.createElement('option');
                option.value = b.cod;
                option.textContent = b.nombre;
                select.appendChild(option);
            });
        }
    });

    const fecha = new Date().toISOString().split('T')[0];
    document.getElementById('peFecha').value = fecha;
    document.getElementById('peArtFecha').value = fecha;
    nuevoPE();
    setCamposPEEditable(true);
    document.getElementById('btnEditarPE').classList.add('hidden');
    document.getElementById('btnGuardarPE').classList.remove('hidden');

    document.getElementById('peOT').addEventListener('change', function() {
        buscarOTInput();
    });
}

function nuevoPE() {
    buscarXHRPE('proximo_numero', {}, function(data) {
        const nuevoNumero = data.proximo_numero || '';
        document.getElementById('peNumero').value = nuevoNumero;
        document.getElementById('peProceso').value = '';
        document.getElementById('peEncargado').value = '';

        const fecha = new Date().toISOString().split('T')[0];
        document.getElementById('peFecha').value = fecha;

        detallesPE = [];
        renderizarDetallesPE();
        actualizarResumenPE();

        renderizarSubOTRef([]);
        renderizarSubVCRef([]);

        modoEdicionPE = false;
        document.getElementById('btnGuardarPE').classList.remove('hidden');
        document.getElementById('btnEditarPE').classList.add('hidden');
        document.getElementById('btnEliminarPE').classList.add('hidden');

        setCamposPEEditable(true);
        cambiarTabPE('encabezado');

        if (nuevoNumero) {
            buscarXHRPE('buscar_ot', {numero: nuevoNumero}, function(dataOT) {
                if (dataOT.success) {
                    document.getElementById('peOT').value = nuevoNumero;

                    const procesoValue = dataOT.data.proceso ? String(dataOT.data.proceso).split('.')[0] : '';
                    const encargadoValue = dataOT.data.encargado ? String(dataOT.data.encargado).split('.')[0] : '';
                    document.getElementById('peProceso').value = procesoValue;
                    document.getElementById('peEncargado').value = encargadoValue;

                    cargarSubOTRef(nuevoNumero);
                    cargarSubVCRef(nuevoNumero);

                    if (dataOT.data.estado === 'Cerrado') {
                        Toastify({text: 'La OT está cerrada. No se pueden realizar cambios.', style: {background: '#f44336'}}).showToast();
                        document.getElementById('tab-detalle').classList.add('pointer-events-none', 'opacity-50');
                    } else {
                        document.getElementById('tab-detalle').classList.remove('pointer-events-none', 'opacity-50');
                    }
                } else {
                    document.getElementById('tab-detalle').classList.add('pointer-events-none', 'opacity-50');
                }
            });
        }
    });
}

function guardarPE() {
    const numero = document.getElementById('peNumero').value;
    const ot = document.getElementById('peOT').value;
    const fecha = document.getElementById('peFecha').value;
    const proceso = document.getElementById('peProceso').value;
    const encargado = document.getElementById('peEncargado').value;

    if (!numero) {
        Toastify({text: 'Número de PE requerido', style: {background: '#f44336'}}).showToast();
        return;
    }

    if (!ot) {
        Toastify({text: 'Debe seleccionar una OT', style: {background: '#f44336'}}).showToast();
        return;
    }

    if (!fecha) {
        Toastify({text: 'Fecha requerida', style: {background: '#f44336'}}).showToast();
        return;
    }

    const datos = {
        numero: numero,
        ot: ot,
        fecha: fecha,
        proceso: proceso,
        encargado: encargado,
        detalles: JSON.stringify(detallesPE)
    };

    buscarXHRPE('nuevo', datos, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            modoEdicionPE = true;
            document.getElementById('btnEditarPE').classList.remove('hidden');
            document.getElementById('btnEliminarPE').classList.remove('hidden');
            document.getElementById('btnGuardarPE').classList.add('hidden');
        } else {
            Toastify({text: data.message || 'Error al guardar', style: {background: '#f44336'}}).showToast();
        }
    });
}

function editarPE() {
    setCamposPEEditable(true);
    document.getElementById('btnGuardarPE').classList.remove('hidden');
    document.getElementById('btnEditarPE').classList.add('hidden');
    modoEdicionPE = false;
}

function eliminarPE() {
    const numero = document.getElementById('peNumero').value;
    if (!numero) return;

    mostrarConfirmar(
        'Eliminar PE',
        '¿Está seguro de eliminar el Parte de Entrada actual?',
        function() {
            buscarXHRPE('eliminar', {numero: numero}, function(data) {
                if (data.success) {
                    Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                    nuevoPE();
                } else {
                    Toastify({text: data.message || 'Error al eliminar', style: {background: '#f44336'}}).showToast();
                }
            });
        }
    );
}

function setCamposPEEditable(editable) {
    const campos = ['peNumero', 'peFecha', 'peOT', 'peProceso', 'peEncargado'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !editable;
    });
}

function buscarPEInput() {
    const numero = document.getElementById('peNumero').value;
    if (!numero) return;
    buscarXHRPE('buscar', {numero: numero}, function(data) {
        if (data.success) {
            cargarPE(data.data);
        } else {
            Toastify({text: data.message || 'PE no encontrado', style: {background: '#f44336'}}).showToast();
        }
    });
}

function cargarPE(data) {
    document.getElementById('peNumero').value = data.numero || '';
    document.getElementById('peFecha').value = data.fecha || '';
    document.getElementById('peOT').value = data.ot || '';
    document.getElementById('peProceso').value = data.proceso || '';
    document.getElementById('peEncargado').value = data.codencargado || '';

    detallesPE = [];
    if (data.detalles) {
        data.detalles.forEach(d => {
            detallesPE.push({
                fecha: d.fecha ? new Date(d.fecha).toISOString().split('T')[0] : '',
                codigo: d.codigo || '',
                nombre: d.nombre || '',
                cantidad: d.cantidad || 0,
                bodega: d.bodega || '',
                punit: d.punit || 0,
                estado: d.estado || 'Abierto'
            });
        });
    }

    renderizarDetallesPE();
    actualizarResumenPE();

    modoEdicionPE = true;
    document.getElementById('btnGuardarPE').classList.add('hidden');
    document.getElementById('btnEditarPE').classList.remove('hidden');
    document.getElementById('btnEliminarPE').classList.remove('hidden');

    setCamposPEEditable(true);

    if (data.ot) {
        buscarXHRPE('buscar_ot', {numero: data.ot}, function(dataOT) {
            cargarSubOTRef(data.ot);
            cargarSubVCRef(data.ot);

            if (dataOT.success && dataOT.data.estado === 'Cerrado') {
                document.getElementById('tab-detalle').classList.add('pointer-events-none', 'opacity-50');
            } else {
                document.getElementById('tab-detalle').classList.remove('pointer-events-none', 'opacity-50');
            }
        });
    }

    cambiarTabPE('encabezado');
}

function sincronizarPEconOT() {
    const ot = document.getElementById('peOT').value;
    if (ot) {
        document.getElementById('peNumero').value = ot;
    }
}

function buscarOTInput() {
    const ot = document.getElementById('peOT').value;
    if (!ot) return;

    document.getElementById('peNumero').value = ot;
    document.getElementById('peProceso').value = '';
    document.getElementById('peEncargado').value = '';

    buscarXHRPE('buscar', {numero: ot}, function(dataPE) {
        if (dataPE.success) {
            cargarPE(dataPE.data);
            cargarSubOTRef(ot);
            cargarSubVCRef(ot);
        } else {
            buscarXHRPE('buscar_ot', {numero: ot}, function(data) {
                if (data.success) {
                    const procesoValue = data.data.proceso ? String(data.data.proceso).split('.')[0] : '';
                    const encargadoValue = data.data.encargado ? String(data.data.encargado).split('.')[0] : '';
                    document.getElementById('peProceso').value = procesoValue;
                    document.getElementById('peEncargado').value = encargadoValue;

                    cargarSubOTRef(ot);
                    cargarSubVCRef(ot);

                    if (data.data.estado === 'Cerrado') {
                        Toastify({text: 'La OT está cerrada. No se pueden realizar cambios.', style: {background: '#f44336'}}).showToast();
                        document.getElementById('tab-detalle').classList.add('pointer-events-none', 'opacity-50');
                    } else {
                        document.getElementById('tab-detalle').classList.remove('pointer-events-none', 'opacity-50');
                    }
                } else {
                    Toastify({text: data.message || 'OT no encontrada', style: {background: '#f44336'}}).showToast();
                }
            });
        }
    });
}

function cargarSubOTRef(ot) {
    buscarXHRPE('listar_subot_ref', {ot: ot}, function(data) {
        renderizarSubOTRef(data.subot || []);
    });
}

function cargarSubVCRef(ot) {
    buscarXHRPE('listar_subvc_ref', {ot: ot}, function(data) {
        renderizarSubVCRef(data.subvc || []);
    });
}

function renderizarSubOTRef(lista) {
    if (tabulatorSubOTRef) {
        tabulatorSubOTRef.setData(lista || []);
    }
}

function renderizarSubVCRef(lista) {
    if (tabulatorSubVCRef) {
        tabulatorSubVCRef.setData(lista || []);
    }
}

function agregarDetallePE() {
    const codigo = document.getElementById('peArtCod').value;
    const nombre = document.getElementById('peArtNombre').value;
    const cantidad = parseFloat(document.getElementById('peArtCant').value) || 0;
    const bodega = document.getElementById('peArtBodega').value;
    const um = document.getElementById('peArtUM').value;
    const punit = parseFloat(document.getElementById('peArtPUnit').value) || 0;
    const fecha = document.getElementById('peArtFecha').value || new Date().toISOString().split('T')[0];

    if (!codigo) {
        Toastify({text: 'Ingrese código del artículo', style: {background: '#f44336'}}).showToast();
        return;
    }

    if (cantidad <= 0) {
        Toastify({text: 'Ingrese una cantidad mayor que cero', style: {background: '#f44336'}}).showToast();
        return;
    }

    let estado = 'Abierto';
    if (codigo.toUpperCase().startsWith('P')) {
        estado = 'Cerrado';
    }

    detallesPE.push({
        fecha: fecha,
        codigo: codigo,
        nombre: nombre,
        cantidad: cantidad,
        bodega: bodega,
        um: um,
        punit: punit,
        estado: estado
    });

    document.getElementById('peArtCod').value = '';
    document.getElementById('peArtNombre').value = '';
    document.getElementById('peArtUM').value = '';
    document.getElementById('peArtCant').value = '';
    document.getElementById('peArtBodega').value = '';
    document.getElementById('peArtPUnit').value = '';
    document.getElementById('peArtCod').focus();

    renderizarDetallesPE();
    actualizarResumenPE();
}

function eliminarDetallePE(index) {
    detallesPE.splice(index, 1);
    renderizarDetallesPE();
    actualizarResumenPE();
}

function renderizarDetallesPE() {
    const tbody = document.getElementById('peDetalle');
    tbody.innerHTML = '';

    detallesPE.forEach((det, index) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2';
        tr.innerHTML = `
            <td class="px-1 py-1.5 text-aq-text whitespace-nowrap text-xs">${det.codigo || ''}</td>
            <td class="px-1 py-1.5 text-aq-text whitespace-nowrap text-xs">${det.bodega || ''}</td>
            <td class="px-1 py-1.5 text-aq-text text-right whitespace-nowrap text-xs">${det.cantidad || 0}</td>
            <td class="px-1 py-1.5 text-aq-text whitespace-nowrap text-xs">${det.um || ''}</td>
            <td class="px-1 py-1.5 text-aq-text whitespace-nowrap text-xs">${det.nombre || ''}</td>
            <td class="px-1 py-1.5 text-aq-text text-right whitespace-nowrap text-xs">${det.punit || 0}</td>
            <td class="px-1 py-1.5 text-aq-text whitespace-nowrap text-xs">${det.fecha || ''}</td>
            <td class="px-1 py-1.5 text-aq-text whitespace-nowrap">
                <span class="px-1.5 py-0.5 rounded text-xs ${det.estado === 'Cerrado' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
                    ${det.estado || 'Abierto'}
                </span>
            </td>
            <td class="px-1 py-1.5 text-center whitespace-nowrap">
                <button type="button" onclick="eliminarDetallePE(${index})" class="text-red-500 hover:text-red-700 text-xs">
                    <i class='bx bx-trash'></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarResumenPE() {
    document.getElementById('resumenOT').textContent = document.getElementById('peOT').value || '-';
    const procesoSelect = document.getElementById('peProceso');
    document.getElementById('resumenProceso').textContent = procesoSelect.options[procesoSelect.selectedIndex]?.text || '-';
    document.getElementById('resumenTotalArt').textContent = detallesPE.length;
    document.getElementById('resumenOT').parentElement.classList.add('flex', 'items-center', 'gap-1');
    document.getElementById('resumenProceso').parentElement.classList.add('flex', 'items-center', 'gap-1');
}

function cambiarTabPE(tab) {
    document.getElementById('contenido-encabezado').classList.add('hidden');
    document.getElementById('contenido-detalle').classList.add('hidden');
    document.getElementById('tab-encabezado').classList.remove('active');
    document.getElementById('tab-detalle').classList.remove('active');

    document.getElementById('contenido-' + tab).classList.remove('hidden');
    document.getElementById('tab-' + tab).classList.add('active');
}

function abrirBusquedaPE() {
    buscarXHRPE('listar_pe', {}, function(data) {
        window.listaBusquedaPE = data.lista || [];
        document.getElementById('modalBusquedaPE').classList.remove('hidden');
        document.getElementById('filtroBusquedaPE').value = '';
        renderizarBusquedaPE(window.listaBusquedaPE);
    });
}

function renderizarBusquedaPE(lista) {
    const tbody = document.getElementById('tablaBusquedaPE');
    tbody.innerHTML = '';
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-3 py-4 text-center text-aq-muted">Sin registros</td></tr>';
        return;
    }
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            document.getElementById('modalBusquedaPE').classList.add('hidden');
            document.getElementById('peNumero').value = item.numero;
            buscarPEInput();
        };
        tr.innerHTML = `
            <td class="px-3 py-2 text-aq-text whitespace-nowrap">${item.numero}</td>
            <td class="px-3 py-2 text-aq-text whitespace-nowrap">${item.fecha || ''}</td>
            <td class="px-3 py-2 text-aq-text whitespace-nowrap">${item.ot || ''}</td>
            <td class="px-3 py-2 text-aq-text whitespace-nowrap">${item.proceso_nombre || ''}</td>
            <td class="px-3 py-2 text-aq-text whitespace-nowrap">${item.estado || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarPE() {
    const filtro = document.getElementById('filtroBusquedaPE').value.toLowerCase();
    const listaFiltrada = window.listaBusquedaPE.filter(item => 
        String(item.numero).toLowerCase().includes(filtro)
    );
    renderizarBusquedaPE(listaFiltrada);
}

function abrirBusquedaOT() {
    buscarXHRPE('listar_ot', {}, function(data) {
        window.listaBusquedaOT = data.ot || [];
        document.getElementById('modalBusquedaOT').classList.remove('hidden');
        document.getElementById('filtroBusquedaOT').value = '';
        renderizarBusquedaOT(window.listaBusquedaOT);
    });
}

function renderizarBusquedaOT(lista) {
    const tbody = document.getElementById('tablaBusquedaOT');
    tbody.innerHTML = '';
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-3 py-4 text-center text-aq-muted">Sin registros</td></tr>';
        return;
    }
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            document.getElementById('modalBusquedaOT').classList.add('hidden');
            document.getElementById('peOT').value = item.numero;
            buscarOTInput();
        };
        tr.innerHTML = `
            <td class="px-3 py-2 text-aq-text whitespace-nowrap">${item.numero}</td>
            <td class="px-3 py-2 text-aq-text whitespace-nowrap">${item.fecha || ''}</td>
            <td class="px-3 py-2 text-aq-text whitespace-nowrap">${item.encargado_nombre || ''}</td>
            <td class="px-3 py-2 text-aq-text whitespace-nowrap">${item.proceso_nombre || ''}</td>
            <td class="px-3 py-2 text-aq-text whitespace-nowrap">${item.estado || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarOT() {
    const filtro = document.getElementById('filtroBusquedaOT').value.toLowerCase();
    const listaFiltrada = window.listaBusquedaOT.filter(item => 
        String(item.numero).toLowerCase().includes(filtro)
    );
    renderizarBusquedaOT(listaFiltrada);
}

function buscarArticuloPEInput() {
    const codigo = document.getElementById('peArtCod').value;
    if (!codigo) return;
    buscarXHRPE('buscar_articulo', {codigo: codigo}, function(data) {
        if (data.success) {
            document.getElementById('peArtNombre').value = data.data.nombre || '';
            document.getElementById('peArtUM').value = data.data.um || '';
            if (!document.getElementById('peArtPUnit').value) {
                document.getElementById('peArtPUnit').value = data.data.precio || 0;
            }
        } else {
            Toastify({text: 'Artículo no encontrado', style: {background: '#f44336'}}).showToast();
            document.getElementById('peArtNombre').value = '';
            document.getElementById('peArtUM').value = '';
        }
    });
}

function limpiarDetallePE() {
    document.getElementById('peArtCod').value = '';
    document.getElementById('peArtNombre').value = '';
    document.getElementById('peArtUM').value = '';
    document.getElementById('peArtCant').value = '';
    document.getElementById('peArtBodega').value = '';
    document.getElementById('peArtPUnit').value = '';
}

function abrirListaArticulosPE() {
    buscarXHRPE('listar_articulos_produccion', {}, function(data) {
        window.listaArticulosPE = data.articulos || [];
        document.getElementById('modalArticulosPE').classList.remove('hidden');
        document.getElementById('filtroArticulosPE').value = '';
        renderizarArticulosPE(window.listaArticulosPE);
    });
}

function renderizarArticulosPE(lista) {
    const tbody = document.getElementById('tablaArticulosPE');
    tbody.innerHTML = '';
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-2 py-4 text-center text-aq-muted text-xs">Sin registros</td></tr>';
        return;
    }
    lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            document.getElementById('peArtCod').value = item.codigo;
            document.getElementById('peArtNombre').value = item.descr || '';
            document.getElementById('peArtUM').value = item.um || '';
            document.getElementById('peArtPUnit').value = item.precio || 0;
            document.getElementById('modalArticulosPE').classList.add('hidden');
        };
        tr.innerHTML = `
            <td class="px-2 py-2 text-aq-text whitespace-nowrap text-xs">${item.codigo}</td>
            <td class="px-2 py-2 text-aq-text whitespace-nowrap text-xs">${item.descr || ''}</td>
            <td class="px-2 py-2 text-aq-text whitespace-nowrap text-xs">${item.tipo || ''}</td>
            <td class="px-2 py-2 text-aq-text whitespace-nowrap text-xs">${item.proceso || ''}</td>
            <td class="px-2 py-2 text-aq-text whitespace-nowrap text-xs">${item.um || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarArticulosPE() {
    const filtro = document.getElementById('filtroArticulosPE').value.toLowerCase();
    const listaFiltrada = window.listaArticulosPE.filter(item =>
        (item.codigo || '').toLowerCase().includes(filtro) ||
        (item.descr || '').toLowerCase().includes(filtro) ||
        (item.tipo || '').toLowerCase().includes(filtro) ||
        (item.proceso || '').toLowerCase().includes(filtro)
    );
    renderizarArticulosPE(listaFiltrada);
}