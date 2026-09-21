import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Paciente = db.define(
    "Paciente",
    {
        id_paciente: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
        },

        fecha_nacimiento: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },

        tipo_sangre: {
            type: DataTypes.STRING(5),
            allowNull: true,
        },

        alergias: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        condiciones_medicas: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        direccion: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },

        departamento: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },

        ciudad: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
    },
    {
        tableName: "pacientes",
        timestamps: false,
    }
);

export default Paciente;