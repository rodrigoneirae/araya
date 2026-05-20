const urlOcat = (document.currentScript?.dataset.url) || '/';

let detallesOcat = [];
let modoEdicionOcat = false;
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

function buscarXHROcat(action, datos, callback) {
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
    fetch(urlOcat, {
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
    document.getElementById('ocatArtCod')?.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') buscarArticuloOcat();
    });
});

function cargarDatosIniciales() {
    buscarXHROcat('listar_proveedores', {}, function(data) {
        const select = document.getElementById('ocatProveedor');
        if (select && data.proveedores) {
            data.proveedores.forEach(p => {
                const option = document.createElement('option');
                option.value = p.rut;
                option.textContent = p.nombre;
                select.appendChild(option);
            });
        }
    });

    buscarXHROcat('listar_tiposdoc', {}, function(data) {
        const select = document.getElementById('ocatTipoDoc');
        if (select && data.tiposdoc) {
            data.tiposdoc.forEach(t => {
                const option = document.createElement('option');
                option.value = t.cod;
                option.textContent = t.cod + ' - ' + t.nombre;
                select.appendChild(option);
            });
        }
    });

    buscarXHROcat('listar_encargados', {}, function(data) {
        const select = document.getElementById('ocatEncargado');
        if (select && data.encargados) {
            data.encargados.forEach(e => {
                const option = document.createElement('option');
                option.value = e.cod;
                option.textContent = e.nombre;
                select.appendChild(option);
            });
        }
    });

    buscarXHROcat('listar_bodegas', {}, function(data) {
        const select = document.getElementById('ocatArtBodega');
        if (select && data.bodegas) {
            data.bodegas.forEach(b => {
                const option = document.createElement('option');
                option.value = b.cod;
                option.textContent = b.nombre;
                select.appendChild(option);
            });
        }
    });

    buscarXHROcat('listar_transportistas', {}, function(data) {
        const select = document.getElementById('ocatTransportista');
        if (select && data.transportistas) {
            data.transportistas.forEach(t => {
                const option = document.createElement('option');
                option.value = t.rut;
                option.textContent = t.nombre + ' (' + t.rut + ')';
                select.appendChild(option);
            });
        }
    });

    const transpSelect = document.getElementById('ocatTransportista');
    const patenteSelect = document.getElementById('ocatPatente');
    if (transpSelect) {
        transpSelect.addEventListener('change', function() {
            const rut = this.value;
            const patenteSel = document.getElementById('ocatPatente');
            patenteSel.innerHTML = '<option value="">--- Seleccionar ---</option>';
            if (rut) {
                buscarXHROcat('listar_patentes', {rut: rut}, function(data) {
                    if (data.patentes) {
                        data.patentes.forEach(p => {
                            const option = document.createElement('option');
                            option.value = p.patente;
                            option.dataset.id = p.id;
                            option.textContent = p.patente;
                            patenteSel.appendChild(option);
                        });
                    }
                });
            }
        });
    }
    if (patenteSelect) {
        patenteSelect.addEventListener('change', function() {
            const patente = this.value;
            if (patente) {
                buscarXHROcat('buscar_por_patente', {patente: patente}, function(data) {
                    if (data.success) {
                        const transpSel = document.getElementById('ocatTransportista');
                        for (let i = 0; i < transpSel.options.length; i++) {
                            if (transpSel.options[i].value === data.data.rut) {
                                transpSel.selectedIndex = i;
                                break;
                            }
                        }
                    }
                });
            }
        });
    }

    const fecha = new Date().toISOString().split('T')[0];
    document.getElementById('ocatFecha').value = fecha;
    document.getElementById('ocatArtFecha').value = fecha;
    nuevaOcat();
    setCamposOcatEditable(true);
    document.getElementById('btnEditarOcat').classList.add('hidden');
    document.getElementById('btnGuardarOcat').classList.remove('hidden');
}

