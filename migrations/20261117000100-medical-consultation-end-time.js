import { DataTypes } from "sequelize";

const nombreColumna = "fecha_fin_atencion";

export default {
    async up(queryInterface) {
        const columnas = await queryInterface.describeTable("citas");
        if (!columnas[nombreColumna]) {
            await queryInterface.addColumn("citas", nombreColumna, {
                type: DataTypes.DATE,
                allowNull: true,
            });
        }
    },

    async down(queryInterface) {
        const columnas = await queryInterface.describeTable("citas");
        if (!columnas[nombreColumna]) return;

        const [filas] = await queryInterface.sequelize.query(
            "SELECT COUNT(*) AS total FROM `citas` WHERE `fecha_fin_atencion` IS NOT NULL"
        );
        if (Number(filas[0]?.total || 0) > 0) {
            throw new Error("No se puede retirar la fecha real de finalización de consultas existentes.");
        }

        await queryInterface.removeColumn("citas", nombreColumna);
    },
};
