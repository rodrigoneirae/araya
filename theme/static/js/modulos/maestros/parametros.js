const urlParametros = (document.currentScript?.dataset.url) || '/';
const csrfToken = document.currentScript?.dataset.csrfToken || '';

document.addEventListener('DOMContentLoaded', function() {
    const addEnterAndBlur = (id, fn) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') { fn(); }
        });
        el.addEventListener('blur', function() {
            fn();
        });
    };
    addEnterAndBlur('bodegaCod', buscarPorCodigoBodega);
    addEnterAndBlur('docCod', buscarPorCodigoDoc);
    addEnterAndBlur('procesoCod', buscarPorCodigoProceso);
    addEnterAndBlur('empleadoCod', buscarPorCodigoEmpleado);
    addEnterAndBlur('cpagoCod', buscarPorCodigoCpago);
    addEnterAndBlur('transportistaRut', buscarPorRutTransportista);
    addEnterAndBlur('clasificacionCod', buscarPorCodigoClasificacion);
    addEnterAndBlur('tratamientoCod', buscarPorCodigoTratamiento);
    cargarTratamientosOptions();

    const chk = document.getElementById('patentesMostrarSinAsignar');
    if (chk) {
        chk.addEventListener('change', cargarPatentesParaTransportistaActual);
    }
});

function buscarXHRBodega(action, datos, callback) {
    const formData = new FormData();
    formData.append('action', action);
    for (let key in datos) { formData.append(key, datos[key]); }
    fetch(urlParametros, {
        method: 'POST',
        body: formData,
        headers: {'X-CSRFToken': csrfToken}
    })
    .then(res => res.json())
    .then(callback)
    .catch(err => console.error('Error:', err));
}

let modoEdicionBodega = false;
let modoNuevoBodega = false;
let estadoOriginalBodega = 'Activo';

function buscarPorCodigoBodega() {
    const cod = document.getElementById('bodegaCod').value.trim();
    if (!cod) { return; }
    modoNuevoBodega = false;
    document.getElementById('btnNuevoBodega').innerHTML = '<i class="bx bx-plus text-xl"></i>';
    document.getElementById('btnNuevoBodega').title = 'Nueva';

    buscarXHRBodega('buscar_bodega', {cod: cod}, function(data) {
        if (data.success && data.data) {
            document.getElementById('bodegaCod').value = data.data.cod;
            document.getElementById('bodegaNombre').value = data.data.nombre || '';
            document.getElementById('bodegaGlosa').value = data.data.glosa || '';
            document.getElementById('bodegaEstado').checked = data.data.estado === 'Activo';
            estadoOriginalBodega = data.data.estado || 'Activo';
            setCamposBodegaDisabled(true);
            document.getElementById('btnGuardarBodega').classList.add('hidden');
            document.getElementById('btnEditarBodega').classList.remove('hidden');
            actualizarBtnEliminarBodega();
            modoEdicionBodega = false;
            resetBtnEditarBodega();
        } else {
            document.getElementById('bodegaForm').reset();
            document.getElementById('bodegaCod').value = cod;
            document.getElementById('bodegaEstado').checked = true;
            estadoOriginalBodega = 'Activo';
            setCamposBodegaDisabled(false);
            document.getElementById('btnGuardarBodega').classList.remove('hidden');
            document.getElementById('btnEditarBodega').classList.add('hidden');
            document.getElementById('btnEliminarBodega').classList.add('hidden');
            modoEdicionBodega = false;
            resetBtnEditarBodega();
        }
    });
}

function setCamposBodegaDisabled(disabled) {
    ['bodegaNombre', 'bodegaGlosa'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabled;
    });
}

function nuevaBodega() {
    if (modoNuevoBodega) {
        modoNuevoBodega = false;
        document.getElementById('bodegaForm').reset();
        document.getElementById('bodegaCod').value = '';
        setCamposBodegaDisabled(true);
        document.getElementById('btnGuardarBodega').classList.add('hidden');
        document.getElementById('btnNuevoBodega').innerHTML = '<i class="bx bx-plus text-xl"></i>';
        document.getElementById('btnNuevoBodega').title = 'Nueva';
    } else {
        modoNuevoBodega = true;
        document.getElementById('bodegaForm').reset();
        document.getElementById('bodegaCod').value = '';
        document.getElementById('bodegaCod').focus();
        setCamposBodegaDisabled(false);
        document.getElementById('btnGuardarBodega').classList.remove('hidden');
        document.getElementById('btnNuevoBodega').innerHTML = '<i class="bx bx-x text-xl"></i>';
        document.getElementById('btnNuevoBodega').title = 'Cancelar';
    }
    document.getElementById('btnEditarBodega').classList.add('hidden');
    document.getElementById('btnEliminarBodega').classList.add('hidden');
    resetBtnEditarBodega();
    modoEdicionBodega = false;
}

function resetBtnEditarBodega() {
    const btn = document.getElementById('btnEditarBodega');
    if (!btn) return;
    btn.innerHTML = '<i class="bx bx-edit text-xl"></i>';
    btn.title = 'Editar';
    btn.classList.remove('bg-green-500');
    btn.classList.add('bg-amber-500');
}

function guardarBodega() {
    const cod = document.getElementById('bodegaCod').value.trim();
    if (!cod) {
        Toastify({text: 'Ingrese un código', style: {background: '#f44336'}}).showToast();
        return;
    }
    const nombre = document.getElementById('bodegaNombre').value.trim();
    if (!nombre) {
        Toastify({text: 'Ingrese un nombre', style: {background: '#f44336'}}).showToast();
        return;
    }

    buscarXHRBodega('nueva_bodega', {
        cod: cod,
        nombre: nombre,
        glosa: document.getElementById('bodegaGlosa').value
    }, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            buscarPorCodigoBodega();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function editarBodega() {
    const btn = document.getElementById('btnEditarBodega');
    if (!modoEdicionBodega) {
        modoEdicionBodega = true;
        setCamposBodegaDisabled(false);
        btn.innerHTML = '<i class="bx bx-check text-xl"></i>';
        btn.title = 'Guardar';
        btn.classList.remove('bg-amber-500');
        btn.classList.add('bg-green-500');
        document.getElementById('btnEliminarBodega').classList.add('hidden');
    } else {
        const cod = document.getElementById('bodegaCod').value.trim();
        if (!cod) {
            Toastify({text: 'Seleccione un código', style: {background: '#f44336'}}).showToast();
            return;
        }
        buscarXHRBodega('editar_bodega', {
            cod: cod,
            nombre: document.getElementById('bodegaNombre').value,
            glosa: document.getElementById('bodegaGlosa').value
        }, function(data) {
            if (data.success) {
                Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                modoEdicionBodega = false;
                setCamposBodegaDisabled(true);
                resetBtnEditarBodega();
                document.getElementById('btnEliminarBodega').classList.remove('hidden');
            } else {
                Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
            }
        });
    }
}

function actualizarBtnEliminarBodega() {
    const btn = document.getElementById('btnEliminarBodega');
    if (!btn) return;
    const esActivo = estadoOriginalBodega === 'Activo';
    btn.title = esActivo ? 'Desactivar' : 'Activar';
    btn.querySelector('i').className = esActivo ? 'bx bx-no-entry text-xl' : 'bx bx-check-circle text-xl';
    btn.classList.remove('bg-red-500', 'hover:bg-red-600', 'bg-amber-500', 'hover:bg-amber-600');
    btn.classList.add(esActivo ? 'bg-amber-500' : 'bg-green-500', esActivo ? 'hover:bg-amber-600' : 'hover:bg-green-600');
}

function desactivarBodega() {
    const cod = document.getElementById('bodegaCod').value.trim();
    if (!cod) {
        Toastify({text: 'Seleccione una bodega', style: {background: '#f44336'}}).showToast();
        return;
    }
    const esActivo = estadoOriginalBodega === 'Activo';
    mostrarModalConfirm({
        datos: [
            { label: 'Código', value: cod },
            { label: 'Nombre', value: document.getElementById('bodegaNombre').value || '—' },
        ],
        titulo: esActivo ? 'Desactivar Bodega' : 'Activar Bodega',
        mensaje: esActivo ? '¿Está seguro de desactivar esta bodega?' : '¿Está seguro de activar esta bodega?',
        icono: esActivo ? 'bx bx-no-entry text-xl sm:text-2xl text-amber-500' : 'bx bx-check-circle text-xl sm:text-2xl text-green-500',
        textoBoton: esActivo ? 'Desactivar' : 'Activar',
        colorBoton: esActivo ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-green-500 text-white hover:bg-green-600',
        onConfirm: function() {
            const action = esActivo ? 'desactivar_bodega' : 'activar_bodega';
            buscarXHRBodega(action, {cod: cod}, function(data) {
                if (data.success) {
                    Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                    if (esActivo) {
                        nuevaBodega();
                    } else {
                        buscarPorCodigoBodega();
                    }
                } else {
                    Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
                }
            });
        }
    });
}

function abrirListaBodegas() {
    buscarXHRBodega('listar_bodegas', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Lista de Bodegas',
            columnas: [
                { title: 'Código', field: 'cod', width: 100 },
                { title: 'Nombre', field: 'nombre' },
            ],
            data: data.bodegas || [],
            filtroCampos: ['cod', 'nombre'],
            onSelect: function(row) {
                document.getElementById('bodegaCod').value = row.cod;
                buscarPorCodigoBodega();
            },
            onRefresh: function(opts) {
                buscarXHRBodega('listar_bodegas', {}, function(data) {
                    opts.data = data.bodegas || [];
                    abrirModalBusqueda(opts);
                });
            },
        });
    });
}

function seleccionarBodega(cod, nombre, glosa) {
    document.getElementById('bodegaCod').value = cod;
    document.getElementById('bodegaNombre').value = nombre;
    document.getElementById('bodegaGlosa').value = glosa || '';
    setCamposBodegaDisabled(true);
    document.getElementById('btnGuardarBodega').classList.add('hidden');
    document.getElementById('btnEditarBodega').classList.remove('hidden');
    document.getElementById('btnEliminarBodega').classList.remove('hidden');
    modoEdicionBodega = false;
    resetBtnEditarBodega();
    modoNuevoBodega = false;
    document.getElementById('btnNuevoBodega').innerHTML = '<i class="bx bx-plus text-xl"></i>';
    document.getElementById('btnNuevoBodega').title = 'Nueva';
}

let modoEdicionDoc = false;
let modoNuevoDoc = false;
let estadoOriginalDoc = 'Activo';

function buscarXHRDoc(action, datos, callback) {
    const formData = new FormData();
    formData.append('action', action);
    for (let key in datos) { formData.append(key, datos[key]); }
    fetch(urlParametros, {
        method: 'POST',
        body: formData,
        headers: {'X-CSRFToken': csrfToken}
    })
    .then(res => res.json())
    .then(callback)
    .catch(err => console.error('Error:', err));
}

