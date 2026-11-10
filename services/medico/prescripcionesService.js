import Medico from "../../models/Medico.js";
import Cita from "../../models/Cita.js";
import EstadoCita from "../../models/EstadoCita.js";
import Diagnostico from "../../models/Diagnostico.js";
import Prescripcion from "../../models/Prescripcion.js";
import { textoDiagnosticoValido } from "./diagnosticoService.js";

const camposSolicitud = ["decision_medicamentos", "version_prescripciones", "medicamentos"];
const camposMedicamento = ["nombre_medicamento", "dosis", "frecuencia", "duracion"];
const longitudesMedicamento = { nombre_medicamento: 150, dosis: 100, frecuencia: 100, duracion: 100 };
const decisionesPermitidas = ["Requiere", "No requiere"];

function textoValido(valor, maximo) {
    return typeof valor === "string" && valor.trim().length > 0 && [...valor.trim()].length <= maximo;
}

export function medicamentoPersistidoValido(medicamento) {
    return camposMedicamento.every(campo => textoValido(medicamento?.[campo], longitudesMedicamento[campo]));
}

export function validarSolicitudMedicamentos(cuerpo) {
    if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo)
        || Object.keys(cuerpo).length !== camposSolicitud.length
        || Object.keys(cuerpo).some(campo => !camposSolicitud.includes(campo))) {
        return { error: "Envía únicamente decision_medicamentos, version_prescripciones y medicamentos" };
    }
    if (!decisionesPermitidas.includes(cuerpo.decision_medicamentos)) {
        return { error: "La decisión debe ser Requiere o No requiere" };
    }
    if (!Number.isInteger(cuerpo.version_prescripciones)
        || cuerpo.version_prescripciones < 0 || cuerpo.version_prescripciones > 4294967295) {
        return { error: "version_prescripciones debe ser un entero no negativo válido" };
    }
    if (!Array.isArray(cuerpo.medicamentos)) {
        return { error: "medicamentos debe ser una lista" };
    }
    if (cuerpo.decision_medicamentos === "No requiere" && cuerpo.medicamentos.length > 0) {
        return { error: "No envíes medicamentos cuando la decisión sea No requiere" };
    }

    const medicamentos = [];
    for (const medicamento of cuerpo.medicamentos) {
        if (!medicamento || typeof medicamento !== "object" || Array.isArray(medicamento)
            || Object.keys(medicamento).length !== camposMedicamento.length
            || Object.keys(medicamento).some(campo => !camposMedicamento.includes(campo))) {
            return { error: "Cada medicamento debe incluir únicamente nombre, dosis, frecuencia y duración" };
        }
        for (const campo of camposMedicamento) {
            if (!textoValido(medicamento[campo], longitudesMedicamento[campo])) {
                return { error: `${campo} es obligatorio y no debe superar ${longitudesMedicamento[campo]} caracteres` };
            }
        }
        medicamentos.push(Object.fromEntries(camposMedicamento.map(campo => [campo, medicamento[campo].trim()])));
    }
    return {
        datos: {
            decision_medicamentos: cuerpo.decision_medicamentos,
            version_prescripciones: cuerpo.version_prescripciones,
            medicamentos
        }
    };
}

function presentarMedicamento(registro) {
    return {
        id_prescripcion: registro.id_prescripcion,
        nombre_medicamento: registro.nombre_medicamento,
        dosis: registro.dosis,
        frecuencia: registro.frecuencia,
        duracion: registro.duracion
    };
}

export async function consultarMedicamentos(idCita, idUsuario) {
    const medico = await Medico.findOne({ where: { usuario_id: idUsuario }, attributes: ["id_medico"] });
    if (!medico) return { status: 404, mensaje: "No se encontró el perfil del médico" };

    return Cita.sequelize.transaction(async transaction => {
        const cita = await Cita.findOne({
            where: { id_cita: idCita, medico_id: medico.id_medico },
            attributes: ["id_cita"], transaction
        });
        if (!cita) return { status: 404, mensaje: "Cita no encontrada para este médico" };

        const diagnostico = await Diagnostico.findOne({
            where: { cita_id: cita.id_cita },
            attributes: ["id_diagnostico", "diagnostico", "decision_medicamentos", "version_prescripciones"],
            transaction, logging: false
        });
        if (!diagnostico || !textoDiagnosticoValido(diagnostico.diagnostico)) {
            return { status: 409, mensaje: "Debes guardar un diagnóstico válido antes de consultar los medicamentos" };
        }

        const medicamentos = await Prescripcion.findAll({
            where: { diagnostico_id: diagnostico.id_diagnostico },
            attributes: ["id_prescripcion", "nombre_medicamento", "dosis", "frecuencia", "duracion"],
            order: [["id_prescripcion", "ASC"]], transaction, logging: false
        });
        return {
            status: 200,
            mensaje: "Medicamentos consultados",
            id_diagnostico: diagnostico.id_diagnostico,
            decision_medicamentos: diagnostico.decision_medicamentos,
            version_prescripciones: Number(diagnostico.version_prescripciones),
            medicamentos: medicamentos.map(presentarMedicamento)
        };
    });
}

