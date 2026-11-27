import { Op } from "sequelize";
import { obtenerConfig, firmaValida, enviarTexto } from "../../services/whatsapp/cloudApi.js";
import { procesarMensaje } from "../../services/whatsapp/whatsappService.js";
import Notificacion from "../../models/Notificacion.js";
import Usuario from "../../models/Usuario.js";
import ConfiguracionNotificacion from "../../models/ConfiguracionNotificacion.js";

const PALABRAS_BAJA = new Set(["baja", "stop", "parar", "cancelar notificaciones"]);

// GET: handshake de verificación de Meta al registrar el webhook.
export const verificarWebhook = async (req, res) => {
    try {
        const cfg = await obtenerConfig();
        const { "hub.mode": modo, "hub.verify_token": token, "hub.challenge": reto } = req.query;
        if (modo === "subscribe" && cfg?.verifyToken && token === cfg.verifyToken) {
            return res.status(200).send(String(reto));
        }
        return res.sendStatus(403);
    } catch (error) {
        console.error("Error verificando webhook de WhatsApp:", error.message);
        return res.sendStatus(500);
    }
};

// Estados de entrega de Meta → tabla `notificaciones` (enlazada por el wamid).
const aplicarEstado = async (estado) => {
    const fila = await Notificacion.findOne({ where: { id_externo: estado.id } });
    if (!fila) return;

    const cuando = estado.timestamp ? new Date(Number(estado.timestamp) * 1000) : new Date();
    if (estado.status === "failed") {
        const detalle = estado.errors?.[0];
        await fila.update({
            estado: "Error",
            error_envio: String(detalle?.message || detalle?.title || "Meta no pudo entregar el mensaje.").slice(0, 1000),
        });
    } else if (estado.status === "delivered" || estado.status === "read") {
        await fila.update({ estado: "Enviada", fecha_entrega: fila.fecha_entrega || cuando });
    }
};

// Si el paciente escribe BAJA/STOP se desactiva el canal WhatsApp de sus notificaciones.
const darDeBaja = async (cfg, telefono) => {
    const ultimos = String(telefono).replace(/\D/g, "").slice(-10);
    const usuarios = await Usuario.findAll({ where: { telefono: { [Op.like]: `%${ultimos}` } } });
    for (const usuario of usuarios) {
        const [config] = await ConfiguracionNotificacion.findOrCreate({
            where: { usuario_id: usuario.id_usuario },
        });
        await config.update({ whatsapp: false });
    }
    await enviarTexto(cfg, telefono, "Listo, ya no recibirás notificaciones de SIGCMI por WhatsApp. Puedes volver a activarlas desde tu portal de paciente.");
};

// POST: eventos de Meta (mensajes entrantes y estados de entrega).
export const recibirWebhook = async (req, res) => {
    try {
        const cfg = await obtenerConfig();
        if (!cfg?.activo) return res.sendStatus(200);

        if (!firmaValida(req.rawBody, req.get("x-hub-signature-256"), cfg.appSecret)) {
            return res.sendStatus(401);
        }

        // Meta exige responder rápido; el procesamiento sigue en segundo plano.
        res.sendStatus(200);

        for (const entrada of req.body?.entry || []) {
            for (const cambio of entrada.changes || []) {
                const valor = cambio.value || {};

                for (const estado of valor.statuses || []) {
                    try {
                        await aplicarEstado(estado);
                    } catch (error) {
                        console.error("Error guardando estado de WhatsApp:", error.message);
                    }
                }

                for (const mensaje of valor.messages || []) {
                    if (mensaje.type !== "text") continue;
                    try {
                        const texto = mensaje.text.body.trim().toLowerCase();
                        if (PALABRAS_BAJA.has(texto)) {
                            await darDeBaja(cfg, mensaje.from);
                            continue;
                        }
                        const respuesta = await procesarMensaje(mensaje.from, mensaje.text.body);
                        await enviarTexto(cfg, mensaje.from, respuesta.mensaje);
                    } catch (error) {
                        console.error("Error respondiendo mensaje de WhatsApp:", error.message);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error procesando webhook de WhatsApp:", error.message);
        if (!res.headersSent) res.sendStatus(500);
    }
};
