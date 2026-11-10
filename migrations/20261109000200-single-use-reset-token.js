import { DataTypes } from "sequelize";

export default {
    async up(queryInterface) {
        await queryInterface.addColumn("usuarios", "token_reset", {
            type: DataTypes.STRING(36),
            allowNull: true
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("usuarios", "token_reset");
    }
};
