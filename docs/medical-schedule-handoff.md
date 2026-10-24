# Informe técnico — Gestión de horarios médicos SIGCMI

Fecha de revisión: 23 de octubre de 2026, zona America/Bogota.

### 1. Estado final

- Rama utilizada: `feature/MedicalConexion`.
- Commit inicial: `221a6e7711f768d6374c57996891ff85918a8e07` — `feat: implement medical schedule persistence`.
- Commits creados: ninguno. La solicitud exige detener la integración ante conflictos que necesitan decisiones del equipo; se encontraron seis. No se resolvieron ni se publicaron cambios nuevos.
- Estado de Git: el cambio local preexistente en `routes/medico/medicoRoutes.js` es un espacio en un import y se conservó. `tests/` permanece sin seguimiento. Los únicos archivos nuevos de entrega son este informe y `docs/medical-schedule-test-results.json`. El programa temporal de verificación se retiró.
- Sincronización comprobada mediante `git fetch origin`: `HEAD` y `origin/feature/MedicalConexion` apuntan a `221a6e7`. `origin/develop` apunta a `2e83ccac727d6ba9c128f6571d1534330d65fe4b`.
- Funcionalidades completadas en el código existente: consultar, crear, modificar y retirar franjas pendientes del médico autenticado; múltiples franjas por día; validaciones; transacción; control de revisión; protección de aprobaciones y citas futuras; carga y guardado del modal.
- Funcionalidades verificadas en esta entrega: CRUD sobre MySQL aislado, rollback real, concurrencia, permisos, estados HTTP, persistencia entre conexiones y flujo frontend→HTTP→MySQL con DOM simulado.
- Pendientes: revisión visual manual en navegador y decisiones de integración con develop. La aprobación administrativa completa sigue siendo una integración futura.
- No se modificó código de producción: las pruebas no revelaron un fallo que requiriera corregirlo para el alcance acordado. No se considera terminada la integración con develop.

### 2. Archivos modificados

| Ruta | Qué cambió | Por qué fue necesario | Funciones importantes |
|---|---|---|---|
| `docs/medical-schedule-handoff.md` | Archivo nuevo de entrega | Explicar el módulo y documentar pruebas y bloqueos | Referencias y guía de estudio |
| `docs/medical-schedule-test-results.json` | Evidencia nueva, sin credenciales | Registrar 19 verificaciones reales y la base utilizada | Resultados, prefijo de tablas y comprobaciones de conexión |
| `routes/medico/medicoRoutes.js` | Ningún cambio hecho por esta entrega; se preservó su espacio local | No sobrescribir trabajo existente | GET y PUT `/horarios` |
| `tests/medico/horariosService.test.js` | Sin cambios; fuera de commits | Conservar las pruebas existentes | 14 pruebas del servicio |
| `tests/medico/horariosModal.test.cjs` | Sin cambios; fuera de commits | Conservar las pruebas existentes | 9 pruebas del modal |

Archivos del módulo que ya estaban implementados en el commit inicial y se auditaron: controlador, servicio, `public/medico/js/dashboardMedical.js`, modal Pug, modelos y asociaciones. No se modificaron `.env`, la configuración de conexión, modelos, rutas de otros módulos ni estilos compilados.

### 3. Explicación del backend

