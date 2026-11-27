import { DataTypes } from 'sequelize';

export default {
    async up(q) {
        const tables = await q.showAllTables();
        if (tables.some(t => (typeof t === 'string' ? t : Object.values(t)[0]) === 'avisos_diagnostico')) return;
        await q.createTable('avisos_diagnostico', {
            cita_id: { type: DataTypes.INTEGER, primaryKey: true, references: { model: 'citas', key: 'id_cita' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
            paciente_id: { type: DataTypes.INTEGER, allowNull: false },
            estado: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pendiente' },
            intentos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            actualizado: { type: DataTypes.DATE, allowNull: false }
        });
    },
    async down() { throw new Error('No se elimina automáticamente el historial de avisos de diagnóstico.'); }
};
