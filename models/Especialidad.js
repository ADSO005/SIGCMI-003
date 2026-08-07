import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Especialidad = db.define(
    "Especialidad",
    {
        id_especialidad: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        nombre: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },

        descripcion: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "especialidades",
        timestamps: false,
        freezeTableName: true,
    }
);

export default Especialidad;