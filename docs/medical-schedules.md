# UH-012 — Consulta médica de horarios asignados

## Comportamiento vigente

Administración crea, edita y asigna los horarios. El médico solo consulta sus
asignaciones mediante `GET /medico/horarios`, protegido por autenticación y
`role(2)`. El perfil se obtiene desde `req.usuario.id_usuario`; un identificador
enviado por el navegador no selecciona al propietario.

Los pacientes solicitan citas dentro de la disponibilidad permitida. El antiguo
flujo de solicitudes semanales de horarios por médicos está descartado.

El modal «Mi agenda semanal» es exclusivamente de lectura: encabezado azul,
indicador de solo lectura, siete celdas de lunes a domingo y tarjetas de franjas.
Abre en la semana actual de Bogotá. Los botones anterior/siguiente cambian la
semana sin escribir registros ni repetir el GET. Se pueden consultar semanas
pasadas y futuras. Al reabrir se recargan los datos desde administración.

El día actual se distingue con borde y `aria-current="date"`. Un punto azul
indica franjas aprobadas; los pendientes y rechazados se muestran con su estado
real, sin marcar disponibilidad aprobada. Los días sin asignaciones son neutros.
Las tarjetas muestran horas y vigencia completa. Varias franjas del mismo día
permanecen separadas, ordenadas por hora inicial, final e identificador; no se
fusionan ni se completa disponibilidad inexistente.

Se informa carga, ausencia total de asignaciones, semana sin horarios, sesión
expirada y errores. La navegación está deshabilitada hasta completar la carga.
Se valida la respuesta completa antes de mostrar franjas. Al cerrar o reabrir se
aborta la petición anterior y se descartan respuestas tardías, incluso durante la
lectura del JSON. Los datos externos se representan con `textContent`.

## Contrato GET y períodos de vigencia

`GET /medico/horarios` mantiene `{ horarios, revision }`. Cada horario conserva
`id_horario`, `dia_semana`, `hora_inicio`, `hora_fin` y `estado`, y añade
`fecha_inicio` y `fecha_fin` como cadenas `YYYY-MM-DD` de los campos `DATEONLY`
existentes. Las horas `TIME` admiten `HH:mm:ss` y el cliente también valida
`HH:mm`. Se mantienen autenticación, rol y filtro de propiedad. No se modifican
modelos, asociaciones, migraciones ni administración.

Una franja aparece en una fecha solo cuando coincide su día semanal y se cumple
`fecha_inicio <= fecha <= fecha_fin`, incluyendo ambos extremos. Esto permite
períodos mensuales, límites a mitad de semana y distintos períodos en una misma
semana. El GET devuelve todas las asignaciones propias; la visualización aplica
la vigencia a cada fecha, sin eliminar registros anteriores o futuros.

La fecha actual se obtiene con `Intl.DateTimeFormat` en `America/Bogota`.
Las fechas civiles se convierten a números de día mediante componentes UTC para
hacer aritmética, sin interpretarlas como medianoche del equipo. El formato de
esas fechas utiliza UTC para evitar desplazamientos. Las vigencias ausentes,
imposibles o invertidas provocan un error de respuesta, nunca horarios inventados.

## Código y evidencia anteriores

No hay rutas médicas de escritura ni solicitudes semanales. En esta rama de
integración se retiraron `crearServicioHorarios`, sus validadores de escritura,
comparadores de franjas, manejo de conflictos y transacciones de creación,
actualización y eliminación. No tenían consumidores activos. El servicio conserva
únicamente `revisionHorarios` y la conversión de registros Sequelize necesaria
para calcularla; la ampliación del GET conserva los campos anteriores y su filtro
por médico autenticado.

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

La agenda añade cobertura de navegación, tres días asignados, vigencias inclusivas,
meses, múltiples franjas, cambio de año y fecha de Bogotá. También se comprueban
respuestas inválidas, estados no aprobados y cierre durante peticiones.

Verificación de esta entrega: **29 pruebas médicas aprobadas**, Pug, sintaxis y
ESLint correctos. Las 13 pruebas del modal también pasan con `TZ=Pacific/Auckland`
y `TZ=America/Los_Angeles`. Se comprobó la generación de las clases Tailwind en una
salida temporal, sin modificar CSS compilado del repositorio.

Las evidencias históricas de MySQL y
navegador no se cuentan como verificaciones de esta rama. No se ejecutaron pruebas
de persistencia ni validación manual en navegador.

Después de compilar Tailwind desde sus fuentes, comprobar manualmente el modal en
escritorio y móvil: contraste, foco al abrir/cerrar, navegación, períodos reales y
ausencia de desbordamiento. El CSS generado no se incluye en estos commits.

No ejecutar `tests/database.test.js` como parte de esta comprobación: aplica
migraciones e inserta datos. Una prueba con MySQL requiere una base aislada y
autorización explícita.
