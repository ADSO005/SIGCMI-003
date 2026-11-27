import { DataTypes } from 'sequelize';

export default {
    async up(q) {
        const tables = await q.showAllTables();
        if (tables.some((table) => (typeof table === 'string' ? table : Object.values(table)[0]) === 'recordatorios_cita')) return;
        await q.createTable('recordatorios_cita', {
            clave: { type: DataTypes.STRING(100), primaryKey: true },
            estado: { type: DataTypes.STRING(20), allowNull: false },
            intentos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            actualizado: { type: DataTypes.DATE, allowNull: false }
        });
    },
    async down() {
        throw new Error('No se elimina el historial de recordatorios automáticamente.');
    }
};
