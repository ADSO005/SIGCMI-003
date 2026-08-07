import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Paciente = sequelize.define('Paciente', {
    id_paciente: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fecha_nacimiento: DataTypes.DATEONLY,
    tipo_sangre: DataTypes.STRING(5),
    alergias: DataTypes.TEXT,
    condiciones_medicas: DataTypes.TEXT,
    direccion: DataTypes.STRING(150),
    departamento: DataTypes.STRING(100),
    ciudad: DataTypes.STRING(100)
}, {
    tableName: 'pacientes',
    timestamps: false
});

export default Paciente;