import Usuario from "../../models/Usuario.js";
import Medico from "../../models/Medico.js";
import Especialidad from "../../models/Especialidad.js";
import Horario from "../../models/Horario.js";
import Cita from "../../models/Cita.js";
import EstadoCita from "../../models/EstadoCita.js";
import db from "../../config/db.js";
import { Op } from "sequelize";

// =====================================================
// LISTAR MÉDICOS
// =====================================================

export const listarMedicos = async (req, res) => {

    try {

        const medicos = await Medico.findAll({

            include: [
                {
                    model: Usuario,
                    attributes: [
                        "id_usuario",
                        "nombres",
                        "apellidos",
                        "correo",
                        "telefono",
                        "tipo_documento",
                        "numero_documento",
                        "estado",
                        "fecha_registro"
                    ]
                },
                {
                    model: Especialidad,
                    attributes: [
                        "id_especialidad",
                        "nombre",
                        "descripcion"
                    ]
                },
                {
                    model: Horario,
                    attributes: ["id_horario", "dia_semana", "hora_inicio", "hora_fin", "fecha_inicio", "fecha_fin", "estado"]
                }
            ],

            order: [
                ["id_medico", "DESC"]
            ]

        });

        const medicosLista = medicos.map((medico) => ({

            id: medico.id_medico,

            usuarioId: medico.usuario_id,

            nombre: medico.Usuario
                ? `${medico.Usuario.nombres} ${medico.Usuario.apellidos}`
                : "Sin nombre",

            correo: medico.Usuario?.correo || "",

            telefono: medico.Usuario?.telefono || "",

            tipoDocumento: medico.Usuario?.tipo_documento || "",

            documento: medico.Usuario?.numero_documento || "",

            especialidad: medico.Especialidad?.nombre || "Sin especialidad",

            especialidadId: medico.especialidad_id,

            cedulaProfesional: medico.cedula_profesional || "",

            aniosExperiencia: medico.anios_experiencia ?? "",

            estado: medico.Usuario?.estado ?? false,

            fechaRegistro: medico.Usuario?.fecha_registro || null,

            // Horarios guardados: los usa el editor semanal.
            horarios: (medico.Horarios || []).map((horario) => ({
                id_horario: horario.id_horario,
                dia_semana: horario.dia_semana,
                hora_inicio: horario.hora_inicio,
                hora_fin: horario.hora_fin,
                fecha_inicio: horario.fecha_inicio,
                fecha_fin: horario.fecha_fin,
                estado: horario.estado
            }))

        }));

        const totalMedicos = medicosLista.length;

        const medicosActivos = medicosLista.filter(
            medico => medico.estado === true
        ).length;

        const medicosInactivos = medicosLista.filter(
            medico => medico.estado === false
        ).length;

        const especialidades = await Especialidad.findAll({
            attributes: [
                "id_especialidad",
                "nombre"
            ],
            order: [
                ["nombre", "ASC"]
            ]
        });

        res.render("viewsAdmin/medicos/index", {

            usuarios: req.usuario,

            medicosLista,

            totalMedicos,

            medicosActivos,

            medicosInactivos,

            especialidades

        });

    } catch (error) {

        console.error(
            "Error al listar médicos:",
            error
        );

        res.status(500).send(
            "Error al cargar la gestión de médicos."
        );
    }
};

// =====================================================
// OBTENER MÉDICO
// =====================================================

export const obtenerMedico = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({
                ok: false,
                mensaje: "El ID del médico no es válido."
            });
        }

        const medico = await Medico.findByPk(id, {
            include: [
                {
                    model: Usuario,
                    attributes: [
                        "id_usuario",
                        "nombres",
                        "apellidos",
                        "correo",
                        "telefono",
                        "tipo_documento",
                        "numero_documento",
                        "estado",
                        "fecha_registro"
                    ]
                },
                {
                    model: Especialidad,
                    attributes: [
                        "id_especialidad",
                        "nombre",
                        "descripcion"
                    ]
                },
                {
                    model: Horario,
                    attributes: [
                        "id_horario",
                        "dia_semana",
                        "fecha_inicio",
                        "fecha_fin",
                        "hora_inicio",
                        "hora_fin",
                        "estado",
                        "fecha_creacion"
                    ],
                    order: [
                        ["id_horario", "ASC"]
                    ]
                }
            ]
        });

        if (!medico) {
            return res.status(404).json({
                ok: false,
                mensaje: "Médico no encontrado."
            });
        }

        return res.json({
            ok: true,
            medico
        });

    } catch (error) {
        console.error("Error al obtener médico:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error al obtener el médico."
        });
    }
};

