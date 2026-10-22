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

export const guardarHorarios = async (req, res) => {
    try {
        const { horarios } = req.body ?? {};

        if (!Array.isArray(horarios)) {
            return res.status(400).json({
                mensaje: "Los horarios deben enviarse como un arreglo"
            });
        }
        for (const horario of horarios) {

            if (!horario || typeof horario !== "object" || Array.isArray(horario)) {
                return res.status(400).json({
                    mensaje: "Cada horario debe ser un objeto válido"
                });
            }

            if (!diasSemana.includes(horario.dia_semana)) {
                return res.status(400).json({
                    mensaje: "El día de la semana no es válido"
                });
            }

            if (!rangoValido(horario.hora_inicio, horario.hora_fin)) {
                return res.status(400).json({
                    mensaje: "El rango de horas no es válido"
                });
            }
        }
        for (let i = 0; i < horarios.length; i++) {
            for (let j = i + 1; j < horarios.length; j++) {

                const primero = horarios[i];
                const segundo = horarios[j];

                if (
                    primero.dia_semana === segundo.dia_semana &&
                    horariosSolapados(primero, segundo)
                ) {
                    return res.status(400).json({
                        mensaje: "Existen franjas horarias superpuestas"
                    });
                }
            }
        }
                return res.status(501).json({
                    mensaje: "El guardado de horarios todavía no está implementado"
                });

    } catch (error) {
        console.error("Error al guardar horarios:", error);

        return res.status(500).json({
            mensaje: "Ocurrió un error al procesar los horarios"
        });
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

function horariosSolapados(primero, segundo) {
    const inicioPrimero = convertirAMinutos(primero.hora_inicio);
    const finPrimero = convertirAMinutos(primero.hora_fin);

    const inicioSegundo = convertirAMinutos(segundo.hora_inicio);
    const finSegundo = convertirAMinutos(segundo.hora_fin);

    return inicioPrimero < finSegundo && inicioSegundo < finPrimero;
}