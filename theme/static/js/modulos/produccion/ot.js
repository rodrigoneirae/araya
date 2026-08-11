const urlOt = (document.currentScript?.dataset.url) || '/';

let detallesOt = [];
let modoEdicionOt = false;
let tabSubDetalleOT = null;
let tabSubValeConsumo = null;
let tabSubParteEntrada = null;
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

function buscarXHROt(action, datos, callback) {
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
    fetch(urlOt, {
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
    cargarDatosIniciales();
    document.getElementById('otEstado')?.addEventListener('change', function() {
        if (this.value === 'Cerrado' || this.value === 'Terminado') {
            setCamposOtEditable(false);
            document.getElementById('btnGuardarOt').classList.add('hidden');
            Toastify({text: 'Documento cerrado. No se pueden realizar cambios.', style: {background: '#f44336'}}).showToast();
        }
    });
});

function getEncargadoOptions() {
    const select = document.getElementById('otEncargado');
    if (!select) return {};
    const opts = {};
    for (let i = 0; i < select.options.length; i++) {
        const opt = select.options[i];
        if (opt.value) {
            opts[opt.value] = opt.text;
        }
    }
    return opts;
}

function abrirModalEditarSubitemRow(row) {
    if (!modoEdicionOt) {
        Toastify({text: 'Debe activar edición para modificar', style: {background: '#f44336'}}).showToast();
        return;
    }
    const d = row.getData();
    const opts = getEncargadoOptions();

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';
    overlay.innerHTML = `
        <div class="bg-aq-surface border border-aq-border rounded-xl shadow-xl w-full max-w-md mx-4 p-5">
            <h3 class="text-base font-semibold text-aq-text mb-3">Editar Artículo</h3>
            <div class="text-xs text-aq-muted mb-4">
                <span class="font-medium text-aq-text">${d.codigo || ''}</span> - ${d.nombre || ''}
            </div>
            <div class="space-y-3">
                <div>
                    <label class="block text-xs font-medium text-aq-text mb-1">Cantidad</label>
                    <input type="number" id="editSubCant" step="any" value="${d.cantidad || 0}"
                        class="w-full px-2 py-1.5 rounded-lg border border-aq-border bg-aq-bg text-aq-text text-xs">
                </div>
                <div>
                    <label class="block text-xs font-medium text-aq-text mb-1">Encargado</label>
                    <select id="editSubEncargado"
                        class="w-full px-2 py-1.5 rounded-lg border border-aq-border bg-aq-bg text-aq-text text-xs">
                        <option value="">---</option>
                        ${Object.entries(opts).map(([val, label]) =>
                            `<option value="${val}" ${String(val) === String(d.codencargado || '') ? 'selected' : ''}>${label}</option>`
                        ).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-medium text-aq-text mb-1">P. Unitario</label>
                    <input type="number" id="editSubPUnit" step="any" value="${d.punit || 0}"
                        class="w-full px-2 py-1.5 rounded-lg border border-aq-border bg-aq-bg text-aq-text text-xs">
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-5">
                <button type="button" id="btnEditSubCancel"
                    class="px-3 py-1.5 rounded-lg border border-aq-border text-aq-text hover:bg-aq-surface-2 text-xs">Cancelar</button>
                <button type="button" id="btnEditSubSave"
                    class="px-3 py-1.5 rounded-lg bg-aq-primary text-white hover:opacity-85 text-xs">Guardar</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#btnEditSubCancel').addEventListener('click', function() {
        overlay.remove();
    });
    overlay.querySelector('#btnEditSubSave').addEventListener('click', function() {
        const cantidad = parseFloat(overlay.querySelector('#editSubCant').value) || 0;
        const codencargado = overlay.querySelector('#editSubEncargado').value;
        const punit = parseFloat(overlay.querySelector('#editSubPUnit').value) || 0;
        const numero = document.getElementById('otNumero').value;

        if (!numero || !d.tipo_cod || d.linea === undefined) {
            Toastify({text: 'Datos insuficientes para guardar', style: {background: '#f44336'}}).showToast();
            return;
        }

        function updateField(campo, valor, callback) {
            buscarXHROt('editar_subitem', {numero: numero, tipo_cod: d.tipo_cod, linea: d.linea, campo: campo, valor: valor}, function(data) {
                if (!data.success) {
                    Toastify({text: 'Error al actualizar ' + campo + ': ' + data.message, style: {background: '#f44336'}}).showToast();
                } else if (callback) {
                    callback();
                }
            });
        }

        let pendientes = 3;
        function contar() {
            pendientes--;
            if (pendientes <= 0) {
                overlay.remove();
                cargarSubformulariosOT(numero);
                Toastify({text: 'Actualizado correctamente', style: {background: '#4caf50'}}).showToast();
            }
        }
        updateField('cantidad', cantidad, contar);
        updateField('codencargado', codencargado, contar);
        updateField('punit', punit, contar);
    });

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
    });
}

function initSubTabulators(callback) {
    const colDef = [
        { title: 'Artículo', field: 'codigo', width: 80,
            bottomCalc: function() { return 'Totales'; },
            bottomCalcFormatter: function(cell) { return cell.getValue(); },
            groupBottomCalc: function() { return 'Subtotal'; },
            groupBottomCalcFormatter: function(cell) { return cell.getValue(); }
        },
        { title: 'Nombre', field: 'nombre', widthGrow: 2 },
        { title: 'Fecha', field: 'fecha', width: 90, hozAlign: 'center',
            formatter: function(cell) {
                const v = cell.getValue();
                if (!v) return '-';
                const parts = v.split('-');
                return parts.length === 3 ? parts.reverse().join('-') : v;
            }
        },
        { title: 'Cant', field: 'cantidad', width: 70, hozAlign: 'right', bottomCalc: 'sum',
            bottomCalcFormatter: function(cell) {
                const v = cell.getValue();
                return v ? String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : 0;
            }
        },
        { title: 'UM', field: 'um', width: 50, hozAlign: 'center' },
        { title: 'Encargado', field: 'codencargado', width: 120,
            formatter: function(cell) {
                const opts = getEncargadoOptions();
                const v = cell.getValue();
                return opts[v] || v || '-';
            }
        },
        { title: 'P.Unit', field: 'punit', width: 80, hozAlign: 'right', bottomCalc: 'sum',
            bottomCalcFormatter: function(cell) {
                const v = cell.getValue();
                return v ? String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : 0;
            }
        },
        { title: '_linea', field: 'linea', visible: false },
        { title: '_tipo_cod', field: 'tipo_cod', visible: false },
    ];
    let built = 0;
    function onBuilt() {
        built++;
        if (built === 3 && typeof callback === 'function') {
            callback();
        }
    }
    tabSubDetalleOT = new Tabulator('#tablaSubDetalleOT', {
        columns: colDef, data: [], layout: 'fitColumns', minHeight: '100px',
        placeholder: 'Sin datos', tableBuilt: onBuilt,
    });
    tabSubValeConsumo = new Tabulator('#tablaSubValeConsumo', {
        columns: colDef, data: [], layout: 'fitColumns', minHeight: '100px',
        placeholder: 'Sin datos', tableBuilt: onBuilt,
        groupBy: 'fecha',
        groupHeader: function(value, count, data) {
            const parts = (value || '').split('-');
            const fmt = parts.length === 3 ? parts.reverse().join('-') : (value || 'Sin fecha');
            return `<span style="font-weight:700">Fecha: ${fmt}</span> <span style="margin-left:8px;color:rgb(var(--aq-muted))">(${count} ítem${count===1?'':'s'})</span>`;
        },
        groupBottomCalc: undefined,
    });
    tabSubParteEntrada = new Tabulator('#tablaSubParteEntrada', {
        columns: colDef, data: [], layout: 'fitColumns', minHeight: '100px',
        placeholder: 'Sin datos', tableBuilt: onBuilt,
        groupBy: 'fecha',
        groupHeader: function(value, count, data) {
            const parts = (value || '').split('-');
            const fmt = parts.length === 3 ? parts.reverse().join('-') : (value || 'Sin fecha');
            return `<span style="font-weight:700">Fecha: ${fmt}</span> <span style="margin-left:8px;color:rgb(var(--aq-muted))">(${count} ítem${count===1?'':'s'})</span>`;
        },
        groupBottomCalc: undefined,
    });
    tabSubDetalleOT.on("rowClick", function(e, row) { abrirModalEditarSubitemRow(row); });
    tabSubValeConsumo.on("rowClick", function(e, row) { abrirModalEditarSubitemRow(row); });
    tabSubParteEntrada.on("rowClick", function(e, row) { abrirModalEditarSubitemRow(row); });
}

function cargarSubformulariosOT(numero) {
    buscarXHROt('cargar_subformularios', {numero: numero}, function(data) {
        if (tabSubDetalleOT) tabSubDetalleOT.setData(data.detalle_ot || []);
        if (tabSubValeConsumo) tabSubValeConsumo.setData(data.vale_consumo || []);
        if (tabSubParteEntrada) tabSubParteEntrada.setData(data.parte_entrada || []);
    });
}

function cargarDatosIniciales() {
    buscarXHROt('listar_encargados', {}, function(data) {
        const select = document.getElementById('otEncargado');
        if (select && data.encargados) {
            data.encargados.forEach(e => {
                const option = document.createElement('option');
                option.value = e.cod;
                option.textContent = e.nombre;
                select.appendChild(option);
            });
        }
    });

    buscarXHROt('listar_clientes', {}, function(data) {
        const select = document.getElementById('otRut');
        if (select && data.clientes) {
            select.innerHTML = '<option value="">--- Seleccionar ---</option>';
            data.clientes.forEach(c => {
                const option = document.createElement('option');
                option.value = c.rut;
                option.textContent = c.rut + ' - ' + c.nombre;
                select.appendChild(option);
            });
        }
    });

    buscarXHROt('listar_procesos', {}, function(data) {
        const select = document.getElementById('otProceso');
        if (select && data.procesos) {
            data.procesos.forEach(p => {
                const option = document.createElement('option');
                option.value = p.cod;
                option.textContent = p.nombre;
                select.appendChild(option);
            });
        }
    });

    buscarXHROt('listar_bodegas', {}, function(data) {
        const select = document.getElementById('otProdBodega');
        if (select && data.bodegas) {
            select.innerHTML = '<option value="">Bod.</option>';
            data.bodegas.forEach(b => {
                const option = document.createElement('option');
                option.value = b.cod;
                option.textContent = b.nombre;
                select.appendChild(option);
            });
        }
    });

    document.getElementById('otProceso')?.addEventListener('change', function() {
        cargarListasORPE();
    });

    document.getElementById('otFecha').value = new Date().toISOString().split('T')[0];

    initSubTabulators(function() {
        nuevaOt();
        setCamposOtEditable(true);
        document.getElementById('btnEditarOt').classList.add('hidden');
        document.getElementById('btnGuardarOt').classList.remove('hidden');
        cargarListasORPE();
    });
}

function cargarListasORPE() {
    const proceso = document.getElementById('otProceso').value;

    buscarXHROt('listar_or', {proceso: proceso}, function(data) {
        window.listaOR = data.documentos || [];
    });

    buscarXHROt('listar_pe', {proceso: proceso}, function(data) {
        window.listaPE = data.documentos || [];
    });
}



function abrirModalORUnico() {
    const proceso = document.getElementById('otProceso').value;
    buscarXHROt('listar_or', {proceso: proceso}, function(data) {
        const docs = data.documentos || [];
        if (docs.length === 0) {
            abrirModalBusqueda({
                titulo: 'Seleccionar Artículos de OR',
                columnas: [
                    { title: 'N° OR', field: 'numero', width: 80 },
                    { title: 'Fecha', field: 'fecha', width: 100 },
                    { title: 'RUT', field: 'rut', width: 90 },
                    { title: 'Cliente', field: 'nombre_cliente', width: 130 },
                    { title: 'Código', field: 'codigo', width: 90 },
                    { title: 'Nombre', field: 'nombre' },
                    { title: 'Cant', field: 'cantidad', width: 70 },
                    { title: 'Bodega', field: 'bodega', width: 80 },
                ],
                data: [],
                filtroCampos: ['numero', 'codigo', 'nombre', 'rut', 'nombre_cliente'],
                onSelect: null,
                onRefresh: function(opts) { abrirModalORUnico(); },
            });
            return;
        }
        const dataOR = docs.map(d => ({ ...d, numeroDoc: d.numero }));
        const preselectedOR = dataOR.filter(d => {
            const key = (d.codigo || '') + '|' + (d.numero || '');
            return detallesOt.some(item => (item.codigo || '') + '|' + (item.docref || '') === key && item.tipo === '7');
        });
        abrirModalBusqueda({
            titulo: 'Seleccionar Artículos de OR',
            multiSelect: true,
            preselectedKeys: ['codigo', 'numero'],
            preselected: preselectedOR,
            columnas: [
                { title: 'N° OR', field: 'numero', width: 80 },
                { title: 'Fecha', field: 'fecha', width: 100 },
                { title: 'RUT', field: 'rut', width: 90 },
                { title: 'Cliente', field: 'nombre_cliente', width: 130 },
                { title: 'Código', field: 'codigo', width: 90 },
                { title: 'Nombre', field: 'nombre' },
                { title: 'Cant', field: 'cantidad', width: 70 },
                { title: 'Bodega', field: 'bodega', width: 80 },
            ],
            data: dataOR,
            filtroCampos: ['numero', 'codigo', 'nombre', 'rut', 'nombre_cliente'],
            onSelect: function(row) {
                const key = (row.codigo || '') + '|' + (row.numero || '');
                const yaExiste = detallesOt.some(d => (d.codigo || '') + '|' + (d.docref || '') === key);
                if (yaExiste) {
                    Toastify({text: 'Artículo ya agregado', style: {background: '#f44336'}}).showToast();
                    return;
                }
                document.getElementById('inputOR').value = row.numero || '';
                detallesOt.push({
                    codigo: row.codigo || '',
                    nombre: row.nombre || '',
                    cantidad: Math.abs(row.cantidad || 0),
                    punit: row.punit || 0,
                    um: row.um || '',
                    peso: row.peso || 0,
                    bodega: row.bodega || '',
                    fecha: row.fecha || '',
                    estado: 'Abierto',
                    docref: row.numero || '',
                    tipo: '7',
                    rut: row.rut || '',
                    nombre_cliente: row.nombre_cliente || '',
                    canttotal: row.cantidad || 0,
                });
                renderizarDetalleOt();
                Toastify({text: 'Artículo de OR agregado', style: {background: '#4caf50'}}).showToast();
            },
            onDeselect: function(row) {
                const key = (row.codigo || '') + '|' + (row.numero || '');
                const idx = detallesOt.findIndex(d => (d.codigo || '') + '|' + (d.docref || '') === key);
                if (idx !== -1) {
                    detallesOt.splice(idx, 1);
                    renderizarDetalleOt();
                    Toastify({text: 'Artículo removido', style: {background: '#ff9800'}}).showToast();
                }
            },
            onRefresh: function(opts) { abrirModalORUnico(); },
        });
    });
}



function abrirModalPEUnico() {
    const proceso = document.getElementById('otProceso').value;
    buscarXHROt('listar_pe', {proceso: proceso}, function(data) {
        const docs = data.documentos || [];
        if (docs.length === 0) {
            abrirModalBusqueda({
                titulo: 'Seleccionar Artículos de PE',
                columnas: [
                    { title: 'N° PE', field: 'numero', width: 80 },
                    { title: 'Fecha', field: 'fecha', width: 100 },
                    { title: 'Código', field: 'codigo', width: 90 },
                    { title: 'Nombre', field: 'nombre' },
                    { title: 'Cant', field: 'cantidad', width: 70 },
                    { title: 'Bodega', field: 'bodega', width: 80 },
                ],
                data: [],
                filtroCampos: ['numero', 'codigo', 'nombre'],
                onSelect: null,
                onRefresh: function(opts) { abrirModalPEUnico(); },
            });
            return;
        }
        const dataPE = docs.map(d => ({ ...d, numeroDoc: d.numero }));
        const preselectedPE = dataPE.filter(d => detallesOt.some(item => item.movsId === d.id && item.tipo === '6'));
        abrirModalBusqueda({
            titulo: 'Seleccionar Artículos de PE',
            multiSelect: true,
            preselectedKeys: ['id'],
            preselected: preselectedPE,
            columnas: [
                { title: 'N° PE', field: 'numero', width: 80 },
                { title: 'Fecha', field: 'fecha', width: 100 },
                { title: 'Código', field: 'codigo', width: 90 },
                { title: 'Nombre', field: 'nombre' },
                { title: 'Cant', field: 'cantidad', width: 70 },
                { title: 'Bodega', field: 'bodega', width: 80 },
            ],
            data: dataPE,
            filtroCampos: ['numero', 'codigo', 'nombre'],
            onSelect: function(row) {
                const yaExiste = detallesOt.some(d => d.movsId === row.id);
                if (yaExiste) {
                    Toastify({text: 'Artículo ya agregado', style: {background: '#f44336'}}).showToast();
                    return;
                }
                document.getElementById('inputPE').value = row.numero || '';
                detallesOt.push({
                    codigo: row.codigo || '',
                    nombre: row.nombre || '',
                    cantidad: Math.abs(row.cantidad || 0),
                    punit: row.punit || 0,
                    um: row.um || '',
                    peso: row.peso || 0,
                    bodega: row.bodega || '',
                    fecha: row.fecha || '',
                    estado: 'Abierto',
                    docref: row.numero || '',
                    tipo: '6',
                    rut: row.rut || '',
                    canttotal: row.cantidad || 0,
                    movsId: row.id,
                });
                renderizarDetalleOt();
                Toastify({text: 'Artículo de PE agregado', style: {background: '#4caf50'}}).showToast();
            },
            onDeselect: function(row) {
                const idx = detallesOt.findIndex(d => d.movsId === row.id);
                if (idx !== -1) {
                    detallesOt.splice(idx, 1);
                    renderizarDetalleOt();
                    Toastify({text: 'Artículo removido', style: {background: '#ff9800'}}).showToast();
                }
            },
            onRefresh: function(opts) { abrirModalPEUnico(); },
        });
    });
}

function nuevaOt() {
    document.getElementById('otForm').reset();
    detallesOt = [];
    modoEdicionOt = true;
    renderizarDetalleOt();
    const fecha = new Date().toISOString().split('T')[0];
    document.getElementById('otFecha').value = fecha;
    document.getElementById('otEstado').value = 'Abierto';
    document.getElementById('otEstado').dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('otEncargado').value = '';
    document.getElementById('otEncargado').dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('otProceso').value = '';
    document.getElementById('otNumero').value = '';
    const rutReset = document.getElementById('otRut');
    if (rutReset) {
        if (typeof jQuery !== 'undefined' && jQuery(rutReset).data('select2')) {
            jQuery(rutReset).val('').trigger('change');
        } else {
            rutReset.value = '';
        }
    }
    document.getElementById('otGlosa').value = '';
    document.getElementById('tab-detalle').classList.add('hidden');
    document.getElementById('contenido-detalle').classList.add('hidden');
    document.getElementById('tab-encabezado').classList.add('active');
    document.getElementById('contenido-encabezado').classList.remove('hidden');
    document.getElementById('btnEditarOt').classList.add('hidden');
    document.getElementById('btnEliminarOt').classList.add('hidden');
    document.getElementById('btnImprimirOt').classList.add('hidden');
    document.getElementById('btnGuardarOt').classList.remove('hidden');
    document.getElementById('inputOR').value = '';
    document.getElementById('inputPE').value = '';
    const seccionRelacionados = document.getElementById('seccionRelacionados');
    if (seccionRelacionados) seccionRelacionados.classList.add('hidden');
    if (tabSubDetalleOT) tabSubDetalleOT.setData([]);
    if (tabSubValeConsumo) tabSubValeConsumo.setData([]);
    if (tabSubParteEntrada) tabSubParteEntrada.setData([]);
    setCamposOtEditable(true);
}

function setCamposOtEditable(editable) {
    const inputs = ['otNumero', 'otFecha', 'otEncargado', 'otProceso', 'otRut', 'otGlosa'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.tagName === 'SELECT') {
                el.disabled = !editable;
            } else {
                el.readOnly = !editable;
            }
        }
    });

    const inputOR = document.getElementById('inputOR');
    if (inputOR) inputOR.disabled = !editable;
    const inputPE = document.getElementById('inputPE');
    if (inputPE) inputPE.disabled = !editable;

    const buttons = document.querySelectorAll('#contenido-detalle button');
    buttons.forEach(btn => {
        btn.disabled = !editable;
    });

    const estado = document.getElementById('otEstado');
    if (estado) {
        estado.disabled = !editable;
        if (editable) {
            estado.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    const encargado = document.getElementById('otEncargado');
    if (encargado && editable) encargado.dispatchEvent(new Event('change', { bubbles: true }));

    modoEdicionOt = editable;
    renderizarDetalleOt();
}

function editarOt() {
    const estado = document.getElementById('otEstado').value;
    if (estado === 'Cerrado' || estado === 'Terminado') {
        mostrarModalConfirm({
            titulo: 'Reabrir OT',
            mensaje: 'La OT está cerrada. ¿Desea reabrirla para poder editarla? Los documentos referenciados volverán a quedar Abiertos.',
            tipo: 'confirm',
            onConfirm: function() {
                const numero = document.getElementById('otNumero').value;
                buscarXHROt('reabrir', {numero: numero}, function(data) {
                    if (data.success) {
                        Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                        cargarOt(numero, function() { editarOt(); });
                    } else {
                        Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
                    }
                });
            }
        });
        return;
    }
    setCamposOtEditable(true);
    document.getElementById('btnGuardarOt').classList.remove('hidden');
    document.getElementById('btnEliminarOt').classList.add('hidden');
    document.getElementById('btnEditarOt').classList.add('hidden');
}

function buscarFolioInput() {
    const numero = document.getElementById('otNumero').value;
    if (numero) {
        cargarOt(numero);
    }
}

function eliminarOt() {
    const numero = document.getElementById('otNumero').value;
    if (!numero) {
        Toastify({text: 'No hay OT seleccionada', style: {background: '#f44336'}}).showToast();
        return;
    }
    mostrarModalConfirm({titulo: 'Eliminar OT', mensaje: '¿Está seguro de eliminar esta Orden de Trabajo y todos sus movimientos?', tipo: 'confirm', onConfirm: function() {
        buscarXHROt('eliminar', {numero: numero}, function(data) {
            if (data.success) {
                Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                nuevaOt();
            } else {
                Toastify({text:data.message, style: {background: '#f44336'}}).showToast();
            }
        });
    }});
}

function eliminarArticuloOt(index) {
    detallesOt.splice(index, 1);
    renderizarDetalleOt();
}

function imprimirOt() {
    const numero = document.getElementById('otNumero').value;
    if (!numero) {
        Toastify({text: 'No hay OT seleccionada', style: {background: '#f44336'}}).showToast();
        return;
    }
    const formData = new FormData();
    formData.append('action', 'generar_pdf');
    formData.append('numero', numero);
    fetch(urlOt, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error HTTP ' + response.status);
        return response.blob();
    })
    .then(blob => {
        if (typeof window.downloadBlobTauri === 'function') {
            window.downloadBlobTauri(blob, 'ot_' + numero + '.pdf');
        } else {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'ot_' + numero + '.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }
    })
    .catch(err => {
        console.error('Error:', err);
        Toastify({text: 'Error al generar PDF: ' + err.message, style: {background: '#f44336'}}).showToast();
    });
}

function buscarProductoOt() {
    const cod = document.getElementById('otProdCod').value.trim();
    if (!cod) return;
    buscarXHROt('buscar_articulo', {codigo: cod}, function(data) {
        if (data.success) {
            document.getElementById('otProdCod').value = data.data.cod;
            document.getElementById('otProdNombre').value = data.data.nombre;
            document.getElementById('otProdUM').value = data.data.um;
            window.productoPrc = data.data.precio || null;
            window.productoPeso = data.data.peso || 0;
        } else {
            Toastify({text: data.message || 'Artículo no encontrado', style: {background: '#f44336'}}).showToast();
        }
    });
}

function abrirListaProductos() {
    buscarXHROt('listar_articulos', {}, function(data) {
        const articulos = (data.articulos || []).map(a => ({
            codigo: a.codigo || '',
            nombre: a.descr || '',
            um: a.um || '',
            precio: a.precio || 0,
            peso: a.peso || 0,
        }));
        abrirModalBusqueda({
            titulo: 'Seleccionar Producto',
            ancho: 'xl',
            columnas: [
                { title: 'Código', field: 'codigo', width: 100 },
                { title: 'Nombre', field: 'nombre' },
                { title: 'UM', field: 'um', width: 60 },
                { title: 'Precio', field: 'precio', width: 80 },
            ],
            data: articulos,
            filtroCampos: ['codigo', 'nombre'],
            onSelect: function(row) {
                document.getElementById('otProdCod').value = row.codigo || '';
                document.getElementById('otProdNombre').value = row.nombre || '';
                document.getElementById('otProdUM').value = row.um || '';
                window.productoPrc = row.precio || null;
                window.productoPeso = row.peso || 0;
            },
        });
    });
}

function agregarProductoOt() {
    const cod = document.getElementById('otProdCod').value.trim();
    const nombre = document.getElementById('otProdNombre').value.trim();
    const um = document.getElementById('otProdUM').value.trim();
    const cant = parseFloat(document.getElementById('otProdCant').value) || 0;
    const bodega = document.getElementById('otProdBodega').value;

    if (!cod) {
        Toastify({text: 'Seleccione un producto', style: {background: '#f44336'}}).showToast();
        return;
    }
    if (cant <= 0) {
        Toastify({text: 'Ingrese cantidad', style: {background: '#f44336'}}).showToast();
        return;
    }

    const key = cod + '|producto';
    const yaExiste = detallesOt.some(d => (d.codigo || '') + '|' + (d.producto ? 'producto' : '') === key);
    if (yaExiste) {
        Toastify({text: 'Producto ya agregado', style: {background: '#f44336'}}).showToast();
        return;
    }

    detallesOt.push({
        codigo: cod,
        nombre: nombre,
        cantidad: cant,
        punit: window.productoPrc || 0,
        um: um,
        peso: window.productoPeso || 0,
        bodega: bodega,
        fecha: '',
        estado: 'Abierto',
        docref: '',
        tipo: '',
        rut: '',
        canttotal: cant,
        producto: true,
    });

    document.getElementById('otProdCod').value = '';
    document.getElementById('otProdNombre').value = '';
    document.getElementById('otProdUM').value = '';
    document.getElementById('otProdCant').value = '';
    document.getElementById('otProdBodega').value = '';
    window.productoPrc = null;
    window.productoPeso = null;

    renderizarDetalleOt();
    Toastify({text: 'Producto agregado', style: {background: '#4caf50'}}).showToast();
}

function abrirListaOR() {
    const proceso = document.getElementById('otProceso').value;
    buscarXHROt('listar_or', {proceso: proceso}, function(data) {
        const docs = data.documentos || [];
        if (docs.length === 0) {
            abrirModalBusqueda({
                titulo: 'Seleccionar Artículos de OR',
                columnas: [
                    { title: 'N° OR', field: 'numero', width: 80 },
                    { title: 'Fecha', field: 'fecha', width: 100 },
                    { title: 'RUT', field: 'rut', width: 90 },
                    { title: 'Cliente', field: 'nombre_cliente', width: 130 },
                    { title: 'Código', field: 'codigo', width: 90 },
                    { title: 'Nombre', field: 'nombre' },
                    { title: 'Cant', field: 'cantidad', width: 70 },
                    { title: 'Bodega', field: 'bodega', width: 80 },
                ],
                data: [],
                filtroCampos: ['numero', 'codigo', 'nombre', 'rut', 'nombre_cliente'],
                onSelect: null,
                onRefresh: function(opts) { abrirListaOR(); },
            });
            return;
        }
        const dataOR = docs.map(d => ({ ...d, numeroDoc: d.numero }));
        const preselectedOR = dataOR.filter(d => {
            const key = (d.codigo || '') + '|' + (d.numero || '');
            return detallesOt.some(item => (item.codigo || '') + '|' + (item.docref || '') === key && item.tipo === '7');
        });
        abrirModalBusqueda({
            titulo: 'Seleccionar Artículos de OR',
            multiSelect: true,
            preselectedKeys: ['codigo', 'numero'],
            preselected: preselectedOR,
            ancho: 'xl',
            columnas: [
                { title: 'N° OR', field: 'numero', width: 80 },
                { title: 'Fecha', field: 'fecha', width: 100 },
                { title: 'RUT', field: 'rut', width: 90 },
                { title: 'Cliente', field: 'nombre_cliente', width: 130 },
                { title: 'Código', field: 'codigo', width: 90 },
                { title: 'Nombre', field: 'nombre' },
                { title: 'Cant', field: 'cantidad', width: 70 },
                { title: 'Bodega', field: 'bodega', width: 80 },
            ],
            data: dataOR,
            filtroCampos: ['numero', 'codigo', 'nombre', 'rut', 'nombre_cliente'],
            onSelect: function(row) {
                const key = (row.codigo || '') + '|' + (row.numero || '');
                const yaExiste = detallesOt.some(d => (d.codigo || '') + '|' + (d.docref || '') === key);
                if (yaExiste) {
                    Toastify({text: 'Artículo ya agregado', style: {background: '#f44336'}}).showToast();
                    return;
                }
                const numsOR = [...new Set([row.numero])].filter(n => n);
                document.getElementById('inputOR').value = numsOR.join(', ');
                detallesOt.push({
                    codigo: row.codigo || '',
                    nombre: row.nombre || '',
                    cantidad: Math.abs(row.cantidad || 0),
                    punit: row.punit || 0,
                    um: row.um || '',
                    peso: row.peso || 0,
                    bodega: row.bodega || '',
                    fecha: row.fecha || '',
                    estado: 'Abierto',
                    docref: row.numero || '',
                    tipo: '7',
                    rut: row.rut || '',
                    nombre_cliente: row.nombre_cliente || '',
                    canttotal: row.cantidad || 0,
                });
                renderizarDetalleOt();
                Toastify({text: 'Artículo de OR agregado', style: {background: '#4caf50'}}).showToast();
            },
            onDeselect: function(row) {
                const key = (row.codigo || '') + '|' + (row.numero || '');
                const idx = detallesOt.findIndex(d => (d.codigo || '') + '|' + (d.docref || '') === key);
                if (idx !== -1) {
                    detallesOt.splice(idx, 1);
                    renderizarDetalleOt();
                    Toastify({text: 'Artículo removido', style: {background: '#ff9800'}}).showToast();
                }
            },
            onRefresh: function(opts) { abrirListaOR(); },
        });
    });
}

function abrirListaPE() {
    const proceso = document.getElementById('otProceso').value;
    buscarXHROt('listar_pe', {proceso: proceso}, function(data) {
        const docs = data.documentos || [];
        if (docs.length === 0) {
            abrirModalBusqueda({
                titulo: 'Seleccionar Artículos de PE',
                columnas: [
                    { title: 'N° PE', field: 'numero', width: 80 },
                    { title: 'Fecha', field: 'fecha', width: 100 },
                    { title: 'Código', field: 'codigo', width: 90 },
                    { title: 'Nombre', field: 'nombre' },
                    { title: 'Cant', field: 'cantidad', width: 70 },
                    { title: 'Bodega', field: 'bodega', width: 80 },
                ],
                data: [],
                filtroCampos: ['numero', 'codigo', 'nombre'],
                onSelect: null,
                onRefresh: function(opts) { abrirListaPE(); },
            });
            return;
        }
        const dataPE = docs.map(d => ({ ...d, numeroDoc: d.numero }));
        const preselectedPE = dataPE.filter(d => detallesOt.some(item => item.movsId === d.id && item.tipo === '6'));
        abrirModalBusqueda({
            titulo: 'Seleccionar Artículos de PE',
            multiSelect: true,
            preselectedKeys: ['id'],
            preselected: preselectedPE,
            ancho: 'xl',
            columnas: [
                { title: 'N° PE', field: 'numero', width: 80 },
                { title: 'Fecha', field: 'fecha', width: 100 },
                { title: 'Código', field: 'codigo', width: 90 },
                { title: 'Nombre', field: 'nombre' },
                { title: 'Cant', field: 'cantidad', width: 70 },
                { title: 'Bodega', field: 'bodega', width: 80 },
            ],
            data: dataPE,
            filtroCampos: ['numero', 'codigo', 'nombre'],
            onSelect: function(row) {
                const yaExiste = detallesOt.some(d => d.movsId === row.id);
                if (yaExiste) {
                    Toastify({text: 'Artículo ya agregado', style: {background: '#f44336'}}).showToast();
                    return;
                }
                const numsPE = [...new Set([row.numero])].filter(n => n);
                document.getElementById('inputPE').value = numsPE.join(', ');
                detallesOt.push({
                    codigo: row.codigo || '',
                    nombre: row.nombre || '',
                    cantidad: Math.abs(row.cantidad || 0),
                    punit: row.punit || 0,
                    um: row.um || '',
                    peso: row.peso || 0,
                    bodega: row.bodega || '',
                    fecha: row.fecha || '',
                    estado: 'Abierto',
                    docref: row.numero || '',
                    tipo: '6',
                    rut: row.rut || '',
                    canttotal: row.cantidad || 0,
                    movsId: row.id,
                });
                renderizarDetalleOt();
                Toastify({text: 'Artículo de PE agregado', style: {background: '#4caf50'}}).showToast();
            },
            onDeselect: function(row) {
                const idx = detallesOt.findIndex(d => d.movsId === row.id);
                if (idx !== -1) {
                    detallesOt.splice(idx, 1);
                    renderizarDetalleOt();
                    Toastify({text: 'Artículo removido', style: {background: '#ff9800'}}).showToast();
                }
            },
            onRefresh: function(opts) { abrirListaPE(); },
        });
    });
}

function renderizarDetalleOt() {
    const tbody = document.getElementById('otDetalle');
    tbody.innerHTML = '';

    if (detallesOt.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" class="px-3 py-4 text-center text-aq-text">Sin artículos agregados</td></tr>';
        document.getElementById('resumenEncargado').textContent = '-';
        document.getElementById('resumenProceso').textContent = '-';
        document.getElementById('resumenEstado').textContent = '-';
        document.getElementById('resumenTotalArt').textContent = '0';
        return;
    }

    let totalCant = 0;
    let totalCantTotal = 0;
    let totalPUnit = 0;
    let totalPeso = 0;

    detallesOt.forEach((d, index) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 text-xs';
        let fechaFmt = '';
        if (d.fecha) {
            const f = (typeof d.fecha === 'string') ? d.fecha.split('T')[0] : '';
            if (f) fechaFmt = f.split('-').reverse().join('-');
        }

        const pesoTotal = (d.cantidad || 0) * (d.peso || 0);
        totalCant += d.cantidad || 0;
        totalCantTotal += d.canttotal || 0;
        totalPUnit += d.punit || 0;
        totalPeso += pesoTotal;

        tr.innerHTML = `
            <td class="px-1 py-1 text-aq-text">${d.docref || ''}</td>
            <td class="px-1 py-1 text-aq-text">${d.tipo || ''}</td>
            <td class="px-1 py-1 text-aq-text">${fechaFmt}</td>
            <td class="px-1 py-1 text-aq-text">${d.rut || ''}</td>
            <td class="px-1 py-1 text-aq-text">${d.codigo || ''}</td>
            <td class="px-1 py-1 text-aq-text text-right">${d.cantidad || 0}</td>
            <td class="px-1 py-1 text-aq-text">${d.bodega || ''}</td>
            <td class="px-1 py-1 text-aq-text text-right">${d.canttotal || 0}</td>
            <td class="px-1 py-1 text-aq-text">${d.estado || ''}</td>
            <td class="px-1 py-1 text-aq-text text-right">${d.punit ? d.punit.toFixed(0) : 0}</td>
            <td class="px-1 py-1 text-aq-text text-right">${pesoTotal ? pesoTotal.toFixed(2) : 0}</td>
            <td class="px-1 py-1 text-center">
                ${modoEdicionOt ? '<button onclick="eliminarArticuloOt(' + index + ')" class="text-red-500 hover:text-red-700" title="Eliminar"><i class="bx bx-trash"></i></button>' : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });

    const trTotal = document.createElement('tr');
    trTotal.className = 'bg-aq-primary-soft font-bold text-xs border-t-2 border-aq-primary';
    trTotal.innerHTML = `
        <td colspan="5" class="px-1 py-1.5 text-aq-primary text-left">Totales</td>
        <td class="px-1 py-1.5 text-aq-text text-right font-bold">${totalCant}</td>
        <td class="px-1 py-1.5 text-aq-text"></td>
        <td class="px-1 py-1.5 text-aq-text text-right font-bold">${totalCantTotal}</td>
        <td class="px-1 py-1.5 text-aq-text"></td>
        <td class="px-1 py-1.5 text-aq-text text-right font-bold">${totalPUnit.toFixed(0)}</td>
        <td class="px-1 py-1.5 text-aq-text text-right font-bold">${totalPeso.toFixed(2)}</td>
        <td class="px-1 py-1.5 text-aq-text"></td>
    `;
    tbody.appendChild(trTotal);

    const encargado = document.getElementById('otEncargado');
    const encargadoText = encargado && encargado.selectedIndex > 0 ? encargado.options[encargado.selectedIndex].textContent : '-';
    const proceso = document.getElementById('otProceso');
    const procesoText = proceso && proceso.selectedIndex > 0 ? proceso.options[proceso.selectedIndex].textContent : '-';
    const estado = document.getElementById('otEstado');
    const estadoText = estado ? estado.value || '-' : '-';

    document.getElementById('resumenEncargado').textContent = encargadoText;
    document.getElementById('resumenProceso').textContent = procesoText;
    document.getElementById('resumenEstado').textContent = estadoText;
    document.getElementById('resumenTotalArt').textContent = totalCant;
}

