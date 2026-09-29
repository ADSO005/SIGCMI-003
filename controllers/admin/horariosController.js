import Horario from "../../models/Horario.js";
import Medico from "../../models/Medico.js";
import Usuario from "../../models/Usuario.js";
import Especialidad from "../../models/Especialidad.js";
import db from "../../config/db.js";

export const listarHorarios = async (req, res) => {
    try {
        const medicosDB = await Medico.findAll({
            include: [
                {
                    model: Usuario,
                    attributes: [
                        "id_usuario",
                        "nombres",
                        "apellidos",
                        "estado"
                    ]
                },
                {
                    model: Especialidad,
                    attributes: [
                        "id_especialidad",
                        "nombre"
                    ]
                },
                {
                    model: Horario,
                    required: false,
                    attributes: [
                        "id_horario",
                        "dia_semana",
                        "hora_inicio",
                        "hora_fin",
                        "fecha_inicio",
                        "fecha_fin",
                        "estado"
                    ]
                }
            ],
            order: [
                [Usuario, "nombres", "ASC"]
            ]
        });

        const medicos = medicosDB.map((medico) => ({
            id_medico: medico.id_medico,

            nombre: medico.Usuario
                ? `${medico.Usuario.nombres} ${medico.Usuario.apellidos}`
                : "Médico sin nombre",

            especialidad: medico.Especialidad
                ? medico.Especialidad.nombre
                : "Sin especialidad",

            estado: medico.Usuario
                ? medico.Usuario.estado
                : false,

            horarios: medico.Horarios
                ? medico.Horarios.map((horario) => ({
                    id_horario: horario.id_horario,
                    dia_semana: horario.dia_semana,
                    hora_inicio: horario.hora_inicio,
                    hora_fin: horario.hora_fin,
                    fecha_inicio: horario.fecha_inicio,
                    fecha_fin: horario.fecha_fin,
                    estado: horario.estado
                }))
                : []
        }));

        res.render("viewsAdmin/horarios/index", {
            medicos,
            usuarios: req.usuario
        });

    } catch (error) {

        console.error("Error al listar horarios:", error);

        res.status(500).send("Error al cargar los horarios");
    }
};

// ==========================================================
// ACTUALIZAR HORARIO
// ==========================================================

export const actualizarHorario = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            fecha_inicio,
            fecha_fin,
            dia_semana,
            hora_inicio,
            hora_fin
        } = req.body;

        // Validar ID
        if (!id || isNaN(id)) {
            return res.status(400).json({
                ok: false,
                mensaje: "El ID del horario no es válido."
            });
        }

        // Buscar horario
        const horario = await Horario.findByPk(id);

        if (!horario) {
            return res.status(404).json({
                ok: false,
                mensaje: "No se encontró el horario."
            });
        }

        // Validar campos
        if (
            !fecha_inicio ||
            !fecha_fin ||
            !dia_semana ||
            !hora_inicio ||
            !hora_fin
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Todos los campos son obligatorios."
            });
        }

        // Validar fechas
        const inicio = new Date(`${fecha_inicio}T00:00:00`);
        const fin = new Date(`${fecha_fin}T00:00:00`);

        if (fin < inicio) {
            return res.status(400).json({
                ok: false,
                mensaje: "La fecha final no puede ser anterior a la fecha inicial."
            });
        }

        // Validar horas
        if (hora_inicio < "07:00" || hora_inicio > "19:00") {
            return res.status(400).json({
                ok: false,
                mensaje: "La hora de inicio debe estar entre 07:00 y 19:00."
            });
        }

        if (hora_fin < "07:00" || hora_fin > "19:00") {
            return res.status(400).json({
                ok: false,
                mensaje: "La hora de finalización debe estar entre 07:00 y 19:00."
            });
        }

        if (hora_fin <= hora_inicio) {
            return res.status(400).json({
                ok: false,
                mensaje: "La hora de finalización debe ser posterior a la hora de inicio."
            });
        }

        // Validar día
        const diasValidos = [
            "Lunes",
            "Martes",
            "Miercoles",
            "Jueves",
            "Viernes",
            "Sabado",
            "Domingo"
        ];

        if (!diasValidos.includes(dia_semana)) {
            return res.status(400).json({
                ok: false,
                mensaje: "El día seleccionado no es válido."
            });
        }

        // Actualizar
        await horario.update({
            fecha_inicio,
            fecha_fin,
            dia_semana,
            hora_inicio,
            hora_fin
        });

        return res.json({
            ok: true,
            mensaje: "Horario actualizado correctamente.",
            horario
        });

    } catch (error) {

        console.error(
            "Error al actualizar horario:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje: "Error interno al actualizar el horario."
        });
    }
};