function buscarPorCodigoDoc() {
    const cod = document.getElementById('docCod').value.trim();
    if (!cod) { return; }
    modoNuevoDoc = false;
    document.getElementById('btnNuevoDoc').innerHTML = '<i class="bx bx-plus text-xl"></i>';
    document.getElementById('btnNuevoDoc').title = 'Nueva';

    buscarXHRDoc('buscar_doc', {cod: cod}, function(data) {
        if (data.success && data.data) {
            document.getElementById('docCod').value = data.data.cod;
            document.getElementById('docNombre').value = data.data.nombre || '';
            const signoVal = data.data.signo !== null && data.data.signo !== '' ? String(data.data.signo) : '';
            if (typeof jQuery !== 'undefined' && jQuery.fn.select2 && jQuery('#docSigno').data('select2')) {
                jQuery('#docSigno').val(signoVal).trigger('change');
            } else {
                document.getElementById('docSigno').value = signoVal;
            }
            document.getElementById('docEstado').checked = data.data.estado === 'Activo';
            estadoOriginalDoc = data.data.estado || 'Activo';
            setCamposDocDisabled(true);
            document.getElementById('btnGuardarDoc').classList.add('hidden');
            document.getElementById('btnEditarDoc').classList.remove('hidden');
            actualizarBtnEliminarDoc();
            modoEdicionDoc = false;
            resetBtnEditarDoc();
        } else {
            document.getElementById('docForm').reset();
            document.getElementById('docCod').value = cod;
            document.getElementById('docEstado').checked = true;
            estadoOriginalDoc = 'Activo';
            setCamposDocDisabled(false);
            document.getElementById('btnGuardarDoc').classList.remove('hidden');
            document.getElementById('btnEditarDoc').classList.add('hidden');
            document.getElementById('btnEliminarDoc').classList.add('hidden');
            modoEdicionDoc = false;
            resetBtnEditarDoc();
        }
    });
}

function setCamposDocDisabled(disabled) {
    ['docNombre'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabled;
    });
    const signoSel = document.getElementById('docSigno');
    if (signoSel) {
        if (disabled) {
            if (typeof jQuery !== 'undefined' && jQuery.fn.select2 && jQuery(signoSel).data('select2')) {
                jQuery(signoSel).select2('enable', false);
            } else {
                signoSel.disabled = true;
            }
        } else {
            if (typeof jQuery !== 'undefined' && jQuery.fn.select2 && jQuery(signoSel).data('select2')) {
                jQuery(signoSel).select2('enable', true);
            } else {
                signoSel.disabled = false;
            }
        }
    }
}

function nuevaDoc() {
    if (modoNuevoDoc) {
        modoNuevoDoc = false;
        document.getElementById('docForm').reset();
        document.getElementById('docCod').value = '';
        setCamposDocDisabled(true);
        document.getElementById('btnGuardarDoc').classList.add('hidden');
        document.getElementById('btnNuevoDoc').innerHTML = '<i class="bx bx-plus text-xl"></i>';
        document.getElementById('btnNuevoDoc').title = 'Nueva';
    } else {
        modoNuevoDoc = true;
        document.getElementById('docForm').reset();
        document.getElementById('docCod').value = '';
        document.getElementById('docCod').focus();
        setCamposDocDisabled(false);
        document.getElementById('btnGuardarDoc').classList.remove('hidden');
        document.getElementById('btnNuevoDoc').innerHTML = '<i class="bx bx-x text-xl"></i>';
        document.getElementById('btnNuevoDoc').title = 'Cancelar';
    }
    document.getElementById('btnEditarDoc').classList.add('hidden');
    document.getElementById('btnEliminarDoc').classList.add('hidden');
    resetBtnEditarDoc();
    modoEdicionDoc = false;
}

function resetBtnEditarDoc() {
    const btn = document.getElementById('btnEditarDoc');
    if (!btn) return;
    btn.innerHTML = '<i class="bx bx-edit text-xl"></i>';
    btn.title = 'Editar';
    btn.classList.remove('bg-green-500');
    btn.classList.add('bg-amber-500');
}

function guardarDoc() {
    const cod = document.getElementById('docCod').value.trim();
    if (!cod) {
        Toastify({text: 'Ingrese un código', style: {background: '#f44336'}}).showToast();
        return;
    }
    const nombre = document.getElementById('docNombre').value.trim();
    if (!nombre) {
        Toastify({text: 'Ingrese un nombre', style: {background: '#f44336'}}).showToast();
        return;
    }

    buscarXHRDoc('nueva_doc', {
        cod: cod,
        nombre: nombre,
        signo: document.getElementById('docSigno').value
    }, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            buscarPorCodigoDoc();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function editarDoc() {
    const btn = document.getElementById('btnEditarDoc');
    if (!modoEdicionDoc) {
        modoEdicionDoc = true;
        setCamposDocDisabled(false);
        btn.innerHTML = '<i class="bx bx-check text-xl"></i>';
        btn.title = 'Guardar';
        btn.classList.remove('bg-amber-500');
        btn.classList.add('bg-green-500');
        document.getElementById('btnEliminarDoc').classList.add('hidden');
    } else {
        const cod = document.getElementById('docCod').value.trim();
        if (!cod) {
            Toastify({text: 'Seleccione un código', style: {background: '#f44336'}}).showToast();
            return;
        }
        buscarXHRDoc('editar_doc', {
            cod: cod,
            nombre: document.getElementById('docNombre').value,
            signo: document.getElementById('docSigno').value
        }, function(data) {
            if (data.success) {
                Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                modoEdicionDoc = false;
                setCamposDocDisabled(true);
                resetBtnEditarDoc();
                document.getElementById('btnEliminarDoc').classList.remove('hidden');
            } else {
                Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
            }
        });
    }
}

function eliminarDoc() {
    const cod = document.getElementById('docCod').value.trim();
    if (!cod) {
        Toastify({text: 'Seleccione un documento', style: {background: '#f44336'}}).showToast();
        return;
    }
    const esActivo = estadoOriginalDoc === 'Activo';
    mostrarModalConfirm({
        datos: [
            { label: 'Código', value: cod },
            { label: 'Nombre', value: document.getElementById('docNombre').value || '—' },
        ],
        titulo: esActivo ? 'Desactivar Documento' : 'Activar Documento',
        mensaje: esActivo ? '¿Está seguro de desactivar este documento?' : '¿Está seguro de activar este documento?',
        icono: esActivo ? 'bx bx-no-entry text-xl sm:text-2xl text-amber-500' : 'bx bx-check-circle text-xl sm:text-2xl text-green-500',
        textoBoton: esActivo ? 'Desactivar' : 'Activar',
        colorBoton: esActivo ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-green-500 text-white hover:bg-green-600',
        onConfirm: function() {
            const action = esActivo ? 'desactivar_doc' : 'activar_doc';
            buscarXHRDoc(action, {cod: cod}, function(data) {
                if (data.success) {
                    Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                    if (esActivo) {
                        nuevaDoc();
                    } else {
                        buscarPorCodigoDoc();
                    }
                } else {
                    Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
                }
            });
        }
    });
}

function actualizarBtnEliminarDoc() {
    const btn = document.getElementById('btnEliminarDoc');
    if (!btn) return;
    const esActivo = estadoOriginalDoc === 'Activo';
    btn.title = esActivo ? 'Desactivar' : 'Activar';
    btn.querySelector('i').className = esActivo ? 'bx bx-no-entry text-xl' : 'bx bx-check-circle text-xl';
    btn.classList.remove('bg-red-500', 'hover:bg-red-600', 'bg-amber-500', 'hover:bg-amber-600');
    btn.classList.add(esActivo ? 'bg-amber-500' : 'bg-green-500', esActivo ? 'hover:bg-amber-600' : 'hover:bg-green-600');
}

function abrirListaDocs() {
    buscarXHRDoc('listar_docs', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Lista de Documentos',
            columnas: [
                { title: 'Código', field: 'cod', width: 100 },
                { title: 'Nombre', field: 'nombre' },
                { title: 'Signo', field: 'signo', width: 80 },
            ],
            data: data.docs || [],
            filtroCampos: ['cod', 'nombre'],
            onSelect: function(row) {
                document.getElementById('docCod').value = row.cod;
                buscarPorCodigoDoc();
            },
            onRefresh: function(opts) {
                buscarXHRDoc('listar_docs', {}, function(data) {
                    opts.data = data.docs || [];
                    abrirModalBusqueda(opts);
                });
            },
        });
    });
}

function seleccionarDoc(cod, nombre, signo) {
    document.getElementById('docCod').value = cod;
    document.getElementById('docNombre').value = nombre;
    const signoVal = signo !== null && signo !== '' ? String(signo) : '';
    if (typeof jQuery !== 'undefined' && jQuery.fn.select2 && jQuery('#docSigno').data('select2')) {
        jQuery('#docSigno').val(signoVal).trigger('change');
    } else {
        document.getElementById('docSigno').value = signoVal;
    }
    setCamposDocDisabled(true);
    document.getElementById('btnGuardarDoc').classList.add('hidden');
    document.getElementById('btnEditarDoc').classList.remove('hidden');
    document.getElementById('btnEliminarDoc').classList.remove('hidden');
    modoEdicionDoc = false;
    resetBtnEditarDoc();
    modoNuevoDoc = false;
    document.getElementById('btnNuevoDoc').innerHTML = '<i class="bx bx-plus text-xl"></i>';
    document.getElementById('btnNuevoDoc').title = 'Nueva';
}

let modoEdicionProceso = false;
let modoNuevoProceso = false;
let estadoOriginalProceso = 'Activo';

function buscarXHRProceso(action, datos, callback) {
    const formData = new FormData();
    formData.append('action', action);
    for (let key in datos) { formData.append(key, datos[key]); }
    fetch(urlParametros, {
        method: 'POST',
        body: formData,
        headers: {'X-CSRFToken': csrfToken}
    })
    .then(res => res.json())
    .then(callback)
    .catch(err => console.error('Error:', err));
}

