import Usuario from "../../models/Usuario.js";
import generateOTP from "../../helpers/generateOTP.js";
import { sendRecoveryEmail } from "../../services/emailService.js";

const formRecoverPassword = (req, res) => {
    res.render("login/auth/recover-password", {
        titulo: "Recuperar contraseña"
    });
};

// Genera un código temporal y limita reenvíos por cuenta.
const recoverPassword = async (req, res) => {
    const correo = typeof req.body.correo === "string" ? req.body.correo.trim() : "";
    const ahora = new Date();
    const duracionVentana = 15 * 60 * 1000;
    const esperaReenvio = 60 * 1000;
    const maximoSolicitudes = 3;
    let usuario;
    let errorLimite;

    // Bloquea la fila mientras se comprueba y actualiza el límite para evitar
    // que solicitudes simultáneas de reenvío lo sobrepasen.
    await Usuario.sequelize.transaction(async (transaction) => {
        usuario = await Usuario.findOne({
            where: { correo },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!usuario) return;

        const ventanaActual = usuario.codigo_ventana_inicio
            ? new Date(usuario.codigo_ventana_inicio)
            : null;
        const ventanaVencida = !ventanaActual || ahora - ventanaActual >= duracionVentana;
        const inicioVentana = ventanaVencida ? ahora : ventanaActual;
        const solicitudesEnVentana = ventanaVencida ? 0 : Number(usuario.codigo_solicitudes || 0);
        const ultimoEnvio = usuario.codigo_ultimo_envio
            ? new Date(usuario.codigo_ultimo_envio)
            : null;

        if (ultimoEnvio && ahora - ultimoEnvio < esperaReenvio) {
            errorLimite = "Espera un minuto antes de solicitar otro código.";
            return;
        }

        if (solicitudesEnVentana >= maximoSolicitudes) {
            errorLimite = "Alcanzaste el límite de códigos. Inténtalo de nuevo en 15 minutos.";
            return;
        }

        const codigo = generateOTP();
        const expiracion = new Date(ahora.getTime() + duracionVentana);

        usuario.codigo = codigo;
        usuario.codigo_expira = expiracion;
        usuario.codigo_intentos = 0;
        usuario.codigo_ultimo_envio = ahora;
        usuario.codigo_solicitudes = solicitudesEnVentana + 1;
        usuario.codigo_ventana_inicio = inicioVentana;
        await usuario.save({ transaction });
    });

    const mensaje = "Si existe una cuenta asociada a ese correo, recibir\u00e1s un c\u00f3digo de verificaci\u00f3n. Revisa tu bandeja de entrada.";

    if (!usuario || errorLimite) {
        return res.render("login/auth/verify-otp", {
            titulo: "Verificar c\u00f3digo",
            correo,
            mensaje
        });
    }

    void sendRecoveryEmail(usuario).catch((error) => {
        // Registra el fallo sin cambiar la respuesta visible para el solicitante.
        console.error("No se pudo enviar el correo de recuperacion:", error.message);
    });

    return res.render("login/auth/verify-otp", {
        titulo: "Verificar c\u00f3digo",
        correo,
        mensaje
    });

};

export { formRecoverPassword, recoverPassword };
