const urlArticulos = (document.currentScript && document.currentScript.dataset.url) || '/';
const csrfToken = document.currentScript?.dataset.csrfToken || '';

let modoEdicion = false;
let tipoOriginal = '';

document.addEventListener('DOMContentLoaded', function() {
    cargarProcesos();
    cargarTipos();
    cargarUMedida();

    const btnEliminar = document.getElementById('btnEliminar');
    if (btnEliminar) {
        btnEliminar.title = 'Inactivar';
        btnEliminar.querySelector('i').className = 'bx bx-no-entry text-xl';
        btnEliminar.classList.remove('bg-red-500', 'hover:bg-red-600');
        btnEliminar.classList.add('bg-amber-500', 'hover:bg-amber-600');
    }

    const codigoInput = document.getElementById('codigo');
    if (codigoInput) {
        codigoInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                buscarPorCodigo();
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
    fetch(urlArticulos, {
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

function cargarProcesos() {
    buscarXHR('listar_procesos', {}, function(data) {
        const select = document.getElementById('procesos');
        if (select && data.procesos) {
            data.procesos.forEach(p => {
                const option = document.createElement('option');
                option.value = p.cod;
                option.textContent = p.nombre;
                select.appendChild(option);
            });
            refrescarSelect2('procesos');
        }
    });
}

function cargarTipos() {
    buscarXHR('listar_tipos', {}, function(data) {
        const select = document.getElementById('tipo');
        if (select && data.tipos) {
            data.tipos.forEach(t => {
                const option = document.createElement('option');
                option.value = t.nombre;
                option.textContent = t.nombre;
                select.appendChild(option);
            });
            refrescarSelect2('tipo');
        }
    });
}

function cargarUMedida() {
    buscarXHR('listar_umedidas', {}, function(data) {
        const select = document.getElementById('um');
        if (select && data.umedidas) {
            data.umedidas.forEach(u => {
                const option = document.createElement('option');
                option.value = u.nombre;
                option.textContent = u.nombre + ' (' + u.abreviatura + ')';
                select.appendChild(option);
            });
            refrescarSelect2('um');
        }
    });
}

function abrirListaArticulos() {
    buscarXHR('listar_codigos', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Lista de Artículos',
            columnas: [
                { title: 'Código', field: 'codigo', width: 100 },
                { title: 'Nombre', field: 'descr' },
                { title: 'Tipo', field: 'tipo', width: 130 },
            ],
            data: data.maestros || [],
            filtroCampos: ['codigo', 'descr', 'tipo'],
            onSelect: function(row) {
                document.getElementById('codigo').value = row.codigo;
                buscarPorCodigo();
            },
            onRefresh: function(opts) {
                buscarXHR('listar_codigos', {}, function(data) {
                    opts.data = data.maestros || [];
                    abrirModalBusqueda(opts);
                });
            },
        });
    });
}

function actualizarSelect2(id) {
    if (typeof jQuery === 'undefined' || !jQuery.fn.select2) return;
    var $el = jQuery('#' + id);
    if ($el.data('select2')) {
        $el.trigger('change');
    }
}

function buscarPorCodigo() {
    const codigo = document.getElementById('codigo').value.trim().toUpperCase();
    if (!codigo) {
        return;
    }
    document.getElementById('codigo').value = codigo;

    modoNuevo = false;
    const btnNuevo = document.getElementById('btnNuevo');
    if (btnNuevo) btnNuevo.innerHTML = '<i class="bx bx-plus text-xl"></i>';
    const btnNuevoTitle = document.getElementById('btnNuevo');
    if (btnNuevoTitle) btnNuevoTitle.title = 'Nuevo';

    buscarXHR('buscar', {codigo: codigo}, function(data) {
        if (data.success && data.data) {
            document.getElementById('nombre').value = data.data.nombre || '';
            document.getElementById('tipo').value = data.data.tipo || '';
            actualizarSelect2('tipo');
            document.getElementById('um').value = data.data.um || '';
            actualizarSelect2('um');
            document.getElementById('stomin').value = data.data.stomin !== null && data.data.stomin !== '' ? data.data.stomin : '';
            document.getElementById('stomax').value = data.data.stomax !== null && data.data.stomax !== '' ? data.data.stomax : '';
            document.getElementById('procesos').value = data.data.proceso || '';
            actualizarSelect2('procesos');
            tipoOriginal = data.data.estado || 'Activo';
            setCamposDisabled(true);
            document.getElementById('btnGuardar').classList.add('hidden');
            document.getElementById('btnEditar').classList.remove('hidden');
            document.getElementById('btnEliminar').classList.remove('hidden');
            actualizarBtnEliminar();
            modoEdicion = false;
            resetBtnEditar();
        } else {
            document.getElementById('articuloForm').reset();
            document.getElementById('codigo').value = codigo;
            setCamposDisabled(false);
            actualizarSelect2('tipo');
            actualizarSelect2('um');
            actualizarSelect2('procesos');
            document.getElementById('btnGuardar').classList.remove('hidden');
            document.getElementById('btnEditar').classList.add('hidden');
            document.getElementById('btnEliminar').classList.add('hidden');
            modoEdicion = false;
            resetBtnEditar();
        }
    });
}

function setCamposDisabled(disabled) {
    ['codigo', 'nombre', 'tipo', 'um', 'stomin', 'stomax', 'procesos'].forEach(id => {
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

let modoNuevo = false;

function nuevoArticulo() {
    const codigoInput = document.getElementById('codigo');
    if (!codigoInput) return;
    const codigo = codigoInput.value.trim();

    if (modoNuevo) {
        modoNuevo = false;
        document.getElementById('articuloForm').reset();
        codigoInput.value = '';
        setCamposDisabled(true);
        actualizarSelect2('tipo');
        actualizarSelect2('um');
        actualizarSelect2('procesos');
        document.getElementById('btnGuardar').classList.add('hidden');
        const btnNuevo = document.getElementById('btnNuevo');
        if (btnNuevo) btnNuevo.innerHTML = '<i class="bx bx-plus text-xl"></i>';
        const btnNuevoTitle = document.getElementById('btnNuevo');
        if (btnNuevoTitle) btnNuevoTitle.title = 'Nuevo';
    } else {
        modoNuevo = true;
        document.getElementById('articuloForm').reset();
        codigoInput.value = '';
        codigoInput.focus();
        setCamposDisabled(false);
        actualizarSelect2('tipo');
        actualizarSelect2('um');
        actualizarSelect2('procesos');
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

function guardarArticulo() {
    const codigo = document.getElementById('codigo').value.trim().toUpperCase();
    if (!codigo) {
        Toastify({text: 'Ingrese un código', style: {background: '#f44336'}}).showToast();
        return;
    }

    buscarXHR('nuevo', {
        codigo: codigo,
        nombre: document.getElementById('nombre').value,
        tipo: document.getElementById('tipo').value,
        um: document.getElementById('um').value,
        stomin: document.getElementById('stomin').value,
        stomax: document.getElementById('stomax').value,
        proceso: document.getElementById('procesos').value
    }, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            buscarPorCodigo();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function editarArticulo() {
    const btn = document.getElementById('btnEditar');

    if (!modoEdicion) {
        modoEdicion = true;
        setCamposDisabled(false);
        document.getElementById('codigo').disabled = true;
        btn.innerHTML = '<i class="bx bx-check text-xl"></i>';
        btn.title = 'Guardar';
        btn.classList.remove('bg-amber-500');
        btn.classList.add('bg-green-500');
        document.getElementById('btnEliminar').classList.add('hidden');
    } else {
        const codigo = document.getElementById('codigo').value.trim().toUpperCase();
        if (!codigo) {
            Toastify({text: 'Seleccione un código', style: {background: '#f44336'}}).showToast();
            return;
        }

        buscarXHR('editar', {
            codigo: codigo,
            nombre: document.getElementById('nombre').value,
            tipo: document.getElementById('tipo').value,
            um: document.getElementById('um').value,
            stomin: document.getElementById('stomin').value,
            stomax: document.getElementById('stomax').value,
            proceso: document.getElementById('procesos').value
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
    btn.classList.remove('bg-red-500', 'hover:bg-red-600', 'bg-amber-500', 'hover:bg-amber-600');
    btn.classList.add(activo ? 'bg-amber-500' : 'bg-green-500', activo ? 'hover:bg-amber-600' : 'hover:bg-green-600');
}

function eliminarArticulo() {
    const codigo = document.getElementById('codigo').value.trim().toUpperCase();
    if (!codigo) {
        Toastify({text: 'Seleccione un código', style: {background: '#f44336'}}).showToast();
        return;
    }
    const activo = tipoOriginal !== 'Inactivo';
    mostrarModalConfirm({
        datos: [
            { label: 'Código', value: codigo },
            { label: 'Nombre', value: document.getElementById('nombre').value || '—' },
        ],
        titulo: activo ? 'Desactivar Artículo' : 'Activar Artículo',
        mensaje: activo ? '¿Está seguro de desactivar este artículo?' : '¿Está seguro de activar este artículo?',
        icono: activo ? 'bx bx-no-entry text-xl sm:text-2xl text-amber-500' : 'bx bx-check-circle text-xl sm:text-2xl text-green-500',
        textoBoton: activo ? 'Desactivar' : 'Activar',
        colorBoton: activo ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-green-500 text-white hover:bg-green-600',
        onConfirm: function() {
            const action = activo ? 'desactivar' : 'activar';
            buscarXHR(action, {codigo: codigo}, function(data) {
                if (data.success) {
                    Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                    if (activo) {
                        nuevoArticulo();
                    } else {
                        buscarPorCodigo();
                    }
                } else {
                    Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
                }
            });
        }
    });
}