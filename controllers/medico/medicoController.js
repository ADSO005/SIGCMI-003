import Medico from "../../models/Medico.js";
import Cita from "../../models/Cita.js";
import Paciente from "../../models/Paciente.js";
import Usuario from "../../models/Usuario.js";
import Diagnostico from "../../models/Diagnostico.js";
import Prescripcion from "../../models/Prescripcion.js";
import EstadoCita from "../../models/EstadoCita.js";
import Especialidad from "../../models/Especialidad.js";
import { calculateDashboardMetrics, dashboardPeriods, nextAppointmentToday, canStartAppointmentToday } from "../../services/medico/dashboardMetricsService.js";
import { textoDiagnosticoValido } from "../../services/medico/diagnosticoService.js";

const dashboard = async (req, res) => {

    try {
        const now = new Date();

        // Buscar el perfil médico del usuario que inició sesión
        const medico = await Medico.findOne({
            where: {
                usuario_id: req.usuario.id_usuario
            },
            include: [
                { model: Usuario, attributes: ["nombres", "apellidos"] },
                { model: Especialidad, attributes: ["nombre"], required: false }
            ]
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
            attributes: ["id_cita", "medico_id", "paciente_id", "fecha", "hora", "motivo_consulta"],
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
                },
                { model: EstadoCita, as: "Estado", attributes: ["nombre"] }
            ]
        });


        // Se reutiliza el mismo día de Bogotá para las métricas y la consulta diaria.
        const { today: hoy } = dashboardPeriods(now);

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

        const prepararAtencion = cita => ({
            id_cita: cita.id_cita, fecha: cita.fecha, hora: cita.hora,
            paciente: [cita.Paciente?.Usuario?.nombres, cita.Paciente?.Usuario?.apellidos].filter(Boolean).join(" ") || "Paciente no disponible",
            motivo: cita.motivo_consulta?.trim() || "Motivo no registrado",
            estado: cita.Estado?.nombre || "Sin estado",
            puedeIniciar: ["Pendiente", "Confirmada"].includes(cita.Estado?.nombre) && canStartAppointmentToday(cita, now)
        });
        const agendaHoy = citasHoy.map(prepararAtencion);
        const consultasAnteriores = citas.filter(cita => cita.Estado?.nombre === "En Curso" && cita.fecha < hoy)
            .map(prepararAtencion).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
        const estadoEnCurso = agendaHoy.some(cita => cita.puedeIniciar)
            ? await EstadoCita.findOne({ where: { nombre: "En Curso" }, attributes: ["id_estado"] }) : null;
        // El parámetro solo selecciona contexto de las citas propias que siguen En Curso.
        const consultaId = typeof req.query.consulta === "string" && /^[1-9]\d*$/.test(req.query.consulta)
            ? Number(req.query.consulta) : NaN;
        const contextoConsulta = [...agendaHoy, ...consultasAnteriores]
            .find(cita => cita.id_cita === consultaId && cita.estado === "En Curso");

        // El modal recibe solo datos de consulta, sin información clínica adicional.
        const citasAgenda = citas.map(cita => ({
            fecha: cita.fecha,
            hora: cita.hora,
            paciente: [cita.Paciente?.Usuario?.nombres, cita.Paciente?.Usuario?.apellidos].filter(Boolean).join(" ") || "Paciente no disponible",
            motivo: cita.motivo_consulta?.trim() || "Motivo no registrado",
            estado: cita.Estado?.nombre || "Sin estado"
        })).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

        console.log("Médico:", medico.id_medico);
        console.log("Pacientes encontrados:", pacientes.length);
        console.log("Citas de hoy:", citasHoy.length);

        res.render(
            "viewsMedico/dashboardMedical",
            {
                usuario: req.usuario,
                medico,
                pacientes,
                citasHoy,
                agendaHoy, consultasAnteriores, contextoConsulta,
                estadoEnCursoId: estadoEnCurso?.id_estado,
                errorContexto: req.query.consulta !== undefined && !contextoConsulta,
                citasAgenda,
                proximaCita: nextAppointmentToday(citasHoy, medico.id_medico, now),
                nombreMedico: [medico.Usuario?.nombres, medico.Usuario?.apellidos].filter(Boolean).join(" "),
                especialidadMedico: medico.Especialidad?.nombre?.trim() || "Especialidad no registrada",
                fechaDashboard: new Intl.DateTimeFormat("es-CO", {
                    timeZone: "America/Bogota", day: "numeric", month: "long", year: "numeric"
                }).format(now),
                dashboardMetrics: calculateDashboardMetrics(citas, medico.id_medico, now)
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
    const { id } = req.params;
    const cuerpo = req.body;
    const idValido = valor => Number.isInteger(valor) && valor > 0 && valor <= 2147483647;
    if (!/^[1-9]\d*$/.test(id) || !idValido(Number(id))) {
        return res.status(400).json({ mensaje: "ID de cita inválido" });
    }
    if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo)
        || Object.keys(cuerpo).length !== 1 || !idValido(cuerpo.estado_id)) {
        return res.status(400).json({ mensaje: "Envía únicamente un estado_id entero positivo" });
    }

    try {
        const medico = await Medico.findOne({ where: { usuario_id: req.usuario.id_usuario } });
        if (!medico) return res.status(404).json({ mensaje: "No se encontró el perfil del médico" });

        const destino = await EstadoCita.findByPk(cuerpo.estado_id, { attributes: ["id_estado", "nombre"] });
        if (!destino || !["En Curso", "Completada"].includes(destino.nombre)) {
            return res.status(400).json({ mensaje: "Estado de destino no permitido" });
        }

        // El bloqueo serializa cambios de esta cita y la respuesta se envía después del commit.
        const resultado = await Cita.sequelize.transaction(async transaction => {
            const cita = await Cita.findOne({
                where: { id_cita: Number(id), medico_id: medico.id_medico },
                attributes: ["id_cita", "estado_id", "fecha", "hora"],
                transaction, lock: transaction.LOCK.UPDATE
            });
            if (!cita) return { status: 404, mensaje: "Cita no encontrada para este médico" };

            const actual = await EstadoCita.findByPk(cita.estado_id, {
                attributes: ["nombre"], transaction
            });
            const iniciar = destino.nombre === "En Curso";
            const permitida = iniciar ? ["Pendiente", "Confirmada"].includes(actual?.nombre)
                : actual?.nombre === "En Curso";
            if (!permitida) return { status: 409, mensaje: "El estado actual no permite esta transición" };

            if (iniciar) {
                // Se toma la hora después de obtener el bloqueo, por si la petición tuvo que esperar.
                const now = new Date();
                if (!canStartAppointmentToday(cita, now)) {
                    return { status: 409, mensaje: "Solo puedes iniciar la cita en su fecha de Bogotá y desde la hora programada" };
                }
            } else {
                // En Curso puede finalizar otro día; el diagnóstico debe existir y conservarse al actualizar.
                const diagnostico = await Diagnostico.findOne({
                    where: { cita_id: cita.id_cita }, attributes: ["id_diagnostico", "diagnostico"],
                    transaction, lock: transaction.LOCK.UPDATE, logging: false
                });
                if (!textoDiagnosticoValido(diagnostico?.diagnostico)) return { status: 409, mensaje: "Debes guardar un diagnóstico válido antes de finalizar la cita" };
            }

            const [filasActualizadas] = await Cita.update({ estado_id: destino.id_estado }, {
                where: { id_cita: cita.id_cita, medico_id: medico.id_medico, estado_id: cita.estado_id },
                transaction
            });
            if (filasActualizadas !== 1) return { status: 409, mensaje: "La cita cambió de estado; recarga la agenda" };
            return { status: 200, mensaje: "Estado de la cita actualizado correctamente" };
        });

        const respuesta = { mensaje: resultado.mensaje };
        if (resultado.status === 200) Object.assign(respuesta, { id_cita: Number(id), estado_id: destino.id_estado });
        return res.status(resultado.status).json(respuesta);
    } catch {
        console.error("Error al actualizar el estado de la cita");
        return res.status(500).json({ mensaje: "Error al actualizar el estado de la cita" });
    }
};
export {
    dashboard,
    detallePaciente,
    actualizarEstadoCita
};
