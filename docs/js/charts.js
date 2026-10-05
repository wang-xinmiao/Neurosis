/* ===== NeuroViz 图表可视化模块 ===== */

class ChartManager {
    constructor() {
        this.charts = {};
        this.resizeHandler = null;
    }

    initHeatmap(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (this.charts[containerId]) this.charts[containerId].dispose();

        const chart = echarts.init(container, null, {
            devicePixelRatio: window.devicePixelRatio || 1,
        });
        this.charts[containerId] = chart;

        const networks = YEO7_NETWORKS;
        const matrix = generateConnectivityMatrix(networks);
        const data = [];
        const maxVal = Math.max(...matrix.flat());

        for (let i = 0; i < networks.length; i++) {
            for (let j = 0; j < networks.length; j++) {
                data.push([j, i, matrix[i][j]]);
            }
        }

        const option = {
            tooltip: {
                position: 'top',
                formatter: (params) => {
                    const i = params.value[0], j = params.value[1];
                    return `<strong>${networks[i].name}</strong><br/>↔ <strong>${networks[j].name}</strong><br/>连接强度: ${params.value[2].toFixed(2)}`;
                },
            },
            grid: { left: 120, right: 60, top: 20, bottom: 100 },
            xAxis: {
                type: 'category',
                data: networks.map(n => n.name),
                splitArea: { show: true },
                axisLabel: { rotate: 45, fontSize: 10, color: '#607D8B' },
            },
            yAxis: {
                type: 'category',
                data: networks.map(n => n.name),
                splitArea: { show: true },
                axisLabel: { fontSize: 10, color: '#607D8B' },
            },
            visualMap: {
                min: 0,
                max: maxVal,
                calculable: true,
                orient: 'vertical',
                right: 10,
                top: 'center',
                inRange: { color: ['#E0F7FA', '#00BCD4', '#0097A7', '#006064'] },
                textStyle: { color: '#607D8B', fontSize: 10 },
            },
            series: [{
                name: '功能连接',
                type: 'heatmap',
                data: data,
                label: {
                    show: true,
                    fontSize: 9,
                    color: '#fff',
                    formatter: (p) => p.value[2].toFixed(2),
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 188, 212, 0.5)',
                    },
                },
            }],
        };

        chart.setOption(option);
        return chart;
    }

    initChord(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (this.charts[containerId]) this.charts[containerId].dispose();

        const chart = echarts.init(container);
        this.charts[containerId] = chart;

        const networks = YEO7_NETWORKS;
        const matrix = generateConnectivityMatrix(networks);
        // 转换为无向连接（取上三角）
        const links = [];
        for (let i = 0; i < networks.length; i++) {
            for (let j = i + 1; j < networks.length; j++) {
                if (matrix[i][j] > 0.2) {
                    links.push({
                        source: networks[i].name,
                        target: networks[j].name,
                        value: matrix[i][j],
                        lineStyle: {
                            color: networks[i].color,
                            opacity: matrix[i][j],
                            curveness: 0.3,
                        },
                    });
                }
            }
        }

        const option = {
            tooltip: {
                formatter: (params) => {
                    if (params.dataType === 'edge') {
                        return `${params.data.source} ↔ ${params.data.target}<br/>连接强度: ${params.data.value.toFixed(2)}`;
                    }
                    return `${params.name}`;
                },
            },
            series: [{
                type: 'graph',
                layout: 'circular',
                circular: { rotateLabel: true },
                roam: true,
                draggable: false,
                data: networks.map(n => ({
                    name: n.name,
                    symbolSize: 35,
                    itemStyle: { color: n.color },
                    label: { show: true, fontSize: 10, color: '#2C3E50' },
                })),
                links: links,
                lineStyle: {
                    opacity: 0.5,
                    width: 2,
                    curveness: 0.3,
                },
                emphasis: {
                    focus: 'adjacency',
                    lineStyle: { width: 4 },
                },
            }],
        };

        chart.setOption(option);
        return chart;
    }

    initCircular(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (this.charts[containerId]) this.charts[containerId].dispose();

        const chart = echarts.init(container);
        this.charts[containerId] = chart;

        const networks = YEO7_NETWORKS;
        const matrix = generateConnectivityMatrix(networks);

        // 构建和弦图数据
        const nodes = networks.map(n => ({
            name: n.name,
            itemStyle: { color: n.color },
        }));

        const links = [];
        for (let i = 0; i < networks.length; i++) {
            for (let j = i + 1; j < networks.length; j++) {
                if (matrix[i][j] > 0.15) {
                    links.push({
                        source: i,
                        target: j,
                        value: matrix[i][j],
                    });
                }
            }
        }

        const option = {
            tooltip: {
                formatter: (params) => {
                    if (params.dataType === 'edge') {
                        return `${nodes[params.data.source].name} ↔ ${nodes[params.data.target].name}<br/>强度: ${params.data.value.toFixed(2)}`;
                    }
                    return params.name;
                },
            },
            legend: {
                data: networks.map(n => n.name),
                orient: 'vertical',
                right: 10,
                top: 'center',
                textStyle: { fontSize: 10, color: '#607D8B' },
            },
            series: [{
                type: 'graph',
                layout: 'circular',
                circular: { rotateLabel: true },
                roam: true,
                data: nodes,
                links: links.map(l => ({
                    ...l,
                    lineStyle: {
                        color: 'source',
                        curveness: 0.3,
                        opacity: l.value * 1.2,
                        width: l.value * 5,
                    },
                })),
                lineStyle: {
                    opacity: 0.5,
                    curveness: 0.3,
                },
                emphasis: {
                    focus: 'adjacency',
                    lineStyle: { width: 5 },
                },
            }],
        };

        chart.setOption(option);
        return chart;
    }

    initComparisonChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (this.charts[containerId]) this.charts[containerId].dispose();

        const chart = echarts.init(container);
        this.charts[containerId] = chart;

        const zScores = generateZScores();

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: (params) => {
                    let html = `<strong>${params[0].name}</strong><br/>`;
                    params.forEach(p => {
                        const color = p.value >= 0 ? '#e53935' : '#1E88E5';
                        html += `<span style="color:${color}">${p.seriesName}: ${p.value > 0 ? '+' : ''}${p.value.toFixed(2)} σ</span><br/>`;
                    });
                    return html;
                },
            },
            legend: {
                data: ['皮层厚度 Z-score', '体积 Z-score', '表面积 Z-score'],
                bottom: 0,
                textStyle: { fontSize: 10, color: '#607D8B' },
            },
            grid: { left: 80, right: 30, top: 10, bottom: 40 },
            xAxis: {
                type: 'value',
                name: 'Z-score',
                min: -3,
                max: 3,
                splitLine: { lineStyle: { color: '#E0E6ED' } },
                axisLabel: { fontSize: 10, color: '#607D8B' },
            },
            yAxis: {
                type: 'category',
                data: zScores.map(z => z.name).reverse(),
                axisLabel: { fontSize: 10, color: '#2C3E50' },
            },
            series: [
                {
                    name: '皮层厚度 Z-score',
                    type: 'bar',
                    data: zScores.map(z => z.thickness).reverse(),
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: '#00BCD4' },
                            { offset: 1, color: '#0097A7' },
                        ]),
                        borderRadius: [0, 3, 3, 0],
                    },
                    barGap: '10%',
                },
                {
                    name: '体积 Z-score',
                    type: 'bar',
                    data: zScores.map(z => z.volume).reverse(),
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: '#4ECDC4' },
                            { offset: 1, color: '#2db5ac' },
                        ]),
                        borderRadius: [0, 3, 3, 0],
                    },
                },
                {
                    name: '表面积 Z-score',
                    type: 'bar',
                    data: zScores.map(z => z.area).reverse(),
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: '#FFE66D' },
                            { offset: 1, color: '#f5d442' },
                        ]),
                        borderRadius: [0, 3, 3, 0],
                    },
                },
            ],
        };

        chart.setOption(option);
        return chart;
    }

    initNetworkStats(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const networks = YEO7_NETWORKS;
        const totalRegions = networks.reduce((s, n) => s + n.regions, 0);

        let html = '';
        networks.forEach(n => {
            const pct = ((n.regions / totalRegions) * 100).toFixed(1);
            html += `
                <div class="stat-row">
                    <div>
                        <span class="stat-label" style="color:${n.color};font-weight:500;">● ${n.name}</span>
                    </div>
                    <span class="stat-value">${n.regions} 区</span>
                </div>
                <div class="stat-bar">
                    <div class="stat-bar-fill" style="width:${pct}%;background:${n.color};"></div>
                </div>
            `;
        });
        html += `
            <div class="stat-row" style="margin-top:8px;font-weight:600;">
                <span class="stat-label">总计</span>
                <span class="stat-value">${totalRegions} 个功能区</span>
            </div>
        `;

        container.innerHTML = html;
    }

    resizeAll() {
        Object.values(this.charts).forEach(chart => {
            if (chart && !chart.isDisposed()) {
                chart.resize();
            }
        });
    }

    dispose() {
        Object.values(this.charts).forEach(chart => {
            if (chart && !chart.isDisposed()) {
                chart.dispose();
            }
        });
        this.charts = {};
    }
}
