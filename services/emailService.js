import { appointmentEmailTemplate, diagnosisEmailTemplate } from './paciente/appointmentEmailTemplate.js';

// Envía los correos de autenticación y citas mediante la API HTTPS de Resend.
const transporter = {
    async sendMail(message, idempotencyKey) {
        const apiKey = process.env.RESEND_API_KEY?.trim();
        if (!apiKey || !process.env.EMAIL_FROM?.trim()) {
            throw new Error("Falta configurar RESEND_API_KEY o EMAIL_FROM.");
        }
        const senderName = process.env.NAME_EMAIL?.trim();
        const senderEmail = process.env.EMAIL_FROM.trim();
        const from = senderName ? `${senderName} <${senderEmail}>` : senderEmail;
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...(idempotencyKey && { 'Idempotency-Key': idempotencyKey }) },
            body: JSON.stringify({ ...message, from }),
            signal: AbortSignal.timeout(20000)
        });
        if (!response.ok) {
            const error = new Error(`Resend rechazó el envío (HTTP ${response.status}).`);
            error.code = "EMAIL_PROVIDER_ERROR";
            throw error;
        }
    }
};

const nombreCompleto = (persona) => [persona.nombres, persona.apellidos]
    .filter((parte) => typeof parte === "string" && parte.trim())
    .map((parte) => parte.trim())
    .join(" ");

const sendDiagnosisNotificationEmail = async (usuario, idempotencyKey) => {
    const base = new URL(process.env.BACKEND_URL || 'http://localhost:3000');
    if (!['http:', 'https:'].includes(base.protocol)) throw new Error('BACKEND_URL no es una dirección web válida.');
    const url = new URL('/paciente/historial-diagnosticos', base.origin).toString();
    const nombre = nombreCompleto(usuario);
    const saludo = nombre ? `Hola, ${nombre}.` : 'Hola.';
    await transporter.sendMail({
        to: usuario.correo,
        subject: 'Tu diagnóstico está disponible - SIGCMI',
        text: `${saludo} Tu diagnóstico está disponible en SIGCMI. Ingresa a tu cuenta para consultarlo: ${url}`,
        html: diagnosisEmailTemplate({ saludo, url })
    }, idempotencyKey);
};

// Aviso posterior a la acción; es independiente de los códigos de verificación.
const sendAppointmentNotificationEmail = async (usuario, cita, tipo, idempotencyKey) => {
    const mensajes = {
        confirmacion_cita: ['Cita registrada', 'Tu cita ha sido registrada'],
        reprogramacion: ['Cita reprogramada', 'Tu cita ha sido reprogramada'],
        cancelacion_cita: ['Cita cancelada', 'Tu cita ha sido cancelada'],
        recordatorio_24h: ['Recordatorio de cita', 'Tu cita está programada para las próximas 24 horas'],
        recordatorio_1h: ['Recordatorio de cita', 'Tu cita está programada para la próxima hora']
    };
    const mensaje = mensajes[tipo];
    if (!mensaje) throw new Error('Tipo de notificación de cita no válido.');
    const nombre = nombreCompleto(usuario);
    const saludo = nombre ? `Hola, ${nombre}.` : 'Hola.';
    const fecha = String(cita.fecha);
    const hora = String(cita.hora).slice(0, 5);
    await transporter.sendMail({
        to: usuario.correo,
        subject: `${mensaje[0]} - SIGCMI`,
        text: `${saludo} ${mensaje[1]} para el ${fecha} a las ${hora}.`,
        html: appointmentEmailTemplate({ titulo: mensaje[0], saludo, mensaje: mensaje[1], fecha, hora })
    }, idempotencyKey);
};