1. **Express y rutas.** `server.js:32` monta el router en `/medico`. `routes/medico/medicoRoutes.js:9` registra GET `/horarios` y la línea 11 registra PUT `/horarios`. Express procesa JSON en `app.js:26`.
2. **Autenticación.** `middleware/auth.js` obtiene la cookie `_token`, verifica el JWT y consulta el usuario. El usuario activo queda en `req.usuario`. La ausencia de sesión produce una redirección 302 al login: no debe confundirse con un PUT exitoso.
3. **Rol.** `middleware/role.js` exige `rol_id === 2` en ambos endpoints. Otro rol obtiene 403.
4. **Identidad médica.** El controlador GET (`controllers/medico/horariosController.js:15`) y el servicio PUT (`services/medico/horariosService.js:53`) buscan el perfil con `Medico.findOne({ where: { usuario_id: req.usuario.id_usuario } })`. Un `medico_id` del navegador nunca selecciona el propietario de la operación.
5. **GET.** `controllers/medico/horariosController.js:30` hace `Horario.findAll` filtrado por el perfil. Ordena con FIELD de lunes a domingo, luego por hora de inicio e ID. Devuelve los cinco campos públicos y una revisión; el aprobador y la fecha de creación se consultan para calcularla, no se exponen como autoridad editable.
6. **Modelo.** `models/Horario.js` representa la tabla `horarios`: ID, médico, día ENUM sin tildes, horas TIME, estado, aprobador y fecha de creación. No se añadieron columnas. `models/asociaciones.js:93` asocia Medico con Horario y relaciona el aprobador con Usuario mediante el alias Administrador.
7. **Revisión optimista.** `services/medico/horariosService.js:33` ordena por ID y calcula SHA-256 sobre ID, día, horas, estado, aprobador y fecha de creación. GET y PUT usan esa misma función. El cliente envía la revisión recibida; una captura desactualizada genera 409.
8. **Validaciones.** `normalizarHora` (línea 8) acepta HH:mm o HH:mm:ss y normaliza a segundos. `validarHorarios` (línea 14) admite hasta 200 franjas, días del ENUM, IDs enteros positivos y campos permitidos. Rechaza rangos invertidos y repetición de IDs. El servicio rechaza franjas activas duplicadas o superpuestas (líneas 73–76). Dos rangos contiguos son válidos: no se implementó un descanso obligatorio de 30 minutos.
9. **Transacción.** `crearServicioHorarios` (línea 45) devuelve la operación de guardado. `db.transaction` (línea 52) bloquea el perfil y los horarios con FOR UPDATE, comprueba revisión y restricciones antes de escribir. Cualquier excepción revierte la operación completa. No basta con capturar el error: debe propagarse fuera de la función transaccional.
10. **Citas existentes.** `Cita.findAll` (línea 79) consulta citas del médico desde la fecha actual de Bogotá. Solo utiliza `medico_id`, `fecha` y `hora`; no supone que Cita tenga `horario_id`. Se bloquea el cambio o retirada de una franja que cubre una cita futura. Por prudencia no se excluyen citas canceladas o completadas: esa política requiere definición del equipo.
11. **Crear.** `Horario.create` (línea 91) asigna en el servidor `medico_id`, estado Pendiente y aprobador nulo.
12. **Actualizar.** `Horario.update` (línea 94) cambia solo día y horas, filtrando por ID, médico, estado Pendiente y aprobador nulo. Verifica que se haya afectado exactamente una fila.
13. **Retirar.** `Horario.destroy` (línea 100) elimina únicamente pendientes omitidos en la configuración completa, con los mismos filtros. No hay borrado general del médico ni recreación indiscriminada de todas sus franjas.
14. **Aprobaciones.** Los horarios Aprobado y Rechazado deben incluirse sin cambios. No se alteran su aprobador, fecha o estado. Los rechazados se conservan como historial, pero no reservan disponibilidad para detectar solapamientos.
15. **Errores HTTP.** `guardarHorarios` del controlador (línea 52) distingue 400 validación, 401 identidad ausente si se invoca sin usuario, 403 ID ajeno, 404 perfil inexistente, 409 revisión/estado/citas/concurrencia y 500 interno. Los errores conocidos de bloqueo y restricciones SQL se traducen a conflicto. En el recorrido HTTP normal, `auth` devuelve 302 ante sesión inválida y `role` devuelve 403 antes del controlador.

Las consultas reales de prueba usaron los mismos modelos Sequelize, con cuatro tablas nuevas prefijadas dentro de la base aislada y las asociaciones relevantes de usuario, médico, horario, aprobador y cita. No se clonaron ni modificaron datos de desarrollo. Las dependencias no utilizadas por estas consultas —por ejemplo la relación completa con especialidades y pacientes— no forman parte de esa prueba aislada.

