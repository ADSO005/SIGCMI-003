const test = require("node:test");
const assert = require("node:assert/strict");
const pug = require("pug");

const metrics = { todayTotal: 0, todayCompleted: 0, todayRemaining: 0, progressPercent: 0, monthlyPatients: 0, weeklyAppointments: 0, averageMinutes: null };
const render = dashboardMetrics => pug.renderFile("views/viewsMedico/includes/dashboardMetrics.pug", { dashboardMetrics });

test("las cuatro tarjetas muestran ceros reales, barra vacía y duración no disponible", () => {
    const html = render(metrics);
    assert.equal((html.match(/<article/g) || []).length, 4);
    for (const key of ["todayTotal", "todayCompleted", "todayRemaining", "monthlyPatients", "weeklyAppointments"]) {
        assert(html.includes(`data-metric="${key}">0</p>`));
    }
    assert(html.includes('data-metric="averageMinutes">—</p>'));
    assert.match(html, /Sin datos de duración real/);
    assert.match(html, /aria-valuenow="0"/);
    assert.match(html, /width:0%/);
    assert.match(html, /role="progressbar"/);
});

test("las tarjetas enlazan métricas del backend y el porcentaje de la barra", () => {
    const html = render({ ...metrics, todayTotal: 7, todayCompleted: 2, todayRemaining: 5, progressPercent: 29, monthlyPatients: 13, weeklyAppointments: 21 });
    assert(html.includes('data-metric="todayTotal">7</p>'));
    assert(html.includes('data-metric="monthlyPatients">13</p>'));
    assert(html.includes('data-metric="weeklyAppointments">21</p>'));
    assert.match(html, /aria-valuenow="29"/);
    assert.match(html, /width:29%/);
    assert.match(html, /2 de 7 citas completadas/);
});

test("Pug escapa valores dinámicos y conserva los títulos e iconos accesibles", () => {
    const html = render({ ...metrics, monthlyPatients: '<img src=x onerror="alert(1)">' });
    assert.doesNotMatch(html, /<img/);
    assert.match(html, /&lt;img/);
    for (const title of ["Citas de hoy", "Pacientes atendidos este mes", "Consultas de esta semana", "Tiempo promedio de consulta"]) assert(html.includes(title));
    assert.match(html, /aria-hidden="true"/);
    assert.match(html, /aria-label="Resumen de citas médicas"/);
});
