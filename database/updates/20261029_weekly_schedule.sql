-- UH-012: actualización incremental para una base existente compatible.
-- ATENCIÓN: NO EJECUTAR TODO EL ARCHIVO. Leer primero README.md.
-- Sustituir BASE_AUTORIZADA_UH012 por el nombre exacto aprobado por el equipo.
-- No aplicar sobre sigcmi_integracion_test: ya contiene la estructura semanal.
-- Las consultas informativas NO bloquean automáticamente una ejecución equivocada.
-- Respaldar, detener escritores y trabajar con un responsable y un revisor.

-- ================================================================
-- 1. COMPROBACIONES PREVIAS: ejecutar solo estas consultas y revisarlas.
-- ================================================================
-- Confirmar servidor, puerto y base; el esquema de las operaciones será explícito.
SELECT DATABASE() AS base_seleccionada, @@hostname AS servidor, @@port AS puerto,
       VERSION() AS version_mysql, @@SESSION.sql_mode AS modo_sql,
       @@SESSION.foreign_key_checks AS claves_activas,
       'BASE_AUTORIZADA_UH012' AS base_prevista;

-- Revisar las tablas base: InnoDB, claves, tipos y restricciones compatibles.
-- Los identificadores deben ser INT con signo; horarios ya debe tener sus fechas.
SHOW CREATE TABLE `BASE_AUTORIZADA_UH012`.usuarios;
SHOW CREATE TABLE `BASE_AUTORIZADA_UH012`.medicos;
SHOW CREATE TABLE `BASE_AUTORIZADA_UH012`.pacientes;
SHOW CREATE TABLE `BASE_AUTORIZADA_UH012`.roles;
SHOW CREATE TABLE `BASE_AUTORIZADA_UH012`.especialidades;
SHOW CREATE TABLE `BASE_AUTORIZADA_UH012`.horarios;
SHOW CREATE TABLE `BASE_AUTORIZADA_UH012`.citas;

-- Ambas consultas deben devolver CERO filas: cualquier coincidencia exige detenerse.
SELECT TABLE_NAME FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'BASE_AUTORIZADA_UH012'
  AND LOWER(TABLE_NAME) IN ('solicitudes_horarios','solicitudes_horarios_detalles');
SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'BASE_AUTORIZADA_UH012'
  AND ((TABLE_NAME = 'horarios' AND COLUMN_NAME IN ('solicitud_detalle_id','vigente','sustituido_por_solicitud_id'))
    OR (TABLE_NAME = 'citas' AND COLUMN_NAME IN ('duracion_minutos','descanso_posterior_minutos')));

-- Comprobar nombres reservados; debe devolver CERO filas de ambos tipos.
SELECT TABLE_NAME, INDEX_NAME FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'BASE_AUTORIZADA_UH012'
  AND INDEX_NAME IN ('uq_solicitudes_medico_semana_version','ix_solicitudes_estado_semana','uq_solicitud_dia_franja','uq_horarios_solicitud_detalle');
SELECT TABLE_NAME, CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = 'BASE_AUTORIZADA_UH012'
  AND CONSTRAINT_NAME IN ('fk_solhor_medico','fk_solhor_solicitante','fk_solhor_base','fk_solhor_revisor','fk_solhordet_solicitud','fk_horarios_solicitud_detalle','fk_horarios_sustituida_por');

-- Guardar los conteos para compararlos al terminar; no sustituyen al respaldo.
SELECT 'usuarios' AS tabla, COUNT(*) AS total FROM `BASE_AUTORIZADA_UH012`.usuarios
UNION ALL SELECT 'medicos', COUNT(*) FROM `BASE_AUTORIZADA_UH012`.medicos
UNION ALL SELECT 'pacientes', COUNT(*) FROM `BASE_AUTORIZADA_UH012`.pacientes
UNION ALL SELECT 'roles', COUNT(*) FROM `BASE_AUTORIZADA_UH012`.roles
UNION ALL SELECT 'especialidades', COUNT(*) FROM `BASE_AUTORIZADA_UH012`.especialidades
UNION ALL SELECT 'horarios', COUNT(*) FROM `BASE_AUTORIZADA_UH012`.horarios
UNION ALL SELECT 'citas', COUNT(*) FROM `BASE_AUTORIZADA_UH012`.citas;

-- ================================================================
-- 2. ACTUALIZACIÓN: seleccionar y ejecutar UN bloque DDL por vez.
-- No continuar si una comprobación anterior falló o no se comprende su resultado.
-- Después de cada bloque, revisar la definición y registrar el resultado (README).
-- ================================================================

