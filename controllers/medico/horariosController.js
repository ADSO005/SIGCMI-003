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

// Funciones auxiliares

function convertirAMinutos(hora) {
    const [horas, minutos] = hora.split(":").map(Number);
    return horas * 60 + minutos;
}

function descansoValido(finPrimera, inicioSegunda) {
    const fin = convertirAMinutos(finPrimera);
    const inicio = convertirAMinutos(inicioSegunda);

    return inicio - fin >= 30;
}

function horaValida(hora) {
    if (typeof hora !== "string") {
        return false;
    }

    const formato = /^([01]\d|2[0-3]):[0-5]\d$/;

    return formato.test(hora);
}

// Valida que la hora de inicio sea anterior a la hora de fin

function rangoValido(inicio, fin) {
    if (!horaValida(inicio) || !horaValida(fin)) {
        return false;
    }

    return convertirAMinutos(inicio) < convertirAMinutos(fin);
}
