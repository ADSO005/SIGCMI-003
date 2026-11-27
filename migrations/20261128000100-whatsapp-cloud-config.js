import { DataTypes } from 'sequelize';

export default {
  async up(queryInterface) {
    await queryInterface.createTable('configuracion_whatsapp', {
      id_configuracion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      phone_number_id: { type: DataTypes.STRING(40), allowNull: true },
      waba_id: { type: DataTypes.STRING(40), allowNull: true },
      access_token: { type: DataTypes.TEXT, allowNull: true },
      app_secret: { type: DataTypes.TEXT, allowNull: true },
      verify_token: { type: DataTypes.TEXT, allowNull: true },
      api_version: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'v21.0' },
      codigo_pais: { type: DataTypes.STRING(5), allowNull: false, defaultValue: '57' },
      activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      numero_visible: { type: DataTypes.STRING(30), allowNull: true },
      nombre_verificado: { type: DataTypes.STRING(120), allowNull: true },
      ultima_verificacion: { type: DataTypes.DATE, allowNull: true },
      ultimo_error: { type: DataTypes.TEXT, allowNull: true },
      actualizado_por: { type: DataTypes.INTEGER, allowNull: true },
      actualizado_en: { type: DataTypes.DATE, allowNull: true },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('configuracion_whatsapp');
  },
};
