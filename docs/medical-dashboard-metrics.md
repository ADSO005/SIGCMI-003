# UH-011 — Indicadores y agenda del dashboard médico

## Alcance

Las cuatro tarjetas reciben `dashboardMetrics` desde el controlador médico.
No contienen cifras de ejemplo ni calculan estadísticas en el navegador.
Se mantienen `auth`, `role(2)` y el perfil obtenido de `req.usuario.id_usuario`.
Ningún identificador enviado por el navegador selecciona al médico consultado.

Esta entrega no conecta ni rediseña la edición del perfil ni el flujo de atención.
«Gestionar Citas» ofrece únicamente consulta. El modal de horarios de
UH-012 permanece intacto y se documenta en `medical-schedules.md`.

El sidebar muestra nombres y apellidos mediante `Medico.Usuario`, y la
especialidad mediante `Medico.Especialidad.nombre`. Ambas relaciones se incluyen
en la consulta existente del perfil, identificado por `req.usuario.id_usuario`,
sin consultas adicionales ni cambios en asociaciones. La especialidad es opcional:
si no está registrada se muestra «Especialidad no registrada». Pug escapa estos datos.

Los dos encabezados muestran la fecha en español con `Intl.DateTimeFormat`, zona
`America/Bogota`, usando el mismo instante `now` capturado para las métricas y
la consulta diaria. No se modifica la configuración global de fechas.

## Definición de los indicadores

| Tarjeta | Cálculo |
|---|---|
| Citas de hoy | Citas únicas del médico en la fecha actual de Bogotá, excluyendo `Cancelada`. |
| Completadas | Subconjunto de hoy cuyo estado asociado se llama `Completada`. |
| Por atender | Total de hoy menos completadas; incluye `Pendiente`, `Confirmada` y `En Curso`. |
| Barra verde | `round(completadas × 100 / total)`, o 0 si el total es 0. El ancho y el valor accesible usan el mismo porcentaje. |
| Pacientes atendidos este mes | Pacientes distintos con al menos una cita `Completada` cuya fecha pertenece al mes actual, solo con este médico. |
| Consultas de esta semana | Citas únicas de lunes a domingo, ambos inclusive, pasadas o futuras dentro de la semana, excluyendo `Cancelada`. |
| Tiempo promedio de consulta | `—` y «Sin datos de duración real». No existe un registro suficiente de duración clínica real en los modelos actuales. |

Los nombres se leen de `EstadoCita` mediante la asociación `Estado`; no se
presuponen IDs de catálogo. Las canceladas no entran en ninguno de los conteos.
Cualquier otro estado no cancelado ni completado se incluye en «Por atender»:
describe citas todavía no completadas, sin inventar un estado ni autorizar nuevas
transiciones. Una relación de estado ausente tampoco se interpreta como completada.

El mes se refiere a `Cita.fecha`, no a una fecha de finalización clínica inexistente.
Un paciente con varias consultas completadas cuenta una sola vez. Los registros
duplicados de una misma `id_cita` tampoco incrementan las métricas.

`duracion_minutos`, el descanso programado y `fecha_actualizacion` no representan
duración real y no se utilizan para inventar promedios. No se agregan columnas ni
se modifica el esquema para esta tarjeta.

## Fechas, consultas y seguridad

### Próxima cita de hoy

`nextAppointmentToday` reutiliza `citasHoy`, sin consultas adicionales. Solo
considera citas del médico autenticado en la fecha civil actual de Bogotá y con
estado `Pendiente` o `Confirmada`, reconocido por nombre. Selecciona la menor hora
estrictamente posterior a la hora actual; excluye la hora exacta, horas pasadas,
otros días y todos los demás estados. No modifica registros ni transiciones.

La fecha `DATEONLY` se compara como `YYYY-MM-DD`. Las horas `TIME` se validan y
convierten a segundos civiles para comparar con la hora de `America/Bogota`,
obtenida con `Intl` a partir del mismo `now` de las métricas. No se interpretan
horas con la zona del servidor. La selección se recalcula al cargar el dashboard.

La tarjeta conserva su diseño azul y presenta hora de 12 horas, nombre y apellido
del paciente y motivo, escapados por Pug. Sin motivo muestra «Motivo no registrado»;
sin relación de paciente muestra «Paciente no disponible». Si no hay cita elegible,
muestra «No tienes más citas programadas para hoy» y «Tu agenda está libre por el
momento», sin nombres ni horas de ejemplo.

`dashboardPeriods` obtiene la fecha civil de `America/Bogota`. Calcula semana y
mes con aritmética UTC sobre esa fecha civil para no depender de la zona del
servidor. La fecha se captura una vez por carga y también se usa en la consulta
diaria existente del controlador.

Se reutiliza la consulta de citas propias que ya construía «Mis pacientes»,
añadiendo `Estado.nombre` y seleccionando las columnas necesarias de `Cita`.
No se añade una consulta por tarjeta: se conservan las dos consultas de citas del
dashboard. El servicio comprueba además el propietario antes de contar.
No cambian rutas, autenticación, asociaciones, modelos ni transiciones de citas.

Un error de consulta mantiene la respuesta de error del dashboard; no se oculta
con métricas ficticias en cero. Pug escapa los valores dinámicos y la barra ofrece
atributos de progreso accesibles.

