const urlProvCliente = (document.currentScript && document.currentScript.dataset.url) || '/';
const csrfToken = document.currentScript?.dataset.csrfToken || '';

let modoEdicion = false;
let modoNuevo = false;
let tipoOriginal = '';

document.addEventListener('DOMContentLoaded', function() {
    cargarTipos();
    cargarCpagos();

    const btnEliminar = document.getElementById('btnEliminar');
    if (btnEliminar) {
        btnEliminar.title = 'Desactivar';
        btnEliminar.querySelector('i').className = 'bx bx-no-entry text-xl';
        btnEliminar.classList.remove('bg-red-500', 'hover:bg-red-600');
        btnEliminar.classList.add('bg-amber-500', 'hover:bg-amber-600');
    }

    const rutInput = document.getElementById('rut');
    if (rutInput) {
        rutInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                buscarPorRut();
            }
        });
    }

    document.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-sucursal-editar]');
        if (btn) {
            const tr = btn.closest('tr');
            abrirModalSucursal({
                id: tr.dataset.id,
                codigo: tr.dataset.codigo,
                nombre: tr.dataset.nombre,
                direccion: tr.dataset.direccion,
                comuna: tr.dataset.comuna,
                ciudad: tr.dataset.ciudad,
                fono: tr.dataset.fono,
                contacto: tr.dataset.contacto,
                estado: tr.dataset.estado,
            });
        }
        const btnDel = e.target.closest('[data-sucursal-eliminar]');
        if (btnDel) {
            const tr = btnDel.closest('tr');
            eliminarSucursal(tr.dataset.id, tr.dataset.nombre);
        }
    });
});

function buscarXHR(action, datos, callback) {
    const formData = new FormData();
    formData.append('action', action);
    for (let key in datos) {
        formData.append(key, datos[key]);
    }
    fetch(urlProvCliente, {
        method: 'POST',
        body: formData,
        headers: {'X-CSRFToken': csrfToken}
    })
    .then(res => res.json())
    .then(callback)
    .catch(err => console.error('Error:', err));
}

function refrescarSelect2(id) {
    if (typeof jQuery === 'undefined' || !jQuery.fn.select2) return;
    var $el = jQuery('#' + id);
    if ($el.data('select2')) {
        $el.select2('destroy');
        $el.removeData('select2');
    }
    if (typeof initSelect2 === 'function') {
        initSelect2(document.getElementById(id).parentElement);
    }
}

function actualizarSelect2(id) {
    if (typeof jQuery === 'undefined' || !jQuery.fn.select2) return;
    var $el = jQuery('#' + id);
    if ($el.data('select2')) {
        $el.trigger('change');
    }
}

function cargarTipos() {
    buscarXHR('listar_tipos', {}, function(data) {
        const select = document.getElementById('tipo');
        if (select && data.tipos) {
            data.tipos.forEach(t => {
                const option = document.createElement('option');
                option.value = t.cod;
                option.textContent = t.descr;
                select.appendChild(option);
            });
            refrescarSelect2('tipo');
        }
    });
}

function cargarCpagos() {
    buscarXHR('listar_cpagos', {}, function(data) {
        const select = document.getElementById('cpago');
        if (select && data.cpagos) {
            data.cpagos.forEach(c => {
                const option = document.createElement('option');
                option.value = c.cod;
                option.textContent = c.descr + (c.dias ? ' (' + c.dias + ' días)' : '');
                select.appendChild(option);
            });
            refrescarSelect2('cpago');
        }
    });
}

function abrirListaClientes() {
    buscarXHR('listar_ruts', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Lista de Clientes/Proveedores',
            columnas: [
                { title: 'RUT', field: 'rut', width: 140 },
                { title: 'Nombre', field: 'nombre' },
                { title: 'Tipo', field: 'tipo', width: 120 },
            ],
            data: data.clientes || [],
            filtroCampos: ['rut', 'nombre', 'tipo'],
            onSelect: function(row) {
                document.getElementById('rut').value = row.rut;
                buscarPorRut();
            },
            onRefresh: function(opts) {
                buscarXHR('listar_ruts', {}, function(data) {
                    opts.data = data.clientes || [];
                    abrirModalBusqueda(opts);
                });
            },
        });
    });
}

