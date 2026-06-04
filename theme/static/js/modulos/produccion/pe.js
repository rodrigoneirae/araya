const urlPE = (document.currentScript?.dataset.url) || '/';

let detallesPE = [];
let modoEdicionPE = false;
let tabulatorSubOTRef = null;
let tabulatorSubVCRef = null;

function formatNumberCL(num) {
    if (num === null || num === undefined || num === '') return '-';
    const n = parseFloat(num);
    if (isNaN(n)) return '-';
    return n.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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
    document.getElementById('btnGuardarPE').classList.remove('hidden');

    document.getElementById('peOT').addEventListener('change', function() {
        buscarOTInput();
    });
}

function nuevoPE() {
    buscarXHRPE('proximo_numero', {}, function(data) {
        const nuevoNumero = data.proximo_numero || '';
        document.getElementById('peNumero').value = nuevoNumero;
        document.getElementById('peOT').value = '';
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
        document.getElementById('btnEliminarPE').classList.add('hidden');

        setCamposPEEditable(true);
        cambiarTabPE('encabezado');
        document.getElementById('tab-detalle').classList.remove('pointer-events-none', 'opacity-50');
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
            document.getElementById('btnEliminarPE').classList.remove('hidden');
            document.getElementById('btnGuardarPE').classList.add('hidden');

            const btnEditar = document.getElementById('btnEditarPE');
            if (btnEditar) {
                btnEditar.classList.remove('hidden');
            }
        } else {
            Toastify({text: data.message || 'Error al guardar', style: {background: '#f44336'}}).showToast();
        }
    });
}

function editarPE() {
    const estado = document.getElementById('peEstado') ? document.getElementById('peEstado').value : '';
    if (estado === 'Cerrado') {
        Toastify({text: 'Documento cerrado. Imposible realizar cambios.', style: {background: '#f44336'}}).showToast();
        return;
    }
    modoEdicionPE = true;
    setCamposPEEditable(true);
    document.getElementById('btnGuardarPE').classList.remove('hidden');
    document.getElementById('btnEliminarPE').classList.add('hidden');
    document.getElementById('btnEditarPE').classList.add('hidden');
    renderizarDetallesPE();
}

