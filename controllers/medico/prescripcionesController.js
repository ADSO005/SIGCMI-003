import { consultarMedicamentos, guardarMedicamentos, validarSolicitudMedicamentos } from "../../services/medico/prescripcionesService.js";

function idCitaValido(valor) {
    return /^[1-9]\d*$/.test(valor) && Number.isSafeInteger(Number(valor)) && Number(valor) <= 2147483647;
}

export async function obtenerMedicamentos(req, res) {
    res.set("Cache-Control", "no-store");
    if (!idCitaValido(req.params.id)) return res.status(400).json({ mensaje: "ID de cita inválido" });
    try {
        const resultado = await consultarMedicamentos(Number(req.params.id), req.usuario.id_usuario);
        const { status, ...respuesta } = resultado;
        return res.status(status).json(respuesta);
    } catch {
        console.error("Error al consultar medicamentos de una cita médica");
        return res.status(500).json({ mensaje: "No se pudieron consultar los medicamentos" });
    }
}

export async function guardarMedicamentosCita(req, res) {
    res.set("Cache-Control", "no-store");
    if (!idCitaValido(req.params.id)) return res.status(400).json({ mensaje: "ID de cita inválido" });
    const validacion = validarSolicitudMedicamentos(req.body);
    if (validacion.error) return res.status(400).json({ mensaje: validacion.error });
    try {
        const resultado = await guardarMedicamentos(Number(req.params.id), req.usuario.id_usuario, validacion.datos);
        const { status, ...respuesta } = resultado;
        return res.status(status).json(respuesta);
    } catch {
        console.error("Error al guardar medicamentos de una cita médica");
        return res.status(500).json({ mensaje: "No se pudieron guardar los medicamentos" });
    }
}
