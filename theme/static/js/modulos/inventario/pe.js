const urlPE = (document.currentScript?.dataset.url) || '/';

let detallesPE = [];
let modoEdicionPE = false;

function buscarXHRPE(action, datos, callback) {
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
    cargarDatosInicialesPE();
    document.getElementById('peArtCod')?.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') buscarArticuloPE();
    });
});

function cargarDatosInicialesPE() {
    buscarXHRPE('listar_tiposdoc', {}, function(data) {
        const select = document.getElementById('peTipoDoc');
        if (select && data.tiposdoc) {
            data.tiposdoc.forEach(t => {
                const option = document.createElement('option');
                option.value = t.cod;
                option.textContent = t.cod + ' - ' + t.nombre;
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
    nuevaPE();
}

function nuevaPE() {
    document.getElementById('peForm').reset();
    detallesPE = [];
    modoEdicionPE = true;
    renderizarDetallePE();
    const fecha = new Date().toISOString().split('T')[0];
    document.getElementById('peFecha').value = fecha;
    document.getElementById('peArtFecha').value = fecha;
    document.getElementById('tab-detalle').classList.add('hidden');
    document.getElementById('contenido-detalle').classList.add('hidden');
    document.getElementById('tab-encabezado').classList.add('active');
    document.getElementById('contenido-encabezado').classList.remove('hidden');
    document.getElementById('btnEditarPE').classList.add('hidden');
    document.getElementById('btnEliminarPE').classList.add('hidden');
    document.getElementById('btnGuardarPE').classList.remove('hidden');
    setCamposPEEditable(true);
}

function setCamposPEEditable(editable) {
    const inputs = ['peFecha', 'peTipoDoc', 'peRef', 'peArtCod', 'peArtCant', 'peArtPUnit', 'peArtFecha'];
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
    const bodega = document.getElementById('peArtBodega');
    if (bodega) bodega.disabled = !editable;
    
    const artBtn = document.querySelector('#peArtCod + button');
    if (artBtn) artBtn.disabled = !editable;
    const agregarBtn = document.querySelector('#contenido-detalle button[onclick="agregarArticuloPE()"]');
    if (agregarBtn) agregarBtn.disabled = !editable;
    
    const tipodoc = document.getElementById('peTipoDoc');
    if (tipodoc) tipodoc.disabled = !editable;
    
    modoEdicionPE = editable;
    renderizarDetallePE();
}

function editarPE() {
    const btn = document.getElementById('btnEditarPE');
    if (btn.classList.contains('bg-amber-500')) {
        setCamposPEEditable(true);
        document.getElementById('btnGuardarPE').classList.remove('hidden');
        document.getElementById('btnEliminarPE').classList.add('hidden');
        btn.classList.add('hidden');
    }
}

function eliminarPE() {
    const numero = document.getElementById('peNumero').value;
    if (!numero) {
        Toastify({text: 'No hay Parte de Entrada seleccionada', style: {background: '#f44336'}}).showToast();
        return;
    }
    if (!confirm('¿Está seguro de eliminar esta Parte de Entrada?')) {
        return;
    }
    buscarXHRPE('eliminar', {numero: numero}, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            nuevaPE();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function buscarArticuloPE() {
    const cod = document.getElementById('peArtCod').value.trim();
    if (!cod) return;
    buscarXHRPE('buscar_articulo', {codigo: cod}, function(data) {
        if (data.success) {
            document.getElementById('peArtPUnit').value = data.data.precio || 0;
            document.getElementById('peArtNombre').value = data.data.nombre || '';
            document.getElementById('peArtUM').value = data.data.um || '';
            window.articuloPrc = data.data.prc || '';
            buscarXHRPE('historial_articulo', {codigo: cod}, function(hData) {
                if (window.tablaHistorialPE) {
                    window.tablaHistorialPE.destroy();
                }
                const tableData = hData.historial || [];
                window.tablaHistorialPE = new Tabulator("#historialArticulo", {
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
                    ],
                });
            });
        } else {
            Toastify({text: 'Artículo no encontrado', style: {background: '#f44336'}}).showToast();
        }
    });
}

function abrirListaArticulosPE() {
    buscarXHRPE('listar_articulos', {}, function(data) {
        window.listaArticulosPE = data.articulos || [];
        document.getElementById('modalArticulosPE').classList.remove('hidden');
        document.getElementById('filtroArticulosPE').value = '';
        renderizarListaArticulosPE(window.listaArticulosPE);
    });
}

function cerrarListaArticulosPE() {
    document.getElementById('modalArticulosPE').classList.add('hidden');
}

function renderizarListaArticulosPE(lista) {
    const tbody = document.getElementById('tablaListaArticulosPE');
    tbody.innerHTML = '';
    lista.forEach(a => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            document.getElementById('peArtCod').value = a.codigo;
            document.getElementById('peArtNombre').value = a.descr || '';
            document.getElementById('peArtUM').value = a.um || '';
            document.getElementById('peArtPUnit').value = a.precio || 0;
            cerrarListaArticulosPE();
        };
        tr.innerHTML = `
            <td class="px-3 py-2 text-aq-text">${a.codigo}</td>
            <td class="px-3 py-2 text-aq-text">${a.descr || ''}</td>
            <td class="px-3 py-2 text-aq-text">${a.um || ''}</td>
            <td class="px-3 py-2 text-aq-text text-right">${a.precio || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarArticulosPE() {
    const filtro = document.getElementById('filtroArticulosPE').value.toLowerCase();
    const filtradas = window.listaArticulosPE.filter(a =>
        (a.codigo && a.codigo.toString().toLowerCase().includes(filtro)) ||
        (a.descr && a.descr.toLowerCase().includes(filtro))
    );
    renderizarListaArticulosPE(filtradas);
}

function agregarArticuloPE() {
    const cod = document.getElementById('peArtCod').value.trim();
    const nombre = document.getElementById('peArtNombre').value.trim();
    const um = document.getElementById('peArtUM').value.trim();
    const cant = parseFloat(document.getElementById('peArtCant').value) || 0;
    const punit = parseFloat(document.getElementById('peArtPUnit').value) || 0;
    const bodega = document.getElementById('peArtBodega').value;
    const fecha = document.getElementById('peArtFecha').value;

    if (!cod) {
        Toastify({text: 'Ingrese código de artículo', style: {background: '#f44336'}}).showToast();
        return;
    }
    if (cant <= 0) {
        Toastify({text: 'Ingrese cantidad', style: {background: '#f44336'}}).showToast();
        return;
    }

    const total = cant * punit;
    detallesPE.push({
        codigo: cod, 
        nombre: nombre,
        cantidad: cant, 
        punit: punit, 
        um: um,
        bodega: bodega,
        fecha: fecha,
        estado: 'Abierto',
        subtotal: total,
        total: total
    });

    document.getElementById('peArtCod').value = '';
    document.getElementById('peArtNombre').value = '';
    document.getElementById('peArtUM').value = '';
    document.getElementById('peArtCant').value = '';
    document.getElementById('peArtPUnit').value = '';
    document.getElementById('peArtBodega').value = '';
    document.getElementById('peArtCod').focus();

    renderizarDetallePE();
}

function eliminarArticuloPE(index) {
    detallesPE.splice(index, 1);
    renderizarDetallePE();
}

function renderizarDetallePE() {
    const tbody = document.getElementById('peDetalle');
    tbody.innerHTML = '';
    
    if (detallesPE.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="px-3 py-4 text-center text-aq-text">Sin artículos agregados</td></tr>';
        return;
    }

    let totalNeto = 0;
    let totalCant = 0;

    detallesPE.forEach((d, index) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 text-xs';
        const subtotal = (d.cantidad || 0) * (d.punit || 0);
        let fechaFmt = '';
        if (d.fecha) {
            const f = d.fecha.split('T')[0];
            if (f) fechaFmt = f.split('-').reverse().join('-');
        }
        
        totalNeto += subtotal;
        totalCant += d.cantidad || 0;

        tr.innerHTML = `
            <td class="px-1 py-1 text-aq-text">${fechaFmt}</td>
            <td class="px-1 py-1 text-aq-text">${d.codigo || ''}</td>
            <td class="px-1 py-1 text-aq-text">${d.nombre || ''}</td>
            <td class="px-1 py-1 text-aq-text text-right">${d.cantidad || 0}</td>
            <td class="px-1 py-1 text-aq-text">${d.bodega || ''}</td>
            <td class="px-1 py-1 text-aq-text text-right">${d.punit ? d.punit.toFixed(0) : 0}</td>
            <td class="px-1 py-1 text-aq-text text-right">${d.cup || 0}</td>
            <td class="px-1 py-1 text-center">
                ${modoEdicionPE ? `<button onclick="eliminarArticuloPE(${index})" class="text-red-500 hover:text-red-700"><i class="bx bx-trash"></i></button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function buscarPEInput() {
    const numero = document.getElementById('peNumero').value;
    if (numero) {
        cargarPE(numero);
    }
}



function abrirBusquedaPE() {
    buscarXHRPE('listar_pe', {}, function(data) {
        const tbody = document.getElementById('tablaBusquedaPE');
        tbody.innerHTML = '';
        if (data.lista) {
            data.lista.forEach(p => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
                tr.onclick = function() {
                    document.getElementById('modalBusquedaPE').classList.add('hidden');
                    document.getElementById('peNumero').value = p.numero;
                    cargarPE(p.numero);
                };
                tr.innerHTML = `
                    <td class="px-3 py-2 text-aq-text">${p.numero || ''}</td>
                    <td class="px-3 py-2 text-aq-text">${p.fecha || ''}</td>
                    <td class="px-3 py-2 text-aq-text">${p.tipodocref_nombre || ''}</td>
                `;
                tbody.appendChild(tr);
            });
        }
        document.getElementById('modalBusquedaPE').classList.remove('hidden');
    });
}

function cargarPE(numero) {
    buscarXHRPE('buscar', {numero: numero}, function(data) {
        if (data.success) {
            document.getElementById('peNumero').value = data.data.numero;
            document.getElementById('peFecha').value = data.data.fecha || '';
            modoEdicionPE = false;

            document.getElementById('tab-detalle').classList.remove('hidden');
            document.getElementById('btnGuardarPE').classList.add('hidden');
            document.getElementById('btnEditarPE').classList.remove('hidden');
            document.getElementById('btnEliminarPE').classList.remove('hidden');

            const docSelect = document.getElementById('peTipoDoc');
            if (data.data.tipodocref) {
                let found = false;
                for (let i = 0; i < docSelect.options.length; i++) {
                    const optVal = docSelect.options[i].value.split(' - ')[0];
                    if (optVal == data.data.tipodocref) {
                        docSelect.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    const option = document.createElement('option');
                    option.value = data.data.tipodocref;
                    option.textContent = data.data.tipodocref + ' - ' + (data.data.tipodocref_nombre || '');
                    docSelect.appendChild(option);
                    docSelect.value = data.data.tipodocref;
                }
            }
            
            document.getElementById('peRef').value = data.data.docref || '';

            detallesPE = (data.data.detalles || []).map(d => ({
                codigo: d.codigo || '',
                nombre: d.nombre || '',
                cantidad: d.cantidad || 0,
                punit: d.punit || 0,
                bodega: d.bodega || '',
                fecha: d.fecha || '',
                cup: d.cup || 0
            }));
            renderizarDetallePE();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function filtrarPE() {
    const filtro = document.getElementById('filtroBusquedaPE').value.toLowerCase();
    const tbody = document.getElementById('tablaBusquedaPE');
    const rows = tbody.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        const text = rows[i].textContent.toLowerCase();
        rows[i].style.display = text.includes(filtro) ? '' : 'none';
    }
}

function buscarArticuloPEInput() {
    buscarArticuloPE();
}

function cambiarTabPE(tab) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('contenido-' + tab).classList.remove('hidden');
    document.getElementById('tab-' + tab).classList.add('active');
}

function guardarPE() {
    const numero = document.getElementById('peNumero').value.trim();
    const tipodoc = document.getElementById('peTipoDoc').value.split(' - ')[0];
    const docref = document.getElementById('peRef').value.trim();
    const fecha = document.getElementById('peFecha').value;

    if (!tipodoc) {
        Toastify({text: 'Seleccione tipo de documento', style: {background: '#f44336'}}).showToast();
        return;
    }

    const details = detallesPE.map(d => ({
        codigo: d.codigo,
        cantidad: d.cantidad,
        punit: d.punit,
        bodega: d.bodega,
        fecha: d.fecha
    }));

    buscarXHRPE('nuevo', {
        numero: numero || "",
        tipodocref: tipodoc,
        docref: docref,
        fecha: fecha,
        detalles: JSON.stringify(details)
    }, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            nuevaPE();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}