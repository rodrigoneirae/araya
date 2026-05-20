const urlArticulos = (document.currentScript && document.currentScript.dataset.url) || '/';
const csrfToken = document.currentScript?.dataset.csrfToken || '';
let listaArticulos = [];
let modoEdicion = false;

document.addEventListener('DOMContentLoaded', function() {
    cargarProcesos();
    cargarTipos();
    cargarUMedida();

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
        }
    });
}

function abrirListaArticulos() {
    console.log('Abriendo lista de artículos...');
    buscarXHR('listar_codigos', {}, function(data) {
        console.log('Respuesta:', data);
        listaArticulos = data.maestros || [];  // Cambiar de 'articulos' a 'maestros'
        const modal = document.getElementById('modalArticulos');
        if (modal) {
            modal.classList.remove('hidden');
        }
        const filtro = document.getElementById('filtroArticulos');
        if (filtro) {
            filtro.value = '';
        }
        renderizarArticulos(listaArticulos);
    });
}

function cerrarListaArticulos() {
    const modal = document.getElementById('modalArticulos');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function renderizarArticulos(articulos) {
    const tbody = document.getElementById('tablaArticulos');
    if (!tbody) return;
    tbody.innerHTML = '';
    articulos.forEach(a => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            document.getElementById('codigo').value = a.codigo;
            buscarPorCodigo();
            cerrarListaArticulos();
        };
        tr.innerHTML = `<td class="px-3 py-2 text-aq-text">${a.codigo}</td><td class="px-3 py-2 text-aq-text">${a.descr}</td><td class="px-3 py-2 text-aq-text">${a.tipo}</td>`;
        tbody.appendChild(tr);
    });
}

function filtrarArticulos() {
    const filtro = document.getElementById('filtroArticulos').value.toLowerCase();
    const filtrados = listaArticulos.filter(a =>
        (a.codigo && a.codigo.toLowerCase().includes(filtro)) ||
        (a.nombre && a.nombre.toLowerCase().includes(filtro))
    );
    renderizarArticulos(filtrados);
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
            document.getElementById('um').value = data.data.um || '';
            document.getElementById('stomin').value = data.data.stomin !== null && data.data.stomin !== '' ? data.data.stomin : '';
            document.getElementById('stomax').value = data.data.stomax !== null && data.data.stomax !== '' ? data.data.stomax : '';
            document.getElementById('procesos').value = data.data.proceso || '';
            setCamposDisabled(true);
            document.getElementById('btnGuardar').classList.add('hidden');
            document.getElementById('btnEditar').classList.remove('hidden');
            document.getElementById('btnEliminar').classList.remove('hidden');
            modoEdicion = false;
            resetBtnEditar();
        } else {
            document.getElementById('articuloForm').reset();
            document.getElementById('codigo').value = codigo;
            setCamposDisabled(false);
            document.getElementById('btnGuardar').classList.remove('hidden');
            document.getElementById('btnEditar').classList.add('hidden');
            document.getElementById('btnEliminar').classList.add('hidden');
            modoEdicion = false;
            resetBtnEditar();
        }
    });
}

function setCamposDisabled(disabled) {
    ['nombre', 'tipo', 'um', 'stomin', 'stomax', 'procesos'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabled;
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

function eliminarArticulo() {
    const codigo = document.getElementById('codigo').value.trim().toUpperCase();
    if (!codigo) {
        Toastify({text: 'Seleccione un código', style: {background: '#f44336'}}).showToast();
        return;
    }
    document.getElementById('eliminarCodigo').textContent = codigo;
    document.getElementById('modalConfirmar').classList.remove('hidden');
    window.codigoAEliminar = codigo;
}

function cerrarConfirmar() {
    document.getElementById('modalConfirmar').classList.add('hidden');
    window.codigoAEliminar = '';
}

function confirmarEliminar() {
    if (!window.codigoAEliminar) return;

    buscarXHR('eliminar', {codigo: window.codigoAEliminar}, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            cerrarConfirmar();
            nuevoArticulo();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}