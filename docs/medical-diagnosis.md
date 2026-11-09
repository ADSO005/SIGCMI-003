# UH-014 — Registro y edición de diagnóstico

## Alcance y permisos

Se reutilizan `Diagnostico`, `Prescripcion`, sus asociaciones y el índice único
de `cita_id`. Una migración incremental agrega a `diagnosticos` la decisión de
medicamentos y su versión. Se validó en una base MySQL temporal aislada; no se
aplicó a las bases locales del proyecto. Las asociaciones existentes no cambian.

- `GET /medico/citas/:id/diagnostico`: obtiene el registro y su revisión.
- `PUT /medico/citas/:id/diagnostico`: crea o reemplaza los campos clínicos.

Ambas rutas usan `auth` y `role(2)`. El perfil se identifica exclusivamente por
`req.usuario.id_usuario`; la cita se consulta por ID y médico propietario.
Solo se permite acceder a este recurso cuando su estado se llama `En Curso`,
independientemente de su ID de catálogo. Puede ser una cita de días anteriores.
La consulta histórica existente de UH-015 se conserva para los registros previos.

Una cita ajena e inexistente reciben la misma respuesta, sin datos clínicos.
El recurso responde con `Cache-Control: no-store`. No se aceptan identificadores
de médico, paciente, diagnóstico o cita en el cuerpo ni un estado o fecha enviados
por el cliente. Las prescripciones también se rechazan como campo inesperado.

## Contrato y revisión optimista

1. Consultar con GET antes de editar. Sin registro devuelve `diagnostico: null`
   y `revision: null`, con HTTP 200.
2. Crear con PUT enviando `revision: null` y el diagnóstico obligatorio.
3. La respuesta 201 contiene el registro y una revisión SHA-256 de 64 caracteres.
4. Para editar, enviar esa revisión y los campos clínicos completos. Devuelve 200
   con el contenido persistido y la revisión resultante.
5. Si otro guardado cambió el contenido, responde 409. La interfaz debe
   consultar de nuevo y permitir revisar los cambios; no reintentar sobrescribiendo
   automáticamente la revisión nueva.

Ejemplo de primer guardado, solo como contrato; no se ejecutó contra MySQL:

```json
{
  "revision": null,
  "diagnostico": "Diagnóstico ficticio de prueba",
  "sintomas": "Texto opcional",
  "temperatura": "37.0",
  "altura": "1.70",
  "peso": "70.50",
  "frecuencia_cardiaca": 80,
  "presion_arterial": "120/80"
}
```

PUT reemplaza los campos clínicos: los opcionales omitidos o vacíos pasan a `null`.
La interfaz conserva y envía lo que quiera mantener. No debe copiar
el objeto de respuesta completo al cuerpo: sus IDs y fecha son de solo lectura.

La revisión se calcula con los campos clínicos, ID, cita y fecha del registro,
en orden estable. Los decimales se representan con su escala fija y la fecha
como instante ISO, para no cambiar la revisión por diferencias de formato del ORM.
Se compara dentro de la transacción antes de escribir. Una creación reenviada con
`revision: null` devuelve 409 si ya existe el diagnóstico; no crea otro registro.
Enviar el mismo contenido y revisión vigente conserva la misma revisión.

No es una columna de versión ni un historial de cambios: no registra autores ni
ediciones anteriores. Si el contenido cambia y vuelve exactamente al original,
su revisión vuelve a ser la misma. La revisión del diagnóstico no incluye las
prescripciones; estas utilizan `version_prescripciones`. El token no reemplaza
autenticación, propiedad ni validación de estado.

## Campos y validaciones

