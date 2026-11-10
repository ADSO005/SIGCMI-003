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
import { medicamentoPersistidoValido } from "../../services/medico/prescripcionesService.js";

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
        const estadoCompletada = contextoConsulta
            ? await EstadoCita.findOne({ where: { nombre: "Completada" }, attributes: ["id_estado"] }) : null;

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
                estadoCompletadaId: estadoCompletada?.id_estado,
                citaFinalizada: typeof req.query.citaFinalizada === "string"
                    && citas.some(cita => String(cita.id_cita) === req.query.citaFinalizada && cita.Estado?.nombre === "Completada"),
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
        if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) {
            return res.status(400).json({ mensaje: "ID de paciente inválido" });
        }

        const medico = await Medico.findOne({
            where: { usuario_id: req.usuario.id_usuario },
            attributes: ["id_medico"]
        });
        if (!medico) {
            return res.status(404).json({ mensaje: "No se encontró el perfil del médico" });
        }

        // La asociación Diagnostico usa alias y las citas se limitan al médico autenticado.
        const citas = await Cita.findAll({
            where: { paciente_id: Number(id), medico_id: medico.id_medico },
            attributes: ["id_cita", "fecha", "hora", "motivo_consulta"],
            include: [
                {
                    model: Diagnostico,
                    as: "Diagnostico",
                    attributes: ["diagnostico", "sintomas", "tratamiento", "decision_medicamentos"],
                    include: [{
                        model: Prescripcion,
                        as: "Prescripcions",
                        attributes: ["nombre_medicamento", "dosis", "frecuencia", "duracion"],
                        required: false
                    }],
                    required: false
                },
                {
                    model: EstadoCita,
                    as: "Estado",
                    attributes: ["nombre"],
                    required: false
                }
            ],
            order: [["fecha", "DESC"], ["hora", "DESC"]]
        });

        if (citas.length === 0) {
            return res.status(404).json({ mensaje: "Paciente no disponible o sin citas vinculadas a este médico" });
        }

        const paciente = await Paciente.findByPk(Number(id), {
            attributes: ["fecha_nacimiento"],
            include: [{
                model: Usuario,
                attributes: ["nombres", "apellidos", "correo", "telefono"]
            }]
        });
        if (!paciente) {
            return res.status(404).json({ mensaje: "Paciente no disponible o sin citas vinculadas a este médico" });
        }

        return res.json({
            paciente: {
                fecha_nacimiento: paciente.fecha_nacimiento,
                Usuario: paciente.Usuario ? {
                    nombres: paciente.Usuario.nombres,
                    apellidos: paciente.Usuario.apellidos,
                    correo: paciente.Usuario.correo,
                    telefono: paciente.Usuario.telefono
                } : null
            },
            citas: citas.map(cita => ({
                fecha: cita.fecha,
                hora: cita.hora,
                motivo_consulta: cita.motivo_consulta,
                Estado: cita.Estado ? { nombre: cita.Estado.nombre } : null,
                Diagnostico: cita.Diagnostico ? {
                    diagnostico: cita.Diagnostico.diagnostico,
                    sintomas: cita.Diagnostico.sintomas,
                    tratamiento: cita.Diagnostico.tratamiento,
                    decision_medicamentos: cita.Diagnostico.decision_medicamentos,
                    medicamentos: (cita.Diagnostico.Prescripcions || []).map(medicamento => ({
                        nombre_medicamento: medicamento.nombre_medicamento,
                        dosis: medicamento.dosis,
                        frecuencia: medicamento.frecuencia,
                        duracion: medicamento.duracion
                    }))
                } : null
            }))
        });
    } catch {
        console.error("Error al cargar el detalle de paciente del médico");
        return res.status(500).json({ mensaje: "Error al cargar el paciente" });
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
                    where: { cita_id: cita.id_cita }, attributes: ["id_diagnostico", "diagnostico", "decision_medicamentos"],
                    transaction, lock: transaction.LOCK.UPDATE, logging: false
                });
                if (!textoDiagnosticoValido(diagnostico?.diagnostico)) return { status: 409, mensaje: "Debes guardar un diagnóstico válido antes de finalizar la cita" };

                // El orden cita → diagnóstico → prescripciones es compartido con el guardado de medicamentos.
                if (!["Requiere", "No requiere"].includes(diagnostico.decision_medicamentos)) {
                    return { status: 409, mensaje: "Debes registrar la decisión de medicamentos antes de finalizar la cita" };
                }
                const prescripciones = await Prescripcion.findAll({
                    where: { diagnostico_id: diagnostico.id_diagnostico },
                    attributes: ["id_prescripcion", "nombre_medicamento", "dosis", "frecuencia", "duracion"],
                    transaction, lock: transaction.LOCK.UPDATE, logging: false
                });
                if (diagnostico.decision_medicamentos === "Requiere"
                    && !prescripciones.some(medicamentoPersistidoValido)) {
                    return { status: 409, mensaje: "Debes tener al menos un medicamento válido guardado antes de finalizar la cita" };
                }
                if (diagnostico.decision_medicamentos === "No requiere" && prescripciones.length > 0) {
                    return { status: 409, mensaje: "La decisión No requiere no puede tener medicamentos registrados" };
                }
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
