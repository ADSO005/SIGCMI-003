const sesiones = new Map();

export const procesarMensaje = async (telefono, mensaje) => {

    const mensajeNormalizado = mensaje
        .trim()
        .toLowerCase();

    let sesion = sesiones.get(telefono);

    if (!sesion) {
        sesion = {
            estado: "INICIO",
            pacienteId: null,
            documento: null
        };

        sesiones.set(telefono, sesion);
    }

    // ==========================================
    // INICIO
    // ==========================================

    if (
        sesion.estado === "INICIO" &&
        (
            mensajeNormalizado.includes("hola") ||
            mensajeNormalizado.includes("buenos dias") ||
            mensajeNormalizado.includes("buenos días") ||
            mensajeNormalizado.includes("buenas tardes") ||
            mensajeNormalizado.includes("buenas noches")
        )
    ) {
        return {
            mensaje: `¡Hola! 👋 Bienvenido al asistente virtual de SIGCMI.

¿En qué puedo ayudarte?

1️⃣ Solicitar una cita
2️⃣ Consultar mis citas
3️⃣ Cancelar una cita
4️⃣ Reprogramar una cita`
        };
    }

    // ==========================================
    // SOLICITAR CITA
    // ==========================================

    if (
        sesion.estado === "INICIO" &&
        (
            mensajeNormalizado === "1" ||
            mensajeNormalizado.includes("quiero una cita") ||
            mensajeNormalizado.includes("solicitar una cita")
        )
    ) {

        sesion.estado = "ESPERANDO_DOCUMENTO";

        return {
            mensaje: `Claro que sí. 📅

Para solicitar una cita necesito validar tu identidad.

Por favor, ingresa tu número de documento.`
        };
    }

    // ==========================================
    // DOCUMENTO
    // ==========================================

    if (sesion.estado === "ESPERANDO_DOCUMENTO") {

        const documento = mensaje.trim();

        if (!/^\d+$/.test(documento)) {
            return {
                mensaje: `⚠️ El número de documento debe contener solamente números.

Por favor, ingresa nuevamente tu documento.`
            };
        }

        sesion.documento = documento;

        // Por ahora solamente guardamos el documento.
        // En el siguiente paso consultaremos la base de datos.

        sesion.estado = "DOCUMENTO_RECIBIDO";

        return {
            mensaje: `Perfecto. ✅

Recibí el documento:

${documento}

Ahora voy a validar tu información en SIGCMI.`
        };
    }

    // ==========================================
    // DOCUMENTO RECIBIDO
    // ==========================================

    if (sesion.estado === "DOCUMENTO_RECIBIDO") {

        return {
            mensaje: `Estoy procesando tu solicitud. ⏳`
        };
    }

    // ==========================================
    // MENSAJE NO RECONOCIDO
    // ==========================================

    return {
        mensaje: `No estoy seguro de haber entendido tu solicitud. 🤖

Puedes escribir:

• "Hola"
• "Quiero una cita"`
    };
};