| Campo | Regla del servidor |
|---|---|
| `diagnostico` | Texto obligatorio, no vacío tras quitar espacios exteriores; máximo 65535 bytes UTF-8. |
| `sintomas`, `tratamiento`, `notas_adicionales` | Textos opcionales, mismo límite de `TEXT`. |
| `temperatura` | Opcional; DECIMAL(4,1), hasta tres dígitos enteros y uno decimal, en °C. |
| `altura` | Opcional; DECIMAL(4,2), hasta dos dígitos enteros y dos decimales, en metros. |
| `peso` | Opcional; DECIMAL(5,2), hasta tres dígitos enteros y dos decimales, en kg. |
| `frecuencia_cardiaca` | Opcional; entero de 32 bits con signo, en lpm. |
| `presion_arterial` | Texto opcional de máximo 20 caracteres: dos grupos de dígitos separados por `/`; se normalizan espacios alrededor de la barra. |
| `revision` | Obligatoria: `null` para crear o hash hexadecimal de 64 caracteres obtenido al leer. |

Se aceptan números y cadenas numéricas para decimales y frecuencia. No se redondea
para admitir escalas excesivas; se rechazan formatos exponenciales y tipos ajenos.
Los límites son de almacenamiento, no rangos clínicos: no se agregan mínimos
médicos ni se excluyen signos permitidos por las columnas. Vacío, espacios y
`null` se normalizan a `null` en los opcionales. Los textos se guardan como texto,
sin interpretar HTML; su representación debe seguir usando Pug escapado o
`textContent`. El parser JSON global conserva su límite existente de petición;
no se ha ampliado para aceptar varios textos muy grandes en una sola solicitud.

`fecha_diagnostico` se asigna con `new Date()` del servidor al crear, siguiendo la
convención existente de Sequelize. Representa un instante y la respuesta lo entrega
en ISO; al presentar este instante debe usarse `America/Bogota`. No se altera la
fecha al editar ni se sustituye la fecha programada de la cita.

## Transacciones, respuestas y finalización

Se bloquea primero la cita y después su diagnóstico, igual que en UH-013. La
lectura de revisión y la creación o edición se realizan bajo la misma transacción.
El índice único conserva un solo diagnóstico por cita; una violación de unicidad
devuelve conflicto. La respuesta de éxito se envía tras confirmar la transacción.

Respuestas: 200 al consultar o editar; 201 al crear; 400 para entradas inválidas;
404 para perfil ausente o cita no disponible; 409 para estado, revisión o unicidad;
500 para fallos internos. Los middleware existentes conservan su redirección al
login si no hay sesión y el 403 por rol incorrecto. Los errores del ORM no se
imprimen porque pueden contener SQL y datos clínicos; se registra solo un mensaje
genérico. Las operaciones del diagnóstico desactivan el logging SQL localmente,
sin cambiar la configuración compartida. Los conflictos no devuelven el contenido
de otro guardado.

«Guardar borrador» no modifica el estado de la cita. «Finalizar consulta» usa
exclusivamente `PATCH /medico/citas/:id/estado`. Requiere `En Curso`, un diagnóstico
persistido válido y una decisión de medicamentos distinta de `Pendiente`. Si la
decisión es `Requiere`, debe existir al menos una prescripción válida; si es `No
requiere`, no debe existir ninguna. Si falla la finalización, los registros
guardados permanecen y la cita sigue `En Curso`. El servidor rechaza la edición
del diagnóstico cuando la cita ya está Completada, incluso si se omite la interfaz.

## Decisión de medicamentos y prescripciones

`GET /medico/citas/:id/medicamentos` y `PUT /medico/citas/:id/medicamentos` usan
`auth` y `role(2)`. El servidor identifica al médico desde la sesión y restringe
ambas operaciones a citas de su propiedad. Se requiere un diagnóstico guardado
con texto válido. GET permite consultar la decisión, la versión y las
prescripciones; no modifica registros.

PUT solo guarda mientras la cita esté `En Curso`. El cuerpo contiene exactamente
`decision_medicamentos`, `version_prescripciones` y `medicamentos`. La decisión
acepta `Requiere` o `No requiere`; `Pendiente` se conserva como valor inicial,
pero no se acepta como decisión guardada. Cada medicamento requiere
`nombre_medicamento`, `dosis`, `frecuencia` y `duracion`, respetando los límites
de sus columnas.

