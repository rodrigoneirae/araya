const urlVC = (document.currentScript?.dataset.url) || '/';

let detallesVC = [];
let modoEdicionVC = false;

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

document.addEventListener('DOMContentLoaded', function() {
    cargarDatosInicialesVC();
    document.getElementById('vcArtCod')?.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') buscarArticuloVC();
    });
});

function cargarDatosInicialesVC() {
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
    nuevaVC();
}

function nuevaVC() {
    document.getElementById('vcForm').reset();
    detallesVC = [];
    modoEdicionVC = true;
    renderizarDetalleVC();
    const fecha = new Date().toISOString().split('T')[0];
    document.getElementById('vcFecha').value = fecha;
    document.getElementById('vcArtFecha').value = fecha;
    document.getElementById('tab-detalle').classList.add('hidden');
    document.getElementById('contenido-detalle').classList.add('hidden');
    document.getElementById('tab-encabezado').classList.add('active');
    document.getElementById('contenido-encabezado').classList.remove('hidden');
    document.getElementById('btnEditarVC').classList.add('hidden');
    document.getElementById('btnEliminarVC').classList.add('hidden');
    document.getElementById('btnGuardarVC').classList.remove('hidden');
    setCamposVCEditable(true);
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

function editarVC() {
    const btn = document.getElementById('btnEditarVC');
    if (btn.classList.contains('bg-amber-500')) {
        setCamposVCEditable(true);
        document.getElementById('btnGuardarVC').classList.remove('hidden');
        document.getElementById('btnEliminarVC').classList.add('hidden');
        btn.classList.add('hidden');
    }
}

function eliminarVC() {
    const numero = document.getElementById('vcNumero').value;
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

function buscarArticuloVC() {
    const cod = document.getElementById('vcArtCod').value.trim();
    if (!cod) return;
    buscarXHRVC('buscar_articulo', {codigo: cod}, function(data) {
        if (data.success) {
            document.getElementById('vcArtNombre').value = data.data.nombre || '';
            document.getElementById('vcArtUM').value = data.data.um || '';
            document.getElementById('vcArtTipo').value = data.data.tipo || '';
            buscarXHRVC('historial_articulo', {codigo: cod}, function(hData) {
                console.log('historial response:', hData);
                if (window.tablaHistorialVC) {
                    window.tablaHistorialVC.destroy();
                }
                const tableData = hData.historial || [];
                if (tableData.length === 0) {
                    Toastify({text: 'Sin movimientos para este artículo', style: {background: '#f44336'}}).showToast();
                    return;
                }
                window.tablaHistorialVC = new Tabulator("#historialArticulo", {
                    data: tableData,
                    layout: "fitColumns",
                    height: "160px",
                    columns: [
                        {title: "Fecha", field: "fecha", formatter: function(cell) {
                            const val = cell.getValue();
                            if (val) {
                                return val.split('T')[0].split('-').reverse().join('-');
                            }
                            return '';
                        }},
                        {title: "Número", field: "numero"},
                        {title: "Tipo", field: "tipo"},
                        {title: "Bodega", field: "bodega"},
                        {title: "Cant", field: "cantidad", hozAlign: "right"},
                        {title: "Saldo", field: "saldo", hozAlign: "right"},
                    ],
                });
            });
        } else {
            Toastify({text: 'Artículo no encontrado', style: {background: '#f44336'}}).showToast();
        }
    });
}

function abrirListaArticulosVC() {
    buscarXHRVC('listar_articulos', {}, function(data) {
        window.listaArticulosVC = data.articulos || [];
        document.getElementById('modalArticulosVC').classList.remove('hidden');
        document.getElementById('filtroArticulosVC').value = '';
        renderizarListaArticulosVC(window.listaArticulosVC);
    });
}

function cerrarListaArticulosVC() {
    document.getElementById('modalArticulosVC').classList.add('hidden');
}

function renderizarListaArticulosVC(lista) {
    const tbody = document.getElementById('tablaListaArticulosVC');
    tbody.innerHTML = '';
    lista.forEach(a => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            document.getElementById('vcArtCod').value = a.codigo;
            document.getElementById('vcArtNombre').value = a.descr || '';
            cerrarListaArticulosVC();
            buscarArticuloVC();
        };
        tr.innerHTML = `
            <td class="px-3 py-2 text-aq-text">${a.codigo}</td>
            <td class="px-3 py-2 text-aq-text">${a.descr || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarArticulosVC() {
    const filtro = document.getElementById('filtroArticulosVC').value.toLowerCase();
    const filtradas = window.listaArticulosVC.filter(a =>
        (a.codigo && a.codigo.toString().toLowerCase().includes(filtro)) ||
        (a.descr && a.descr.toLowerCase().includes(filtro))
    );
    renderizarListaArticulosVC(filtradas);
}

function agregarArticuloVC() {
    const cod = document.getElementById('vcArtCod').value.trim();
    const nombre = document.getElementById('vcArtNombre').value.trim();
    const cant = parseFloat(document.getElementById('vcArtCant').value) || 0;
    const bodega = document.getElementById('vcArtBodega').value;
    const fecha = document.getElementById('vcArtFecha').value;

    if (!cod) {
        Toastify({text: 'Ingrese código de artículo', style: {background: '#f44336'}}).showToast();
        return;
    }
    if (cant <= 0) {
        Toastify({text: 'Ingrese cantidad', style: {background: '#f44336'}}).showToast();
        return;
    }

    detallesVC.push({
        codigo__codigo: cod,
        codigo__descr: nombre,
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
        
        tr.innerHTML = `
            <td class="px-1 py-1 text-aq-text">${fechaFmt}</td>
            <td class="px-1 py-1 text-aq-text">${d.codigo__codigo || ''}</td>
            <td class="px-1 py-1 text-aq-text">${d.codigo__descr || ''}</td>
            <td class="px-1 py-1 text-aq-text text-right">${d.cantidad || 0}</td>
            <td class="px-1 py-1 text-aq-text">${d.bodega || ''}</td>
            <td class="px-1 py-1 text-aq-text">${d.codigo__um || ''}</td>
            <td class="px-1 py-1 text-aq-text">${d.codigo__tipo || ''}</td>
            <td class="px-1 py-1 text-center">
                ${modoEdicionVC ? `<button onclick="eliminarArticuloVC(${index})" class="text-red-500 hover:text-red-700"><i class="bx bx-trash"></i></button>` : ''}
            </td>
        `;
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
        const tbody = document.getElementById('tablaBusquedaVC');
        tbody.innerHTML = '';
        if (data.lista) {
            data.lista.forEach(p => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
                tr.onclick = function() {
                    document.getElementById('modalBusquedaVC').classList.add('hidden');
                    document.getElementById('vcNumero').value = p.numero;
                    cargarVC(p.numero);
                };
                tr.innerHTML = `
                    <td class="px-3 py-2 text-aq-text">${p.numero || ''}</td>
                    <td class="px-3 py-2 text-aq-text">${p.fecha || ''}</td>
                    <td class="px-3 py-2 text-aq-text">${p.tipodocref_nombre || ''}</td>
                `;
                tbody.appendChild(tr);
            });
        }
        document.getElementById('modalBusquedaVC').classList.remove('hidden');
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
            document.getElementById('btnEditarVC').classList.remove('hidden');
            document.getElementById('btnEliminarVC').classList.remove('hidden');

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
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function filtrarVC() {
    const filtro = document.getElementById('filtroBusquedaVC').value.toLowerCase();
    const tbody = document.getElementById('tablaBusquedaVC');
    const rows = tbody.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        const text = rows[i].textContent.toLowerCase();
        rows[i].style.display = text.includes(filtro) ? '' : 'none';
    }
}

function buscarArticuloVCInput() {
    buscarArticuloVC();
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