// Envía al paciente el código necesario para confirmar la cancelación de una cita.
const sendCancellationCodeEmail = async (usuario, codigo, cita) => {
    const fecha = new Intl.DateTimeFormat("es-CO", {
        dateStyle: "long",
        timeZone: "America/Bogota"
    }).format(new Date(`${cita.fecha}T12:00:00`));
    const hora = String(cita.hora).slice(0, 5);

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: usuario.correo,
        subject: "Código para cancelar tu cita - SIGCMI",
        text: `Hola ${usuario.nombres || ""}. Tu código para confirmar la cancelación de la cita del ${fecha} a las ${hora} es ${codigo}. Vence en 10 minutos.`,
        html: appointmentEmailTemplate({ titulo: 'Confirma la cancelación de tu cita', saludo: usuario.nombres ? `Hola, ${usuario.nombres}.` : 'Hola.', mensaje: 'Ingresa el código para confirmar la cancelación de tu cita', fecha, hora, codigo })
    });
};

// Envía un código de identidad para confirmar una cita nueva o una reprogramación.
const sendAppointmentIdentityCodeEmail = async (usuario, codigo, accion, cita) => {
    const fecha = new Intl.DateTimeFormat("es-CO", {
        dateStyle: "long",
        timeZone: "America/Bogota"
    }).format(new Date(`${cita.fecha}T12:00:00`));
    const hora = String(cita.hora).slice(0, 5);
    const esReprogramacion = accion === "reprogramacion";
    const asunto = esReprogramacion ? "Confirma la reprogramación de tu cita" : "Confirma tu nueva cita";
    const accionTexto = esReprogramacion ? "reprogramar" : "confirmar";

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: usuario.correo,
        subject: asunto,
        text: `Hola ${usuario.nombres || ""}. Tu código para ${accionTexto} la cita del ${fecha} a las ${hora} es ${codigo}. Vence en 10 minutos.`,
        html: appointmentEmailTemplate({ titulo: asunto, saludo: usuario.nombres ? `Hola, ${usuario.nombres}.` : 'Hola.', mensaje: `Ingresa el código para ${accionTexto} tu cita`, fecha, hora, codigo })
    });
};

