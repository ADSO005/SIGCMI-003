import { randomBytes } from "node:crypto";
import ConfiguracionWhatsApp from "../../models/ConfiguracionWhatsApp.js";
import { cifrar } from "../../utils/cifrado.js";
import {
    obtenerConfig,
    verificarCredenciales,
    enviarPlantilla,
    listarPlantillas,
    normalizarTelefono,
} from "../../services/whatsapp/cloudApi.js";

const limpiar = (valor) => (typeof valor === "string" ? valor.trim() : "");

// Nunca se devuelven los secretos a la vista: solo si están configurados.
const vistaConfig = (cfg) => ({
    phoneNumberId: cfg?.phoneNumberId || "",
    wabaId: cfg?.wabaId || "",
    apiVersion: cfg?.apiVersion || "v21.0",
    codigoPais: cfg?.codigoPais || "57",
    activo: Boolean(cfg?.activo),
    tieneToken: Boolean(cfg?.accessToken),
    tieneAppSecret: Boolean(cfg?.appSecret),
    tieneVerifyToken: Boolean(cfg?.verifyToken),
    numeroVisible: cfg?.fila?.numero_visible || null,
    nombreVerificado: cfg?.fila?.nombre_verificado || null,
    ultimaVerificacion: cfg?.fila?.ultima_verificacion || null,
    ultimoError: cfg?.fila?.ultimo_error || null,
});

export const verConfiguracionWhatsApp = async (req, res) => {
    try {
        const cfg = await obtenerConfig();
        res.render("viewsAdmin/whatsApp/dashboard", {
            usuarios: req.usuario,
            config: vistaConfig(cfg),
            webhookUrl: `${(process.env.BACKEND_URL || "").replace(/\/$/, "")}/whatsapp/webhook`,
            mensaje: req.query.ok || null,
            error: req.query.error || null,
        });
    } catch (error) {
        console.error("Error al cargar la configuración de WhatsApp:", error.message);
        res.status(500).send("No se pudo cargar la configuración de WhatsApp.");
    }
};

export const guardarConfiguracionWhatsApp = async (req, res) => {
    try {
        const phoneNumberId = limpiar(req.body.phone_number_id);
        const wabaId = limpiar(req.body.waba_id);
        const apiVersion = limpiar(req.body.api_version) || "v21.0";
        const codigoPais = limpiar(req.body.codigo_pais).replace(/\D/g, "") || "57";

        if (!/^\d{5,30}$/.test(phoneNumberId)) {
            return res.redirect("/admin/whatsapp?error=" + encodeURIComponent("El Phone Number ID debe ser numérico."));
        }
        if (wabaId && !/^\d{5,30}$/.test(wabaId)) {
            return res.redirect("/admin/whatsapp?error=" + encodeURIComponent("El WhatsApp Business Account ID debe ser numérico."));
        }
        if (!/^v\d{1,2}\.\d$/.test(apiVersion)) {
            return res.redirect("/admin/whatsapp?error=" + encodeURIComponent("La versión de la API debe tener el formato v21.0."));
        }

        const existente = await ConfiguracionWhatsApp.findOne({ order: [["id_configuracion", "ASC"]] });

        const datos = {
            phone_number_id: phoneNumberId,
            waba_id: wabaId || null,
            api_version: apiVersion,
            codigo_pais: codigoPais,
            activo: req.body.activo === "on",
            actualizado_por: req.usuario?.id_usuario ?? null,
            actualizado_en: new Date(),
        };

        // Los secretos solo se reemplazan si se escribe un valor nuevo.
        const token = limpiar(req.body.access_token);
        const appSecret = limpiar(req.body.app_secret);
        const verifyToken = limpiar(req.body.verify_token);
        if (token) datos.access_token = cifrar(token);
        if (appSecret) datos.app_secret = cifrar(appSecret);
        if (verifyToken) datos.verify_token = cifrar(verifyToken);
        else if (!existente?.verify_token) datos.verify_token = cifrar(randomBytes(24).toString("hex"));

        if (datos.activo && !(token || existente?.access_token)) {
            return res.redirect("/admin/whatsapp?error=" + encodeURIComponent("Ingresa el Access Token antes de activar la integración."));
        }

        if (existente) await existente.update(datos);
        else await ConfiguracionWhatsApp.create(datos);

        res.redirect("/admin/whatsapp?ok=" + encodeURIComponent("Configuración guardada."));
    } catch (error) {
        console.error("Error al guardar la configuración de WhatsApp:", error.message);
        res.redirect("/admin/whatsapp?error=" + encodeURIComponent("No se pudo guardar la configuración."));
    }
};

export const probarConexionWhatsApp = async (req, res) => {
    const cfg = await obtenerConfig().catch(() => null);
    try {
        const info = await verificarCredenciales(cfg);
        await cfg.fila.update({
            numero_visible: info.display_phone_number || null,
            nombre_verificado: info.verified_name || null,
            ultima_verificacion: new Date(),
            ultimo_error: null,
        });
        res.redirect("/admin/whatsapp?ok=" + encodeURIComponent(`Conexión correcta: ${info.verified_name || ""} ${info.display_phone_number || ""}`.trim()));
    } catch (error) {
        await cfg?.fila?.update({ ultimo_error: error.message, ultima_verificacion: new Date() }).catch(() => {});
        res.redirect("/admin/whatsapp?error=" + encodeURIComponent(`Meta rechazó la conexión: ${error.message}`));
    }
};

// Envío de prueba: plantilla hello_world (la trae toda cuenta nueva) o plantilla indicada.
export const probarEnvioWhatsApp = async (req, res) => {
    try {
        const cfg = await obtenerConfig();
        const telefono = normalizarTelefono(req.body.telefono, cfg?.codigoPais);
        if (!telefono || telefono.length < 11) {
            return res.redirect("/admin/whatsapp?error=" + encodeURIComponent("Ingresa un teléfono válido."));
        }
        const plantilla = limpiar(req.body.plantilla) || "hello_world";
        const idioma = limpiar(req.body.idioma) || (plantilla === "hello_world" ? "en_US" : "es");
        await enviarPlantilla(cfg, telefono, plantilla, [], idioma);
        res.redirect("/admin/whatsapp?ok=" + encodeURIComponent(`Mensaje de prueba enviado a ${telefono}.`));
    } catch (error) {
        res.redirect("/admin/whatsapp?error=" + encodeURIComponent(`No se pudo enviar: ${error.message}`));
    }
};

export const listarPlantillasWhatsApp = async (req, res) => {
    try {
        const cfg = await obtenerConfig();
        const datos = await listarPlantillas(cfg);
        res.json({ success: true, plantillas: datos.data || [] });
    } catch (error) {
        res.status(400).json({ success: false, mensaje: error.message });
    }
};
