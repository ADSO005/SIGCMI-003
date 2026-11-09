# UH-014 — Guardado y edición de diagnóstico: etapa 1

## Alcance y permisos

Se reutilizan `Diagnostico`, sus asociaciones y el índice único de `cita_id`.
No hay cambios de modelos, migraciones, autenticación, administración o paciente.
No se incluyen interfaz ni prescripciones.

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
5. Si otro guardado cambió el contenido, responde 409. La interfaz futura deberá
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
La futura interfaz debe conservar y enviar lo que quiera mantener. No debe copiar
el objeto de respuesta completo al cuerpo: sus IDs y fecha son de solo lectura.

La revisión se calcula con los campos clínicos, ID, cita y fecha del registro,
en orden estable. Los decimales se representan con su escala fija y la fecha
como instante ISO, para no cambiar la revisión por diferencias de formato del ORM.
Se compara dentro de la transacción antes de escribir. Una creación reenviada con
`revision: null` devuelve 409 si ya existe el diagnóstico; no crea otro registro.
Enviar el mismo contenido y revisión vigente conserva la misma revisión.

No es una columna de versión ni un historial de cambios: no registra autores ni
ediciones anteriores. Si el contenido cambia y vuelve exactamente al original,
su revisión vuelve a ser la misma. Tampoco incluye las prescripciones de una futura
etapa. El token no reemplaza autenticación, propiedad ni validación de estado.

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
en ISO; la interfaz futura deberá presentarlo en `America/Bogota`. No se altera la
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

Guardar no modifica el estado de la cita. Finalizar sigue usando exclusivamente
`PATCH /medico/citas/:id/estado` y requiere `En Curso` y un diagnóstico persistido
con texto no vacío y dentro del límite. Una fila clínica vacía ya no basta.
Guardar y finalizar son dos operaciones separadas: si falla finalizar, el registro
guardado permanece y la cita sigue En Curso. No se habilita el botón de finalizar.
No se resuelven aquí las reglas administrativas preexistentes entre módulos.

## Verificación y pendientes

`tests/medico/diagnostico.test.js` contiene 17 pruebas con rutas y middleware reales,
modelos simulados y transacciones/bloqueos en memoria. Se prueban permisos, propiedad,
estados con IDs distintos, validaciones, creación, edición, revisión, reenvíos,
concurrencia, rollback, errores sin texto clínico y guardado seguido de finalización.
`citasEstado.test.js` incorpora el rechazo de diagnósticos vacíos al finalizar.
Los mocks de logout y horarios solo se adaptan a los nuevos imports de rutas.

La regresión completa suma **107 pruebas aprobadas**. Pasan sintaxis JavaScript,
ESLint y las pruebas existentes de compilación y renderizado Pug. No se accede a
MySQL, no se modifican las tres citas ni se ejecuta `tests/database.test.js`.
La concurrencia simulada no equivale a verificar bloqueos o rollback en MySQL real.

```powershell
node --experimental-test-module-mocks --test tests/medico/diagnostico.test.js tests/medico/citasEstado.test.js tests/medico/atencionVisual.test.cjs tests/medico/dashboardMetrics.test.js tests/medico/dashboard.test.js tests/medico/dashboardCards.test.cjs tests/medico/citasModal.test.cjs tests/medico/logout.test.js tests/medico/horariosAccess.test.js tests/medico/horariosModal.test.cjs tests/medico/historial.test.js tests/medico/horariosService.test.js
```

Quedan pendientes la interfaz, las prescripciones y pruebas autorizadas sobre
MySQL real. La historia no incluye trazabilidad de versiones. Los registros
persistidos siguen siendo visibles según las consultas existentes de historial
y administración; no se implementa un borrador privado.
