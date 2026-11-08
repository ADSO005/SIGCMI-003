import test from "node:test";
import assert from "node:assert/strict";
import { calculateDashboardMetrics, dashboardPeriods } from "../../services/medico/dashboardMetricsService.js";

const now = new Date("2026-11-09T17:00:00Z");
const appointment = (id, state, extra = {}) => ({
    id_cita: id, medico_id: 9, paciente_id: id, fecha: "2026-11-09",
    estado_id: id * 17, Estado: { nombre: state }, ...extra
});

test("cero citas produce ceros coherentes, progreso vacío y duración desconocida", () => {
    assert.deepEqual(calculateDashboardMetrics([], 9, now), {
        todayTotal: 0, todayCompleted: 0, todayRemaining: 0, progressPercent: 0,
        monthlyPatients: 0, weeklyAppointments: 0, averageMinutes: null
    });
});

test("los nombres reales de estados determinan los conteos sin depender de sus IDs", () => {
    const rows = ["Completada", "Pendiente", "Confirmada", "En Curso", "Cancelada"].map((state, i) => appointment(i + 1, state));
    const result = calculateDashboardMetrics(rows, 9, now);
    assert.equal(result.todayTotal, 4);
    assert.equal(result.todayCompleted, 1);
    assert.equal(result.todayRemaining, 3);
    assert.equal(result.progressPercent, 25);
    assert.equal(result.weeklyAppointments, 4);
    assert.equal(result.monthlyPatients, 1);
});

test("médicos ajenos y registros duplicados no alteran las métricas propias", () => {
    const row = appointment(1, "Completada");
    const rows = [row, { ...row }, appointment(2, "Pendiente"), appointment(3, "Completada", { medico_id: 10 })];
    const original = structuredClone(rows);
    assert.equal(calculateDashboardMetrics(rows, 9, now).todayTotal, 2);
    assert.equal(calculateDashboardMetrics(rows, 10, now).todayTotal, 1);
    assert.equal(calculateDashboardMetrics(rows, 9, now).monthlyPatients, 1);
    assert.deepEqual(rows, original);
});

test("pacientes atendidos son únicos por médico y mes, no cantidad de consultas", () => {
    const rows = [
        appointment(1, "Completada", { paciente_id: 30, fecha: "2026-11-01" }),
        appointment(2, "Completada", { paciente_id: 30 }),
        appointment(3, "Completada", { paciente_id: 31, fecha: "2026-11-30" }),
        appointment(4, "Completada", { paciente_id: 32, fecha: "2026-10-31" }),
        appointment(5, "Completada", { paciente_id: 33, fecha: "2026-12-01" }),
        appointment(6, "Pendiente", { paciente_id: 34 }),
        appointment(7, "Cancelada", { paciente_id: 35 })
    ];
    assert.equal(calculateDashboardMetrics(rows, 9, now).monthlyPatients, 2);
});

test("progreso se calcula con el total no cancelado, se redondea y puede alcanzar 100", () => {
    const rows = [appointment(1, "Completada"), appointment(2, "Pendiente"), appointment(3, "En Curso"), appointment(4, "Cancelada")];
    assert.equal(calculateDashboardMetrics(rows, 9, now).progressPercent, 33);
    assert.equal(calculateDashboardMetrics([rows[0], rows[3]], 9, now).progressPercent, 100);
    assert.equal(calculateDashboardMetrics([rows[3]], 9, now).progressPercent, 0);
});

test("el cambio de día, mes y año se realiza a medianoche de Bogotá", () => {
    const before = new Date("2027-01-01T04:59:59Z"), after = new Date("2027-01-01T05:00:00Z");
    assert.deepEqual(dashboardPeriods(before), {
        today: "2026-12-31", weekStart: "2026-12-28", weekEnd: "2027-01-03", monthStart: "2026-12-01", monthEnd: "2026-12-31"
    });
    const periods = dashboardPeriods(after);
    assert.equal(periods.today, "2027-01-01");
    assert.equal(periods.monthStart, "2027-01-01");
    assert.equal(periods.monthEnd, "2027-01-31");
    const rows = [appointment(1, "Completada", { fecha: "2026-12-31" }), appointment(2, "Completada", { fecha: "2027-01-01" })];
    assert.equal(calculateDashboardMetrics(rows, 9, before).todayTotal, 1);
    assert.equal(calculateDashboardMetrics(rows, 9, after).todayTotal, 1);
    assert.equal(calculateDashboardMetrics(rows, 9, after).monthlyPatients, 1);
    assert.equal(calculateDashboardMetrics(rows, 9, after).weeklyAppointments, 2);
    assert.equal(dashboardPeriods(new Date("2028-03-01T04:59:59Z")).monthEnd, "2028-02-29");
});

test("semana inclusiva de lunes a domingo cuenta citas pasadas y futuras, sin canceladas", () => {
    const rows = [
        appointment(1, "Completada", { fecha: "2026-11-02" }),
        appointment(2, "Completada", { fecha: "2026-11-08" }),
        appointment(3, "Confirmada", { fecha: "2026-11-09" }),
        appointment(4, "Pendiente", { fecha: "2026-11-15" }),
        appointment(5, "Pendiente", { fecha: "2026-11-16" }),
        appointment(6, "Cancelada", { fecha: "2026-11-10" })
    ];
    assert.equal(calculateDashboardMetrics(rows, 9, new Date("2026-11-09T04:59:59Z")).weeklyAppointments, 2);
    assert.equal(calculateDashboardMetrics(rows, 9, new Date("2026-11-09T05:00:00Z")).weeklyAppointments, 2);
});

test("duración programada y fecha de actualización nunca se usan como duración clínica", () => {
    const rows = [appointment(1, "Completada", { duracion_minutos: 30, descanso_posterior_minutos: 10, fecha_actualizacion: "2026-11-09T18:00:00Z" })];
    assert.equal(calculateDashboardMetrics(rows, 9, now).averageMinutes, null);
});
