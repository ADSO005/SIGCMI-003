import {
    Cita,
    Paciente,
    Medico,
    Usuario,
    Especialidad,
    EstadoCita
} from "../../models/index.js";

export const mostrarCalendario = async (req, res) => {
    try {

        // ==========================================
        // CITAS
        // ==========================================

        const citasDB = await Cita.findAll({
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
            ],

            order: [
                ["fecha", "ASC"],
                ["hora", "ASC"]
            ]
        });


        // ==========================================
        // CONVERTIR CITAS A DATOS PLANOS
        // ==========================================

        const citas = citasDB.map(cita => {

            const data = cita.toJSON();

            return {
                id_cita: data.id_cita,
                fecha: data.fecha,
                hora: data.hora,
                motivo_consulta: data.motivo_consulta,

                estado: data.Estado
                    ? data.Estado.nombre
                    : "Sin estado",

                paciente: data.Paciente &&
                    data.Paciente.Usuario
                    ? `${data.Paciente.Usuario.nombres} ${data.Paciente.Usuario.apellidos}`
                    : "Paciente",

                medico: data.Medico &&
                    data.Medico.Usuario
                    ? `${data.Medico.Usuario.nombres} ${data.Medico.Usuario.apellidos}`
                    : "Médico",

                especialidad: data.Medico &&
                    data.Medico.Especialidad
                    ? data.Medico.Especialidad.nombre
                    : "Sin especialidad"
            };
        });


        // ==========================================
        // ESTADÍSTICAS DIRECTAMENTE DESDE LA BD
        // ==========================================

        const totalCitas = await Cita.count();


        const totalPendientes = await Cita.count({
            include: [
                {
                    model: EstadoCita,
                    as: "Estado",
                    where: {
                        nombre: "Pendiente"
                    },
                    required: true
                }
            ]
        });


        const totalEnCurso = await Cita.count({
            include: [
                {
                    model: EstadoCita,
                    as: "Estado",
                    where: {
                        nombre: "En curso"
                    },
                    required: true
                }
            ]
        });


        const totalCompletadas = await Cita.count({
            include: [
                {
                    model: EstadoCita,
                    as: "Estado",
                    where: {
                        nombre: "Completada"
                    },
                    required: true
                }
            ]
        });


        const totalCanceladas = await Cita.count({
            include: [
                {
                    model: EstadoCita,
                    as: "Estado",
                    where: {
                        nombre: "Cancelada"
                    },
                    required: true
                }
            ]
        });


        // ==========================================
        // ESTADÍSTICAS PLANAS
        // ==========================================

        const estadisticas = {
            total: totalCitas,
            pendientes: totalPendientes,
            enCurso: totalEnCurso,
            completadas: totalCompletadas,
            canceladas: totalCanceladas
        };


        console.log(
            "Estadísticas calendario:",
            estadisticas
        );


        // ==========================================
        // RENDER
        // ==========================================

        res.render(
            "viewsAdmin/calendario/index",
            {
                citas,
                estadisticas,
                usuarios: req.usuario
            }
        );


    } catch (error) {

        console.error(
            "Error al cargar calendario:",
            error
        );

        res.status(500).send(
            "Error al cargar el calendario."
        );
    }
};