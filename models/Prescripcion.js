import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Prescripcion = db.define(
    "Prescripcion",
    {
        id_prescripcion: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        diagnostico_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        nombre_medicamento: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },

        dosis: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },

        frecuencia: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },

        duracion: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
    },
    {
        tableName: "prescripciones",
        timestamps: false,
        freezeTableName: true,
    }
);

export default Prescripcion;