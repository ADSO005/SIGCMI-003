# Actualización semanal UH-012 desde MySQL Workbench

Probada satisfactoriamente en **MySQL 8.0.46**, en `sigcmi_sql_uh012_test`: de 17 tablas originales y 22 claves foráneas se pasó, tras los cuatro bloques, a 19 tablas y 29 claves foráneas. Se verificaron siete relaciones semanales, cuatro índices explícitos y cinco columnas nuevas, sin errores ni reintentos. **La prueba utilizó tablas vacías y todavía no demuestra conservación de datos preexistentes.** `sigcmi_integracion_test` ya está actualizada y no debe recibir nuevamente este SQL.

## Alcance
- Crea solicitudes_horarios y solicitudes_horarios_detalles.
- Agrega tres columnas a horarios y dos a citas, todas anulables.
- Conserva siete claves foráneas RESTRICT, cuatro índices explícitos y las claves primarias.
- No modifica registros existentes ni asigna duración, descanso o vigencia a datos antiguos.
- Las validaciones de semanas, franjas, permisos y concurrencia siguen en Sequelize y el servicio.

## Antes de comenzar
1. Obtener autorización para el servidor y la base exacta, y designar responsable y revisor.
2. Respaldar la base y comprobar que el respaldo es utilizable; no incluirlo en Git.
3. Detener la aplicación y cualquier escritor. Solo una persona ejecutará la actualización.
4. Abrir el SQL y sustituir BASE_AUTORIZADA_UH012 por el mismo nombre aprobado en todo el archivo.
5. No ejecutar todo el archivo: seleccionar únicamente las consultas previas de la sección 1.
6. Confirmar servidor, puerto, base, MySQL 8, modo estricto y claves foráneas activas (=1).
7. Revisar SHOW CREATE TABLE: InnoDB, claves compatibles y tipos INT con signo.
8. Horarios debe conservar fechas DATE obligatorias y sus ENUM de días y estados existentes.
9. Confirmar las relaciones previas de médico/usuario/especialidad y de horarios/citas con médico.
10. Las consultas de tablas, columnas, índices y restricciones nuevas deben devolver cero filas.
11. Guardar los conteos previos y revisar el registro de aplicaciones del equipo.
12. Si existe SequelizeMeta o sequelizemeta, revisar sus nombres de migraciones sin modificarla.

**Las consultas informan: no bloquean automáticamente un destino equivocado o una repetición.**
Si cualquier resultado es distinto del esperado o no se entiende, detenerse antes del DDL.
No utilizar sigcmi_integracion_test: ya contiene esta ampliación y no debe recibirla otra vez.
Base vacía: necesita primero el esquema base oficial; este archivo no instala todo SIGCMI.
Base ya ampliada o parcialmente ampliada: no ejecutar; comparar y solicitar revisión específica.

## Ejecutar los cuatro bloques individualmente, solo tras aprobar las comprobaciones
1. Bloque 1: crear solicitudes_horarios; revisar SHOW CREATE TABLE, sus campos, cuatro relaciones y dos índices.
2. Bloque 2: crear solicitudes_horarios_detalles; revisar sus cinco campos, relación e índice único.
3. Bloque 3: ampliar horarios; revisar sus tres columnas NULL, dos relaciones y el índice único nuevo.
4. Bloque 4: ampliar citas; revisar sus dos columnas INT NULL DEFAULT NULL.
Seleccionar cada sentencia completa hasta su punto y coma y revisar Action Output antes de continuar.
Calificar SHOW CREATE TABLE con la misma base autorizada, como en la sección 3 del SQL.
No desactivar claves foráneas ni ignorar errores para forzar la ejecución.

## Verificar y registrar
Ejecutar la sección 3: revisar definiciones, siete relaciones y cuatro índices; los cuatro conteos finales deben ser cero.
Repetir los siete conteos previos; deben coincidir. Esto no sustituye comparar datos anteriores con el respaldo.
Registrar en el acta del equipo: código 20261029_weekly_schedule, servidor, base, responsable, fecha y commit exacto del SQL.
Anotar resultado de cada bloque, verificaciones y ubicación segura del respaldo, sin contraseñas ni datos personales.
No escribir en SequelizeMeta ni crear un registro ficticio de migraciones; conservar el historial existente.
Una versión publicada del SQL no se reescribe: una corrección posterior necesita otra versión revisada.

## Si ocurre un error
Detenerse y registrar el mensaje y los objetos realmente creados; no volver a ejecutar todo el archivo.
MySQL puede confirmar cada DDL: una transacción no garantiza deshacer los bloques anteriores.
No borrar tablas ni registros, ni intentar una reparación automática; solicitar revisión y autorización aparte.
Antes de publicar o aplicar esta versión, probar éxito y fallos controlados en otra base aislada autorizada.
