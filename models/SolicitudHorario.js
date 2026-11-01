import { DataTypes } from 'sequelize';
import db from '../config/db.js';
import { enteroPositivo, enteroPositivoOpcional, validarSemana, validarFranjas } from './validations/horariosSemanales.js';

const SolicitudHorario = db.define('SolicitudHorario', {
    id_solicitud: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    medico_id: { type: DataTypes.INTEGER, allowNull: false, validate: { enteroPositivo } },
    solicitado_por: { type: DataTypes.INTEGER, allowNull: false, validate: { enteroPositivo } },
    fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },
    version: { type: DataTypes.INTEGER, allowNull: false, validate: { enteroPositivo } },
    solicitud_base_id: { type: DataTypes.INTEGER, allowNull: true, validate: { enteroPositivoOpcional } },
    revision_base: { type: DataTypes.CHAR(64), allowNull: false, validate: { is: /^[a-f0-9]{64}$/ } },
    estado: { type: DataTypes.ENUM('Pendiente', 'Aprobado', 'Rechazado', 'Retirada'), allowNull: false, defaultValue: 'Pendiente', validate: { isIn: [['Pendiente', 'Aprobado', 'Rechazado', 'Retirada']] } },
    decidido_por: { type: DataTypes.INTEGER, allowNull: true, validate: { enteroPositivoOpcional } },
    fecha_decision: { type: DataTypes.DATE, allowNull: true },
    motivo_decision: { type: DataTypes.TEXT, allowNull: true },
    fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
    tableName: 'solicitudes_horarios', timestamps: false, freezeTableName: true,
    indexes: [
        { name: 'uq_solicitudes_medico_semana_version', unique: true, fields: ['medico_id', 'fecha_inicio', 'version'] },
        { name: 'ix_solicitudes_estado_semana', fields: ['estado', 'fecha_inicio'] },
    ],
    validate: {
        semanaCompleta() { validarSemana(this.fecha_inicio, this.fecha_fin); },
        baseDistinta() { if (this.id_solicitud != null && this.solicitud_base_id === this.id_solicitud) throw new Error('Una solicitud no puede ser su propia base'); },
        decisionCoherente() {
            if (['Aprobado', 'Rechazado'].includes(this.estado) && (!this.decidido_por || !this.fecha_decision)) throw new Error('La decision requiere revisor y fecha');
            if (this.estado === 'Rechazado' && !this.motivo_decision?.trim()) throw new Error('El rechazo requiere un motivo');
            if (this.estado === 'Pendiente' && (this.decidido_por != null || this.fecha_decision != null || this.motivo_decision != null)) throw new Error('Una pendiente no tiene decision administrativa');
            if (this.decidido_por != null && this.decidido_por === this.solicitado_por) throw new Error('No se permite autoaprobar o autorrechazar una solicitud');
        },
        detallesIncluidos() {
            const details = this.get('Detalles');
            if (details !== undefined) validarFranjas(details);
        },
    },
});
export default SolicitudHorario;