function guardarOt() {
    const numero = document.getElementById('otNumero').value;

    if (!modoEdicionOt) {
        const estado = document.getElementById('otEstado').value;
        mostrarModalConfirm({titulo: 'Guardar OT', mensaje: '¿Está seguro de actualizar el estado de esta OT?', tipo: 'confirm', onConfirm: function() {
            buscarXHROt('editar_estado', {
                numero: numero,
                estado: estado
            }, function(data) {
                if (data.success) {
                    Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                    cargarOt(data.numero);
                } else {
                    Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
                }
            });
        }});
        return;
    }

    const encargado = document.getElementById('otEncargado').value;
    const proceso = document.getElementById('otProceso').value;
    const estado = document.getElementById('otEstado').value;
    const fecha = document.getElementById('otFecha').value;
    const rut = document.getElementById('otRut').value;
    const glosa = document.getElementById('otGlosa').value;

    if (!encargado) {
        Toastify({text: 'Debe ingresar un encargado', style: {background: '#f44336'}}).showToast();
        return;
    }
    if (!proceso) {
        Toastify({text: 'Debe ingresar un proceso', style: {background: '#f44336'}}).showToast();
        return;
    }

    mostrarModalConfirm({titulo: 'Guardar OT', mensaje: '¿Está seguro de guardar esta Orden de Trabajo?\n\nLos artículos referenciados serán marcados como Cerrados.', tipo: 'confirm', onConfirm: function() {
        buscarXHROt('nuevo', {
            numero: numero,
            fecha: fecha,
            encargado: encargado,
            proceso: proceso,
            estado: estado,
            rut: rut,
            glosa: glosa,
            detalles: JSON.stringify(detallesOt)
        }, function(data) {
            if (data.success) {
                Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                cargarOt(data.numero);
            } else {
                Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
            }
        });
    }});
}

