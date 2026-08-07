import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Doctor = sequelize.define('Doctor', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    especialidades: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

export default Doctor;