### 4. Explicación del frontend

- `abrirModalHorarios` en `public/medico/js/dashboardMedical.js:303` abre el modal, limpia el borrador anterior y consulta GET con las cookies del mismo origen y sin caché.
- `versionCargaHorarios` y AbortController evitan que una petición anterior repueble un modal cerrado o reabierto.
- La respuesta completa se valida antes de crear filas. Se comprueban IDs, días, estados y horas; los segundos se conservan en los datos originales cuando no hay edición.
- `mostrarDiaActivo` (línea 401) activa el interruptor sin crear una franja adicional. `mostrarHorario` (línea 408) construye elementos con createElement, asigna horas con `.value` y conecta el botón de eliminar mediante un evento. No interpola datos del servidor en innerHTML.
- `bloquearEdicionHorarios` (línea 285) protege filas aprobadas/rechazadas y bloquea los controles durante carga o guardado. El médico puede añadir pendientes al mismo día sin modificar los registros protegidos.
- `recogerHorarios` (línea 453) obtiene días, IDs y valores del DOM; no envía un médico elegido por el navegador ni concede autoridad sobre estado y aprobador. También detecta solapamientos antes del PUT.
- `guardarHorarios` (línea 484) evita doble envío, envía JSON con `{ horarios, revision }` y trata redirecciones de sesión, errores HTTP, respuestas no JSON y errores de red.
- Después de PUT exitoso vuelve a ejecutar GET. Solo muestra “guardados y verificados” después de esa lectura. Si el PUT fue confirmado pero el GET falla, lo informa sin presentar una verificación falsa.
- Cancelar descarta cambios visuales sin guardar. Durante el PUT no cierra el modal, porque cerrar el navegador o abortar un fetch no garantiza cancelar una transacción ya recibida por el servidor.
- El texto de estado y los botones están en `views/viewsMedico/includes/modalHorarios.pug`. El diseño y sus clases Tailwind se conservaron. Solo hay una inclusión de `dashboardMedical.js` en el layout médico.

### 5. Flujo completo

1. El médico abre Configurar Horarios.
2. GET valida su cookie y rol, obtiene su perfil y devuelve las franjas y la revisión.
3. El navegador representa los datos y permite editar pendientes.
4. Al pulsar Guardar se recopila una configuración completa; se validan las horas y se bloquea el doble envío.
5. PUT valida nuevamente la sesión y el rol: la validación del navegador nunca sustituye la del backend.
6. El servicio inicia la transacción, obtiene y bloquea el médico, y lee sus horarios bloqueados.
7. Comprueba propiedad de IDs, revisión, estados protegidos, solapamientos y citas futuras.
8. Crea, actualiza o elimina solo las diferencias autorizadas. Si cualquier paso falla, MySQL revierte las escrituras de esa transacción.
9. Tras commit, Express responde con el resultado. No se responde éxito antes de terminar la transacción.
10. El modal solicita GET otra vez y representa los registros persistidos, incluyendo sus IDs y estado Pendiente para los nuevos.

### 6. Pruebas realizadas

Se autorizó expresamente crear y utilizar **exclusivamente `sigcmi_medical_test_20261023`**. Para crearla, se verificó primero una conexión de administración a `information_schema` y se ejecutó únicamente CREATE DATABASE IF NOT EXISTS con el nombre autorizado. Una base que no existe aún no puede seleccionarse antes de crearla.

Después se conectó explícitamente a la base aislada y se ejecutó SELECT DATABASE(). Un hook verificó la identidad de la conexión física antes de cada consulta, incluidos DDL y DML: **255 comprobaciones en la ejecución final**. La primera ejecución tuvo 213 comprobaciones adicionales. No se conectó a `sigcmi` para consultar o escribir sus datos; solo se leyó la configuración existente en memoria, sin modificar `.env`.

Las tablas tienen prefijos exclusivos: `audit_1792794494171_` y `audit_1792794546168_`, con sufijos usuarios, medicos, horarios y citas. Se conservaron datos sintéticos para inspección; no se borró ninguna base ni tabla existente. El esquema se creó con sync normal sobre tablas nuevas prefijadas, nunca con force ni alter.

