import {
    Paciente,
    Medico,
    Usuario,
    Especialidad,
    EstadoCita,
    Cita,
    Horario
} from "../../models/index.js";

import { Op } from "sequelize";
import { notificarCitaPorId } from "../../services/notificaciones/notificar.js";

import {
    ESTADOS_CITA_REPROGRAMABLE,
    soloCitasActivas
} from "../../services/estadosCita.js";

import {
    contieneLenguajeInapropiado
} from "../../utils/filtroLenguaje.js";

const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miercoles",
    "Jueves",
    "Viernes",
    "Sabado"
];


const horaAMinutos = (hora) => {

    const [horas, minutos] = hora
        .substring(0, 5)
        .split(":")
        .map(Number);

    return (horas * 60) + minutos;
};


const minutosAHora = (minutos) => {

    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;

    return `${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};


const obtenerFechaLocal = (fecha = new Date()) => {

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
};


const calcularHorasDisponibles = async (medico_id, fecha) => {


    const fechaSeleccionada = new Date(`${fecha}T00:00:00`);

    if (Number.isNaN(fechaSeleccionada.getTime())) {
        return [];
    }

    const ahora = new Date();

    const fechaActual = obtenerFechaLocal(ahora);

    if (fecha < fechaActual) {
        return [];
    }


    const diaSemana = diasSemana[
        fechaSeleccionada.getDay()
    ];


    const horariosMedico = await Horario.findAll({

        where: {
            medico_id,
            dia_semana: diaSemana,
            estado: "Aprobado",

            fecha_inicio: {
                [Op.lte]: fecha
            },

            fecha_fin: {
                [Op.gte]: fecha
            }
        },

        attributes: [
            "hora_inicio",
            "hora_fin",
            "fecha_inicio",
            "fecha_fin"
        ]

    });


    if (horariosMedico.length === 0) {
        return [];
    }


    const citasExistentes = await Cita.findAll({

        where: {
            medico_id,
            fecha
        },

        include: [soloCitasActivas()],

        attributes: [
            "hora"
        ]

    });


    const horasOcupadas = citasExistentes.map(
        cita => String(cita.hora).substring(0, 5)
    );


    const horasDisponibles = new Set();

    const inicioGeneral = 7 * 60;
    const finGeneral = 19 * 60;


    for (const horario of horariosMedico) {

        const inicioMedico = horaAMinutos(
            horario.hora_inicio
        );

        const finMedico = horaAMinutos(
            horario.hora_fin
        );


        const inicio = Math.max(
            inicioGeneral,
            inicioMedico
        );

        const fin = Math.min(
            finGeneral,
            finMedico
        );


        const primerSlot =
            Math.ceil(inicio / 30) * 30;


        for (
            let minutos = primerSlot;
            minutos <= fin;
            minutos += 30
        ) {

            const hora = minutosAHora(minutos);


            if (horasOcupadas.includes(hora)) {
                continue;
            }


            const fechaHoraCita = new Date(
                `${fecha}T${hora}:00`
            );

            const minimoPermitido = new Date(
                ahora.getTime() + (5 * 60 * 60 * 1000)
            );


            if (fechaHoraCita < minimoPermitido) {
                continue;
            }


            horasDisponibles.add(hora);
        }
    }


    return Array.from(horasDisponibles)
        .sort();

};


export const obtenerHorasDisponibles = async (req, res) => {

    try {

        const {
            medico_id,
            fecha
        } = req.query;


        if (!medico_id || !fecha) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Debe seleccionar un médico y una fecha."
            });

        }


        const medico = await Medico.findByPk(
            medico_id
        );


        if (!medico) {

            return res.status(404).json({
                ok: false,
                mensaje:
                    "El médico seleccionado no existe."
            });

        }


        const horas =
            await calcularHorasDisponibles(
                medico_id,
                fecha
            );


        return res.json({
            ok: true,
            horas
        });


    } catch (error) {

        console.error(
            "Error obteniendo horas disponibles:",
            error
        );


        return res.status(500).json({
            ok: false,
            mensaje:
                "Error al consultar las horas disponibles."
        });

    }

};


export const mostrarFormularioNuevaCita = async (req, res) => {

    try {

        const pacientes = await Paciente.findAll({

            include: [
                {
                    model: Usuario,
                    attributes: [
                        "id_usuario",
                        "nombres",
                        "apellidos",
                        "numero_documento"
                    ]
                }
            ],

            order: [
                [Usuario, "nombres", "ASC"]
            ]

        });


        const especialidades =
            await Especialidad.findAll({

                order: [
                    ["nombre", "ASC"]
                ]

            });


        const medicos = await Medico.findAll({

            include: [
                {
                    model: Usuario,
                    attributes: [
                        "id_usuario",
                        "nombres",
                        "apellidos"
                    ]
                },
                {
                    model: Especialidad,
                    attributes: [
                        "id_especialidad",
                        "nombre"
                    ]
                }
            ],

            order: [
                [Usuario, "nombres", "ASC"]
            ]

        });


        const usuarios = req.usuario;


        res.render("viewsAdmin/citas/nueva", {

            usuarios,
            pacientes,
            medicos,
            especialidades

        });


    } catch (error) {

        console.error(
            "Error al cargar formulario de nueva cita:",
            error
        );


        res.status(500).send(
            "Error al cargar el formulario de nueva cita"
        );

    }

};


export const crearNuevaCita = async (req, res) => {

    try {

        const {
            paciente_id,
            medico_id,
            especialidad_id,
            fecha,
            hora,
            motivo_consulta
        } = req.body;


        if (
            !paciente_id ||
            !medico_id ||
            !especialidad_id ||
            !fecha ||
            !hora
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Complete todos los campos obligatorios."
            });

        }


        const paciente =
            await Paciente.findByPk(paciente_id);


        if (!paciente) {

            return res.status(404).json({
                ok: false,
                mensaje:
                    "El paciente seleccionado no existe."
            });

        }


        const citaPacienteEseDia = await Cita.findOne({
            where: {
                paciente_id,
                fecha
            },

            include: [soloCitasActivas()]
        });

        if (citaPacienteEseDia) {

            return res.status(409).json({
                ok: false,
                mensaje:
                    "El paciente ya tiene una cita programada para este día."
            });

        }


        const medico =
            await Medico.findByPk(medico_id);


        if (!medico) {

            return res.status(404).json({
                ok: false,
                mensaje:
                    "El médico seleccionado no existe."
            });

        }


        if (
            Number(medico.especialidad_id) !==
            Number(especialidad_id)
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "El médico no pertenece a la especialidad seleccionada."
            });

        }


        if (
            !/^\d{2}:\d{2}$/.test(hora)
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "La hora seleccionada no es válida."
            });

        }


        const minutosHora =
            horaAMinutos(hora);


        if (
            minutosHora < (7 * 60) ||
            minutosHora > (19 * 60) ||
            minutosHora % 30 !== 0
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "La cita debe estar entre las 07:00 y las 19:00 en intervalos de 30 minutos."
            });

        }


        // Volver a consultar disponibilidad
        // BACKEND = fuente de verdad

        const horasDisponibles =
            await calcularHorasDisponibles(
                medico_id,
                fecha
            );


        if (
            !horasDisponibles.includes(hora)
        ) {

            return res.status(409).json({
                ok: false,
                mensaje:
                    "La hora seleccionada ya no está disponible."
            });

        }


        const estadoPendiente =
            await EstadoCita.findOne({

                where: {
                    nombre: "Pendiente"
                }

            });


        if (!estadoPendiente) {

            return res.status(500).json({
                ok: false,
                mensaje:
                    'No existe el estado "Pendiente" en la base de datos.'
            });

        }


        const motivo =
            String(motivo_consulta || "").trim();

        if (contieneLenguajeInapropiado(motivo)) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "El motivo de consulta contiene lenguaje no permitido."
            });

        }


        const creadoPor =
            req.usuario?.id_usuario;


        if (!creadoPor) {

            return res.status(401).json({
                ok: false,
                mensaje:
                    "No se pudo identificar al administrador."
            });

        }


        const nuevaCita =
            await Cita.create({

                paciente_id,

                medico_id,

                estado_id:
                    estadoPendiente.id_estado,

                creado_por:
                    creadoPor,

                fecha,

                hora: `${hora}:00`,

                motivo_consulta:
                    motivo || null

            });


        notificarCitaPorId(nuevaCita.id_cita, "confirmacion_cita");

        return res.status(201).json({

            ok: true,

            mensaje:
                "Cita creada correctamente.",

            cita: {
                id_cita:
                    nuevaCita.id_cita,

                fecha:
                    nuevaCita.fecha,

                hora:
                    String(nuevaCita.hora)
                        .substring(0, 5),

                estado:
                    "Pendiente"
            }

        });


    } catch (error) {

        console.error(
            "Error al crear la cita:",
            error
        );


        return res.status(500).json({

            ok: false,

            mensaje:
                "Ocurrió un error al crear la cita."

        });

    }

};

export const listarCitas = async (req, res) => {
    try {


        const citas = await Cita.findAll({
            include: [
                {
                    model: Paciente,
                    include: [
                        {
                            model: Usuario,
                            attributes: [
                                "id_usuario",
                                "nombres",
                                "apellidos",
                                "numero_documento"
                            ]
                        }
                    ]
                },
                {
                    model: Medico,
                    include: [
                        {
                            model: Usuario,
                            attributes: [
                                "id_usuario",
                                "nombres",
                                "apellidos"
                            ]
                        },
                        {
                            model: Especialidad,
                            attributes: [
                                "id_especialidad",
                                "nombre"
                            ]
                        }
                    ]
                },
                {
                    model: EstadoCita,
                    as: "Estado",
                    attributes: [
                        "id_estado",
                        "nombre"
                    ]
                }
            ],

            order: [
                ["fecha", "DESC"],
                ["hora", "DESC"]
            ]
        });


        const pacientes = await Paciente.findAll({
            include: [
                {
                    model: Usuario,
                    attributes: [
                        "id_usuario",
                        "nombres",
                        "apellidos",
                        "numero_documento"
                    ]
                }
            ],
            order: [
                [
                    Usuario,
                    "nombres",
                    "ASC"
                ]
            ]
        });


        const especialidades = await Especialidad.findAll({
            order: [
                ["nombre", "ASC"]
            ]
        });


        const medicos = await Medico.findAll({
            include: [
                {
                    model: Usuario,
                    attributes: [
                        "id_usuario",
                        "nombres",
                        "apellidos"
                    ]
                },
                {
                    model: Especialidad,
                    attributes: [
                        "id_especialidad",
                        "nombre"
                    ]
                }
            ],
            order: [
                [
                    Usuario,
                    "nombres",
                    "ASC"
                ]
            ]
        });


        res.render("viewsAdmin/citas/index", {
            citas,
            pacientes,
            especialidades,
            medicos,
            usuarios: req.usuario
        });


    } catch (error) {

        console.error(
            "Error al listar citas:",
            error
        );

        res.status(500).send(
            "Error al cargar las citas."
        );
    }
};


export const obtenerCita = async (req, res) => {

    try {

        const { id } = req.params;

        if (!/^\d+$/.test(String(id))) {

            return res.status(400).json({
                ok: false,
                mensaje: "El ID de la cita no es válido."
            });

        }


        const cita = await Cita.findByPk(id, {

            include: [

                {
                    model: Paciente,

                    include: [
                        {
                            model: Usuario,

                            attributes: [
                                "id_usuario",
                                "nombres",
                                "apellidos",
                                "numero_documento",
                                "correo",
                                "telefono"
                            ]
                        }
                    ]
                },


                {
                    model: Medico,

                    include: [

                        {
                            model: Usuario,

                            attributes: [
                                "id_usuario",
                                "nombres",
                                "apellidos",
                                "correo",
                                "telefono"
                            ]
                        },

                        {
                            model: Especialidad,

                            attributes: [
                                "id_especialidad",
                                "nombre"
                            ]
                        }

                    ]

                },


                {
                    model: EstadoCita,
                    as: "Estado",

                    attributes: [
                        "id_estado",
                        "nombre"
                    ]
                }

            ]

        });


        if (!cita) {

            return res.status(404).json({
                ok: false,
                mensaje: "Cita no encontrada."
            });

        }


        return res.status(200).json({
            ok: true,
            cita
        });


    } catch (error) {

        console.error(
            "Error al obtener detalle de la cita:",
            error
        );


        return res.status(500).json({
            ok: false,
            mensaje: "Error al obtener el detalle de la cita."
        });

    }

};


export const reprogramarCita = async (req, res) => {
    try {

        const { id } = req.params;

        const {
            fecha,
            hora,
            motivo_reprogramacion
        } = req.body;


        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({
                ok: false,
                mensaje: "El ID de la cita no es válido."
            });
        }


        if (
            !fecha ||
            !hora ||
            !motivo_reprogramacion ||
            !motivo_reprogramacion.trim()
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "La fecha, hora y motivo de reprogramación son obligatorios."
            });
        }


        if (
            contieneLenguajeInapropiado(
                motivo_reprogramacion.trim()
            )
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "El motivo de reprogramación contiene lenguaje no permitido."
            });
        }


        const cita = await Cita.findByPk(id, {
            include: [{ model: EstadoCita, as: "Estado", attributes: ["nombre"] }]
        });

        if (!cita) {
            return res.status(404).json({
                ok: false,
                mensaje: "La cita no existe."
            });
        }

        // Una cita cancelada, completada o cerrada no se reprograma: no puede volver a ocupar la agenda.
        if (!ESTADOS_CITA_REPROGRAMABLE.includes(cita.Estado?.nombre)) {
            return res.status(409).json({
                ok: false,
                mensaje: "Solo se pueden reprogramar citas pendientes o confirmadas."
            });
        }


        const fechaSeleccionada =
            new Date(`${fecha}T00:00:00`);

        if (Number.isNaN(fechaSeleccionada.getTime())) {
            return res.status(400).json({
                ok: false,
                mensaje: "La fecha seleccionada no es válida."
            });
        }


        const ahora = new Date();

        const fechaActual =
            obtenerFechaLocal(ahora);

        if (fecha <= fechaActual) {
            return res.status(400).json({
                ok: false,
                mensaje: "La nueva fecha debe ser posterior a la fecha actual."
            });
        }


        if (!/^\d{2}:\d{2}$/.test(hora)) {
            return res.status(400).json({
                ok: false,
                mensaje: "El formato de la hora no es válido."
            });
        }


        const [horas, minutos] =
            hora.split(":").map(Number);

        const minutosTotales =
            horas * 60 + minutos;


        if (
            horas < 0 ||
            horas > 23 ||
            minutos < 0 ||
            minutos > 59
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "La hora seleccionada no es válida."
            });
        }


        if (
            minutosTotales < 420 ||
            minutosTotales > 1140 ||
            minutos % 30 !== 0
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "La hora debe estar entre las 07:00 y las 19:00 y utilizar intervalos de 30 minutos."
            });
        }


        const diaSemana =
            diasSemana[fechaSeleccionada.getDay()];


        const horariosMedico =
            await Horario.findAll({

                where: {
                    medico_id: cita.medico_id,
                    dia_semana: diaSemana,
                    estado: "Aprobado",

                    fecha_inicio: {
                        [Op.lte]: fecha
                    },

                    fecha_fin: {
                        [Op.gte]: fecha
                    }
                },

                attributes: [
                    "hora_inicio",
                    "hora_fin"
                ]

            });


        if (horariosMedico.length === 0) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El médico no tiene un horario aprobado para la fecha seleccionada."
            });
        }


        const horaValidaEnHorario =
            horariosMedico.some((horario) => {

                const inicio =
                    horaAMinutos(horario.hora_inicio);

                const fin =
                    horaAMinutos(horario.hora_fin);

                return (
                    minutosTotales >= inicio &&
                    minutosTotales <= fin
                );
            });


        if (!horaValidaEnHorario) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "La hora seleccionada no pertenece al horario aprobado del médico."
            });
        }


        const fechaHoraCita =
            new Date(`${fecha}T${hora}:00`);

        const minimoPermitido =
            new Date(
                ahora.getTime() +
                (5 * 60 * 60 * 1000)
            );


        if (fechaHoraCita < minimoPermitido) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "La cita debe programarse con mínimo 5 horas de anticipación."
            });
        }


        const citaExistente =
            await Cita.findOne({

                where: {
                    medico_id: cita.medico_id,
                    fecha,
                    hora,

                    id_cita: {
                        [Op.ne]: cita.id_cita
                    }
                },

            include: [soloCitasActivas()]

            });


        if (citaExistente) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "La hora seleccionada ya está ocupada por otra cita."
            });
        }


        const citaPaciente =
            await Cita.findOne({

                where: {
                    paciente_id: cita.paciente_id,
                    fecha,

                    id_cita: {
                        [Op.ne]: cita.id_cita
                    }
                },

            include: [soloCitasActivas()]

            });


        if (citaPaciente) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El paciente ya tiene otra cita programada para ese día."
            });
        }


        const fechaAnterior = cita.fecha;
        const horaAnterior = cita.hora;


        await cita.update({

            fecha,

            hora,

            reprogramado_por:
                req.usuario.id_usuario,

            fecha_reprogramacion:
                new Date(),

            motivo_reprogramacion:
                motivo_reprogramacion.trim()

        });

        notificarCitaPorId(cita.id_cita, "reprogramacion");

        return res.status(200).json({

            ok: true,

            mensaje:
                "La cita fue reprogramada correctamente.",

            cita: {

                id_cita:
                    cita.id_cita,

                fecha_anterior:
                    fechaAnterior,

                hora_anterior:
                    horaAnterior,

                nueva_fecha:
                    cita.fecha,

                nueva_hora:
                    cita.hora

            }

        });


    } catch (error) {

        console.error(
            "Error al reprogramar cita:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "Error interno al reprogramar la cita."
        });

    }
};


export const cancelarCita = async (req, res) => {
    try {

        const { id } = req.params;
        const { motivo_cancelacion } = req.body;


        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({
                ok: false,
                mensaje: "El ID de la cita no es válido."
            });
        }


        if (
            !motivo_cancelacion ||
            !motivo_cancelacion.trim()
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Debe indicar el motivo de la cancelación."
            });
        }


        if (
            contieneLenguajeInapropiado(
                motivo_cancelacion
            )
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El motivo de cancelación contiene lenguaje no permitido."
            });
        }


        const cita = await Cita.findByPk(id);

        if (!cita) {
            return res.status(404).json({
                ok: false,
                mensaje: "Cita no encontrada."
            });
        }


        const estadoCancelada =
            await EstadoCita.findOne({
                where: {
                    nombre: "Cancelada"
                }
            });


        if (!estadoCancelada) {
            return res.status(500).json({
                ok: false,
                mensaje:
                    "No existe el estado 'Cancelada' en la base de datos."
            });
        }


        if (
            Number(cita.estado_id) ===
            Number(estadoCancelada.id_estado)
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "La cita ya se encuentra cancelada."
            });
        }


        cita.estado_id =
            estadoCancelada.id_estado;

        cita.motivo_cancelacion =
            motivo_cancelacion.trim();

        cita.cancelado_por =
            req.usuario.id_usuario;

        cita.fecha_cancelacion =
            new Date();


        await cita.save();

        notificarCitaPorId(cita.id_cita, "cancelacion_cita");

        return res.status(200).json({
            ok: true,
            mensaje: "La cita fue cancelada correctamente."
        });


    } catch (error) {

        console.error(
            "Error al cancelar cita:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "Ocurrió un error al cancelar la cita."
        });
    }
};