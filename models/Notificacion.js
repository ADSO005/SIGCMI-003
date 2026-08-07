import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Notificacion = db.define(
    "Notificacion",
    {
        id_notificacion: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        plantilla_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        enviado_por: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        titulo: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },

        mensaje: {
            type: DataTypes.TEXT,
            allowNull: false,
        },

        canal: {
            type: DataTypes.ENUM(
                "Correo",
                "WhatsApp",
                "Sistema"
            ),
            allowNull: false,
        },

        fecha_envio: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },

        estado: {
            type: DataTypes.ENUM(
                "Pendiente",
                "Enviada",
                "Error"
            ),
            defaultValue: "Pendiente",
        },

        tipo: {
            type: DataTypes.ENUM(
                "Automatica",
                "Manual"
            ),
            defaultValue: "Automatica",
        },

        fecha_entrega: {
            type: DataTypes.DATE,
            allowNull: true,
        },

        error_envio: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "notificaciones",
        timestamps: false,
        freezeTableName: true,
    }
);

export default Notificacion;