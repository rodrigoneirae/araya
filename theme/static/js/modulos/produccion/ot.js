const urlOt = (document.currentScript?.dataset.url) || '/';

let detallesOt = [];
let modoEdicionOt = false;
let callbackConfirmar = null;

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

function renderizarDropdownOR() {
    const tbody = document.getElementById('tablaDropdownOR');
    tbody.innerHTML = '';
    if (window.listaOR.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="px-2 py-2 text-center text-aq-muted">Sin registros</td></tr>';
        return;
    }
    window.listaOR.forEach(o => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            document.getElementById('dropdownOR').classList.add('hidden');
            document.getElementById('labelSelectOR').textContent = o.numero;
            seleccionarOR(o.numero);
        };
        tr.innerHTML = `
            <td class="px-2 py-1 text-aq-text text-aq-primary font-medium">${o.numero || ''}</td>
            <td class="px-2 py-1 text-aq-text">${o.fecha || ''}</td>
            <td class="px-2 py-1 text-aq-text">${o.codigo || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderizarDropdownPE() {
    const tbody = document.getElementById('tablaDropdownPE');
    tbody.innerHTML = '';
    if (window.listaPE.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="px-2 py-2 text-center text-aq-muted">Sin registros</td></tr>';
        return;
    }
    window.listaPE.forEach(o => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            document.getElementById('dropdownPE').classList.add('hidden');
            document.getElementById('labelSelectPE').textContent = o.numero;
            seleccionarPE(o.numero);
        };
        tr.innerHTML = `
            <td class="px-2 py-1 text-aq-text text-aq-primary font-medium">${o.numero || ''}</td>
            <td class="px-2 py-1 text-aq-text">${o.fecha || ''}</td>
            <td class="px-2 py-1 text-aq-text">${o.codigo || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

// === Modal OR Unico (selección única desde input) ===
let orUnicoSeleccionado = null;

function abrirModalORUnico() {
    const proceso = document.getElementById('otProceso').value;
    buscarXHROt('listar_or', {proceso: proceso}, function(data) {
        window.listaORUnico = data.documentos || [];
        document.getElementById('modalORUnico').classList.remove('hidden');
        document.getElementById('filtroORUnico').value = '';
        document.getElementById('orUnicoSeccionLista').classList.remove('hidden');
        document.getElementById('orUnicoSeccionDetalle').classList.add('hidden');
        renderizarListaORUnico(window.listaORUnico);
    });
}

function renderizarListaORUnico(lista) {
    const tbody = document.getElementById('tablaORUnico');
    tbody.innerHTML = '';
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-3 py-4 text-center text-aq-muted">Sin órdenes de requisición</td></tr>';
        return;
    }
    lista.forEach(o => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() { seleccionarORUnico(o.numero); };
        tr.innerHTML = `
            <td class="px-3 py-2 text-aq-text text-aq-primary font-medium">${o.numero || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.fecha || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.codigo || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.proceso_nombre || ''}</td>
            <td class="px-3 py-2 text-aq-text text-right">${o.cantidad || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.bodega || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

// === Funciones de selección múltiple para modalOR ===
let orSeleccionados = [];

function renderizarListaOR(lista) {
    const tbody = document.getElementById('tablaOR');
    tbody.innerHTML = '';
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-3 py-4 text-center text-aq-muted">Sin órdenes de requisición</td></tr>';
        return;
    }
    lista.forEach(o => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2';
        const checked = orSeleccionados.includes(o.numero) ? 'checked' : '';
        tr.innerHTML = `
            <td class="px-2 py-2 text-center">
                <input type="checkbox" class="w-4 h-4 rounded border-aq-border text-aq-primary focus:ring-aq-primary or-checkbox" 
                    value="${o.numero}" ${checked} onchange="toggleOR('${o.numero}', this.checked)">
            </td>
            <td class="px-3 py-2 text-aq-text text-aq-primary font-medium cursor-pointer" onclick="seleccionarOR('${o.numero}')">${o.numero || ''}</td>
            <td class="px-3 py-2 text-aq-text cursor-pointer" onclick="seleccionarOR('${o.numero}')">${o.fecha || ''}</td>
            <td class="px-3 py-2 text-aq-text cursor-pointer" onclick="seleccionarOR('${o.numero}')">${o.rut || ''}</td>
            <td class="px-3 py-2 text-aq-text cursor-pointer" onclick="seleccionarOR('${o.numero}')">${o.codigo || ''}</td>
            <td class="px-3 py-2 text-aq-text cursor-pointer" onclick="seleccionarOR('${o.numero}')">${o.proceso_nombre || ''}</td>
            <td class="px-3 py-2 text-aq-text text-right cursor-pointer" onclick="seleccionarOR('${o.numero}')">${o.cantidad || ''}</td>
            <td class="px-3 py-2 text-aq-text cursor-pointer" onclick="seleccionarOR('${o.numero}')">${o.bodega || ''}</td>
        `;
        tbody.appendChild(tr);
    });
    actualizarBotonConfirmarOR();
}

function toggleOR(idArt, checked) {
    if (checked) {
        if (!orSeleccionados.includes(idArt)) {
            orSeleccionados.push(idArt);
        }
    } else {
        orSeleccionados = orSeleccionados.filter(n => n !== idArt);
    }
    actualizarBotonConfirmarOR();
}

function toggleSelectAllOR() {
    const masterCheckbox = document.querySelector('#orSeccionLista thead input[type="checkbox"]');
    const checkboxes = document.querySelectorAll('.or-checkbox');
    const filtro = document.getElementById('filtroOR').value.toLowerCase();
    
    const filtradas = [];
    const indicesOriginales = [];
    listaArticulosOR.forEach((o, idx) => {
        if (
            ((o.docref || o.numeroOR || '').toString().toLowerCase().includes(filtro)) ||
            ((o.codigo || '').toLowerCase().includes(filtro)) ||
            ((o.nombre || '').toLowerCase().includes(filtro))
        ) {
            filtradas.push(o);
            indicesOriginales.push(idx);
        }
    });
    
    if (masterCheckbox.checked) {
        filtradas.forEach((o, idx) => {
            const idArt = `or-art-${indicesOriginales[idx]}`;
            if (!orSeleccionados.includes(idArt)) {
                orSeleccionados.push(idArt);
            }
        });
        checkboxes.forEach(cb => cb.checked = true);
    } else {
        orSeleccionados = [];
        checkboxes.forEach(cb => cb.checked = false);
    }
    actualizarBotonConfirmarOR();
}

function actualizarBotonConfirmarOR() {
    const btn = document.getElementById('btnConfirmarORMultiple');
    if (btn) {
        if (orSeleccionados.length > 0) {
            btn.classList.remove('hidden');
            btn.innerHTML = `<i class='bx bx-check'></i> Agregar seleccionados (${orSeleccionados.length})`;
        } else {
            btn.classList.add('hidden');
        }
    }
}

function confirmarSeleccionMultipleOR() {
    if (orSeleccionados.length === 0) return;
    
    const detallesTotales = [];
    
    orSeleccionados.forEach(idArt => {
        const idxOriginal = parseInt(idArt.replace('or-art-', ''));
        if (listaArticulosOR[idxOriginal]) {
            detallesTotales.push(listaArticulosOR[idxOriginal]);
        }
    });
    
    agregarDetallesOTMultiples(detallesTotales);
    document.getElementById('modalOR').classList.add('hidden');
    orSeleccionados = [];
}

function filtrarORUnico() {
    const filtro = document.getElementById('filtroORUnico').value.toLowerCase();
    const filtradas = window.listaORUnico.filter(o =>
        (o.numero && o.numero.toString().toLowerCase().includes(filtro)) ||
        (o.codigo && o.codigo.toLowerCase().includes(filtro)) ||
        (o.fecha && o.fecha.toLowerCase().includes(filtro))
    );
    renderizarListaORUnico(filtradas);
}

function seleccionarORUnico(numero) {
    buscarXHROt('buscar_referencia', {numero: numero, tipo: 7}, function(data) {
        if (data.success && data.detalles) {
            orUnicoSeleccionado = { numero: numero, detalles: data.detalles };
            document.getElementById('orUnicoSeccionLista').classList.add('hidden');
            document.getElementById('orUnicoSeccionDetalle').classList.remove('hidden');
            document.getElementById('orUnicoTituloNumero').textContent = numero;

            renderizarDetalleORUnico(data.detalles);

            const codigos = data.detalles.map(d => d.codigo).filter(c => c);
            if (codigos.length > 0) {
                cargarHistorialORUnico(codigos);
            }
        }
    });
}

function renderizarDetalleORUnico(detalles) {
    const tbody = document.getElementById('tablaORUnicoDetalle');
    tbody.innerHTML = '';
    if (detalles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-2 py-2 text-center text-aq-muted">Sin detalles</td></tr>';
        return;
    }
    window.detallesORUnico = detalles;
    detalles.forEach((d, index) => {
        let fechaFmt = '';
        if (d.fecha) {
            const f = (typeof d.fecha === 'string') ? d.fecha.split('T')[0] : '';
            if (f) fechaFmt = f.split('-').reverse().join('-');
        }
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() { agregarArticuloORUnico(index); };
        tr.innerHTML = `
            <td class="px-2 py-1.5 text-aq-text">${d.docref || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${fechaFmt}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.codigo || ''}</td>
            <td class="px-2 py-1.5 text-aq-text text-right">${d.cantidad || 0}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.bodega || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.proceso || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.estado || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function agregarArticuloORUnico(index) {
    const d = window.detallesORUnico[index];
    if (!d) return;

    document.getElementById('inputOR').value = orUnicoSeleccionado.numero;

    detallesOt.push({
        codigo: d.codigo || '',
        nombre: d.nombre || '',
        cantidad: Math.abs(d.cantidad || 0),
        punit: d.punit || 0,
        um: d.um || '',
        bodega: d.bodega || '',
        fecha: d.fecha || '',
        estado: 'Abierto',
        docref: orUnicoSeleccionado.numero,
        tipo: '7',
        rut: d.rut || '',
        canttotal: d.canttotal || 0,
    });

    renderizarDetalleOt();
    Toastify({text: 'Artículo de OR agregado', style: {background: '#4caf50'}}).showToast();

    document.getElementById('modalORUnico').classList.add('hidden');
    orUnicoSeleccionado = null;
}

function cargarHistorialORUnico(codigos) {
    buscarXHROt('historial_articulo', {codigos: codigos}, function(data) {
        renderizarHistorialORUnico(data.historial || [], data.suma_saldo || 0);
    });
}

function renderizarHistorialORUnico(historial, sumaSaldo) {
    const tbody = document.getElementById('tablaORUnicoHistorial');
    tbody.innerHTML = '';
    if (historial.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-2 py-2 text-center text-aq-muted">Sin historial para estos artículos</td></tr>';
        return;
    }
    historial.forEach(h => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2';
        tr.innerHTML = `
            <td class="px-2 py-1.5 text-aq-text">${h.codigo || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.descr || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.fecha || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.numero || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.tipo || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.bodega || ''}</td>
            <td class="px-2 py-1.5 text-aq-text text-right">${h.cantidad || 0}</td>
            <td class="px-2 py-1.5 text-aq-text text-right font-semibold text-aq-primary">${h.saldo || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

function volverListaORUnico() {
    orUnicoSeleccionado = null;
    document.getElementById('orUnicoSeccionLista').classList.remove('hidden');
    document.getElementById('orUnicoSeccionDetalle').classList.add('hidden');
}

function cerrarModalORUnico() {
    document.getElementById('modalORUnico').classList.add('hidden');
    orUnicoSeleccionado = null;
    orUnicoSeleccionados = [];
    document.getElementById('filtroORUnico').value = '';
    const masterCheckbox = document.querySelector('#orUnicoSeccionLista thead input[type="checkbox"]');
    if (masterCheckbox) masterCheckbox.checked = false;
}

// === Modal PE Unico (selección única desde input) ===
let peUnicoSeleccionado = null;

function abrirModalPEUnico() {
    const proceso = document.getElementById('otProceso').value;
    buscarXHROt('listar_pe', {proceso: proceso}, function(data) {
        window.listaPEUnico = data.documentos || [];
        document.getElementById('modalPEUnico').classList.remove('hidden');
        document.getElementById('filtroPEUnico').value = '';
        document.getElementById('peUnicoSeccionLista').classList.remove('hidden');
        document.getElementById('peUnicoSeccionDetalle').classList.add('hidden');
        renderizarListaPEUnico(window.listaPEUnico);
    });
}

function renderizarListaPEUnico(lista) {
    const tbody = document.getElementById('tablaPEUnico');
    tbody.innerHTML = '';
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-3 py-4 text-center text-aq-muted">Sin partes de entrada</td></tr>';
        return;
    }
    lista.forEach(o => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() { seleccionarPEUnico(o.numero); };
        tr.innerHTML = `
            <td class="px-3 py-2 text-aq-text text-aq-primary font-medium">${o.numero || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.fecha || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.codigo || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.proceso_nombre || ''}</td>
            <td class="px-3 py-2 text-aq-text text-right">${o.cantidad || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.bodega || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarPEUnico() {
    const filtro = document.getElementById('filtroPEUnico').value.toLowerCase();
    const filtradas = window.listaPEUnico.filter(o =>
        (o.numero && o.numero.toString().toLowerCase().includes(filtro)) ||
        (o.codigo && o.codigo.toLowerCase().includes(filtro)) ||
        (o.fecha && o.fecha.toLowerCase().includes(filtro))
    );
    renderizarListaPEUnico(filtradas);
}

function seleccionarPEUnico(numero) {
    buscarXHROt('buscar_referencia', {numero: numero, tipo: 6}, function(data) {
        if (data.success && data.detalles) {
            peUnicoSeleccionado = { numero: numero, detalles: data.detalles };
            document.getElementById('peUnicoSeccionLista').classList.add('hidden');
            document.getElementById('peUnicoSeccionDetalle').classList.remove('hidden');
            document.getElementById('peUnicoTituloNumero').textContent = numero;

            renderizarDetallePEUnico(data.detalles);

            const codigos = data.detalles.map(d => d.codigo).filter(c => c);
            if (codigos.length > 0) {
                cargarHistorialPEUnico(codigos);
            }
        }
    });
}

function renderizarDetallePEUnico(detalles) {
    const tbody = document.getElementById('tablaPEUnicoDetalle');
    tbody.innerHTML = '';
    if (detalles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-2 py-2 text-center text-aq-muted">Sin detalles</td></tr>';
        return;
    }
    window.detallesPEUnico = detalles;
    detalles.forEach((d, index) => {
        let fechaFmt = '';
        if (d.fecha) {
            const f = (typeof d.fecha === 'string') ? d.fecha.split('T')[0] : '';
            if (f) fechaFmt = f.split('-').reverse().join('-');
        }
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() { agregarArticuloPEUnico(index); };
        tr.innerHTML = `
            <td class="px-2 py-1.5 text-aq-text">${d.docref || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${fechaFmt}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.codigo || ''}</td>
            <td class="px-2 py-1.5 text-aq-text text-right">${d.cantidad || 0}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.bodega || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.proceso || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.estado || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function agregarArticuloPEUnico(index) {
    const d = window.detallesPEUnico[index];
    if (!d) return;

    document.getElementById('inputPE').value = peUnicoSeleccionado.numero;

    detallesOt.push({
        codigo: d.codigo || '',
        nombre: d.nombre || '',
        cantidad: Math.abs(d.cantidad || 0),
        punit: d.punit || 0,
        um: d.um || '',
        bodega: d.bodega || '',
        fecha: d.fecha || '',
        estado: 'Abierto',
        docref: peUnicoSeleccionado.numero,
        tipo: '6',
        rut: d.rut || '',
        canttotal: d.canttotal || 0,
    });

    renderizarDetalleOt();
    Toastify({text: 'Artículo de PE agregado', style: {background: '#4caf50'}}).showToast();

    document.getElementById('modalPEUnico').classList.add('hidden');
    peUnicoSeleccionado = null;
}

function cargarHistorialPEUnico(codigos) {
    buscarXHROt('historial_articulo', {codigos: codigos}, function(data) {
        renderizarHistorialPEUnico(data.historial || [], data.suma_saldo || 0);
    });
}

function renderizarHistorialPEUnico(historial, sumaSaldo) {
    const tbody = document.getElementById('tablaPEUnicoHistorial');
    tbody.innerHTML = '';
    if (historial.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-2 py-2 text-center text-aq-muted">Sin historial para estos artículos</td></tr>';
        return;
    }
    historial.forEach(h => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2';
        tr.innerHTML = `
            <td class="px-2 py-1.5 text-aq-text">${h.codigo || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.descr || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.fecha || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.numero || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.tipo || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.bodega || ''}</td>
            <td class="px-2 py-1.5 text-aq-text text-right">${h.cantidad || 0}</td>
            <td class="px-2 py-1.5 text-aq-text text-right font-semibold text-aq-primary">${h.saldo || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

function volverListaPEUnico() {
    peUnicoSeleccionado = null;
    document.getElementById('peUnicoSeccionLista').classList.remove('hidden');
    document.getElementById('peUnicoSeccionDetalle').classList.add('hidden');
}

function cerrarModalPEUnico() {
    document.getElementById('modalPEUnico').classList.add('hidden');
    peUnicoSeleccionado = null;
}

function nuevaOt() {
    document.getElementById('otForm').reset();
    detallesOt = [];
    modoEdicionOt = true;
    renderizarDetalleOt();
    const fecha = new Date().toISOString().split('T')[0];
    document.getElementById('otFecha').value = fecha;
    document.getElementById('otEstado').value = 'Abierto';
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
    setCamposOtEditable(true);
}

function setCamposOtEditable(editable) {
    const inputs = ['otNumero', 'otFecha', 'otEncargado', 'otProceso', 'otEstado'];
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
    mostrarConfirmar('Eliminar OT', '¿Está seguro de eliminar esta Orden de Trabajo y todos sus movimientos?', function() {
        buscarXHROt('eliminar', {numero: numero}, function(data) {
            if (data.success) {
                Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                nuevaOt();
            } else {
                Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
            }
        });
    });
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
    fetch('', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.blob())
    .then(blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    })
    .catch(err => {
        Toastify({text: 'Error al generar PDF', style: {background: '#f44336'}}).showToast();
    });
}

// === Referencia OR (tipo 7) ===
let orSeleccionado = null;
let listaArticulosOR = [];

function abrirListaOR() {
    const proceso = document.getElementById('otProceso').value;
    orSeleccionados = [];
    buscarXHROt('listar_or', {proceso: proceso}, function(data) {
        window.listaOR = data.documentos || [];
        listaArticulosOR = [];
        let cargaPendiente = window.listaOR.length;
        if (cargaPendiente === 0) {
            renderizarListaORArticulos([]);
            document.getElementById('modalOR').classList.remove('hidden');
            return;
        }
        window.listaOR.forEach(or => {
            buscarXHROt('buscar_referencia', {numero: or.numero, tipo: 7}, function(resp) {
                if (resp.success && resp.detalles) {
                    resp.detalles.forEach(d => {
                        d.numeroOR = or.numero;
                        listaArticulosOR.push(d);
                    });
                }
                cargaPendiente--;
                if (cargaPendiente === 0) {
                    document.getElementById('modalOR').classList.remove('hidden');
                    document.getElementById('filtroOR').value = '';
                    document.getElementById('orSeccionLista').classList.remove('hidden');
                    document.getElementById('orSeccionDetalle').classList.add('hidden');
                    document.getElementById('orFooterLista').classList.remove('hidden');
                    renderizarListaORArticulos(listaArticulosOR);
                }
            });
        });
    });
}

function renderizarListaORArticulos(lista, indicesOriginales = null) {
    const tbody = document.getElementById('tablaOR');
    tbody.innerHTML = '';
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-3 py-4 text-center text-aq-muted">Sin artículos disponibles</td></tr>';
        return;
    }
    lista.forEach((o, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2';
        const idxOriginal = indicesOriginales ? indicesOriginales[idx] : idx;
        const idArt = `or-art-${idxOriginal}`;
        const checked = orSeleccionados.includes(idArt) ? 'checked' : '';
        let fechaFmt = '';
        if (o.fecha) {
            const f = (typeof o.fecha === 'string') ? o.fecha.split('T')[0] : '';
            if (f) fechaFmt = f.split('-').reverse().join('-');
        }
        tr.innerHTML = `
            <td class="px-2 py-2 text-center">
                <input type="checkbox" class="w-4 h-4 rounded border-aq-border text-aq-primary focus:ring-aq-primary or-checkbox" 
                    data-idx="${idxOriginal}" ${checked} onchange="toggleOR('${idArt}', this.checked)">
            </td>
            <td class="px-3 py-2 text-aq-text text-aq-primary font-medium">${o.docref || o.numeroOR || ''}</td>
            <td class="px-3 py-2 text-aq-text">${fechaFmt}</td>
            <td class="px-3 py-2 text-aq-text">${o.codigo || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.nombre || ''}</td>
            <td class="px-3 py-2 text-aq-text text-right">${o.cantidad || 0}</td>
            <td class="px-3 py-2 text-aq-text">${o.bodega || ''}</td>
        `;
        tbody.appendChild(tr);
    });
    actualizarBotonConfirmarOR();
}

function filtrarORArticulos() {
    const filtro = document.getElementById('filtroOR').value.toLowerCase();
    const filtradas = [];
    const indicesOriginales = [];
    listaArticulosOR.forEach((o, idx) => {
        if (
            ((o.docref || o.numeroOR || '').toString().toLowerCase().includes(filtro)) ||
            ((o.codigo || '').toLowerCase().includes(filtro)) ||
            ((o.nombre || '').toLowerCase().includes(filtro))
        ) {
            filtradas.push(o);
            indicesOriginales.push(idx);
        }
    });
    renderizarListaORArticulos(filtradas, indicesOriginales);
}

function renderizarListaOR(lista) {
    const tbody = document.getElementById('tablaOR');
    tbody.innerHTML = '';
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-3 py-4 text-center text-aq-muted">Sin órdenes de requisición</td></tr>';
        return;
    }
    lista.forEach(o => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() { seleccionarOR(o.numero); };
        tr.innerHTML = `
            <td class="px-3 py-2 text-aq-text">${o.numero || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.fecha || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.rut || ''}</td>
            <td class="px-3 py-2 text-aq-text text-aq-primary font-medium">${o.codigo || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.proceso_nombre || ''}</td>
            <td class="px-3 py-2 text-aq-text text-right">${o.cantidad || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.bodega || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarOR() {
    const filtro = document.getElementById('filtroOR').value.toLowerCase();
    const filtradas = window.listaOR.filter(o =>
        (o.numero && o.numero.toString().toLowerCase().includes(filtro)) ||
        (o.rut && o.rut.toLowerCase().includes(filtro)) ||
        (o.codigo && o.codigo.toLowerCase().includes(filtro)) ||
        (o.proceso_nombre && o.proceso_nombre.toLowerCase().includes(filtro))
    );
    renderizarListaOR(filtradas);
}

function seleccionarOR(numero) {
    buscarXHROt('buscar_referencia', {numero: numero, tipo: 7}, function(data) {
        if (data.success && data.detalles) {
            orSeleccionado = { numero: numero, detalles: data.detalles };
            document.getElementById('orSeccionLista').classList.add('hidden');
            document.getElementById('orSeccionDetalle').classList.remove('hidden');
            document.getElementById('orFooterLista').classList.add('hidden');
            document.getElementById('orTituloNumero').textContent = numero;
            
            renderizarDetalleOR(data.detalles);
            
            const codigos = data.detalles.map(d => d.codigo).filter(c => c);
            if (codigos.length > 0) {
                cargarHistorialArticuloOR(codigos);
            }
        }
    });
}

function renderizarDetalleOR(detalles) {
    const tbody = document.getElementById('tablaORDetalle');
    tbody.innerHTML = '';
    if (detalles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="px-2 py-2 text-center text-aq-muted">Sin detalles</td></tr>';
        return;
    }
    detalles.forEach(d => {
        let fechaFmt = '';
        if (d.fecha) {
            const f = (typeof d.fecha === 'string') ? d.fecha.split('T')[0] : '';
            if (f) fechaFmt = f.split('-').reverse().join('-');
        }
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2';
        tr.innerHTML = `
            <td class="px-2 py-1.5 text-aq-text">${d.docref || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${fechaFmt}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.rut || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.codigo || ''}</td>
            <td class="px-2 py-1.5 text-aq-text text-right">${d.cantidad || 0}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.bodega || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.proceso || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.encargado || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.estado || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function cargarHistorialArticuloOR(codigos) {
    console.log('cargarHistorialArticuloOR codigos:', codigos);
    buscarXHROt('historial_articulo', {codigos: codigos}, function(data) {
        console.log('historial response:', data);
        renderizarHistorialOR(data.historial || [], data.suma_saldo || 0);
    });
}

function renderizarHistorialOR(historial, sumaSaldo) {
    const tbody = document.getElementById('tablaORHistorial');
    tbody.innerHTML = '';
    if (historial.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-2 py-2 text-center text-aq-muted">Sin historial para estos artículos</td></tr>';
        return;
    }
    historial.forEach(h => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2';
        tr.innerHTML = `
            <td class="px-2 py-1.5 text-aq-text">${h.codigo || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.descr || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.fecha || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.numero || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.tipo || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.bodega || ''}</td>
            <td class="px-2 py-1.5 text-aq-text text-right">${h.cantidad || 0}</td>
            <td class="px-2 py-1.5 text-aq-text text-right font-semibold text-aq-primary">${h.saldo || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

function volverListaOR() {
    orSeleccionado = null;
    document.getElementById('orSeccionLista').classList.remove('hidden');
    document.getElementById('orSeccionDetalle').classList.add('hidden');
    document.getElementById('orFooterLista').classList.remove('hidden');
}

function confirmarAgregarOR() {
    if (!orSeleccionado || !orSeleccionado.detalles) return;

    document.getElementById('inputOR').value = orSeleccionado.numero;

    orSeleccionado.detalles.forEach(d => {
        detallesOt.push({
            codigo: d.codigo || '',
            nombre: d.nombre || '',
            cantidad: Math.abs(d.cantidad || 0),
            punit: d.punit || 0,
            um: d.um || '',
            bodega: d.bodega || '',
            fecha: d.fecha || '',
            estado: 'Abierto',
            docref: orSeleccionado.numero,
            tipo: '7',
            rut: d.rut || '',
            canttotal: d.canttotal || 0,
        });
    });

    renderizarDetalleOt();
    Toastify({text: 'Detalles de OR agregados', style: {background: '#4caf50'}}).showToast();

    document.getElementById('modalOR').classList.add('hidden');
    orSeleccionado = null;
}

function agregarDetallesOTMultiples(detalles) {
    if (!detalles || detalles.length === 0) return;

    const numsOR = [...new Set(detalles.map(d => d.numeroOR).filter(n => n))];
    document.getElementById('inputOR').value = numsOR.length > 1 
        ? numsOR.join(', ') 
        : (numsOR[0] || '');

    detalles.forEach(d => {
        detallesOt.push({
            codigo: d.codigo || '',
            nombre: d.nombre || '',
            cantidad: Math.abs(d.cantidad || 0),
            punit: d.punit || 0,
            um: d.um || '',
            bodega: d.bodega || '',
            fecha: d.fecha || '',
            estado: 'Abierto',
            docref: d.numeroOR || '',
            tipo: '7',
            rut: d.rut || '',
            canttotal: d.canttotal || 0,
        });
    });

    renderizarDetalleOt();
    Toastify({text: `${detalles.length} artículos agregados`, style: {background: '#4caf50'}}).showToast();
}

// === Referencia PE (tipo 6) ===
let peSeleccionado = null;
let peSeleccionados = [];
let listaArticulosPE = [];

function abrirListaPE() {
    const proceso = document.getElementById('otProceso').value;
    peSeleccionados = [];
    buscarXHROt('listar_pe', {proceso: proceso}, function(data) {
        window.listaPE = data.documentos || [];
        listaArticulosPE = [];
        let cargaPendiente = window.listaPE.length;
        if (cargaPendiente === 0) {
            renderizarListaPEArticulos([]);
            document.getElementById('modalPE').classList.remove('hidden');
            return;
        }
        window.listaPE.forEach(pe => {
            buscarXHROt('buscar_referencia', {numero: pe.numero, tipo: 6}, function(resp) {
                if (resp.success && resp.detalles) {
                    resp.detalles.forEach(d => {
                        d.numeroPE = pe.numero;
                        listaArticulosPE.push(d);
                    });
                }
                cargaPendiente--;
                if (cargaPendiente === 0) {
                    document.getElementById('modalPE').classList.remove('hidden');
                    document.getElementById('filtroPE').value = '';
                    document.getElementById('peSeccionLista').classList.remove('hidden');
                    document.getElementById('peSeccionDetalle').classList.add('hidden');
                    document.getElementById('peFooterLista').classList.remove('hidden');
                    renderizarListaPEArticulos(listaArticulosPE);
                }
            });
        });
    });
}

function renderizarListaPEArticulos(lista, indicesOriginales = null) {
    const tbody = document.getElementById('tablaPE');
    tbody.innerHTML = '';
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-3 py-4 text-center text-aq-muted">Sin artículos disponibles</td></tr>';
        return;
    }
    lista.forEach((o, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2';
        const idxOriginal = indicesOriginales ? indicesOriginales[idx] : idx;
        const idArt = `pe-art-${idxOriginal}`;
        const checked = peSeleccionados.includes(idArt) ? 'checked' : '';
        let fechaFmt = '';
        if (o.fecha) {
            const f = (typeof o.fecha === 'string') ? o.fecha.split('T')[0] : '';
            if (f) fechaFmt = f.split('-').reverse().join('-');
        }
        tr.innerHTML = `
            <td class="px-2 py-2 text-center">
                <input type="checkbox" class="w-4 h-4 rounded border-aq-border text-aq-primary focus:ring-aq-primary pe-checkbox" 
                    data-idx="${idxOriginal}" ${checked} onchange="togglePE('${idArt}', this.checked)">
            </td>
            <td class="px-3 py-2 text-aq-text text-aq-primary font-medium">${o.docref || o.numeroPE || ''}</td>
            <td class="px-3 py-2 text-aq-text">${fechaFmt}</td>
            <td class="px-3 py-2 text-aq-text">${o.codigo || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.nombre || ''}</td>
            <td class="px-3 py-2 text-aq-text text-right">${o.cantidad || 0}</td>
            <td class="px-3 py-2 text-aq-text">${o.bodega || ''}</td>
        `;
        tbody.appendChild(tr);
    });
    actualizarBotonConfirmarPE();
}

function filtrarPEArticulos() {
    const filtro = document.getElementById('filtroPE').value.toLowerCase();
    const filtradas = [];
    const indicesOriginales = [];
    listaArticulosPE.forEach((o, idx) => {
        if (
            ((o.docref || o.numeroPE || '').toString().toLowerCase().includes(filtro)) ||
            ((o.codigo || '').toLowerCase().includes(filtro)) ||
            ((o.nombre || '').toLowerCase().includes(filtro))
        ) {
            filtradas.push(o);
            indicesOriginales.push(idx);
        }
    });
    renderizarListaPEArticulos(filtradas, indicesOriginales);
}

function togglePE(idArt, checked) {
    if (checked) {
        if (!peSeleccionados.includes(idArt)) {
            peSeleccionados.push(idArt);
        }
    } else {
        peSeleccionados = peSeleccionados.filter(n => n !== idArt);
    }
    actualizarBotonConfirmarPE();
}

function toggleSelectAllPE() {
    const masterCheckbox = document.querySelector('#peSeccionLista thead input[type="checkbox"]');
    const checkboxes = document.querySelectorAll('.pe-checkbox');
    const filtro = document.getElementById('filtroPE').value.toLowerCase();
    
    const filtradas = [];
    const indicesOriginales = [];
    listaArticulosPE.forEach((o, idx) => {
        if (
            ((o.docref || o.numeroPE || '').toString().toLowerCase().includes(filtro)) ||
            ((o.codigo || '').toLowerCase().includes(filtro)) ||
            ((o.nombre || '').toLowerCase().includes(filtro))
        ) {
            filtradas.push(o);
            indicesOriginales.push(idx);
        }
    });
    
    if (masterCheckbox.checked) {
        filtradas.forEach((o, idx) => {
            const idArt = `pe-art-${indicesOriginales[idx]}`;
            if (!peSeleccionados.includes(idArt)) {
                peSeleccionados.push(idArt);
            }
        });
        checkboxes.forEach(cb => cb.checked = true);
    } else {
        peSeleccionados = [];
        checkboxes.forEach(cb => cb.checked = false);
    }
    actualizarBotonConfirmarPE();
}

function actualizarBotonConfirmarPE() {
    const btn = document.getElementById('btnConfirmarPEMultiple');
    if (btn) {
        if (peSeleccionados.length > 0) {
            btn.classList.remove('hidden');
            btn.innerHTML = `<i class='bx bx-check'></i> Agregar seleccionados (${peSeleccionados.length})`;
        } else {
            btn.classList.add('hidden');
        }
    }
}

function confirmarSeleccionMultiplePE() {
    if (peSeleccionados.length === 0) return;
    
    const detallesTotales = [];
    
    peSeleccionados.forEach(idArt => {
        const idxOriginal = parseInt(idArt.replace('pe-art-', ''));
        if (listaArticulosPE[idxOriginal]) {
            detallesTotales.push(listaArticulosPE[idxOriginal]);
        }
    });
    
    agregarDetallesPEMultiples(detallesTotales);
    document.getElementById('modalPE').classList.add('hidden');
    peSeleccionados = [];
}

function agregarDetallesPEMultiples(detalles) {
    if (!detalles || detalles.length === 0) return;

    const numsPE = [...new Set(detalles.map(d => d.numeroPE).filter(n => n))];
    document.getElementById('inputPE').value = numsPE.length > 1 
        ? numsPE.join(', ') 
        : (numsPE[0] || '');

    detalles.forEach(d => {
        detallesOt.push({
            codigo: d.codigo || '',
            nombre: d.nombre || '',
            cantidad: Math.abs(d.cantidad || 0),
            punit: d.punit || 0,
            um: d.um || '',
            bodega: d.bodega || '',
            fecha: d.fecha || '',
            estado: 'Abierto',
            docref: d.numeroPE || '',
            tipo: '6',
            rut: d.rut || '',
            canttotal: d.canttotal || 0,
        });
    });

    renderizarDetalleOt();
    Toastify({text: `${detalles.length} artículos agregados`, style: {background: '#4caf50'}}).showToast();
}

function renderizarDetallePE(detalles) {
    const tbody = document.getElementById('tablaPEDetalle');
    tbody.innerHTML = '';
    if (detalles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="px-2 py-2 text-center text-aq-muted">Sin detalles</td></tr>';
        return;
    }
    detalles.forEach(d => {
        let fechaFmt = '';
        if (d.fecha) {
            const f = (typeof d.fecha === 'string') ? d.fecha.split('T')[0] : '';
            if (f) fechaFmt = f.split('-').reverse().join('-');
        }
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2';
        tr.innerHTML = `
            <td class="px-2 py-1.5 text-aq-text">${d.docref || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${fechaFmt}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.rut || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.codigo || ''}</td>
            <td class="px-2 py-1.5 text-aq-text text-right">${d.cantidad || 0}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.bodega || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.proceso || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.encargado || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${d.estado || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function cargarHistorialArticuloPE(codigos) {
    buscarXHROt('historial_articulo', {codigos: codigos}, function(data) {
        renderizarHistorialPE(data.historial || [], data.suma_saldo || 0);
    });
}

function renderizarHistorialPE(historial, sumaSaldo) {
    const tbody = document.getElementById('tablaPEHistorial');
    tbody.innerHTML = '';
    if (historial.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-2 py-2 text-center text-aq-muted">Sin historial para estos artículos</td></tr>';
        return;
    }
    historial.forEach(h => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2';
        tr.innerHTML = `
            <td class="px-2 py-1.5 text-aq-text">${h.codigo || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.descr || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.fecha || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.numero || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.tipo || ''}</td>
            <td class="px-2 py-1.5 text-aq-text">${h.bodega || ''}</td>
            <td class="px-2 py-1.5 text-aq-text text-right">${h.cantidad || 0}</td>
            <td class="px-2 py-1.5 text-aq-text text-right font-semibold text-aq-primary">${h.saldo || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

function volverListaPE() {
    peSeleccionado = null;
    document.getElementById('peSeccionLista').classList.remove('hidden');
    document.getElementById('peSeccionDetalle').classList.add('hidden');
    document.getElementById('peFooterLista').classList.remove('hidden');
}

function confirmarAgregarPE() {
    if (!peSeleccionado || !peSeleccionado.detalles) return;

    document.getElementById('inputPE').value = peSeleccionado.numero;

    peSeleccionado.detalles.forEach(d => {
        detallesOt.push({
            codigo: d.codigo || '',
            nombre: d.nombre || '',
            cantidad: Math.abs(d.cantidad || 0),
            punit: d.punit || 0,
            um: d.um || '',
            bodega: d.bodega || '',
            fecha: d.fecha || '',
            estado: 'Abierto',
            docref: peSeleccionado.numero,
            tipo: '6',
            rut: d.rut || '',
            canttotal: d.canttotal || 0,
        });
    });

    renderizarDetalleOt();
    Toastify({text: 'Detalles de PE agregados', style: {background: '#4caf50'}}).showToast();

    document.getElementById('modalPE').classList.add('hidden');
    peSeleccionado = null;
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
                ${modoEdicionOt ? `
                <button onclick="eliminarArticuloOt(${index})" class="text-red-500 hover:text-red-700" title="Eliminar"><i class="bx bx-trash"></i></button>
                ` : ''}
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
    const encargado = document.getElementById('otEncargado').value;
    const proceso = document.getElementById('otProceso').value;
    const estado = document.getElementById('otEstado').value;
    const fecha = document.getElementById('otFecha').value;
    const numero = document.getElementById('otNumero').value;

    if (!encargado) {
        Toastify({text: 'Debe ingresar un encargado', style: {background: '#f44336'}}).showToast();
        return;
    }
    if (!proceso) {
        Toastify({text: 'Debe ingresar un proceso', style: {background: '#f44336'}}).showToast();
        return;
    }

    mostrarConfirmar('Guardar OT', '¿Está seguro de guardar esta Orden de Trabajo?\n\nLos artículos referenciados serán marcados como Cerrados.', function() {
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
    });
}

function buscarOt() {
    buscarXHROt('listar_ot', {}, function(data) {
        window.listaOt = data.ot || [];
        document.getElementById('modalBusquedaOt').classList.remove('hidden');
        renderizarBusquedaOt(window.listaOt);
    });
}

function renderizarBusquedaOt(lista) {
    const tbody = document.getElementById('tablaBusquedaOt');
    tbody.innerHTML = '';
    lista.forEach(o => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() { cargarOt(o.numero); };
        tr.innerHTML = `
            <td class="px-3 py-2 text-aq-text">${o.numero || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.fecha || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.encargado_nombre || o.encargado || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.proceso_nombre || o.proceso || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.estado || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarOt() {
    const filtro = document.getElementById('filtroBusquedaOt').value.toLowerCase();
    const filtradas = window.listaOt.filter(o =>
        (o.numero && o.numero.toString().includes(filtro)) ||
        (o.encargado_nombre && o.encargado_nombre.toLowerCase().includes(filtro)) ||
        (o.proceso_nombre && o.proceso_nombre.toLowerCase().includes(filtro))
    );
    renderizarBusquedaOt(filtradas);
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
            document.getElementById('modalBusquedaOt').classList.add('hidden');
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
            }

            document.getElementById('otEstado').value = data.data.estado || 'Abierto';

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