// Valores definidos en el servidor; el cliente no puede cambiarlos mediante una petición.
export const configuracionAgenda = Object.freeze({
    duracionConsultaMinutos: 30,
    descansoPosteriorMinutos: 0,
});

// Se permiten solicitudes para la semana actual y las futuras, según la fecha de Bogotá.
export function permitirSemanaActualYFuturas({ fecha_inicio, ahora = new Date() }) {
    if (!(ahora instanceof Date) || Number.isNaN(ahora.getTime())) throw new TypeError('Reloj no valido');
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(ahora).map(p => [p.type, p.value]));
    const today = new Date(parts.year + '-' + parts.month + '-' + parts.day + 'T00:00:00.000Z');
    const offset = (today.getUTCDay() + 6) % 7;
    today.setUTCDate(today.getUTCDate() - offset);
    return fecha_inicio >= today.toISOString().slice(0, 10);
}
