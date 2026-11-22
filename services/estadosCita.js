import { Op } from "sequelize";
import { EstadoCita } from "../models/index.js";

// Una cita "activa" es la que sigue ocupando la agenda del médico y el día del paciente.
// Las canceladas, completadas y cerradas sin finalizar no cuentan: su hora y su fecha quedan libres.
export const ESTADOS_CITA_ACTIVA = ["Pendiente", "Confirmada", "En Curso"];

export const ESTADOS_CITA_REPROGRAMABLE = ["Pendiente", "Confirmada"];

// Para usar dentro de `include` de una consulta sobre Cita: deja solo las citas activas.
export const soloCitasActivas = () => ({
    model: EstadoCita,
    as: "Estado",
    attributes: [],
    required: true,
    where: { nombre: { [Op.in]: ESTADOS_CITA_ACTIVA } }
});
