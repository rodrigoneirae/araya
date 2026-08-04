const urlResOts = (document.currentScript?.dataset.url) || '/';

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
    mostrarSpinner();

    const fecha_inicio = document.getElementById('fecha_inicio').value;
    const fecha_fin = document.getElementById('fecha_fin').value;
    const ot_numero = document.getElementById('ot_numero').value;

    const formData = new FormData();
    formData.append('action', action);
    if (fecha_inicio) formData.append('fecha_inicio', fecha_inicio);
    if (fecha_fin) formData.append('fecha_fin', fecha_fin);
    if (ot_numero) formData.append('ot', ot_numero);

    fetch(urlResOts, {
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
        _fetchInforme('generar_pdf', 'resumen_ots.pdf');
    } else {
        _fetchInforme('generar_excel', 'resumen_ots.xlsx');
    }
}

function generarPDFDetalle() {
    const ot_numero = document.getElementById('ot_numero').value;
    if (!ot_numero) {
        Toastify({ text: "Seleccione una OT primero", duration: 3000, gravity: "top", position: "right", style: { background: "#ef4444" } }).showToast();
        return;
    }
    _fetchInforme('generar_pdf_detalle', `detalle_ot_${ot_numero}.pdf`);
}

function abrirModalOT() {
    const formData = new FormData();
    formData.append('action', 'listar_ots');

    fetch(urlResOts, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        const ots = data.ots || [];
        abrirModalBusqueda({
            titulo: 'Buscar Orden de Trabajo',
            columnas: [
                { title: 'N° OT', field: 'numero', width: 80 },
                { title: 'Fecha', field: 'fecha', width: 110 },
                { title: 'Encargado', field: 'encargado' },
                { title: 'Proceso', field: 'proceso' },
                { title: 'Estado', field: 'estado', width: 90 },
            ],
            data: ots,
            filtroCampos: ['numero', 'encargado', 'proceso', 'estado'],
            onSelect: function(row) {
                document.getElementById('ot_numero').value = row.numero;
                document.getElementById('ot_fecha').value = row.fecha;
                document.getElementById('ot_encargado').value = row.encargado;
                document.getElementById('ot_proceso').value = row.proceso;
                cargarDetallesOT(row.numero);
            },
            onRefresh: function(opts) {
                const fd = new FormData();
                fd.append('action', 'listar_ots');
                fetch(urlResOts, {
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
    });
}

function cargarDetallesOT(numero) {
    const formData = new FormData();
    formData.append('action', 'cargar_subformularios');
    formData.append('ot', numero);

    fetch(urlResOts, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (tablaDetalleOT) tablaDetalleOT.setData(data.detalle_ot || []);
        if (tablaValeConsumo) tablaValeConsumo.setData(data.vale_consumo || []);
        if (tablaParteEntrada) tablaParteEntrada.setData(data.parte_entrada || []);
    });
}

let tablaDetalleOT = null;
let tablaValeConsumo = null;
let tablaParteEntrada = null;

function formatearNumero(cell) {
    const val = cell.getValue();
    return Number(val).toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 3});
}

function inicializarTablas() {
    const columnas = [
        { title: "Artículo", field: "codigo", width: 80 },
        { title: "Nombre", field: "nombre", widthGrow: 2 },
        { title: "Cant", field: "cantidad", width: 70, formatter: formatearNumero, halign: "right" },
        { title: "UM", field: "um", width: 50, halign: "center" },
    ];
    
    const opciones = {
        layout: "fitColumns",
        minHeight: 180,
        data: [],
        columns: columnas,
        locale: "es",
        langs: {
            es: {
                pagination: { page_size: "Registros por página" }
            }
        }
    };
    
    tablaDetalleOT = new Tabulator("#tablaDetalleOT", opciones);
    tablaValeConsumo = new Tabulator("#tablaValeConsumo", opciones);
    tablaParteEntrada = new Tabulator("#tablaParteEntrada", opciones);
}

document.addEventListener('DOMContentLoaded', function() {
    const hoy = new Date();
    const hace30 = new Date();
    hace30.setDate(hace30.getDate() - 30);
    document.getElementById('fecha_inicio').value = hace30.toISOString().split('T')[0];
    document.getElementById('fecha_fin').value = hoy.toISOString().split('T')[0];
    
    inicializarTablas();
    
    document.getElementById('ot_numero').addEventListener('change', function() {
        const otNum = this.value.trim();
        if (otNum) {
            buscarOTPorNumero(otNum);
        }
    });
});

function buscarOTPorNumero(numero) {
    const formData = new FormData();
    formData.append('action', 'buscar_ot_por_numero');
    formData.append('ot', numero);

    fetch(urlResOts, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.found) {
            document.getElementById('ot_fecha').value = data.fecha;
            document.getElementById('ot_encargado').value = data.encargado;
            document.getElementById('ot_proceso').value = data.proceso;
            cargarDetallesOT(numero);
        } else {
            Toastify({ text: "OT no encontrada", duration: 3000, gravity: "top", position: "right", style: { background: "#ef4444" } }).showToast();
            document.getElementById('ot_fecha').value = '';
            document.getElementById('ot_encargado').value = '';
            document.getElementById('ot_proceso').value = '';
            limpiarTablas();
        }
    });
}

function limpiarTablas() {
    if (tablaDetalleOT) tablaDetalleOT.setData([]);
    if (tablaValeConsumo) tablaValeConsumo.setData([]);
    if (tablaParteEntrada) tablaParteEntrada.setData([]);
}