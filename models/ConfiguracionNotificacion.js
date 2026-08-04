import { DataTypes } from "sequelize";
import db from "../config/db.js";

const ConfiguracionNotificacion = db.define(
    "ConfiguracionNotificacion",
    {
        id_configuracion: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
        },

        correo: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },

        whatsapp: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },

        recordatorio_24h: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },

        recordatorio_1h: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },

        confirmacion_cita: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },

        cancelacion_cita: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },

        reprogramacion: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },

        nuevo_diagnostico: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },

        actualizaciones: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },

        sms: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "configuracion_notificaciones",
        timestamps: false,
        freezeTableName: true,
    }
);

export default ConfiguracionNotificacion;