function buscarOt() {
    buscarXHROt('listar_ot', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Buscar OT',
            columnas: [
                { title: 'Nro', field: 'numero', width: 80 },
                { title: 'Fecha', field: 'fecha', width: 110 },
                { title: 'Encargado', field: 'encargado_nombre' },
                { title: 'Proceso', field: 'proceso_nombre' },
                { title: 'Estado', field: 'estado', width: 90 },
            ],
            data: data.ot || [],
            filtroCampos: ['numero', 'encargado_nombre', 'proceso_nombre', 'estado'],
            onSelect: function(row) { cargarOt(row.numero); },
            onRefresh: function(opts) {
                buscarXHROt('listar_ot', {}, function(data) {
                    opts.data = data.ot || [];
                    abrirModalBusqueda(opts);
                });
            },
        });
    });
}

function cambiarTabOt(tab) {
    if (tab === 'detalle') {
        if (!document.getElementById('otNumero').value && !modoEdicionOt) {
            Toastify({text: 'Seleccione una OT o cree una nueva', style: {background: '#f44336'}}).showToast();
            return;
        }
        const enc = document.getElementById('otEncargado').value;
        if (!enc && modoEdicionOt) {
            Toastify({text: 'Debe seleccionar un encargado primero', style: {background: '#f44336'}}).showToast();
            return;
        }
        const proc = document.getElementById('otProceso').value;
        if (!proc && modoEdicionOt) {
            Toastify({text: 'Debe seleccionar un proceso primero', style: {background: '#f44336'}}).showToast();
            return;
        }
    }
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.querySelectorAll('.tab-content').forEach(contenido => contenido.classList.add('hidden'));
    document.getElementById('contenido-' + tab).classList.remove('hidden');
}

