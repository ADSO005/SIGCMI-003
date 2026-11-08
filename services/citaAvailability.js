import { Op } from 'sequelize'
import { Cita, EstadoCita, Horario } from '../models/index.js'

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
const estadosQueOcupanHorario = ['Pendiente', 'Confirmada']
export const HORAS_CITA = Object.freeze([
    '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'
])

const horaAMinutos = (valor) => {
    const coincidencia = String(valor || '').match(/^(\d{1,2}):(\d{2})/)
    if (!coincidencia) return NaN
    return Number(coincidencia[1]) * 60 + Number(coincidencia[2])
}

const fechaBogota = (fecha = new Date()) => {
    const partes = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(fecha)
    const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]))
    return `${valores.year}-${valores.month}-${valores.day}`
}

export const consultarHorasDisponiblesCita = async ({
    medicoId,
    fecha,
    pacienteId = null,
    excluirCitaId = null,
    anticipacionHoras = 5
}) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha || ''))) {
        return { horas: [], mensaje: 'Selecciona una fecha válida.' }
    }
    const fechaUTC = new Date(`${fecha}T00:00:00Z`)
    if (Number.isNaN(fechaUTC.getTime()) || fechaUTC.toISOString().slice(0, 10) !== fecha) {
        return { horas: [], mensaje: 'Selecciona una fecha válida.' }
    }
    if (fecha < fechaBogota()) return { horas: [], mensaje: 'No se pueden elegir fechas pasadas.' }

    const horarios = await Horario.findAll({
        where: {
            medico_id: medicoId,
            dia_semana: diasSemana[fechaUTC.getUTCDay()],
            estado: 'Aprobado',
            fecha_inicio: { [Op.lte]: fecha },
            fecha_fin: { [Op.gte]: fecha }
        },
        attributes: ['hora_inicio', 'hora_fin']
    })
    if (!horarios.length) return { horas: [], mensaje: 'El médico no tiene horario aprobado para esa fecha.' }

    const exclusion = excluirCitaId ? { id_cita: { [Op.ne]: excluirCitaId } } : {}
    const citasOcupadas = await Cita.findAll({
        where: { medico_id: medicoId, fecha, ...exclusion },
        include: [{
            model: EstadoCita,
            as: 'Estado',
            attributes: [],
            where: { nombre: { [Op.in]: estadosQueOcupanHorario } }
        }],
        attributes: ['hora']
    })
    const horasOcupadas = new Set(citasOcupadas.map((cita) => String(cita.hora).slice(0, 5)))

    if (pacienteId) {
        const citaPaciente = await Cita.findOne({
            where: { paciente_id: pacienteId, fecha, ...exclusion },
            include: [{
                model: EstadoCita,
                as: 'Estado',
                attributes: [],
                where: { nombre: { [Op.in]: estadosQueOcupanHorario } }
            }],
            attributes: ['id_cita']
        })
        if (citaPaciente) return { horas: [], mensaje: 'Ya tienes otra cita activa para ese día.' }
    }

    const horasDisponibles = new Set()
    const limite = Date.now() + anticipacionHoras * 60 * 60 * 1000
    for (const horario of horarios) {
        const inicio = Math.max(7 * 60, horaAMinutos(horario.hora_inicio))
        const fin = Math.min(19 * 60, horaAMinutos(horario.hora_fin))
        if (!Number.isFinite(inicio) || !Number.isFinite(fin)) continue

        for (const hora of HORAS_CITA) {
            const [horas, minutos] = hora.split(':').map(Number)
            const minuto = horas * 60 + minutos
            if (minuto < inicio || minuto > fin) continue

            const instanteBogota = new Date(`${fecha}T${hora}:00-05:00`).getTime()
            if (!horasOcupadas.has(hora) && instanteBogota >= limite) horasDisponibles.add(hora)
        }
    }

    const horas = [...horasDisponibles].sort()
    return {
        horas,
        mensaje: horas.length ? '' : 'No quedan horas disponibles para ese médico en la fecha seleccionada.'
    }
}
