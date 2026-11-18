import Medico from "../../models/Medico.js";
import Cita from "../../models/Cita.js";
import EstadoCita from "../../models/EstadoCita.js";
import Diagnostico from "../../models/Diagnostico.js";
import { camposClinicos, validarDiagnostico, datosDiagnostico, revisionDiagnostico } from "../../services/medico/diagnosticoService.js";

async function procesarDiagnostico(req, res, guardar) {
    res.set("Cache-Control", "no-store");
    const id = Number(req.params.id);
    if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isInteger(id) || id > 2147483647) {
        return res.status(400).json({ mensaje: "ID de cita inválido" });
    }
    const validacion = guardar ? validarDiagnostico(req.body) : null;
    if (validacion?.error) return res.status(400).json({ mensaje: validacion.error });
    try {
        const medico = await Medico.findOne({ where: { usuario_id: req.usuario.id_usuario } });
        if (!medico) return res.status(404).json({ mensaje: "No se encontró el perfil del médico" });

        const resultado = await Cita.sequelize.transaction(async transaction => {
            // Mismo orden que UH-013: primero la cita, después el diagnóstico.
            const cita = await Cita.findOne({
                where: { id_cita: id, medico_id: medico.id_medico }, attributes: ["id_cita", "estado_id"],
                transaction, lock: transaction.LOCK.UPDATE
            });
            if (!cita) return { status: 404, mensaje: "Cita no encontrada para este médico" };
            const estado = await EstadoCita.findByPk(cita.estado_id, { attributes: ["nombre"], transaction });
            if (estado?.nombre !== "En Curso") return { status: 409, mensaje: "Solo puedes registrar o editar el diagnóstico de una cita En Curso" };
            let registro = await Diagnostico.findOne({
                where: { cita_id: cita.id_cita }, attributes: ["id_diagnostico", "cita_id", "fecha_diagnostico", ...camposClinicos],
                transaction, lock: transaction.LOCK.UPDATE, logging: false
            });
            if (guardar) {
                if (validacion.revision !== revisionDiagnostico(registro)) {
                    return { status: 409, mensaje: "El diagnóstico cambió desde tu lectura. Consúltalo nuevamente antes de guardar" };
                }
                const creado = !registro;
                if (creado) {
                    registro = await Diagnostico.create({ ...validacion.datos, cita_id: cita.id_cita, fecha_diagnostico: new Date() }, { transaction, logging: false });
                } else {
                    await registro.update(validacion.datos, { transaction, logging: false });
                }
                return { status: creado ? 201 : 200, mensaje: creado ? "Diagnóstico creado" : "Diagnóstico actualizado",
                    diagnostico: datosDiagnostico(registro), revision: revisionDiagnostico(registro) };
            }
            return { status: 200, mensaje: "Diagnóstico consultado", diagnostico: datosDiagnostico(registro), revision: revisionDiagnostico(registro) };
        });
        const { status, ...respuesta } = resultado;
        return res.status(status).json(respuesta);
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({ mensaje: "Ya existe un diagnóstico para esta cita. Consúltalo nuevamente" });
        }
        // Los errores del ORM pueden contener SQL y valores clínicos; no se imprimen.
        console.error("Error al consultar o guardar el diagnóstico médico");
        return res.status(500).json({ mensaje: "No se pudo procesar el diagnóstico" });
    }
}

export const obtenerDiagnostico = (req, res) => procesarDiagnostico(req, res, false);
export const guardarDiagnostico = (req, res) => procesarDiagnostico(req, res, true);