// Envía el código OTP de recuperación de contraseña al correo del usuario.
const sendRecoveryEmail = async (usuario) => {
    const nombre = nombreCompleto(usuario);
    const saludo = nombre ? `Hola, ${nombre}.` : "Hola.";

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: usuario.correo,
        subject: "Recuperación de contraseña - SIGCMI",
    
        html: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Recuperación de contraseña</title>
            </head>
    
            <body style="
                margin: 0;
                padding: 0;
                background-color: #f1f5f9;
                font-family: Arial, Helvetica, sans-serif;
            ">
    
                <div style="
                    max-width: 600px;
                    margin: 40px auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.10);
                ">
    
                    <!-- Encabezado -->
                    <div style="
                        background-color: #1d4ed8;
                        padding: 25px;
                        text-align: center;
                    ">
                        <h2 style="
                            margin: 0;
                            color: #ffffff;
                            font-size: 24px;
                        ">
                            Recuperación de contraseña
                        </h2>
                    </div>
    
                    <!-- Contenido -->
                    <div style="
                        padding: 35px;
                        color: #334155;
                    ">
    
                        <p style="
                            font-size: 16px;
                            margin-top: 0;
                        ">
                            ${saludo}
                        </p>
    
                        <p style="
                            font-size: 16px;
                            line-height: 1.6;
                        ">
                            Recibimos una solicitud para restablecer la contraseña
                            de tu cuenta en SIGCMI.
                        </p>

                        <p style="
                            font-size: 16px;
                            line-height: 1,6;
                        ">
                            Tu código de verificación es:

                            <h1>${usuario.codigo}</h1>

                            Este código tiene una validez de 15 minutos.
                        </p>

                        <!-- Mensaje de seguridad -->
                        <p style="
                            font-size: 14px;
                            color: #64748b;
                            line-height: 1.5;
                        ">
                            Si no solicitaste este cambio, puedes ignorar este
                            correo. Tu contraseña actual permanecerá sin cambios.
                        </p>
    
                    </div>
    
                    <!-- Pie del correo -->
                    <div style="
                        background-color: #f8fafc;
                        padding: 20px;
                        text-align: center;
                        border-top: 1px solid #e2e8f0;
                    ">
                        <p style="
                            margin: 0;
                            font-size: 13px;
                            color: #64748b;
                        ">
                            SIGCMI - Sistema Integral de Gestión de Citas Médicas
                        </p>
    
                        <p style="
                            margin: 8px 0 0;
                            font-size: 12px;
                            color: #94a3b8;
                        ">
                            Este correo fue enviado automáticamente.
                        </p>
                    </div>
    
                </div>
    
            </body>
            </html>
        `
    });

};

// Envía el enlace para confirmar una cuenta creada mediante el formulario de registro.
const sendConfirmationEmail = async (registro) => {
    const nombre = nombreCompleto(registro);
    const backendUrl = new URL(process.env.BACKEND_URL || "http://localhost");
    const localHosts = ["localhost", "127.0.0.1", "[::1]"];

    if (!backendUrl.port && localHosts.includes(backendUrl.hostname)) {
        backendUrl.port = process.env.PORT || "3000";
    }

    const confirmationUrl = new URL(
        `/auth/confirm-register/${encodeURIComponent(registro.token)}`,
        backendUrl.origin
    ).toString();

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: registro.correo,
        subject: "Confirma tu cuenta - SIGCMI",

        html: `
            <!DOCTYPE html>
            <html lang="es">

            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirmación de cuenta</title>
            </head>

            <body style="
                margin: 0;
                padding: 0;
                background-color: #f1f5f9;
                font-family: Arial, Helvetica, sans-serif;
            ">

                <div style="
                    max-width: 600px;
                    margin: 40px auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.10);
                ">

                    <div style="
                        background-color: #1d4ed8;
                        padding: 25px;
                        text-align: center;
                    ">
                        <h2 style="
                            margin: 0;
                            color: #ffffff;
                            font-size: 24px;
                        ">
                            Confirma tu cuenta
                        </h2>
                    </div>

                    <div style="
                        padding: 35px;
                        color: #334155;
                    ">

                        <p style="
                            font-size: 16px;
                            margin-top: 0;
                        ">
                            Hola${nombre ? ` ${nombre}` : ""}.
                        </p>

                        <p style="
                            font-size: 16px;
                            line-height: 1.6;
                        ">
                            Gracias por registrarte en SIGCMI.
                        </p>

                        <p style="
                            font-size: 16px;
                            line-height: 1.6;
                        ">
                            Para completar la creación de tu cuenta,
                            haz clic en el siguiente botón:
                        </p>

                        <div style="
                            text-align: center;
                            margin: 30px 0;
                        ">

                            <a href="${confirmationUrl}" style="
                                display: inline-block;
                                padding: 14px 28px;
                                background-color: #1d4ed8;
                                color: #ffffff;
                                text-decoration: none;
                                border-radius: 8px;
                                font-size: 16px;
                                font-weight: bold;
                            ">
                                Confirmar mi cuenta
                            </a>

                        </div>

                        <p style="
                            font-size: 14px;
                            color: #64748b;
                            line-height: 1.5;
                        ">
                            Este enlace tiene una validez de 15 minutos.
                        </p>

                        <p style="
                            font-size: 14px;
                            color: #64748b;
                            line-height: 1.5;
                        ">
                            Si no realizaste este registro, puedes ignorar
                            este correo.
                        </p>

                    </div>

                    <div style="
                        background-color: #f8fafc;
                        padding: 20px;
                        text-align: center;
                        border-top: 1px solid #e2e8f0;
                    ">

                        <p style="
                            margin: 0;
                            font-size: 13px;
                            color: #64748b;
                        ">
                            SIGCMI - Sistema Integral de Gestión de Citas Médicas
                        </p>

                        <p style="
                            margin: 8px 0 0;
                            font-size: 12px;
                            color: #94a3b8;
                        ">
                            Este correo fue enviado automáticamente.
                        </p>

                    </div>

                </div>

            </body>

            </html>
        `
    });
};

export {
    sendDiagnosisNotificationEmail,
    sendAppointmentNotificationEmail,
    sendRecoveryEmail,
    sendConfirmationEmail,
    sendCancellationCodeEmail,
    sendAppointmentIdentityCodeEmail
};