export const crearHorariosMedico = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            fecha_inicio,
            fecha_fin,
            horarios
        } = req.body;

        // ============================================
        // VALIDAR ID
        // ============================================

        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({
                ok: false,
                mensaje: "El ID del médico no es válido."
            });
        }

        // ============================================
        // VALIDAR CAMPOS PRINCIPALES
        // ============================================

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                ok: false,
                mensaje: "Las fechas son obligatorias."
            });
        }

        if (!Array.isArray(horarios) || horarios.length === 0) {
            return res.status(400).json({
                ok: false,
                mensaje: "Selecciona al menos un día de atención."
            });
        }

        // ============================================
        // VALIDAR FECHAS
        // ============================================

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const fechaInicioObj = new Date(
            `${fecha_inicio}T00:00:00`
        );

        const fechaFinObj = new Date(
            `${fecha_fin}T00:00:00`
        );

        if (
            Number.isNaN(fechaInicioObj.getTime()) ||
            Number.isNaN(fechaFinObj.getTime())
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Las fechas proporcionadas no son válidas."
            });
        }

        if (fechaInicioObj <= hoy) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "La fecha de inicio debe ser posterior a la fecha actual."
            });
        }

        if (fechaFinObj < fechaInicioObj) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "La fecha final no puede ser anterior a la fecha inicial."
            });
        }

        // ============================================
        // VALIDAR QUE SEA LUNES A DOMINGO
        // ============================================

        const diaInicio = fechaInicioObj.getDay();
        const diaFin = fechaFinObj.getDay();

        const diferenciaDias =
            Math.round(
                (fechaFinObj - fechaInicioObj) /
                (1000 * 60 * 60 * 24)
            );

        if (diaInicio !== 1) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "La fecha de inicio debe ser un lunes."
            });
        }

        if (diaFin !== 0) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "La fecha de finalización debe ser un domingo."
            });
        }

        if (diferenciaDias !== 6) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El período debe tener exactamente 7 días, de lunes a domingo."
            });
        }

        // ============================================
        // VALIDAR MÉDICO
        // ============================================

        const medico = await Medico.findByPk(id);

        if (!medico) {
            return res.status(404).json({
                ok: false,
                mensaje: "Médico no encontrado."
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
        // VALIDAR CADA HORARIO
        // ============================================

        for (const horario of horarios) {

            const {
                dia_semana,
                hora_inicio,
                hora_fin
            } = horario;

            // Validar día
            if (!diasValidos.includes(dia_semana)) {
                return res.status(400).json({
                    ok: false,
                    mensaje:
                        `El día "${dia_semana}" no es válido.`
                });
            }

            // Validar horas
            if (!hora_inicio || !hora_fin) {
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
                return res.status(400).json({
                    ok: false,
                    mensaje:
                        `La hora de finalización del ${dia_semana} debe estar entre las 07:00 y las 19:00.`
                });
            }

            // Hora final > hora inicial
            if (hora_fin <= hora_inicio) {
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

        const diasSeleccionados = horarios.map(
            (horario) => horario.dia_semana
        );

        const diasUnicos = new Set(diasSeleccionados);

        if (diasUnicos.size !== diasSeleccionados.length) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "No puedes registrar el mismo día más de una vez."
            });
        }

        // ============================================
        // EVITAR DUPLICADOS
        // ============================================

        const horariosExistentes = await Horario.findAll({
            where: {
                medico_id: medico.id_medico,
                fecha_inicio,
                fecha_fin
            }
        });

        // Revisar si alguno de los días ya existe
        const diasExistentes = horariosExistentes.map(
            (horario) => horario.dia_semana
        );

        const diasDuplicados = horarios.filter(
            (horario) =>
                diasExistentes.includes(horario.dia_semana)
        );

        if (diasDuplicados.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje:
                    `Ya existe un horario registrado para: ${diasDuplicados
                        .map((h) => h.dia_semana)
                        .join(", ")}.`
            });
        }

        // ============================================
        // CREAR HORARIOS
        // ============================================

        const horariosCreados = [];

        for (const horarioData of horarios) {

            const horario = await Horario.create({
                medico_id: medico.id_medico,
                dia_semana: horarioData.dia_semana,
                fecha_inicio,
                fecha_fin,
                hora_inicio: horarioData.hora_inicio,
                hora_fin: horarioData.hora_fin,
                estado: "Aprobado",
                aprobado_por: req.usuario.id_usuario
            });

            horariosCreados.push(horario);
        }

        // ============================================
        // RESPUESTA
        // ============================================

        return res.status(201).json({
            ok: true,
            mensaje: "Horario registrado correctamente.",
            horarios: horariosCreados
        });

    } catch (error) {

        console.error(
            "Error al crear horarios del médico:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje: "Error al registrar el horario."
        });
    }
};

