import sequelize from '../config/db.js';
import Paciente from './Paciente.js';
import Doctor from './Doctor.js';
import Cita from './Cita.js';

// Relaciones
Paciente.hasMany(Cita, {
    foreignKey: 'pacienteId'
});

Cita.belongsTo(Paciente, {
    foreignKey: 'pacienteId'
});

Doctor.hasMany(Cita, {
    foreignKey: 'doctorId'
});

Cita.belongsTo(Doctor, {
    foreignKey: 'doctorId'
});

export {
    sequelize,
    Paciente,
    Doctor,
    Cita
};