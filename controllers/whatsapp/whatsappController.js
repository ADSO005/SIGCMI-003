export const recibirMensaje = async (req, res) => {
    try {
        const { telefono, mensaje } = req.body;

        console.log("📱 Mensaje recibido por WhatsApp");
        console.log("📞 Teléfono:", telefono);
        console.log("💬 Mensaje:", mensaje);

        return res.status(200).json({
            success: true,
            mensaje: "¡Hola! 👋 Soy el asistente virtual de SIGCMI."
        });

    } catch (error) {
        console.error("❌ Error procesando mensaje de WhatsApp:", error);

        return res.status(500).json({
            success: false,
            mensaje: "Ocurrió un error procesando el mensaje."
        });
    }
};