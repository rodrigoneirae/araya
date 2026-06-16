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