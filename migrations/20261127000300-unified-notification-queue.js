import { DataTypes, QueryTypes } from 'sequelize';

// Extend the existing notification and queue tables.
export default {
    async up(q) {
        let columns = await q.describeTable('notificaciones');
        if (!columns.clave_evento) await q.addColumn('notificaciones', 'clave_evento', { type: DataTypes.STRING(100), allowNull: true });
        if (!columns.evento) await q.addColumn('notificaciones', 'evento', { type: DataTypes.STRING(40), allowNull: true });
        if (!columns.cita_id) await q.addColumn('notificaciones', 'cita_id', { type: DataTypes.INTEGER, allowNull: true });
        if (!columns.fecha_cita) await q.addColumn('notificaciones', 'fecha_cita', { type: DataTypes.DATEONLY, allowNull: true });
        if (!columns.hora_cita) await q.addColumn('notificaciones', 'hora_cita', { type: DataTypes.TIME, allowNull: true });
        columns = await q.describeTable('notificaciones');
        if (!columns.enviado_por.allowNull) await q.changeColumn('notificaciones', 'enviado_por', { type: DataTypes.INTEGER, allowNull: true });
        if (!String(columns.estado.type).toLowerCase().includes('omitida')) await q.changeColumn('notificaciones', 'estado', { type: DataTypes.ENUM('Pendiente', 'Enviada', 'Error', 'Omitida'), defaultValue: 'Pendiente' });
        const indexes = await q.showIndex('notificaciones');
        if (!indexes.some(i => i.name === 'notificaciones_clave_evento_unica')) await q.addIndex('notificaciones', ['clave_evento'], { name: 'notificaciones_clave_evento_unica', unique: true });
        const queueColumns = await q.describeTable('cola_notificaciones');
        if (!String(queueColumns.estado.type).toLowerCase().includes('omitida')) await q.changeColumn('cola_notificaciones', 'estado', { type: DataTypes.ENUM('Pendiente', 'Procesando', 'Enviada', 'Error', 'Omitida'), defaultValue: 'Pendiente' });
        if (!queueColumns.lease_token) await q.addColumn('cola_notificaciones', 'lease_token', { type: DataTypes.STRING(32), allowNull: true });
        if (!queueColumns.actualizado) await q.addColumn('cola_notificaciones', 'actualizado', { type: DataTypes.DATE, allowNull: true });
        const queueIndexes = await q.showIndex('cola_notificaciones');
        if (!queueIndexes.some(i => i.name === 'cola_notificaciones_notificacion_unica')) {
            const duplicates = await q.sequelize.query('SELECT notificacion_id FROM cola_notificaciones GROUP BY notificacion_id HAVING COUNT(*) > 1 LIMIT 1', { type: QueryTypes.SELECT });
            if (duplicates.length) throw new Error('Existen entradas duplicadas en cola_notificaciones; revísalas antes de continuar.');
            await q.addIndex('cola_notificaciones', ['notificacion_id'], { name: 'cola_notificaciones_notificacion_unica', unique: true });
        }
    },
    async down() { throw new Error('No se elimina automáticamente el historial de notificaciones.'); }
};
