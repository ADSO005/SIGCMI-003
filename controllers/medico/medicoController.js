import Medico from "../../models/Medico.js";
import Cita from "../../models/Cita.js";
import Paciente from "../../models/Paciente.js";
import Usuario from "../../models/Usuario.js";
import Diagnostico from "../../models/Diagnostico.js";
import Prescripcion from "../../models/Prescripcion.js";
import EstadoCita from "../../models/EstadoCita.js";

const dashboard = async (req, res) => {

    try {

        // Buscar el perfil médico del usuario que inició sesión
        const medico = await Medico.findOne({
            where: {
                usuario_id: req.usuario.id_usuario
            }
        });

        if (!medico) {
            return res.status(404).send("No se encontró el perfil del médico");
        }

        // Buscar las citas pertenecientes al médico
        // y traer el paciente + sus datos de usuario
        const citas = await Cita.findAll({
            where: {
                medico_id: medico.id_medico
            },
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
                                "correo",
                                "telefono"
                            ]
                        }
                    ]
                }
            ]
        });


        // Obtener la fecha actual en formato YYYY-MM-DD
const hoy = new Date().toLocaleDateString("en-CA");

    // Buscar las citas de hoy del médico
    const citasHoy = await Cita.findAll({
        where: {
            medico_id: medico.id_medico,
            fecha: hoy
        },
        include: [
            {
                model: Paciente,
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
            ["hora", "ASC"]
        ]
    });
        // Evitar repetir pacientes que tienen varias citas
        const pacientesMap = new Map();

        citas.forEach((cita) => {

            const paciente = cita.Paciente;

            if (!paciente) {
                return;
            }

            if (!pacientesMap.has(paciente.id_paciente)) {

                pacientesMap.set(paciente.id_paciente, {
                    paciente,
                    cantidadCitas: 1
                });

            } else {

                pacientesMap.get(
                    paciente.id_paciente
                ).cantidadCitas++;

            }

        });

        const pacientes = Array.from(pacientesMap.values());

        console.log("Médico:", medico.id_medico);
        console.log("Pacientes encontrados:", pacientes.length);
        console.log("Citas de hoy:", citasHoy.length);

        res.render(
            "dashboardMedical/viewsMedico/dashboardMedical",
            {
                usuario: req.usuario,
                medico,
                pacientes,
                citasHoy
            }
        );

    } catch (error) {

        console.error(
            "❌ Error al cargar dashboard médico:",
            error
        );

        res.status(500).send(
            "Error al cargar el dashboard"
        );

    }

};

const detallePaciente = async (req, res) => {

    try {

        const { id } = req.params;

        // Buscar el médico que inició sesión
        const medico = await Medico.findOne({
            where: {
                usuario_id: req.usuario.id_usuario
            }
        });

        if (!medico) {
            return res.status(404).json({
                mensaje: "No se encontró el perfil del médico"
            });
        }

        // Buscar el paciente
        const paciente = await Paciente.findByPk(id, {
            include: [
                {
                    model: Usuario,
                    attributes: [
                        "nombres",
                        "apellidos",
                        "correo",
                        "telefono"
                    ]
                }
            ]
        });

        if (!paciente) {
            return res.status(404).json({
                mensaje: "Paciente no encontrado"
            });
        }

        // Buscar únicamente las citas de este paciente
        // que pertenecen al médico autenticado
        const citas = await Cita.findAll({
            where: {
                paciente_id: paciente.id_paciente,
                medico_id: medico.id_medico
            },
            include: [
                {
                    model: Diagnostico,
                    include: [
                        {
                            model: Prescripcion
                        }
                    ]
                }
            ],
            order: [
                ["fecha", "DESC"]
            ]
        });

        // Seguridad:
        // el médico no puede consultar un paciente
        // que nunca ha tenido una cita con él.
        if (citas.length === 0) {
            return res.status(403).json({
                mensaje: "No tienes acceso a este paciente"
            });
        }

        return res.json({
            paciente,
            citas
        });

    } catch (error) {

        console.error(
            "❌ Error al obtener paciente:",
            error
        );

        return res.status(500).json({
            mensaje: "Error al obtener el paciente"
        });
    }
};

const actualizarEstadoCita = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado_id } = req.body;

        // Validar el ID de la cita
        if (!/^[1-9]\d*$/.test(String(id))) {
            return res.status(400).json({
                mensaje: "ID de cita inválido"
            });
        }

        // Validar el estado solicitado
        if (![2, 3].includes(estado_id)) {
            return res.status(400).json({
                mensaje: "Estado de cita no permitido"
            });
        }

        // Buscar al médico autenticado
        const medico = await Medico.findOne({
            where: {
                usuario_id: req.usuario.id_usuario
            }
        });

        if (!medico) {
            return res.status(404).json({
                mensaje: "No se encontró el perfil del médico"
            });
        }

        // Solo permitir las transiciones:
        // Pendiente (1) -> En Curso (2)
        // En Curso (2) -> Completada (3)
        const estadoAnterior = estado_id === 2 ? 1 : 2;

        // Actualizar únicamente si la cita pertenece al médico
        // y todavía tiene el estado anterior esperado.
        const [filasActualizadas] = await Cita.update(
            {
                estado_id
            },
            {
                where: {
                    id_cita: id,
                    medico_id: medico.id_medico,
                    estado_id: estadoAnterior
                }
            }
        );

        if (filasActualizadas === 0) {
            return res.status(409).json({
                mensaje: "No se pudo actualizar la cita. Verifica que te pertenezca y que su estado permita este cambio."
            });
        }

        return res.json({
            mensaje: "Estado de la cita actualizado correctamente",
            id_cita: Number(id),
            estado_id
        });

    } catch (error) {
        console.error("❌ Error al actualizar la cita:", error);

        return res.status(500).json({
            mensaje: "Error al actualizar el estado de la cita"
        });
    }
};
export {
    dashboard,
    detallePaciente,
    actualizarEstadoCita
};