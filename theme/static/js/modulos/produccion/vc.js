const urlVC = (document.currentScript?.dataset.url) || '/';

let detallesVC = [];
let modoEdicionVC = false;
let tabulatorSubOTRef = null;
let tabulatorSubPERef = null;
let tabulatorMovArticulo = null;

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

    tabulatorSubPERef = new Tabulator("#tabulatorSubPERef", {
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

    tabulatorMovArticulo = new Tabulator("#tabulatorMovArticulo", {
        layout: "fitColumns",
        headerSort: false,
        minHeight: "120px",
        columns: [
            { title: "Fecha", field: "fecha", minWidth: 80 },
            { title: "Número", field: "numero", minWidth: 60 },
            { title: "Tipo", field: "tipo", minWidth: 100 },
            { title: "Cant", field: "cantidad", minWidth: 60, hozAlign: "right" },
            { title: "Bodega", field: "bodega", minWidth: 60 },
            { title: "Encargado", field: "encargado", minWidth: 120 },
            { title: "Saldo", field: "saldo", minWidth: 70, hozAlign: "right" },
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
        document.getElementById('vcOT').value = '';
        document.getElementById('vcProceso').value = '';
        document.getElementById('vcEncargado').value = '';

        const fecha = new Date().toISOString().split('T')[0];
        document.getElementById('vcFecha').value = fecha;

        detallesVC = [];
        renderizarDetallesVC();
        actualizarResumenVC();

        renderizarSubOTRef([]);
        renderizarSubPERef([]);
        if (tabulatorMovArticulo) {
            tabulatorMovArticulo.setData([]);
        }
        document.getElementById('saldoFinalMov').textContent = '-';

        modoEdicionVC = false;
        document.getElementById('btnGuardarVC').classList.remove('hidden');
        document.getElementById('btnEditarVC').classList.add('hidden');
        document.getElementById('btnEliminarVC').classList.add('hidden');

        setCamposVCEditable(true);
        cambiarTabVC('encabezado');
        document.getElementById('tab-detalle').classList.add('pointer-events-none', 'opacity-50');
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
    const estado = document.getElementById('vcEstado') ? document.getElementById('vcEstado').value : '';
    if (estado === 'Cerrado') {
        Toastify({text: 'Documento cerrado. Imposible realizar cambios.', style: {background: '#f44336'}}).showToast();
        return;
    }
    modoEdicionVC = true;
    setCamposVCEditable(true);
    document.getElementById('btnGuardarVC').classList.remove('hidden');
    document.getElementById('btnEliminarVC').classList.add('hidden');
    document.getElementById('btnEditarVC').classList.add('hidden');
    renderizarDetallesVC();
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
    document.getElementById('vcEstado').value = data.estado || '';

    const procesoStr = data.proceso ? String(data.proceso).split('.')[0] : '';
    const encargadoStr = data.codencargado ? String(data.codencargado).split('.')[0] : '';

    const procesoSelect = document.getElementById('vcProceso');
    procesoSelect.value = procesoStr;
    if (jQuery && jQuery(procesoSelect).data('select2')) {
        jQuery(procesoSelect).trigger('change');
    }

    const encargadoSelect = document.getElementById('vcEncargado');
    encargadoSelect.value = encargadoStr;
    if (jQuery && jQuery(encargadoSelect).data('select2')) {
        jQuery(encargadoSelect).trigger('change');
    }

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
                estado: d.estado || 'Abierto',
                codencargado: d.codencargado || ''
            });
        });
    }

    renderizarDetallesVC();
    actualizarResumenVC();

    modoEdicionVC = false;
    document.getElementById('btnGuardarVC').classList.add('hidden');

    const btnEditar = document.getElementById('btnEditarVC');
    if (btnEditar) {
        if (data.estado === 'Cerrado') {
            btnEditar.classList.add('hidden');
        } else {
            btnEditar.classList.remove('hidden');
        }
    }

    document.getElementById('btnEliminarVC').classList.remove('hidden');

    setCamposVCEditable(false);

    document.getElementById('tab-detalle').classList.remove('hidden');
    document.getElementById('tab-detalle').classList.remove('pointer-events-none', 'opacity-50');
    cambiarTabVC('encabezado');

    if (data.ot) {
        buscarXHRVC('buscar_ot', {numero: data.ot}, function(dataOT) {
            if (dataOT.success) {
                if (!data.proceso || data.proceso === '') {
                    const procesoValue = dataOT.data.proceso ? String(dataOT.data.proceso).split('.')[0] : '';
                    const procesoSelect = document.getElementById('vcProceso');
                    if (jQuery && jQuery(procesoSelect).data('select2')) {
                        jQuery(procesoSelect).val(procesoValue).trigger('change');
                    } else {
                        procesoSelect.value = procesoValue;
                    }
                }
                if (!data.codencargado || data.codencargado === '') {
                    const encargadoValue = dataOT.data.codencargado ? String(dataOT.data.codencargado).split('.')[0] : '';
                    const encargadoSelect = document.getElementById('vcEncargado');
                    if (jQuery && jQuery(encargadoSelect).data('select2')) {
                        jQuery(encargadoSelect).val(encargadoValue).trigger('change');
                    } else {
                        encargadoSelect.value = encargadoValue;
                    }
                }
            }

            cargarSubOTRef(data.ot);
            cargarSubPERef(data.ot);

            if (dataOT.success && dataOT.data.estado === 'Cerrado') {
                document.getElementById('tab-detalle').classList.add('pointer-events-none', 'opacity-50');
            } else {
                document.getElementById('tab-detalle').classList.remove('pointer-events-none', 'opacity-50');
            }
        });
    } else {
        renderizarSubOTRef([]);
        renderizarSubPERef([]);
        if (tabulatorMovArticulo) {
            tabulatorMovArticulo.setData([]);
        }
        document.getElementById('saldoFinalMov').textContent = '-';
    }
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
            cargarSubPERef(ot);
        } else {
            buscarXHRVC('buscar_ot', {numero: ot}, function(data) {
                if (data.success) {
                    const procesoValue = data.data.proceso ? String(data.data.proceso).split('.')[0] : '';
                    const encargadoValue = data.data.codencargado ? String(data.data.codencargado).split('.')[0] : '';

                    const procesoSelect = document.getElementById('vcProceso');
                    procesoSelect.value = procesoValue;
                    if (jQuery && jQuery(procesoSelect).data('select2')) {
                        jQuery(procesoSelect).trigger('change');
                    }

                    const encargadoSelect = document.getElementById('vcEncargado');
                    encargadoSelect.value = encargadoValue;
                    if (jQuery && jQuery(encargadoSelect).data('select2')) {
                        jQuery(encargadoSelect).trigger('change');
                    }

                    cargarSubOTRef(ot);
                    cargarSubPERef(ot);

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

function cargarSubPERef(ot) {
    buscarXHRVC('listar_subpe_ref', {ot: ot}, function(data) {
        renderizarSubPERef(data.subpe || []);
    });
}

function renderizarSubPERef(lista) {
    if (tabulatorSubPERef) {
        tabulatorSubPERef.setData(lista || []);
    }
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
        estado: estado,
        codencargado: document.getElementById('vcEncargado').value || ''
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

function editarDetalleVC(index) {
    detallesVC[index]._editing = true;
    renderizarDetallesVC();
}

function guardarEditDetalleVC(index) {
    const det = detallesVC[index];
    det.bodega = document.getElementById(`edit-bodega-${index}`).value;
    det.cantidad = parseFloat(document.getElementById(`edit-cantidad-${index}`).value) || 0;
    det.punit = parseFloat(document.getElementById(`edit-punit-${index}`).value) || 0;
    det.fecha = document.getElementById(`edit-fecha-${index}`).value;
    const encargadoSelect = document.getElementById(`edit-encargado-${index}`);
    if (encargadoSelect) {
        det.codencargado = encargadoSelect.value;
    }
    delete det._editing;
    renderizarDetallesVC();
    actualizarResumenVC();
}

function cancelarEditDetalleVC(index) {
    delete detallesVC[index]._editing;
    renderizarDetallesVC();
}

function renderizarDetallesVC() {
    const tbody = document.getElementById('vcDetalle');
    tbody.innerHTML = '';

    if (detallesVC.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="px-3 py-4 text-center text-aq-text text-xs">Sin artículos agregados</td></tr>';
        return;
    }

    detallesVC.forEach((det, index) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2';
        tr.dataset.index = index;

        const isEditing = det._editing === true;

        if (isEditing) {
            const optionsEncargado = document.getElementById('vcEncargado').options;
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
                        ${document.getElementById('vcArtBodega').innerHTML}
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
                    <button type="button" onclick="guardarEditDetalleVC(${index})" class="text-green-500 hover:text-green-700 text-xs mr-1" title="Guardar">
                        <i class='bx bx-check'></i>
                    </button>
                    <button type="button" onclick="cancelarEditDetalleVC(${index})" class="text-gray-500 hover:text-gray-700 text-xs" title="Cancelar">
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
            const selectEncargado = document.getElementById('vcEncargado');
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
                    ${isEditing ? '<button type="button" onclick="guardarEditDetalleVC(' + index + ')" class="text-green-500 hover:text-green-700 text-xs mr-1" title="Guardar"><i class="bx bx-check"></i></button><button type="button" onclick="cancelarEditDetalleVC(' + index + ')" class="text-gray-500 hover:text-gray-700 text-xs" title="Cancelar"><i class="bx bx-x"></i></button>' : (modoEdicionVC ? '<button type="button" onclick="editarDetalleVC(' + index + ')" class="text-blue-500 hover:text-blue-700 text-xs mr-1" title="Editar"><i class="bx bx-edit"></i></button><button type="button" onclick="eliminarDetalleVC(' + index + ')" class="text-red-500 hover:text-red-700 text-xs" title="Eliminar"><i class="bx bx-trash"></i></button>' : '<span class="text-aq-muted text-xs">-</span>')}
                </td>
            `;
        }
        tbody.appendChild(tr);
    });
}

function actualizarResumenVC() {
    document.getElementById('resumenOT').textContent = document.getElementById('vcOT').value || '-';
    const procesoSelect = document.getElementById('vcProceso');
    document.getElementById('resumenProceso').textContent = procesoSelect.options[procesoSelect.selectedIndex]?.text || '-';
    document.getElementById('resumenTotalArt').textContent = detallesVC.length;

    let totalCantidad = 0;
    detallesVC.forEach(d => {
        totalCantidad += d.cantidad || 0;
    });
    document.getElementById('resumenTotalCant').textContent = formatNumberCL(totalCantidad);

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
    if (!codigo) {
        if (tabulatorMovArticulo) {
            tabulatorMovArticulo.setData([]);
        }
        document.getElementById('saldoFinalMov').textContent = '-';
        return;
    }
    buscarXHRVC('buscar_articulo', {codigo: codigo}, function(data) {
        if (data.success) {
            if (document.getElementById('vcArtNombre')) {
                document.getElementById('vcArtNombre').value = data.data.nombre || '';
            }
            document.getElementById('vcArtUM').value = data.data.um || '';
            if (!document.getElementById('vcArtPUnit').value) {
                document.getElementById('vcArtPUnit').value = data.data.precio || 0;
            }
            cargarHistorialArticulo(codigo);
        } else {
            Toastify({text: 'Artículo no encontrado', style: {background: '#f44336'}}).showToast();
            if (document.getElementById('vcArtNombre')) {
                document.getElementById('vcArtNombre').value = '';
            }
            document.getElementById('vcArtUM').value = '';
            if (tabulatorMovArticulo) {
                tabulatorMovArticulo.setData([]);
            }
            document.getElementById('saldoFinalMov').textContent = '-';
        }
    });
}

function cargarHistorialArticulo(codigo) {
    buscarXHRVC('historial_articulo', {codigo: codigo}, function(data) {
        if (data.success) {
            if (tabulatorMovArticulo) {
                tabulatorMovArticulo.setData(data.historial || []);
            }
            document.getElementById('saldoFinalMov').textContent = formatNumberCL(data.suma_saldo);
        } else {
            if (tabulatorMovArticulo) {
                tabulatorMovArticulo.setData([]);
            }
            document.getElementById('saldoFinalMov').textContent = '-';
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
                cargarHistorialArticulo(row.codigo);
            }
        });
    });
}