function eliminarPE() {
    const numero = document.getElementById('peNumero').value;
    if (!numero) return;

    mostrarModalConfirm({titulo: 'Eliminar PE', mensaje: '¿Está seguro de eliminar el Parte de Entrada actual?', onConfirm: function() {
            buscarXHRPE('eliminar', {numero: numero}, function(data) {
                if (data.success) {
                    Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                    nuevoPE();
                } else {
                    Toastify({text: data.message || 'Error al eliminar', style: {background: '#f44336'}}).showToast();
                }
            });
        }});
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
    document.getElementById('peEstado').value = data.estado || '';

    const procesoStr = data.proceso ? String(data.proceso).split('.')[0] : '';
    const encargadoStr = data.codencargado ? String(data.codencargado).split('.')[0] : '';

    const procesoSelect = document.getElementById('peProceso');
    procesoSelect.value = procesoStr;
    if (jQuery && jQuery(procesoSelect).data('select2')) {
        jQuery(procesoSelect).trigger('change');
    }

    const encargadoSelect = document.getElementById('peEncargado');
    encargadoSelect.value = encargadoStr;
    if (jQuery && jQuery(encargadoSelect).data('select2')) {
        jQuery(encargadoSelect).trigger('change');
    }

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
                estado: d.estado || 'Abierto',
                codencargado: d.codencargado || ''
            });
        });
    }

    renderizarDetallesPE();
    actualizarResumenPE();

    modoEdicionPE = false;
    document.getElementById('btnGuardarPE').classList.add('hidden');

    const btnEditar = document.getElementById('btnEditarPE');
    if (btnEditar) {
        if (data.estado === 'Cerrado') {
            btnEditar.classList.add('hidden');
        } else {
            btnEditar.classList.remove('hidden');
        }
    }

    document.getElementById('btnEliminarPE').classList.remove('hidden');

    setCamposPEEditable(false);

    document.getElementById('tab-detalle').classList.remove('hidden');
    document.getElementById('tab-detalle').classList.remove('pointer-events-none', 'opacity-50');
    cambiarTabPE('encabezado');

    if (data.ot) {
        buscarXHRPE('buscar_ot', {numero: data.ot}, function(dataOT) {
            cargarSubOTRef(data.ot);
            cargarSubVCRef(data.ot);

            if (dataOT.success && dataOT.data.estado === 'Cerrado') {
                document.getElementById('tab-detalle').classList.add('pointer-events-none', 'opacity-50');
            }
        });
    } else {
        renderizarSubOTRef([]);
        renderizarSubVCRef([]);
    }
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
        estado: estado,
        codencargado: document.getElementById('peEncargado').value || ''
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

    if (detallesPE.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="px-3 py-4 text-center text-aq-text text-xs">Sin artículos agregados</td></tr>';
        return;
    }

    detallesPE.forEach((det, index) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2';
        tr.dataset.index = index;

        const isEditing = det._editing === true;

        if (isEditing) {
            const optionsEncargado = document.getElementById('peEncargado').options;
            let optionsHtml = '';
            for (let i = 0; i < optionsEncargado.length; i++) {
                const opt = optionsEncargado[i];
                const selected = det.codencargado && String(det.codencargado) === String(opt.value) ? 'selected' : '';
                optionsHtml += `<option value="${opt.value}" ${selected}>${opt.text}</option>`;
            }

            tr.innerHTML = `
                <td class="px-1 py-1 text-xs">
                    <input type="text" id="edit-codigo-${index}" value="${det.codigo || ''}" class="w-full px-1 py-1 border border-aq-border bg-aq-bg text-aq-text text-xs" readonly>
                </td>
                <td class="px-1 py-1 text-xs">
                    <select id="edit-bodega-${index}" class="w-full px-1 py-1 border border-aq-border bg-aq-bg text-aq-text text-xs">
                        ${document.getElementById('peArtBodega').innerHTML}
                    </select>
                </td>
                <td class="px-1 py-1 text-xs">
                    <input type="number" id="edit-cantidad-${index}" value="${det.cantidad || ''}" class="w-full px-1 py-1 border border-aq-border bg-aq-bg text-aq-text text-xs text-right" step="any">
                </td>
                <td class="px-1 py-1 text-xs">
                    <input type="text" id="edit-um-${index}" value="${det.um || ''}" class="w-full px-1 py-1 border border-aq-border bg-aq-bg text-aq-text text-xs" readonly>
                </td>
                <td class="px-1 py-1 text-xs">${det.nombre || ''}</td>
                <td class="px-1 py-1 text-xs">
                    <input type="number" id="edit-punit-${index}" value="${det.punit || ''}" class="w-full px-1 py-1 border border-aq-border bg-aq-bg text-aq-text text-xs text-right" step="any">
                </td>
                <td class="px-1 py-1 text-xs">
                    <input type="date" id="edit-fecha-${index}" value="${det.fecha || ''}" class="w-full px-1 py-1 border border-aq-border bg-aq-bg text-aq-text text-xs">
                </td>
                <td class="px-1 py-1 text-xs">
                    <select id="edit-encargado-${index}" class="edit-encargado-select w-full px-1 py-1 border border-aq-border bg-aq-bg text-aq-text text-xs">
                        ${optionsHtml}
                    </select>
                </td>
                <td class="px-1 py-1 text-xs">
                    <span class="px-1.5 py-0.5 rounded text-xs ${det.estado === 'Cerrado' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
                        ${det.estado || 'Abierto'}
                    </span>
                </td>
                <td class="px-1 py-1 text-center whitespace-nowrap">
                    <button type="button" onclick="guardarEditDetallePE(${index})" class="text-green-500 hover:text-green-700 text-xs mr-1" title="Guardar">
                        <i class='bx bx-check'></i>
                    </button>
                    <button type="button" onclick="cancelarEditDetallePE(${index})" class="text-gray-500 hover:text-gray-700 text-xs" title="Cancelar">
                        <i class='bx bx-x'></i>
                    </button>
                </td>
            `;
            const bodegaSelect = tr.querySelector(`#edit-bodega-${index}`);
            if (bodegaSelect && det.bodega) {
                bodegaSelect.value = det.bodega;
            }
            const encargadoSelect = tr.querySelector(`#edit-encargado-${index}`);
            if (encargadoSelect && typeof jQuery !== 'undefined') {
                jQuery(encargadoSelect).select2({ width: '100%', language: 'es' });
                if (det.codencargado) {
                    jQuery(encargadoSelect).val(String(det.codencargado)).trigger('change');
                }
            }
        } else {
            let nombreEncargado = '';
            const selectEncargado = document.getElementById('peEncargado');
            if (selectEncargado && selectEncargado.options.length > 0 && det.codencargado) {
                for (let i = 0; i < selectEncargado.options.length; i++) {
                    const optVal = selectEncargado.options[i].value;
                    const detVal = String(det.codencargado);
                    if (optVal === detVal) {
                        nombreEncargado = selectEncargado.options[i].text;
                        break;
                    }
                }
            }
            if (!nombreEncargado && det.codencargado) {
                nombreEncargado = '(Encargado ' + det.codencargado + ')';
            }
            tr.innerHTML = `
                <td class="px-1 py-1.5 text-aq-text whitespace-nowrap text-xs">${det.codigo || ''}</td>
                <td class="px-1 py-1.5 text-aq-text whitespace-nowrap text-xs">${det.bodega || ''}</td>
                <td class="px-1 py-1.5 text-aq-text text-right whitespace-nowrap text-xs">${formatNumberCL(det.cantidad)}</td>
                <td class="px-1 py-1.5 text-aq-text whitespace-nowrap text-xs">${det.um || ''}</td>
                <td class="px-1 py-1.5 text-aq-text whitespace-nowrap text-xs">${det.nombre || ''}</td>
                <td class="px-1 py-1.5 text-aq-text text-right whitespace-nowrap text-xs">${formatNumberCL(det.punit)}</td>
                <td class="px-1 py-1.5 text-aq-text whitespace-nowrap text-xs">${det.fecha || ''}</td>
                <td class="px-1 py-1.5 text-aq-text whitespace-nowrap text-xs">${nombreEncargado || '-'}</td>
                <td class="px-1 py-1.5 text-aq-text whitespace-nowrap">
                    <span class="px-1.5 py-0.5 rounded text-xs ${det.estado === 'Cerrado' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
                        ${det.estado || 'Abierto'}
                    </span>
                </td>
                <td class="px-1 py-1.5 text-aq-text whitespace-nowrap">
                    ${isEditing ? '<button type="button" onclick="guardarEditDetallePE(' + index + ')" class="text-green-500 hover:text-green-700 text-xs mr-1" title="Guardar"><i class="bx bx-check"></i></button><button type="button" onclick="cancelarEditDetallePE(' + index + ')" class="text-gray-500 hover:text-gray-700 text-xs" title="Cancelar"><i class="bx bx-x"></i></button>' : (modoEdicionPE ? '<button type="button" onclick="editarDetallePE(' + index + ')" class="text-blue-500 hover:text-blue-700 text-xs mr-1" title="Editar"><i class="bx bx-edit"></i></button><button type="button" onclick="eliminarDetallePE(' + index + ')" class="text-red-500 hover:text-red-700 text-xs" title="Eliminar"><i class="bx bx-trash"></i></button>' : '<span class="text-aq-muted text-xs">-</span>')}
                </td>
            `;
        }
        tbody.appendChild(tr);
    });
}

