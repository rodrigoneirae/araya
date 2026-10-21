const urlVC = (document.currentScript?.dataset.url) || '/';

let detallesVC = [];
let modoEdicionVC = false;

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('vcArtCod').addEventListener('input', function() {
        document.getElementById('vcArtNombre').value = '';
        document.getElementById('vcArtUM').value = '';
        document.getElementById('vcArtTipo').value = '';
    });
    document.getElementById('vcArtCod').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') buscarArticuloVCInput();
    });
    buscarXHRVC('listar_bodegas', {}, function(data) {
        const select = document.getElementById('vcArtBodega');
        (data.bodegas || []).forEach(b => {
            const option = document.createElement('option');
            option.value = b.cod;
            option.textContent = b.nombre;
            select.appendChild(option);
        });
    });
    nuevaVC();
});

function buscarXHRVC(action, datos, callback) {
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
    console.log('XHR request:', action, datos);
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
        console.log('XHR response:', action, data);
        callback(data);
    })
    .catch(err => {
        console.error('Error:', err);
        Toastify({text: 'Error: ' + err.message, style: {background: '#f44336'}}).showToast();
    });
}

function agregarArticuloVC() {
    const cod = document.getElementById('vcArtCod').value.trim();
    const nombre = document.getElementById('vcArtNombre').value.trim();
    const um = document.getElementById('vcArtUM').value.trim();
    const tipo = document.getElementById('vcArtTipo').value.trim();
    const cant = parseFloat(document.getElementById('vcArtCant').value) || 0;
    const bodega = document.getElementById('vcArtBodega').value;
    const fecha = document.getElementById('vcArtFecha').value;

    if (!cod || !nombre) {
        Toastify({text: 'Seleccione un artículo válido', style: {background: '#f44336'}}).showToast();
        return;
    }
    if (cant <= 0) {
        Toastify({text: 'Ingrese cantidad', style: {background: '#f44336'}}).showToast();
        return;
    }

    detallesVC.push({
        codigo__codigo: cod,
        codigo__descr: nombre,
        codigo__um: um,
        codigo__tipo: tipo,
        cantidad: cant,
        bodega: bodega,
        fecha: fecha,
        estado: 'Abierto'
    });

    document.getElementById('vcArtCod').value = '';
    document.getElementById('vcArtNombre').value = '';
    document.getElementById('vcArtUM').value = '';
    document.getElementById('vcArtTipo').value = '';
    document.getElementById('vcArtCant').value = '';
    document.getElementById('vcArtBodega').value = '';
    document.getElementById('vcArtCod').focus();

    renderizarDetalleVC();
}

function eliminarArticuloVC(index) {
    detallesVC.splice(index, 1);
    renderizarDetalleVC();
}

function editarDetalleVC(index) {
    detallesVC[index]._editing = true;
    renderizarDetalleVC();
}

function guardarEditDetalleVC(index) {
    const det = detallesVC[index];
    det.cantidad = parseFloat(document.getElementById(`edit-cantidad-${index}`).value) || 0;
    det.bodega = document.getElementById(`edit-bodega-${index}`).value;
    det.fecha = document.getElementById(`edit-fecha-${index}`).value;
    delete det._editing;
    renderizarDetalleVC();
}

function cancelarEditDetalleVC(index) {
    delete detallesVC[index]._editing;
    renderizarDetalleVC();
}

function setCamposVCEditable(editable) {
    const inputs = ['vcFecha', 'vcArtCod', 'vcArtCant', 'vcArtFecha'];
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
    const bodega = document.getElementById('vcArtBodega');
    if (bodega) bodega.disabled = !editable;

    const artBtn = document.querySelector('#vcArtCod + button');
    if (artBtn) artBtn.disabled = !editable;
    const agregarBtn = document.querySelector('#contenido-detalle button[onclick="agregarArticuloVC()"]');
    if (agregarBtn) agregarBtn.disabled = !editable;

    modoEdicionVC = editable;
    renderizarDetalleVC();
}

