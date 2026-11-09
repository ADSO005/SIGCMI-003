const valoresDecision = "'Pendiente', 'Requiere', 'No requiere'";

export default {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            ALTER TABLE \`diagnosticos\`
                ADD COLUMN \`decision_medicamentos\` ENUM(${valoresDecision}) NOT NULL DEFAULT 'Pendiente',
                ADD COLUMN \`version_prescripciones\` INT UNSIGNED NOT NULL DEFAULT 0
        `);
    },

    async down(queryInterface) {
        const [rows] = await queryInterface.sequelize.query(`
            SELECT COUNT(*) AS cambios
            FROM \`diagnosticos\`
            WHERE \`decision_medicamentos\` <> 'Pendiente'
               OR \`version_prescripciones\` <> 0
        `);
        if (Number(rows?.[0]?.cambios) > 0) {
            throw new Error("No se pueden retirar columnas que ya contienen decisiones o versiones de prescripciones.");
        }

        await queryInterface.sequelize.query(`
            ALTER TABLE \`diagnosticos\`
                DROP COLUMN \`version_prescripciones\`,
                DROP COLUMN \`decision_medicamentos\`
        `);
    },
};
