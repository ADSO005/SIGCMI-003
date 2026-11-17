// Gráfico de citas por estado. Los datos reales llegan desde el servidor
// en el atributo data-estados del canvas y se dibuja al abrir la ventana.
let graficoCreado = false;

window.abrirGraficoEstados = () => {
    document.getElementById('modalGrafico').showModal();

    if (graficoCreado) return;
    graficoCreado = true;

    const canvas = document.getElementById('graficoEstados');
    const estados = JSON.parse(canvas.dataset.estados || '[]');
    const total = estados.reduce((suma, estado) => suma + estado.total, 0);

    if (total === 0) {
        canvas.insertAdjacentHTML(
            'afterend',
            '<p class="py-10 text-center text-sm text-slate-500">Aún no hay citas registradas.</p>'
        );
        canvas.remove();
        return;
    }

    new window.Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: estados.map((estado) => `${estado.nombre} (${estado.total})`),
            datasets: [{
                data: estados.map((estado) => estado.total),
                backgroundColor: estados.map((estado) => estado.color),
                borderWidth: 0,
                hoverOffset: 12
            }]
        },
        options: {
            responsive: true,
            cutout: '72%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20,
                        font: { size: 13, weight: 'bold' }
                    }
                }
            }
        }
    });
};