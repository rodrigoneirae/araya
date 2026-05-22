const urlVC = (document.currentScript?.dataset.url) || '/';

let detallesVC = [];
let modoEdicionVC = false;
let tabulatorSubOTRef = null;
let tabulatorSubVCRef = null;

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

function buscarXHRVC(action, datos, callback) {
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
    fetch(urlVC, {
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
    inicializarTabulatorVC();
    cargarDatosInicialesVC();
});

function inicializarTabulatorVC() {
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

function cargarDatosInicialesVC() {
    buscarXHRVC('listar_encargados', {}, function(data) {
        const select = document.getElementById('vcEncargado');
        if (select && data.encargados) {
            data.encargados.forEach(e => {
                const option = document.createElement('option');
                option.value = e.cod;
                option.textContent = e.nombre;
                select.appendChild(option);
            });
        }
    });

    buscarXHRVC('listar_procesos', {}, function(data) {
        const select = document.getElementById('vcProceso');
        if (select && data.procesos) {
            data.procesos.forEach(p => {
                const option = document.createElement('option');
                option.value = p.cod;
                option.textContent = p.nombre;
                select.appendChild(option);
            });
        }
    });

    buscarXHRVC('listar_bodegas', {}, function(data) {
        const select = document.getElementById('vcArtBodega');
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
    document.getElementById('vcFecha').value = fecha;
    document.getElementById('vcArtFecha').value = fecha;
    nuevoVC();
    setCamposVCEditable(true);
    document.getElementById('btnEditarVC').classList.add('hidden');
    document.getElementById('btnGuardarVC').classList.remove('hidden');

    document.getElementById('vcOT').addEventListener('change', function() {
        buscarOTInput();
    });
}

function nuevoVC() {
    buscarXHRVC('proximo_numero_vc', {}, function(data) {
        const nuevoNumero = data.proximo_numero || '';
        document.getElementById('vcNumero').value = nuevoNumero;
        document.getElementById('vcProceso').value = '';
        document.getElementById('vcEncargado').value = '';

        const fecha = new Date().toISOString().split('T')[0];
        document.getElementById('vcFecha').value = fecha;

        detallesVC = [];
        renderizarDetallesVC();
        actualizarResumenVC();

        renderizarSubOTRef([]);
        renderizarSubVCRef([]);

        modoEdicionVC = false;
        document.getElementById('btnGuardarVC').classList.remove('hidden');
        document.getElementById('btnEditarVC').classList.add('hidden');
        document.getElementById('btnEliminarVC').classList.add('hidden');

        setCamposVCEditable(true);
        cambiarTabVC('encabezado');

        if (nuevoNumero) {
            buscarXHRVC('buscar_ot', {numero: nuevoNumero}, function(dataOT) {
                if (dataOT.success) {
                    document.getElementById('vcOT').value = nuevoNumero;

                    const procesoValue = dataOT.data.proceso ? String(dataOT.data.proceso).split('.')[0] : '';
                    const encargadoValue = dataOT.data.encargado ? String(dataOT.data.encargado).split('.')[0] : '';
                    document.getElementById('vcProceso').value = procesoValue;
                    document.getElementById('vcEncargado').value = encargadoValue;

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

function guardarVC() {
    const numero = document.getElementById('vcNumero').value;
    const ot = document.getElementById('vcOT').value;
    const fecha = document.getElementById('vcFecha').value;
    const proceso = document.getElementById('vcProceso').value;
    const encargado = document.getElementById('vcEncargado').value;

    if (!numero) {
        Toastify({text: 'Número de VC requerido', style: {background: '#f44336'}}).showToast();
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
        detalles: JSON.stringify(detallesVC)
    };

    buscarXHRVC('nuevo_vc', datos, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            modoEdicionVC = true;
            document.getElementById('btnEditarVC').classList.remove('hidden');
            document.getElementById('btnEliminarVC').classList.remove('hidden');
            document.getElementById('btnGuardarVC').classList.add('hidden');
        } else {
            Toastify({text: data.message || 'Error al guardar', style: {background: '#f44336'}}).showToast();
        }
    });
}

function editarVC() {
    setCamposVCEditable(true);
    document.getElementById('btnGuardarVC').classList.remove('hidden');
    document.getElementById('btnEditarVC').classList.add('hidden');
    modoEdicionVC = false;
}

function eliminarVC() {
    const numero = document.getElementById('vcNumero').value;
    if (!numero) return;

    mostrarModalConfirm({titulo: 'Eliminar VC', mensaje: '¿Está seguro de eliminar el Vale de Consumo actual?', onConfirm: function() {
            buscarXHRVC('eliminar_vc', {numero: numero}, function(data) {
                if (data.success) {
                    Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                    nuevoVC();
                } else {
                    Toastify({text: data.message || 'Error al eliminar', style: {background: '#f44336'}}).showToast();
                }
            });
        }});
}

function setCamposVCEditable(editable) {
    const campos = ['vcNumero', 'vcFecha', 'vcOT', 'vcProceso', 'vcEncargado'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !editable;
    });
}

function buscarVCInput() {
    const numero = document.getElementById('vcNumero').value;
    if (!numero) return;
    buscarXHRVC('buscar_vc', {numero: numero}, function(data) {
        if (data.success) {
            cargarVC(data.data);
        } else {
            Toastify({text: data.message || 'VC no encontrado', style: {background: '#f44336'}}).showToast();
        }
    });
}

function cargarVC(data) {
    document.getElementById('vcNumero').value = data.numero || '';
    document.getElementById('vcFecha').value = data.fecha || '';
    document.getElementById('vcOT').value = data.ot || '';
    document.getElementById('vcProceso').value = data.proceso || '';
    document.getElementById('vcEncargado').value = data.codencargado || '';

    detallesVC = [];
    if (data.detalles) {
        data.detalles.forEach(d => {
            detallesVC.push({
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

    renderizarDetallesVC();
    actualizarResumenVC();

    modoEdicionVC = true;
    document.getElementById('btnGuardarVC').classList.add('hidden');
    document.getElementById('btnEditarVC').classList.remove('hidden');
    document.getElementById('btnEliminarVC').classList.remove('hidden');

    setCamposVCEditable(true);

    if (data.ot) {
        buscarXHRVC('buscar_ot', {numero: data.ot}, function(dataOT) {
            cargarSubOTRef(data.ot);
            cargarSubVCRef(data.ot);

            if (dataOT.success && dataOT.data.estado === 'Cerrado') {
                document.getElementById('tab-detalle').classList.add('pointer-events-none', 'opacity-50');
            } else {
                document.getElementById('tab-detalle').classList.remove('pointer-events-none', 'opacity-50');
            }
        });
    }

    cambiarTabVC('encabezado');
}

function sincronizarVCconOT() {
    const ot = document.getElementById('vcOT').value;
    if (ot) {
        document.getElementById('vcNumero').value = ot;
    }
}

function buscarOTInput() {
    const ot = document.getElementById('vcOT').value;
    if (!ot) return;

    document.getElementById('vcNumero').value = ot;
    document.getElementById('vcProceso').value = '';
    document.getElementById('vcEncargado').value = '';

    buscarXHRVC('buscar_vc', {numero: ot}, function(dataVC) {
        if (dataVC.success) {
            cargarVC(dataVC.data);
            cargarSubOTRef(ot);
            cargarSubVCRef(ot);
        } else {
            buscarXHRVC('buscar_ot', {numero: ot}, function(data) {
                if (data.success) {
                    const procesoValue = data.data.proceso ? String(data.data.proceso).split('.')[0] : '';
                    const encargadoValue = data.data.encargado ? String(data.data.encargado).split('.')[0] : '';
                    document.getElementById('vcProceso').value = procesoValue;
                    document.getElementById('vcEncargado').value = encargadoValue;

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
    buscarXHRVC('listar_subot_ref', {ot: ot}, function(data) {
        renderizarSubOTRef(data.subot || []);
    });
}

function cargarSubVCRef(ot) {
    buscarXHRVC('listar_subvc_ref', {ot: ot}, function(data) {
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

function agregarDetalleVC() {
    const codigo = document.getElementById('vcArtCod').value;
    const nombre = document.getElementById('vcArtNombre')?.value || '';
    const cantidad = parseFloat(document.getElementById('vcArtCant').value) || 0;
    const bodega = document.getElementById('vcArtBodega').value;
    const um = document.getElementById('vcArtUM').value;
    const punit = parseFloat(document.getElementById('vcArtPUnit').value) || 0;
    const fecha = document.getElementById('vcArtFecha').value || new Date().toISOString().split('T')[0];

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

    detallesVC.push({
        fecha: fecha,
        codigo: codigo,
        nombre: nombre,
        cantidad: cantidad,
        bodega: bodega,
        um: um,
        punit: punit,
        estado: estado
    });

    document.getElementById('vcArtCod').value = '';
    if (document.getElementById('vcArtNombre')) document.getElementById('vcArtNombre').value = '';
    document.getElementById('vcArtUM').value = '';
    document.getElementById('vcArtCant').value = '';
    document.getElementById('vcArtBodega').value = '';
    document.getElementById('vcArtPUnit').value = '';
    document.getElementById('vcArtCod').focus();

    renderizarDetallesVC();
    actualizarResumenVC();
}

function eliminarDetalleVC(index) {
    detallesVC.splice(index, 1);
    renderizarDetallesVC();
    actualizarResumenVC();
}

function renderizarDetallesVC() {
    const tbody = document.getElementById('vcDetalle');
    tbody.innerHTML = '';

    detallesVC.forEach((det, index) => {
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
                <button type="button" onclick="eliminarDetalleVC(${index})" class="text-red-500 hover:text-red-700 text-xs">
                    <i class='bx bx-trash'></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarResumenVC() {
    document.getElementById('resumenOT').textContent = document.getElementById('vcOT').value || '-';
    const procesoSelect = document.getElementById('vcProceso');
    document.getElementById('resumenProceso').textContent = procesoSelect.options[procesoSelect.selectedIndex]?.text || '-';
    document.getElementById('resumenTotalArt').textContent = detallesVC.length;
    document.getElementById('resumenOT').parentElement.classList.add('flex', 'items-center', 'gap-1');
    document.getElementById('resumenProceso').parentElement.classList.add('flex', 'items-center', 'gap-1');
}

function cambiarTabVC(tab) {
    document.getElementById('contenido-encabezado').classList.add('hidden');
    document.getElementById('contenido-detalle').classList.add('hidden');
    document.getElementById('tab-encabezado').classList.remove('active');
    document.getElementById('tab-detalle').classList.remove('active');

    document.getElementById('contenido-' + tab).classList.remove('hidden');
    document.getElementById('tab-' + tab).classList.add('active');
}

function abrirBusquedaVC() {
    buscarXHRVC('listar_vc', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Buscar VC',
            columnas: [
                { title: 'VC', field: 'numero', width: 100 },
                { title: 'Fecha', field: 'fecha', width: 100 },
                { title: 'OT', field: 'ot', width: 100 },
                { title: 'Proceso', field: 'proceso_nombre', width: 150 },
                { title: 'Estado', field: 'estado', width: 80 }
            ],
            data: data.lista || [],
            filtroCampos: ['numero'],
            onSelect: function(row) {
                document.getElementById('vcNumero').value = row.numero;
                buscarVCInput();
            }
        });
    });
}

function abrirBusquedaOT() {
    buscarXHRVC('listar_ot', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Buscar Orden de Trabajo (OT)',
            columnas: [
                { title: 'OT', field: 'numero', width: 100 },
                { title: 'Fecha', field: 'fecha', width: 100 },
                { title: 'Encargado', field: 'encargado_nombre', width: 150 },
                { title: 'Proceso', field: 'proceso_nombre', width: 150 },
                { title: 'Estado', field: 'estado', width: 80 }
            ],
            data: data.ot || [],
            filtroCampos: ['numero'],
            onSelect: function(row) {
                document.getElementById('vcOT').value = row.numero;
                buscarOTInput();
            }
        });
    });
}

function buscarArticuloVCInput() {
    const codigo = document.getElementById('vcArtCod').value;
    if (!codigo) return;
    buscarXHRVC('buscar_articulo', {codigo: codigo}, function(data) {
        if (data.success) {
            if (document.getElementById('vcArtNombre')) {
                document.getElementById('vcArtNombre').value = data.data.nombre || '';
            }
            document.getElementById('vcArtUM').value = data.data.um || '';
            if (!document.getElementById('vcArtPUnit').value) {
                document.getElementById('vcArtPUnit').value = data.data.precio || 0;
            }
        } else {
            Toastify({text: 'Artículo no encontrado', style: {background: '#f44336'}}).showToast();
            if (document.getElementById('vcArtNombre')) {
                document.getElementById('vcArtNombre').value = '';
            }
            document.getElementById('vcArtUM').value = '';
        }
    });
}

function limpiarDetalleVC() {
    document.getElementById('vcArtCod').value = '';
    if (document.getElementById('vcArtNombre')) {
        document.getElementById('vcArtNombre').value = '';
    }
    document.getElementById('vcArtUM').value = '';
    document.getElementById('vcArtCant').value = '';
    document.getElementById('vcArtBodega').value = '';
    document.getElementById('vcArtPUnit').value = '';
}

function abrirListaArticulosVC() {
    buscarXHRVC('listar_articulos_produccion', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Seleccionar Artículo',
            columnas: [
                { title: 'Código', field: 'codigo', width: 100 },
                { title: 'Descripción', field: 'descr', width: 200 },
                { title: 'Tipo', field: 'tipo', width: 80 },
                { title: 'Proceso', field: 'proceso', width: 120 },
                { title: 'UM', field: 'um', width: 60 }
            ],
            data: data.articulos || [],
            filtroCampos: ['codigo', 'descr', 'tipo', 'proceso'],
            onSelect: function(row) {
                document.getElementById('vcArtCod').value = row.codigo;
                if (document.getElementById('vcArtNombre')) {
                    document.getElementById('vcArtNombre').value = row.descr || '';
                }
                document.getElementById('vcArtUM').value = row.um || '';
                document.getElementById('vcArtPUnit').value = row.precio || 0;
            }
        });
    });
}