function buscarPorCodigoProceso() {
    const cod = document.getElementById('procesoCod').value.trim();
    if (!cod) { return; }
    modoNuevoProceso = false;
    document.getElementById('btnNuevoProceso').innerHTML = '<i class="bx bx-plus text-xl"></i>';
    document.getElementById('btnNuevoProceso').title = 'Nuevo';

    buscarXHRProceso('buscar_proceso', {cod: cod}, function(data) {
        if (data.success && data.data) {
            document.getElementById('procesoCod').value = data.data.cod;
            document.getElementById('procesoNombre').value = data.data.nombre || '';
            document.getElementById('procesoGlosa').value = data.data.glosa || '';
            document.getElementById('procesoEstado').checked = data.data.estado === 'Activo';
            estadoOriginalProceso = data.data.estado || 'Activo';
            setCamposProcesoDisabled(true);
            document.getElementById('btnGuardarProceso').classList.add('hidden');
            document.getElementById('btnEditarProceso').classList.remove('hidden');
            actualizarBtnEliminarProceso();
            modoEdicionProceso = false;
            resetBtnEditarProceso();
        } else {
            document.getElementById('procesoForm').reset();
            document.getElementById('procesoCod').value = cod;
            document.getElementById('procesoEstado').checked = true;
            estadoOriginalProceso = 'Activo';
            setCamposProcesoDisabled(false);
            document.getElementById('btnGuardarProceso').classList.remove('hidden');
            document.getElementById('btnEditarProceso').classList.add('hidden');
            document.getElementById('btnEliminarProceso').classList.add('hidden');
            modoEdicionProceso = false;
            resetBtnEditarProceso();
        }
    });
}

function setCamposProcesoDisabled(disabled) {
    ['procesoNombre', 'procesoGlosa'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabled;
    });
}

function nuevoProceso() {
    if (modoNuevoProceso) {
        modoNuevoProceso = false;
        document.getElementById('procesoForm').reset();
        document.getElementById('procesoCod').value = '';
        setCamposProcesoDisabled(true);
        document.getElementById('btnGuardarProceso').classList.add('hidden');
        document.getElementById('btnNuevoProceso').innerHTML = '<i class="bx bx-plus text-xl"></i>';
        document.getElementById('btnNuevoProceso').title = 'Nuevo';
    } else {
        modoNuevoProceso = true;
        document.getElementById('procesoForm').reset();
        document.getElementById('procesoCod').value = '';
        document.getElementById('procesoCod').focus();
        setCamposProcesoDisabled(false);
        document.getElementById('btnGuardarProceso').classList.remove('hidden');
        document.getElementById('btnNuevoProceso').innerHTML = '<i class="bx bx-x text-xl"></i>';
        document.getElementById('btnNuevoProceso').title = 'Cancelar';
    }
    document.getElementById('btnEditarProceso').classList.add('hidden');
    document.getElementById('btnEliminarProceso').classList.add('hidden');
    resetBtnEditarProceso();
    modoEdicionProceso = false;
}

function resetBtnEditarProceso() {
    const btn = document.getElementById('btnEditarProceso');
    if (!btn) return;
    btn.innerHTML = '<i class="bx bx-edit text-xl"></i>';
    btn.title = 'Editar';
    btn.classList.remove('bg-green-500');
    btn.classList.add('bg-amber-500');
}

function guardarProceso() {
    const cod = document.getElementById('procesoCod').value.trim();
    if (!cod) {
        Toastify({text: 'Ingrese un código', style: {background: '#f44336'}}).showToast();
        return;
    }
    const nombre = document.getElementById('procesoNombre').value.trim();
    if (!nombre) {
        Toastify({text: 'Ingrese un nombre', style: {background: '#f44336'}}).showToast();
        return;
    }

    buscarXHRProceso('nuevo_proceso', {
        cod: cod,
        nombre: nombre,
        glosa: document.getElementById('procesoGlosa').value
    }, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            buscarPorCodigoProceso();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function editarProceso() {
    const btn = document.getElementById('btnEditarProceso');
    if (!modoEdicionProceso) {
        modoEdicionProceso = true;
        setCamposProcesoDisabled(false);
        btn.innerHTML = '<i class="bx bx-check text-xl"></i>';
        btn.title = 'Guardar';
        btn.classList.remove('bg-amber-500');
        btn.classList.add('bg-green-500');
        document.getElementById('btnEliminarProceso').classList.add('hidden');
    } else {
        const cod = document.getElementById('procesoCod').value.trim();
        if (!cod) {
            Toastify({text: 'Seleccione un código', style: {background: '#f44336'}}).showToast();
            return;
        }
        buscarXHRProceso('editar_proceso', {
            cod: cod,
            nombre: document.getElementById('procesoNombre').value,
            glosa: document.getElementById('procesoGlosa').value
        }, function(data) {
            if (data.success) {
                Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                modoEdicionProceso = false;
                setCamposProcesoDisabled(true);
                resetBtnEditarProceso();
                document.getElementById('btnEliminarProceso').classList.remove('hidden');
            } else {
                Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
            }
        });
    }
}

function eliminarProceso() {
    const cod = document.getElementById('procesoCod').value.trim();
    if (!cod) {
        Toastify({text: 'Seleccione un proceso', style: {background: '#f44336'}}).showToast();
        return;
    }
    const esActivo = estadoOriginalProceso === 'Activo';
    mostrarModalConfirm({
        datos: [
            { label: 'Código', value: cod },
            { label: 'Nombre', value: document.getElementById('procesoNombre').value || '—' },
        ],
        titulo: esActivo ? 'Desactivar Proceso' : 'Activar Proceso',
        mensaje: esActivo ? '¿Está seguro de desactivar este proceso?' : '¿Está seguro de activar este proceso?',
        icono: esActivo ? 'bx bx-no-entry text-xl sm:text-2xl text-amber-500' : 'bx bx-check-circle text-xl sm:text-2xl text-green-500',
        textoBoton: esActivo ? 'Desactivar' : 'Activar',
        colorBoton: esActivo ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-green-500 text-white hover:bg-green-600',
        onConfirm: function() {
            const action = esActivo ? 'desactivar_proceso' : 'activar_proceso';
            buscarXHRProceso(action, {cod: cod}, function(data) {
                if (data.success) {
                    Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                    if (esActivo) {
                        nuevoProceso();
                    } else {
                        buscarPorCodigoProceso();
                    }
                } else {
                    Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
                }
            });
        }
    });
}

function actualizarBtnEliminarProceso() {
    const btn = document.getElementById('btnEliminarProceso');
    if (!btn) return;
    const esActivo = estadoOriginalProceso === 'Activo';
    btn.title = esActivo ? 'Desactivar' : 'Activar';
    btn.querySelector('i').className = esActivo ? 'bx bx-no-entry text-xl' : 'bx bx-check-circle text-xl';
    btn.classList.remove('bg-red-500', 'hover:bg-red-600', 'bg-amber-500', 'hover:bg-amber-600');
    btn.classList.add(esActivo ? 'bg-amber-500' : 'bg-green-500', esActivo ? 'hover:bg-amber-600' : 'hover:bg-green-600');
}

function abrirListaProcesos() {
    buscarXHRProceso('listar_procesos', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Lista de Procesos',
            columnas: [
                { title: 'Código', field: 'cod', width: 100 },
                { title: 'Nombre', field: 'nombre' },
            ],
            data: data.procesos || [],
            filtroCampos: ['cod', 'nombre'],
            onSelect: function(row) {
                document.getElementById('procesoCod').value = row.cod;
                buscarPorCodigoProceso();
            },
            onRefresh: function(opts) {
                buscarXHRProceso('listar_procesos', {}, function(data) {
                    opts.data = data.procesos || [];
                    abrirModalBusqueda(opts);
                });
            },
        });
    });
}

function seleccionarProceso(cod, nombre, glosa) {
    document.getElementById('procesoCod').value = cod;
    document.getElementById('procesoNombre').value = nombre;
    document.getElementById('procesoGlosa').value = glosa || '';
    setCamposProcesoDisabled(true);
    document.getElementById('btnGuardarProceso').classList.add('hidden');
    document.getElementById('btnEditarProceso').classList.remove('hidden');
    document.getElementById('btnEliminarProceso').classList.remove('hidden');
    modoEdicionProceso = false;
    resetBtnEditarProceso();
    modoNuevoProceso = false;
    document.getElementById('btnNuevoProceso').innerHTML = '<i class="bx bx-plus text-xl"></i>';
    document.getElementById('btnNuevoProceso').title = 'Nuevo';
}

let modoEdicionEmpleado = false;
let modoNuevoEmpleado = false;
let estadoOriginalEmpleado = 'Activo';

function buscarXHREmpleado(action, datos, callback) {
    const formData = new FormData();
    formData.append('action', action);
    for (let key in datos) { formData.append(key, datos[key]); }
    fetch(urlParametros, {
        method: 'POST',
        body: formData,
        headers: {'X-CSRFToken': csrfToken}
    })
    .then(res => res.json())
    .then(callback)
    .catch(err => console.error('Error:', err));
}

function buscarPorCodigoEmpleado() {
    const cod = document.getElementById('empleadoCod').value.trim();
    if (!cod) { return; }
    modoNuevoEmpleado = false;
    document.getElementById('btnNuevoEmpleado').innerHTML = '<i class="bx bx-plus text-xl"></i>';
    document.getElementById('btnNuevoEmpleado').title = 'Nuevo';

    buscarXHREmpleado('buscar_empleado', {cod: cod}, function(data) {
        if (data.success && data.data) {
            document.getElementById('empleadoCod').value = data.data.cod;
            document.getElementById('empleadoNombre').value = data.data.nombre || '';
            document.getElementById('empleadoGlosa').value = data.data.glosa || '';
            document.getElementById('empleadoEstado').checked = data.data.estado === 'Activo';
            estadoOriginalEmpleado = data.data.estado || 'Activo';
            setCamposEmpleadoDisabled(true);
            document.getElementById('btnGuardarEmpleado').classList.add('hidden');
            document.getElementById('btnEditarEmpleado').classList.remove('hidden');
            actualizarBtnEliminarEmpleado();
            modoEdicionEmpleado = false;
            resetBtnEditarEmpleado();
        } else {
            document.getElementById('empleadoForm').reset();
            document.getElementById('empleadoCod').value = cod;
            document.getElementById('empleadoEstado').checked = true;
            estadoOriginalEmpleado = 'Activo';
            setCamposEmpleadoDisabled(false);
            document.getElementById('btnGuardarEmpleado').classList.remove('hidden');
            document.getElementById('btnEditarEmpleado').classList.add('hidden');
            document.getElementById('btnEliminarEmpleado').classList.add('hidden');
            modoEdicionEmpleado = false;
            resetBtnEditarEmpleado();
        }
    });
}

function setCamposEmpleadoDisabled(disabled) {
    ['empleadoNombre', 'empleadoGlosa'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabled;
    });
}

function nuevoEmpleado() {
    if (modoNuevoEmpleado) {
        modoNuevoEmpleado = false;
        document.getElementById('empleadoForm').reset();
        document.getElementById('empleadoCod').value = '';
        setCamposEmpleadoDisabled(true);
        document.getElementById('btnGuardarEmpleado').classList.add('hidden');
        document.getElementById('btnNuevoEmpleado').innerHTML = '<i class="bx bx-plus text-xl"></i>';
        document.getElementById('btnNuevoEmpleado').title = 'Nuevo';
    } else {
        modoNuevoEmpleado = true;
        document.getElementById('empleadoForm').reset();
        document.getElementById('empleadoCod').value = '';
        document.getElementById('empleadoCod').focus();
        setCamposEmpleadoDisabled(false);
        document.getElementById('btnGuardarEmpleado').classList.remove('hidden');
        document.getElementById('btnNuevoEmpleado').innerHTML = '<i class="bx bx-x text-xl"></i>';
        document.getElementById('btnNuevoEmpleado').title = 'Cancelar';
    }
    document.getElementById('btnEditarEmpleado').classList.add('hidden');
    document.getElementById('btnEliminarEmpleado').classList.add('hidden');
    resetBtnEditarEmpleado();
    modoEdicionEmpleado = false;
}

