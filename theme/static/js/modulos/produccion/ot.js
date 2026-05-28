const urlOt = (document.currentScript?.dataset.url) || '/';

let detallesOt = [];
let modoEdicionOt = false;
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

    document.getElementById('otProceso')?.addEventListener('change', function() {
        cargarListasORPE();
    });

    const fecha = new Date().toISOString().split('T')[0];
    document.getElementById('otFecha').value = fecha;
    nuevaOt();
    setCamposOtEditable(true);
    document.getElementById('btnEditarOt').classList.add('hidden');
    document.getElementById('btnGuardarOt').classList.remove('hidden');

    cargarListasORPE();
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
                    { title: 'Código', field: 'codigo', width: 90 },
                    { title: 'Cant', field: 'cantidad', width: 70 },
                    { title: 'Bodega', field: 'bodega', width: 80 },
                ],
                data: [],
                filtroCampos: ['numero', 'codigo'],
                onSelect: null,
                onRefresh: function(opts) { abrirModalORUnico(); },
            });
            return;
        }
        let articulos = [];
        let pendientes = docs.length;
        docs.forEach(or => {
            buscarXHROt('buscar_referencia', {numero: or.numero, tipo: 7}, function(resp) {
                if (resp.success && resp.detalles) {
                    resp.detalles.forEach(d => {
                        d.numeroDoc = or.numero;
                        let fechaFmt = '';
                        if (d.fecha) {
                            const f = (typeof d.fecha === 'string') ? d.fecha.split('T')[0] : '';
                            if (f) fechaFmt = f.split('-').reverse().join('-');
                        }
                        d.fecha = fechaFmt;
                        articulos.push(d);
                    });
                }
                pendientes--;
                if (pendientes === 0) {
                    abrirModalBusqueda({
                        titulo: 'Seleccionar Artículos de OR',
                        columnas: [
                            { title: 'DocRef', field: 'numeroDoc', width: 80 },
                            { title: 'Fecha', field: 'fecha', width: 100 },
                            { title: 'Código', field: 'codigo', width: 90 },
                            { title: 'Nombre', field: 'nombre' },
                            { title: 'Cant', field: 'cantidad', width: 70 },
                            { title: 'Bodega', field: 'bodega', width: 80 },
                        ],
                        data: articulos,
                        filtroCampos: ['numeroDoc', 'codigo', 'nombre'],
                        onSelect: function(row) {
                            document.getElementById('inputOR').value = row.numeroDoc || '';
                            detallesOt.push({
                                codigo: row.codigo || '',
                                nombre: row.nombre || '',
                                cantidad: Math.abs(row.cantidad || 0),
                                punit: row.punit || 0,
                                um: row.um || '',
                                bodega: row.bodega || '',
                                fecha: row.fecha || '',
                                estado: 'Abierto',
                                docref: row.numeroDoc || '',
                                tipo: '7',
                                rut: row.rut || '',
                                canttotal: row.canttotal || 0,
                            });
                            renderizarDetalleOt();
                            Toastify({text: 'Artículo de OR agregado', style: {background: '#4caf50'}}).showToast();
                        },
                        onRefresh: function(opts) { abrirModalORUnico(); },
                    });
                }
            });
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
                    { title: 'Cant', field: 'cantidad', width: 70 },
                    { title: 'Bodega', field: 'bodega', width: 80 },
                ],
                data: [],
                filtroCampos: ['numero', 'codigo'],
                onSelect: null,
                onRefresh: function(opts) { abrirModalPEUnico(); },
            });
            return;
        }
        let articulos = [];
        let pendientes = docs.length;
        docs.forEach(pe => {
            buscarXHROt('buscar_referencia', {numero: pe.numero, tipo: 6}, function(resp) {
                if (resp.success && resp.detalles) {
                    resp.detalles.forEach(d => {
                        d.numeroDoc = pe.numero;
                        let fechaFmt = '';
                        if (d.fecha) {
                            const f = (typeof d.fecha === 'string') ? d.fecha.split('T')[0] : '';
                            if (f) fechaFmt = f.split('-').reverse().join('-');
                        }
                        d.fecha = fechaFmt;
                        articulos.push(d);
                    });
                }
                pendientes--;
                if (pendientes === 0) {
                    abrirModalBusqueda({
                        titulo: 'Seleccionar Artículos de PE',
                        columnas: [
                            { title: 'DocRef', field: 'numeroDoc', width: 80 },
                            { title: 'Fecha', field: 'fecha', width: 100 },
                            { title: 'Código', field: 'codigo', width: 90 },
                            { title: 'Nombre', field: 'nombre' },
                            { title: 'Cant', field: 'cantidad', width: 70 },
                            { title: 'Bodega', field: 'bodega', width: 80 },
                        ],
                        data: articulos,
                        filtroCampos: ['numeroDoc', 'codigo', 'nombre'],
                        onSelect: function(row) {
                            document.getElementById('inputPE').value = row.numeroDoc || '';
                            detallesOt.push({
                                codigo: row.codigo || '',
                                nombre: row.nombre || '',
                                cantidad: Math.abs(row.cantidad || 0),
                                punit: row.punit || 0,
                                um: row.um || '',
                                bodega: row.bodega || '',
                                fecha: row.fecha || '',
                                estado: 'Abierto',
                                docref: row.numeroDoc || '',
                                tipo: '6',
                                rut: row.rut || '',
                                canttotal: row.canttotal || 0,
                            });
                            renderizarDetalleOt();
                            Toastify({text: 'Artículo de PE agregado', style: {background: '#4caf50'}}).showToast();
                        },
                        onRefresh: function(opts) { abrirModalPEUnico(); },
                    });
                }
            });
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
    const tablaPe = document.getElementById('tablaPeRelacionados');
    if (tablaPe) tablaPe.innerHTML = '<tr><td colspan="4" class="px-3 py-2 text-center text-aq-muted text-xs">Sin PE relacionados</td></tr>';
    const tablaVc = document.getElementById('tablaVcRelacionados');
    if (tablaVc) tablaVc.innerHTML = '<tr><td colspan="4" class="px-3 py-2 text-center text-aq-muted text-xs">Sin VC relacionados</td></tr>';
    setCamposOtEditable(true);
}

function setCamposOtEditable(editable) {
    const inputs = ['otNumero', 'otFecha', 'otEncargado', 'otProceso'];
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
        Toastify({text: 'Documento cerrado. Imposible realizar cambios.', style: {background: '#f44336'}}).showToast();
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

function abrirListaOR() {
    const proceso = document.getElementById('otProceso').value;
    buscarXHROt('listar_or', {proceso: proceso}, function(data) {
        const docs = data.documentos || [];
        let articulos = [];
        let pendientes = docs.length;
        if (pendientes === 0) {
            abrirModalBusqueda({
                titulo: 'Seleccionar Artículos de OR',
                columnas: [
                    { title: 'DocRef', field: 'numeroDoc', width: 80 },
                    { title: 'Código', field: 'codigo', width: 90 },
                    { title: 'Nombre', field: 'nombre' },
                    { title: 'Cant', field: 'cantidad', width: 70 },
                    { title: 'Bodega', field: 'bodega', width: 80 },
                ],
                data: [],
                filtroCampos: ['numeroDoc', 'codigo', 'nombre'],
                onSelect: null,
                onRefresh: function(opts) { abrirListaOR(); },
            });
            return;
        }
        docs.forEach(or => {
            buscarXHROt('buscar_referencia', {numero: or.numero, tipo: 7}, function(resp) {
                if (resp.success && resp.detalles) {
                    resp.detalles.forEach(d => {
                        d.numeroDoc = or.numero;
                        articulos.push(d);
                    });
                }
                pendientes--;
                if (pendientes === 0) {
                    abrirModalBusqueda({
                        titulo: 'Seleccionar Artículos de OR',
                        ancho: 'xl',
                        columnas: [
                            { title: 'DocRef', field: 'numeroDoc', width: 80 },
                            { title: 'Fecha', field: 'fecha', width: 100 },
                            { title: 'Código', field: 'codigo', width: 90 },
                            { title: 'Nombre', field: 'nombre' },
                            { title: 'Cant', field: 'cantidad', width: 70 },
                            { title: 'Bodega', field: 'bodega', width: 80 },
                        ],
                        data: articulos,
                        filtroCampos: ['numeroDoc', 'codigo', 'nombre'],
                        onSelect: function(row) {
                            const numsOR = [...new Set([row.numeroDoc]).filter(n => n)];
                            document.getElementById('inputOR').value = numsOR.length > 1
                                ? numsOR.join(', ')
                                : (numsOR[0] || '');
                            detallesOt.push({
                                codigo: row.codigo || '',
                                nombre: row.nombre || '',
                                cantidad: Math.abs(row.cantidad || 0),
                                punit: row.punit || 0,
                                um: row.um || '',
                                bodega: row.bodega || '',
                                fecha: row.fecha || '',
                                estado: 'Abierto',
                                docref: row.numeroDoc || '',
                                tipo: '7',
                                rut: row.rut || '',
                                canttotal: row.canttotal || 0,
                            });
                            renderizarDetalleOt();
                            Toastify({text: 'Artículo de OR agregado', style: {background: '#4caf50'}}).showToast();
                        },
                        onRefresh: function(opts) { abrirListaOR(); },
                    });
                }
            });
        });
    });
}

function abrirListaPE() {
    const proceso = document.getElementById('otProceso').value;
    buscarXHROt('listar_pe', {proceso: proceso}, function(data) {
        const docs = data.documentos || [];
        let articulos = [];
        let pendientes = docs.length;
        if (pendientes === 0) {
            abrirModalBusqueda({
                titulo: 'Seleccionar Artículos de PE',
                columnas: [
                    { title: 'DocRef', field: 'numeroDoc', width: 80 },
                    { title: 'Código', field: 'codigo', width: 90 },
                    { title: 'Nombre', field: 'nombre' },
                    { title: 'Cant', field: 'cantidad', width: 70 },
                    { title: 'Bodega', field: 'bodega', width: 80 },
                ],
                data: [],
                filtroCampos: ['numeroDoc', 'codigo', 'nombre'],
                onSelect: null,
                onRefresh: function(opts) { abrirListaPE(); },
            });
            return;
        }
        docs.forEach(pe => {
            buscarXHROt('buscar_referencia', {numero: pe.numero, tipo: 6}, function(resp) {
                if (resp.success && resp.detalles) {
                    resp.detalles.forEach(d => {
                        d.numeroDoc = pe.numero;
                        articulos.push(d);
                    });
                }
                pendientes--;
                if (pendientes === 0) {
                    abrirModalBusqueda({
                        titulo: 'Seleccionar Artículos de PE',
                        ancho: 'xl',
                        columnas: [
                            { title: 'DocRef', field: 'numeroDoc', width: 80 },
                            { title: 'Fecha', field: 'fecha', width: 100 },
                            { title: 'Código', field: 'codigo', width: 90 },
                            { title: 'Nombre', field: 'nombre' },
                            { title: 'Cant', field: 'cantidad', width: 70 },
                            { title: 'Bodega', field: 'bodega', width: 80 },
                        ],
                        data: articulos,
                        filtroCampos: ['numeroDoc', 'codigo', 'nombre'],
                        onSelect: function(row) {
                            const numsPE = [...new Set([row.numeroDoc]).filter(n => n)];
                            document.getElementById('inputPE').value = numsPE.length > 1
                                ? numsPE.join(', ')
                                : (numsPE[0] || '');
                            detallesOt.push({
                                codigo: row.codigo || '',
                                nombre: row.nombre || '',
                                cantidad: Math.abs(row.cantidad || 0),
                                punit: row.punit || 0,
                                um: row.um || '',
                                bodega: row.bodega || '',
                                fecha: row.fecha || '',
                                estado: 'Abierto',
                                docref: row.numeroDoc || '',
                                tipo: '6',
                                rut: row.rut || '',
                                canttotal: row.canttotal || 0,
                            });
                            renderizarDetalleOt();
                            Toastify({text: 'Artículo de PE agregado', style: {background: '#4caf50'}}).showToast();
                        },
                        onRefresh: function(opts) { abrirListaPE(); },
                    });
                }
            });
        });
    });
}

function renderizarDetalleOt() {
    const tbody = document.getElementById('otDetalle');
    tbody.innerHTML = '';

    if (detallesOt.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="px-3 py-4 text-center text-aq-text">Sin artículos agregados</td></tr>';
        document.getElementById('resumenEncargado').textContent = '-';
        document.getElementById('resumenProceso').textContent = '-';
        document.getElementById('resumenEstado').textContent = '-';
        document.getElementById('resumenTotalArt').textContent = '0';
        return;
    }

    let totalCant = 0;

    detallesOt.forEach((d, index) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 text-xs';
        let fechaFmt = '';
        if (d.fecha) {
            const f = (typeof d.fecha === 'string') ? d.fecha.split('T')[0] : '';
            if (f) fechaFmt = f.split('-').reverse().join('-');
        }

        totalCant += d.cantidad || 0;

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
            <td class="px-1 py-1 text-center">
                ${modoEdicionOt ? '<button onclick="eliminarArticuloOt(' + index + ')" class="text-red-500 hover:text-red-700" title="Eliminar"><i class="bx bx-trash"></i></button>' : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });

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

    if (modoEdicionOt) {
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

function cargarOt(numero) {
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
            }));
            renderizarDetalleOt();

            const seccionRelacionados = document.getElementById('seccionRelacionados');
            if (seccionRelacionados) {
                seccionRelacionados.classList.remove('hidden');
            }

            const tablaPe = document.getElementById('tablaPeRelacionados');
            if (tablaPe) {
                tablaPe.innerHTML = '';
                const peRelacionados = data.data.pe_relacionados || [];
                if (peRelacionados.length === 0) {
                    tablaPe.innerHTML = '<tr><td colspan="4" class="px-3 py-2 text-center text-aq-muted text-xs">Sin PE relacionados</td></tr>';
                } else {
                    peRelacionados.forEach(pe => {
                        const tr = document.createElement('tr');
                        tr.className = 'hover:bg-aq-surface text-xs border-b border-aq-border';
                        tr.innerHTML = `
                            <td class="px-2 py-1.5 text-aq-text">${pe.numero || ''}</td>
                            <td class="px-2 py-1.5 text-aq-text">${pe.fecha || ''}</td>
                            <td class="px-2 py-1.5 text-aq-text">${pe.encargado || ''}</td>
                            <td class="px-2 py-1.5 text-aq-text">${pe.estado || ''}</td>
                        `;
                        tablaPe.appendChild(tr);
                    });
                }
            }

            const tablaVc = document.getElementById('tablaVcRelacionados');
            if (tablaVc) {
                tablaVc.innerHTML = '';
                const vcRelacionados = data.data.vc_relacionados || [];
                if (vcRelacionados.length === 0) {
                    tablaVc.innerHTML = '<tr><td colspan="4" class="px-3 py-2 text-center text-aq-muted text-xs">Sin VC relacionados</td></tr>';
                } else {
                    vcRelacionados.forEach(vc => {
                        const tr = document.createElement('tr');
                        tr.className = 'hover:bg-aq-surface text-xs border-b border-aq-border';
                        tr.innerHTML = `
                            <td class="px-2 py-1.5 text-aq-text">${vc.numero || ''}</td>
                            <td class="px-2 py-1.5 text-aq-text">${vc.tipo || ''}</td>
                            <td class="px-2 py-1.5 text-aq-text">${vc.fecha || ''}</td>
                            <td class="px-2 py-1.5 text-aq-text">${vc.estado || ''}</td>
                        `;
                        tablaVc.appendChild(tr);
                    });
                }
            }

            if (data.data.estado === 'Cerrado' || data.data.estado === 'Terminado') {
                setCamposOtEditable(false);
                document.getElementById('btnGuardarOt').classList.add('hidden');
                document.getElementById('btnEditarOt').classList.add('hidden');
                Toastify({text: 'Documento cerrado. Solo lectura.', style: {background: '#f44336'}}).showToast();
            }
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}