function buscarPorRut() {
    const rut = document.getElementById('rut').value.trim().toUpperCase();
    if (!rut) {
        return;
    }
    document.getElementById('rut').value = rut;

    modoNuevo = false;
    const btnNuevo = document.getElementById('btnNuevo');
    if (btnNuevo) btnNuevo.innerHTML = '<i class="bx bx-plus text-xl"></i>';
    const btnNuevoTitle = document.getElementById('btnNuevo');
    if (btnNuevoTitle) btnNuevoTitle.title = 'Nuevo';

    buscarXHR('buscar', {rut: rut}, function(data) {
        if (data.success && data.data) {
            document.getElementById('rut').value = data.data.rut || '';
            document.getElementById('dig_ver').value = data.data.dig_ver || '';
            document.getElementById('nombre').value = data.data.nombre || '';
            document.getElementById('tipo').value = data.data.tipo || '';
            actualizarSelect2('tipo');
            document.getElementById('sigla').value = data.data.sigla || '';
            document.getElementById('giro').value = data.data.giro || '';
            document.getElementById('direccion').value = data.data.direccion || '';
            document.getElementById('comuna').value = data.data.comuna || '';
            document.getElementById('ciudad').value = data.data.ciudad || '';
            document.getElementById('fono').value = data.data.fono || '';
            document.getElementById('fax').value = data.data.fax || '';
            document.getElementById('email').value = data.data.email || '';
            document.getElementById('cpago').value = data.data.cpago || '';
            actualizarSelect2('cpago');
            document.getElementById('contacto').value = data.data.contacto || '';
            document.getElementById('emailcontacto').value = data.data.emailcontacto || '';
            setCamposDisabled(true);
            tipoOriginal = data.data.tipo || '';
            document.getElementById('btnGuardar').classList.add('hidden');
            document.getElementById('btnEditar').classList.remove('hidden');
            document.getElementById('btnEliminar').classList.remove('hidden');
            actualizarBtnEliminar();
            modoEdicion = false;
            resetBtnEditar();
            cargarSucursales();
        } else {
            document.getElementById('clienteForm').reset();
            document.getElementById('rut').value = rut;
            setCamposDisabled(false);
            actualizarSelect2('tipo');
            actualizarSelect2('cpago');
            document.getElementById('btnGuardar').classList.remove('hidden');
            document.getElementById('btnEditar').classList.add('hidden');
            document.getElementById('btnEliminar').classList.add('hidden');
            modoEdicion = false;
            resetBtnEditar();
            document.getElementById('sucursalesSection').classList.add('hidden');
        }
    });
}

let sucursalEditandoId = null;

