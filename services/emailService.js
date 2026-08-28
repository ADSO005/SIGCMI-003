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
            <h2>Recuperación de contraseña</h2>

            <p>Hola.</p>

            <p>Recibimos una solicitud para restablecer tu contraseña.</p>

            <p>Haz clic en el siguiente enlace:</p>

            <a href="${recoveryUrl}">
                Restablecer contraseña
            </a>

            <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        `
    });

};

export default sendRecoveryEmail;