function cargarOt(numero, despuesCargar) {
    document.getElementById('inputOR').value = '';
    document.getElementById('inputPE').value = '';
    buscarXHROt('buscar', {numero: numero}, function(data) {
        if (data.success) {
            cerrarModalBusqueda();
            document.getElementById('otNumero').value = data.data.numero;
            document.getElementById('otFecha').value = data.data.fecha || '';
            modoEdicionOt = false;

            document.getElementById('tab-detalle').classList.remove('hidden');
            document.getElementById('btnGuardarOt').classList.add('hidden');
            document.getElementById('btnEditarOt').classList.remove('hidden');
            document.getElementById('btnEliminarOt').classList.remove('hidden');
            document.getElementById('btnImprimirOt').classList.remove('hidden');
            setCamposOtEditable(false);
            document.getElementById('btnEditarOt').innerHTML = '<i class="bx bx-edit text-xl"></i>';
            document.getElementById('btnEditarOt').title = 'Editar';

            const encargadoSelect = document.getElementById('otEncargado');
            if (data.data.encargado) {
                let found = false;
                for (let i = 0; i < encargadoSelect.options.length; i++) {
                    if (String(encargadoSelect.options[i].value) === String(data.data.encargado)) {
                        encargadoSelect.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    const option = document.createElement('option');
                    option.value = data.data.encargado;
                    option.textContent = data.data.encargado_nombre || data.data.encargado;
                    encargadoSelect.appendChild(option);
                    encargadoSelect.value = data.data.encargado;
                }
                encargadoSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }

            const procesoSelect = document.getElementById('otProceso');
            if (data.data.proceso) {
                let found = false;
                for (let i = 0; i < procesoSelect.options.length; i++) {
                    if (String(procesoSelect.options[i].value) === String(data.data.proceso)) {
                        procesoSelect.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    const option = document.createElement('option');
                    option.value = data.data.proceso;
                    option.textContent = data.data.proceso_nombre || data.data.proceso;
                    procesoSelect.appendChild(option);
 procesoSelect.value = data.data.proceso;
                }
                procesoSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }

            document.getElementById('otEstado').value = data.data.estado || 'Abierto';
            document.getElementById('otEstado').dispatchEvent(new Event('change', { bubbles: true }));

            const rutCliente = data.data.rut || '';
            const clienteNombre = data.data.cliente_nombre || '';
            const rutSelect = document.getElementById('otRut');
            if (rutSelect) {
                let foundRut = false;
                for (let i = 0; i < rutSelect.options.length; i++) {
                    if (String(rutSelect.options[i].value) === String(rutCliente)) {
                        foundRut = true;
                        break;
                    }
                }
                if (rutCliente && !foundRut) {
                    const option = document.createElement('option');
                    option.value = rutCliente;
                    option.textContent = clienteNombre ? rutCliente + ' - ' + clienteNombre : rutCliente;
                    rutSelect.appendChild(option);
                }
                if (typeof jQuery !== 'undefined' && jQuery(rutSelect).data('select2')) {
                    jQuery(rutSelect).val(rutCliente).trigger('change');
                } else {
                    rutSelect.value = rutCliente;
                }
            }
            document.getElementById('otGlosa').value = data.data.glosa || '';

            detallesOt = (data.data.detalles || []).map(d => ({
                codigo: d.codigo || '',
                nombre: d.nombre || '',
                cantidad: d.cantidad || 0,
                punit: d.punit || 0,
                um: d.um || '',
                bodega: d.bodega || '',
                fecha: d.fecha || '',
                estado: d.estado || '',
                docref: d.docref || '',
                tipo: d.tipodocref || '',
                rut: d.rut || '',
                canttotal: d.canttotal || 0,
                linea: d.linea || null,
                movsId: d.movsId || null,
            }));
            renderizarDetalleOt();

            const seccionRelacionados = document.getElementById('seccionRelacionados');
            if (seccionRelacionados) {
                seccionRelacionados.classList.remove('hidden');
            }

            cargarSubformulariosOT(numero);

            if (data.data.estado === 'Cerrado' || data.data.estado === 'Terminado') {
                setCamposOtEditable(false);
                document.getElementById('btnGuardarOt').classList.add('hidden');
                document.getElementById('btnEditarOt').innerHTML = '<i class="bx bx-revision text-xl"></i>';
                document.getElementById('btnEditarOt').title = 'Reabrir OT';
                Toastify({text: 'Documento cerrado. Use Reabrir para editarlo.', style: {background: '#f39c12'}}).showToast();
            } else {
                document.getElementById('btnEditarOt').innerHTML = '<i class="bx bx-edit text-xl"></i>';
                document.getElementById('btnEditarOt').title = 'Editar';
            }

            if (typeof despuesCargar === 'function') {
                despuesCargar();
            }
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}
