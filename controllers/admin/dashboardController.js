import {
    Usuario,
    Paciente,
    Medico,
    Especialidad,
    EstadoCita,
    Cita,
    SolicitudWhatsApp
} from "../../models/index.js";

export const verDashboard = async (req, res) => {

    try {

        //=========================================
        // FECHA DE HOY
        //=========================================

        const hoy = new Date().toISOString().split("T")[0];

        //=========================================
        // ESTADÍSTICAS
        //=========================================

        const pacientesActivos = await Paciente.count();

        const medicosDisponibles = await Medico.count();

        const citasHoy = await Cita.findAll({

            where: {
                fecha: hoy
            },
            include: [
                {
                    model: Paciente,
                    include: [Usuario]
                },
                {
                    model: Medico,
                    include: [Usuario]
                },
                {
                    model: EstadoCita,
                    as: "Estado"
                }
            ],
            order: [
                ["hora", "ASC"]
            ]
        });

        citasHoy.forEach((cita) => {
            cita.hora = cita.hora.substring(0, 5);
        });

        const notificacionesHoy = await SolicitudWhatsApp.count();

        //=========================================
        // USUARIO (TEMPORAL)
        //=========================================

        const usuarios = {
            nombre: "Administrador"
        };

        //=========================================
        // DATOS DEL DASHBOARD
        //=========================================

        const stats = {

            citasHoy: citasHoy.length,

            pacientesActivos,

            medicosDisponibles,

            tiempoEspera: 15,

            notificacionesHoy

        };

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
                [Usuario, "nombres", "ASC"]
            ]
        });

        const estados = await EstadoCita.findAll({
            order: [
                ["nombre", "ASC"]
            ]
        });

        //=========================================
        // RENDER
        //=========================================

        res.render("viewsAdmin/dashboard", {
            usuarios: req.usuario,
            fechaHoy: new Date().toLocaleDateString("es-CO"),
            stats,
            citasHoy,
            pacientes,
            especialidades,
            medicos,
            estados
        });

    } catch (error) {

        console.error("Error al cargar dashboard administrativo:", error);

        res.status(500).send("Error al cargar el dashboard administrativo");

    }

};