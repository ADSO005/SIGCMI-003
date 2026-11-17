import { DataTypes } from "sequelize";

const nombreEstado = "Cerrada sin finalizar";
const columnasNuevas = [
    "fecha_inicio_atencion",
    "fecha_cierre_sin_finalizar",
    "motivo_cierre_sin_finalizar",
    "cerrada_por_medico_id",
];

async function obtenerColumnas(queryInterface) {
    return queryInterface.describeTable("citas");
}

export default {
    async up(queryInterface) {
        let columnas = await obtenerColumnas(queryInterface);
        if (!columnas.fecha_inicio_atencion) {
            await queryInterface.addColumn("citas", "fecha_inicio_atencion", {
                type: DataTypes.DATE,
                allowNull: true,
            });
        }

        columnas = await obtenerColumnas(queryInterface);
        if (!columnas.fecha_cierre_sin_finalizar) {
            await queryInterface.addColumn("citas", "fecha_cierre_sin_finalizar", {
                type: DataTypes.DATE,
                allowNull: true,
            });
        }

        columnas = await obtenerColumnas(queryInterface);
        if (!columnas.motivo_cierre_sin_finalizar) {
            await queryInterface.addColumn("citas", "motivo_cierre_sin_finalizar", {
                type: DataTypes.TEXT,
                allowNull: true,
            });
        }

        columnas = await obtenerColumnas(queryInterface);
        if (!columnas.cerrada_por_medico_id) {
            await queryInterface.addColumn("citas", "cerrada_por_medico_id", {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: "medicos", key: "id_medico" },
                onUpdate: "CASCADE",
                onDelete: "SET NULL",
            });
        }

        const [estados] = await queryInterface.sequelize.query(
            "SELECT id_estado FROM estados_cita WHERE nombre = :nombre",
            { replacements: { nombre: nombreEstado } }
        );
        if (estados.length === 0) {
            await queryInterface.bulkInsert("estados_cita", [{ nombre: nombreEstado }]);
        }
    },

    async down(queryInterface) {
        const columnas = await obtenerColumnas(queryInterface);
        const presentes = columnasNuevas.filter(nombre => columnas[nombre]);
        if (presentes.length > 0) {
            const condicion = presentes.map(nombre => `\`${nombre}\` IS NOT NULL`).join(" OR ");
            const [filas] = await queryInterface.sequelize.query(
                `SELECT COUNT(*) AS total FROM \`citas\` WHERE ${condicion}`
            );
            if (Number(filas[0]?.total || 0) > 0) {
                throw new Error("No se pueden retirar datos de inicio o cierre de consultas existentes.");
            }
        }

        const [estados] = await queryInterface.sequelize.query(
            "SELECT id_estado FROM estados_cita WHERE nombre = :nombre",
            { replacements: { nombre: nombreEstado } }
        );
        if (estados.length > 0) {
            const [referencias] = await queryInterface.sequelize.query(
                "SELECT COUNT(*) AS total FROM citas WHERE estado_id = :id",
                { replacements: { id: estados[0].id_estado } }
            );
            if (Number(referencias[0]?.total || 0) > 0) {
                throw new Error("No se puede retirar el estado mientras existan citas cerradas sin finalizar.");
            }
        }

        for (const nombre of [...columnasNuevas].reverse()) {
            if (columnas[nombre]) await queryInterface.removeColumn("citas", nombre);
        }
        // El catálogo se conserva para no borrar un estado que pudiera existir antes de esta migración.
    },
};
