const urlAux = (document.currentScript?.dataset.url) || '/';
let tablaAux = null;

function buscarXHRAux(action, datos, callback) {
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
    fetch(urlAux, {
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
        Toastify({text: 'Error: ' + err.message, style: {background: '#f44336'}}).showToast();
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('auxFechaDesde').value = hoy;
    document.getElementById('auxFechaCorte').value = hoy;

    document.getElementById('auxArtCod')?.addEventListener('change', function() {
        buscarArticulo();
    });
    document.getElementById('auxFechaDesde')?.addEventListener('change', function(e) {
       consultar();
    });
       document.getElementById('auxFechaCorte')?.addEventListener('change', function(e) {
      consultar();
    });
});

function setSpan(id, val) {
    document.getElementById(id).textContent = val || '\u00a0';
}

function buscarArticulo() {
    const cod = document.getElementById('auxArtCod').value.trim();
    if (!cod) return;
    buscarXHRAux('buscar_articulo', {codigo: cod}, function(data) {
        if (data.success) {
            setSpan('auxArtNombre', data.data.nombre);
            setSpan('auxArtUM', data.data.um);
            consultar();
        } else {
            setSpan('auxArtNombre', '');
            setSpan('auxArtUM', '');
            Toastify({text: 'Artículo no encontrado', style: {background: '#f44336'}}).showToast();
        }
    });
}

function abrirListaArticulos() {
    buscarXHRAux('listar_articulos', {}, function(data) {
        window.listaArticulosAux = data.articulos || [];
        document.getElementById('modalArticulos').classList.remove('hidden');
        document.getElementById('filtroArticulos').value = '';
        renderizarListaArticulos(window.listaArticulosAux);
    });
}

function cerrarListaArticulos() {
    document.getElementById('modalArticulos').classList.add('hidden');
}

function renderizarListaArticulos(lista) {
    const tbody = document.getElementById('tablaListaArticulos');
    tbody.innerHTML = '';
    lista.forEach(a => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2 cursor-pointer';
        tr.onclick = function() {
            document.getElementById('auxArtCod').value = a.codigo;
            setSpan('auxArtNombre', a.descr);
            setSpan('auxArtUM', a.um);
            cerrarListaArticulos();
            consultar();
        };
        tr.innerHTML = `
            <td class="px-3 py-2 text-aq-text">${a.codigo}</td>
            <td class="px-3 py-2 text-aq-text">${a.descr || ''}</td>
            <td class="px-3 py-2 text-aq-text">${a.um || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarArticulos() {
    const filtro = document.getElementById('filtroArticulos').value.toLowerCase();
    const filtradas = window.listaArticulosAux.filter(a =>
        (a.codigo && a.codigo.toString().toLowerCase().includes(filtro)) ||
        (a.descr && a.descr.toLowerCase().includes(filtro))
    );
    renderizarListaArticulos(filtradas);
}

function actualizarResumen(data, saldoFinal) {

    let totalEntradas = 0;
    let totalSalidas = 0;

    data.forEach(m => {

        if (m.signo > 0) {
            totalEntradas += Number(m.cantidad) || 0;
        }

        if (m.signo < 0) {
            totalSalidas += Number(m.cantidad) || 0;
        }
    });

    const formatoCL = (valor) => {

        return Number(valor || 0).toLocaleString('es-CL', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    document.getElementById('resumenTotalEntradas').textContent =
        formatoCL(totalEntradas);

    document.getElementById('resumenTotalSalidas').textContent =
        formatoCL(totalSalidas);

    document.getElementById('resumenRegistros').textContent =
        data.length.toLocaleString('es-CL');

    document.getElementById('resumenSaldoFinal').textContent =
        formatoCL(saldoFinal);

    document.getElementById('resumenAux').classList.remove('hidden');
}

function generarPDF() {
    const codigo = document.getElementById('auxArtCod').value.trim();
    if (!codigo) {
        Toastify({text: 'Ingrese un código de artículo', style: {background: '#f44336'}}).showToast();
        return;
    }
    const fecha_desde = document.getElementById('auxFechaDesde').value;
    const fecha_corte = document.getElementById('auxFechaCorte').value;
   const saldo_ant =
    document.getElementById('resumenSaldoFinal')
    .textContent
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();

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
    formData.append('action', 'generar_pdf');
    formData.append('codigo', codigo);
    formData.append('fecha_desde', fecha_desde);
    formData.append('fecha_corte', fecha_corte);
    formData.append('saldo_ant', saldo_ant);

    fetch(urlAux, { method: 'POST', body: formData })
    .then(res => {
        if (!res.ok) throw new Error('Error al generar PDF');
        return res.blob();
    })
    .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `aux_existencia_${codigo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    })
    .catch(err => {
        console.error('Error:', err);
        Toastify({text: 'Error al generar PDF: ' + err.message, style: {background: '#f44336'}}).showToast();
    });
}

function generarEXCEL() {
    const codigo = document.getElementById('auxArtCod').value.trim();
    if (!codigo) {
        Toastify({text: 'Ingrese un código de artículo', style: {background: '#f44336'}}).showToast();
        return;
    }
    const fecha_desde = document.getElementById('auxFechaDesde').value;
    const fecha_corte = document.getElementById('auxFechaCorte').value;
    const saldo_ant =
     document.getElementById('resumenSaldoFinal')
     .textContent
     .replace(/\./g, '')
     .replace(',', '.')
     .trim();

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
    formData.append('action', 'generar_excel');
    formData.append('codigo', codigo);
    formData.append('fecha_desde', fecha_desde);
    formData.append('fecha_corte', fecha_corte);
    formData.append('saldo_ant', saldo_ant);

    fetch(urlAux, { method: 'POST', body: formData })
    .then(res => {
        if (!res.ok) throw new Error('Error al generar Excel');
        return res.blob();
    })
    .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `aux_existencia_${codigo}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    })
    .catch(err => {
        console.error('Error:', err);
        Toastify({text: 'Error al generar Excel: ' + err.message, style: {background: '#f44336'}}).showToast();
    });
}

function consultar() {

    const codigo = document.getElementById('auxArtCod').value.trim();

    if (!codigo) {
        Toastify({
            text: 'Ingrese un código de artículo',
            style: {background: '#f44336'}
        }).showToast();

        return;
    }

    const fecha_desde = document.getElementById('auxFechaDesde').value;
    const fecha_corte = document.getElementById('auxFechaCorte').value;

    buscarXHRAux('consultar', {
        codigo: codigo,
        fecha_desde: fecha_desde,
        fecha_corte: fecha_corte

    }, function(data) {

        if (data.success) {

            if (tablaAux) {
                tablaAux.destroy();
                tablaAux = null;
            }

            if (data.data.length === 0) {

                document
                    .getElementById('resumenAux')
                    .classList.add('hidden');

                return;
            }

            setSpan('auxArtNombre', data.data[0].descr);

            const tableData = data.data.map(m => ({
                ...m,
            }));

            // CALCULAR SALDO FINAL
            let saldoFinal = 0;

            tableData.forEach(m => {
                saldoFinal += Number(m.cantidad) || 0;
            });

            // PONER EL MISMO SALDO FINAL EN TODAS LAS FILAS
            tableData.forEach(m => {
                m.saldo = saldoFinal;
            });

            tablaAux = new Tabulator("#auxDetalle", {

                data: tableData,

                layout: "fitColumns",

                height: "100%",

                pagination: true,

                paginationSize: 10,

                paginationSizeSelector: [10, 20, 50, 100],

                columns: [

                    {
                        title: "Codigo",
                        field: "codigo",
                        widthGrow: 2
                    },

                    {
                        title: "Descr",
                        field: "descr",
                        widthGrow: 4
                    },

                    {
                        title: "Fecha",
                        field: "fecha",
                        widthGrow: 2
                    },

                    {
                        title: "Numero",
                        field: "numero",
                        widthGrow: 2
                    },

                    {
                        title: "Bodega",
                        field: "bodega",
                        widthGrow: 3
                    },

                    {
                        title: "Cantidad",
                        field: "cantidad",
                        hozAlign: "right",
                        widthGrow: 2,

                        formatter: function(cell) {

                            const val = cell.getValue();

                            if (val === null || val === undefined) {
                                return '';
                            }

                            return Number(val).toLocaleString('es-CL', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            });
                        },
                    },

                    {
                        title: "Saldo",
                        field: "saldo",
                        hozAlign: "right",
                        widthGrow: 2,

                        formatter: function(cell) {

                            const val = cell.getValue();

                            if (val === null || val === undefined) {
                                return '';
                            }

                            return Number(val).toLocaleString('es-CL', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            });
                        },
                    },

                    {
                        title: "Tipo",
                        field: "tipo",
                        widthGrow: 3
                    },
                ],

                placeholder: "Sin movimientos para el período seleccionado",
            });

            actualizarResumen(data.data, saldoFinal);

        } else {

            Toastify({
                text: data.message,
                style: {background: '#f44336'}
            }).showToast();
        }
    });
}
