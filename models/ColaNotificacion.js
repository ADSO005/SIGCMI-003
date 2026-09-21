import { DataTypes } from "sequelize";
import db from "../config/db.js";

const ColaNotificacion = db.define(
    "ColaNotificacion",
    {
        id_cola: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        notificacion_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        prioridad: {
            type: DataTypes.TINYINT,
            defaultValue: 1,
        },

        estado: {
            type: DataTypes.ENUM(
                "Pendiente",
                "Procesando",
                "Enviada",
                "Error"
            ),
            defaultValue: "Pendiente",
        },

        intentos: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },

        fecha_programada: {
            type: DataTypes.DATE,
            allowNull: true,
        },

        fecha_proceso: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "cola_notificaciones",
        timestamps: false,
        freezeTableName: true,
    }
);

export default ColaNotificacion;