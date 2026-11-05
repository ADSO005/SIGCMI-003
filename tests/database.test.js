import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

test('fresh installation, model queries and doctor pages without weekly request tables', async () => {
  assert.match(process.env.DB_NAME || '', /_test$/, 'Use an isolated DB_NAME ending in _test');
  const migrate = () => {
    const result = spawnSync(process.execPath, ['scripts/migrate.js'], { encoding: 'utf8', env: process.env });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return result.stdout;
  };
  migrate();
  assert.match(migrate(), /already up to date/);
  const connection = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME });
  const { default: db } = await import('../config/db.js');
  let server;
  try {
    const models = await import('../models/index.js');
    await import('../models/RegistroPendiente.js');
    (await import('../models/asociaciones.js')).default();
    for (const model of Object.values(db.models)) await model.findAll({ limit: 1, logging: false });
    assert.equal(Object.keys(db.models).length, 17);
    const [tables] = await connection.query('SHOW TABLES');
    assert.equal(tables.some(row => Object.values(row).some(name => name.startsWith('solicitudes_horarios'))), false);
    const [scheduleColumns] = await connection.query('SHOW COLUMNS FROM horarios');
    assert.equal(scheduleColumns.some(column => ['solicitud_detalle_id', 'sustituido_por_solicitud_id', 'vigente'].includes(column.Field)), false);
    const especialidad = await models.Especialidad.create({ nombre: 'Test ' + Date.now() });
    const usuario = await models.Usuario.create({ rol_id: 2, nombres: 'Test', apellidos: 'Doctor', correo: Date.now() + '@test.invalid', numero_documento: String(Date.now()), password: 'test', estado: true });
    const medico = await models.Medico.create({ usuario_id: usuario.id_usuario, especialidad_id: especialidad.id_especialidad, cedula_profesional: String(Date.now()) });
    const horario = await models.Horario.create({ medico_id: medico.id_medico, dia_semana: 'Lunes', hora_inicio: '08:00:00', hora_fin: '12:00:00', fecha_inicio: '2026-11-02', fecha_fin: '2026-11-08' });
    assert.ok(await models.Horario.findByPk(horario.id_horario));
    const { default: app } = await import('../app.js');
    app.use('/medico', (await import('../routes/medico/medicoRoutes.js')).default);
    app.use('/auth', (await import('../routes/auth/userRoutes.js')).default);
    app.use('/admin', (await import('../routes/admin/adminRoutes.js')).default);
    app.use('/paciente', (await import('../routes/paciente/pacienteRoutes.js')).default);
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    const headers = { Cookie: '_token=' + jwt.sign({ id: usuario.id_usuario }, process.env.JWT_SECRET) };
    const horarios = await fetch(base + '/medico/horarios', { headers });
    assert.equal(horarios.status, 200);
    assert.ok((await horarios.json()).horarios.some(h => h.id_horario === horario.id_horario));
    const dashboard = await fetch(base + '/medico/dashboard', { headers });
    assert.equal(dashboard.status, 200);
    assert.doesNotMatch(await dashboard.text(), /solicitudes-horarios|Enviar solicitud/);
    assert.equal((await fetch(base + '/medico/solicitudes-horarios', { headers })).status, 404);
    assert.equal((await fetch(base + '/auth/login')).status, 200);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await connection.end();
    await db.close();
  }
});
