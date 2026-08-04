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