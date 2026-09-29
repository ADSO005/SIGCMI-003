import Usuario from "../../models/Usuario.js";
import Medico from "../../models/Medico.js";
import Especialidad from "../../models/Especialidad.js";
import Horario from "../../models/Horario.js";

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

            fechaRegistro: medico.Usuario?.fecha_registro || null

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

// =====================================================
// ACTUALIZAR MÉDICO
// =====================================================

export const actualizarMedico = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({
                ok: false,
                mensaje: "El ID del médico no es válido."
            });
        }

        const {
            nombres,
            apellidos,
            correo,
            telefono,
            tipo_documento,
            numero_documento,
            especialidad_id,
            cedula_profesional,
            anios_experiencia,
            estado
        } = req.body;

        // ---------------------------------------------
        // Validaciones básicas
        // ---------------------------------------------

        if (
            !nombres?.trim() ||
            !apellidos?.trim() ||
            !correo?.trim() ||
            !tipo_documento?.trim() ||
            !numero_documento?.trim() ||
            !especialidad_id ||
            !cedula_profesional?.trim()
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Completa todos los campos obligatorios."
            });
        }

        // ---------------------------------------------
        // Buscar médico
        // ---------------------------------------------

        const medico = await Medico.findByPk(id);

        if (!medico) {
            return res.status(404).json({
                ok: false,
                mensaje: "Médico no encontrado."
            });
        }

        // ---------------------------------------------
        // Buscar usuario relacionado
        // ---------------------------------------------

        const usuario = await Usuario.findByPk(medico.usuario_id);

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                mensaje: "El usuario asociado al médico no existe."
            });
        }

        // ---------------------------------------------
        // Verificar especialidad
        // ---------------------------------------------

        const especialidad = await Especialidad.findByPk(
            especialidad_id
        );

        if (!especialidad) {
            return res.status(400).json({
                ok: false,
                mensaje: "La especialidad seleccionada no existe."
            });
        }

        // ---------------------------------------------
        // Verificar correo duplicado
        // ---------------------------------------------

        const correoExistente = await Usuario.findOne({
            where: {
                correo: correo.trim()
            }
        });

        if (
            correoExistente &&
            correoExistente.id_usuario !== usuario.id_usuario
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "El correo electrónico ya está registrado."
            });
        }

        // ---------------------------------------------
        // Verificar documento duplicado
        // ---------------------------------------------

        const documentoExistente = await Usuario.findOne({
            where: {
                numero_documento: numero_documento.trim()
            }
        });

        if (
            documentoExistente &&
            documentoExistente.id_usuario !== usuario.id_usuario
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "El número de documento ya está registrado."
            });
        }

        // ---------------------------------------------
        // Verificar cédula profesional duplicada
        // ---------------------------------------------

        const cedulaExistente = await Medico.findOne({
            where: {
                cedula_profesional: cedula_profesional.trim()
            }
        });

        if (
            cedulaExistente &&
            cedulaExistente.id_medico !== medico.id_medico
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "La cédula profesional ya está registrada."
            });
        }

        // ---------------------------------------------
        // Actualizar usuario
        // ---------------------------------------------

        await usuario.update({
            nombres: nombres.trim(),
            apellidos: apellidos.trim(),
            correo: correo.trim(),
            telefono: telefono?.trim() || null,
            tipo_documento: tipo_documento.trim(),
            numero_documento: numero_documento.trim(),
            estado: estado === true || estado === "true"
        });

        // ---------------------------------------------
        // Actualizar médico
        // ---------------------------------------------

        await medico.update({
            especialidad_id: Number(especialidad_id),
            cedula_profesional: cedula_profesional.trim(),
            anios_experiencia:
                anios_experiencia !== ""
                    ? Number(anios_experiencia)
                    : null
        });

        return res.json({
            ok: true,
            mensaje: "Médico actualizado correctamente."
        });

    } catch (error) {

        console.error(
            "Error al actualizar médico:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje: "Error al actualizar el médico."
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