Para `Requiere`, la operación debe dejar al menos una prescripción válida. Se
pueden agregar medicamentos sin reemplazar los existentes. Para `No requiere`,
la lista enviada debe estar vacía y no debe haber prescripciones guardadas; si
ya existen, el servidor responde con conflicto y no las elimina. No hay rutas
para editar o eliminar medicamentos individuales.

El cliente envía la versión que obtuvo con GET. El servidor bloquea la cita y
el diagnóstico dentro de una transacción, comprueba la versión y realiza en esa
misma transacción la actualización de decisión/versión y la inserción de nuevos
medicamentos. Cada guardado exitoso incrementa `version_prescripciones` una vez.
Una versión desactualizada devuelve HTTP 409 antes de modificar registros; un
reintento con esa versión no vuelve a insertar los medicamentos. Si falla una
inserción, la transacción revierte la actualización de la decisión y la versión.

El guardado de medicamentos y la finalización siguen el mismo orden de bloqueo:
cita, diagnóstico y prescripciones. Así, una finalización concurrente espera el
guardado o, si completa primero, el guardado posterior encuentra que la cita ya
no está `En Curso` y responde con conflicto.

## Modal desde «Continuar consulta»: interfaz de etapa 2

El contexto autorizado En Curso abre un modal independiente de atención médica,
con paciente, fecha, hora, motivo y estado de solo lectura. También funciona con
consultas de días anteriores. «Mi Agenda de hoy» conserva solo tarjetas compactas;
no contiene campos clínicos. El diálogo está fuera del contenido normal del dashboard.
Incluye cinco signos vitales opcionales, síntomas, diagnóstico obligatorio,
tratamiento y notas. Los campos tienen etiquetas y unidades. Las operaciones de
medicamentos se describen en la sección de API; este modal conserva el formulario
de diagnóstico.
«Gestionar Citas» permanece exclusivamente de consulta.

Se utiliza `dialog.showModal()` con fondo oscuro, encabezado azul y el patrón visual
del modal de horarios: ancho máximo de 960 px, altura máxima de 92dvh, cuerpo con
desplazamiento y acciones visibles en el pie. El encabezado distingue carga,
diagnóstico guardado, ausencia de registro, cambios sin guardar y conflicto.
Guardar se asocia al formulario desde el pie; Cerrar aparece allí y en el encabezado.

El enlace continúa recuperando el contexto con el GET existente del dashboard.
Al cargarlo se abre el modal; el enlace de esa cita permite reabrirlo sin navegar.
Cada apertura vuelve a consultar el diagnóstico. No se agregan endpoints ni se
modifican validaciones del backend o del formulario.

Al abrir se consulta GET con `no-store`. La edición permanece deshabilitada hasta
recibir todos los campos y una revisión válida. Sin registro, se habilita vacío
con revisión `null`. Si falla la carga inicial, se informa y permite reintentar.
Un estado no editable, cita no disponible o permiso inválido bloquean la edición.

Guardar valida diagnóstico, bytes UTF-8, precisión decimal, entero y presión,
sin imponer rangos clínicos nuevos. PUT envía siempre los nueve campos clínicos
y la revisión, incluso cuando los opcionales son `null`. Durante la petición se
bloquean campos y Guardar para evitar duplicados y cambios mientras espera.
Una respuesta correcta actualiza los valores normalizados y la revisión para
la siguiente edición, sin cambiar el estado de la cita. El encabezado muestra
«Sin borrador guardado» o «Borrador guardado»; tras guardar se confirma «Borrador
guardado. Puedes continuar la atención».

Ante errores HTTP, de red o validación, los valores escritos permanecen. Un 409
no actualiza la revisión ni sobrescribe: deshabilita Guardar y ofrece consultar
la versión reciente. Esta se presenta aparte, como texto de solo lectura. El
médico puede ocultarla conservando sus datos o pulsar «Reemplazar mi formulario
con esta versión»; solo se reemplazan campos y revisión después de confirmar.
No se realiza una mezcla automática. Si la consulta reciente detecta que la cita
ya no está En Curso, se conserva el contenido local pero se bloquea la edición.

