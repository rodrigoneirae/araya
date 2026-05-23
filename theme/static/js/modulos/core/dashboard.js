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

if (data.monthly_labels?.length) {
    charts.push(initChart('chartMonthlyProd', chartConfig('bar', data.monthly_labels, [
        { label: 'OT Abierto', data: data.ot_abierto_count, backgroundColor: '#4a7c59', borderRadius: 3 },
        { label: 'OT Cerrado', data: data.ot_cerrado_count, backgroundColor: '#2d4a36', borderRadius: 3 },
    ], {})));
}

// Stock table via Tabulator
const selBodega = document.getElementById('selectBodega');
const stockBuscar = document.getElementById('stockBuscar');
const tWrap = document.getElementById('stockTableWrap');
const empty = document.getElementById('stockEmpty');
const loader = document.getElementById('stockLoader');

let stockTable = null;

if (selBodega && data.bodegas_opciones?.length) {
    data.bodegas_opciones.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.cod;
        opt.textContent = b.nombre;
        selBodega.appendChild(opt);
    });

    selBodega.value = data.bodega_default || 1;

    async function cargarStock(cod) {
        empty.classList.add('hidden');
        tWrap.classList.add('hidden');
        if (!cod) return;
        loader.classList.remove('hidden');
        try {
            const formData = new FormData();
            formData.set('action', 'stock_articulos');
            formData.set('bodega', cod);
            const res = await window.apiFetch(window.location.pathname, {
                method: 'POST',
                body: formData,
            });
            if (res.success && res.articulos?.length) {
                stockBuscar.disabled = false;
                stockBuscar.value = '';
                if (stockTable) {
                    stockTable.replaceData(res.articulos);
                    stockTable.clearFilter();
                } else {
                    stockTable = new Tabulator(tWrap, {
                        data: res.articulos,
                        layout: 'fitColumns',
                        height: 280,
                        pagination: 'local',
                        paginationSize: 10,
                        paginationSizeSelector: [10, 25, 50],
                        columns: [
                            { title: 'Código', field: 'codigo', width: 100, hozAlign: 'left' },
                            { title: 'Artículo', field: 'nombre', widthGrow: 3 },
                            { title: 'UM', field: 'um', width: 60, hozAlign: 'right' },
                            {
                                title: 'Saldo', field: 'saldo', width: 100, hozAlign: 'right',
                                formatter: function (cell) {
                                    const v = cell.getValue();
                                    const cls = v < 0 ? 'color:rgb(239,68,68)' : '';
                                    return `<span style="${cls}font-weight:600">${Number(v).toLocaleString('es-CL')}</span>`;
                                },
                            },
                        ],
                    });
                }
                tWrap.classList.remove('hidden');
            } else {
                empty.textContent = 'Sin artículos con stock en esta bodega.';
                empty.classList.remove('hidden');
            }
        } catch (e) {
            empty.textContent = 'Error al cargar stock.';
            empty.classList.remove('hidden');
        } finally {
            loader.classList.add('hidden');
        }
    }

    cargarStock(selBodega.value);
    selBodega.addEventListener('change', function () {
        cargarStock(this.value);
    });

    let filterTimer;
    stockBuscar.addEventListener('input', function () {
        clearTimeout(filterTimer);
        filterTimer = setTimeout(() => {
            if (stockTable) {
                const val = this.value.trim();
                if (val) {
                    stockTable.setFilter([
                        { field: 'codigo', type: 'like', value: val },
                        { field: 'nombre', type: 'like', value: val },
                    ]);
                } else {
                    stockTable.clearFilter();
                }
            }
        }, 250);
    });
}

// Chart 3: Horizontal bar — top encargados
if (data.enc_labels?.length) {
    charts.push(initChart('chartEncargados', chartConfig('bar', data.enc_labels, [{
        label: 'Documentos',
        data: data.enc_counts,
        backgroundColor: 'rgba(74, 124, 89, 0.7)',
        borderColor: 'rgb(74, 124, 89)',
        borderWidth: 1,
        borderRadius: 3,
    }], {
        indexAxis: 'y',
        plugins: {
            tooltip: {
                callbacks: {
                    label: ctx => `${ctx.raw} docs (${formatMoney(data.enc_netos[ctx.dataIndex])})`,
                },
            },
        },
    })));
}

if (data.vc_prod_labels?.length) {
    const shortLabels = data.vc_prod_labels.map(l => l.length > 28 ? l.substring(0, 25) + '...' : l);
    charts.push(initChart('chartVCProducts', chartConfig('bar', shortLabels, [{
        label: 'Cantidad',
        data: data.vc_prod_qty,
        backgroundColor: 'rgba(201, 132, 45, 0.7)',
        borderColor: 'rgb(201, 132, 45)',
        borderWidth: 1,
        borderRadius: 3,
    }], {
        indexAxis: 'y',
        plugins: { tooltip: { callbacks: { label: ctx => `${data.vc_prod_labels[ctx.dataIndex]}: ${ctx.raw}` } } },
    })));
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