function resetBtnEditarEmpleado() {
    const btn = document.getElementById('btnEditarEmpleado');
    if (!btn) return;
    btn.innerHTML = '<i class="bx bx-edit text-xl"></i>';
    btn.title = 'Editar';
    btn.classList.remove('bg-green-500');
    btn.classList.add('bg-amber-500');
}

function guardarEmpleado() {
    const cod = document.getElementById('empleadoCod').value.trim();
    if (!cod) {
        Toastify({text: 'Ingrese un código', style: {background: '#f44336'}}).showToast();
        return;
    }
    const nombre = document.getElementById('empleadoNombre').value.trim();
    if (!nombre) {
        Toastify({text: 'Ingrese un nombre', style: {background: '#f44336'}}).showToast();
        return;
    }

    buscarXHREmpleado('nuevo_empleado', {
        cod: cod,
        nombre: nombre,
        glosa: document.getElementById('empleadoGlosa').value
    }, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            buscarPorCodigoEmpleado();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function editarEmpleado() {
    const btn = document.getElementById('btnEditarEmpleado');
    if (!modoEdicionEmpleado) {
        modoEdicionEmpleado = true;
        setCamposEmpleadoDisabled(false);
        btn.innerHTML = '<i class="bx bx-check text-xl"></i>';
        btn.title = 'Guardar';
        btn.classList.remove('bg-amber-500');
        btn.classList.add('bg-green-500');
        document.getElementById('btnEliminarEmpleado').classList.add('hidden');
    } else {
        const cod = document.getElementById('empleadoCod').value.trim();
        if (!cod) {
            Toastify({text: 'Seleccione un código', style: {background: '#f44336'}}).showToast();
            return;
        }
        buscarXHREmpleado('editar_empleado', {
            cod: cod,
            nombre: document.getElementById('empleadoNombre').value,
            glosa: document.getElementById('empleadoGlosa').value
        }, function(data) {
            if (data.success) {
                Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                modoEdicionEmpleado = false;
                setCamposEmpleadoDisabled(true);
                resetBtnEditarEmpleado();
                document.getElementById('btnEliminarEmpleado').classList.remove('hidden');
            } else {
                Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
            }
        });
    }
}

function eliminarEmpleado() {
    const cod = document.getElementById('empleadoCod').value.trim();
    if (!cod) {
        Toastify({text: 'Seleccione un empleado', style: {background: '#f44336'}}).showToast();
        return;
    }
    const esActivo = estadoOriginalEmpleado === 'Activo';
    mostrarModalConfirm({
        datos: [
            { label: 'Código', value: cod },
            { label: 'Nombre', value: document.getElementById('empleadoNombre').value || '—' },
        ],
        titulo: esActivo ? 'Desactivar Empleado' : 'Activar Empleado',
        mensaje: esActivo ? '¿Está seguro de desactivar este empleado?' : '¿Está seguro de activar este empleado?',
        icono: esActivo ? 'bx bx-no-entry text-xl sm:text-2xl text-amber-500' : 'bx bx-check-circle text-xl sm:text-2xl text-green-500',
        textoBoton: esActivo ? 'Desactivar' : 'Activar',
        colorBoton: esActivo ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-green-500 text-white hover:bg-green-600',
        onConfirm: function() {
            const action = esActivo ? 'desactivar_empleado' : 'activar_empleado';
            buscarXHREmpleado(action, {cod: cod}, function(data) {
                if (data.success) {
                    Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                    if (esActivo) {
                        nuevoEmpleado();
                    } else {
                        buscarPorCodigoEmpleado();
                    }
                } else {
                    Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
                }
            });
        }
    });
}

function actualizarBtnEliminarEmpleado() {
    const btn = document.getElementById('btnEliminarEmpleado');
    if (!btn) return;
    const esActivo = estadoOriginalEmpleado === 'Activo';
    btn.title = esActivo ? 'Desactivar' : 'Activar';
    btn.querySelector('i').className = esActivo ? 'bx bx-no-entry text-xl' : 'bx bx-check-circle text-xl';
    btn.classList.remove('bg-red-500', 'hover:bg-red-600', 'bg-amber-500', 'hover:bg-amber-600');
    btn.classList.add(esActivo ? 'bg-amber-500' : 'bg-green-500', esActivo ? 'hover:bg-amber-600' : 'hover:bg-green-600');
}

function abrirListaEmpleados() {
    buscarXHREmpleado('listar_empleados', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Lista de Empleados',
            columnas: [
                { title: 'Código', field: 'cod', width: 100 },
                { title: 'Nombre', field: 'nombre' },
            ],
            data: data.empleados || [],
            filtroCampos: ['cod', 'nombre'],
            onSelect: function(row) {
                document.getElementById('empleadoCod').value = row.cod;
                buscarPorCodigoEmpleado();
            },
            onRefresh: function(opts) {
                buscarXHREmpleado('listar_empleados', {}, function(data) {
                    opts.data = data.empleados || [];
                    abrirModalBusqueda(opts);
                });
            },
        });
    });
}

function seleccionarEmpleado(cod, nombre, glosa) {
    document.getElementById('empleadoCod').value = cod;
    document.getElementById('empleadoNombre').value = nombre;
    document.getElementById('empleadoGlosa').value = glosa || '';
    setCamposEmpleadoDisabled(true);
    document.getElementById('btnGuardarEmpleado').classList.add('hidden');
    document.getElementById('btnEditarEmpleado').classList.remove('hidden');
    document.getElementById('btnEliminarEmpleado').classList.remove('hidden');
    modoEdicionEmpleado = false;
    resetBtnEditarEmpleado();
    modoNuevoEmpleado = false;
    document.getElementById('btnNuevoEmpleado').innerHTML = '<i class="bx bx-plus text-xl"></i>';
    document.getElementById('btnNuevoEmpleado').title = 'Nuevo';
}

let modoEdicionCpago = false;
let modoNuevoCpago = false;
let estadoOriginalCpago = 'Activo';

function buscarXRHCpago(action, datos, callback) {
    const formData = new FormData();
    formData.append('action', action);
    for (let key in datos) { formData.append(key, datos[key]); }
    fetch(urlParametros, {
        method: 'POST',
        body: formData,
        headers: {'X-CSRFToken': csrfToken}
    })
    .then(res => res.json())
    .then(callback)
    .catch(err => console.error('Error:', err));
}

function buscarPorCodigoCpago() {
    const cod = document.getElementById('cpagoCod').value.trim();
    if (!cod) { return; }
    modoNuevoCpago = false;
    document.getElementById('btnNuevoCpago').innerHTML = '<i class="bx bx-plus text-xl"></i>';
    document.getElementById('btnNuevoCpago').title = 'Nueva';

    buscarXRHCpago('buscar_cpago', {cod: cod}, function(data) {
        if (data.success && data.data) {
            document.getElementById('cpagoCod').value = data.data.cod;
            document.getElementById('cpagoDescr').value = data.data.descr || '';
            document.getElementById('cpagoDias').value = data.data.dias || '';
            document.getElementById('cpagoGlosa').value = data.data.glosa || '';
            document.getElementById('cpagoEstado').checked = data.data.estado === 'Activo';
            estadoOriginalCpago = data.data.estado || 'Activo';
            setCamposCpagoDisabled(true);
            document.getElementById('btnGuardarCpago').classList.add('hidden');
            document.getElementById('btnEditarCpago').classList.remove('hidden');
            actualizarBtnEliminarCpago();
            modoEdicionCpago = false;
            resetBtnEditarCpago();
        } else {
            document.getElementById('cpagoForm').reset();
            document.getElementById('cpagoCod').value = cod;
            document.getElementById('cpagoEstado').checked = true;
            estadoOriginalCpago = 'Activo';
            setCamposCpagoDisabled(false);
            document.getElementById('btnGuardarCpago').classList.remove('hidden');
            document.getElementById('btnEditarCpago').classList.add('hidden');
            document.getElementById('btnEliminarCpago').classList.add('hidden');
            modoEdicionCpago = false;
            resetBtnEditarCpago();
        }
    });
}

function setCamposCpagoDisabled(disabled) {
    ['cpagoDescr', 'cpagoDias', 'cpagoGlosa'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabled;
    });
}

function nuevoCpago() {
    if (modoNuevoCpago) {
        modoNuevoCpago = false;
        document.getElementById('cpagoForm').reset();
        document.getElementById('cpagoCod').value = '';
        setCamposCpagoDisabled(true);
        document.getElementById('btnGuardarCpago').classList.add('hidden');
        document.getElementById('btnNuevoCpago').innerHTML = '<i class="bx bx-plus text-xl"></i>';
        document.getElementById('btnNuevoCpago').title = 'Nueva';
    } else {
        modoNuevoCpago = true;
        document.getElementById('cpagoForm').reset();
        document.getElementById('cpagoCod').value = '';
        document.getElementById('cpagoCod').focus();
        setCamposCpagoDisabled(false);
        document.getElementById('btnGuardarCpago').classList.remove('hidden');
        document.getElementById('btnNuevoCpago').innerHTML = '<i class="bx bx-x text-xl"></i>';
        document.getElementById('btnNuevoCpago').title = 'Cancelar';
    }
    document.getElementById('btnEditarCpago').classList.add('hidden');
    document.getElementById('btnEliminarCpago').classList.add('hidden');
    resetBtnEditarCpago();
    modoEdicionCpago = false;
}

function resetBtnEditarCpago() {
    const btn = document.getElementById('btnEditarCpago');
    if (!btn) return;
    btn.innerHTML = '<i class="bx bx-edit text-xl"></i>';
    btn.title = 'Editar';
    btn.classList.remove('bg-green-500');
    btn.classList.add('bg-amber-500');
}