// =====================================================
// GUARDAR AGENDA SEMANAL (rejilla por horas)
// =====================================================

const DIAS_AGENDA = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
const HORA_APERTURA = 7;
const HORA_CIERRE = 19;
const ESTADOS_SIN_CITA_ACTIVA = ["Cancelada", "Cerrada sin finalizar"];

const aTextoFecha = (fecha) =>
    `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

const aTextoHora = (hora) => `${String(hora).padStart(2, "0")}:00`;

// Convierte las horas abiertas de un día en bloques continuos: [8, 9, 10, 14] => 08:00-11:00 y 14:00-15:00.
const agruparHoras = (horas) => {
    const bloques = [];
    for (const hora of horas) {
        const ultimo = bloques[bloques.length - 1];
        if (ultimo && ultimo.fin === hora) ultimo.fin = hora + 1;
        else bloques.push({ inicio: hora, fin: hora + 1 });
    }
    return bloques;
};

export const guardarSemanaMedico = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha_inicio, fecha_fin, dias } = req.body ?? {};

        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({ ok: false, mensaje: "El ID del médico no es válido." });
        }

        // ============================================
        // VALIDAR LA SEMANA (lunes a domingo)
        // ============================================

        const inicio = new Date(`${fecha_inicio}T00:00:00`);
        const fin = new Date(`${fecha_fin}T00:00:00`);

        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha_inicio)) || !/^\d{4}-\d{2}-\d{2}$/.test(String(fecha_fin))
            || Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
            return res.status(400).json({ ok: false, mensaje: "Las fechas proporcionadas no son válidas." });
        }

        const diferenciaDias = Math.round((fin - inicio) / (1000 * 60 * 60 * 24));
        if (inicio.getDay() !== 1 || fin.getDay() !== 0 || diferenciaDias !== 6
            || aTextoFecha(inicio) !== fecha_inicio || aTextoFecha(fin) !== fecha_fin) {
            return res.status(400).json({ ok: false, mensaje: "La agenda debe ir de lunes a domingo." });
        }

        const hoy = aTextoFecha(new Date());
        if (fecha_fin < hoy) {
            return res.status(400).json({ ok: false, mensaje: "No se puede modificar una semana que ya terminó." });
        }

        // ============================================
        // VALIDAR LAS HORAS DE CADA DÍA
        // ============================================

        if (!dias || typeof dias !== "object" || Array.isArray(dias)) {
            return res.status(400).json({ ok: false, mensaje: "No se recibieron los días de la agenda." });
        }

        const horasPorDia = new Map();

        for (const [dia, horas] of Object.entries(dias)) {
            const indice = DIAS_AGENDA.indexOf(dia);
            if (indice === -1) {
                return res.status(400).json({ ok: false, mensaje: `El día "${dia}" no es válido.` });
            }

            if (!Array.isArray(horas) || horas.some((h) => !Number.isInteger(h) || h < HORA_APERTURA || h >= HORA_CIERRE)) {
                return res.status(400).json({
                    ok: false,
                    mensaje: `Las horas de ${dia} deben estar entre las ${aTextoHora(HORA_APERTURA)} y las ${aTextoHora(HORA_CIERRE)}.`
                });
            }

            const fechaDia = new Date(inicio);
            fechaDia.setDate(inicio.getDate() + indice);

            // Los días que ya pasaron no se modifican.
            if (aTextoFecha(fechaDia) < hoy) continue;

            horasPorDia.set(dia, {
                fecha: aTextoFecha(fechaDia),
                horas: [...new Set(horas)].sort((a, b) => a - b)
            });
        }

        const medico = await Medico.findByPk(id);
        if (!medico) {
            return res.status(404).json({ ok: false, mensaje: "Médico no encontrado." });
        }

        // ============================================
        // NO CERRAR HORAS CON CITAS ACTIVAS
        // ============================================

        const estadosInactivos = await EstadoCita.findAll({
            where: { nombre: ESTADOS_SIN_CITA_ACTIVA },
            attributes: ["id_estado"]
        });

        const citas = await Cita.findAll({
            where: {
                medico_id: medico.id_medico,
                fecha: { [Op.between]: [fecha_inicio, fecha_fin] },
                estado_id: { [Op.notIn]: estadosInactivos.map((estado) => estado.id_estado) }
            },
            attributes: ["fecha", "hora", "duracion_minutos"]
        });

        const conflictos = [];

        for (const [dia, { fecha, horas }] of horasPorDia) {
            for (const cita of citas.filter((c) => c.fecha === fecha)) {
                const [h, m] = String(cita.hora).split(":").map(Number);
                const minutoInicio = h * 60 + m;
                const minutoFin = minutoInicio + (cita.duracion_minutos || 30);
                const horasNecesarias = [];
                for (let hora = Math.floor(minutoInicio / 60); hora < Math.ceil(minutoFin / 60); hora++) horasNecesarias.push(hora);

                if (horasNecesarias.some((hora) => !horas.includes(hora))) {
                    conflictos.push(`${dia} ${String(cita.hora).slice(0, 5)}`);
                }
            }
        }

        if (conflictos.length > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: `Hay citas agendadas en horas que intentas cerrar: ${conflictos.slice(0, 5).join(", ")}${conflictos.length > 5 ? "…" : ""}.`
            });
        }

        // ============================================
        // REEMPLAZAR LOS BLOQUES DE LA SEMANA
        // ============================================

        await db.transaction(async (transaction) => {
            await Horario.destroy({
                where: {
                    medico_id: medico.id_medico,
                    fecha_inicio,
                    fecha_fin,
                    dia_semana: { [Op.in]: [...horasPorDia.keys()] }
                },
                transaction
            });

            const filas = [];
            for (const [dia, { horas }] of horasPorDia) {
                for (const bloque of agruparHoras(horas)) {
                    filas.push({
                        medico_id: medico.id_medico,
                        dia_semana: dia,
                        fecha_inicio,
                        fecha_fin,
                        hora_inicio: aTextoHora(bloque.inicio),
                        hora_fin: aTextoHora(bloque.fin),
                        estado: "Aprobado",
                        aprobado_por: req.usuario.id_usuario
                    });
                }
            }

            if (filas.length > 0) await Horario.bulkCreate(filas, { transaction });
        });

        const horarios = await Horario.findAll({
            where: { medico_id: medico.id_medico, fecha_inicio, fecha_fin },
            order: [["hora_inicio", "ASC"]]
        });

        return res.json({ ok: true, mensaje: "Agenda guardada correctamente.", horarios });

    } catch (error) {
        console.error("Error al guardar la agenda semanal:", error);
        return res.status(500).json({ ok: false, mensaje: "Error al guardar la agenda." });
    }
};
