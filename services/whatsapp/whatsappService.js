export const procesarMensaje = async (telefono, mensaje) => {

    const mensajeNormalizado = mensaje
        .trim()
        .toLowerCase();

    if (
        mensajeNormalizado.includes("hola") ||
        mensajeNormalizado.includes("buenos dias") ||
        mensajeNormalizado.includes("buenos días") ||
        mensajeNormalizado.includes("buenas tardes") ||
        mensajeNormalizado.includes("buenas noches")
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

    if (
        mensajeNormalizado.includes("cita") ||
        mensajeNormalizado.includes("quiero una cita") ||
        mensajeNormalizado.includes("solicitar una cita")
    ) {
        return {
            mensaje: `Claro que sí. 📅

Para solicitar una cita necesito validar tu identidad.

Por favor, ingresa tu número de documento.`
        };
    }

    return {
        mensaje: `No estoy seguro de haber entendido tu solicitud. 🤖

Puedes escribir, por ejemplo:

• "Quiero una cita"
• "Consultar mis citas"
• "Cancelar una cita"
• "Reprogramar una cita"`
    };
};