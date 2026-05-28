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
    const prevYear = new Date().getFullYear() - 1;
    const monthlyTotalPrev = (data.monthly_afecto_prev || []).map((v, i) => v + ((data.monthly_exento_prev || [])[i] || 0));
    const allValues = [...(data.monthly_afecto || []), ...(data.monthly_exento || []), ...monthlyTotalPrev];
    const maxValue = Math.max(...allValues.filter(v => v > 0), 1);
    const chartConfig = {
        type: 'bar',
        data: {
            labels: data.monthly_labels,
            datasets: [
                {
                    label: 'Afecto ' + new Date().getFullYear(),
                    data: data.monthly_afecto,
                    backgroundColor: '#4a7c59',
                    borderRadius: 3,
                },
                {
                    label: 'Exento ' + new Date().getFullYear(),
                    data: data.monthly_exento,
                    backgroundColor: '#c9842d',
                    borderRadius: 3,
                },
                {
                    label: 'Afecto ' + prevYear,
                    data: data.monthly_afecto_prev,
                    backgroundColor: 'rgba(74, 124, 89, 0.5)',
                    borderRadius: 3,
                },
                {
                    label: 'Exento ' + prevYear,
                    data: data.monthly_exento_prev,
                    backgroundColor: 'rgba(201, 132, 45, 0.5)',
                    borderRadius: 3,
                },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    labels: { color: getChartDefaults().textColor, boxWidth: 12, padding: 12, font: { size: 11 } },
                    position: 'bottom',
                },
            },
            scales: {
                x: { grid: { color: getChartDefaults().gridColor }, ticks: { color: getChartDefaults().textColor, font: { size: 10 } } },
                y: { beginAtZero: true, max: maxValue * 1.15, grid: { color: getChartDefaults().gridColor }, ticks: { color: getChartDefaults().textColor, font: { size: 10 }, callback: function(v) { return '$' + (v/1000000).toFixed(0) + 'M'; } } },
            },
        }
    };
    charts.push(initChart('chartVentasMes', chartConfig));
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