| Prueba | Resultado | Evidencia | Base de datos utilizada |
|---|---|---|---|
| 14 pruebas existentes del servicio | Ejecutadas: aprobadas | `node --test tests/medico/horariosService.test.js` | Dobles en memoria |
| 9 pruebas existentes del modal | Ejecutadas: aprobadas | `node --test tests/medico/horariosModal.test.cjs` | DOM y persistencia simulados |
| GET inicial y revisión | Ejecutada: aprobada | HTTP 200; arreglo vacío inicial y revisión SHA-256 | Aislada MySQL |
| Crear varias franjas contiguas | Ejecutada: aprobada | HTTP 200; tres filas Pendiente, aprobador nulo | Aislada MySQL |
| Actualizar conservando ID | Ejecutada: aprobada | GET confirmó nueva hora y mismo ID | Aislada MySQL |
| Eliminar pendiente | Ejecutada: aprobada | GET confirmó retirada y contador de eliminación | Aislada MySQL |
| Días, formatos y rangos inválidos; duplicados y solapamientos | Ejecutada: aprobada | HTTP 400 y fotografía posterior idéntica | Aislada MySQL |
| Ausencia de sesión y rol incorrecto | Ejecutada: aprobada | HTTP 302 y 403, respectivamente | Usuarios sintéticos de la aislada |
| Perfil médico inexistente | Ejecutada: aprobada | HTTP 404 | Aislada MySQL |
| ID ajeno y medico_id manipulado en query | Ejecutada: aprobada | HTTP 403; registros de ambos médicos conservados | Aislada MySQL |
| Editar o retirar aprobados/rechazados | Ejecutada: aprobada | HTTP 409; datos sin cambios | Aislada MySQL |
| Aprobador e idempotencia | Ejecutada: aprobada | Cero actualizaciones; aprobador original conservado | Aislada MySQL |
| Cita futura cubierta por franja | Ejecutada: aprobada | HTTP 409 antes de escribir | Aislada MySQL |
| Rollback tras segunda inserción fallida | Ejecutada: aprobada | Fallo inducido con hook de prueba; HTTP 500; ni la primera inserción permaneció | Aislada MySQL |
| Dos PUT concurrentes con la misma revisión | Ejecutada: aprobada | Un 200 y un 409 | Aislada MySQL |
| Persistencia entre conexiones | Ejecutada: aprobada | Nueva conexión SQL confirmó la cantidad persistida | Aislada MySQL |
| Entrega del JavaScript | Ejecutada: aprobada | HTTP 200 y contenido igual al archivo | Servidor HTTP aislado |
| Modal: GET → PUT → GET con varias franjas | Ejecutada: aprobada | JS de producción ejecutado con DOM simulado y fetch HTTP real | Aislada MySQL |
| Modal: nueva instancia de página | Ejecutada: aprobada | Segunda instancia recuperó las franjas persistidas | Aislada MySQL |
| Modal: editar y eliminar | Ejecutada: aprobada | PUT real y comprobación SQL de la hora y cantidad | Aislada MySQL |
| Modal: cancelar | Ejecutada: aprobada | No envió PUT; al reabrir no apareció el borrador | Aislada MySQL |
| Sintaxis JavaScript | Ejecutada: aprobada | node --check sobre servicio, controladores, router y frontend | Ninguna |
| Compilación Pug | Ejecutada: aprobada | Dashboard y ambos modales compilan | Ninguna |
| Compilación Tailwind | Ejecutada: aprobada | Salida temporal; no se sobrescribió output.css | Ninguna |
| Revisión visual en Chrome y dispositivos | Pendiente | No se ejecutó un navegador gráfico | No aplica |
| Merge efectivo y regresión conjunta con develop | Pendiente por conflictos | No se hizo merge, rebase ni cambio de rama | No aplica |