function guardarCpago() {
    const cod = document.getElementById('cpagoCod').value.trim();
    if (!cod) {
        Toastify({text: 'Ingrese un código', style: {background: '#f44336'}}).showToast();
        return;
    }
    const descr = document.getElementById('cpagoDescr').value.trim();
    if (!descr) {
        Toastify({text: 'Ingrese una descripción', style: {background: '#f44336'}}).showToast();
        return;
    }

    buscarXRHCpago('nuevo_cpago', {
        cod: cod,
        descr: descr,
        dias: document.getElementById('cpagoDias').value,
        glosa: document.getElementById('cpagoGlosa').value
    }, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            buscarPorCodigoCpago();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function editarCpago() {
    const btn = document.getElementById('btnEditarCpago');
    if (!modoEdicionCpago) {
        modoEdicionCpago = true;
        setCamposCpagoDisabled(false);
        btn.innerHTML = '<i class="bx bx-check text-xl"></i>';
        btn.title = 'Guardar';
        btn.classList.remove('bg-amber-500');
        btn.classList.add('bg-green-500');
        document.getElementById('btnEliminarCpago').classList.add('hidden');
    } else {
        const cod = document.getElementById('cpagoCod').value.trim();
        if (!cod) {
            Toastify({text: 'Seleccione un código', style: {background: '#f44336'}}).showToast();
            return;
        }
        buscarXRHCpago('editar_cpago', {
            cod: cod,
            descr: document.getElementById('cpagoDescr').value,
            dias: document.getElementById('cpagoDias').value,
            glosa: document.getElementById('cpagoGlosa').value
        }, function(data) {
            if (data.success) {
                Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                modoEdicionCpago = false;
                setCamposCpagoDisabled(true);
                resetBtnEditarCpago();
                document.getElementById('btnEliminarCpago').classList.remove('hidden');
            } else {
                Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
            }
        });
    }
}

function eliminarCpago() {
    const cod = document.getElementById('cpagoCod').value.trim();
    if (!cod) {
        Toastify({text: 'Seleccione una condición de pago', style: {background: '#f44336'}}).showToast();
        return;
    }
    const esActivo = estadoOriginalCpago === 'Activo';
    mostrarModalConfirm({
        datos: [
            { label: 'Código', value: cod },
            { label: 'Descripción', value: document.getElementById('cpagoDescr').value || '—' },
        ],
        titulo: esActivo ? 'Desactivar Condición de Pago' : 'Activar Condición de Pago',
        mensaje: esActivo ? '¿Está seguro de desactivar esta condición de pago?' : '¿Está seguro de activar esta condición de pago?',
        icono: esActivo ? 'bx bx-no-entry text-xl sm:text-2xl text-amber-500' : 'bx bx-check-circle text-xl sm:text-2xl text-green-500',
        textoBoton: esActivo ? 'Desactivar' : 'Activar',
        colorBoton: esActivo ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-green-500 text-white hover:bg-green-600',
        onConfirm: function() {
            const action = esActivo ? 'desactivar_cpago' : 'activar_cpago';
            buscarXRHCpago(action, {cod: cod}, function(data) {
                if (data.success) {
                    Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                    if (esActivo) {
                        nuevoCpago();
                    } else {
                        buscarPorCodigoCpago();
                    }
                } else {
                    Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
                }
            });
        }
    });
}

function actualizarBtnEliminarCpago() {
    const btn = document.getElementById('btnEliminarCpago');
    if (!btn) return;
    const esActivo = estadoOriginalCpago === 'Activo';
    btn.title = esActivo ? 'Desactivar' : 'Activar';
    btn.querySelector('i').className = esActivo ? 'bx bx-no-entry text-xl' : 'bx bx-check-circle text-xl';
    btn.classList.remove('bg-red-500', 'hover:bg-red-600', 'bg-amber-500', 'hover:bg-amber-600');
    btn.classList.add(esActivo ? 'bg-amber-500' : 'bg-green-500', esActivo ? 'hover:bg-amber-600' : 'hover:bg-green-600');
}

function abrirListaCpagos() {
    buscarXRHCpago('listar_cpagos', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Lista de Condiciones de Pago',
            columnas: [
                { title: 'Código', field: 'cod', width: 100 },
                { title: 'Descripción', field: 'descr' },
            ],
            data: data.cpagos || [],
            filtroCampos: ['cod', 'descr'],
            onSelect: function(row) {
                document.getElementById('cpagoCod').value = row.cod;
                buscarPorCodigoCpago();
            },
            onRefresh: function(opts) {
                buscarXRHCpago('listar_cpagos', {}, function(data) {
                    opts.data = data.cpagos || [];
                    abrirModalBusqueda(opts);
                });
            },
        });
    });
}

function seleccionarCpago(cod, descr, glosa, dias) {
    document.getElementById('cpagoCod').value = cod;
    document.getElementById('cpagoDescr').value = descr || '';
    document.getElementById('cpagoDias').value = dias || '';
    document.getElementById('cpagoGlosa').value = glosa || '';
    setCamposCpagoDisabled(true);
    document.getElementById('btnGuardarCpago').classList.add('hidden');
    document.getElementById('btnEditarCpago').classList.remove('hidden');
    document.getElementById('btnEliminarCpago').classList.remove('hidden');
    modoEdicionCpago = false;
    resetBtnEditarCpago();
    modoNuevoCpago = false;
    document.getElementById('btnNuevoCpago').innerHTML = '<i class="bx bx-plus text-xl"></i>';
    document.getElementById('btnNuevoCpago').title = 'Nueva';
}

let modoEdicionTransportista = false;
let modoNuevoTransportista = false;
let estadoOriginalTransportista = 'Activo';
let transportistaActualPatentes = null;

function buscarXHRTransportista(action, datos, callback) {
    const formData = new FormData();
    formData.append('action', action);
    for (let key in datos) { formData.append(key, datos[key]); }
    fetch(urlParametros, {
        method: 'POST',
        body: formData,
        headers: {'X-CSRFToken': csrfToken}
    })
    .then(res => res.json())
    .then(callback)
    .catch(err => console.error('Error:', err));
}

function buscarPorRutTransportista() {
    const rut = document.getElementById('transportistaRut').value.trim();
    if (!rut) { return; }
    modoNuevoTransportista = false;
    document.getElementById('btnNuevoTransportista').innerHTML = '<i class="bx bx-plus text-xl"></i>';
    document.getElementById('btnNuevoTransportista').title = 'Nuevo';

    buscarXHRTransportista('buscar_transportista', {rut: rut}, function(data) {
        if (data.success && data.data) {
            document.getElementById('transportistaRut').value = data.data.rut;
            document.getElementById('transportistaNombre').value = data.data.nombre || '';
            document.getElementById('transportistaEstado').checked = data.data.estado === 'Activo';
            estadoOriginalTransportista = data.data.estado || 'Activo';
            setCamposTransportistaDisabled(true);
            document.getElementById('btnGuardarTransportista').classList.add('hidden');
            document.getElementById('btnEditarTransportista').classList.remove('hidden');
            actualizarBtnEliminarTransportista();
            modoEdicionTransportista = false;
            resetBtnEditarTransportista();
            transportistaActualPatentes = data.data.rut;
            cargarPatentesParaTransportistaActual();
        } else {
            document.getElementById('transportistaForm').reset();
            document.getElementById('transportistaRut').value = rut;
            document.getElementById('transportistaEstado').checked = true;
            estadoOriginalTransportista = 'Activo';
            setCamposTransportistaDisabled(false);
            document.getElementById('btnGuardarTransportista').classList.remove('hidden');
            document.getElementById('btnEditarTransportista').classList.add('hidden');
            document.getElementById('btnEliminarTransportista').classList.add('hidden');
            modoEdicionTransportista = false;
            resetBtnEditarTransportista();
            transportistaActualPatentes = null;
            renderizarPatentes([]);
        }
    });
}

function setCamposTransportistaDisabled(disabled) {
    ['transportistaNombre'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabled;
    });
}

function nuevoTransportista() {
    if (modoNuevoTransportista) {
        modoNuevoTransportista = false;
        document.getElementById('transportistaForm').reset();
        document.getElementById('transportistaRut').value = '';
        setCamposTransportistaDisabled(true);
        document.getElementById('btnGuardarTransportista').classList.add('hidden');
        document.getElementById('btnNuevoTransportista').innerHTML = '<i class="bx bx-plus text-xl"></i>';
        document.getElementById('btnNuevoTransportista').title = 'Nuevo';
    } else {
        modoNuevoTransportista = true;
        document.getElementById('transportistaForm').reset();
        document.getElementById('transportistaRut').value = '';
        document.getElementById('transportistaRut').focus();
        setCamposTransportistaDisabled(false);
        document.getElementById('btnGuardarTransportista').classList.remove('hidden');
        document.getElementById('btnNuevoTransportista').innerHTML = '<i class="bx bx-x text-xl"></i>';
        document.getElementById('btnNuevoTransportista').title = 'Cancelar';
    }
    document.getElementById('btnEditarTransportista').classList.add('hidden');
    document.getElementById('btnEliminarTransportista').classList.add('hidden');
    resetBtnEditarTransportista();
    modoEdicionTransportista = false;
    transportistaActualPatentes = null;
    renderizarPatentes([]);
}

function resetBtnEditarTransportista() {
    const btn = document.getElementById('btnEditarTransportista');
    if (!btn) return;
    btn.innerHTML = '<i class="bx bx-edit text-xl"></i>';
    btn.title = 'Editar';
    btn.classList.remove('bg-green-500');
    btn.classList.add('bg-amber-500');
}

