import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Token = db.define(
    "Token",
    {
        id_token: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        token: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },

        tipo: {
            type: DataTypes.ENUM(
                "VERIFICACION",
                "RECUPERAR_PASSWORD"
            ),
            allowNull: false,
        },

        fecha_creacion: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },

        fecha_expiracion: {
            type: DataTypes.DATE,
            allowNull: false,
        },

        usado: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        tableName: "tokens",
        timestamps: false,
        freezeTableName: true,
    }
);

export default Token;