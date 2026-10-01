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
                    as: "Cita",

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


// =====================================================
// OBTENER DIAGNÓSTICO POR ID
// =====================================================

export const obtenerDiagnostico = async (req, res) => {

    try {

        const { id } = req.params;

        // ==========================================
        // VALIDAR ID
        // ==========================================

        if (!id || isNaN(id)) {

            return res.status(400).json({
                ok: false,
                mensaje: "ID de diagnóstico inválido."
            });
        }

        // ==========================================
        // BUSCAR DIAGNÓSTICO
        // ==========================================

        const diagnostico = await Diagnostico.findByPk(id, {

            include: [

                // ======================================
                // CITA
                // ======================================

                {
                    model: Cita,
                    as: "Cita",

                    include: [

                        // --------------------------------
                        // PACIENTE
                        // --------------------------------

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

                        // --------------------------------
                        // MÉDICO
                        // --------------------------------

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

                        // --------------------------------
                        // ESTADO
                        // --------------------------------

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

        // ==========================================
        // DIAGNÓSTICO NO ENCONTRADO
        // ==========================================

        if (!diagnostico) {

            return res.status(404).json({
                ok: false,
                mensaje: "Diagnóstico no encontrado."
            });
        }

        // ==========================================
        // RESPUESTA
        // ==========================================

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