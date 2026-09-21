import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Rol = db.define(
    "Rol",
    {
        id_rol: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        nombre: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },

        descripcion: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
    },
    {
        tableName: "roles",
        timestamps: false,
    }
);

export default Rol;