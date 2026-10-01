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

router.get(
    "/dashboard",
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
            // BUSCAR PACIENTE
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


            // ==========================================
            // BUSCAR CITAS DEL PACIENTE
            // ==========================================

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


            // ==========================================
            // ADAPTAR CITAS PARA EL PUG
            // ==========================================

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


            // ==========================================
            // DATOS DEL PACIENTE PARA LA VISTA
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
                    paciente.Usuario.telefono

            };


            // ==========================================
            // RENDER
            // ==========================================

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

export default router;