-- BLOQUE 1. Crear solicitudes_horarios: semana, versión, propietario y decisión administrativa.
CREATE TABLE `BASE_AUTORIZADA_UH012`.`solicitudes_horarios` (
    id_solicitud INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    medico_id INT NOT NULL,
    solicitado_por INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    version INT NOT NULL,
    solicitud_base_id INT NULL,
    revision_base CHAR(64) NOT NULL,
    estado ENUM('Pendiente','Aprobado','Rechazado','Retirada') NOT NULL DEFAULT 'Pendiente',
    decidido_por INT NULL,
    fecha_decision DATETIME NULL,
    motivo_decision TEXT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_solicitudes_medico_semana_version (medico_id, fecha_inicio, version),
    KEY ix_solicitudes_estado_semana (estado, fecha_inicio),
    CONSTRAINT fk_solhor_medico FOREIGN KEY (medico_id) REFERENCES `BASE_AUTORIZADA_UH012`.`medicos`(id_medico) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_solhor_solicitante FOREIGN KEY (solicitado_por) REFERENCES `BASE_AUTORIZADA_UH012`.`usuarios`(id_usuario) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_solhor_base FOREIGN KEY (solicitud_base_id) REFERENCES `BASE_AUTORIZADA_UH012`.`solicitudes_horarios`(id_solicitud) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_solhor_revisor FOREIGN KEY (decidido_por) REFERENCES `BASE_AUTORIZADA_UH012`.`usuarios`(id_usuario) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB;

-- BLOQUE 2. Crear solicitudes_horarios_detalles: se permiten varias franjas para un mismo día, no filas idénticas.
CREATE TABLE `BASE_AUTORIZADA_UH012`.`solicitudes_horarios_detalles` (
    id_detalle INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    solicitud_id INT NOT NULL,
    dia_semana ENUM('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    UNIQUE KEY uq_solicitud_dia_franja (solicitud_id, dia_semana, hora_inicio, hora_fin),
    CONSTRAINT fk_solhordet_solicitud FOREIGN KEY (solicitud_id) REFERENCES `BASE_AUTORIZADA_UH012`.`solicitudes_horarios`(id_solicitud) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB;

-- BLOQUE 3. Ampliar horarios: solo se agregan columnas; no se reclasifican horarios antiguos.
ALTER TABLE `BASE_AUTORIZADA_UH012`.`horarios`
    ADD COLUMN solicitud_detalle_id INT NULL,
    ADD COLUMN vigente BOOLEAN NULL DEFAULT NULL,
    ADD COLUMN sustituido_por_solicitud_id INT NULL,
    ADD UNIQUE KEY uq_horarios_solicitud_detalle (solicitud_detalle_id),
    ADD CONSTRAINT fk_horarios_solicitud_detalle FOREIGN KEY (solicitud_detalle_id) REFERENCES `BASE_AUTORIZADA_UH012`.`solicitudes_horarios_detalles`(id_detalle) ON DELETE RESTRICT ON UPDATE RESTRICT,
    ADD CONSTRAINT fk_horarios_sustituida_por FOREIGN KEY (sustituido_por_solicitud_id) REFERENCES `BASE_AUTORIZADA_UH012`.`solicitudes_horarios`(id_solicitud) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- BLOQUE 4. Ampliar citas; las citas antiguas conservan NULL.
ALTER TABLE `BASE_AUTORIZADA_UH012`.`citas`
    ADD COLUMN duracion_minutos INT NULL DEFAULT NULL,
    ADD COLUMN descanso_posterior_minutos INT NULL DEFAULT NULL;

-- ================================================================
-- 3. VERIFICACIONES POSTERIORES: revisar resultados antes de declarar éxito.
-- ================================================================
-- Revisar tipos completos, valores por defecto, claves y codificación de las tablas.
SHOW CREATE TABLE `BASE_AUTORIZADA_UH012`.solicitudes_horarios;
SHOW CREATE TABLE `BASE_AUTORIZADA_UH012`.solicitudes_horarios_detalles;
SHOW CREATE TABLE `BASE_AUTORIZADA_UH012`.horarios;
SHOW CREATE TABLE `BASE_AUTORIZADA_UH012`.citas;

-- Ver las siete relaciones nuevas: todas deben indicar RESTRICT en ambas reglas.
SELECT k.TABLE_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_NAME,
       k.REFERENCED_COLUMN_NAME, r.DELETE_RULE, r.UPDATE_RULE
FROM information_schema.KEY_COLUMN_USAGE AS k
JOIN information_schema.REFERENTIAL_CONSTRAINTS AS r
  ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA AND r.TABLE_NAME = k.TABLE_NAME
 AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
WHERE k.TABLE_SCHEMA = 'BASE_AUTORIZADA_UH012'
  AND k.REFERENCED_TABLE_NAME IS NOT NULL
  AND (k.TABLE_NAME IN ('solicitudes_horarios','solicitudes_horarios_detalles')
    OR (k.TABLE_NAME = 'horarios' AND k.COLUMN_NAME IN ('solicitud_detalle_id','sustituido_por_solicitud_id')))
ORDER BY k.TABLE_NAME, k.COLUMN_NAME;

-- Ver los cuatro índices explícitos; NON_UNIQUE=0 significa índice único.
SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME
FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'BASE_AUTORIZADA_UH012'
  AND INDEX_NAME IN ('uq_solicitudes_medico_semana_version','ix_solicitudes_estado_semana','uq_solicitud_dia_franja','uq_horarios_solicitud_detalle')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- Los cuatro resultados siguientes deben ser CERO inmediatamente tras la instalación.
SELECT 'solicitudes' AS comprobacion, COUNT(*) AS total FROM `BASE_AUTORIZADA_UH012`.solicitudes_horarios
UNION ALL SELECT 'detalles', COUNT(*) FROM `BASE_AUTORIZADA_UH012`.solicitudes_horarios_detalles
UNION ALL SELECT 'horarios_con_metadatos', COUNT(*) FROM `BASE_AUTORIZADA_UH012`.horarios
WHERE solicitud_detalle_id IS NOT NULL OR vigente IS NOT NULL OR sustituido_por_solicitud_id IS NOT NULL
UNION ALL SELECT 'citas_con_duracion_o_descanso', COUNT(*) FROM `BASE_AUTORIZADA_UH012`.citas
WHERE duracion_minutos IS NOT NULL OR descanso_posterior_minutos IS NOT NULL;

-- Repetir ahora la consulta de conteos de la sección 1 y comparar sus siete resultados.
-- La igualdad de conteos no demuestra igualdad de valores: conservar y revisar el respaldo.
-- Registrar servidor, base, responsable, fecha, commit del SQL y resultado de cada bloque.
