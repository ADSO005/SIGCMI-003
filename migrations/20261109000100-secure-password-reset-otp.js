import { DataTypes } from "sequelize";

export default {
    async up(queryInterface) {
        await queryInterface.addColumn("usuarios", "codigo_intentos", {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        });
        await queryInterface.addColumn("usuarios", "codigo_ultimo_envio", {
            type: DataTypes.DATE,
            allowNull: true
        });
        await queryInterface.addColumn("usuarios", "codigo_solicitudes", {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        });
        await queryInterface.addColumn("usuarios", "codigo_ventana_inicio", {
            type: DataTypes.DATE,
            allowNull: true
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("usuarios", "codigo_ventana_inicio");
        await queryInterface.removeColumn("usuarios", "codigo_solicitudes");
        await queryInterface.removeColumn("usuarios", "codigo_ultimo_envio");
        await queryInterface.removeColumn("usuarios", "codigo_intentos");
    }
};
