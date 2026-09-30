import { DataTypes } from "sequelize";

export async function up(queryInterface) {
    await queryInterface.createTable("registros_pendientes", {
        id_registro: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        nombres: {
            type: DataTypes.STRING(100),
            allowNull: false
        },

        apellidos: {
            type: DataTypes.STRING(100),
            allowNull: false
        },

        correo: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true
        },

        telefono: {
            type: DataTypes.STRING(20),
            allowNull: true
        },

        fecha_nacimiento: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },

        tipo_documento: {
            type: DataTypes.STRING(30),
            allowNull: true
        },

        numero_documento: {
            type: DataTypes.STRING(30),
            allowNull: false,
            unique: true
        },

        departamento: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        ciudad: {
            type: DataTypes.STRING(100),
            allowNull: true
        },

        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },

        token: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true
        },

        token_expira: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });
}

export async function down(queryInterface) {
    await queryInterface.dropTable("registros_pendientes");
}
