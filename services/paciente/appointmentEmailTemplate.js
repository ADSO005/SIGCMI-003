const escaparHtml = (valor) => String(valor).replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[caracter]);

// Plantilla citas enviados al paciente.
export function appointmentEmailTemplate({ titulo, saludo, mensaje, fecha, hora, codigo }) {
    return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escaparHtml(titulo)}</title></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background-color:#fff;border-radius:12px;overflow:hidden;">
    <div style="background-color:#1d4ed8;padding:25px;text-align:center;color:#fff;">
      <h2 style="margin:0;font-size:24px;">${escaparHtml(titulo)}</h2>
    </div>
    <div style="padding:35px;color:#334155;font-size:16px;line-height:1.6;">
      <p style="margin-top:0;">${escaparHtml(saludo)}</p>
      <p>${escaparHtml(mensaje)}.</p>
      <p><strong>Fecha:</strong> ${escaparHtml(fecha)}<br><strong>Hora:</strong> ${escaparHtml(hora)}</p>
      ${codigo ? `<p>Tu código de verificación es:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1d4ed8;">${escaparHtml(codigo)}</p><p style="font-size:14px;color:#64748b;">El código vence en 10 minutos. Si no solicitaste esta acción, ignora este mensaje.</p>` : '<p style="font-size:14px;color:#64748b;">Puedes consultar los detalles en tu cuenta de SIGCMI.</p>'}
    </div>
    <div style="background-color:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px;">
      <p style="margin:0;">SIGCMI - Sistema Integral de Gestión de Citas Médicas</p>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">Este correo fue enviado automáticamente.</p>
    </div>
  </div>
</body></html>`;
}

export function diagnosisEmailTemplate({ saludo, url }) {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Diagnóstico disponible</title></head>
<body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;"><div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;">
<div style="background:#1d4ed8;padding:25px;text-align:center;color:#fff;"><h2 style="margin:0;font-size:24px;">Diagnóstico disponible</h2></div>
<div style="padding:35px;color:#334155;line-height:1.6;"><p>${escaparHtml(saludo)}</p><p>Tu diagnóstico ya está disponible en SIGCMI. Ingresa a tu cuenta para consultarlo.</p>
<p style="text-align:center;margin:30px 0;"><a href="${escaparHtml(url)}" style="display:inline-block;padding:14px 28px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Consultar historial</a></p></div>
<div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px;"><p>SIGCMI - Sistema Integral de Gestión de Citas Médicas</p><p>Este correo fue enviado automáticamente.</p></div></div></body></html>`;
}
