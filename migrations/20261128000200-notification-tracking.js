import { DataTypes } from 'sequelize';

export default {
  async up(queryInterface) {
    await queryInterface.addColumn('notificaciones', 'cita_id', { type: DataTypes.INTEGER, allowNull: true });
    await queryInterface.addColumn('notificaciones', 'evento', { type: DataTypes.STRING(40), allowNull: true });
    await queryInterface.addColumn('notificaciones', 'id_externo', { type: DataTypes.STRING(120), allowNull: true });
    await queryInterface.addIndex('notificaciones', ['cita_id', 'evento', 'canal'], { name: 'idx_notificaciones_cita_evento' });
    await queryInterface.addIndex('notificaciones', ['id_externo'], { name: 'idx_notificaciones_id_externo' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('notificaciones', 'idx_notificaciones_id_externo');
    await queryInterface.removeIndex('notificaciones', 'idx_notificaciones_cita_evento');
    await queryInterface.removeColumn('notificaciones', 'id_externo');
    await queryInterface.removeColumn('notificaciones', 'evento');
    await queryInterface.removeColumn('notificaciones', 'cita_id');
  },
};
