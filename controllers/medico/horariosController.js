import db from "../../config/db.js";
import Cita from "../../models/Cita.js";
import { crearServicioHorarios, ErrorHorario, revisionHorarios } from "../../services/medico/horariosService.js";
import { col, fn } from "sequelize";
import Medico from "../../models/Medico.js";
import Horario from "../../models/Horario.js";

// Días de la semana

const diasSemana = [
    "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"
];
// Controlador GET

export const listarHorarios = async (req, res) => {
    if (!req.usuario?.id_usuario) {
        return res.status(401).json({ mensaje: "Sesión inválida" });
    }

    try {
        const medico = await Medico.findOne({
            where: { usuario_id: req.usuario.id_usuario },
            attributes: ["id_medico"]
        });

        if (!medico) {
            return res.status(404).json({ mensaje: "No se encontró el perfil del médico" });
        }

        const horarios = await Horario.findAll({
            where: { medico_id: medico.id_medico },
            attributes: ["id_horario", "dia_semana", "hora_inicio", "hora_fin", "estado", "aprobado_por", "fecha_creacion"],
            order: [
                [fn("FIELD", col("dia_semana"), ...diasSemana), "ASC"],
                ["hora_inicio", "ASC"],
                ["id_horario", "ASC"]
            ]
        });

        return res.json({
            horarios: horarios.map(h => { const { id_horario, dia_semana, hora_inicio, hora_fin, estado } = h; return { id_horario, dia_semana, hora_inicio, hora_fin, estado }; }),
            revision: revisionHorarios(horarios)
        });
    } catch (error) {
        console.error("Error al consultar los horarios del médico:", error);
        return res.status(500).json({ mensaje: "No se pudieron consultar los horarios" });
    }
};

const guardarConfiguracion = crearServicioHorarios({ db, Medico, Horario, Cita });

// Protección temporal: el PUT heredado no incluye las fechas obligatorias de develop.
// Conservar el servicio y su manejo de errores para la sustitución por solicitudes semanales.
const GUARDADO_HEREDADO_HABILITADO = false;

export const guardarHorarios = async (req, res) => {
    if (!GUARDADO_HEREDADO_HABILITADO) {
        return res.status(503).json({
            codigo: "GUARDADO_HORARIOS_NO_DISPONIBLE",
            mensaje: "El guardado de horarios está temporalmente deshabilitado mientras se adapta al sistema de solicitudes semanales. Puedes seguir consultando tus horarios. No se guardaron cambios."
        });
    }
    try {
        const resultado = await guardarConfiguracion(req.usuario?.id_usuario, req.body);
        return res.json({ mensaje: "Horarios guardados correctamente", ...resultado });
    } catch (error) {
        if (error instanceof ErrorHorario) return res.status(error.status).json({ mensaje: error.message });
        console.error("Error al guardar horarios:", error);
        const conflicto = ["SequelizeTimeoutError", "SequelizeUniqueConstraintError", "SequelizeForeignKeyConstraintError"].includes(error.name) ||
            ["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"].includes(error.original?.code);
        return res.status(conflicto ? 409 : 500).json({ mensaje: conflicto ? "Conflicto al guardar. Recarga tus horarios" : "No se pudieron guardar los horarios" });
    }
};
