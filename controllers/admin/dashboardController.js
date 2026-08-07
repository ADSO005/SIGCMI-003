import {
    Usuario,
    Paciente,
    Medico,
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


        //=========================================
        // RENDER
        //=========================================

        res.render("viewsAdmin/dashboard", {

            usuarios,

            fechaHoy: new Date().toLocaleDateString("es-CO"),

            stats,

            citasHoy

        });

    } catch (error) {

        console.error(error);

    }

};