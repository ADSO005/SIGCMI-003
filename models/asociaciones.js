import Usuario from "./Usuario.js";
import Rol from "./Rol.js";

import Paciente from "./Paciente.js";
import Medico from "./Medico.js";

import Especialidad from "./Especialidad.js";
import Horario from "./Horario.js";

import EstadoCita from "./EstadoCita.js";
import Cita from "./Cita.js";

import Diagnostico from "./Diagnostico.js";
import Prescripcion from "./Prescripcion.js";

import Notificacion from "./Notificacion.js";
import PlantillaNotificacion from "./PlantillaNotificacion.js";

import ConfiguracionNotificacion from "./ConfiguracionNotificacion.js";
import ColaNotificacion from "./ColaNotificacion.js";

import SolicitudWhatsApp from "./SolicitudWhatsApp.js";
import Token from "./Token.js";

export default function asociarModelos() {

    //==================================================
    // SEGURIDAD
    //==================================================

    // Un Rol tiene muchos Usuarios

    Rol.hasMany(Usuario, {
        foreignKey: "rol_id"
    });

    Usuario.belongsTo(Rol, {
        foreignKey: "rol_id"
    });



    // Un Usuario puede tener muchos Tokens

    Usuario.hasMany(Token, {
        foreignKey: "usuario_id"
    });

    Token.belongsTo(Usuario, {
        foreignKey: "usuario_id"
    });

    //==================================================
    // PACIENTES
    //==================================================

    Usuario.hasOne(Paciente, {
        foreignKey: "usuario_id"
    });

    Paciente.belongsTo(Usuario, {
        foreignKey: "usuario_id"
    });



    Usuario.hasOne(ConfiguracionNotificacion, {
        foreignKey: "usuario_id"
    });

    ConfiguracionNotificacion.belongsTo(Usuario, {
        foreignKey: "usuario_id"
    });

    //==================================================
    // MEDICOS
    //==================================================

    Usuario.hasOne(Medico, {
        foreignKey: "usuario_id"
    });

    Medico.belongsTo(Usuario, {
        foreignKey: "usuario_id"
    });



    Especialidad.hasMany(Medico, {
        foreignKey: "especialidad_id"
    });

    Medico.belongsTo(Especialidad, {
        foreignKey: "especialidad_id"
    });

    //==================================================
    // HORARIOS
    //==================================================

    Medico.hasMany(Horario, {
        foreignKey: "medico_id"
    });

    Horario.belongsTo(Medico, {
        foreignKey: "medico_id"
    });



    Usuario.hasMany(Horario, {
        foreignKey: "aprobado_por",
        as: "HorariosAprobados"
    });

    Horario.belongsTo(Usuario, {
        foreignKey: "aprobado_por",
        as: "Administrador"
    });

    //==================================================
    // CITAS
    //==================================================

    // Un paciente puede tener muchas citas

    Paciente.hasMany(Cita, {
        foreignKey: "paciente_id",
    });

    Cita.belongsTo(Paciente, {
        foreignKey: "paciente_id",
    });



    // Un médico puede atender muchas citas

    Medico.hasMany(Cita, {
        foreignKey: "medico_id",
    });

    Cita.belongsTo(Medico, {
        foreignKey: "medico_id",
    });



    // Un estado puede pertenecer a muchas citas

    EstadoCita.hasMany(Cita, {
        foreignKey: "estado_id",
    });

    Cita.belongsTo(EstadoCita, {
        foreignKey: "estado_id",
    });



    // Usuario que creó la cita

    Usuario.hasMany(Cita, {
        foreignKey: "creado_por",
        as: "CitasCreadas",
    });

    Cita.belongsTo(Usuario, {
        foreignKey: "creado_por",
        as: "Creador",
    });



    // Usuario que canceló la cita

    Usuario.hasMany(Cita, {
        foreignKey: "cancelado_por",
        as: "CitasCanceladas",
    });

    Cita.belongsTo(Usuario, {
        foreignKey: "cancelado_por",
        as: "CanceladoPor",
    });



    // Usuario que reprogramó la cita

    Usuario.hasMany(Cita, {
        foreignKey: "reprogramado_por",
        as: "CitasReprogramadas",
    });

    Cita.belongsTo(Usuario, {
        foreignKey: "reprogramado_por",
        as: "ReprogramadoPor",
    });

    //==================================================
    // DIAGNOSTICOS
    //==================================================

    // Una cita tiene un diagnóstico

    Cita.hasOne(Diagnostico, {
        foreignKey: "cita_id",
    });

    Diagnostico.belongsTo(Cita, {
        foreignKey: "cita_id",
    });



    // Un diagnóstico puede tener muchas prescripciones

    Diagnostico.hasMany(Prescripcion, {
        foreignKey: "diagnostico_id",
    });

    Prescripcion.belongsTo(Diagnostico, {
        foreignKey: "diagnostico_id",
    });

    //==================================================
    // NOTIFICACIONES
    //==================================================

    //--------------------------------------------------
    // Usuario -> Configuración de Notificaciones
    //--------------------------------------------------

    Usuario.hasOne(ConfiguracionNotificacion, {
        foreignKey: "usuario_id",
    });

    ConfiguracionNotificacion.belongsTo(Usuario, {
        foreignKey: "usuario_id",
    });


    //--------------------------------------------------
    // Usuario -> Notificaciones Recibidas
    //--------------------------------------------------

    Usuario.hasMany(Notificacion, {
        foreignKey: "usuario_id",
        as: "NotificacionesRecibidas",
    });

    Notificacion.belongsTo(Usuario, {
        foreignKey: "usuario_id",
        as: "Destinatario",
    });


    //--------------------------------------------------
    // Usuario -> Notificaciones Enviadas
    //--------------------------------------------------

    Usuario.hasMany(Notificacion, {
        foreignKey: "enviado_por",
        as: "NotificacionesEnviadas",
    });

    Notificacion.belongsTo(Usuario, {
        foreignKey: "enviado_por",
        as: "Remitente",
    });


    //--------------------------------------------------
    // Plantilla -> Notificaciones
    //--------------------------------------------------

    PlantillaNotificacion.hasMany(Notificacion, {
        foreignKey: "plantilla_id",
    });

    Notificacion.belongsTo(PlantillaNotificacion, {
        foreignKey: "plantilla_id",
    });


    //--------------------------------------------------
    // Notificación -> Cola
    //--------------------------------------------------

    Notificacion.hasMany(ColaNotificacion, {
        foreignKey: "notificacion_id",
    });

    ColaNotificacion.belongsTo(Notificacion, {
        foreignKey: "notificacion_id",
    });

    //==================================================
    // WHATSAPP
    //==================================================

    //--------------------------------------------------
    // Usuario -> Solicitudes WhatsApp
    //--------------------------------------------------

    Usuario.hasMany(SolicitudWhatsApp, {
        foreignKey: "usuario_asignado",
        as: "SolicitudesAsignadas",
    });

    SolicitudWhatsApp.belongsTo(Usuario, {
        foreignKey: "usuario_asignado",
        as: "Administrador",
    });


    //--------------------------------------------------
    // Cita -> Solicitudes WhatsApp
    //--------------------------------------------------

    Cita.hasMany(SolicitudWhatsApp, {
        foreignKey: "cita_id",
    });

    SolicitudWhatsApp.belongsTo(Cita, {
        foreignKey: "cita_id",
    });
}