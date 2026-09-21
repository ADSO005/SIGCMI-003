import { DataTypes } from "sequelize";
import db from "../config/db.js";

const User = db.define(
    "usuarios",
    {

        id_usuario: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        rol_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        correo: {
            type: DataTypes.STRING,
            allowNull: false
        },

        password: {
            type: DataTypes.STRING,
            allowNull: false
        },

        confirmado: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },

        estado: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },

        ultimo_login: {
            type: DataTypes.DATE,
            allowNull: true
        },

        token: {
            type: DataTypes.STRING,
            allowNull: true
        },

        codigo: {
            type: DataTypes.STRING(6),
            allowNull: true
        },

        codigo_expira: {
            type: DataTypes.DATE,
            allowNull: true
        }

    },
    {
        tableName: "usuarios",
        timestamps: false
    }
);

export default User;