import nodemailer from "nodemailer";

const enviarEmailRegistro = async ({ nombre, correo, token }) => {

    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transport.verify();

    console.log("✅ Conexión SMTP correcta");

    const info = await transport.sendMail({
        from: `"SIGCMI" <${process.env.EMAIL_FROM}>`,
        to: correo,
        subject: "Confirma tu cuenta en SIGCMI",
        text: "Confirma tu cuenta en SIGCMI",
        html: `
            html: 
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
</head>

<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 0;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,.08);">

<tr>
<td style="background:#0f766e;padding:30px;text-align:center;">
<h1 style="color:#ffffff;margin:0;font-size:30px;">
🏥 SIGCMI
</h1>

<p style="color:#d1fae5;margin-top:10px;">
Sistema Integral de Gestión de Citas Médicas Inteligentes
</p>
</td>
</tr>

<tr>
<td style="padding:40px;">

<h2 style="margin-top:0;color:#1f2937;">
¡Hola ${nombre}! 👋
</h2>

<p style="color:#4b5563;font-size:16px;line-height:28px;">
Gracias por registrarte en <strong>SIGCMI</strong>.
</p>

<p style="color:#4b5563;font-size:16px;line-height:28px;">
Para activar tu cuenta debes confirmar tu correo electrónico haciendo clic en el siguiente botón:
</p>

<div style="text-align:center;margin:40px 0;">

<a
href="http://localhost:3000/auth/confirmar/${token}"
style="
background:#0f766e;
color:white;
padding:16px 40px;
text-decoration:none;
border-radius:8px;
font-size:18px;
font-weight:bold;
display:inline-block;
">
✅ Confirmar Cuenta
</a>

</div>

<p style="color:#6b7280;font-size:15px;">
Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
</p>

<p style="
background:#f3f4f6;
padding:15px;
border-radius:8px;
word-break:break-all;
font-size:14px;
">
http://localhost:3000/auth/confirmar/${token}
</p>

<hr style="margin:35px 0;border:none;border-top:1px solid #e5e7eb;">

<p style="color:#9ca3af;font-size:14px;">
Si no creaste esta cuenta, puedes ignorar este correo. Ningún cambio será realizado.
</p>

</td>
</tr>

<tr>
<td style="background:#f9fafb;padding:25px;text-align:center;">

<p style="margin:0;font-weight:bold;color:#374151;">
SIGCMI
</p>

<p style="margin-top:10px;color:#6b7280;font-size:13px;">
Sistema Integral de Gestión de Citas Médicas Inteligentes
</p>

<p style="margin-top:20px;color:#9ca3af;font-size:12px;">
© 2026 SIGCMI • Todos los derechos reservados
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`
    });

    console.log("Correo enviado:", info.messageId);
};

export default enviarEmailRegistro;