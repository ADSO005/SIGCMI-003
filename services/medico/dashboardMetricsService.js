const dayMs = 86400000;

export function dashboardPeriods(now = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(now);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const today = `${values.year}-${values.month}-${values.day}`;
    // UTC se usa solo para aritmética de fechas civiles, después de obtener hoy en Bogotá.
    const date = new Date(`${today}T00:00:00Z`);
    const monday = new Date(date.getTime() - ((date.getUTCDay() + 6) % 7) * dayMs);
    const nextMonth = new Date(date);
    nextMonth.setUTCDate(1);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    const iso = value => value.toISOString().slice(0, 10);
    return {
        today,
        weekStart: iso(monday),
        weekEnd: iso(new Date(monday.getTime() + 6 * dayMs)),
        monthStart: today.slice(0, 7) + "-01",
        monthEnd: iso(new Date(nextMonth.getTime() - dayMs))
    };
}

export function calculateDashboardMetrics(appointments, doctorId, now = new Date()) {
    const periods = dashboardPeriods(now);
    const seen = new Set(), patients = new Set();
    let todayTotal = 0, todayCompleted = 0, weeklyAppointments = 0;
    for (const appointment of appointments) {
        // El controlador filtra en SQL; esta comprobación conserva también el aislamiento del cálculo.
        if (appointment.medico_id !== doctorId || seen.has(appointment.id_cita)) continue;
        seen.add(appointment.id_cita);
        const state = appointment.Estado?.nombre;
        if (state === "Cancelada") continue;
        const date = appointment.fecha;
        if (date === periods.today) {
            todayTotal++;
            if (state === "Completada") todayCompleted++;
        }
        if (date >= periods.weekStart && date <= periods.weekEnd) weeklyAppointments++;
        if (state === "Completada" && date >= periods.monthStart && date <= periods.monthEnd) {
            patients.add(appointment.paciente_id);
        }
    }
    return {
        todayTotal,
        todayCompleted,
        // En Curso y cualquier estado no cancelado ni completado siguen por atender.
        todayRemaining: todayTotal - todayCompleted,
        progressPercent: todayTotal ? Math.round(todayCompleted * 100 / todayTotal) : 0,
        monthlyPatients: patients.size,
        weeklyAppointments,
        // Duración programada y fecha_actualizacion no equivalen a duración clínica real.
        averageMinutes: null
    };
}
