import {
    Prescripcion,
    Diagnostico,
    Cita,
    Paciente,
    Medico,
    Usuario,
    Especialidad,
    EstadoCita
} from "../../models/index.js";

// =====================================================
// LISTAR PRESCRIPCIONES
// =====================================================

export const listarPrescripciones = async (req, res) => {

    try {

        const prescripciones = await Prescripcion.findAll({

            include: [

                {
                    model: Diagnostico,

                    include: [

                        {
                            model: Cita,
                            as: "Cita",

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
                            ]
                        }
                    ]
                }
            ],

            order: [
                ["id_prescripcion", "DESC"]
            ]
        });

        return res.render(
            "viewsAdmin/prescripciones/index",
            {
                prescripciones,
                usuarios: req.usuario
            }
        );

    } catch (error) {

        console.error(
            "Error al listar prescripciones:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje: "Error al cargar las prescripciones."
        });
    }
};


// =====================================================
// OBTENER PRESCRIPCIÓN POR ID
// =====================================================

export const obtenerPrescripcion = async (req, res) => {

    try {

        const { id } = req.params;

        if (!id || isNaN(id)) {

            return res.status(400).json({
                ok: false,
                mensaje: "ID de prescripción inválido."
            });
        }

        const prescripcion = await Prescripcion.findByPk(id, {

            include: [

                {
                    model: Diagnostico,

                    include: [

                        {
                            model: Cita,
                            as: "Cita",

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
                            ]
                        }
                    ]
                }
            ]
        });

        if (!prescripcion) {

            return res.status(404).json({
                ok: false,
                mensaje: "Prescripción no encontrada."
            });
        }

        return res.json({
            ok: true,
            prescripcion
        });

    } catch (error) {

        console.error(
            "Error al obtener prescripción:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje: "Error al obtener la prescripción."
        });
    }
};