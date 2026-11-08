# UH-012 — Consulta médica de horarios asignados

## Comportamiento vigente

Administración crea, edita y asigna los horarios. El médico solo consulta sus
asignaciones mediante `GET /medico/horarios`, protegido por autenticación y
`role(2)`. El perfil se obtiene desde `req.usuario.id_usuario`; un identificador
enviado por el navegador no selecciona al propietario.

Los pacientes solicitan citas dentro de la disponibilidad permitida. El antiguo
flujo de solicitudes semanales de horarios por médicos está descartado.

El modal conserva una presentación de texto, sin controles de edición. Informa
carga, ausencia de asignaciones, sesión expirada y errores. Valida la respuesta
completa antes de mostrar franjas. Al cerrar o reabrir aborta la petición anterior
y descarta respuestas tardías, incluso si ya comenzó la lectura del JSON.

## Limitación de períodos de vigencia

El modelo vigente `Horario` conserva `fecha_inicio` y `fecha_fin`, pero el GET
actual no los consulta ni devuelve. El modal muestra día, horas y estado; no
permite determinar si la asignación corresponde a esta semana, al mes o a un
período anterior. No se presenta ninguna franja como disponibilidad vigente para
reservar citas ni se inventan fechas.

Se propone, para una entrega autorizada, ampliar explícitamente la respuesta con
ambas fechas y mostrar el intervalo inclusivo de cada franja. Antes de filtrar
períodos vencidos o futuros debe acordarse si la consulta incluye el historial de
asignaciones. Esta entrega no modifica el contrato, modelos ni MySQL.

## Código y evidencia anteriores

No hay rutas médicas de escritura ni solicitudes semanales. En esta rama de
integración se retiraron `crearServicioHorarios`, sus validadores de escritura,
comparadores de franjas, manejo de conflictos y transacciones de creación,
actualización y eliminación. No tenían consumidores activos. El servicio conserva
únicamente `revisionHorarios` y la conversión de registros Sequelize necesaria
para calcularla; el GET mantiene su respuesta y su filtro por médico autenticado.

El CRUD administrativo y sus dependencias permanecen intactos. También se conserva
`actualizarEstadoCita`: es una operación activa de atención de citas, no de edición
de horarios. No se modifica ni se amplía su comportamiento en esta limpieza.

Los informes `medical-schedule-handoff.md`, `medical-schedule-integration-conflicts.md`
y las evidencias JSON/capturas conservadas en `feature/MedicalConexion` describen
en parte el CRUD médico descartado. No se trasladan como instrucciones vigentes;
deben corregirse o clasificarse como evidencia histórica antes de recuperarlos.
No se eliminan ni se reescriben sus resultados históricos.

Las pruebas antiguas del CRUD en `feature/MedicalConexion` verifican reglas
descartadas y no se recuperan. `tests/medico/horariosService.test.js` de esta rama
contiene pruebas de lectura de la revisión: hash vacío compatible, equivalencia
de registros planos y Sequelize, orden independiente, ausencia de mutaciones y
detección de cambios en los campos utilizados por el GET.

## Verificación sin MySQL

```powershell
node --experimental-test-module-mocks --test tests/medico/logout.test.js tests/medico/horariosAccess.test.js tests/medico/horariosModal.test.cjs tests/medico/historial.test.js tests/medico/horariosService.test.js
```

Las pruebas de acceso ejecutan rutas, autenticación, rol y GET reales con modelos
simulados; las del modal utilizan DOM y respuestas simuladas. Incluyen propiedad,
rechazo de roles y sesiones, ausencia de escritura, errores y respuestas tardías.
La regresión incluye logout e historial clínico seguro. Las pruebas de revisión
ejecutan la función real con datos en memoria, sin modelos conectados.

Resultado de esta limpieza: **22 pruebas aprobadas**, sintaxis JavaScript,
compilación Pug y ESLint médicos correctos. Las evidencias históricas de MySQL y
navegador no se cuentan como verificaciones de esta rama. No se ejecutaron pruebas
de persistencia ni validación manual en navegador.

No ejecutar `tests/database.test.js` como parte de esta comprobación: aplica
migraciones e inserta datos. Una prueba con MySQL requiere una base aislada y
autorización explícita.
