# UH-013 — Protección de transiciones: primera etapa

## Alcance

Se conserva `PATCH /medico/citas/:id/estado`, con `auth` y `role(2)`.
El cuerpo sigue siendo `{ "estado_id": <entero positivo> }`, sin campos extra.
El servidor consulta `EstadoCita` y decide por nombre; no interpreta IDs fijos.
El médico se obtiene exclusivamente de `req.usuario.id_usuario`.

| Estado actual | Destino permitido | Requisitos |
|---|---|---|
| Pendiente o Confirmada | En Curso | Cita propia, fecha actual de Bogotá y hora programada alcanzada. |
| En Curso | Completada | Cita propia y diagnóstico persistido asociado; puede ser después de medianoche. |
| Completada o Cancelada | Ninguno | Se rechaza cualquier transición. |

El inicio admite la hora exacta y el atraso durante la fecha programada. No admite
citas de días anteriores o futuros. Se reutiliza `dashboardPeriods` y se obtiene
la hora con `Intl` en `America/Bogota`; `TIME` se compara como segundos civiles,
sin interpretar la hora con la zona del servidor. La fecha se evalúa después de
obtener el bloqueo de la cita.

## Seguridad y concurrencia

La consulta de la cita filtra por ID y médico dentro de una transacción, con
bloqueo de fila. El diagnóstico existente también se consulta con bloqueo antes
de finalizar. La actualización conserva la condición de propietario y estado
anterior. La respuesta correcta se envía después de confirmar la transacción;
un fallo produce una respuesta controlada, sin dar por confirmado el cambio.

- `400`: identificador, cuerpo o destino inválido.
- `404`: perfil ausente o cita no disponible para el médico; no distingue cita
  ajena de inexistente.
- `409`: transición, fecha u hora no permitida, diagnóstico ausente o conflicto.
- `500`: error de consulta, actualización o confirmación de la transacción.

Los rechazos de sesión y rol se mantienen en los middleware existentes.
No se agregan rutas ni se modifica administración, paciente, autenticación,
modelos o migraciones. Las operaciones administrativas preexistentes conservan
sus propias reglas: este cambio no resuelve todos los conflictos entre módulos.

## Límites respecto a las siguientes etapas

Esta etapa no crea formularios clínicos ni endpoints para guardar diagnósticos.
Solo verifica que exista una fila de `Diagnostico` asociada a la cita; la validación
de su contenido pertenece a UH-014. Sin esa fila no se permite completar.
No se registran tiempos clínicos reales ni se cambia el promedio de UH-011.

La interfaz diaria todavía envía los IDs numéricos anteriores y no ofrece iniciar
una cita Confirmada ni recuperar desde la agenda de hoy una cita de días anteriores
que sigue En Curso. El endpoint permite finalizar esa cita después de medianoche,
pero la interfaz para continuarla corresponde a la segunda etapa. Antes de usar
un catálogo con IDs diferentes será necesario adaptar los botones para enviar los
IDs reales. «Gestionar Citas» conserva exclusivamente la consulta.

## Verificación

`tests/medico/citasEstado.test.js` añade **15 pruebas** con rutas y middleware
reales y modelos simulados. Comprueban permisos, propiedad, entradas inválidas,
catálogo con IDs distintos, transiciones, límites de fecha y hora de Bogotá,
diagnóstico obligatorio, repetición, concurrencia y reversión ante fallos.

El bloqueo y la reversión se simulan en memoria: no son una prueba de concurrencia
real de MySQL. La regresión médica completa suma **82 pruebas aprobadas**.
También pasan sintaxis JavaScript, compilación y renderizado Pug mediante la
regresión existente, ESLint y revisión del diff. No se accede a MySQL ni se
modifican las tres citas de prueba. No se ejecuta `tests/database.test.js`.

```powershell
node --experimental-test-module-mocks --test tests/medico/citasEstado.test.js tests/medico/dashboardMetrics.test.js tests/medico/dashboard.test.js tests/medico/dashboardCards.test.cjs tests/medico/citasModal.test.cjs tests/medico/logout.test.js tests/medico/horariosAccess.test.js tests/medico/horariosModal.test.cjs tests/medico/historial.test.js tests/medico/horariosService.test.js
```
