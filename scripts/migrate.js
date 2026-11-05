import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Sequelize, DataTypes, QueryTypes } from 'sequelize';

async function main() {
  if (!process.env.DB_NAME || !process.env.DB_USER) throw new Error('Configura DB_NAME y DB_USER en .env.');
  const statusOnly = process.argv.includes('--status');
  const options = {
    host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER, password: process.env.DB_PASS,
  };
  const connection = await mysql.createConnection(options);
  let db;
  let locked = false;
  const lockName = createHash('sha256').update('sigcmi:migrate:' + process.env.DB_NAME).digest('hex');
  try {
    if (!statusOnly) await connection.query('CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', [process.env.DB_NAME]);
    await connection.changeUser({ database: process.env.DB_NAME });
    // Keep the advisory lock on this connection while Sequelize applies DDL.
    const [lock] = await connection.query('SELECT GET_LOCK(?, 30) AS acquired', [lockName]);
    if (Number(lock[0].acquired) !== 1) throw new Error('Otra ejecución está migrando esta base de datos.');
    locked = true;
    db = new Sequelize(process.env.DB_NAME, options.user, options.password, {
      host: options.host, port: options.port, dialect: 'mysql', logging: false,
    });
    const q = db.getQueryInterface();
    await q.createTable('SequelizeMeta', { name: { type: DataTypes.STRING, allowNull: false, primaryKey: true } });
    const applied = new Set((await db.query('SELECT name FROM `SequelizeMeta`', { type: QueryTypes.SELECT })).map(row => row.name));
    const directory = new URL('../migrations/', import.meta.url);
    const files = (await readdir(directory)).filter(name => /^\d+.*\.js$/.test(name)).sort();
    let count = 0;
    for (const name of files) {
      if (statusOnly) { console.log((applied.has(name) ? 'up   ' : 'down ') + name); continue; }
      if (applied.has(name)) continue;
      const { default: migration } = await import(new URL(name, directory));
      if (typeof migration?.up !== 'function') throw new Error('Migración inválida: ' + name);
      console.log('Migrando: ' + name);
      await migration.up(q, Sequelize);
      await q.bulkInsert('SequelizeMeta', [{ name }]);
      count++;
      console.log('Aplicada: ' + name);
    }
    if (!statusOnly && count === 0) console.log('No migrations were executed, database schema was already up to date.');
  } finally {
    try { if (db) await db.close(); }
    finally {
      try { if (locked) await connection.query('SELECT RELEASE_LOCK(?)', [lockName]); }
      finally { await connection.end(); }
    }
  }
}
main().catch(error => { console.error('No se pudo migrar:', error.message); process.exitCode = 1; });