function nuevaOcat() {
    document.getElementById('ocatForm').reset();
    detallesOcat = [];
    modoEdicionOcat = true;
    renderizarDetalleOcat();
    const fecha = new Date().toISOString().split('T')[0];
    document.getElementById('ocatFecha').value = fecha;
    document.getElementById('ocatEstado').value = 'Abierto';
    document.getElementById('ocatArtFecha').value = fecha;
    document.getElementById('tab-detalle').classList.add('hidden');
    document.getElementById('contenido-detalle').classList.add('hidden');
    document.getElementById('tab-encabezado').classList.add('active');
    document.getElementById('contenido-encabezado').classList.remove('hidden');
    document.getElementById('btnEditarOcat').classList.add('hidden');
    document.getElementById('btnEliminarOcat').classList.add('hidden');
    document.getElementById('btnGuardarOcat').classList.remove('hidden');
    setCamposOcatEditable(true);
    calcularTotalesOcat();
}

function setCamposOcatEditable(editable) {
    const inputs = ['ocatFecha', 'ocatProveedor', 'ocatTipoDoc', 'ocatRef', 'ocatEncargado', 'ocatEstado', 'ocatArtCod', 'ocatArtCant', 'ocatArtPUnit', 'ocatArtFecha', 'ocatNeto', 'ocatTotal', 'ocatTransportista', 'ocatPatente', 'ocatPeso'];
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
    const bodega = document.getElementById('ocatArtBodega');
    if (bodega) bodega.disabled = !editable;
    
    const provBtn = document.querySelector('#ocatProveedor + button');
    if (provBtn) provBtn.disabled = !editable;
    const artBtn = document.querySelector('#ocatArtCod + button');
    if (artBtn) artBtn.disabled = !editable;
    const agregarBtn = document.querySelector('#contenido-detalle button[onclick="agregarArticuloOcat()"]');
    if (agregarBtn) agregarBtn.disabled = !editable;
    
    const proveedor = document.getElementById('ocatProveedor');
    if (proveedor) proveedor.disabled = !editable;
    const tipodoc = document.getElementById('ocatTipoDoc');
    if (tipodoc) tipodoc.disabled = !editable;
    const encargado = document.getElementById('ocatEncargado');
    if (encargado) encargado.disabled = !editable;
    
    modoEdicionOcat = editable;
    renderizarDetalleOcat();
}

function editarOcat() {
    const btn = document.getElementById('btnEditarOcat');
    if (btn.classList.contains('bg-amber-500')) {
        setCamposOcatEditable(true);
        document.getElementById('btnGuardarOcat').classList.remove('hidden');
        document.getElementById('btnEliminarOcat').classList.add('hidden');
        btn.classList.add('hidden');
    }
}

function buscarFolioInput() {
    const numero = document.getElementById('ocatNumero').value;
    if (numero) {
        cargarOcat(numero);
    }
}

function buscarArticuloInput() {
    buscarArticuloOcat();
}

function eliminarOcat() {
    const numero = document.getElementById('ocatNumero').value;
    if (!numero) {
        Toastify({text: 'No hay OCAT seleccionada', style: {background: '#f44336'}}).showToast();
        return;
    }
    mostrarConfirmar('Eliminar OCAT', '¿Está seguro de eliminar esta OCAT?', function() {
        buscarXHROcat('eliminar', {numero: numero}, function(data) {
            if (data.success) {
                Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                nuevaOcat();
            } else {
                Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
            }
        });
    });
}

function buscarArticuloOcat() {
    const cod = document.getElementById('ocatArtCod').value.trim();
    if (!cod) return;
    buscarXHROcat('buscar_articulo', {codigo: cod}, function(data) {
        if (data.success) {
            document.getElementById('ocatArtPUnit').value = data.data.precio || 0;
            document.getElementById('ocatArtNombre').value = data.data.nombre || '';
            document.getElementById('ocatArtUM').value = data.data.um || '';
            window.articuloPrc = data.data.prc || '';
        } else {
            Toastify({text: 'Artículo no encontrado', style: {background: '#f44336'}}).showToast();
        }
    });
}