La ejecución final aislada contiene **19 verificaciones agrupadas aprobadas**, además de las 23 pruebas automatizadas existentes. La evidencia estructurada está en `medical-schedule-test-results.json`.

El controlador registró un error durante la prueba de rollback: era el fallo intencional de la segunda inserción, no un error pendiente. Express también emitió una advertencia de Promise-like al ejecutar manejadores en contextos vm de prueba; no se considera evidencia de un fallo en la ejecución normal del servidor. La prueba anterior de modal con DOM simulado se complement? con Chrome real; v?ase la ampliaci?n de evidencia al final.

No se añadieron ni modificaron archivos dentro de tests/. Sus hashes SHA-256 se conservaron:
- horariosService.test.js: `38FFBFB159BB6367AA2734B4D0AF36AF64C7F3F86707182981CC4005C5410C9C`.
- horariosModal.test.cjs: `30B11360B24EFCA0463725315DB76AEAA506DF3DEA37C12BC57D345890E49D12`.

### 7. Riesgos y compatibilidad

- **Seis conflictos textuales** en la simulación de merge con origin/develop: `config/db.js`, `package.json`, `public/medico/css/input.css`, `server.js`, `views/login/auth/login.pug` y `views/login/auth/register.pug`.
- La base común de la simulación fue `9a3fff28e5e7e8f4f725d2bf232530e22234a9aa`. Se usó git merge-tree de tres argumentos, sin alterar ramas ni el índice.
- No se resolvieron decisiones sobre conexión, dependencias, scripts, montaje de routers ni vistas compartidas. La configuración de conexión es sensible: revisar su estrategia sin copiar credenciales al informe o a nuevos commits.
- Una integración de toda la rama incorpora también cambios previos de Tailwind, login, registro, agenda y servidor. No es equivalente a integrar únicamente el último commit de horarios; los commits anteriores contienen dependencias.
- Aprobados y rechazados permanecen inmutables para el médico. Su cambio requiere definir un flujo administrativo. El módulo administrativo completo no se implementó.
- Las citas se protegen por fecha y hora de inicio, porque el modelo no contiene duración ni horario_id. No puede comprobarse el intervalo completo de una consulta sin esa definición.
- Se incluyen todos los estados de citas al proteger franjas futuras. Un futuro cambio que excluya canceladas debe acordarse y probarse.
- La concurrencia entre dos PUT médicos se probó en MySQL. Un futuro módulo administrativo debe usar reglas y bloqueos compatibles; no se verificó su integración simultánea.
- Los rechazados se conservan sin reservar disponibilidad. La política debe revisarse con el equipo antes de habilitar una nueva solicitud que sustituya una aprobación.
- No se exige descanso de 30 minutos: sigue pendiente de confirmación funcional.
- El estado de Git presenta una advertencia preexistente sobre `public/css/app.css./`. No se borró esa ruta ni se realizó limpieza ajena al módulo.
- La base principal quedó protegida mediante conexiones explícitas a la aislada y comprobación de DATABASE() en cada conexión de pruebas; no mediante un cambio temporal de .env que pudiera olvidarse.

### 8. Preparación para integración

- Commit funcional principal: `221a6e7`.
- Dependencias de horarios previas: `b421459`, `a43a34d`, `b1e931b` y `aeae251`. La rama también contiene commits anteriores del Portal Médico y Tailwind que deben revisarse como conjunto.
- No hay nuevos commits ni push de esta entrega. Las referencias de feature local y remota coinciden en el commit inicial; la documentación aún no se publicó.
- Cambios locales conservados: espacio en el import del router y tests sin seguimiento. No usar git add . o git add -A para preparar el commit de documentación: incluirían material que el usuario pidió excluir.
- Si el equipo aprueba publicar esta entrega, preparar un commit pequeño con rutas explícitas para los archivos de documentaci?n y evidencias revisados, por ejemplo `docs: document medical schedule verification and integration blockers`. No incluir tests, .env, el programa temporal ni bases de datos.
- Resolver los seis conflictos con los responsables de los archivos compartidos antes de un merge. No elegir automáticamente ours/theirs para conexión, servidor o autenticación.
- Después de acordarlo, refrescar origin y repetir la comprobación de conflictos. La simulación es válida para los hashes indicados, no garantiza el estado futuro del remoto.
- Realizar la integración en una rama de integración autorizada o mediante PR, sin modificar directamente develop/main desde este trabajo.
- Tras el merge: verificar parsers JSON, cookies, montaje /medico, auth y rol; compilar Pug y Tailwind; repetir CRUD aislado, permisos, rollback y concurrencia; probar visualmente el modal; verificar Agenda, Mis Pacientes y transiciones Pendiente → En Curso → Completada.
- El procedimiento de aprobación administrativa y la compatibilidad con citas debe quedar explícito en el PR.

