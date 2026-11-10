import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Diagnostico = db.define(
    "Diagnostico",
    {
        id_diagnostico: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        cita_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
        },

        decision_medicamentos: {
            type: DataTypes.ENUM("Pendiente", "Requiere", "No requiere"),
            allowNull: false,
            defaultValue: "Pendiente",
            validate: {
                isIn: [["Pendiente", "Requiere", "No requiere"]],
            },
        },

        version_prescripciones: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
            validate: {
                isInt: true,
                min: 0,
                max: 4294967295,
            },
        },

        temperatura: {
            type: DataTypes.DECIMAL(4, 1),
            allowNull: true,
        },

        presion_arterial: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },

        altura: {
            type: DataTypes.DECIMAL(4, 2),
            allowNull: true,
        },

        peso: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },

        frecuencia_cardiaca: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        sintomas: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        diagnostico: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        tratamiento: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        notas_adicionales: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        fecha_diagnostico: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "diagnosticos",
        timestamps: false,
        freezeTableName: true,
    }
);

export default Diagnostico;
