import { Op } from "sequelize";
import Cita from "../../models/Cita.js";
import Paciente from "../../models/Paciente.js";
import Usuario from "../../models/Usuario.js";
import Notificacion from "../../models/Notificacion.js";
import EstadoCita from "../../models/EstadoCita.js";
import { ESTADOS_CITA_REPROGRAMABLE } from "../estadosCita.js";
import { obtenerConfig } from "../whatsapp/cloudApi.js";
import { notificar } from "./notificar.js";

const HORA_MS = 60 * 60 * 1000;
const INTERVALO_MS = 5 * 60 * 1000;
const MAX_INTENTOS = 3;

// Ventana en horas antes de la cita en la que se envía cada recordatorio.
// La ventana es más ancha que el intervalo del worker para tolerar retrasos.
const RECORDATORIOS = [
    { evento: "recordatorio_24h", minimo: 22, maximo: 24 },
    { evento: "recordatorio_1h", minimo: 0, maximo: 1 },
];

// Colombia no tiene horario de verano: la hora de la cita siempre es UTC-5.
const instanteCita = (cita) => new Date(`${cita.fecha}T${String(cita.hora).slice(0, 8)}-05:00`);

const yaProcesado = async (cita, evento) => {
    const previas = await Notificacion.findAll({
        where: { cita_id: cita.id_cita, evento, canal: "WhatsApp" },
        attributes: ["estado"],
    });
    if (previas.some((n) => n.estado === "Pendiente" || n.estado === "Enviada")) return true;
    return previas.filter((n) => n.estado === "Error").length >= MAX_INTENTOS;
};

export async function procesarRecordatorios(ahora = new Date()) {
    const cfg = await obtenerConfig();
    if (!cfg?.activo) return 0;

    const limite = new Date(ahora.getTime() + 25 * HORA_MS);
    const citas = await Cita.findAll({
        where: {
            fecha: {
                [Op.between]: [
                    new Date(ahora.getTime() - 24 * HORA_MS).toISOString().slice(0, 10),
                    limite.toISOString().slice(0, 10),
                ],
            },
        },
        include: [
            { model: EstadoCita, as: "Estado", attributes: [], required: true, where: { nombre: { [Op.in]: ESTADOS_CITA_REPROGRAMABLE } } },
            { model: Paciente, required: true, include: [{ model: Usuario, required: true }] },
        ],
    });

    let enviados = 0;
    for (const cita of citas) {
        const horas = (instanteCita(cita) - ahora) / HORA_MS;
        for (const { evento, minimo, maximo } of RECORDATORIOS) {
            if (horas <= minimo || horas > maximo) continue;
            if (await yaProcesado(cita, evento)) continue;
            await notificar(cita.Paciente.Usuario, cita, evento);
            enviados++;
        }
    }
    return enviados;
}

export function iniciarRecordatorios() {
    const ciclo = () => procesarRecordatorios().catch((error) => {
        console.error("Error en el ciclo de recordatorios:", error.message);
    });
    setTimeout(ciclo, 30 * 1000);
    return setInterval(ciclo, INTERVALO_MS);
}