### 9. Guía de estudio para el aprendiz

**Conceptos que debes poder explicar:**

- **Ruta y prefijo:** `/horarios` dentro del router se convierte en `/medico/horarios` por app.use.
- **Autenticación frente a autorización:** auth identifica al usuario; role comprueba si puede actuar como médico. El ID de usuario no es el ID de médico.
- **Límite de confianza:** los campos disabled del navegador no protegen MySQL. La autorización y las validaciones deben repetirse en el servidor.
- **Snapshot completo y diferencias:** omitir una franja pendiente significa retirarla; omitir una aprobada produce conflicto. Reemplazar todas las filas perdería aprobadores y IDs.
- **Transacción:** permite agrupar varias escrituras como una sola operación atómica. El callback administrado de Sequelize hace commit si resuelve y rollback si lanza un error.
- **Bloqueo pesimista:** FOR UPDATE evita que dos operaciones sobre el mismo médico decidan simultáneamente con los mismos datos.
- **Revisión optimista:** el hash detecta que el usuario está enviando una captura vieja, aunque la petición llegue después del bloqueo.
- **Intervalos:** el criterio de solapamiento es inicioA < finB e inicioB < finA. Por eso dos franjas contiguas no se superponen.
- **DOM seguro:** `.value` y textContent representan datos; interpolar cadenas externas en innerHTML puede interpretarlas como HTML ejecutable.
- **Estado del frontend:** guardandoHorario no garantiza por sí solo la atomicidad, pero evita doble clic y cierre engañoso. La garantía de datos la da el backend.
- **Pruebas:** un doble de base sirve para comprobar decisiones, pero no demuestra el comportamiento real del motor, los bloqueos o el commit. Esta entrega añadió evidencia real aislada sin modificar las pruebas existentes.

**Preguntas para defender el código:**

1. ¿Por qué no se recibe medico_id como autoridad desde el modal?
2. ¿Qué diferencia hay entre 400, 403 y 409? ¿Por qué auth devuelve 302 cuando falta sesión?
3. ¿Qué ocurriría si la primera franja se crea y la segunda falla fuera de una transacción?
4. ¿Por qué guardar devuelve conflicto al omitir una franja aprobada?
5. ¿Qué campos cambian la revisión y por qué incluir estado y aprobador?
6. ¿Qué protege el bloqueo del médico y qué protege el hash?
7. ¿Por qué no basta con contar las franjas para generar una revisión?
8. ¿Qué resultado tiene [08:00,10:00) junto a [10:00,12:00)?
9. ¿Por qué consultar GET después de un PUT correcto?
10. ¿Qué significa que PUT se confirmó, pero falló el GET posterior?
11. ¿Por qué una cancelación del navegador no necesariamente cancela una transacción del servidor?
12. ¿Qué pruebas todavía necesitan un navegador real?

**Ejercicios pequeños, solo sobre datos sintéticos o en papel:**

