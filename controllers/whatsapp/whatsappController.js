import { procesarMensaje } from "../../services/whatsapp/whatsappService.js";

export const recibirMensaje = async (req, res) => {
    try {
        const { telefono, mensaje } = req.body;

        if (!telefono || !mensaje) {
            return res.status(400).json({
                success: false,
                mensaje: "El teléfono y el mensaje son obligatorios."
            });
        }

        console.log("📱 Mensaje recibido por WhatsApp");
        console.log("📞 Teléfono:", telefono);
        console.log("💬 Mensaje:", mensaje);

        const respuesta = await procesarMensaje(
            telefono,
            mensaje
        );

        return res.status(200).json({
            success: true,
            mensaje: respuesta.mensaje
        });

    } catch (error) {
        console.error(
            "❌ Error procesando mensaje de WhatsApp:",
            error
        );

        return res.status(500).json({
            success: false,
            mensaje: "Ocurrió un error procesando el mensaje."
        });
    }
};