Los textos se asignan a `value` y `textContent`, nunca a `innerHTML`. Los errores
se anuncian con `role=alert`, hay foco en el campo inválido y aviso de salida con
cambios sin guardar. El cierre por botones, Escape o fondo pide confirmación si
los valores difieren de los cargados o guardados. Cancelar conserva los datos y
mantiene abierto el modal; confirmar descarta solo cambios locales. Si no hay
cambios pendientes, el cierre es inmediato. No se cierra mientras un PUT está
en curso. Un GET tardío se ignora si el modal ya se cerró o se abrió nuevamente.
Al cerrar se restaura el foco en «Continuar consulta» y el desplazamiento previo.
El fondo queda inerte por el diálogo nativo; Tab y Shift+Tab recorren sus controles
visibles y Escape respeta el cierre seguro.

Los datos locales están solo en memoria: no se guardan en
almacenamiento del navegador, y salir tras confirmar puede descartarlos. Una
pérdida de conexión no demuestra si un PUT llegó a confirmarse: se puede consultar
la versión reciente antes de reintentar; la revisión del backend sigue protegiendo
contra sobrescrituras y duplicados.

## Verificación y pendientes

Los resultados numéricos que siguen corresponden a validaciones anteriores de
diagnóstico e interfaz; no verifican los endpoints de medicamentos ni la nueva
condición de finalización.

`tests/medico/diagnostico.test.js` contiene 17 pruebas con rutas y middleware reales,
modelos simulados y transacciones/bloqueos en memoria. Se prueban permisos, propiedad,
estados con IDs distintos, validaciones, creación, edición, revisión, reenvíos,
concurrencia, rollback, errores sin texto clínico y guardado seguido de finalización.
`citasEstado.test.js` incorpora el rechazo de diagnósticos vacíos al finalizar.
Los mocks de logout y horarios solo se adaptan a los nuevos imports de rutas.

La etapa backend registró **107 pruebas aprobadas**. La segunda etapa incorpora
diecisiete pruebas en `tests/medico/diagnosticoForm.test.cjs`: carga, creación, edición,
opcionales, validación, duplicados, conflictos, errores, bloqueo y texto seguro.
El formulario inicial registró **117 pruebas aprobadas**. El traslado a modal
añade tres casos de cierre seguro, foco, reapertura, bloqueo durante PUT y carga
tardía; la regresión actual suma **125 pruebas aprobadas**. Pasan sintaxis JavaScript,
ESLint y las pruebas existentes de compilación y renderizado Pug. No se accede a
MySQL, no se modifican las tres citas ni se ejecuta `tests/database.test.js`.
La concurrencia simulada no equivale a verificar bloqueos o rollback en MySQL real.
En Chrome se verificaron nueve escenarios del modal con GET/PUT simulados: sin
registro, con registro y con conflicto, a 1440, 390 y 320 px. Pasaron apertura y
reapertura, cierre normal, confirmación, Escape durante cambios y PUT, ciclo de
foco, fondo inerte, guardado, revisión y conservación de datos. La agenda no tiene
campos clínicos en su flujo y conserva su tamaño compacto. El modal queda dentro
del viewport, con desplazamiento interno y sin desbordamiento horizontal.
El CSS se compiló solo en una carpeta
temporal. No son pruebas de escritura contra MySQL real.

```powershell
node --experimental-test-module-mocks --test tests/medico/diagnosticoForm.test.cjs tests/medico/diagnostico.test.js tests/medico/citasEstado.test.js tests/medico/atencionVisual.test.cjs tests/medico/dashboardMetrics.test.js tests/medico/dashboard.test.js tests/medico/dashboardCards.test.cjs tests/medico/citasModal.test.cjs tests/medico/logout.test.js tests/medico/horariosAccess.test.js tests/medico/horariosModal.test.cjs tests/medico/historial.test.js tests/medico/horariosService.test.js
```

Los endpoints de prescripciones y la validación para finalizar están descritos
arriba. La versión controla actualizaciones concurrentes de la lista, pero no es
un historial de cambios ni identifica autores. Los registros
persistidos siguen siendo visibles según las consultas existentes de historial
y administración; no se implementa un borrador privado.
