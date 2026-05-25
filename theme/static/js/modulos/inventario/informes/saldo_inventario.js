const urlSaldo = (document.currentScript?.dataset.url) || '/';

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
    fetch(urlSaldo, {
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
    document.getElementById('salFechaCorte').value = hoy;
    document.getElementById('salFechaCorteGlobal').value = hoy;

    document.getElementById('salArtCod')?.addEventListener('change', function() {
        buscarArticulo();
    });

    cargarTipos();
});

function cambiarTab(tab) {
    const btnInd = document.getElementById('btnTabInd');
    const btnGlob = document.getElementById('btnTabGlob');
    const tabInd = document.getElementById('tabIndividual');
    const tabGlob = document.getElementById('tabGlobal');

    if (tab === 'individual') {
        btnInd.className = 'px-4 py-3 text-sm font-semibold text-aq-primary border-b-2 border-aq-primary';
        btnGlob.className = 'px-4 py-3 text-sm text-aq-text/60 hover:text-aq-text border-b-2 border-transparent';
        tabInd.classList.remove('hidden');
        tabGlob.classList.add('hidden');
    } else {
        btnGlob.className = 'px-4 py-3 text-sm font-semibold text-aq-primary border-b-2 border-aq-primary';
        btnInd.className = 'px-4 py-3 text-sm text-aq-text/60 hover:text-aq-text border-b-2 border-transparent';
        tabGlob.classList.remove('hidden');
        tabInd.classList.add('hidden');
    }
}

function mostrarSpinner() {
    document.getElementById('spinnerInforme').classList.remove('hidden');
}

function ocultarSpinner() {
    document.getElementById('spinnerInforme').classList.add('hidden');
}

function _fetchYSumar(formdata, filename) {
    mostrarSpinner();
    return fetch(urlSaldo, { method: 'POST', body: formdata })
    .then(res => {
        console.log('Response status:', res.status);
        console.log('Content-Type:', res.headers.get('content-type'));
        if (!res.ok) throw new Error('Error HTTP ' + res.status);
        return res.blob();
    })
    .then(blob => {
        console.log('Blob size:', blob.size, 'Blob type:', blob.type);
        ocultarSpinner();
        if (typeof window.downloadBlobTauri === 'function') {
            window.downloadBlobTauri(blob, filename);
        } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    })
    .catch(err => {
        ocultarSpinner();
        console.error('Error:', err);
        Toastify({text: 'Error al generar informe: ' + err.message, style: {background: '#f44336'}}).showToast();
    });
}

function cargarTipos() {
    buscarXHR('listar_tipos', {}, function(data) {
        const sel = document.getElementById('salTipo');
        sel.innerHTML = '<option value="">Todos los tipos</option>';
        (data.tipos || []).forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.nombre;
            sel.appendChild(opt);
        });
    });
}

function setSpan(id, val) {
    document.getElementById(id).textContent = val || '\u00a0';
}

function buscarArticulo() {
    const cod = document.getElementById('salArtCod').value.trim();
    if (!cod) return;
    buscarXHR('buscar_articulo', {codigo: cod}, function(data) {
        if (data.success) {
            setSpan('salArtNombre', data.data.nombre);
            setSpan('salArtUM', data.data.um);
        } else {
            setSpan('salArtNombre', '');
            setSpan('salArtUM', '');
            Toastify({text: 'Artículo no encontrado', style: {background: '#f44336'}}).showToast();
        }
    });
}

function abrirListaArticulos() {
    buscarXHR('listar_articulos', {}, function(data) {
        abrirModalBusqueda({
            titulo: 'Buscar Artículo',
            columnas: [
                { title: 'Código', field: 'codigo', width: 100 },
                { title: 'Nombre', field: 'descr' },
                { title: 'UM', field: 'um', width: 80 },
            ],
            data: data.articulos || [],
            filtroCampos: ['codigo', 'descr'],
            onSelect: function(row) {
                document.getElementById('salArtCod').value = row.codigo;
                setSpan('salArtNombre', row.descr);
                setSpan('salArtUM', row.um);
            },
            onRefresh: function(opts) {
                buscarXHR('listar_articulos', {}, function(data) {
                    opts.data = data.articulos || [];
                    abrirModalBusqueda(opts);
                });
            },
        });
    });
}

function _getFormData(action) {
    const codigo = document.getElementById('salArtCod').value.trim();
    if (!codigo) {
        Toastify({text: 'Ingrese un código de artículo', style: {background: '#f44336'}}).showToast();
        return null;
    }
    const fecha_corte = document.getElementById('salFechaCorte').value;

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

    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    formData.append('action', action);
    formData.append('codigo', codigo);
    formData.append('fecha_corte', fecha_corte);
    return formData;
}

function generarPDF() {
    const formData = _getFormData('generar_pdf');
    if (!formData) return;
    const codigo = document.getElementById('salArtCod').value.trim();
    _fetchYSumar(formData, `saldo_inventario_${codigo}.pdf`);
}

function generarEXCEL() {
    const formData = _getFormData('generar_excel');
    if (!formData) return;
    const codigo = document.getElementById('salArtCod').value.trim();
    _fetchYSumar(formData, `saldo_inventario_${codigo}.xlsx`);
}

function _getFormDataGlobal(action) {
    const fecha_corte = document.getElementById('salFechaCorteGlobal').value;
    const tipoEl = document.getElementById('salTipo');
    const tipo = (tipoEl && tipoEl.value && tipoEl.value !== 'undefined') ? tipoEl.value : '';
    const solo_con_stock = document.getElementById('salSoloStock').checked;

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

    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
    formData.append('action', action);
    formData.append('fecha_corte', fecha_corte);
    formData.append('tipo', tipo);
    formData.append('solo_con_stock', solo_con_stock);
    return formData;
}

function generarPDFGlobal() {
    const formData = _getFormDataGlobal('generar_pdf_global');
    if (!formData) return;
    _fetchYSumar(formData, 'saldo_inventario_global.pdf');
}

function generarEXCELGlobal() {
    const formData = _getFormDataGlobal('generar_excel_global');
    if (!formData) return;
    _fetchYSumar(formData, 'saldo_inventario_global.xlsx');
}
