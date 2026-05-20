const urlPE = (document.currentScript?.dataset.url) || '/';

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

function mostrarSpinner() {
    document.getElementById('spinnerInforme').classList.remove('hidden');
}

function ocultarSpinner() {
    document.getElementById('spinnerInforme').classList.add('hidden');
}

function _fetchInforme(action, filename) {
    const encargado = document.getElementById('encargadoSelect').value;

    mostrarSpinner();

    const fecha_inicio = document.querySelector('input[name="fecha_inicio"]').value;
    const fecha_fin = document.querySelector('input[name="fecha_fin"]').value;

    const formData = new FormData();
    formData.append('action', action);
    formData.append('encargado', encargado);
    if (fecha_inicio) formData.append('fecha_inicio', fecha_inicio);
    if (fecha_fin) formData.append('fecha_fin', fecha_fin);

    fetch(urlPE, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        body: formData
    })
    .then(res => {
        if (!res.ok) throw new Error('Error HTTP ' + res.status);
        return res.blob();
    })
    .then(blob => {
        ocultarSpinner();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    })
    .catch(err => {
        ocultarSpinner();
        console.error('Error:', err);
        Toastify({ text: 'Error al generar informe: ' + err.message, style: { background: '#f44336' } }).showToast();
    });
}

function generarInforme(formato) {
    if (formato === 'pdf') {
        _fetchInforme('generar_pdf', 'produccion_encargado.pdf');
    } else {
        _fetchInforme('generar_excel', 'produccion_encargado.xlsx');
    }
}

function cargarEncargados() {
    const formData = new FormData();
    formData.append('action', 'listar_encargados');

    fetch(urlPE, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        const select = document.querySelector('select[name="encargado"]');
        (data.encargados || []).forEach(enc => {
            const option = document.createElement('option');
            option.value = enc.cod;
            option.textContent = enc.nombre;
            select.appendChild(option);
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    cargarEncargados();
});