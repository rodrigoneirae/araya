const urlProvCliente = (document.currentScript && document.currentScript.dataset.url) || '/';
const csrfToken = document.currentScript?.dataset.csrfToken || '';
let listaClientes = [];
let modoEdicion = false;
let modoNuevo = false;

document.addEventListener('DOMContentLoaded', function() {
    cargarTipos();
    cargarCpagos();

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
        }
    });
}

function abrirListaClientes() {
    console.log('Abriendo lista clientes...');
    buscarXHR('listar_ruts', {}, function(data) {
        console.log('Respuesta:', data);
        listaClientes = data.clientes || [];
        const modal = document.getElementById('modalClientes');
        if (modal) {
            modal.classList.remove('hidden');
        }
        const filtro = document.getElementById('filtroClientes');
        if (filtro) {
            filtro.value = '';
        }
        renderizarClientes(listaClientes);
    });
}

function cerrarListaClientes() {
    const modal = document.getElementById('modalClientes');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function renderizarClientes(clientes) {
    const tbody = document.getElementById('tablaClientes');
    if (!tbody) return;
    tbody.innerHTML = '';
    clientes.forEach(c => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            const rutInput = document.getElementById('rut');
            if (rutInput) rutInput.value = c.rut;
            buscarPorRut();
            cerrarListaClientes();
        };
        tr.innerHTML = `<td class="px-3 py-2 text-aq-text">${c.rut}</td><td class="px-3 py-2 text-aq-text">${c.nombre}</td><td class="px-3 py-2 text-aq-text">${c.tipo}</td>`;
        tbody.appendChild(tr);
    });
}

function filtrarClientes() {
    const filtro = document.getElementById('filtroClientes').value.toLowerCase();
    const filtrados = listaClientes.filter(c =>
        (c.rut && c.rut.toLowerCase().includes(filtro)) ||
        (c.nombre && c.nombre.toLowerCase().includes(filtro))
    );
    renderizarClientes(filtrados);
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
            document.getElementById('nombre').value = data.data.nombre || '';
            document.getElementById('tipo').value = data.data.tipo || '';
            document.getElementById('direccion').value = data.data.direccion || '';
            document.getElementById('fono').value = data.data.fono || '';
            document.getElementById('email').value = data.data.email || '';
            document.getElementById('contacto').value = data.data.contacto || '';
            document.getElementById('cpago').value = data.data.cpago || '';
            setCamposDisabled(true);
            document.getElementById('btnGuardar').classList.add('hidden');
            document.getElementById('btnEditar').classList.remove('hidden');
            document.getElementById('btnEliminar').classList.remove('hidden');
            modoEdicion = false;
            resetBtnEditar();
        } else {
            document.getElementById('clienteForm').reset();
            document.getElementById('rut').value = rut;
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
    ['nombre', 'tipo', 'direccion', 'fono', 'email', 'contacto', 'cpago'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabled;
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
        nombre: nombre,
        tipo: document.getElementById('tipo').value,
        direccion: document.getElementById('direccion').value,
        fono: document.getElementById('fono').value,
        email: document.getElementById('email').value,
        contacto: document.getElementById('contacto').value,
        cpago: document.getElementById('cpago').value
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
            nombre: document.getElementById('nombre').value,
            tipo: document.getElementById('tipo').value,
            direccion: document.getElementById('direccion').value,
            fono: document.getElementById('fono').value,
            email: document.getElementById('email').value,
            contacto: document.getElementById('contacto').value,
            cpago: document.getElementById('cpago').value
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

function eliminarCliente() {
    const rut = document.getElementById('rut').value.trim().toUpperCase();
    if (!rut) {
        Toastify({text: 'Seleccione un RUT', style: {background: '#f44336'}}).showToast();
        return;
    }
    document.getElementById('eliminarRut').textContent = rut;
    document.getElementById('modalConfirmar').classList.remove('hidden');
    window.rutAEliminar = rut;
}

function cerrarConfirmar() {
    document.getElementById('modalConfirmar').classList.add('hidden');
    window.rutAEliminar = '';
}

function confirmarEliminar() {
    if (!window.rutAEliminar) return;

    buscarXHR('eliminar', {rut: window.rutAEliminar}, function(data) {
        if (data.success) {
            Toastify({text: data.message, style: {background: '#4caf50'}}).showToast();
            cerrarConfirmar();
            nuevoCliente();
        } else {
            Toastify({text: data.message, style: {background: '#f44336'}}).showToast();
        }
    });
}