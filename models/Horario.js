import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Horario = db.define(
    "Horario",
    {
        id_horario: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        medico_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        dia_semana: {
            type: DataTypes.ENUM(
                "Lunes",
                "Martes",
                "Miercoles",
                "Jueves",
                "Viernes",
                "Sabado",
                "Domingo"
            ),
            allowNull: false,
        },

        hora_inicio: {
            type: DataTypes.TIME,
            allowNull: false,
        },

        hora_fin: {
            type: DataTypes.TIME,
            allowNull: false,
        },

        estado: {
            type: DataTypes.ENUM(
                "Pendiente",
                "Aprobado",
                "Rechazado"
            ),
            defaultValue: "Pendiente",
        },

        aprobado_por: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        fecha_creacion: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "horarios",
        timestamps: false,
        freezeTableName: true,
    }
);

export default Horario;