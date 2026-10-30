// Validaciones sin acceso a la base de datos ni activación del flujo de negocio.
export const diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
export function enteroPositivo(value) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Se requiere un entero positivo');
}
export function enteroPositivoOpcional(value) {
    if (value != null) enteroPositivo(value);
}
export function fechaCalendario(value) {
    if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) throw new Error('Fecha no valida: usa YYYY-MM-DD');
    const date = new Date(value + 'T00:00:00.000Z');
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('Fecha de calendario no valida');
    return date;
}
export function validarSemana(inicio, fin) {
    const first = fechaCalendario(inicio), last = fechaCalendario(fin);
    if (first.getUTCDay() !== 1 || last.getUTCDay() !== 0 || last - first !== 6 * 86400000) {
        throw new Error('La solicitud debe abarcar exactamente una semana de lunes a domingo');
    }
}
export function segundosHorario(value) {
    if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)) throw new Error('Hora no valida');
    const [h, m, s = 0] = value.split(':').map(Number);
    const seconds = h * 3600 + m * 60 + s;
    if (seconds < 7 * 3600 || seconds > 19 * 3600) throw new Error('Las franjas deben estar entre 07:00 y 19:00');
    return seconds;
}
export function validarFranja(value) {
    if (!value || !diasSemana.includes(value.dia_semana)) throw new Error('Dia de la semana no valido');
    if (segundosHorario(value.hora_inicio) >= segundosHorario(value.hora_fin)) throw new Error('El inicio debe ser anterior al final');
}
export function validarFranjas(values) {
    if (!Array.isArray(values) || values.length === 0 || values.length > 200) throw new Error('Se requieren de 1 a 200 franjas');
    const days = new Map();
    for (const value of values) {
        const row = value.get ? value.get({ plain: true }) : value;
        validarFranja(row);
        const intervals = days.get(row.dia_semana) || [];
        intervals.push([segundosHorario(row.hora_inicio), segundosHorario(row.hora_fin)]);
        days.set(row.dia_semana, intervals);
    }
    for (const intervals of days.values()) {
        intervals.sort((a, b) => a[0] - b[0]);
        for (let i = 1; i < intervals.length; i++) {
            if (intervals[i][0] < intervals[i - 1][1]) throw new Error('Hay franjas duplicadas o superpuestas');
        }
    }
}
