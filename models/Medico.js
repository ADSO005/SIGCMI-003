import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Medico = db.define(
    "Medico",
    {
        id_medico: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
        },

        especialidad_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        cedula_profesional: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },

        anios_experiencia: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        tableName: "medicos",
        timestamps: false,
        freezeTableName: true,
    }
);

export default Medico;