function abrirListaArticulos() {
    buscarXHROcat('listar_articulos', {}, function(data) {
        window.listaArticulos = data.articulos || [];
        document.getElementById('modalArticulos').classList.remove('hidden');
        document.getElementById('filtroArticulos').value = '';
        renderizarListaArticulos(window.listaArticulos);
    });
}

function cerrarListaArticulos() {
    document.getElementById('modalArticulos').classList.add('hidden');
}

function renderizarListaArticulos(lista) {
    const tbody = document.getElementById('tablaListaArticulos');
    tbody.innerHTML = '';
    lista.forEach(a => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            document.getElementById('ocatArtCod').value = a.codigo;
            document.getElementById('ocatArtNombre').value = a.descr || '';
            document.getElementById('ocatArtUM').value = a.um || '';
            document.getElementById('ocatArtPUnit').value = a.precio || 0;
            window.articuloPrc = a.prc || '';
            cerrarListaArticulos();
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

function filtrarArticulos() {
    const filtro = document.getElementById('filtroArticulos').value.toLowerCase();
    const filtradas = window.listaArticulos.filter(a =>
        (a.codigo && a.codigo.toString().toLowerCase().includes(filtro)) ||
        (a.descr && a.descr.toLowerCase().includes(filtro))
    );
    renderizarListaArticulos(filtradas);
}

function agregarArticuloOcat() {
    const cod = document.getElementById('ocatArtCod').value.trim();
    const nombre = document.getElementById('ocatArtNombre').value.trim();
    const um = document.getElementById('ocatArtUM').value.trim();
    const cant = parseFloat(document.getElementById('ocatArtCant').value) || 0;
    const punit = parseFloat(document.getElementById('ocatArtPUnit').value) || 0;
    const bodega = document.getElementById('ocatArtBodega').value;
    const fecha = document.getElementById('ocatArtFecha').value;

    if (!cod) {
        Toastify({text: 'Ingrese código de artículo', style: {background: '#f44336'}}).showToast();
        return;
    }
    if (cant <= 0) {
        Toastify({text: 'Ingrese cantidad', style: {background: '#f44336'}}).showToast();
        return;
    }

    const totalEncabezado = parseFloat(document.getElementById('ocatTotal').value) || 0;
    const sumaCantDetalles = detallesOcat.reduce((sum, d) => sum + (d.cantidad || 0), 0);
    if (totalEncabezado > 0 && (sumaCantDetalles + cant) > totalEncabezado) {
        Toastify({text: 'La cantidad total no puede exceder lo ingresado en el encabezado (' + totalEncabezado + ')', style: {background: '#f44336'}}).showToast();
        return;
    }

    const total = cant * punit;
    detallesOcat.push({
        codigo: cod, 
        nombre: nombre,
        cantidad: cant, 
        punit: punit, 
        um: um,
        bodega: bodega,
        canttotal: cant,
        falta: 0,
        proceso: window.articuloPrc || '',
        proceso_nombre: '',
        fecha: fecha,
        estado: 'Abierto',
        subtotal: total,
        total: total,
        cup: 0
    });

    document.getElementById('ocatArtCod').value = '';
    document.getElementById('ocatArtNombre').value = '';
    document.getElementById('ocatArtUM').value = '';
    document.getElementById('ocatArtCant').value = '';
    document.getElementById('ocatArtPUnit').value = '';
    document.getElementById('ocatArtBodega').value = 1;
    document.getElementById('ocatArtCod').focus();

    renderizarDetalleOcat();
    calcularTotalesOcat();
}

function eliminarArticuloOcat(index) {
    detallesOcat.splice(index, 1);
    renderizarDetalleOcat();
    calcularTotalesOcat();
}

function renderizarDetalleOcat() {
    const tbody = document.getElementById('ocatDetalle');
    tbody.innerHTML = '';
    
    if (detallesOcat.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" class="px-3 py-4 text-center text-aq-text">Sin artículos agregados</td></tr>';
        document.getElementById('resumenProceso').innerHTML = 'Sin proceso';
        document.getElementById('resumenSaldoCUP').textContent = '0';
        document.getElementById('resumenNuevoSaldo').textContent = '0';
        document.getElementById('resumenNeto').textContent = '0';
        document.getElementById('resumenCantTotal').textContent = '0';
        // document.getElementById('ocatNeto').value = 0;
        // document.getElementById('ocatTotal').value = 0;
        return;
    }

    let totalNeto = 0;
    let totalCant = 0;
    let totalCUP = 0;
    let procesos = {};

const totalEncabezado = parseFloat(document.getElementById('ocatTotal').value) || 0;
    let sumaCant = 0;
    detallesOcat.forEach(d => { sumaCant += d.cantidad || 0; });
    let faltaCalc = 0;
    if (totalEncabezado > 0) {
        faltaCalc = (sumaCant - totalEncabezado)*-1;
    }

    detallesOcat.forEach(d => {
        d.canttotal = sumaCant;
        d.falta = faltaCalc;
    });

    const faltaFinal = faltaCalc;

    detallesOcat.forEach((d, index) => {
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
        totalCUP += d.cup || 0;

        if (d.proceso) {
            if (!procesos[d.proceso]) {
                procesos[d.proceso] = { cod: d.proceso, cantidad: 0, subtotal: 0 };
            }
            procesos[d.proceso].cantidad += d.cantidad || 0;
            procesos[d.proceso].subtotal += subtotal;
        }

        tr.innerHTML = `
            <td class="px-1 py-1 text-aq-text">${d.codigo || ''}</td>
            <td class="px-1 py-1 text-aq-text">${d.nombre || ''}</td>
            <td class="px-1 py-1 text-aq-text text-right">${d.cantidad || 0}</td>
            <td class="px-1 py-1 text-aq-text text-right">${d.punit ? d.punit.toFixed(0) : 0}</td>
            <td class="px-1 py-1 text-aq-text">${d.um || ''}</td>
            <td class="px-1 py-1 text-aq-text">${d.bodega || ''}</td>
            <td class="px-1 py-1 text-aq-text text-right">${d.canttotal || 0}</td>
            <td class="px-1 py-1 text-aq-text text-right">${d.falta !== undefined ? d.falta : faltaFinal}</td>
            <td class="px-1 py-1 text-aq-text">${d.proceso || ''} - ${d.proceso_nombre || ''}</td>
            <td class="px-1 py-1 text-aq-text">${fechaFmt}</td>
            <td class="px-1 py-1 text-aq-text">${d.estado || ''}</td>
            <td class="px-1 py-1 text-aq-text text-right">${subtotal.toFixed(0)}</td>
            <td class="px-1 py-1 text-aq-text text-right">${d.total ? d.total.toFixed(0) : 0}</td>
            <td class="px-1 py-1 text-aq-text text-right">${d.cup || 0}</td>
            <td class="px-1 py-1 text-center">
                ${modoEdicionOcat ? `
                <button onclick="abrirModalCUP(${index})" class="text-green-500 hover:text-green-700 mr-1" title="CUP"><i class="bx bx-dollar"></i></button>
                <button onclick="eliminarArticuloOcat(${index})" class="text-red-500 hover:text-red-700" title="Eliminar"><i class="bx bx-trash"></i></button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });

    let procHtml = '';
    for (let proc in procesos) {
        const procNombre = detallesOcat.find(d => d.proceso == proc)?.proceso_nombre || proc;
        procHtml += `<span class="mr-3 text-xs">${proc} - ${procNombre}</span>`;
    }
    document.getElementById('resumenProceso').innerHTML = procHtml || 'Sin proceso';
    document.getElementById('resumenProceso').innerHTML = procHtml || 'Sin proceso';
    document.getElementById('resumenSaldoCUP').textContent = totalCUP;
    document.getElementById('resumenNuevoSaldo').textContent = totalCUP;
    document.getElementById('resumenNeto').textContent = totalNeto;
    document.getElementById('resumenCantTotal').textContent = totalEncabezado;

    // document.getElementById('ocatNeto').value = totalNeto;
    // document.getElementById('ocatTotal').value = totalCant;
}

function calcularTotalesOcat() {
    let totalNeto = 0;
    let totalCant = 0;
    detallesOcat.forEach(d => {
        totalNeto += (d.cantidad || 0) * (d.punit || 0);
        totalCant += d.cantidad || 0;
    });
    // document.getElementById('ocatNeto').value = totalNeto;
    // document.getElementById('ocatTotal').value = totalNeto * 1.19;
}

function guardarOcat() {
    const rut = document.getElementById('ocatProveedor').value;
    const tipodocref = document.getElementById('ocatTipoDoc').value.split(' - ')[0];
    const docref = document.getElementById('ocatRef').value;
    const codencargado = document.getElementById('ocatEncargado').value;
    const fecha = document.getElementById('ocatFecha').value;
    const estado = document.getElementById('ocatEstado').value;
    const neto = document.getElementById('ocatNeto').value;
    const numero = document.getElementById('ocatNumero').value;
    const patenteSelect = document.getElementById('ocatPatente');
    const patenteOption = patenteSelect.selectedIndex > 0 ? patenteSelect.options[patenteSelect.selectedIndex] : null;
    const patenteId = patenteOption && patenteOption.dataset.id ? patenteOption.dataset.id : '';
    const transportistaRut = document.getElementById('ocatTransportista').value;
    const peso = document.getElementById('ocatPeso').value;

    if (rut === '') {
        Toastify({text: 'Seleccione un proveedor', style: {background: '#f44336'}}).showToast();
        return;
    }
    const total = parseFloat(document.getElementById('ocatTotal').value);
    if (!total || total <= 0) {
        Toastify({text: 'El Total del encabezado es obligatorio', style: {background: '#f44336'}}).showToast();
        return;
    }
    if (detallesOcat.length === 0) {
        Toastify({text: 'Agregue al menos un artículo', style: {background: '#f44336'}}).showToast();
        return;
    }

    mostrarConfirmar('Guardar OCAT', '¿Está seguro de guardar esta OCAT?', function() {
        buscarXHROcat('nuevo', {
            numero: numero,
            rut: rut,
            tipodocref: tipodocref,
            docref: docref,
            codencargado: codencargado,
            fecha: fecha,
            estado: estado,
            neto: neto,
            total: total,
            patente_id: patenteId,
            transportista_rut: transportistaRut,
            peso: peso,
            detalles: JSON.stringify(detallesOcat)
        }, function(data) {
            if (data.success) {
                Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                cargarOcat(data.numero);
            } else {
                Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
            }
        });
    });
}

function buscarOcat() {
    buscarXHROcat('listar_ocat', {}, function(data) {

        window.listaOcat = data.ocat || [];
        document.getElementById('modalBusquedaOcat').classList.remove('hidden');
        renderizarBusquedaOcat(window.listaOcat);
    });
}

function renderizarBusquedaOcat(lista) {
    const tbody = document.getElementById('tablaBusquedaOcat');
    tbody.innerHTML = '';
    lista.forEach(o => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() { cargarOcat(o.numero); };
        tr.innerHTML = `
            <td class="px-3 py-2 text-aq-text">${o.numero || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.fecha || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.rut || ''}</td>
            <td class="px-3 py-2 text-aq-text">${o.estado || ''}</td>
            <td class="px-3 py-2 text-aq-text text-right">${o.total || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarOcat() {
    const filtro = document.getElementById('filtroBusquedaOcat').value.toLowerCase();
    const filtradas = window.listaOcat.filter(o =>
        (o.numero && o.numero.toString().includes(filtro)) ||
        (o.rut && o.rut.toLowerCase().includes(filtro))
    );
    renderizarBusquedaOcat(filtradas);
}

function cambiarTabOcat(tab) {
    if (tab === 'detalle') {
        if (!document.getElementById('ocatNumero').value && !modoEdicionOcat) {
            Toastify({text: 'Seleccione una OCAT o cree una nueva', style: {background: '#f44336'}}).showToast();
            return;
        }
        const prov = document.getElementById('ocatProveedor').value;
        if (!prov && modoEdicionOcat) {
            Toastify({text: 'Debe seleccionar un proveedor primero', style: {background: '#f44336'}}).showToast();
            return;
        }
        const total = parseFloat(document.getElementById('ocatTotal').value);
        if (!total || total <= 0) {
            Toastify({text: 'Debe ingresar el Total en el encabezado', style: {background: '#f44336'}}).showToast();
            return;
        }
    }
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.querySelectorAll('.tab-content').forEach(contenido => contenido.classList.add('hidden'));
    document.getElementById('contenido-' + tab).classList.remove('hidden');
}

function cargarOcat(numero) {
    buscarXHROcat('buscar', {numero: numero}, function(data) {
        if (data.success) {
            document.getElementById('modalBusquedaOcat').classList.add('hidden');
            document.getElementById('ocatNumero').value = data.data.numero;
            document.getElementById('ocatFecha').value = data.data.fecha || '';
            modoEdicionOcat = false;

            document.getElementById('tab-detalle').classList.remove('hidden');
            document.getElementById('btnGuardarOcat').classList.add('hidden');
            document.getElementById('btnEditarOcat').classList.remove('hidden');
            document.getElementById('btnEliminarOcat').classList.remove('hidden');
            setCamposOcatEditable(false);
            document.getElementById('btnEditarOcat').innerHTML = '<i class="bx bx-edit text-xl"></i>';
            document.getElementById('btnEditarOcat').title = 'Editar';
            document.getElementById('btnEditarOcat').classList.remove('bg-green-500');
            document.getElementById('btnEditarOcat').classList.add('bg-amber-500');

            const provSelect = document.getElementById('ocatProveedor');
            if (data.data.rut) {
                let found = false;
                for (let i = 0; i < provSelect.options.length; i++) {
                    if (provSelect.options[i].value === data.data.rut) {
                        provSelect.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    const option = document.createElement('option');
                    option.value = data.data.rut;
                    option.textContent = data.data.proveedor_nombre || data.data.rut;
                    provSelect.appendChild(option);
                    provSelect.value = data.data.rut;
                }
            }

            const docSelect = document.getElementById('ocatTipoDoc');
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

            document.getElementById('ocatRef').value = data.data.docref || '';
            const encargadoSelect = document.getElementById('ocatEncargado');
            if (data.data.codencargado) {
                let found = false;
                for (let i = 0; i < encargadoSelect.options.length; i++) {
                    if (String(encargadoSelect.options[i].value) === String(data.data.codencargado)) {
                        encargadoSelect.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    const option = document.createElement('option');
                    option.value = data.data.codencargado;
                    option.textContent = data.data.codencargado_nombre || data.data.codencargado;
                    encargadoSelect.appendChild(option);
                    encargadoSelect.value = data.data.codencargado;
                }
            }
            document.getElementById('ocatEstado').value = data.data.estado || 'Abierto';
            document.getElementById('ocatNeto').value = data.data.neto || 0;
            document.getElementById('ocatTotal').value = data.data.total || 0;
            document.getElementById('ocatPeso').value = data.data.peso || '';

            const transpSel = document.getElementById('ocatTransportista');
            const patenteSel = document.getElementById('ocatPatente');
            if (data.data.transportista_rut) {
                for (let i = 0; i < transpSel.options.length; i++) {
                    if (transpSel.options[i].value === data.data.transportista_rut) {
                        transpSel.selectedIndex = i;
                        break;
                    }
                }
            }
            patenteSel.innerHTML = '<option value="">--- Seleccionar ---</option>';
            (data.data.patentes_disponibles || []).forEach(p => {
                const option = document.createElement('option');
                option.value = p.patente;
                option.dataset.id = p.id;
                option.textContent = p.patente;
                patenteSel.appendChild(option);
            });
            if (data.data.patente_nombre) {
                setTimeout(function() {
                    for (let i = 0; i < patenteSel.options.length; i++) {
                        if (patenteSel.options[i].value === data.data.patente_nombre) {
                            patenteSel.selectedIndex = i;
                            break;
                        }
                    }
                }, 0);
            }

            detallesOcat = (data.data.detalles || []).map(d => ({
                codigo: d.codigo || '',
                nombre: d.nombre || '',
                cantidad: d.cantidad || 0,
                punit: d.punit || 0,
                um: d.um || '',
                bodega: d.bodega || '',
                falta: 0,
                proceso: d.proceso || '',
                proceso_nombre: d.proceso_nombre || '',
                fecha: d.fecha || '',
                estado: d.estado || '',
                subtotal: (d.cantidad || 0) * (d.punit || 0),
                total: d.total || 0,
                cup: d.cup || 0
            }));
            let sumaCant = 0;
            detallesOcat.forEach(d => { sumaCant += d.cantidad || 0; });
            detallesOcat.forEach(d => {
                d.canttotal = sumaCant;
                d.falta = sumaCant - d.cantidad;
            });
            renderizarDetalleOcat();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

let indiceCUP = null;

function abrirModalCUP(index) {
    indiceCUP = index;
    const item = detallesOcat[index];
    document.getElementById('cupArticulo').value = (item.codigo || '') + ' - ' + (item.nombre || '');
    document.getElementById('cupCantidad').value = item.cantidad || 0;
    document.getElementById('cupPUnit').value = item.punit || 0;
    document.getElementById('cupActual').value = item.cup || 0;
    const modal = document.getElementById('modalCUP');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

function guardarCUP() {
    if (indiceCUP === null) return;
    
    const cantidad = parseFloat(document.getElementById('cupCantidad').value) || 0;
    const punit = parseFloat(document.getElementById('cupPUnit').value) || 0;
    const numero = document.getElementById('ocatNumero').value;
    const codigo = detallesOcat[indiceCUP].codigo;
    
    if (cantidad <= 0) {
        Toastify({text: 'La cantidad debe ser mayor a 0', style: {background: '#f44336'}}).showToast();
        return;
    }
    if (punit <= 0) {
        Toastify({text: 'El precio unitario debe ser mayor a 0', style: {background: '#f44336'}}).showToast();
        return;
    }
    
    buscarXHROcat('calcular_cup', {
        codigo: codigo,
        nuevo_punit: punit,
        nueva_cant: cantidad,
        numero: numero
    }, function(data) {
        if (data.success) {
            detallesOcat[indiceCUP].cantidad = cantidad;
            detallesOcat[indiceCUP].punit = punit;
            detallesOcat[indiceCUP].cup = data.cup;
            detallesOcat[indiceCUP].subtotal = cantidad * punit;
            detallesOcat[indiceCUP].total = cantidad * punit;
            detallesOcat[indiceCUP].canttotal = cantidad;
            
            const modal = document.getElementById('modalCUP');
            modal.classList.add('hidden');
            modal.style.display = 'none';
            indiceCUP = null;
            
            renderizarDetalleOcat();
            calcularTotalesOcat();
            
            Toastify({text: 'CUP calculado: ' + data.cup.toFixed(2), style: {background: '#4caf50'}}).showToast();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}