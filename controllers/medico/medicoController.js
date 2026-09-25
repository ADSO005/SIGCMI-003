import Medico from "../../models/Medico.js";
import Cita from "../../models/Cita.js";
import Paciente from "../../models/Paciente.js";
import Usuario from "../../models/Usuario.js";

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

        res.render(
            "dashboardMedical/viewsMedico/dashboardMedical",
            {
                usuario: req.usuario,
                medico,
                pacientes
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

export {
    dashboard
};