1. Recorre `validarHorarios` con un día inválido y explica por qué no debe abrirse la transacción.
2. Calcula manualmente el solapamiento de 08:00–10:00 con 09:30–11:00 y con 10:00–12:00.
3. Dibuja dos pestañas con la misma revisión y explica el resultado 200/409 observado.
4. Escribe un payload que conserve una aprobada, modifique una pendiente y añada una nueva. Identifica qué llamada Sequelize ejecutará cada franja.
5. Sigue el catch de guardarHorarios cuando recibe 400 y cuando recibe 409: ¿qué controles y qué revisión quedan disponibles?
6. Describe por qué Cita no permite inferir la hora de fin de una consulta.
7. Localiza dónde mostrarHorario evita inyectar HTML y dónde recogerHorarios conserva segundos existentes.
8. Antes de ejecutar una escritura de prueba, explica y comprueba SELECT DATABASE() con la conexión aislada. Nunca sustituyas la configuración principal para facilitar el ejercicio.

### 10. Resumen final

- **Qué funciona:** CRUD de pendientes del médico autenticado, múltiples franjas, validaciones, protección de aprobaciones y de citas futuras, revisión, rollback y concurrencia; el frontend consulta, guarda y vuelve a leer MySQL.
- **Qué no se habilitó:** edición/eliminación de aprobados y rechazados por el médico; aprobación administrativa completa. Son restricciones intencionales, no un guardado incompleto de pendientes.
- **Qué falta:** revisar visualmente en navegador y resolver con el equipo los seis conflictos de integración. Repetir las regresiones después de resolverlos.
- **¿Listo para integrar con develop?: NO.** El módulo pasó las pruebas aisladas ejecutadas, pero la integración directa tiene conflictos y falta la comprobación visual manual. No debe confundirse “CRUD verificado” con “merge listo”.
- Se respetó la base principal, se conservaron los cambios locales y tests, no se modificó .env y no se hicieron commits, push, merge ni rebase durante esta entrega.

### Ampliaci?n de evidencia: Chrome e integraci?n

Se utiliz? **Chrome/155.0.8059.85 real, en modo headless mediante CDP**, con perfil independiente. Chrome renderiz? Pug, CSS y JavaScript existentes y recibi? clics de navegador. Un servidor temporal local enlaz? el controlador, servicio y middlewares reales con cuatro modelos dirigidos a tablas sint?ticas existentes. No se utiliz? el servidor habitual ni una sesi?n de un m?dico real: esta comprobaci?n no certifica todo el arranque de server.js ni el login de producci?n.

La conexi?n apunt? exclusivamente a **sigcmi_medical_test_20261023**, prefijo audit_1792794546168_. Se verific? SELECT DATABASE() inicialmente y antes de cada consulta en la conexi?n f?sica. No se consult? ni escribi? sigcmi, no se modific? .env y no se crearon tablas adicionales en esta sesi?n.

Se ejecutaron 11 comprobaciones de comportamiento/viewport y una lectura de estilos. Crear, editar, eliminar, cancelar y recargar se comprobaron contra MySQL aislado. Las franjas sint?ticas temporales del s?bado se eliminaron mediante el propio modal y el borrador del domingo se descart?. El error de solapamiento se produjo sin guardar. El HTTP 500 se intercept? solo en la pesta?a: no se provoc? un fallo real de MySQL. Se mostr? un error y Guardar qued? bloqueado.

A 390 px el modal mide 370,5 px; a 320 px, 304 px; a 768 px, aproximadamente 729,6 px. El cuerpo permite desplazamiento interno y mantiene visible el pie. Las franjas no desbordan horizontalmente. El interruptor activo calcul? rgb(70, 93, 229), equivalente a #465DE5. **Observaci?n:** Guardar conserva una apariencia azul similar estando deshabilitado; el bloqueo funcional s? se comprob?. No se cambi? el dise?o para resolver esa observaci?n. No se prob? en dispositivos f?sicos ni se compararon autom?ticamente p?xeles con Figma.

Archivos nuevos o actualizados de esta revisi?n:

- Este informe actualizado.
- [Resultados de Chrome](medical-schedule-visual-results.json).
- [An?lisis detallado de los seis conflictos](medical-schedule-integration-conflicts.md).
- Capturas: [escritorio](medical-schedule-visual-desktop.png), [validaci?n](medical-schedule-visual-validation.png), [error HTTP](medical-schedule-visual-error.png), [m?vil](medical-schedule-visual-mobile.png), [pie m?vil](medical-schedule-visual-mobile-footer.png), [m?vil estrecho](medical-schedule-visual-small-mobile.png) y [tableta](medical-schedule-visual-tablet.png).