## Gestionar Citas: agenda de solo consulta

El modal reutiliza la consulta existente de todas las citas del médico, protegida
por `auth`, `role(2)` y `where.medico_id` del perfil autenticado. No recibe un
propietario del navegador ni añade una ruta o consulta. Se seleccionan también
`hora` y `motivo_consulta` en esa consulta. El controlador prepara `citasAgenda`
con solo fecha, hora, nombre completo del paciente, motivo y nombre del estado.
No se envían al modal diagnósticos, tratamientos, documentos, correos ni teléfonos.

El listado se ordena ascendentemente por fecha y hora. `DATEONLY` se mantiene como
`YYYY-MM-DD` y `TIME` se presenta en 24 horas, sin convertirlos a la zona del
servidor o navegador. No se limita a hoy: permite consultar citas pasadas y futuras.
Sin motivo se muestra «Motivo no registrado»; una relación de paciente ausente
muestra «Paciente no disponible» y un estado ausente «Sin estado».

Los filtros de fecha exacta y estado se combinan sobre las tarjetas renderizadas.
Las opciones de estado son los nombres distintos de `EstadoCita` asociados a las
citas del médico, no una lista de IDs ni etiquetas inventadas. Solo se ofrecen
estados presentes en su listado; «Sin estado» no es una opción del catálogo.
«Todas las citas» limpia ambos filtros. Se muestra el número visible y total.

Sin registros se informa «No tienes citas registradas». Con registros que no
coinciden se informa «No se encontraron citas con los filtros seleccionados».
Una fecha inválida oculta resultados y muestra un aviso accesible de error,
recuperable corrigiendo la fecha o limpiando los filtros.

Pug escapa los textos y atributos; el filtrado solo cambia `hidden` y mensajes
mediante `textContent`. El modal no utiliza `innerHTML` ni realiza escrituras.
Se retiraron las tarjetas ficticias, sus botones de cancelar/reprogramar y el
formulario incompleto de reprogramación, junto con sus funciones sin otros usos.
Las rutas y acciones reales de otras secciones se conservan.

El diálogo se cierra con ambos botones, fondo o Escape. Retiene el foco con Tab,
lo devuelve al botón de apertura y restaura el desplazamiento de la página.
En móviles las tarjetas y filtros se apilan; solo el listado se desplaza.

Los datos llegan con el HTML del dashboard: no hay carga asíncrona ni indicador
artificial de espera. Un fallo de consulta mantiene el error HTTP 500 del
dashboard, sin mostrar una agenda vacía engañosa. Recargar la página actualiza
los datos; abrir de nuevo el modal conserva los filtros y no vuelve a consultar.
Se mantiene el volumen de la consulta existente, sin paginación. Si crece de forma
considerable, deberá evaluarse una consulta independiente con límites y filtros
en el servidor, sin cambiar el aislamiento por médico.

## Verificación

```powershell
node --experimental-test-module-mocks --test tests/medico/dashboardMetrics.test.js tests/medico/dashboard.test.js tests/medico/dashboardCards.test.cjs tests/medico/citasModal.test.cjs tests/medico/logout.test.js tests/medico/horariosAccess.test.js tests/medico/horariosModal.test.cjs tests/medico/historial.test.js tests/medico/horariosService.test.js
```

Las pruebas de métricas ejecutan el cálculo real con datos en memoria. Las del
controlador ejecutan rutas y middleware reales con modelos simulados; las de Pug
comprueban valores dinámicos, ceros, progreso y escape. Se incluyen médicos
distintos, los cinco estados definidos por el proyecto, pacientes repetidos,
duplicados y límites de día, semana, mes, año y febrero bisiesto en Bogotá.

La regresión médica contiene **67 pruebas aprobadas**, incluida selección de la
próxima cita, exclusiones por propietario, fecha, hora y estado, motivo ausente,
escape de nombres y motivos y estado vacío. Se conserva la identidad de dos
médicos, especialidad ausente y fecha visible en los cambios de día, mes y año
de Bogotá. El dashboard completo se compila y renderiza con datos simulados.
La agenda añade pruebas de propiedad, orden, datos mínimos, filtros combinables,
limpieza, estados por nombre, mensajes vacíos, error de fecha, escape, apertura,
cierre y manejo del foco. También se verificaron sintaxis JavaScript, compilación
y renderizado Pug, y ESLint. El modal se comprobó en Chrome con datos sintéticos,
con citas y sin citas a 1440, 390 y 320 px, sin desbordamiento horizontal,
incluyendo un motivo largo sin espacios. Se comprobaron filtros, limpieza,
error y teclado: seis escenarios correctos.

Como evidencia de la entrega anterior, las tarjetas se comprobaron en Chrome
con métricas sintéticas, tanto con citas como vacías, a 1672, 1024, 390 y 320 px:
cuatro, dos o una columna según el ancho; sin desbordamiento horizontal. Tailwind
se compila en una salida temporal y su CSS generado no se incluye en los commits.

No se ejecutaron consultas contra MySQL ni pruebas de persistencia. La validación
manual pendiente es comparar las tarjetas y la agenda con las citas y el catálogo real de la
base local, después de recompilar Tailwind. Cada integrante mantiene su propia
base de datos. `tests/database.test.js` queda fuera de esta comprobación porque
ejecuta migraciones e inserciones.
