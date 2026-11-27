# Plan de notificaciones — SIGCMI

Estado de partida: solo existía el envío de correo al agendar, reprogramar y cancelar
(`services/paciente/appointmentNotifications.js`). Los modelos `Notificacion`,
`ColaNotificacion`, `PlantillaNotificacion` y `ConfiguracionNotificacion` existían pero
no se usaban, y `sms` / `nuevo_diagnostico` / `actualizaciones` no tenían emisor.

## Estado de implementación

| Fase | Estado |
|---|---|
| 1. Integración Cloud API | Hecha |
| 2. Plantillas en Meta | Creadas por el equipo, en revisión |
| 3. Servicio `notificar` + todos los flujos (paciente, admin, bot) | Hecha |
| 4. Reintentos | Hecha sin cola: el worker reintenta hasta 3 veces los recordatorios fallidos. `cola_notificaciones` no se usa |
| 5. Recordatorios 24 h / 1 h | Hecha (`services/notificaciones/recordatorios.js`, ciclo cada 5 min, hora UTC-5) |
| 6. Estados de entrega | Hecha (el webhook actualiza `notificaciones` por `id_externo`) |
| 7. Opt-out | Hecha: «BAJA» / «STOP» desactiva el canal WhatsApp |
| 8. Panel admin: historial y reenvío | Pendiente |
| `nuevo_diagnostico` | Pendiente: plantilla creada, sin emisor en el código |

## Objetivo

Un único punto de entrada, `notificar(usuario, cita, evento)`, que respete las preferencias
del usuario, registre cada envío en `notificaciones` y entregue por correo y/o WhatsApp.

## Eventos

| Evento (clave en `ConfiguracionNotificacion`) | Plantilla Meta | Canales |
|---|---|---|
| `confirmacion_cita` | `cita_confirmada` | Correo, WhatsApp |
| `reprogramacion` | `cita_reprogramada` | Correo, WhatsApp |
| `cancelacion_cita` | `cita_cancelada` | Correo, WhatsApp |
| `recordatorio_24h` | `recordatorio_24h` | WhatsApp |
| `recordatorio_1h` | `recordatorio_1h` | WhatsApp |
| `nuevo_diagnostico` | `nuevo_diagnostico` (sin conectar) | WhatsApp |
| `actualizaciones` | — | Sin emisor |

Variables de las plantillas de cita: `{{1}}` nombre, `{{2}}` fecha, `{{3}}` hora.
`sms` queda fuera de alcance (sin proveedor).

## Decisiones de diseño

- **Sin `cola_notificaciones`:** la tabla exige `notificacion_id` y no tiene `cita_id` ni evento. Un
  worker que consulta las citas de las próximas 25 h cubre el caso, ve al instante reprogramaciones y
  cancelaciones, y deja la deduplicación en `notificaciones` (`cita_id` + `evento`).
  Limitación: con varias instancias del servidor dos workers podrían duplicar un recordatorio.
- **Hora de negocio:** Colombia no tiene horario de verano; la hora de cita se interpreta como UTC-5.
- **Datos clínicos:** no se envía contenido sensible por WhatsApp (Ley 1581 de 2012); `nuevo_diagnostico`
  solo remite al portal.

## Pendiente

1. Emisor de `nuevo_diagnostico` (decidir si se dispara al guardar el diagnóstico o al cerrar la consulta).
2. Panel admin con historial de `notificaciones`, filtros por canal/estado y reenvío de fallidas.
3. Detección del error 190 de Meta (token vencido) con alerta en `/admin/whatsapp`.
4. Formato de fecha `dd/mm/aaaa` en las plantillas.
5. Bloqueo entre instancias si el despliegue escala a más de un proceso.

## Pruebas
- Unitarias: `normalizarTelefono`, `firmaValida`, `cifrar/descifrar`, decisión por preferencias.
- Manual: agendar una cita con un paciente con teléfono y revisar `notificaciones`.

## Riesgos
- Plantillas rechazadas por Meta.
- Token temporal de Meta: usar el token de un usuario del sistema.
- Límite de mensajería por número.
- `sesiones` del bot viven en memoria y se pierden al reiniciar.

## Variables de entorno
`BACKEND_URL` (URL pública para el webhook), `WHATSAPP_ENCRYPTION_KEY` (opcional; si falta se deriva de `JWT_SECRET`).
