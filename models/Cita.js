import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Cita = sequelize.define('Cita', {
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    hora: {
        type: DataTypes.TIME,
        allowNull: false
    },
    consultorio: {
        type: DataTypes.STRING,
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM(
            'Pendiente',
            'Confirmada',
            'Completada',
            'Cancelada'
        ),
        defaultValue: 'Pendiente'
    }
});

export default Cita;