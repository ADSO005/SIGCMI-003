import {
    Diagnostico,
    Cita,
    Paciente,
    Medico,
    Usuario,
    Especialidad,
    EstadoCita
} from "../../models/index.js";

// =====================================================
// LISTAR DIAGNÓSTICOS
// =====================================================

export const listarDiagnosticos = async (req, res) => {

    try {

        const diagnosticos = await Diagnostico.findAll({

            include: [

                // ==========================================
                // CITA
                // ==========================================

                {
                    model: Cita,

                    include: [

                        // ----------------------------------
                        // PACIENTE
                        // ----------------------------------

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

                        // ----------------------------------
                        // MÉDICO
                        // ----------------------------------

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

                        // ----------------------------------
                        // ESTADO
                        // ----------------------------------

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


        // ==========================================
        // RESPUESTA
        // ==========================================

        return res.json({

            ok: true,

            diagnosticos

        });

    } catch (error) {

        console.error(
            "Error al listar diagnósticos:",
            error
        );

        return res.status(500).json({

            ok: false,

            mensaje:
                "Error al cargar los diagnósticos."

        });

    }
};