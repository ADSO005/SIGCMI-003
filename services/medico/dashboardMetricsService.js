const dayMs = 86400000;

// Solo evalúa el tiempo; el controlador comprueba también propietario y estado.
export function canStartAppointmentToday(appointment, now = new Date()) {
    if (appointment.fecha !== dashboardPeriods(now).today) return false;
    const partes = new Intl.DateTimeFormat("en-GB", {
        timeZone: "America/Bogota", hourCycle: "h23",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).formatToParts(now);
    const reloj = Object.fromEntries(partes.map(parte => [parte.type, parte.value]));
    const segundosActuales = Number(reloj.hour) * 3600 + Number(reloj.minute) * 60
        + Number(reloj.second) + now.getUTCMilliseconds() / 1000;
    const hora = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(\.\d{1,6})?$/.exec(appointment.hora);
    const segundosCita = hora ? Number(hora[1]) * 3600 + Number(hora[2]) * 60
        + Number(hora[3]) + Number(hora[4] || 0) : NaN;
    return Number.isFinite(segundosCita) && segundosCita <= segundosActuales;
}

export function nextAppointmentToday(appointments, doctorId, now = new Date()) {
    const { today } = dashboardPeriods(now);
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "America/Bogota", hourCycle: "h23",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).formatToParts(now);
    const clock = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const currentSeconds = Number(clock.hour) * 3600 + Number(clock.minute) * 60
        + Number(clock.second) + now.getUTCMilliseconds() / 1000;
    let next = null, nextSeconds = Infinity;
    for (const appointment of appointments) {
        if (appointment.medico_id !== doctorId || appointment.fecha !== today
            || !["Pendiente", "Confirmada"].includes(appointment.Estado?.nombre)) continue;
        // TIME es una hora civil; no se convierte a Date ni a la zona del servidor.
        const time = /^(\d{2}):([0-5]\d)(?::([0-5]\d)(\.\d+)?)?$/.exec(appointment.hora);
        if (!time || Number(time[1]) > 23) continue;
        const hour = Number(time[1]), minute = Number(time[2]);
        const seconds = hour * 3600 + minute * 60 + Number(time[3] || 0) + Number(time[4] || 0);
        if (seconds <= currentSeconds || seconds >= nextSeconds) continue;
        nextSeconds = seconds;
        const patient = appointment.Paciente?.Usuario;
        next = {
            hora: `${hour % 12 || 12}:${time[2]} ${hour < 12 ? "AM" : "PM"}`,
            paciente: [patient?.nombres, patient?.apellidos].filter(Boolean).join(" ") || "Paciente no disponible",
            motivo: appointment.motivo_consulta?.trim() || "Motivo no registrado"
        };
    }
    return next;
}

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
