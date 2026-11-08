import { DataTypes } from 'sequelize';

export default {
  async up(queryInterface) {
    await queryInterface.addColumn('pacientes', 'contacto_emergencia_nombres', {
      type: DataTypes.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('pacientes', 'contacto_emergencia_apellidos', {
      type: DataTypes.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('pacientes', 'contacto_emergencia_telefono', {
      type: DataTypes.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn('pacientes', 'contacto_emergencia_correo', {
      type: DataTypes.STRING(150),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('pacientes', 'contacto_emergencia_correo');
    await queryInterface.removeColumn('pacientes', 'contacto_emergencia_telefono');
    await queryInterface.removeColumn('pacientes', 'contacto_emergencia_apellidos');
    await queryInterface.removeColumn('pacientes', 'contacto_emergencia_nombres');
  },
};