function nuevaVC() {
    document.getElementById('vcForm').reset();
    ['vcArtCod', 'vcArtNombre', 'vcArtUM', 'vcArtTipo', 'vcArtCant'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('vcArtBodega').value = '';
    if (window.tablaHistorialVC) {
        window.tablaHistorialVC.destroy();
        window.tablaHistorialVC = null;
    }
    document.getElementById('historialArticulo').replaceChildren();
    detallesVC = [];
    modoEdicionVC = true;
    renderizarDetalleVC();
    const fecha = new Date().toISOString().split('T')[0];
    document.getElementById('vcFecha').value = fecha;
    document.getElementById('vcArtFecha').value = fecha;
    document.getElementById('tab-detalle').classList.remove('hidden');
    document.getElementById('contenido-detalle').classList.add('hidden');
    document.getElementById('tab-encabezado').classList.add('active');
    document.getElementById('contenido-encabezado').classList.remove('hidden');
    document.getElementById('btnGuardarVC').classList.remove('hidden');
    document.getElementById('btnEliminarVC').classList.add('hidden');
    document.getElementById('btnEditarVC').classList.add('hidden');
    setCamposVCEditable(true);
}

function editarVC() {
    if (!document.getElementById('vcNumero').value.trim()) {
        Toastify({text: 'No hay Vale de Consumo seleccionado', style: {background: '#f44336'}}).showToast();
        return;
    }
    setCamposVCEditable(true);
    document.getElementById('btnGuardarVC').classList.remove('hidden');
    document.getElementById('btnEliminarVC').classList.add('hidden');
    document.getElementById('btnEditarVC').classList.add('hidden');
    cambiarTabVC('detalle');
}

function eliminarVC() {
    const numero = document.getElementById('vcNumero').value.trim();
    if (!numero) {
        Toastify({text: 'No hay Vale de Consumo seleccionado', style: {background: '#f44336'}}).showToast();
        return;
    }
    if (!confirm('¿Está seguro de eliminar este Vale de Consumo?')) {
        return;
    }
    buscarXHRVC('eliminar', {numero: numero}, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            nuevaVC();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function renderizarDetalleVC() {
    const tbody = document.getElementById('vcDetalle');
    tbody.innerHTML = '';
    
    if (detallesVC.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-3 py-4 text-center text-aq-text">Sin artículos agregados</td></tr>';
        return;
    }

    detallesVC.forEach((d, index) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 text-xs';
        let fechaFmt = '';
        if (d.fecha) {
            const f = d.fecha.split('T')[0];
            if (f) fechaFmt = f.split('-').reverse().join('-');
        }

        if (d._editing === true) {
            tr.innerHTML = `
                <td class="px-1 py-1">
                    <input type="date" id="edit-fecha-${index}" value="${(d.fecha || '').split('T')[0]}" class="w-full px-1 py-1 border border-aq-border bg-aq-bg text-aq-text text-xs">
                </td>
                <td class="px-1 py-1 text-aq-text">${d.codigo__codigo || ''}</td>
                <td class="px-1 py-1 text-aq-text">${d.codigo__descr || ''}</td>
                <td class="px-1 py-1">
                    <input type="number" id="edit-cantidad-${index}" value="${d.cantidad || ''}" step="any" class="w-full px-1 py-1 border border-aq-border bg-aq-bg text-aq-text text-xs text-right">
                </td>
                <td class="px-1 py-1">
                    <select id="edit-bodega-${index}" class="w-full px-1 py-1 border border-aq-border bg-aq-bg text-aq-text text-xs">${document.getElementById('vcArtBodega').innerHTML}</select>
                </td>
                <td class="px-1 py-1 text-aq-text">${d.codigo__um || ''}</td>
                <td class="px-1 py-1 text-aq-text">${d.codigo__tipo || ''}</td>
                <td class="px-1 py-1 text-center whitespace-nowrap">
                    <button type="button" onclick="guardarEditDetalleVC(${index})" class="text-green-500 hover:text-green-700" title="Guardar"><i class="bx bx-check"></i></button>
                    <button type="button" onclick="cancelarEditDetalleVC(${index})" class="text-gray-500 hover:text-gray-700" title="Cancelar"><i class="bx bx-x"></i></button>
                </td>
            `;
            const bodegaSel = tr.querySelector(`#edit-bodega-${index}`);
            if (bodegaSel && d.bodega) bodegaSel.value = d.bodega;
        } else {
            tr.innerHTML = `
                <td class="px-1 py-1 text-aq-text">${fechaFmt}</td>
                <td class="px-1 py-1 text-aq-text">${d.codigo__codigo || ''}</td>
                <td class="px-1 py-1 text-aq-text">${d.codigo__descr || ''}</td>
                <td class="px-1 py-1 text-aq-text text-right">${d.cantidad || 0}</td>
                <td class="px-1 py-1 text-aq-text">${d.bodega || ''}</td>
                <td class="px-1 py-1 text-aq-text">${d.codigo__um || ''}</td>
                <td class="px-1 py-1 text-aq-text">${d.codigo__tipo || ''}</td>
                <td class="px-1 py-1 text-center whitespace-nowrap">
                    ${modoEdicionVC ? `<button type="button" onclick="editarDetalleVC(${index})" class="text-blue-500 hover:text-blue-700 mr-1" title="Editar"><i class="bx bx-edit"></i></button><button type="button" onclick="eliminarArticuloVC(${index})" class="text-red-500 hover:text-red-700" title="Eliminar"><i class="bx bx-trash"></i></button>` : '<span class="text-aq-muted text-xs">-</span>'}
                </td>
            `;
        }
        tbody.appendChild(tr);
    });
}

function buscarVCInput() {
    const numero = document.getElementById('vcNumero').value;
    if (numero) {
        cargarVC(numero);
    }
}

function abrirBusquedaVC() {
    buscarXHRVC('listar_vc', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Buscar Vale de Consumo',
            columnas: [
                {title: 'Número', field: 'numero', width: 120},
                {title: 'Fecha', field: 'fecha', width: 120},
                {title: 'Tipo Doc', field: 'tipodocref_nombre', width: 150},
            ],
            data: data.lista || [],
            filtroCampos: ['numero', 'tipodocref_nombre'],
            onSelect: function(row) {
                document.getElementById('vcNumero').value = row.numero;
                cargarVC(row.numero);
            }
        });
    });
}