function guardarTransportista() {
    const rut = document.getElementById('transportistaRut').value.trim();
    if (!rut) {
        Toastify({text: 'Ingrese un RUT', style: {background: '#f44336'}}).showToast();
        return;
    }
    const nombre = document.getElementById('transportistaNombre').value.trim();
    if (!nombre) {
        Toastify({text: 'Ingrese un nombre', style: {background: '#f44336'}}).showToast();
        return;
    }

    buscarXHRTransportista('nuevo_transportista', {
        rut: rut,
        nombre: nombre
    }, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            buscarPorRutTransportista();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function editarTransportista() {
    const btn = document.getElementById('btnEditarTransportista');
    if (!modoEdicionTransportista) {
        modoEdicionTransportista = true;
        setCamposTransportistaDisabled(false);
        btn.innerHTML = '<i class="bx bx-check text-xl"></i>';
        btn.title = 'Guardar';
        btn.classList.remove('bg-amber-500');
        btn.classList.add('bg-green-500');
        document.getElementById('btnEliminarTransportista').classList.add('hidden');
    } else {
        const rut = document.getElementById('transportistaRut').value.trim();
        if (!rut) {
            Toastify({text: 'Seleccione un transportista', style: {background: '#f44336'}}).showToast();
            return;
        }
        buscarXHRTransportista('editar_transportista', {
            rut: rut,
            nombre: document.getElementById('transportistaNombre').value
        }, function(data) {
            if (data.success) {
                Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                modoEdicionTransportista = false;
                setCamposTransportistaDisabled(true);
                resetBtnEditarTransportista();
                document.getElementById('btnEliminarTransportista').classList.remove('hidden');
            } else {
                Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
            }
        });
    }
}

function eliminarTransportista() {
    const rut = document.getElementById('transportistaRut').value.trim();
    if (!rut) {
        Toastify({text: 'Seleccione un transportista', style: {background: '#f44336'}}).showToast();
        return;
    }
    const esActivo = estadoOriginalTransportista === 'Activo';
    mostrarModalConfirm({
        datos: [
            { label: 'RUT', value: rut },
            { label: 'Nombre', value: document.getElementById('transportistaNombre').value || '—' },
        ],
        titulo: esActivo ? 'Desactivar Transportista' : 'Activar Transportista',
        mensaje: esActivo ? '¿Está seguro de desactivar este transportista?' : '¿Está seguro de activar este transportista?',
        icono: esActivo ? 'bx bx-no-entry text-xl sm:text-2xl text-amber-500' : 'bx bx-check-circle text-xl sm:text-2xl text-green-500',
        textoBoton: esActivo ? 'Desactivar' : 'Activar',
        colorBoton: esActivo ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-green-500 text-white hover:bg-green-600',
        onConfirm: function() {
            const action = esActivo ? 'desactivar_transportista' : 'activar_transportista';
            buscarXHRTransportista(action, {rut: rut}, function(data) {
                if (data.success) {
                    Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                    if (esActivo) {
                        nuevoTransportista();
                    } else {
                        buscarPorRutTransportista();
                    }
                } else {
                    Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
                }
            });
        }
    });
}

function actualizarBtnEliminarTransportista() {
    const btn = document.getElementById('btnEliminarTransportista');
    if (!btn) return;
    const esActivo = estadoOriginalTransportista === 'Activo';
    btn.title = esActivo ? 'Desactivar' : 'Activar';
    btn.querySelector('i').className = esActivo ? 'bx bx-no-entry text-xl' : 'bx bx-check-circle text-xl';
    btn.classList.remove('bg-red-500', 'hover:bg-red-600', 'bg-amber-500', 'hover:bg-amber-600');
    btn.classList.add(esActivo ? 'bg-amber-500' : 'bg-green-500', esActivo ? 'hover:bg-amber-600' : 'hover:bg-green-600');
}

function abrirListaTransportistas() {
    buscarXHRTransportista('listar_transportistas', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Lista de Transportistas',
            columnas: [
                { title: 'RUT', field: 'rut', width: 120 },
                { title: 'Nombre', field: 'nombre' },
            ],
            data: data.transportistas || [],
            filtroCampos: ['rut', 'nombre'],
            onSelect: function(row) {
                document.getElementById('transportistaRut').value = row.rut;
                buscarPorRutTransportista();
            },
            onRefresh: function(opts) {
                buscarXHRTransportista('listar_transportistas', {}, function(data) {
                    opts.data = data.transportistas || [];
                    abrirModalBusqueda(opts);
                });
            },
        });
    });
}

function seleccionarTransportista(rut, nombre) {
    document.getElementById('transportistaRut').value = rut;
    document.getElementById('transportistaNombre').value = nombre;
    setCamposTransportistaDisabled(true);
    document.getElementById('btnGuardarTransportista').classList.add('hidden');
    document.getElementById('btnEditarTransportista').classList.remove('hidden');
    document.getElementById('btnEliminarTransportista').classList.remove('hidden');
    modoEdicionTransportista = false;
    resetBtnEditarTransportista();
    modoNuevoTransportista = false;
    document.getElementById('btnNuevoTransportista').innerHTML = '<i class="bx bx-plus text-xl"></i>';
    document.getElementById('btnNuevoTransportista').title = 'Nuevo';
    transportistaActualPatentes = rut;
    cargarPatentesParaTransportistaActual();
}

// ==================== PATENTES ====================
let patentesCache = [];
let reasignarPatenteId = null;

function renderizarPatentes(patentes) {
    patentesCache = patentes || [];
    const tbody = document.getElementById('tablaPatentes');
    tbody.innerHTML = '';
    if (!patentes || patentes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="px-3 py-4 text-center text-aq-muted">Sin patentes registradas</td></tr>';
        return;
    }
    patentes.forEach(p => {
        const tr = document.createElement('tr');
        const sinAsignar = !p.transportista_rut;
        const transpTxt = sinAsignar
            ? '<span class="inline-block px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-500 border border-amber-500/40">Sin asignar</span>'
            : `${p.transportista_nombre || ''} <span class="text-aq-muted text-xs">(${p.transportista_rut})</span>`;
        const desasignarBtn = sinAsignar ? '' : `
                <button onclick="desasignarPatente(${p.id}, '${(p.patente || '').replace(/'/g, "\\'")}')" class="text-amber-500 hover:text-amber-700 p-1" title="Quitar transportista (dejar sin asignar)">
                    <i class='bx bx-user-x'></i>
                </button>`;
        const reasignarTitulo = sinAsignar ? 'Asignar a transportista' : 'Cambiar transportista';
        const accion = `
            <div class="flex justify-end gap-1">
                <button onclick="abrirModalReasignarPatente(${p.id}, '${(p.patente || '').replace(/'/g, "\\'")}', '${(p.transportista_rut || '').replace(/'/g, "\\'")}')" class="text-blue-500 hover:text-blue-700 p-1" title="${reasignarTitulo}">
                    <i class='bx bx-transfer'></i>
                </button>
                ${desasignarBtn}
                <button onclick="eliminarPatente(${p.id}, this)" class="text-red-500 hover:text-red-700 p-1" title="Eliminar patente">
                    <i class='bx bx-trash'></i>
                </button>
            </div>`;
        tr.innerHTML = `
            <td class="px-3 py-2 text-aq-text font-medium">${p.patente}</td>
            <td class="px-3 py-2 text-aq-text">${transpTxt}</td>
            <td class="px-3 py-2 text-right">${accion}</td>`;
        tbody.appendChild(tr);
    });
}

function desasignarPatente(id, patente) {
    mostrarModalConfirm({
        mensaje: `¿Quitar el transportista de la patente "${patente}"? Quedará sin asignar.`,
        textoBoton: 'Desasignar',
        colorBoton: 'bg-amber-500 text-white hover:bg-amber-600',
        onConfirm: function() {
            buscarXHRTransportista('reasignar_patente', {id: id, rut: ''}, function(data) {
                if (data.success) {
                    Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                    cargarPatentesParaTransportistaActual();
                } else {
                    Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
                }
            });
        }
    });
}

function cargarPatentesParaTransportistaActual() {
    const rut = document.getElementById('transportistaRut').value.trim();
    const mostrarSinAsignar = document.getElementById('patentesMostrarSinAsignar')?.checked ?? true;
    const tbody = document.getElementById('tablaPatentes');
    if (!rut) {
        tbody.innerHTML = '<tr><td colspan="3" class="px-3 py-4 text-center text-aq-muted">Seleccione un transportista para ver sus patentes</td></tr>';
        return;
    }
    buscarXHRTransportista('buscar_transportista', {rut: rut}, function(data) {
        let patentes = (data.data && data.data.patentes) || [];
        if (mostrarSinAsignar) {
            buscarXHRTransportista('listar_patentes_sin_asignar', {}, function(d2) {
                const sinAsignar = (d2.patentes || []).map(x => ({...x, sin_transportista: true}));
                renderizarPatentes([...patentes, ...sinAsignar]);
            });
        } else {
            renderizarPatentes(patentes);
        }
    });
}

function abrirModalReasignarPatente(id, patente, transportistaActual) {
    reasignarPatenteId = id;
    document.getElementById('reasignarPatenteTxt').value = patente || '';
    const titulo = transportistaActual ? 'Cambiar Transportista' : 'Asignar Transportista';
    document.getElementById('modalReasignarPatenteTitulo').textContent = titulo;
    buscarXHRTransportista('listar_transportistas', {}, function(data) {
        const sel = document.getElementById('reasignarTransportistaSel');
        sel.innerHTML = '<option value="">--- Sin asignar (quitar transportista) ---</option>';
        (data.transportistas || []).forEach(t => {
            const option = document.createElement('option');
            option.value = t.rut;
            option.textContent = `${t.nombre} (${t.rut})`;
            sel.appendChild(option);
        });
        sel.value = transportistaActual || '';
        const btn = document.getElementById('btnConfirmarReasignar');
        if (transportistaActual) {
            btn.textContent = 'Guardar cambios';
        } else {
            btn.textContent = 'Asignar';
        }
        document.getElementById('modalReasignarPatente').classList.remove('hidden');
    });
}

function cerrarModalReasignarPatente() {
    document.getElementById('modalReasignarPatente').classList.add('hidden');
    reasignarPatenteId = null;
}

