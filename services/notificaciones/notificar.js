import ConfiguracionNotificacion from "../../models/ConfiguracionNotificacion.js";
import Notificacion from "../../models/Notificacion.js";
import Cita from "../../models/Cita.js";
import Paciente from "../../models/Paciente.js";
import Usuario from "../../models/Usuario.js";
import { sendAppointmentNotificationEmail } from "../emailService.js";
import { obtenerConfig, enviarPlantilla } from "../whatsapp/cloudApi.js";

// Plantillas Meta (idioma "es"). Parámetros del cuerpo: {{1}} nombre, {{2}} fecha, {{3}} hora.
const PLANTILLAS_WHATSAPP = {
    confirmacion_cita: "cita_confirmada",
    reprogramacion: "cita_reprogramada",
    cancelacion_cita: "cita_cancelada",
    recordatorio_24h: "recordatorio_24h",
    recordatorio_1h: "recordatorio_1h",
};

const TITULOS = {
    confirmacion_cita: "Cita registrada",
    reprogramacion: "Cita reprogramada",
    cancelacion_cita: "Cita cancelada",
    recordatorio_24h: "Recordatorio de cita (24 h)",
    recordatorio_1h: "Recordatorio de cita (1 h)",
};

// Los recordatorios solo salen por WhatsApp; el correo cubre los avisos de acción.
const EVENTOS_CON_CORREO = new Set(["confirmacion_cita", "reprogramacion", "cancelacion_cita"]);

const primerNombre = (usuario) => String(usuario.nombres || "").trim().split(/\s+/)[0] || "paciente";

// Registra el intento en `notificaciones` y ejecuta el envío sin propagar errores.
// `enviar` puede devolver el id del mensaje de Meta para enlazar sus estados de entrega.
const registrar = async (usuario, evento, canal, cita, enviar) => {
    const fila = await Notificacion.create({
        usuario_id: usuario.id_usuario,
        enviado_por: usuario.id_usuario,
        titulo: TITULOS[evento],
        mensaje: `${TITULOS[evento]} (${canal})`,
        canal,
        tipo: "Automatica",
        estado: "Pendiente",
        cita_id: cita?.id_cita ?? null,
        evento,
    }).catch((error) => {
        console.error("No se pudo registrar la notificación:", error.message);
        return null;
    });

    try {
        const idExterno = await enviar();
        await fila?.update({
            estado: "Enviada",
            id_externo: idExterno || null,
            // En WhatsApp la entrega real la confirma el webhook; en correo se asume al enviar.
            fecha_entrega: canal === "WhatsApp" ? null : new Date(),
        });
    } catch (error) {
        console.error(`Falló la notificación por ${canal}:`, { code: error.code, message: error.message });
        await fila?.update({ estado: "Error", error_envio: String(error.message).slice(0, 1000) });
    }
};

// Punto único para avisos de citas. Respeta las preferencias del usuario;
// sin fila de configuración se aplican los valores por defecto del modelo.
export async function notificar(usuario, cita, evento) {
    if (!TITULOS[evento]) throw new Error("Evento de notificación no válido.");

    const preferencias = await ConfiguracionNotificacion.findOne({ where: { usuario_id: usuario.id_usuario } });
    const permitido = (campo) => !preferencias || Boolean(preferencias[campo]);
    if (!permitido(evento)) return;

    const tareas = [];

    if (EVENTOS_CON_CORREO.has(evento) && permitido("correo") && usuario.correo) {
        tareas.push(registrar(usuario, evento, "Correo", cita, async () => {
            await sendAppointmentNotificationEmail(usuario, cita, evento);
        }));
    }

    if (permitido("whatsapp") && usuario.telefono) {
        tareas.push(registrar(usuario, evento, "WhatsApp", cita, async () => {
            const cfg = await obtenerConfig();
            if (!cfg?.activo) throw new Error("La integración de WhatsApp está inactiva.");
            const respuesta = await enviarPlantilla(cfg, usuario.telefono, PLANTILLAS_WHATSAPP[evento], [
                primerNombre(usuario),
                String(cita.fecha),
                String(cita.hora).slice(0, 5),
            ]);
            return respuesta?.messages?.[0]?.id;
        }));
    }

    await Promise.all(tareas);
}

// Para flujos que solo tienen el id de la cita (admin, bot de WhatsApp).
// No bloquea ni rompe la acción principal: cualquier error solo se registra.
export function notificarCitaPorId(idCita, evento) {
    (async () => {
        const cita = await Cita.findByPk(idCita, {
            include: [{ model: Paciente, include: [{ model: Usuario }] }],
        });
        const usuario = cita?.Paciente?.Usuario;
        if (!usuario) return;
        await notificar(usuario, cita, evento);
    })().catch((error) => {
        console.error("No se pudo enviar la notificación de cita:", { evento, message: error.message });
    });
}
