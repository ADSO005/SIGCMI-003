# UH-013 — Transiciones y contexto de atención

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

## Flujo visual: segunda etapa

«Mi Agenda de hoy» conserva todas las citas de hoy y ofrece «Iniciar Consulta»
para `Pendiente` y `Confirmada`. El botón solo se habilita si la fecha y hora lo
permiten, usando `canStartAppointmentToday`, compartida entre el renderizado y
el endpoint dentro del módulo médico. El servidor vuelve a validar todo al recibir
el PATCH. Al llegar la hora debe actualizarse la agenda para obtener la elegibilidad
vigente; no se toma el reloj del navegador como autoridad.

El ID de destino se consulta por nombre `En Curso`, solo cuando hay una cita
elegible, y se entrega al botón como dato escapado. JavaScript no contiene IDs
fijos ni cambia localmente estados o métricas. Deshabilita el botón durante el
envío y bloquea solicitudes duplicadas para esa cita. Si hay éxito, navega al
dashboard con `?consulta=<id>#contextoConsulta`, recargando desde el servidor las
métricas, próxima cita y listado. Ante conflicto, sesión vencida, falta de permisos,
respuesta inválida o error de red, informa con texto seguro y recupera el botón.

Las citas En Curso ofrecen «Continuar consulta», mediante GET y sin transición.
Se reutiliza la consulta existente de citas propias: aparte de hoy, se muestran
solo las de fechas anteriores que siguen En Curso, ordenadas por fecha y hora.
No se agrega toda la agenda histórica ni una consulta adicional de citas.
El parámetro `consulta` solo recupera contexto de una cita propia En Curso de hoy
o anterior; las ajenas, inexistentes o en otro estado no exponen su contexto.

El contexto muestra paciente, fecha, hora y motivo. No ofrece formularios ni acción
de finalización: el registro clínico corresponde a UH-014. «Gestionar Citas» y
el modal de horarios permanecen sin cambios y son exclusivamente de consulta.

## Límites respecto a UH-014

Esta etapa no crea formularios clínicos ni endpoints para guardar diagnósticos.
Solo verifica que exista una fila de `Diagnostico` asociada a la cita; la validación
de su contenido pertenece a UH-014. Sin esa fila no se permite completar.
No se registran tiempos clínicos reales ni se cambia el promedio de UH-011.

Continuar recupera el contexto, pero no registra atención clínica ni guarda
diagnósticos o prescripciones. Incluso si ya existe un diagnóstico, la interfaz
no expone todavía finalizar; el endpoint conserva esa transición protegida.

## Verificación

`tests/medico/citasEstado.test.js` añade **15 pruebas** con rutas y middleware
reales y modelos simulados. Comprueban permisos, propiedad, entradas inválidas,
catálogo con IDs distintos, transiciones, límites de fecha y hora de Bogotá,
diagnóstico obligatorio, repetición, concurrencia y reversión ante fallos.

El bloqueo y la reversión se simulan en memoria: no son una prueba de concurrencia
real de MySQL. La primera etapa registró **82 pruebas aprobadas**.
La segunda incorpora dos casos de integración del dashboard y cinco pruebas de
renderizado y JavaScript visual en `tests/medico/atencionVisual.test.cjs`:
botones, contexto, éxito con recarga, duplicados y errores. La regresión completa
actual suma **89 pruebas aprobadas**, con datos en memoria y modelos simulados.
En Chrome se comprobó el dashboard renderizado con datos sintéticos a 1440,
390 y 320 px: contexto, consultas anteriores, botones habilitados/deshabilitados
y textos largos sin desbordamiento horizontal. Tailwind se compiló solo en una
salida temporal, sin incluir CSS generado en el commit.
También pasan sintaxis JavaScript, compilación y renderizado Pug mediante la
regresión existente, ESLint y revisión del diff. No se accede a MySQL ni se
modifican las tres citas de prueba. No se ejecuta `tests/database.test.js`.

```powershell
node --experimental-test-module-mocks --test tests/medico/citasEstado.test.js tests/medico/atencionVisual.test.cjs tests/medico/dashboardMetrics.test.js tests/medico/dashboard.test.js tests/medico/dashboardCards.test.cjs tests/medico/citasModal.test.cjs tests/medico/logout.test.js tests/medico/horariosAccess.test.js tests/medico/horariosModal.test.cjs tests/medico/historial.test.js tests/medico/horariosService.test.js
```