function confirmarReasignarPatente() {
    if (reasignarPatenteId === null) return;
    const rut = document.getElementById('reasignarTransportistaSel').value;
    buscarXHRTransportista('reasignar_patente', {id: reasignarPatenteId, rut: rut}, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            cerrarModalReasignarPatente();
            cargarPatentesParaTransportistaActual();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function abrirModalPatente() {
    const rut = document.getElementById('transportistaRut').value.trim();
    if (!rut) {
        Toastify({text: 'Primero seleccione un transportista', style: {background: '#f44336'}}).showToast();
        return;
    }
    document.getElementById('patenteInput').value = '';
    document.getElementById('modalPatente').classList.remove('hidden');
    document.getElementById('patenteInput').focus();
}

function cerrarModalPatente() {
    document.getElementById('modalPatente').classList.add('hidden');
}

function confirmarAgregarPatente() {
    const rut = document.getElementById('transportistaRut').value.trim();
    const patente = document.getElementById('patenteInput').value.trim();
    if (!patente) {
        Toastify({text: 'Ingrese una patente', style: {background: '#f44336'}}).showToast();
        return;
    }
    buscarXHRTransportista('nueva_patente', {
        rut: rut,
        patente: patente.toUpperCase()
    }, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            cerrarModalPatente();
            cargarPatentesParaTransportistaActual();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

let patenteIdEliminar = null;

function eliminarPatente(id, btn) {
    const patenteText = btn.closest('tr')?.querySelector('td')?.textContent || '';
    mostrarModalConfirm({
        mensaje: '¿Está seguro de eliminar la patente "' + patenteText + '"?',
        onConfirm: function() {
            buscarXHRTransportista('eliminar_patente', {id: id}, function(data) {
                if (data.success) {
                    Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                    cargarPatentesParaTransportistaActual();
                } else {
                    Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
                }
            });
        }
    });
}

function cambiarTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.querySelectorAll('.tab-content').forEach(contenido => contenido.classList.add('hidden'));
    document.getElementById('contenido-' + tab).classList.remove('hidden');
}

// ==================== CLASIFICACIONES ====================
let modoEdicionClasificacion = false;
let modoNuevoClasificacion = false;
let estadoOriginalClasificacion = 'Activo';

function buscarXHRClasificacion(action, datos, callback) {
    const formData = new FormData();
    formData.append('action', action);
    for (let key in datos) { formData.append(key, datos[key]); }
    fetch(urlParametros, {
        method: 'POST',
        body: formData,
        headers: {'X-CSRFToken': csrfToken}
    })
    .then(res => res.json())
    .then(callback)
    .catch(err => console.error('Error:', err));
}

function cargarTratamientosOptions() {
    buscarXHRClasificacion('listar_tratamientos_options', {}, function(data) {
        const select = document.getElementById('clasificacionTratamiento');
        if (!select) return;
        select.innerHTML = '<option value="">--- Seleccionar Tratamiento ---</option>';
        (data.tratamientos || []).forEach(t => {
            const option = document.createElement('option');
            option.value = t.codigo_ler;
            option.textContent = t.codigo_ler + ' - ' + t.descripcion;
            select.appendChild(option);
        });
        refrescarSelect2Parametros('clasificacionTratamiento');
    });
}

function refrescarSelect2Parametros(id) {
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

function seleccionarTratamientoEnSelect(id, value) {
    if (typeof jQuery !== 'undefined' && jQuery.fn.select2 && jQuery('#' + id).data('select2')) {
        jQuery('#' + id).val(value).trigger('change');
    } else {
        document.getElementById(id).value = value;
    }
}

function buscarPorCodigoClasificacion() {
    const cod = document.getElementById('clasificacionCod').value.trim();
    if (!cod) { return; }
    modoNuevoClasificacion = false;
    document.getElementById('btnNuevoClasificacion').innerHTML = '<i class="bx bx-plus text-xl"></i>';
    document.getElementById('btnNuevoClasificacion').title = 'Nueva';

    buscarXHRClasificacion('buscar_clasificacion', {codigo: cod}, function(data) {
        if (data.success && data.data) {
            document.getElementById('clasificacionCod').value = data.data.codigo;
            document.getElementById('clasificacionDescripcion').value = data.data.descripcion || '';
            seleccionarTratamientoEnSelect('clasificacionTratamiento', data.data.tratamiento || '');
            document.getElementById('clasificacionEstado').checked = data.data.estado === 'Activo';
            estadoOriginalClasificacion = data.data.estado || 'Activo';
            setCamposClasificacionDisabled(true);
            document.getElementById('btnGuardarClasificacion').classList.add('hidden');
            document.getElementById('btnEditarClasificacion').classList.remove('hidden');
            actualizarBtnEliminarClasificacion();
            modoEdicionClasificacion = false;
            resetBtnEditarClasificacion();
        } else {
            document.getElementById('clasificacionForm').reset();
            document.getElementById('clasificacionCod').value = cod;
            document.getElementById('clasificacionEstado').checked = true;
            estadoOriginalClasificacion = 'Activo';
            setCamposClasificacionDisabled(false);
            document.getElementById('btnGuardarClasificacion').classList.remove('hidden');
            document.getElementById('btnEditarClasificacion').classList.add('hidden');
            document.getElementById('btnEliminarClasificacion').classList.add('hidden');
            modoEdicionClasificacion = false;
            resetBtnEditarClasificacion();
        }
    });
}

function setCamposClasificacionDisabled(disabled) {
    ['clasificacionDescripcion'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabled;
    });
    const sel = document.getElementById('clasificacionTratamiento');
    if (sel) {
        if (typeof jQuery !== 'undefined' && jQuery.fn.select2 && jQuery(sel).data('select2')) {
            jQuery(sel).select2('enable', !disabled);
        } else {
            sel.disabled = disabled;
        }
    }
}

function nuevaClasificacion() {
    if (modoNuevoClasificacion) {
        modoNuevoClasificacion = false;
        document.getElementById('clasificacionForm').reset();
        document.getElementById('clasificacionCod').value = '';
        setCamposClasificacionDisabled(true);
        document.getElementById('btnGuardarClasificacion').classList.add('hidden');
        document.getElementById('btnNuevoClasificacion').innerHTML = '<i class="bx bx-plus text-xl"></i>';
        document.getElementById('btnNuevoClasificacion').title = 'Nueva';
    } else {
        modoNuevoClasificacion = true;
        document.getElementById('clasificacionForm').reset();
        document.getElementById('clasificacionCod').value = '';
        document.getElementById('clasificacionCod').focus();
        setCamposClasificacionDisabled(false);
        document.getElementById('btnGuardarClasificacion').classList.remove('hidden');
        document.getElementById('btnNuevoClasificacion').innerHTML = '<i class="bx bx-x text-xl"></i>';
        document.getElementById('btnNuevoClasificacion').title = 'Cancelar';
    }
    document.getElementById('btnEditarClasificacion').classList.add('hidden');
    document.getElementById('btnEliminarClasificacion').classList.add('hidden');
    resetBtnEditarClasificacion();
    modoEdicionClasificacion = false;
}

function resetBtnEditarClasificacion() {
    const btn = document.getElementById('btnEditarClasificacion');
    if (!btn) return;
    btn.innerHTML = '<i class="bx bx-edit text-xl"></i>';
    btn.title = 'Editar';
    btn.classList.remove('bg-green-500');
    btn.classList.add('bg-amber-500');
}

function guardarClasificacion() {
    const cod = document.getElementById('clasificacionCod').value.trim();
    if (!cod) {
        Toastify({text: 'Ingrese un código', style: {background: '#f44336'}}).showToast();
        return;
    }
    const descripcion = document.getElementById('clasificacionDescripcion').value.trim();
    if (!descripcion) {
        Toastify({text: 'Ingrese una descripción', style: {background: '#f44336'}}).showToast();
        return;
    }
    const tratamiento = document.getElementById('clasificacionTratamiento').value;
    if (!tratamiento) {
        Toastify({text: 'Debe asignar un tratamiento', style: {background: '#f44336'}}).showToast();
        return;
    }

    buscarXHRClasificacion('nueva_clasificacion', {
        codigo: cod,
        descripcion: descripcion,
        tratamiento: tratamiento
    }, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            buscarPorCodigoClasificacion();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function editarClasificacion() {
    const btn = document.getElementById('btnEditarClasificacion');
    if (!modoEdicionClasificacion) {
        modoEdicionClasificacion = true;
        setCamposClasificacionDisabled(false);
        btn.innerHTML = '<i class="bx bx-check text-xl"></i>';
        btn.title = 'Guardar';
        btn.classList.remove('bg-amber-500');
        btn.classList.add('bg-green-500');
        document.getElementById('btnEliminarClasificacion').classList.add('hidden');
    } else {
        const cod = document.getElementById('clasificacionCod').value.trim();
        if (!cod) {
            Toastify({text: 'Seleccione un código', style: {background: '#f44336'}}).showToast();
            return;
        }
        const tratamiento = document.getElementById('clasificacionTratamiento').value;
        if (!tratamiento) {
            Toastify({text: 'Debe asignar un tratamiento', style: {background: '#f44336'}}).showToast();
            return;
        }
        buscarXHRClasificacion('editar_clasificacion', {
            codigo: cod,
            descripcion: document.getElementById('clasificacionDescripcion').value,
            tratamiento: tratamiento
        }, function(data) {
            if (data.success) {
                Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                modoEdicionClasificacion = false;
                setCamposClasificacionDisabled(true);
                resetBtnEditarClasificacion();
                document.getElementById('btnEliminarClasificacion').classList.remove('hidden');
            } else {
                Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
            }
        });
    }
}

function eliminarClasificacion() {
    const cod = document.getElementById('clasificacionCod').value.trim();
    if (!cod) {
        Toastify({text: 'Seleccione una clasificación', style: {background: '#f44336'}}).showToast();
        return;
    }
    const esActivo = estadoOriginalClasificacion === 'Activo';
    mostrarModalConfirm({
        datos: [
            { label: 'Código', value: cod },
            { label: 'Descripción', value: document.getElementById('clasificacionDescripcion').value || '—' },
        ],
        titulo: esActivo ? 'Desactivar Clasificación' : 'Activar Clasificación',
        mensaje: esActivo ? '¿Está seguro de desactivar esta clasificación?' : '¿Está seguro de activar esta clasificación?',
        icono: esActivo ? 'bx bx-no-entry text-xl sm:text-2xl text-amber-500' : 'bx bx-check-circle text-xl sm:text-2xl text-green-500',
        textoBoton: esActivo ? 'Desactivar' : 'Activar',
        colorBoton: esActivo ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-green-500 text-white hover:bg-green-600',
        onConfirm: function() {
            const action = esActivo ? 'desactivar_clasificacion' : 'activar_clasificacion';
            buscarXHRClasificacion(action, {codigo: cod}, function(data) {
                if (data.success) {
                    Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                    if (esActivo) {
                        nuevaClasificacion();
                    } else {
                        buscarPorCodigoClasificacion();
                    }
                } else {
                    Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
                }
            });
        }
    });
}

function actualizarBtnEliminarClasificacion() {
    const btn = document.getElementById('btnEliminarClasificacion');
    if (!btn) return;
    const esActivo = estadoOriginalClasificacion === 'Activo';
    btn.title = esActivo ? 'Desactivar' : 'Activar';
    btn.querySelector('i').className = esActivo ? 'bx bx-no-entry text-xl' : 'bx bx-check-circle text-xl';
    btn.classList.remove('bg-red-500', 'hover:bg-red-600', 'bg-amber-500', 'hover:bg-amber-600');
    btn.classList.add(esActivo ? 'bg-amber-500' : 'bg-green-500', esActivo ? 'hover:bg-amber-600' : 'hover:bg-green-600');
}

function abrirListaClasificaciones() {
    buscarXHRClasificacion('listar_clasificaciones', {}, function(data) {
        const rows = (data.clasificaciones || []).map(function(c) {
            return { codigo: c.codigo, descripcion: c.descripcion, tratamiento: c.tratamiento || '' };
        });
        abrirModalBusqueda({
            titulo: 'Lista de Clasificaciones',
            columnas: [
                { title: 'Código', field: 'codigo', width: 100 },
                { title: 'Descripción', field: 'descripcion' },
                { title: 'Tratamiento', field: 'tratamiento', width: 120 },
            ],
            data: rows,
            filtroCampos: ['codigo', 'descripcion', 'tratamiento'],
            onSelect: function(row) {
                document.getElementById('clasificacionCod').value = row.codigo;
                buscarPorCodigoClasificacion();
            },
            onRefresh: function(opts) {
                buscarXHRClasificacion('listar_clasificaciones', {}, function(d) {
                    opts.data = (d.clasificaciones || []).map(function(c) {
                        return { codigo: c.codigo, descripcion: c.descripcion, tratamiento: c.tratamiento || '' };
                    });
                    abrirModalBusqueda(opts);
                });
            },
        });
    });
}

function seleccionarClasificacion(codigo, descripcion, tratamiento) {
    document.getElementById('clasificacionCod').value = codigo;
    document.getElementById('clasificacionDescripcion').value = descripcion || '';
    seleccionarTratamientoEnSelect('clasificacionTratamiento', tratamiento || '');
    setCamposClasificacionDisabled(true);
    document.getElementById('btnGuardarClasificacion').classList.add('hidden');
    document.getElementById('btnEditarClasificacion').classList.remove('hidden');
    document.getElementById('btnEliminarClasificacion').classList.remove('hidden');
    modoEdicionClasificacion = false;
    resetBtnEditarClasificacion();
    modoNuevoClasificacion = false;
    document.getElementById('btnNuevoClasificacion').innerHTML = '<i class="bx bx-plus text-xl"></i>';
    document.getElementById('btnNuevoClasificacion').title = 'Nueva';
}

// ==================== TRATAMIENTOS ====================
let modoEdicionTratamiento = false;
let modoNuevoTratamiento = false;
let estadoOriginalTratamiento = 'Activo';

function buscarXHRTratamiento(action, datos, callback) {
    const formData = new FormData();
    formData.append('action', action);
    for (let key in datos) { formData.append(key, datos[key]); }
    fetch(urlParametros, {
        method: 'POST',
        body: formData,
        headers: {'X-CSRFToken': csrfToken}
    })
    .then(res => res.json())
    .then(callback)
    .catch(err => console.error('Error:', err));
}

function buscarPorCodigoTratamiento() {
    const cod = document.getElementById('tratamientoCod').value.trim();
    if (!cod) { return; }
    modoNuevoTratamiento = false;
    document.getElementById('btnNuevoTratamiento').innerHTML = '<i class="bx bx-plus text-xl"></i>';
    document.getElementById('btnNuevoTratamiento').title = 'Nuevo';

    buscarXHRTratamiento('buscar_tratamiento', {codigo: cod}, function(data) {
        if (data.success && data.data) {
            document.getElementById('tratamientoCod').value = data.data.codigo;
            document.getElementById('tratamientoDescripcion').value = data.data.descripcion || '';
            document.getElementById('tratamientoCodigoAra').value = data.data.codigo_ara || '';
            document.getElementById('tratamientoEstado').checked = data.data.estado === 'Activo';
            estadoOriginalTratamiento = data.data.estado || 'Activo';
            setCamposTratamientoDisabled(true);
            document.getElementById('btnGuardarTratamiento').classList.add('hidden');
            document.getElementById('btnEditarTratamiento').classList.remove('hidden');
            actualizarBtnEliminarTratamiento();
            modoEdicionTratamiento = false;
            resetBtnEditarTratamiento();
        } else {
            document.getElementById('tratamientoForm').reset();
            document.getElementById('tratamientoCod').value = cod;
            document.getElementById('tratamientoEstado').checked = true;
            estadoOriginalTratamiento = 'Activo';
            setCamposTratamientoDisabled(false);
            document.getElementById('btnGuardarTratamiento').classList.remove('hidden');
            document.getElementById('btnEditarTratamiento').classList.add('hidden');
            document.getElementById('btnEliminarTratamiento').classList.add('hidden');
            modoEdicionTratamiento = false;
            resetBtnEditarTratamiento();
        }
    });
}

function setCamposTratamientoDisabled(disabled) {
    ['tratamientoDescripcion', 'tratamientoCodigoAra'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabled;
    });
}

function nuevoTratamiento() {
    if (modoNuevoTratamiento) {
        modoNuevoTratamiento = false;
        document.getElementById('tratamientoForm').reset();
        document.getElementById('tratamientoCod').value = '';
        setCamposTratamientoDisabled(true);
        document.getElementById('btnGuardarTratamiento').classList.add('hidden');
        document.getElementById('btnNuevoTratamiento').innerHTML = '<i class="bx bx-plus text-xl"></i>';
        document.getElementById('btnNuevoTratamiento').title = 'Nuevo';
    } else {
        modoNuevoTratamiento = true;
        document.getElementById('tratamientoForm').reset();
        document.getElementById('tratamientoCod').value = '';
        document.getElementById('tratamientoCod').focus();
        setCamposTratamientoDisabled(false);
        document.getElementById('btnGuardarTratamiento').classList.remove('hidden');
        document.getElementById('btnNuevoTratamiento').innerHTML = '<i class="bx bx-x text-xl"></i>';
        document.getElementById('btnNuevoTratamiento').title = 'Cancelar';
    }
    document.getElementById('btnEditarTratamiento').classList.add('hidden');
    document.getElementById('btnEliminarTratamiento').classList.add('hidden');
    resetBtnEditarTratamiento();
    modoEdicionTratamiento = false;
}

function resetBtnEditarTratamiento() {
    const btn = document.getElementById('btnEditarTratamiento');
    if (!btn) return;
    btn.innerHTML = '<i class="bx bx-edit text-xl"></i>';
    btn.title = 'Editar';
    btn.classList.remove('bg-green-500');
    btn.classList.add('bg-amber-500');
}

function guardarTratamiento() {
    const cod = document.getElementById('tratamientoCod').value.trim();
    if (!cod) {
        Toastify({text: 'Ingrese un código LER', style: {background: '#f44336'}}).showToast();
        return;
    }
    const descripcion = document.getElementById('tratamientoDescripcion').value.trim();
    if (!descripcion) {
        Toastify({text: 'Ingrese una descripción', style: {background: '#f44336'}}).showToast();
        return;
    }

    buscarXHRTratamiento('nuevo_tratamiento', {
        codigo: cod,
        descripcion: descripcion,
        codigo_ara: document.getElementById('tratamientoCodigoAra').value
    }, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            cargarTratamientosOptions();
            buscarPorCodigoTratamiento();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function editarTratamiento() {
    const btn = document.getElementById('btnEditarTratamiento');
    if (!modoEdicionTratamiento) {
        modoEdicionTratamiento = true;
        setCamposTratamientoDisabled(false);
        btn.innerHTML = '<i class="bx bx-check text-xl"></i>';
        btn.title = 'Guardar';
        btn.classList.remove('bg-amber-500');
        btn.classList.add('bg-green-500');
        document.getElementById('btnEliminarTratamiento').classList.add('hidden');
    } else {
        const cod = document.getElementById('tratamientoCod').value.trim();
        if (!cod) {
            Toastify({text: 'Seleccione un código', style: {background: '#f44336'}}).showToast();
            return;
        }
        buscarXHRTratamiento('editar_tratamiento', {
            codigo: cod,
            descripcion: document.getElementById('tratamientoDescripcion').value,
            codigo_ara: document.getElementById('tratamientoCodigoAra').value
        }, function(data) {
            if (data.success) {
                Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                cargarTratamientosOptions();
                modoEdicionTratamiento = false;
                setCamposTratamientoDisabled(true);
                resetBtnEditarTratamiento();
                document.getElementById('btnEliminarTratamiento').classList.remove('hidden');
            } else {
                Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
            }
        });
    }
}

function eliminarTratamiento() {
    const cod = document.getElementById('tratamientoCod').value.trim();
    if (!cod) {
        Toastify({text: 'Seleccione un tratamiento', style: {background: '#f44336'}}).showToast();
        return;
    }
    const esActivo = estadoOriginalTratamiento === 'Activo';
    mostrarModalConfirm({
        datos: [
            { label: 'Código LER', value: cod },
            { label: 'Descripción', value: document.getElementById('tratamientoDescripcion').value || '—' },
        ],
        titulo: esActivo ? 'Desactivar Tratamiento' : 'Activar Tratamiento',
        mensaje: esActivo ? '¿Está seguro de desactivar este tratamiento?' : '¿Está seguro de activar este tratamiento?',
        icono: esActivo ? 'bx bx-no-entry text-xl sm:text-2xl text-amber-500' : 'bx bx-check-circle text-xl sm:text-2xl text-green-500',
        textoBoton: esActivo ? 'Desactivar' : 'Activar',
        colorBoton: esActivo ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-green-500 text-white hover:bg-green-600',
        onConfirm: function() {
            const action = esActivo ? 'desactivar_tratamiento' : 'activar_tratamiento';
            buscarXHRTratamiento(action, {codigo: cod}, function(data) {
                if (data.success) {
                    Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
                    cargarTratamientosOptions();
                    if (esActivo) {
                        nuevoTratamiento();
                    } else {
                        buscarPorCodigoTratamiento();
                    }
                } else {
                    Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
                }
            });
        }
    });
}

function actualizarBtnEliminarTratamiento() {
    const btn = document.getElementById('btnEliminarTratamiento');
    if (!btn) return;
    const esActivo = estadoOriginalTratamiento === 'Activo';
    btn.title = esActivo ? 'Desactivar' : 'Activar';
    btn.querySelector('i').className = esActivo ? 'bx bx-no-entry text-xl' : 'bx bx-check-circle text-xl';
    btn.classList.remove('bg-red-500', 'hover:bg-red-600', 'bg-amber-500', 'hover:bg-amber-600');
    btn.classList.add(esActivo ? 'bg-amber-500' : 'bg-green-500', esActivo ? 'hover:bg-amber-600' : 'hover:bg-green-600');
}

function abrirListaTratamientos() {
    buscarXHRTratamiento('listar_tratamientos', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Lista de Tratamientos',
            columnas: [
                { title: 'Código LER', field: 'codigo', width: 120 },
                { title: 'Descripción', field: 'descripcion' },
                { title: 'Código ARA', field: 'codigo_ara', width: 120 },
            ],
            data: (data.tratamientos || []).map(function(t) {
                return { codigo: t.codigo_ler, descripcion: t.descripcion, codigo_ara: t.codigo_ara };
            }),
            filtroCampos: ['codigo', 'descripcion'],
            onSelect: function(row) {
                document.getElementById('tratamientoCod').value = row.codigo;
                buscarPorCodigoTratamiento();
            },
            onRefresh: function(opts) {
                buscarXHRTratamiento('listar_tratamientos', {}, function(d) {
                    opts.data = (d.tratamientos || []).map(function(t) {
                        return { codigo: t.codigo_ler, descripcion: t.descripcion, codigo_ara: t.codigo_ara };
                    });
                    abrirModalBusqueda(opts);
                });
            },
        });
    });
}

function seleccionarTratamiento(codigo, descripcion, codigoAra) {
    document.getElementById('tratamientoCod').value = codigo;
    document.getElementById('tratamientoDescripcion').value = descripcion || '';
    document.getElementById('tratamientoCodigoAra').value = codigoAra || '';
    setCamposTratamientoDisabled(true);
    document.getElementById('btnGuardarTratamiento').classList.add('hidden');
    document.getElementById('btnEditarTratamiento').classList.remove('hidden');
    document.getElementById('btnEliminarTratamiento').classList.remove('hidden');
    modoEdicionTratamiento = false;
    resetBtnEditarTratamiento();
    modoNuevoTratamiento = false;
    document.getElementById('btnNuevoTratamiento').innerHTML = '<i class="bx bx-plus text-xl"></i>';
    document.getElementById('btnNuevoTratamiento').title = 'Nuevo';
}