// ==========================================================
// ACTUALIZAR PERÍODO COMPLETO
// ==========================================================

export const actualizarPeriodoHorario = async (req, res) => {

    const transaction = await db.transaction();

    try {

        const {
            ids,
            fecha_inicio,
            fecha_fin,
            horarios
        } = req.body;

        // ============================================
        // VALIDAR IDS
        // ============================================

        if (
            !Array.isArray(ids) ||
            ids.length === 0
        ) {
            await transaction.rollback();

            return res.status(400).json({
                ok: false,
                mensaje:
                    "No se recibieron horarios para actualizar."
            });
        }

        const idsNumericos = ids
            .map(Number)
            .filter((id) => Number.isInteger(id));

        if (
            idsNumericos.length !== ids.length
        ) {
            await transaction.rollback();

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Los IDs de los horarios no son válidos."
            });
        }

        // ============================================
        // VALIDAR CAMPOS
        // ============================================

        if (!fecha_inicio || !fecha_fin) {
            await transaction.rollback();

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Las fechas son obligatorias."
            });
        }

        if (
            !Array.isArray(horarios) ||
            horarios.length === 0
        ) {
            await transaction.rollback();

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Selecciona al menos un día de atención."
            });
        }

        // ============================================
        // VALIDAR FECHAS
        // ============================================

        const inicio =
            new Date(`${fecha_inicio}T00:00:00`);

        const fin =
            new Date(`${fecha_fin}T00:00:00`);

        if (
            Number.isNaN(inicio.getTime()) ||
            Number.isNaN(fin.getTime())
        ) {
            await transaction.rollback();

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Las fechas proporcionadas no son válidas."
            });
        }

        // ============================================
        // VALIDAR LUNES → DOMINGO
        // ============================================

        const diaInicio = inicio.getDay();
        const diaFin = fin.getDay();

        const diferenciaDias =
            Math.round(
                (fin - inicio) /
                (1000 * 60 * 60 * 24)
            );

        if (diaInicio !== 1) {
            await transaction.rollback();

            return res.status(400).json({
                ok: false,
                mensaje:
                    "La fecha de inicio debe ser un lunes."
            });
        }

        if (diaFin !== 0) {
            await transaction.rollback();

            return res.status(400).json({
                ok: false,
                mensaje:
                    "La fecha de finalización debe ser un domingo."
            });
        }

        if (diferenciaDias !== 6) {
            await transaction.rollback();

            return res.status(400).json({
                ok: false,
                mensaje:
                    "El período debe tener exactamente 7 días, de lunes a domingo."
            });
        }

        // ============================================
        // DÍAS VÁLIDOS
        // ============================================

        const diasValidos = [
            "Lunes",
            "Martes",
            "Miercoles",
            "Jueves",
            "Viernes",
            "Sabado",
            "Domingo"
        ];

        // ============================================
        // VALIDAR HORARIOS
        // ============================================

        for (const horario of horarios) {

            const {
                dia_semana,
                hora_inicio,
                hora_fin
            } = horario;

            // Día válido
            if (!diasValidos.includes(dia_semana)) {

                await transaction.rollback();

                return res.status(400).json({
                    ok: false,
                    mensaje:
                        `El día "${dia_semana}" no es válido.`
                });
            }

            // Horas obligatorias
            if (!hora_inicio || !hora_fin) {

                await transaction.rollback();

                return res.status(400).json({
                    ok: false,
                    mensaje:
                        `Debes indicar la hora de inicio y finalización para ${dia_semana}.`
                });
            }

            // Hora inicio
            if (
                hora_inicio < "07:00" ||
                hora_inicio > "19:00"
            ) {

                await transaction.rollback();

                return res.status(400).json({
                    ok: false,
                    mensaje:
                        `La hora de inicio del ${dia_semana} debe estar entre las 07:00 y las 19:00.`
                });
            }

            // Hora fin
            if (
                hora_fin < "07:00" ||
                hora_fin > "19:00"
            ) {

                await transaction.rollback();

                return res.status(400).json({
                    ok: false,
                    mensaje:
                        `La hora de finalización del ${dia_semana} debe estar entre las 07:00 y las 19:00.`
                });
            }

            // Fin > inicio
            if (hora_fin <= hora_inicio) {

                await transaction.rollback();

                return res.status(400).json({
                    ok: false,
                    mensaje:
                        `La hora de finalización debe ser posterior a la hora de inicio para ${dia_semana}.`
                });
            }
        }

        // ============================================
        // EVITAR DÍAS REPETIDOS
        // ============================================

        const diasSeleccionados =
            horarios.map(
                (horario) => horario.dia_semana
            );

        const diasUnicos =
            new Set(diasSeleccionados);

        if (
            diasUnicos.size !==
            diasSeleccionados.length
        ) {

            await transaction.rollback();

            return res.status(400).json({
                ok: false,
                mensaje:
                    "No puedes registrar el mismo día más de una vez."
            });
        }

        // ============================================
        // BUSCAR HORARIOS ACTUALES
        // ============================================

        const horariosActuales =
            await Horario.findAll({
                where: {
                    id_horario: idsNumericos
                },
                transaction
            });

        if (
            horariosActuales.length !==
            idsNumericos.length
        ) {

            await transaction.rollback();

            return res.status(404).json({
                ok: false,
                mensaje:
                    "Uno o más horarios no fueron encontrados."
            });
        }

        // ============================================
        // OBTENER DATOS DEL PERÍODO
        // ============================================

        const medicoId =
            horariosActuales[0].medico_id;

        const estado =
            horariosActuales[0].estado;

        const aprobadoPor =
            horariosActuales[0].aprobado_por;

        // ============================================
        // ELIMINAR HORARIOS ANTERIORES
        // ============================================

        await Horario.destroy({
            where: {
                id_horario: idsNumericos
            },
            transaction
        });

        // ============================================
        // CREAR NUEVOS HORARIOS
        // ============================================

        const nuevosHorarios =
            horarios.map((horario) => ({
                medico_id: medicoId,
                dia_semana: horario.dia_semana,
                hora_inicio: horario.hora_inicio,
                hora_fin: horario.hora_fin,
                fecha_inicio,
                fecha_fin,
                estado,
                aprobado_por: aprobadoPor
            }));

        await Horario.bulkCreate(
            nuevosHorarios,
            { transaction }
        );

        // ============================================
        // CONFIRMAR
        // ============================================

        await transaction.commit();

        return res.status(200).json({
            ok: true,
            mensaje:
                "Período de horario actualizado correctamente.",
            actualizados:
                nuevosHorarios.length
        });

    } catch (error) {

        await transaction.rollback();

        console.error(
            "Error al actualizar período:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "Error interno al actualizar el período."
        });
    }
};

// ==========================================================
// ELIMINAR HORARIO
// ==========================================================

export const eliminarHorario = async (req, res) => {

    try {

        const { ids } = req.body;

        if (
            !Array.isArray(ids) ||
            ids.length === 0
        ) {

            return res.status(400).json({
                ok: false,
                mensaje: "No se recibieron horarios para eliminar."
            });

        }

        const idsNumericos = ids.map(Number);

        if (
            idsNumericos.some(
                (id) => !Number.isInteger(id)
            )
        ) {

            return res.status(400).json({
                ok: false,
                mensaje: "Los IDs de los horarios no son válidos."
            });

        }

        const horariosEliminados =
            await Horario.destroy({
                where: {
                    id_horario: idsNumericos
                }
            });

        if (horariosEliminados === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: "No se encontraron los horarios."
            });

        }

        return res.status(200).json({
            ok: true,
            mensaje: "Período eliminado correctamente.",
            eliminados: horariosEliminados
        });

    } catch (error) {

        console.error(
            "Error al eliminar período:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje: "Error interno al eliminar el período."
        });

    }

};