let campoOTActivo = '';

const urlCostosOT = (document.currentScript?.dataset.url) || '/';

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

function abrirListaOT(campo) {
    campoOTActivo = campo;
    const formData = new FormData();
    formData.append('action', 'listar_ots');

    fetch(urlCostosOT, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        abrirModalBusqueda({
            titulo: 'Lista de Órdenes de Trabajo',
            columnas: [
                { title: 'N° OT', field: 'numero', width: 100 },
                { title: 'Fecha', field: 'fecha', width: 120 },
                { title: 'Proceso', field: 'proceso' },
            ],
            data: data.ots || [],
            filtroCampos: ['numero', 'fecha', 'proceso'],
            onSelect: function(row) {
                const inputId = campoOTActivo === 'desde' ? 'otDesde' : 'otHasta';
                document.getElementById(inputId).value = row.numero;
                if (campoOTActivo === 'desde') {
                    document.getElementById('otHasta').value = row.numero;
                }
            },
            onRefresh: function(opts) {
                const fd = new FormData();
                fd.append('action', 'listar_ots');
                fetch(urlCostosOT, {
                    method: 'POST',
                    headers: { 'X-CSRFToken': getCookie('csrftoken') },
                    body: fd
                })
                .then(res => res.json())
                .then(data => {
                    opts.data = data.ots || [];
                    abrirModalBusqueda(opts);
                });
            },
        });
    })
    .catch(err => {
        console.error('Error:', err);
        Toastify({ text: 'Error al cargar OTs', style: { background: '#f44336' } }).showToast();
    });
}

function cargarTablaCostos() {
    const ot_desde = document.getElementById('otDesde').value;
    const ot_hasta = document.getElementById('otHasta').value;

    if (!ot_desde || !ot_hasta) return;

    const formData = new FormData();
    formData.append('action', 'listar_costos');
    formData.append('ot_desde', ot_desde);
    formData.append('ot_hasta', ot_hasta);

    fetch(urlCostosOT, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById('tablaCostos');
        if (!data.data || data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-aq-muted text-sm py-8">Sin datos para el rango seleccionado</td></tr>';
            return;
        }
        const rows = data.data;
        let totCant = 0, totPUnit = 0, totNeto = 0, totTotal = 0;
        tbody.innerHTML = rows.map(row => {
            const bg = row.linea === 0 ? 'bg-aq-surface-2 font-semibold' : '';
            totCant += parseFloat(String(row.cantidad).replace(/\./g, '')) || 0;
            totPUnit += parseFloat(String(row.punit).replace(/\./g, '')) || 0;
            totNeto += parseFloat(String(row.neto).replace(/\./g, '')) || 0;
            totTotal += parseFloat(String(row.total).replace(/\./g, '')) || 0;
            return `<tr class="hover:bg-aq-surface-2 text-xs ${bg}">
                <td class="px-2 py-1.5 whitespace-nowrap">${row.ot}</td>
                <td class="px-2 py-1.5 whitespace-nowrap">${row.fecha}</td>
                <td class="px-2 py-1.5 whitespace-nowrap">${row.proceso}</td>
                <td class="px-2 py-1.5 whitespace-nowrap">${row.codigo}</td>
                <td class="px-2 py-1.5 whitespace-nowrap">${row.articulo}</td>
                <td class="px-2 py-1.5 text-right whitespace-nowrap">${row.cantidad}</td>
                <td class="px-2 py-1.5 text-right whitespace-nowrap">${row.punit}</td>
                <td class="px-2 py-1.5 text-right whitespace-nowrap">${row.neto}</td>
                <td class="px-2 py-1.5 text-right whitespace-nowrap">${row.total}</td>
            </tr>`;
        }).join('');
        function fmtNum(n) {
            return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        }
        tbody.innerHTML += `<tr class="bg-aq-surface-2 font-semibold text-xs border-t-2 border-aq-border">
            <td colspan="5" class="px-2 py-1.5 text-aq-text">Totales</td>
            <td class="px-2 py-1.5 text-aq-text text-right">${fmtNum(totCant)}</td>
            <td class="px-2 py-1.5 text-aq-text text-right">${fmtNum(totPUnit)}</td>
            <td class="px-2 py-1.5 text-aq-text text-right">${fmtNum(totNeto)}</td>
            <td class="px-2 py-1.5 text-aq-text text-right">${fmtNum(totTotal)}</td>
        </tr>`;
    })
    .catch(err => console.error('Error:', err));
}

function calcularCostos() {
    const ot_desde = document.getElementById('otDesde').value;
    const ot_hasta = document.getElementById('otHasta').value;

    if (!ot_desde || !ot_hasta) {
        Toastify({ text: 'Debe seleccionar OT Desde y OT Hasta', style: { background: '#f44336' } }).showToast();
        return;
    }

    mostrarSpinner();

    const formData = new FormData();
    formData.append('action', 'calcular_costos');
    formData.append('ot_desde', ot_desde);
    formData.append('ot_hasta', ot_hasta);

    fetch(urlCostosOT, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        ocultarSpinner();
        if (data.success) {
            Toastify({ text: 'El cálculo de costos ha sido realizado exitosamente', style: { background: '#4caf50' } }).showToast();
            cargarTablaCostos();
        } else {
            Toastify({ text: data.error || 'Error al calcular costos', style: { background: '#f44336' } }).showToast();
        }
    })
    .catch(err => {
        ocultarSpinner();
        console.error('Error:', err);
        Toastify({ text: 'Error al calcular costos: ' + err.message, style: { background: '#f44336' } }).showToast();
    });
}

function _fetchInforme(action, filename) {
    const ot_desde = document.querySelector('input[name="ot_desde"]').value;
    const ot_hasta = document.querySelector('input[name="ot_hasta"]').value;

    if (!ot_desde || !ot_hasta) {
        Toastify({ text: 'Debe ingresar OT Desde y OT Hasta', style: { background: '#f44336' } }).showToast();
        return;
    }

    mostrarSpinner();

    const formData = new FormData();
    formData.append('action', action);
    formData.append('ot_desde', ot_desde);
    formData.append('ot_hasta', ot_hasta);

    fetch(urlCostosOT, {
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
        ocultarSpinner();
        console.error('Error:', err);
        Toastify({ text: 'Error al generar informe: ' + err.message, style: { background: '#f44336' } }).showToast();
    });
}

function generarInforme(formato) {
    if (formato === 'pdf') {
        _fetchInforme('generar_pdf', 'costos_ot.pdf');
    } else {
        _fetchInforme('generar_excel', 'costos_ot.xlsx');
    }
}
