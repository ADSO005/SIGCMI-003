// The former reminder and diagnosis delivery history is intentionally discarded.
export default {
    async up(queryInterface) {
        await queryInterface.sequelize.query('DROP TABLE IF EXISTS `avisos_diagnostico`');
        await queryInterface.sequelize.query('DROP TABLE IF EXISTS `recordatorios_cita`');
    },
    async down() {
        throw new Error('No se puede recuperar el historial eliminado de notificaciones.');
    }
};
