const ctx = document.getElementById('graficoEstados');

            new Chart(ctx, {
                type: 'doughnut',

                data: {
                    labels: [
                        'Pendientes',
                        'En Curso',
                        'Completadas',
                        'Canceladas'
                    ],

                    datasets: [{
                        data: [10, 3, 18, 2],

                        backgroundColor: [
                            '#3B82F6',
                            '#F59E0B',
                            '#10B981',
                            '#EF4444'
                        ],

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
                                font: {
                                    size: 13,
                                    weight: 'bold'
                                }
                            }
                        }
                    }
                }
            });