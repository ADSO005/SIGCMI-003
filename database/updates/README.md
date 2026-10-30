# Migración semanal UH-012 con Sequelize CLI

La ejecución de UH-012 se realiza mediante `migrations/20261030031143-uh012-weekly-schedule.js`. El archivo `20261029_weekly_schedule.sql` se conserva como especificación y referencia de auditoría; no lo ejecutes manualmente ni junto con la migración.

Probada satisfactoriamente en **MySQL 8.0.46**, en `sigcmi_sql_uh012_test`: de 17 tablas originales y 22 claves foráneas se pasó a 19 tablas y 29 claves foráneas. Se verificaron siete relaciones semanales, cuatro índices explícitos y cinco columnas nuevas. La prueba utilizó tablas vacías; aún no demuestra por sí sola la conservación de todos los datos preexistentes. `sigcmi_integracion_test` ya contiene esta estructura y la migración la rechaza como destino.

## Alcance
- Crea `solicitudes_horarios` y `solicitudes_horarios_detalles`.
- Agrega tres columnas anulables a `horarios` y dos a `citas`.
- Conserva siete claves foráneas `RESTRICT`, cuatro índices explícitos y las claves primarias.
- No asigna duración, descanso ni vigencia a los registros antiguos.
- Las validaciones de semanas, franjas, permisos y concurrencia siguen en Sequelize y el servicio.

## Requisitos antes de ejecutar
1. Obtener autorización para el servidor y la base exacta; designar responsable y revisor.
2. Respaldar la base y comprobar que el respaldo es utilizable; no incluirlo en Git.
3. Detener la aplicación y los demás escritores. Solo una persona ejecutará la migración.
4. Configurar `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST` y `DB_PORT` en `.env`, que no debe subirse al repositorio.
5. Definir localmente `UH012_ALLOWED_DB` con el nombre exacto aprobado, independiente de `DB_NAME`. La migración exige que ambos coincidan y rechaza `sigcmi_integracion_test`.
6. Confirmar que la base no está vacía, usa MySQL 8.x o 9.7.x, modo estricto, claves foráneas activas e InnoDB, y que las tablas y relaciones base son compatibles.
7. No ejecutar sobre una base ya ampliada o parcialmente ampliada. La migración detiene esos casos; se requiere revisión específica.
8. Una base vacía necesita primero el esquema base oficial; UH-012 no instala todo SIGCMI.

Las comprobaciones de la migración validan el nombre exacto de destino, las siete tablas base, las columnas y relaciones requeridas, los nombres reservados y los conteos antes y después. Si falla una comprobación, la migración se detiene antes del DDL.

## Revisar y ejecutar
Desde la raíz del proyecto, primero revisa el estado:

```bash
npx sequelize-cli db:migrate:status
```

`db:migrate` ejecuta **todas** las migraciones pendientes. Continúa solo si revisaste la lista y UH-012 es la única pendiente o cada otra pendiente fue aprobada:

```bash
npx sequelize-cli db:migrate
```

La CLI registra la migración en `SequelizeMeta`. No marques la migración como ejecutada manualmente ni alteres esa tabla. Después, revisa las siete claves foráneas, los cuatro índices, los cinco campos nuevos y los conteos indicados en la sección 3 de `20261029_weekly_schedule.sql`; compara también los conteos de las siete tablas base con los valores previos.

## Si ocurre un error
MySQL puede confirmar cada sentencia DDL por separado. Si falla después de comenzar el DDL, pueden quedar aplicados algunos bloques mientras la migración no aparece en `SequelizeMeta`. Detente: registra el error, inspecciona qué objetos se crearon y solicita revisión; no vuelvas a ejecutar, no borres objetos y no cambies `SequelizeMeta` manualmente.

El `down` automático está deshabilitado para evitar borrar solicitudes o metadatos ya utilizados. Cualquier reversión requiere un plan separado, respaldo verificado y revisión autorizada. Una versión publicada de la migración no se reescribe; una corrección posterior requiere una migración nueva.