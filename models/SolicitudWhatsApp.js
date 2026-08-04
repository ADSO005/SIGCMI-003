import { DataTypes } from "sequelize";
import db from "../config/db.js";

const SolicitudWhatsApp = db.define(
    "SolicitudWhatsApp",
    {
        id_solicitud: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        nombre_paciente: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },

        telefono: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },

        mensaje: {
            type: DataTypes.TEXT,
            allowNull: false,
        },

        estado: {
            type: DataTypes.ENUM(
                "Pendiente",
                "En Proceso",
                "Atendida",
                "Cancelada"
            ),
            defaultValue: "Pendiente",
        },

        usuario_asignado: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        cita_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        fecha: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "solicitudes_whatsapp",
        timestamps: false,
        freezeTableName: true,
    }
);

export default SolicitudWhatsApp;