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
    charts.push(initChart('chartVentasMes', chartConfig('bar', data.monthly_labels, [
        { label: 'Ventas Netas', data: data.monthly_neto, backgroundColor: '#4a7c59', borderRadius: 3 },
    ], {})));
}

if (data.cliente_labels?.length) {
    charts.push(initChart('chartTopVendedores', chartConfig('bar', data.cliente_labels, [{
        label: 'Neto',
        data: data.cliente_neto,
        backgroundColor: 'rgba(74, 124, 89, 0.7)',
        borderColor: 'rgb(74, 124, 89)',
        borderWidth: 1,
        borderRadius: 3,
    }], { indexAxis: 'y' })));
}

if (data.prod_labels?.length) {
    const shortLabels = data.prod_labels.map(l => l.length > 28 ? l.substring(0, 25) + '...' : l);
    charts.push(initChart('chartTopProductos', chartConfig('bar', shortLabels, [{
        label: 'Neto',
        data: data.prod_neto,
        backgroundColor: 'rgba(201, 132, 45, 0.7)',
        borderColor: 'rgb(201, 132, 45)',
        borderWidth: 1,
        borderRadius: 3,
    }], {
        indexAxis: 'y',
        plugins: { tooltip: { callbacks: { label: ctx => `${data.prod_labels[ctx.dataIndex]}: ${formatMoney(ctx.raw)}` } } },
    })));
}

if (data.marca_labels?.length) {
    const colors = [
        '#4a7c59', '#c9842d', '#5b8fa8', '#8a7fb5',
        '#d4826a', '#6abf8a', '#bf6a8a', '#8abf6a',
    ];
    charts.push(initChart('chartVentasMarca', chartConfig('doughnut', data.marca_labels, [{
        data: data.marca_neto,
        backgroundColor: data.marca_labels.map((_, i) => colors[i % colors.length]),
        borderWidth: 2,
        borderColor: getChartDefaults().gridColor.replace('0.08', '0.3'),
    }], { legendPos: 'right' })));
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

// Tabulator — Recent Sales
const recentEl = document.getElementById('recentSalesTable');
const countEl = document.getElementById('recentSalesCount');
if (recentEl && data.recent_sales?.length) {
    countEl.textContent = data.recent_sales.length + ' registros';
    new Tabulator(recentEl, {
        data: data.recent_sales,
        layout: 'fitColumns',
        height: 300,
        pagination: 'local',
        paginationSize: 10,
        paginationSizeSelector: [10, 25, 50],
        columns: [
            { title: 'Folio', field: 'folio', width: 120, hozAlign: 'left' },
            { title: 'Fecha', field: 'fecha', width: 110, hozAlign: 'center' },
            { title: 'Cliente', field: 'cliente', widthGrow: 3 },
            { title: 'Vendedor', field: 'vendedor', widthGrow: 2 },
            {
                title: 'Neto', field: 'neto', width: 130, hozAlign: 'right',
                formatter: function (cell) {
                    const v = cell.getValue();
                    return `<span style="font-weight:600">$${Number(v).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>`;
                },
            },
        ],
    });
}

const themeObserver = new MutationObserver(() => updateChartTheme());
themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
