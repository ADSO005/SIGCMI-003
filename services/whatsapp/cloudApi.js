import { createHmac, timingSafeEqual } from "node:crypto";
import ConfiguracionWhatsApp from "../../models/ConfiguracionWhatsApp.js";
import { descifrar } from "../../utils/cifrado.js";

const GRAPH = "https://graph.facebook.com";

export const obtenerConfig = async () => {
    const fila = await ConfiguracionWhatsApp.findOne({ order: [["id_configuracion", "ASC"]] });
    if (!fila) return null;
    return {
        fila,
        phoneNumberId: fila.phone_number_id,
        wabaId: fila.waba_id,
        accessToken: descifrar(fila.access_token),
        appSecret: descifrar(fila.app_secret),
        verifyToken: descifrar(fila.verify_token),
        apiVersion: fila.api_version || "v21.0",
        codigoPais: fila.codigo_pais || "57",
        activo: fila.activo,
    };
};

// Deja solo dígitos y antepone el código de país si falta (móviles colombianos: 10 dígitos).
export const normalizarTelefono = (telefono, codigoPais = "57") => {
    const digitos = String(telefono || "").replace(/\D/g, "");
    if (!digitos) return null;
    if (digitos.length === 10) return codigoPais + digitos;
    return digitos;
};

const llamar = async (cfg, ruta, { method = "GET", body } = {}) => {
    const respuesta = await fetch(`${GRAPH}/${cfg.apiVersion}/${ruta}`, {
        method,
        headers: {
            Authorization: `Bearer ${cfg.accessToken}`,
            ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(20000),
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
        const error = new Error(datos?.error?.message || `Meta respondió HTTP ${respuesta.status}.`);
        error.code = datos?.error?.code;
        error.status = respuesta.status;
        throw error;
    }
    return datos;
};

const exigirCredenciales = (cfg) => {
    if (!cfg?.accessToken || !cfg?.phoneNumberId) {
        throw new Error("Faltan el Phone Number ID o el Access Token de WhatsApp.");
    }
};

// Consulta el número en Meta: confirma que token e ID son válidos.
export const verificarCredenciales = async (cfg) => {
    exigirCredenciales(cfg);
    return llamar(cfg, `${cfg.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`);
};

// Texto libre: solo llega si el paciente escribió en las últimas 24 h.
export const enviarTexto = async (cfg, telefono, texto) => {
    exigirCredenciales(cfg);
    return llamar(cfg, `${cfg.phoneNumberId}/messages`, {
        method: "POST",
        body: {
            messaging_product: "whatsapp",
            to: normalizarTelefono(telefono, cfg.codigoPais),
            type: "text",
            text: { body: texto, preview_url: false },
        },
    });
};

// Plantilla aprobada: único tipo permitido para iniciar conversación (recordatorios, etc.).
export const enviarPlantilla = async (cfg, telefono, nombre, parametros = [], idioma = "es") => {
    exigirCredenciales(cfg);
    return llamar(cfg, `${cfg.phoneNumberId}/messages`, {
        method: "POST",
        body: {
            messaging_product: "whatsapp",
            to: normalizarTelefono(telefono, cfg.codigoPais),
            type: "template",
            template: {
                name: nombre,
                language: { code: idioma },
                components: parametros.length
                    ? [{ type: "body", parameters: parametros.map((text) => ({ type: "text", text: String(text) })) }]
                    : [],
            },
        },
    });
};

export const listarPlantillas = async (cfg) => {
    if (!cfg?.wabaId) throw new Error("Falta el WhatsApp Business Account ID.");
    return llamar(cfg, `${cfg.wabaId}/message_templates?fields=name,status,language,category&limit=100`);
};

// Valida X-Hub-Signature-256 sobre el cuerpo crudo.
export const firmaValida = (rawBody, cabecera, appSecret) => {
    if (!rawBody || !cabecera || !appSecret) return false;
    const esperado = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
    const a = Buffer.from(esperado);
    const b = Buffer.from(cabecera);
    return a.length === b.length && timingSafeEqual(a, b);
};
