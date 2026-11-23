import {
    Diagnostico,
    Cita,
    Paciente,
    Medico,
    Usuario,
    Especialidad,
    EstadoCita
} from "../../models/index.js";


export const listarDiagnosticos = async (req, res) => {

    try {

        const diagnosticos = await Diagnostico.findAll({

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
            ],

            order: [
                ["fecha_diagnostico", "DESC"]
            ]
        });


        return res.render(
            "viewsAdmin/diagnosticos/index",
            {
                diagnosticos,
                usuarios: req.usuario
            }
        );

    } catch (error) {

        console.error(
            "Error al listar diagnósticos:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje: "Error al cargar los diagnósticos."
        });
    }
};


export const obtenerDiagnostico = async (req, res) => {

    try {

        const { id } = req.params;


        if (!id || isNaN(id)) {

            return res.status(400).json({
                ok: false,
                mensaje: "ID de diagnóstico inválido."
            });
        }


        const diagnostico = await Diagnostico.findByPk(id, {

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
        });


        if (!diagnostico) {

            return res.status(404).json({
                ok: false,
                mensaje: "Diagnóstico no encontrado."
            });
        }


        return res.json({
            ok: true,
            diagnostico
        });

    } catch (error) {

        console.error(
            "Error al obtener diagnóstico:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje: "Error al obtener el diagnóstico."
        });
    }
};