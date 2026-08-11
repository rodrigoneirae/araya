const urlCert = (document.currentScript?.dataset.url) || '/';

function buscarXHR(action, datos, callback) {
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
    fetch(urlCert, {
        method: 'POST',
        body: formData
    })
    .then(res => {
        if (!res.ok) throw new Error('HTTP error: ' + res.status);
        return res.json();
    })
    .then(data => callback(data))
    .catch(err => {
        console.error('Error:', err);
        ocultarSpinner();
        Toastify({text: 'Error: ' + err.message, style: {background: '#f44336'}}).showToast();
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('certFechaInicio').value = hoy;
    document.getElementById('certFechaCorte').value = hoy;
    document.getElementById('certFechaEmision').value = hoy;

    document.getElementById('certRut')?.addEventListener('change', function() {
        buscarCliente();
    });

    document.getElementById('certFechaInicio')?.addEventListener('change', function() {
        autoCompletarMes();
    });

    cargarCertificados();
});

let tablaCert = null;

function cargarCertificados() {
    buscarXHR('listar_certificados', {}, function(data) {
        const certs = data.certificados || [];
        if (tablaCert) { tablaCert.destroy(); tablaCert = null; }
        tablaCert = new Tabulator("#tablaCertificados", {
            data: certs,
            layout: "fitColumns",
            height: "100%",
            pagination: true,
            paginationSize: 15,
            paginationSizeSelector: [10, 20, 50, 100],
            placeholder: "No se han emitido certificados",
            columns: [
                { title: "Folio", field: "folio", widthGrow: 1, hozAlign: "center" },
                { title: "RUT", field: "rut", widthGrow: 2, hozAlign: "center" },
                { title: "Cliente", field: "nombre", widthGrow: 3 },
                { title: "Emisión", field: "fecha_emision", widthGrow: 2, hozAlign: "center" },
                { title: "Período", field: "periodo", widthGrow: 2, hozAlign: "center" },
                { title: "Kilos", field: "total_kilos", widthGrow: 1, hozAlign: "right",
                    formatter: function(cell) {
                        return (cell.getValue() || 0).toLocaleString('es-CL', {maximumFractionDigits: 2});
                    }
                },
                { title: "Registro", field: "fec_crea", widthGrow: 2, hozAlign: "center" },
                { title: "", field: "folio", widthGrow: 1, hozAlign: "center",
                    formatter: function(cell) {
                        return `<button type="button" onclick="descargarCertificado(${cell.getValue()})" class="px-2 py-1 rounded bg-aq-primary text-white hover:bg-aq-primary/80 text-xs" title="Descargar"><i class='bx bxs-download'></i></button>`;
                    }
                },
            ],
        });
    });
}

function descargarCertificado(folio) {
    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', _getCookie('csrftoken'));
    formData.append('action', 'descargar_certificado');
    formData.append('folio', folio);

    fetch(urlCert, { method: 'POST', body: formData })
    .then(res => {
        if (!res.ok) throw new Error('Error HTTP ' + res.status);
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return res.json().then(data => { throw new Error(data.message || 'Error al descargar'); });
        }
        return res.blob();
    })
    .then(blob => {
        const filename = `certificado_destino_sustentable_folio_${folio}.pdf`;
        if (typeof window.downloadBlobTauri === 'function') {
            window.downloadBlobTauri(blob, filename);
        } else {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }
    })
    .catch(err => {
        console.error('Error:', err);
        Toastify({text: 'Error: ' + err.message, style: {background: '#f44336'}}).showToast();
    });
}

function autoCompletarMes() {
    const inicio = document.getElementById('certFechaInicio').value;
    if (!inicio) return;
    const parts = inicio.split('-');
    if (parts.length !== 3) return;
    const dia = parseInt(parts[2], 10);
    if (dia !== 1) return;
    const anio = parseInt(parts[0], 10);
    const mes = parseInt(parts[1], 10) - 1;
    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    const fin = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
    document.getElementById('certFechaCorte').value = fin;
}

function abrirListaClientes() {
    buscarXHR('listar_clientes', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Buscar Cliente',
            columnas: [
                { title: 'RUT', field: 'rut', width: 140 },
                { title: 'Nombre', field: 'nombre' },
            ],
            data: data.clientes || [],
            filtroCampos: ['rut', 'nombre'],
            onSelect: function(row) {
                document.getElementById('certRut').value = row.rut;
                setSpan('certNombre', row.nombre);
            },
            onRefresh: function(opts) {
                buscarXHR('listar_clientes', {}, function(data) {
                    opts.data = data.clientes || [];
                    abrirModalBusqueda(opts);
                });
            },
        });
    });
}

function mostrarSpinner() {
    document.getElementById('spinnerCert').classList.remove('hidden');
}

function ocultarSpinner() {
    document.getElementById('spinnerCert').classList.add('hidden');
}

function setSpan(id, val) {
    document.getElementById(id).textContent = val || '\u00a0';
}

function buscarCliente() {
    const rut = document.getElementById('certRut').value.trim();
    if (!rut) return;
    buscarXHR('buscar_cliente', { rut: rut }, function(data) {
        if (data.success) {
            setSpan('certNombre', data.data.nombre);
        } else {
            setSpan('certNombre', '');
            Toastify({text: data.message || 'Cliente no encontrado', style: {background: '#f44336'}}).showToast();
        }
    });
}

function _getCookie(name) {
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

function generarPDF() {
    const rut = document.getElementById('certRut').value.trim();
    const fecha_inicio = document.getElementById('certFechaInicio').value;
    const fecha_corte = document.getElementById('certFechaCorte').value;
    const fecha_emision = document.getElementById('certFechaEmision').value;

    if (!rut) {
        Toastify({text: 'Seleccione un cliente', style: {background: '#f44336'}}).showToast();
        return;
    }

    mostrarSpinner();
    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', _getCookie('csrftoken'));
    formData.append('action', 'generar_pdf');
    formData.append('rut', rut);
    formData.append('fecha_inicio', fecha_inicio);
    formData.append('fecha_corte', fecha_corte);
    formData.append('fecha_emision', fecha_emision);

    fetch(urlCert, { method: 'POST', body: formData })
    .then(res => {
        if (!res.ok) throw new Error('Error HTTP ' + res.status);
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return res.json().then(data => { throw new Error(data.message || 'Error al generar'); });
        }
        return res.blob();
    })
    .then(blob => {
        ocultarSpinner();
        const filename = `certificado_destino_sustentable_${rut}.pdf`;
        if (typeof window.downloadBlobTauri === 'function') {
            window.downloadBlobTauri(blob, filename);
        } else {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }
        cargarCertificados();
    })
    .catch(err => {
        ocultarSpinner();
        console.error('Error:', err);
        Toastify({text: 'Error: ' + err.message, style: {background: '#f44336'}}).showToast();
    });
}
