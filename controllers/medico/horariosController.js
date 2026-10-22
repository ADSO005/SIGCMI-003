import { col, fn } from "sequelize";
import Medico from "../../models/Medico.js";
import Horario from "../../models/Horario.js";

const diasSemana = [
    "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"
];

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
            attributes: ["id_horario", "dia_semana", "hora_inicio", "hora_fin", "estado"],
            order: [
                [fn("FIELD", col("dia_semana"), ...diasSemana), "ASC"],
                ["hora_inicio", "ASC"],
                ["id_horario", "ASC"]
            ]
        });

        return res.json({ horarios });
    } catch (error) {
        console.error("Error al consultar los horarios del médico:", error);
        return res.status(500).json({ mensaje: "No se pudieron consultar los horarios" });
    }
};
