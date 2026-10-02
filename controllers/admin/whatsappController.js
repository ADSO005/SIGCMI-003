export const recibirMensaje = async (req, res) => {
    try {
        const { telefono, mensaje } = req.body;

        console.log("📱 Mensaje recibido por WhatsApp");
        console.log("Teléfono:", telefono);
        console.log("Mensaje:", mensaje);

        const respuesta = {
            mensaje: "¡Hola! 👋 Soy el asistente virtual de SIGCMI."
        };

        return res.status(200).json(respuesta);

    } catch (error) {
        console.error("❌ Error procesando mensaje de WhatsApp:", error);

        return res.status(500).json({
            mensaje: "Ocurrió un error procesando tu mensaje."
        });
    }
};