function cargarVC(numero) {
    buscarXHRVC('buscar', {numero: numero}, function(data) {
        if (data.success) {
            document.getElementById('vcNumero').value = data.data.numero;
            document.getElementById('vcFecha').value = data.data.fecha || '';
            modoEdicionVC = false;

            document.getElementById('tab-detalle').classList.remove('hidden');
            document.getElementById('btnGuardarVC').classList.add('hidden');
            document.getElementById('btnEliminarVC').classList.remove('hidden');
            document.getElementById('btnEditarVC').classList.remove('hidden');

        detallesVC = (data.data.detalles || []).map(d => ({
            codigo__codigo: d.codigo__codigo || d.codigo || '',
            codigo__descr: d.codigo__descr || d.nombre || '',
            codigo__um: d.codigo__um || d.um || '',
            codigo__tipo: d.codigo__tipo || d.tipo || '',
            cantidad: d.cantidad || 0,
            bodega: d.bodega || '',
            fecha: d.fecha || ''
        }));
            renderizarDetalleVC();
            setCamposVCEditable(false);
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function buscarArticuloVCInput() {
    const codigo = document.getElementById('vcArtCod').value.trim();
    const nombre = document.getElementById('vcArtNombre');
    nombre.value = '';
    document.getElementById('vcArtUM').value = '';
    document.getElementById('vcArtTipo').value = '';
    if (window.tablaHistorialVC) {
        window.tablaHistorialVC.destroy();
        window.tablaHistorialVC = null;
    }
    document.getElementById('historialArticulo').replaceChildren();
    if (!codigo) return;

    buscarXHRVC('buscar_articulo', {codigo: codigo}, function(data) {
        if (document.getElementById('vcArtCod').value.trim() !== codigo) return;
        if (data.success) {
            nombre.value = data.data.nombre || '';
            document.getElementById('vcArtUM').value = data.data.um || '';
            document.getElementById('vcArtTipo').value = data.data.tipo || '';
            cargarHistorialArticuloVC(codigo);
        } else {
            Toastify({text: data.message || 'Artículo no encontrado', style: {background: '#f44336'}}).showToast();
        }
    });
}

function cargarHistorialArticuloVC(codigo) {
    buscarXHRVC('historial_articulo', {codigo: codigo}, function(data) {
        if (document.getElementById('vcArtCod').value.trim() !== codigo) return;
        const contenedor = document.getElementById('historialArticulo');
        if (window.tablaHistorialVC) window.tablaHistorialVC.destroy();
        if (!data.success) return;
        window.tablaHistorialVC = new Tabulator(contenedor, {
            data: data.historial || [],
            layout: 'fitColumns',
            height: '160px',
            columns: [
                {title: 'Fecha', field: 'fecha', formatter: cell => (cell.getValue() || '').split('T')[0]},
                {title: 'Número', field: 'numero'},
                {title: 'Tipo', field: 'tipo'},
                {title: 'Bodega', field: 'bodega'},
                {title: 'Cant', field: 'cantidad', hozAlign: 'right'},
            ],
        });
    });
}

function abrirListaArticulosVC() {
    buscarXHRVC('listar_articulos', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Buscar Artículo',
            columnas: [
                {title: 'Código', field: 'codigo', width: 100},
                {title: 'Nombre', field: 'descr', width: 200},
                {title: 'UM', field: 'um', width: 70},
                {title: 'Tipo', field: 'tipo', width: 100},
            ],
            data: data.articulos || [],
            filtroCampos: ['codigo', 'descr', 'tipo'],
            onSelect: function(row) {
                document.getElementById('vcArtCod').value = row.codigo;
                document.getElementById('vcArtNombre').value = row.descr || '';
                document.getElementById('vcArtUM').value = row.um || '';
                document.getElementById('vcArtTipo').value = row.tipo || '';
                cargarHistorialArticuloVC(row.codigo);
            }
        });
    });
}

function cambiarTabVC(tab) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('contenido-' + tab).classList.remove('hidden');
    document.getElementById('tab-' + tab).classList.add('active');
}

function guardarVC() {
    const numero = document.getElementById('vcNumero').value.trim();
    const fecha = document.getElementById('vcFecha').value;

    const details = detallesVC.map(d => ({
        codigo: d.codigo__codigo || d.codigo,
        cantidad: d.cantidad,
        bodega: d.bodega,
        fecha: d.fecha
    }));

    buscarXHRVC('nuevo', {
        numero: numero || "",
        fecha: fecha,
        detalles: JSON.stringify(details)
    }, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            nuevaVC();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}
