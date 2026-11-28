import { DataTypes } from 'sequelize';

export default {
  async up(queryInterface) {
    const columns = await queryInterface.describeTable('notificaciones');
    if (!columns.cita_id) await queryInterface.addColumn('notificaciones', 'cita_id', { type: DataTypes.INTEGER, allowNull: true });
    if (!columns.evento) await queryInterface.addColumn('notificaciones', 'evento', { type: DataTypes.STRING(40), allowNull: true });
    if (!columns.id_externo) await queryInterface.addColumn('notificaciones', 'id_externo', { type: DataTypes.STRING(120), allowNull: true });
    const indexes = await queryInterface.showIndex('notificaciones');
    if (!indexes.some(index => index.name === 'idx_notificaciones_cita_evento')) await queryInterface.addIndex('notificaciones', ['cita_id', 'evento', 'canal'], { name: 'idx_notificaciones_cita_evento' });
    if (!indexes.some(index => index.name === 'idx_notificaciones_id_externo')) await queryInterface.addIndex('notificaciones', ['id_externo'], { name: 'idx_notificaciones_id_externo' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('notificaciones', 'idx_notificaciones_id_externo');
    await queryInterface.removeIndex('notificaciones', 'idx_notificaciones_cita_evento');
    await queryInterface.removeColumn('notificaciones', 'id_externo');
    // cita_id and evento are shared with the unified notification queue.
  },
};