No se modificaron archivos de producci?n ni tests en esta revisi?n. No se aplicaron resoluciones, merge, cambios en develop, commits ni push. Las propuestas del an?lisis requieren revisi?n antes de implementarlas.

### Reorganización autorizada de vistas médicas — 23 de octubre de 2026

Este apartado actualiza el estado de las entregas históricas anteriores: las pruebas visuales previas ya se completaron y, posteriormente, se autorizó reorganizar las vistas. No se ha integrado develop.

Se movieron los siguientes seis archivos, sin cambiar IDs, clases, eventos ni bloques Pug:

| Ruta anterior bajo views/dashboardMedical/ | Ruta actual bajo views/viewsMedico/ |
|---|---|
| includes/sidebar.pug | includes/sidebar.pug |
| includes/modalGestion.pug | includes/modalGestion.pug |
| includes/modalHorarios.pug | includes/modalHorarios.pug |
| layout/layout.pug | layout/layout.pug |
| layout/main.pug | layout/main.pug |
| viewsMedico/dashboardMedical.pug | dashboardMedical.pug |

El único ajuste del dashboard es `extends layout/main`. El controlador `controllers/medico/medicoController.js` ahora renderiza `viewsMedico/dashboardMedical`, conservando usuario, médico, pacientes y citasHoy. Los tres includes relativos de main.pug siguen iguales. Ambos layouts permanecen separados, con sus bloques originales. La referencia documental al modal se actualizó a `views/viewsMedico/includes/modalHorarios.pug`.

Comprobaciones ejecutadas tras mover:

- Compilación de los seis archivos Pug: aprobada.
- Comparación de los cinco archivos auxiliares con HEAD: contenido idéntico normalizando CRLF/LF. Dashboard idéntico salvo el extends aprobado.
- Render mediante Express y la configuración real de app.js: HTTP 200; sidebar, Gestión de Citas y Horarios aparecen una sola vez; Agenda y Mis Pacientes están presentes.
- JavaScript y CSS médicos servidos por HTTP: ambos 200. No fue necesario cambiar ni regenerar CSS, porque el source de Tailwind ya cubre views y las utilidades no cambiaron.
- Sintaxis del controlador: aprobada.
- Pruebas existentes: 23 aprobadas, cero fallos. No se modificaron ni añadieron tests.
- Chrome real headless, tamaño de escritorio explícito: sidebar expandido/contraído, carga del modal, conversión HH:mm, añadir franja, cancelar y reabrir sin duplicados: aprobadas. Esta regresión utilizó datos sintéticos en memoria y no conectó a MySQL ni verificó persistencia SQL de nuevo. Las pruebas MySQL previas siguen documentadas por separado.
- La primera aserción de navegador esperaba sidebar de escritorio sin fijar el tamaño; falló porque se activó el comportamiento móvil. Se repitió con 1366×900 y pasó. También se corrigió una errata del verificador temporal; no requirió cambios en la aplicación.
- No quedan referencias activas a la antigua cadena de render en los controladores, routers, vistas o recursos del árbol local. El análisis conserva esa cadena únicamente como referencia histórica de develop.

Estado de integración: permanecen los seis conflictos de los commits HEAD/origin/develop documentados en `medical-schedule-integration-conflicts.md`. La simulación no incluye cambios locales aún sin commit. Además, el router remoto contiene un render antiguo que debe sustituirse por el controlador funcional y su ruta actual al integrar. No se resolvieron conflictos ni se ejecutó merge/rebase.

Cambios locales preservados: espacio previo del import del router, documentación sin seguimiento y tests sin seguimiento. No se modificaron modelos, autenticación, módulos de administración/pacientes/login, .env ni datos de sigcmi. No se hicieron commits ni push. El verificador temporal se retiró al terminar.
