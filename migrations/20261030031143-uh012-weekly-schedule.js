'use strict';

const BASE_TABLES = [
  'usuarios',
  'medicos',
  'pacientes',
  'roles',
  'especialidades',
  'horarios',
  'citas',
];

const NEW_TABLES = ['solicitudes_horarios', 'solicitudes_horarios_detalles'];
const NEW_COLUMNS = {
  horarios: ['solicitud_detalle_id', 'vigente', 'sustituido_por_solicitud_id'],
  citas: ['duracion_minutos', 'descanso_posterior_minutos'],
};
const INDEXES = {
  uq_solicitudes_medico_semana_version: true,
  ix_solicitudes_estado_semana: false,
  uq_solicitud_dia_franja: true,
  uq_horarios_solicitud_detalle: true,
};
const FOREIGN_KEYS = [
  'fk_solhor_medico',
  'fk_solhor_solicitante',
  'fk_solhor_base',
  'fk_solhor_revisor',
  'fk_solhordet_solicitud',
  'fk_horarios_solicitud_detalle',
  'fk_horarios_sustituida_por',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function quoteIdentifier(identifier) {
  assert(/^[A-Za-z0-9_]+$/.test(identifier), 'El nombre de base contiene caracteres no permitidos.');
  const tick = String.fromCharCode(96);
  return tick + identifier + tick;
}

async function rows(queryInterface, sql, options = {}) {
  const [result] = await queryInterface.sequelize.query(sql, options);
  return result;
}

async function tableCounts(queryInterface, schemaSql) {
  const result = {};
  for (const table of BASE_TABLES) {
    const found = await rows(
      queryInterface,
      'SELECT COUNT(*) AS total FROM ' + schemaSql + '.' + quoteIdentifier(table)
    );
    result[table] = String(found[0].total);
  }
  return result;
}

async function preflight(queryInterface) {
  const configuredDatabase = process.env.DB_NAME;
  const approvedDatabase = process.env.UH012_ALLOWED_DB;
  assert(configuredDatabase, 'Falta DB_NAME en la configuración de Sequelize.');
  assert(approvedDatabase, 'Define UH012_ALLOWED_DB localmente con el nombre exacto aprobado para esta ejecución.');
  assert(configuredDatabase === approvedDatabase, 'DB_NAME no coincide exactamente con UH012_ALLOWED_DB.');
  assert(
    approvedDatabase.toLowerCase() !== 'sigcmi_integracion_test',
    'UH-012 ya está aplicada en sigcmi_integracion_test; se rechaza ese destino.'
  );
  const schemaSql = quoteIdentifier(approvedDatabase);

  const server = (await rows(queryInterface, `
    SELECT DATABASE() AS selected_database, @@hostname AS hostname, @@port AS port,
           VERSION() AS version, @@SESSION.sql_mode AS sql_mode,
           @@SESSION.foreign_key_checks AS foreign_key_checks
  `))[0];
  assert(server && server.selected_database === approvedDatabase, 'La conexión está en una base distinta a la aprobada.');
  assert(/^(?:8\.|9\.7\.)/.test(String(server.version)), 'UH-012 requiere MySQL 8.x o 9.7.x.');
  assert(Number(server.foreign_key_checks) === 1, 'Las claves foráneas deben estar activas.');
  const sqlModes = String(server.sql_mode).split(',').map((mode) => mode.trim());
  assert(
    sqlModes.includes('STRICT_TRANS_TABLES') || sqlModes.includes('STRICT_ALL_TABLES'),
    'La sesión de MySQL debe tener modo estricto.'
  );

  const tables = await rows(queryInterface, `
    SELECT TABLE_NAME, ENGINE FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = :schema AND TABLE_NAME IN (:tableNames)
  `, { replacements: { schema: approvedDatabase, tableNames: BASE_TABLES } });
  assert(tables.length === BASE_TABLES.length, 'Falta alguna tabla base requerida; no se ejecutó DDL.');
  assert(tables.every((table) => table.ENGINE === 'InnoDB'), 'Todas las tablas base deben usar InnoDB.');

  const requiredColumns = [
    ['usuarios', 'id_usuario'],
    ['medicos', 'id_medico'],
    ['pacientes', 'usuario_id'],
    ['medicos', 'usuario_id'],
    ['medicos', 'especialidad_id'],
    ['horarios', 'medico_id'],
    ['horarios', 'fecha_inicio'],
    ['horarios', 'fecha_fin'],
    ['horarios', 'dia_semana'],
    ['horarios', 'estado'],
    ['citas', 'medico_id'],
  ];
  const columnRows = await rows(queryInterface, `
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = :schema
  `, { replacements: { schema: approvedDatabase } });
  const columnMap = new Map(columnRows.map((column) => [column.TABLE_NAME + '.' + column.COLUMN_NAME, column]));
  for (const [table, column] of requiredColumns) {
    assert(columnMap.has(table + '.' + column), 'Falta la columna base ' + table + '.' + column + '.');
  }
  for (const [table, column] of [
    ['usuarios', 'id_usuario'],
    ['medicos', 'id_medico'],
    ['pacientes', 'usuario_id'],
    ['medicos', 'usuario_id'],
    ['medicos', 'especialidad_id'],
    ['horarios', 'medico_id'],
    ['citas', 'medico_id'],
  ]) {
    const definition = columnMap.get(table + '.' + column);
    assert(definition.DATA_TYPE === 'int' && !definition.COLUMN_TYPE.includes('unsigned'),
      'La columna ' + table + '.' + column + ' debe ser INT con signo.');
  }
  for (const column of ['fecha_inicio', 'fecha_fin']) {
    const definition = columnMap.get('horarios.' + column);
    assert(definition.DATA_TYPE === 'date' && definition.IS_NULLABLE === 'NO',
      'horarios.' + column + ' debe ser DATE NOT NULL.');
  }
  assert(columnMap.get('horarios.dia_semana').DATA_TYPE === 'enum', 'horarios.dia_semana debe conservar su tipo ENUM.');
  assert(columnMap.get('horarios.estado').DATA_TYPE === 'enum', 'horarios.estado debe conservar su tipo ENUM.');

  const baseRelations = await rows(queryInterface, `
    SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = :schema AND REFERENCED_TABLE_NAME IS NOT NULL
  `, { replacements: { schema: approvedDatabase } });
  const relationSet = new Set(baseRelations.map((relation) => [
    relation.TABLE_NAME, relation.COLUMN_NAME, relation.REFERENCED_TABLE_NAME, relation.REFERENCED_COLUMN_NAME,
  ].join('.')));
  const requiredRelations = [
    'pacientes.usuario_id.usuarios.id_usuario',
    'medicos.usuario_id.usuarios.id_usuario',
    'medicos.especialidad_id.especialidades.id_especialidad',
    'horarios.medico_id.medicos.id_medico',
    'citas.medico_id.medicos.id_medico',
  ];
  for (const relation of requiredRelations) {
    assert(relationSet.has(relation), 'Falta la relación base requerida: ' + relation + '.');
  }

  const existingTables = await rows(queryInterface, `
    SELECT TABLE_NAME FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = :schema AND LOWER(TABLE_NAME) IN (:tableNames)
  `, { replacements: { schema: approvedDatabase, tableNames: NEW_TABLES } });
  assert(existingTables.length === 0, 'Ya existe una o más tablas UH-012; no se permite repetir o continuar parcialmente.');

  const requestedNewColumns = Object.entries(NEW_COLUMNS).flatMap(([table, columns]) =>
    columns.map((column) => ({ table, column }))
  );
  const existingColumns = await rows(queryInterface, `
    SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = :schema AND TABLE_NAME IN (:tableNames) AND COLUMN_NAME IN (:columnNames)
  `, {
    replacements: {
      schema: approvedDatabase,
      tableNames: Object.keys(NEW_COLUMNS),
      columnNames: requestedNewColumns.map(({ column }) => column),
    },
  });
  assert(existingColumns.length === 0, 'Ya existe una o más columnas UH-012; se detiene antes del DDL.');

  const indexNames = Object.keys(INDEXES);
  const existingIndexes = await rows(queryInterface, `
    SELECT TABLE_NAME, INDEX_NAME FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = :schema AND INDEX_NAME IN (:indexNames)
  `, { replacements: { schema: approvedDatabase, indexNames } });
  assert(existingIndexes.length === 0, 'Ya existe uno o más índices reservados por UH-012.');

  const existingConstraints = await rows(queryInterface, `
    SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = :schema AND CONSTRAINT_NAME IN (:constraintNames)
  `, { replacements: { schema: approvedDatabase, constraintNames: FOREIGN_KEYS } });
  assert(existingConstraints.length === 0, 'Ya existe una o más restricciones reservadas por UH-012.');

  return { schemaSql, approvedDatabase, beforeCounts: await tableCounts(queryInterface, schemaSql) };
}

async function verifyResult(queryInterface, schema, beforeCounts) {
  const schemaSql = quoteIdentifier(schema);
  const constraints = await rows(queryInterface, `
    SELECT CONSTRAINT_NAME, DELETE_RULE, UPDATE_RULE
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = :schema AND CONSTRAINT_NAME IN (:constraintNames)
  `, { replacements: { schema, constraintNames: FOREIGN_KEYS } });
  assert(constraints.length === FOREIGN_KEYS.length, 'La migración no creó las siete claves foráneas esperadas.');
  assert(constraints.every((item) => item.DELETE_RULE === 'RESTRICT' && item.UPDATE_RULE === 'RESTRICT'),
    'Las claves foráneas nuevas deben usar RESTRICT para DELETE y UPDATE.');

  const indexes = await rows(queryInterface, `
    SELECT INDEX_NAME, NON_UNIQUE FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = :schema AND INDEX_NAME IN (:indexNames)
    GROUP BY INDEX_NAME, NON_UNIQUE
  `, { replacements: { schema, indexNames: Object.keys(INDEXES) } });
  assert(indexes.length === Object.keys(INDEXES).length, 'No se encontraron los cuatro índices esperados.');
  for (const index of indexes) {
    assert(Number(index.NON_UNIQUE) === (INDEXES[index.INDEX_NAME] ? 0 : 1),
      'El índice ' + index.INDEX_NAME + ' no tiene la unicidad esperada.');
  }

  const newTableRows = await rows(queryInterface, `
    SELECT (SELECT COUNT(*) FROM ${schemaSql}.solicitudes_horarios) AS solicitudes,
           (SELECT COUNT(*) FROM ${schemaSql}.solicitudes_horarios_detalles) AS detalles,
           (SELECT COUNT(*) FROM ${schemaSql}.horarios
             WHERE solicitud_detalle_id IS NOT NULL OR vigente IS NOT NULL OR sustituido_por_solicitud_id IS NOT NULL) AS horarios_con_metadatos,
           (SELECT COUNT(*) FROM ${schemaSql}.citas
             WHERE duracion_minutos IS NOT NULL OR descanso_posterior_minutos IS NOT NULL) AS citas_con_duracion_o_descanso
  `);
  const newTableCounts = newTableRows[0];
  assert(Object.values(newTableCounts).every((count) => Number(count) === 0),
    'La verificación esperaba cero filas nuevas y encontró valores no nulos.');

  const afterCounts = await tableCounts(queryInterface, schemaSql);
  for (const table of BASE_TABLES) {
    assert(afterCounts[table] === beforeCounts[table],
      'Cambió el conteo de ' + table + ' durante la migración.');
  }
}

module.exports = {
  async up(queryInterface) {
    const { schemaSql, approvedDatabase, beforeCounts } = await preflight(queryInterface);
    try {
      await queryInterface.sequelize.query(`
        CREATE TABLE ${schemaSql}.solicitudes_horarios (
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
          CONSTRAINT fk_solhor_medico FOREIGN KEY (medico_id) REFERENCES ${schemaSql}.medicos(id_medico) ON DELETE RESTRICT ON UPDATE RESTRICT,
          CONSTRAINT fk_solhor_solicitante FOREIGN KEY (solicitado_por) REFERENCES ${schemaSql}.usuarios(id_usuario) ON DELETE RESTRICT ON UPDATE RESTRICT,
          CONSTRAINT fk_solhor_base FOREIGN KEY (solicitud_base_id) REFERENCES ${schemaSql}.solicitudes_horarios(id_solicitud) ON DELETE RESTRICT ON UPDATE RESTRICT,
          CONSTRAINT fk_solhor_revisor FOREIGN KEY (decidido_por) REFERENCES ${schemaSql}.usuarios(id_usuario) ON DELETE RESTRICT ON UPDATE RESTRICT
        ) ENGINE = InnoDB
      `);
      await queryInterface.sequelize.query(`
        CREATE TABLE ${schemaSql}.solicitudes_horarios_detalles (
          id_detalle INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          solicitud_id INT NOT NULL,
          dia_semana ENUM('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo') NOT NULL,
          hora_inicio TIME NOT NULL,
          hora_fin TIME NOT NULL,
          UNIQUE KEY uq_solicitud_dia_franja (solicitud_id, dia_semana, hora_inicio, hora_fin),
          CONSTRAINT fk_solhordet_solicitud FOREIGN KEY (solicitud_id) REFERENCES ${schemaSql}.solicitudes_horarios(id_solicitud) ON DELETE RESTRICT ON UPDATE RESTRICT
        ) ENGINE = InnoDB
      `);
      await queryInterface.sequelize.query(`
        ALTER TABLE ${schemaSql}.horarios
          ADD COLUMN solicitud_detalle_id INT NULL,
          ADD COLUMN vigente BOOLEAN NULL DEFAULT NULL,
          ADD COLUMN sustituido_por_solicitud_id INT NULL,
          ADD UNIQUE KEY uq_horarios_solicitud_detalle (solicitud_detalle_id),
          ADD CONSTRAINT fk_horarios_solicitud_detalle FOREIGN KEY (solicitud_detalle_id) REFERENCES ${schemaSql}.solicitudes_horarios_detalles(id_detalle) ON DELETE RESTRICT ON UPDATE RESTRICT,
          ADD CONSTRAINT fk_horarios_sustituida_por FOREIGN KEY (sustituido_por_solicitud_id) REFERENCES ${schemaSql}.solicitudes_horarios(id_solicitud) ON DELETE RESTRICT ON UPDATE RESTRICT
      `);
      await queryInterface.sequelize.query(`
        ALTER TABLE ${schemaSql}.citas
          ADD COLUMN duracion_minutos INT NULL DEFAULT NULL,
          ADD COLUMN descanso_posterior_minutos INT NULL DEFAULT NULL
      `);
      await verifyResult(queryInterface, approvedDatabase, beforeCounts);
    } catch (error) {
      error.message = 'UH-012 falló después de iniciar DDL. MySQL puede haber confirmado bloques previos; no vuelvas a ejecutar ni borres objetos. Inspecciona el esquema y SequelizeMeta antes de reparar. Detalle: ' + error.message;
      throw error;
    }
  },

  async down() {
    throw new Error('Rollback automático UH-012 deshabilitado: podría borrar solicitudes o metadatos ya utilizados. Requiere una reversión revisada por separado.');
  },
};