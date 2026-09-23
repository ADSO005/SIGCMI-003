import {
    Paciente,
    Medico,
    Usuario,
    Especialidad,
    EstadoCita,
    Cita,
    Horario
} from "../../models/index.js";

import {
    contieneLenguajeInapropiado
} from "../../utils/filtroLenguaje.js";
// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miercoles",
    "Jueves",
    "Viernes",
    "Sabado"
];


// Convierte HH:mm a minutos
const horaAMinutos = (hora) => {

    const [horas, minutos] = hora
        .substring(0, 5)
        .split(":")
        .map(Number);

    return (horas * 60) + minutos;
};


// Convierte minutos a HH:mm
const minutosAHora = (minutos) => {

    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;

    return `${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};


// Obtiene fecha local YYYY-MM-DD
const obtenerFechaLocal = (fecha = new Date()) => {

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
};


// =====================================================
// GENERAR HORAS DISPONIBLES
// =====================================================

const calcularHorasDisponibles = async (medico_id, fecha) => {

    // ---------------------------------------------
    // Validar fecha
    // ---------------------------------------------

    const fechaSeleccionada = new Date(`${fecha}T00:00:00`);

    if (Number.isNaN(fechaSeleccionada.getTime())) {
        return [];
    }

    const ahora = new Date();

    const fechaActual = obtenerFechaLocal(ahora);

    if (fecha < fechaActual) {
        return [];
    }


    // ---------------------------------------------
    // Día de la semana
    // ---------------------------------------------

    const diaSemana = diasSemana[
        fechaSeleccionada.getDay()
    ];


    // ---------------------------------------------
    // Buscar horarios APROBADOS del médico
    // ---------------------------------------------

    const horariosMedico = await Horario.findAll({

        where: {
            medico_id,
            dia_semana: diaSemana,
            estado: "Aprobado"
        },

        attributes: [
            "hora_inicio",
            "hora_fin"
        ]

    });


    // Si el médico no trabaja ese día
    if (horariosMedico.length === 0) {
        return [];
    }


    // ---------------------------------------------
    // Buscar citas existentes
    // ---------------------------------------------

    const citasExistentes = await Cita.findAll({

        where: {
            medico_id,
            fecha
        },

        attributes: [
            "hora"
        ]

    });


    const horasOcupadas = citasExistentes.map(
        cita => String(cita.hora).substring(0, 5)
    );


    // ---------------------------------------------
    // Generar intervalos de 30 minutos
    // ---------------------------------------------

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


        // Respetar horario global 07:00 - 19:00
        const inicio = Math.max(
            inicioGeneral,
            inicioMedico
        );

        const fin = Math.min(
            finGeneral,
            finMedico
        );


        // Primer intervalo válido de 30 minutos
        const primerSlot =
            Math.ceil(inicio / 30) * 30;


        for (
            let minutos = primerSlot;
            minutos <= fin;
            minutos += 30
        ) {

            const hora = minutosAHora(minutos);


            // -------------------------------------
            // No mostrar horas ocupadas
            // -------------------------------------

            if (horasOcupadas.includes(hora)) {
                continue;
            }


            // -------------------------------------
            // Regla de mínimo 5 horas
            // -------------------------------------

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


// =====================================================
// OBTENER HORAS DISPONIBLES
// =====================================================

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


        // Verificar médico
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


// =====================================================
// MOSTRAR FORMULARIO NUEVA CITA
// =====================================================

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


// =====================================================
// CREAR NUEVA CITA
// =====================================================

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


        // -----------------------------------------
        // Campos obligatorios
        // -----------------------------------------

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


        // -----------------------------------------
        // Validar paciente
        // -----------------------------------------

        const paciente =
            await Paciente.findByPk(paciente_id);


        if (!paciente) {

            return res.status(404).json({
                ok: false,
                mensaje:
                    "El paciente seleccionado no existe."
            });

        }

        // -----------------------------------------
        // VALIDAR UNA CITA POR PACIENTE AL DÍA
        // -----------------------------------------

        const citaPacienteEseDia = await Cita.findOne({
            where: {
                paciente_id,
                fecha
            }
        });

        if (citaPacienteEseDia) {

            return res.status(409).json({
                ok: false,
                mensaje:
                    "El paciente ya tiene una cita programada para este día."
            });

        }

        // -----------------------------------------
        // Validar médico
        // -----------------------------------------

        const medico =
            await Medico.findByPk(medico_id);


        if (!medico) {

            return res.status(404).json({
                ok: false,
                mensaje:
                    "El médico seleccionado no existe."
            });

        }


        // -----------------------------------------
        // Validar especialidad del médico
        // -----------------------------------------

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


        // -----------------------------------------
        // Validar formato de hora
        // -----------------------------------------

        if (
            !/^\d{2}:\d{2}$/.test(hora)
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "La hora seleccionada no es válida."
            });

        }


        // -----------------------------------------
        // Validar intervalo de 30 minutos
        // -----------------------------------------

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


        // -----------------------------------------
        // Volver a consultar disponibilidad
        // BACKEND = fuente de verdad
        // -----------------------------------------

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


        // -----------------------------------------
        // Estado automático PENDIENTE
        // -----------------------------------------

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

        // -----------------------------------------
        // Obtener administrador autenticado
        // -----------------------------------------

        const creadoPor =
            req.usuario?.id_usuario;


        if (!creadoPor) {

            return res.status(401).json({
                ok: false,
                mensaje:
                    "No se pudo identificar al administrador."
            });

        }


        // -----------------------------------------
        // Crear cita
        // -----------------------------------------

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