export async function guardarMedicamentos(idCita, idUsuario, datos) {
    const medico = await Medico.findOne({ where: { usuario_id: idUsuario }, attributes: ["id_medico"] });
    if (!medico) return { status: 404, mensaje: "No se encontró el perfil del médico" };

    return Cita.sequelize.transaction(async transaction => {
        // Todos los cambios clínicos bloquean primero la cita y después el diagnóstico.
        const cita = await Cita.findOne({
            where: { id_cita: idCita, medico_id: medico.id_medico },
            attributes: ["id_cita", "estado_id"], transaction, lock: transaction.LOCK.UPDATE
        });
        if (!cita) return { status: 404, mensaje: "Cita no encontrada para este médico" };

        const estado = await EstadoCita.findByPk(cita.estado_id, { attributes: ["nombre"], transaction });
        if (estado?.nombre !== "En Curso") {
            return { status: 409, mensaje: "Solo puedes guardar medicamentos mientras la cita esté En Curso" };
        }

        const diagnostico = await Diagnostico.findOne({
            where: { cita_id: cita.id_cita },
            attributes: ["id_diagnostico", "diagnostico", "decision_medicamentos", "version_prescripciones"],
            transaction, lock: transaction.LOCK.UPDATE, logging: false
        });
        if (!diagnostico || !textoDiagnosticoValido(diagnostico.diagnostico)) {
            return { status: 409, mensaje: "Debes guardar un diagnóstico válido antes de registrar medicamentos" };
        }

        const versionActual = Number(diagnostico.version_prescripciones);
        if (datos.version_prescripciones !== versionActual) {
            return { status: 409, mensaje: "La lista de medicamentos cambió en otra sesión. Consúltala nuevamente antes de guardar" };
        }
        if (versionActual >= 4294967295) {
            return { status: 409, mensaje: "La versión de medicamentos alcanzó su límite; no se puede actualizar" };
        }

        const existentes = await Prescripcion.findAll({
            where: { diagnostico_id: diagnostico.id_diagnostico },
            attributes: ["id_prescripcion", "nombre_medicamento", "dosis", "frecuencia", "duracion"],
            order: [["id_prescripcion", "ASC"]], transaction, lock: transaction.LOCK.UPDATE, logging: false
        });
        if (datos.decision_medicamentos === "No requiere" && existentes.length > 0) {
            return { status: 409, mensaje: "No se puede marcar No requiere porque ya hay medicamentos guardados" };
        }
        if (datos.decision_medicamentos === "Requiere"
            && datos.medicamentos.length === 0
            && !existentes.some(medicamentoPersistidoValido)) {
            return { status: 400, mensaje: "Agrega al menos un medicamento válido para guardar la decisión Requiere" };
        }

        const versionNueva = versionActual + 1;
        const [filasActualizadas] = await Diagnostico.update({
            decision_medicamentos: datos.decision_medicamentos,
            version_prescripciones: versionNueva
        }, {
            where: {
                id_diagnostico: diagnostico.id_diagnostico,
                cita_id: cita.id_cita,
                version_prescripciones: versionActual
            }, transaction, logging: false
        });
        if (filasActualizadas !== 1) {
            return { status: 409, mensaje: "La lista de medicamentos cambió; consúltala nuevamente antes de guardar" };
        }

        if (datos.medicamentos.length > 0) {
            await Prescripcion.bulkCreate(datos.medicamentos.map(medicamento => ({
                ...medicamento, diagnostico_id: diagnostico.id_diagnostico
            })), { transaction, logging: false });
        }

        const guardados = await Prescripcion.findAll({
            where: { diagnostico_id: diagnostico.id_diagnostico },
            attributes: ["id_prescripcion", "nombre_medicamento", "dosis", "frecuencia", "duracion"],
            order: [["id_prescripcion", "ASC"]], transaction, logging: false
        });
        return {
            status: 200,
            mensaje: "Decisión y medicamentos guardados",
            id_diagnostico: diagnostico.id_diagnostico,
            decision_medicamentos: datos.decision_medicamentos,
            version_prescripciones: versionNueva,
            medicamentos: guardados.map(presentarMedicamento)
        };
    });
}
