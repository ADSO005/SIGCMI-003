import { fn, col } from "sequelize";
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
        // GRÁFICO: TOTAL DE CITAS POR ESTADO
        //=========================================

        const conteoPorEstado = await Cita.findAll({
            attributes: ["estado_id", [fn("COUNT", col("id_cita")), "total"]],
            group: ["estado_id"],
            raw: true
        });

        const totales = new Map(conteoPorEstado.map((fila) => [fila.estado_id, Number(fila.total)]));

        const coloresEstado = {
            Pendiente: "#3B82F6",
            Confirmada: "#8B5CF6",
            "En Curso": "#F59E0B",
            Completada: "#10B981",
            Cancelada: "#EF4444"
        };

        const graficoEstados = estados.map((estado) => ({
            nombre: estado.nombre,
            total: totales.get(estado.id_estado) ?? 0,
            color: coloresEstado[estado.nombre] ?? "#94A3B8"
        }));

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
            estados,
            graficoEstados
        });

    } catch (error) {

        console.error("Error al cargar dashboard administrativo:", error);

        res.status(500).send("Error al cargar el dashboard administrativo");

    }

};