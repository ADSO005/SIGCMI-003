import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Cita = db.define(
    "Cita",
    {
        id_cita: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        paciente_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        medico_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        estado_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        creado_por: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        fecha: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },

        hora: {
            type: DataTypes.TIME,
            allowNull: false,
        },

        motivo_consulta: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        fecha_creacion: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },

        fecha_actualizacion: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },

        motivo_cancelacion: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        cancelado_por: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        fecha_cancelacion: {
            type: DataTypes.DATE,
            allowNull: true,
        },

        reprogramado_por: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        fecha_reprogramacion: {
            type: DataTypes.DATE,
            allowNull: true,
        },

        motivo_reprogramacion: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "citas",
        timestamps: false,
        freezeTableName: true,
    }
);

export default Cita;