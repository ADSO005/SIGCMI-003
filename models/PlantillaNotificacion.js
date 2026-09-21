import { DataTypes } from "sequelize";
import db from "../config/db.js";

const PlantillaNotificacion = db.define(
    "PlantillaNotificacion",
    {
        id_plantilla: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        nombre: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },

        asunto: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },

        mensaje: {
            type: DataTypes.TEXT,
            allowNull: false,
        },

        activa: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "plantillas_notificaciones",
        timestamps: false,
        freezeTableName: true,
    }
);

export default PlantillaNotificacion;