function editarDetallePE(index) {
    detallesPE[index]._editing = true;
    renderizarDetallesPE();
}

function guardarEditDetallePE(index) {
    const det = detallesPE[index];
    det.bodega = document.getElementById(`edit-bodega-${index}`).value;
    det.cantidad = parseFloat(document.getElementById(`edit-cantidad-${index}`).value) || 0;
    det.punit = parseFloat(document.getElementById(`edit-punit-${index}`).value) || 0;
    det.fecha = document.getElementById(`edit-fecha-${index}`).value;
    const encargadoSelect = document.getElementById(`edit-encargado-${index}`);
    if (encargadoSelect) {
        det.codencargado = encargadoSelect.value;
    }
    delete det._editing;
    renderizarDetallesPE();
    actualizarResumenPE();
}

function cancelarEditDetallePE(index) {
    delete detallesPE[index]._editing;
    renderizarDetallesPE();
}

function actualizarResumenPE() {
    document.getElementById('resumenOT').textContent = document.getElementById('peOT').value || '-';
    const procesoSelect = document.getElementById('peProceso');
    document.getElementById('resumenProceso').textContent = procesoSelect.options[procesoSelect.selectedIndex]?.text || '-';
    document.getElementById('resumenTotalArt').textContent = detallesPE.length;

    let totalCantidad = 0;
    detallesPE.forEach(d => {
        totalCantidad += d.cantidad || 0;
    });
    document.getElementById('resumenTotalCant').textContent = formatNumberCL(totalCantidad);

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
        abrirModalBusqueda({
            titulo: 'Buscar PE',
            columnas: [
                { title: 'PE', field: 'numero', width: 100 },
                { title: 'Fecha', field: 'fecha', width: 100 },
                { title: 'OT', field: 'ot', width: 100 },
                { title: 'Encargado', field: 'encargado_nombre', width: 150 },
                { title: 'Proceso', field: 'proceso_nombre', width: 150 },
                { title: 'Estado', field: 'estado', width: 80 }
            ],
            data: data.lista || [],
            filtroCampos: ['numero'],
            onSelect: function(row) {
                document.getElementById('peNumero').value = row.numero;
                buscarPEInput();
            }
        });
    });
}

function abrirBusquedaOT() {
    buscarXHRPE('listar_ot', {}, function(data) {
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
                document.getElementById('peOT').value = row.numero;
                buscarOTInput();
            }
        });
    });
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
                document.getElementById('peArtCod').value = row.codigo;
                document.getElementById('peArtNombre').value = row.descr || '';
                document.getElementById('peArtUM').value = row.um || '';
                document.getElementById('peArtPUnit').value = row.precio || 0;
            }
        });
    });
}