function cargarSucursales() {
    const rut = document.getElementById('rut').value.trim().toUpperCase();
    if (!rut) return;
    buscarXHR('listar_sucursales', {rut: rut}, function(data) {
        const section = document.getElementById('sucursalesSection');
        const tbody = document.getElementById('sucursalesTableBody');
        if (!data.success) {
            section.classList.add('hidden');
            return;
        }
        section.classList.remove('hidden');
        tbody.innerHTML = '';
        if (!data.sucursales || data.sucursales.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="px-3 py-4 text-center text-aq-text/60">No hay sucursales registradas</td></tr>';
            return;
        }
        data.sucursales.forEach(s => {
            const tr = document.createElement('tr');
            tr.className = 'border-t border-aq-border hover:bg-aq-surface-alt/50';
            tr.dataset.id = s.id;
            tr.dataset.codigo = s.codigo || '';
            tr.dataset.nombre = s.nombre || '';
            tr.dataset.direccion = s.direccion || '';
            tr.dataset.comuna = s.comuna || '';
            tr.dataset.ciudad = s.ciudad || '';
            tr.dataset.fono = s.fono || '';
            tr.dataset.contacto = s.contacto || '';
            tr.dataset.estado = s.estado ? '1' : '0';
            tr.innerHTML = `
                <td class="px-3 py-2">${s.codigo || ''}</td>
                <td class="px-3 py-2">${s.nombre || ''}</td>
                <td class="px-3 py-2">${s.direccion || ''}</td>
                <td class="px-3 py-2">${s.comuna || ''}</td>
                <td class="px-3 py-2">${s.ciudad || ''}</td>
                <td class="px-3 py-2">${s.fono || ''}</td>
                <td class="px-3 py-2">${s.contacto || ''}</td>
                <td class="px-3 py-2 text-center">${s.estado ? '<span class="text-green-500"><i class="bx bx-check-circle"></i></span>' : '<span class="text-red-400"><i class="bx bx-x-circle"></i></span>'}</td>
                <td class="px-3 py-2 text-center">
                    <button type="button" data-sucursal-editar class="text-amber-500 hover:text-amber-600 mr-2" title="Editar">
                        <i class="bx bx-edit"></i>
                    </button>
                    <button type="button" data-sucursal-eliminar class="text-red-500 hover:text-red-600" title="Eliminar">
                        <i class="bx bx-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

function abrirModalSucursal(data) {
    if (data) {
        document.getElementById('modalSucursalTitle').textContent = 'Editar Sucursal';
        document.getElementById('sucursalId').value = data.id || '';
        document.getElementById('sucursalCodigo').value = data.codigo || '';
        document.getElementById('sucursalNombre').value = data.nombre || '';
        document.getElementById('sucursalDireccion').value = data.direccion || '';
        document.getElementById('sucursalComuna').value = data.comuna || '';
        document.getElementById('sucursalCiudad').value = data.ciudad || '';
        document.getElementById('sucursalFono').value = data.fono || '';
        document.getElementById('sucursalContacto').value = data.contacto || '';
        document.getElementById('sucursalEstado').value = data.estado === '1' || data.estado === true ? '1' : '0';
        sucursalEditandoId = data.id || null;
    } else {
        document.getElementById('modalSucursalTitle').textContent = 'Nueva Sucursal';
        document.getElementById('sucursalForm').reset();
        document.getElementById('sucursalEstado').value = '1';
        sucursalEditandoId = null;
    }
    document.getElementById('modalSucursal').classList.remove('hidden');
}

function cerrarModalSucursal() {
    document.getElementById('modalSucursal').classList.add('hidden');
}

function guardarSucursal() {
    const codigo = document.getElementById('sucursalCodigo').value.trim();
    const nombre = document.getElementById('sucursalNombre').value.trim();
    if (!codigo) { Toastify({text: 'Ingrese un código', style: {background: '#f44336'}}).showToast(); return; }
    if (!nombre) { Toastify({text: 'Ingrese un nombre', style: {background: '#f44336'}}).showToast(); return; }

    const rut = document.getElementById('rut').value.trim().toUpperCase();
    const datos = {
        rut: rut,
        codigo: codigo,
        nombre: nombre,
        direccion: document.getElementById('sucursalDireccion').value,
        comuna: document.getElementById('sucursalComuna').value,
        ciudad: document.getElementById('sucursalCiudad').value,
        fono: document.getElementById('sucursalFono').value,
        contacto: document.getElementById('sucursalContacto').value,
        estado: document.getElementById('sucursalEstado').value,
    };

    const action = sucursalEditandoId ? 'editar_sucursal' : 'nueva_sucursal';
    if (sucursalEditandoId) datos.id = sucursalEditandoId;

    buscarXHR(action, datos, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            cerrarModalSucursal();
            cargarSucursales();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function eliminarSucursal(id, nombre) {
    mostrarModalConfirm({
        titulo: 'Eliminar Sucursal',
        mensaje: `¿Está seguro de eliminar la sucursal "${nombre}"?`,
        datos: [],
        icono: 'bx bx-trash text-xl sm:text-2xl text-red-500',
        textoBoton: 'Eliminar',
        colorBoton: 'bg-red-500 text-white hover:bg-red-600',
        onConfirm: function() {
            buscarXHR('eliminar_sucursal', {id: id}, function(data) {
                if (data.success) {
                    Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                    cargarSucursales();
                } else {
                    Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
                }
            });
        }
    });
}

function setCamposDisabled(disabled) {
    ['rut', 'dig_ver', 'nombre', 'tipo', 'sigla', 'giro', 'direccion', 'comuna', 'ciudad', 'fono', 'fax', 'email', 'cpago', 'contacto', 'emailcontacto'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.tagName === 'SELECT' && typeof jQuery !== 'undefined' && jQuery.fn.select2) {
            jQuery(el).prop('disabled', disabled);
            if (jQuery(el).data('select2')) {
                jQuery(el).trigger('change.select2');
            }
        } else {
            el.disabled = disabled;
        }
    });
}

function nuevoCliente() {
    const rutInput = document.getElementById('rut');
    if (!rutInput) return;
    const rut = rutInput.value.trim();

    if (modoNuevo) {
        modoNuevo = false;
        document.getElementById('clienteForm').reset();
        rutInput.value = '';
        setCamposDisabled(true);
        actualizarSelect2('tipo');
        actualizarSelect2('cpago');
        document.getElementById('btnGuardar').classList.add('hidden');
        const btnNuevo = document.getElementById('btnNuevo');
        if (btnNuevo) btnNuevo.innerHTML = '<i class="bx bx-plus text-xl"></i>';
        const btnNuevoTitle = document.getElementById('btnNuevo');
        if (btnNuevoTitle) btnNuevoTitle.title = 'Nuevo';
    } else {
        modoNuevo = true;
        document.getElementById('clienteForm').reset();
        rutInput.value = '';
        rutInput.focus();
        setCamposDisabled(false);
        actualizarSelect2('tipo');
        actualizarSelect2('cpago');
        document.getElementById('btnGuardar').classList.remove('hidden');
        const btnNuevo = document.getElementById('btnNuevo');
        if (btnNuevo) btnNuevo.innerHTML = '<i class="bx bx-x text-xl"></i>';
        const btnNuevoTitle = document.getElementById('btnNuevo');
        if (btnNuevoTitle) btnNuevoTitle.title = 'Cancelar';
    }

    document.getElementById('btnEditar').classList.add('hidden');
    document.getElementById('btnEliminar').classList.add('hidden');
    resetBtnEditar();
    modoEdicion = false;
}

function resetBtnEditar() {
    const btn = document.getElementById('btnEditar');
    if (!btn) return;
    btn.innerHTML = '<i class="bx bx-edit text-xl"></i>';
    btn.title = 'Editar';
    btn.classList.remove('bg-green-500');
    btn.classList.add('bg-amber-500');
}

function guardarCliente() {
    const rut = document.getElementById('rut').value.trim().toUpperCase();
    if (!rut) {
        Toastify({text: 'Ingrese un RUT', style: {background: '#f44336'}}).showToast();
        return;
    }
    const nombre = document.getElementById('nombre').value.trim();
    if (!nombre) {
        Toastify({text: 'Ingrese un nombre', style: {background: '#f44336'}}).showToast();
        return;
    }

    buscarXHR('nuevo', {
        rut: rut,
        dig_ver: document.getElementById('dig_ver').value,
        nombre: nombre,
        tipo: document.getElementById('tipo').value,
        sigla: document.getElementById('sigla').value,
        giro: document.getElementById('giro').value,
        direccion: document.getElementById('direccion').value,
        comuna: document.getElementById('comuna').value,
        ciudad: document.getElementById('ciudad').value,
        fono: document.getElementById('fono').value,
        fax: document.getElementById('fax').value,
        email: document.getElementById('email').value,
        cpago: document.getElementById('cpago').value,
        contacto: document.getElementById('contacto').value,
        emailcontacto: document.getElementById('emailcontacto').value
    }, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            buscarPorRut();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function editarCliente() {
    const btn = document.getElementById('btnEditar');

    if (!modoEdicion) {
        modoEdicion = true;
        setCamposDisabled(false);
        btn.innerHTML = '<i class="bx bx-check text-xl"></i>';
        btn.title = 'Guardar';
        btn.classList.remove('bg-amber-500');
        btn.classList.add('bg-green-500');
        document.getElementById('btnEliminar').classList.add('hidden');
    } else {
        const rut = document.getElementById('rut').value.trim().toUpperCase();
        if (!rut) {
            Toastify({text: 'Seleccione un RUT', style: {background: '#f44336'}}).showToast();
            return;
        }

        buscarXHR('editar', {
            rut: rut,
            dig_ver: document.getElementById('dig_ver').value,
            nombre: document.getElementById('nombre').value,
            tipo: document.getElementById('tipo').value,
            sigla: document.getElementById('sigla').value,
            giro: document.getElementById('giro').value,
            direccion: document.getElementById('direccion').value,
            comuna: document.getElementById('comuna').value,
            ciudad: document.getElementById('ciudad').value,
            fono: document.getElementById('fono').value,
            fax: document.getElementById('fax').value,
            email: document.getElementById('email').value,
            cpago: document.getElementById('cpago').value,
            contacto: document.getElementById('contacto').value,
            emailcontacto: document.getElementById('emailcontacto').value
        }, function(data) {
            if (data.success) {
                Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                modoEdicion = false;
                setCamposDisabled(true);
                resetBtnEditar();
                document.getElementById('btnEliminar').classList.remove('hidden');
            } else {
                Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
            }
        });
    }
}

function actualizarBtnEliminar() {
    const btn = document.getElementById('btnEliminar');
    if (!btn) return;
    const activo = tipoOriginal !== 'Inactivo';
    btn.title = activo ? 'Desactivar' : 'Activar';
    btn.querySelector('i').className = activo ? 'bx bx-no-entry text-xl' : 'bx bx-check-circle text-xl';
    btn.classList.remove('bg-red-500', 'hover:bg-red-600', 'bg-amber-500', 'hover:bg-amber-600', 'bg-green-500', 'hover:bg-green-600');
    btn.classList.add(activo ? 'bg-amber-500' : 'bg-green-500', activo ? 'hover:bg-amber-600' : 'hover:bg-green-600');
}

function eliminarCliente() {
    const rut = document.getElementById('rut').value.trim().toUpperCase();
    if (!rut) {
        Toastify({text: 'Seleccione un RUT', style: {background: '#f44336'}}).showToast();
        return;
    }
    const activo = tipoOriginal !== 'Inactivo';
    mostrarModalConfirm({
        datos: [
            { label: 'RUT', value: rut },
            { label: 'Nombre', value: document.getElementById('nombre').value || '—' },
        ],
        titulo: activo ? 'Desactivar Cliente/Proveedor' : 'Activar Cliente/Proveedor',
        mensaje: activo ? '¿Está seguro de desactivar este registro?' : '¿Está seguro de activar este registro?',
        icono: activo ? 'bx bx-no-entry text-xl sm:text-2xl text-amber-500' : 'bx bx-check-circle text-xl sm:text-2xl text-green-500',
        textoBoton: activo ? 'Desactivar' : 'Activar',
        colorBoton: activo ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-green-500 text-white hover:bg-green-600',
        onConfirm: function() {
            const action = activo ? 'desactivar' : 'activar';
            buscarXHR(action, {rut: rut}, function(data) {
                if (data.success) {
                    Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                    if (activo) {
                        nuevoCliente();
                    } else {
                        buscarPorRut();
                    }
                } else {
                    Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
                }
            });
        }
    });
}