import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const Usuario = db.define(
    "Usuario",
    {
        id_usuario: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        rol_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        nombres: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },

        apellidos: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },

        correo: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true,
        },

        telefono: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },

        tipo_documento: {
            type: DataTypes.STRING(30),
            allowNull: true,
        },

        numero_documento: {
            type: DataTypes.STRING(30),
            allowNull: false,
            unique: true,
        },

        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },

        confirmado: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        estado: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },

        ultimo_login: {
            type: DataTypes.DATE,
            allowNull: true,
        },

        fecha_registro: {
            type: DataTypes.DATE,
        },

        token: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },
    },
    {
        tableName: "usuarios",
        timestamps: false,
    }
);

export default Usuario;