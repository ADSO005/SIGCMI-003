import { DataTypes } from "sequelize";
import db from "../config/db.js";

const EstadoCita = db.define(
    "EstadoCita",
    {
        id_estado: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        nombre: {
            type: DataTypes.STRING(30),
            allowNull: false,
            unique: true,
        },
    },
    {
        tableName: "estados_cita",
        timestamps: false,
        freezeTableName: true,
    }
);

export default EstadoCita;