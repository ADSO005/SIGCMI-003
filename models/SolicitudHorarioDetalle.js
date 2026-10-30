import { DataTypes } from 'sequelize';
import db from '../config/db.js';
import { diasSemana, enteroPositivo, validarFranja, validarFranjas } from './validations/horariosSemanales.js';

const SolicitudHorarioDetalle = db.define('SolicitudHorarioDetalle', {
    id_detalle: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    solicitud_id: { type: DataTypes.INTEGER, allowNull: false, validate: { enteroPositivo } },
    dia_semana: { type: DataTypes.ENUM(...diasSemana), allowNull: false, validate: { isIn: [diasSemana] } },
    hora_inicio: { type: DataTypes.TIME, allowNull: false },
    hora_fin: { type: DataTypes.TIME, allowNull: false },
}, {
    tableName: 'solicitudes_horarios_detalles', timestamps: false, freezeTableName: true,
    indexes: [{ name: 'uq_solicitud_dia_franja', unique: true, fields: ['solicitud_id', 'dia_semana', 'hora_inicio', 'hora_fin'] }],
    validate: { franjaValida() { validarFranja(this); } },
    hooks: {
        beforeBulkCreate(rows) {
            const groups = new Map();
            for (const row of rows) { const group = groups.get(row.solicitud_id) || []; group.push(row); groups.set(row.solicitud_id, group); }
            for (const group of groups.values()) validarFranjas(group);
        },
    },
});
export default SolicitudHorarioDetalle;
