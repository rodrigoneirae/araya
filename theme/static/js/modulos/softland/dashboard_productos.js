const dataEl = document.getElementById('dashboardData');
if (!dataEl) throw new Error('No dashboard data');
const data = JSON.parse(dataEl.textContent);

function getChartDefaults() {
    const isDark = document.documentElement.classList.contains('dark');
    return {
        gridColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        textColor: isDark ? '#aab' : '#5f6c5f',
    };
}

function chartConfig(type, labels, datasets, opts) {
    const { gridColor, textColor } = getChartDefaults();
    const cfg = {
        type,
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: textColor, boxWidth: 12, padding: 12, font: { size: 11 } },
                    position: opts?.legendPos || 'bottom',
                },
            },
        },
    };
    if (type !== 'doughnut') {
        cfg.options.scales = {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } },
            y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } },
        };
    }
    if (opts?.indexAxis) cfg.options.indexAxis = 'y';
    return cfg;
}

function formatMoney(v) {
    return '$' + Number(v).toLocaleString('es-CL', { maximumFractionDigits: 0 });
}

function initChart(id, config) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    return new Chart(canvas.getContext('2d'), config);
}

const charts = [];

// Stock by Warehouse Chart
if (data.bodega_labels?.length) {
    const bodegaColors = ['#4a7c59', '#8a7fb5', '#d4826a', '#6abf8a', '#bf8a6a'];
    charts.push(initChart('chartStockBodega', chartConfig('bar', data.bodega_labels, [{
        label: 'Stock',
        data: data.bodega_data,
        backgroundColor: bodegaColors,
        borderRadius: 3,
    }], {})));
}

// Product Select & Stock Analysis
const selectEl = document.getElementById('productoSelect');
const loader = document.getElementById('analisisLoader');
const resultDiv = document.getElementById('analisisResultado');
const emptyDiv = document.getElementById('analisisEmpty');

if (selectEl && data.productos_selector?.length) {
    data.productos_selector.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.codigo;
        opt.textContent = `${p.codigo} - ${p.nombre}`;
        selectEl.appendChild(opt);
    });

    $(selectEl).select2({
        placeholder: 'Busque y seleccione un producto...',
        language: 'es',
        width: '100%',
        dropdownAutoWidth: true,
    });

    $(selectEl).on('change', async function () {
        const codigo = this.value;
        resultDiv.classList.add('hidden');
        emptyDiv.classList.remove('hidden');
        if (!codigo) {
            emptyDiv.textContent = 'Seleccione un producto para ver su análisis de stock.';
            return;
        }
        emptyDiv.classList.add('hidden');
        loader.classList.remove('hidden');
        try {
            const formData = new FormData();
            formData.set('action', 'analisis_stock');
            formData.set('producto', codigo);
            const res = await window.apiFetch(window.location.pathname, {
                method: 'POST',
                body: formData,
            });
            if (res.success && res.data) {
                renderAnalisis(res.data);
            } else {
                emptyDiv.classList.remove('hidden');
                emptyDiv.textContent = res.error || 'Sin datos de stock.';
            }
        } catch (e) {
            emptyDiv.classList.remove('hidden');
            emptyDiv.textContent = 'Error al cargar análisis.';
        } finally {
            loader.classList.add('hidden');
        }
    });
}

function renderAnalisis(data) {
    document.getElementById('analisisSaldoActual').textContent = Number(data.saldos.actual).toLocaleString('es-CL', { maximumFractionDigits: 0 });
    document.getElementById('analisisSaldo30').textContent = Number(data.saldos.hace_30_dias).toLocaleString('es-CL', { maximumFractionDigits: 0 });
    document.getElementById('analisisSaldo60').textContent = Number(data.saldos.hace_60_dias).toLocaleString('es-CL', { maximumFractionDigits: 0 });
    document.getElementById('analisisSaldo90').textContent = Number(data.saldos.hace_90_dias).toLocaleString('es-CL', { maximumFractionDigits: 0 });

    const tbody = document.getElementById('analisisPeriodos');
    const periodNames = { '90_60': '90-60 días', '60_30': '60-30 días', '30_0': '30-0 días' };
    tbody.innerHTML = '';
    for (const [key, label] of Object.entries(periodNames)) {
        const p = data.periodos[key];
        if (!p) continue;
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-aq-surface-2';
        tr.innerHTML = `
            <td class="px-2 py-1.5 font-medium text-aq-text">${label}</td>
            <td class="px-2 py-1.5 text-right text-green-600 font-medium">${Number(p.ingresos).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</td>
            <td class="px-2 py-1.5 text-right text-red-500 font-medium">${Number(p.egresos).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</td>
            <td class="px-2 py-1.5 text-right font-bold text-aq-text">${Number(p.ventas).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</td>
        `;
        tbody.appendChild(tr);
    }
    emptyDiv.classList.add('hidden');
    resultDiv.classList.remove('hidden');
}

// Tabulator — Product List
const tableEl = document.getElementById('productosTable');
const countEl = document.getElementById('productosCount');
if (tableEl && data.productos_tabla?.length) {
    countEl.textContent = data.productos_tabla.length + ' registros';
    new Tabulator(tableEl, {
        data: data.productos_tabla,
        layout: 'fitColumns',
        height: 450,
        pagination: 'local',
        paginationSize: 15,
        paginationSizeSelector: [15, 30, 50, 100],
        columns: [
            { title: 'Código', field: 'codigo', width: 120, hozAlign: 'left' },
            { title: 'Nombre', field: 'nombre', widthGrow: 3 },
            {
                title: 'Stock', field: 'stock', width: 110, hozAlign: 'right',
                formatter: function (cell) {
                    const v = cell.getValue();
                    const cls = v <= 0 ? 'color:rgb(239,68,68)' : '';
                    return `<span style="${cls}font-weight:600">${Number(v).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>`;
                },
            },
            {
                title: 'Precio Venta', field: 'precio', width: 130, hozAlign: 'right',
                formatter: function (cell) {
                    return `<span style="font-weight:600">${formatMoney(cell.getValue())}</span>`;
                },
            },
            {
                title: 'Costo', field: 'costo', width: 120, hozAlign: 'right',
                formatter: function (cell) {
                    return `<span style="font-weight:600">${formatMoney(cell.getValue())}</span>`;
                },
            },
        ],
    });
}

function updateChartTheme() {
    const { gridColor, textColor } = getChartDefaults();
    charts.forEach(chart => {
        if (chart.options.plugins?.legend?.labels) {
            chart.options.plugins.legend.labels.color = textColor;
        }
        if (chart.options.scales) {
            Object.values(chart.options.scales).forEach(scale => {
                if (scale) {
                    scale.grid.color = gridColor;
                    if (scale.ticks) scale.ticks.color = textColor;
                }
            });
        }
        chart.update('none');
    });
}

const themeObserver = new MutationObserver(() => updateChartTheme());
themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
