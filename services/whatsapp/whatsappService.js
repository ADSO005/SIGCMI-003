import Usuario from "../../models/Usuario.js";
import Paciente from "../../models/Paciente.js";

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
            usuarioId: null,
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
    // VALIDAR DOCUMENTO
    // ==========================================

    if (sesion.estado === "ESPERANDO_DOCUMENTO") {

        const documento = mensaje.trim();

        if (!/^\d+$/.test(documento)) {
            return {
                mensaje: `⚠️ El número de documento debe contener solamente números.

Por favor, ingresa nuevamente tu documento.`
            };
        }

        try {

            const usuario = await Usuario.findOne({
                where: {
                    numero_documento: documento,
                    rol_id: 3,
                    estado: true
                },
                include: [
                    {
                        model: Paciente,
                        required: true
                    }
                ]
            });

            // ==========================================
            // PACIENTE NO ENCONTRADO
            // ==========================================

            if (!usuario) {

                sesion.estado = "INICIO";

                return {
                    mensaje: `❌ No encontramos un paciente activo asociado al documento ingresado.

Verifica que el número sea correcto.

Si consideras que tus datos deberían estar registrados en SIGCMI, comunícate con la institución.`
                };
            }

            // ==========================================
            // PACIENTE ENCONTRADO
            // ==========================================

            sesion.documento = documento;
            sesion.usuarioId = usuario.id_usuario;
            sesion.pacienteId = usuario.Paciente.id_paciente;
            sesion.estado = "PACIENTE_VALIDADO";

            return {
                mensaje: `✅ Identidad encontrada correctamente.

Hola ${usuario.nombres} ${usuario.apellidos} 👋

Tu información ya se encuentra registrada en SIGCMI.

No necesitas ingresar al portal web para solicitar tu cita.

¿Qué deseas hacer?

1️⃣ Solicitar una cita
2️⃣ Consultar mis citas
3️⃣ Cancelar una cita
4️⃣ Reprogramar una cita`
            };

        } catch (error) {

            console.error(
                "❌ Error validando paciente:",
                error
            );

            return {
                mensaje: "Ocurrió un error al validar tu información. Inténtalo nuevamente."
            };
        }
    }

    // ==========================================
    // PACIENTE VALIDADO
    // ==========================================

    if (sesion.estado === "PACIENTE_VALIDADO") {

        if (mensajeNormalizado === "1") {

            sesion.estado = "SOLICITANDO_CITA";

            return {
                mensaje: `Perfecto. 📅

Vamos a solicitar tu cita.

Primero selecciona la especialidad que necesitas.`
            };
        }

        if (mensajeNormalizado === "2") {

            return {
                mensaje: `📋 Consulta de citas.

Esta funcionalidad la conectaremos con tus citas registradas en SIGCMI.`
            };
        }

        if (mensajeNormalizado === "3") {

            return {
                mensaje: `❌ Cancelación de citas.

Esta funcionalidad la conectaremos con tus citas registradas en SIGCMI.`
            };
        }

        if (mensajeNormalizado === "4") {

            return {
                mensaje: `🔄 Reprogramación de citas.

Esta funcionalidad la conectaremos con tus citas registradas en SIGCMI.`
            };
        }

        return {
            mensaje: `Por favor, selecciona una opción:

1️⃣ Solicitar una cita
2️⃣ Consultar mis citas
3️⃣ Cancelar una cita
4️⃣ Reprogramar una cita`
        };
    }

    // ==========================================
    // SOLICITANDO CITA
    // ==========================================

    if (sesion.estado === "SOLICITANDO_CITA") {

        return {
            mensaje: `Aquí mostraremos las especialidades disponibles en SIGCMI.`
        };
    }

    // ==========================================
    // MENSAJE NO RECONOCIDO
    // ==========================================

    return {
        mensaje: `No estoy seguro de haber entendido tu solicitud. 🤖

Escribe "Hola" para comenzar.`
    };
};