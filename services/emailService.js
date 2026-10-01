import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/* funcion smtp simulador envios de correos */
const sendRecoveryEmail = async (usuario) => {

    const recoveryUrl = `http://localhost:3000/auth/reset-password/${usuario.token}`;

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
                            Hola.
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

/* funcion confirmacion de correo para el registro */

const sendConfirmationEmail = async (registro) => {
    const confirmationUrl =
        `http://localhost:3000/auth/confirm-register/${registro.token}`;

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
                            Hola ${registro.nombres}.
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
    sendRecoveryEmail,
    sendConfirmationEmail
};