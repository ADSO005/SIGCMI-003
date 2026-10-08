import express from "express";
import auth from "../../middleware/auth.js";
import role from "../../middleware/role.js";

import {
    Paciente,
    Usuario,
    Cita,
    Medico,
    EstadoCita
} from "../../models/index.js";

const router = express.Router();


// ======================================================
// DASHBOARD DEL PACIENTE
// ======================================================

router.get(
    "/dashboard",
    auth,
    role(3),
    async (req, res) => {

        try {

            const usuarioId = req.usuario.id_usuario;

            if (!usuarioId) {
                return res.status(401).send(
                    "No se pudo identificar al usuario."
                );
            }

            const paciente = await Paciente.findOne({

                where: {
                    usuario_id: usuarioId
                },

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
                    }
                ]

            });

            if (!paciente) {
                return res.status(404).send(
                    "No se encontró el paciente asociado al usuario."
                );
            }


            const citasDB = await Cita.findAll({

                where: {
                    paciente_id: paciente.id_paciente
                },

                include: [
                    {
                        model: Medico,
                        include: [
                            {
                                model: Usuario,
                                attributes: [
                                    "nombres",
                                    "apellidos"
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
                    ["fecha", "ASC"],
                    ["hora", "ASC"]
                ]

            });


            const citas = citasDB.map(cita => {

                const nombreDoctor =
                    cita.Medico?.Usuario
                        ? `${cita.Medico.Usuario.nombres} ${cita.Medico.Usuario.apellidos}`
                        : "Médico no disponible";

                return {

                    id: cita.id_cita,

                    fecha: cita.fecha,

                    hora: String(cita.hora)
                        .substring(0, 5),

                    doctor: nombreDoctor,

                    consultorio: "Consultorio médico",

                    estado:
                        cita.Estado?.nombre ||
                        "Pendiente"

                };

            });


            const pacienteVista = {

                id: paciente.id_paciente,

                nombre:
                    `${paciente.Usuario.nombres} ${paciente.Usuario.apellidos}`,

                nombres:
                    paciente.Usuario.nombres,

                apellidos:
                    paciente.Usuario.apellidos,

                correo:
                    paciente.Usuario.correo,

                telefono:
                    paciente.Usuario.telefono

            };


            res.render(
                "viewsPaciente/dashboard",
                {
                    paciente: pacienteVista,
                    citas
                }
            );


        } catch (error) {

            console.error(
                "Error al cargar dashboard del paciente:",
                error
            );

            res.status(500).send(
                "Error al cargar el dashboard del paciente."
            );

        }

    }
);


// ======================================================
// PERFIL DEL PACIENTE
// ======================================================

// ======================================================
// PERFIL DEL PACIENTE
// ======================================================

router.get(
    "/perfil",
    auth,
    role(3),
    async (req, res) => {

        try {

            // ==========================================
            // USUARIO AUTENTICADO
            // ==========================================

            const usuarioId = req.usuario.id_usuario;

            if (!usuarioId) {
                return res.status(401).send(
                    "No se pudo identificar al usuario."
                );
            }


            // ==========================================
            // BUSCAR PACIENTE + USUARIO
            // ==========================================

            const paciente = await Paciente.findOne({

                where: {
                    usuario_id: usuarioId
                },

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
                            "numero_documento"
                        ]
                    }
                ]

            });


            if (!paciente) {

                return res.status(404).send(
                    "No se encontró el paciente asociado al usuario."
                );

            }


            // ==========================================
            // DATOS PARA LA VISTA
            // ==========================================

            const pacienteVista = {

                id: paciente.id_paciente,

                nombre:
                    `${paciente.Usuario.nombres} ${paciente.Usuario.apellidos}`,

                nombres:
                    paciente.Usuario.nombres,

                apellidos:
                    paciente.Usuario.apellidos,

                correo:
                    paciente.Usuario.correo,

                telefono:
                    paciente.Usuario.telefono,

                fechaNacimiento:
                    paciente.fecha_nacimiento,

                tipoDocumento:
                    paciente.Usuario.tipo_documento,

                numeroDocumento:
                    paciente.Usuario.numero_documento,

                tipoSangre:
                    paciente.tipo_sangre,

                alergias:
                    paciente.alergias,

                condicionesMedicas:
                    paciente.condiciones_medicas,

                direccion:
                    paciente.direccion,

                departamento:
                    paciente.departamento,

                ciudad:
                    paciente.ciudad,

                contactoEmergencia: {

                    nombres: "",
                    apellidos: "",
                    telefono: "",
                    correo: ""

                }

            };


            // ==========================================
            // MOSTRAR PERFIL
            // ==========================================

            res.render(
                "viewsPaciente/profile",
                {
                    paciente: pacienteVista
                }
            );


        } catch (error) {

            console.error(
                "Error al cargar perfil del paciente:",
                error
            );

            res.status(500).send(
                "Error al cargar el perfil del paciente."
            );

        }

    }
);

export default router;