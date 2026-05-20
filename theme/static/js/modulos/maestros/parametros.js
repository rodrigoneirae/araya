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

let listaBodegas = [];
let modoEdicionBodega = false;
let modoNuevoBodega = false;
let codigoBodegaEliminar = null;

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
            setCamposBodegaDisabled(true);
            document.getElementById('btnGuardarBodega').classList.add('hidden');
            document.getElementById('btnEditarBodega').classList.remove('hidden');
            document.getElementById('btnEliminarBodega').classList.remove('hidden');
            modoEdicionBodega = false;
            resetBtnEditarBodega();
        } else {
            document.getElementById('bodegaForm').reset();
            document.getElementById('bodegaCod').value = cod;
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

function eliminarBodega() {
    const cod = document.getElementById('bodegaCod').value.trim();
    if (!cod) {
        Toastify({text: 'Seleccione una bodega', style: {background: '#f44336'}}).showToast();
        return;
    }
    document.getElementById('eliminarCodBodega').textContent = cod;
    codigoBodegaEliminar = cod;
    document.getElementById('modalConfirmarBodega').classList.remove('hidden');
}

function cerrarConfirmarBodega() {
    document.getElementById('modalConfirmarBodega').classList.add('hidden');
    codigoBodegaEliminar = null;
}

function confirmarEliminarBodega() {
    if (!codigoBodegaEliminar) return;
    buscarXHRBodega('eliminar_bodega', {cod: codigoBodegaEliminar}, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            cerrarConfirmarBodega();
            nuevaBodega();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function abrirListaBodegas() {
    buscarXHRBodega('listar_bodegas', {}, function(data) {
        listaBodegas = data.bodegas || [];
        document.getElementById('modalBodegas').classList.remove('hidden');
        document.getElementById('filtroBodegas').value = '';
        renderizarListaBodegas(listaBodegas);
    });
}

function cerrarListaBodegas() {
    document.getElementById('modalBodegas').classList.add('hidden');
}

function renderizarListaBodegas(bodegas) {
    const tbody = document.getElementById('tablaListaBodegas');
    tbody.innerHTML = '';
    bodegas.forEach(b => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            seleccionarBodega(b.cod, b.nombre, b.glosa);
            cerrarListaBodegas();
        };
        tr.innerHTML = `<td class="px-3 py-2 text-aq-text">${b.cod}</td><td class="px-3 py-2 text-aq-text">${b.nombre}</td><td class="px-3 py-2 text-aq-text">${b.glosa || '-'}</td>`;
        tbody.appendChild(tr);
    });
}

function filtrarBodegas() {
    const filtro = document.getElementById('filtroBodegas').value.toLowerCase();
    const filtradas = listaBodegas.filter(b =>
        (b.cod && b.cod.toString().toLowerCase().includes(filtro)) ||
        (b.nombre && b.nombre.toLowerCase().includes(filtro))
    );
    renderizarListaBodegas(filtradas);
}

function recargarBodegas() {
    buscarXHRBodega('listar_bodegas', {}, function(data) {
        listaBodegas = data.bodegas || [];
        renderizarListaBodegas(listaBodegas);
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

let listaDocs = [];
let modoEdicionDoc = false;
let modoNuevoDoc = false;
let codigoDocEliminar = null;

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
            document.getElementById('docSigno').value = data.data.signo !== null && data.data.signo !== '' ? data.data.signo : '';
            setCamposDocDisabled(true);
            document.getElementById('btnGuardarDoc').classList.add('hidden');
            document.getElementById('btnEditarDoc').classList.remove('hidden');
            document.getElementById('btnEliminarDoc').classList.remove('hidden');
            modoEdicionDoc = false;
            resetBtnEditarDoc();
        } else {
            document.getElementById('docForm').reset();
            document.getElementById('docCod').value = cod;
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
    ['docNombre', 'docSigno'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabled;
    });
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
    document.getElementById('eliminarCodDoc').textContent = cod;
    codigoDocEliminar = cod;
    document.getElementById('modalConfirmarDoc').classList.remove('hidden');
}

function cerrarConfirmarDoc() {
    document.getElementById('modalConfirmarDoc').classList.add('hidden');
    codigoDocEliminar = null;
}

function confirmarEliminarDoc() {
    if (!codigoDocEliminar) return;
    buscarXHRDoc('eliminar_doc', {cod: codigoDocEliminar}, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            cerrarConfirmarDoc();
            nuevaDoc();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function abrirListaDocs() {
    buscarXHRDoc('listar_docs', {}, function(data) {
        listaDocs = data.docs || [];
        document.getElementById('modalDocs').classList.remove('hidden');
        document.getElementById('filtroDocs').value = '';
        renderizarListaDocs(listaDocs);
    });
}

function cerrarListaDocs() {
    document.getElementById('modalDocs').classList.add('hidden');
}

function renderizarListaDocs(docs) {
    const tbody = document.getElementById('tablaListaDocs');
    tbody.innerHTML = '';
    docs.forEach(d => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            seleccionarDoc(d.cod, d.nombre, d.signo);
            cerrarListaDocs();
        };
        tr.innerHTML = `<td class="px-3 py-2 text-aq-text">${d.cod}</td><td class="px-3 py-2 text-aq-text">${d.nombre}</td><td class="px-3 py-2 text-aq-text">${d.signo || '-'}</td>`;
        tbody.appendChild(tr);
    });
}

function filtrarDocs() {
    const filtro = document.getElementById('filtroDocs').value.toLowerCase();
    const filtradas = listaDocs.filter(d =>
        (d.cod && d.cod.toString().toLowerCase().includes(filtro)) ||
        (d.nombre && d.nombre.toLowerCase().includes(filtro))
    );
    renderizarListaDocs(filtradas);
}

function recargarDocs() {
    buscarXHRDoc('listar_docs', {}, function(data) {
        listaDocs = data.docs || [];
        renderizarListaDocs(listaDocs);
    });
}

function seleccionarDoc(cod, nombre, signo) {
    document.getElementById('docCod').value = cod;
    document.getElementById('docNombre').value = nombre;
    document.getElementById('docSigno').value = signo !== null && signo !== '' ? signo : '';
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

let listaProcesos = [];
let modoEdicionProceso = false;
let modoNuevoProceso = false;
let codigoProcesoEliminar = null;

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
            setCamposProcesoDisabled(true);
            document.getElementById('btnGuardarProceso').classList.add('hidden');
            document.getElementById('btnEditarProceso').classList.remove('hidden');
            document.getElementById('btnEliminarProceso').classList.remove('hidden');
            modoEdicionProceso = false;
            resetBtnEditarProceso();
        } else {
            document.getElementById('procesoForm').reset();
            document.getElementById('procesoCod').value = cod;
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
    document.getElementById('eliminarCodProceso').textContent = cod;
    codigoProcesoEliminar = cod;
    document.getElementById('modalConfirmarProceso').classList.remove('hidden');
}

function cerrarConfirmarProceso() {
    document.getElementById('modalConfirmarProceso').classList.add('hidden');
    codigoProcesoEliminar = null;
}

function confirmarEliminarProceso() {
    if (!codigoProcesoEliminar) return;
    buscarXHRProceso('eliminar_proceso', {cod: codigoProcesoEliminar}, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            cerrarConfirmarProceso();
            nuevoProceso();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function abrirListaProcesos() {
    buscarXHRProceso('listar_procesos', {}, function(data) {
        listaProcesos = data.procesos || [];
        document.getElementById('modalProcesos').classList.remove('hidden');
        document.getElementById('filtroProcesos').value = '';
        renderizarListaProcesos(listaProcesos);
    });
}

function cerrarListaProcesos() {
    document.getElementById('modalProcesos').classList.add('hidden');
}

function renderizarListaProcesos(procesos) {
    const tbody = document.getElementById('tablaListaProcesos');
    tbody.innerHTML = '';
    procesos.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            seleccionarProceso(p.cod, p.nombre, p.glosa);
            cerrarListaProcesos();
        };
        tr.innerHTML = `<td class="px-3 py-2 text-aq-text">${p.cod}</td><td class="px-3 py-2 text-aq-text">${p.nombre}</td><td class="px-3 py-2 text-aq-text">${p.glosa || '-'}</td>`;
        tbody.appendChild(tr);
    });
}

function filtrarProcesos() {
    const filtro = document.getElementById('filtroProcesos').value.toLowerCase();
    const filtradas = listaProcesos.filter(p =>
        (p.cod && p.cod.toString().toLowerCase().includes(filtro)) ||
        (p.nombre && p.nombre.toLowerCase().includes(filtro))
    );
    renderizarListaProcesos(filtradas);
}

function recargarProcesos() {
    buscarXHRProceso('listar_procesos', {}, function(data) {
        listaProcesos = data.procesos || [];
        renderizarListaProcesos(listaProcesos);
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

let listaEmpleados = [];
let modoEdicionEmpleado = false;
let modoNuevoEmpleado = false;
let codigoEmpleadoEliminar = null;

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
            setCamposEmpleadoDisabled(true);
            document.getElementById('btnGuardarEmpleado').classList.add('hidden');
            document.getElementById('btnEditarEmpleado').classList.remove('hidden');
            document.getElementById('btnEliminarEmpleado').classList.remove('hidden');
            modoEdicionEmpleado = false;
            resetBtnEditarEmpleado();
        } else {
            document.getElementById('empleadoForm').reset();
            document.getElementById('empleadoCod').value = cod;
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
    document.getElementById('eliminarCodEmpleado').textContent = cod;
    codigoEmpleadoEliminar = cod;
    document.getElementById('modalConfirmarEmpleado').classList.remove('hidden');
}

function cerrarConfirmarEmpleado() {
    document.getElementById('modalConfirmarEmpleado').classList.add('hidden');
    codigoEmpleadoEliminar = null;
}

function confirmarEliminarEmpleado() {
    if (!codigoEmpleadoEliminar) return;
    buscarXHREmpleado('eliminar_empleado', {cod: codigoEmpleadoEliminar}, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            cerrarConfirmarEmpleado();
            nuevoEmpleado();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function abrirListaEmpleados() {
    buscarXHREmpleado('listar_empleados', {}, function(data) {
        listaEmpleados = data.empleados || [];
        document.getElementById('modalEmpleados').classList.remove('hidden');
        document.getElementById('filtroEmpleados').value = '';
        renderizarListaEmpleados(listaEmpleados);
    });
}

function cerrarListaEmpleados() {
    document.getElementById('modalEmpleados').classList.add('hidden');
}

function renderizarListaEmpleados(empleados) {
    const tbody = document.getElementById('tablaListaEmpleados');
    tbody.innerHTML = '';
    empleados.forEach(e => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            seleccionarEmpleado(e.cod, e.nombre, e.glosa);
            cerrarListaEmpleados();
        };
        tr.innerHTML = `<td class="px-3 py-2 text-aq-text">${e.cod}</td><td class="px-3 py-2 text-aq-text">${e.nombre}</td><td class="px-3 py-2 text-aq-text">${e.glosa || '-'}</td>`;
        tbody.appendChild(tr);
    });
}

function filtrarEmpleados() {
    const filtro = document.getElementById('filtroEmpleados').value.toLowerCase();
    const filtradas = listaEmpleados.filter(e =>
        (e.cod && e.cod.toString().toLowerCase().includes(filtro)) ||
        (e.nombre && e.nombre.toLowerCase().includes(filtro))
    );
    renderizarListaEmpleados(filtradas);
}

function recargarEmpleados() {
    buscarXHREmpleado('listar_empleados', {}, function(data) {
        listaEmpleados = data.empleados || [];
        renderizarListaEmpleados(listaEmpleados);
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

let listaCpagos = [];
let modoEdicionCpago = false;
let modoNuevoCpago = false;
let codigoCpagoEliminar = null;

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
            setCamposCpagoDisabled(true);
            document.getElementById('btnGuardarCpago').classList.add('hidden');
            document.getElementById('btnEditarCpago').classList.remove('hidden');
            document.getElementById('btnEliminarCpago').classList.remove('hidden');
            modoEdicionCpago = false;
            resetBtnEditarCpago();
        } else {
            document.getElementById('cpagoForm').reset();
            document.getElementById('cpagoCod').value = cod;
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
    document.getElementById('eliminarCodCpago').textContent = cod;
    codigoCpagoEliminar = cod;
    document.getElementById('modalConfirmarCpago').classList.remove('hidden');
}

function cerrarConfirmarCpago() {
    document.getElementById('modalConfirmarCpago').classList.add('hidden');
    codigoCpagoEliminar = null;
}

function confirmarEliminarCpago() {
    if (!codigoCpagoEliminar) return;
    buscarXRHCpago('eliminar_cpago', {cod: codigoCpagoEliminar}, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            cerrarConfirmarCpago();
            nuevoCpago();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function abrirListaCpagos() {
    buscarXRHCpago('listar_cpagos', {}, function(data) {
        listaCpagos = data.cpagos || [];
        document.getElementById('modalCpagos').classList.remove('hidden');
        document.getElementById('filtroCpagos').value = '';
        renderizarListaCpagos(listaCpagos);
    });
}

function cerrarListaCpagos() {
    document.getElementById('modalCpagos').classList.add('hidden');
}

function renderizarListaCpagos(cpagos) {
    const tbody = document.getElementById('tablaListaCpagos');
    tbody.innerHTML = '';
    cpagos.forEach(c => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            seleccionarCpago(c.cod, c.descr, c.glosa, c.dias);
            cerrarListaCpagos();
        };
        tr.innerHTML = `<td class="px-3 py-2 text-aq-text">${c.cod}</td><td class="px-3 py-2 text-aq-text">${c.descr || '-'}</td><td class="px-3 py-2 text-aq-text">${c.dias || '-'}</td><td class="px-3 py-2 text-aq-text">${c.glosa || '-'}</td>`;
        tbody.appendChild(tr);
    });
}

function filtrarCpagos() {
    const filtro = document.getElementById('filtroCpagos').value.toLowerCase();
    const filtradas = listaCpagos.filter(c =>
        (c.cod && c.cod.toString().toLowerCase().includes(filtro)) ||
        (c.descr && c.descr.toLowerCase().includes(filtro))
    );
    renderizarListaCpagos(filtradas);
}

function recargarCpagos() {
    buscarXRHCpago('listar_cpagos', {}, function(data) {
        listaCpagos = data.cpagos || [];
        renderizarListaCpagos(listaCpagos);
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

let listaTransportistas = [];
let modoEdicionTransportista = false;
let modoNuevoTransportista = false;
let rutTransportistaEliminar = null;
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
            setCamposTransportistaDisabled(true);
            document.getElementById('btnGuardarTransportista').classList.add('hidden');
            document.getElementById('btnEditarTransportista').classList.remove('hidden');
            document.getElementById('btnEliminarTransportista').classList.remove('hidden');
            modoEdicionTransportista = false;
            resetBtnEditarTransportista();
            transportistaActualPatentes = data.data.rut;
            renderizarPatentes(data.data.patentes || []);
        } else {
            document.getElementById('transportistaForm').reset();
            document.getElementById('transportistaRut').value = rut;
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
    document.getElementById('eliminarRutTransportista').textContent = rut;
    rutTransportistaEliminar = rut;
    document.getElementById('modalConfirmarTransportista').classList.remove('hidden');
}

function cerrarConfirmarTransportista() {
    document.getElementById('modalConfirmarTransportista').classList.add('hidden');
    rutTransportistaEliminar = null;
}

function confirmarEliminarTransportista() {
    if (!rutTransportistaEliminar) return;
    buscarXHRTransportista('eliminar_transportista', {rut: rutTransportistaEliminar}, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            cerrarConfirmarTransportista();
            nuevoTransportista();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function abrirListaTransportistas() {
    buscarXHRTransportista('listar_transportistas', {}, function(data) {
        listaTransportistas = data.transportistas || [];
        document.getElementById('modalTransportistas').classList.remove('hidden');
        document.getElementById('filtroTransportistas').value = '';
        renderizarListaTransportistas(listaTransportistas);
    });
}

function cerrarListaTransportistas() {
    document.getElementById('modalTransportistas').classList.add('hidden');
}

function renderizarListaTransportistas(transportistas) {
    const tbody = document.getElementById('tablaListaTransportistas');
    tbody.innerHTML = '';
    transportistas.forEach(t => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            seleccionarTransportista(t.rut, t.nombre);
            cerrarListaTransportistas();
        };
        tr.innerHTML = `<td class="px-3 py-2 text-aq-text">${t.rut}</td><td class="px-3 py-2 text-aq-text">${t.nombre}</td>`;
        tbody.appendChild(tr);
    });
}

function filtrarTransportistas() {
    const filtro = document.getElementById('filtroTransportistas').value.toLowerCase();
    const filtradas = listaTransportistas.filter(t =>
        (t.rut && t.rut.toLowerCase().includes(filtro)) ||
        (t.nombre && t.nombre.toLowerCase().includes(filtro))
    );
    renderizarListaTransportistas(filtradas);
}

function recargarTransportistas() {
    buscarXHRTransportista('listar_transportistas', {}, function(data) {
        listaTransportistas = data.transportistas || [];
        renderizarListaTransportistas(listaTransportistas);
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
    buscarXHRTransportista('buscar_transportista', {rut: rut}, function(data) {
        renderizarPatentes(data.data?.patentes || []);
    });
}

// ==================== PATENTES ====================
function renderizarPatentes(patentes) {
    const tbody = document.getElementById('tablaPatentes');
    tbody.innerHTML = '';
    if (!patentes || patentes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="px-3 py-4 text-center text-aq-muted">Sin patentes registradas</td></tr>';
        return;
    }
    patentes.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-3 py-2 text-aq-text">${p.patente}</td>
            <td class="px-3 py-2 text-right">
                <button onclick="eliminarPatente(${p.id}, this)" class="text-red-500 hover:text-red-700 p-1" title="Eliminar patente">
                    <i class='bx bx-trash'></i>
                </button>
            </td>`;
        tbody.appendChild(tr);
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
            buscarXHRTransportista('buscar_transportista', {rut: rut}, function(d) {
                renderizarPatentes(d.data?.patentes || []);
            });
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

let patenteIdEliminar = null;

function eliminarPatente(id, btn) {
    patenteIdEliminar = id;
    const patenteText = btn.closest('tr')?.querySelector('td')?.textContent || '';
    document.getElementById('eliminarPatenteTexto').textContent = patenteText;
    document.getElementById('modalConfirmarPatente').classList.remove('hidden');
}

function cerrarConfirmarPatente() {
    document.getElementById('modalConfirmarPatente').classList.add('hidden');
    patenteIdEliminar = null;
}

function confirmarEliminarPatente() {
    if (!patenteIdEliminar) return;
    buscarXHRTransportista('eliminar_patente', {id: patenteIdEliminar}, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            cerrarConfirmarPatente();
            const rut = document.getElementById('transportistaRut').value.trim();
            buscarXHRTransportista('buscar_transportista', {rut: rut}, function(d) {
                renderizarPatentes(d.data?.patentes || []);
            });
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}

function cambiarTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.querySelectorAll('.tab-content').forEach(contenido => contenido.classList.add('hidden'));
    document.getElementById('contenido-' + tab).classList.remove('hidden');
}