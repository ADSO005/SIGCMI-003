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

// --- RELACIONES CORRECTAS SEGÚN TU TABLA ---
Diagnostico.belongsTo(Cita, { foreignKey: 'cita_id' });
Cita.hasMany(Diagnostico, { foreignKey: 'cita_id' });

Cita.belongsTo(Medico, { foreignKey: 'medico_id' }); // O como esté relacionada la cita con el médico
Medico.hasMany(Cita, { foreignKey: 'medico_id' });
export {
    Usuario,
    Rol,
    Paciente,
    Medico,
    Especialidad,
    Horario,
    EstadoCita,
    Cita,
    Diagnostico,
    Prescripcion,
    Notificacion,
    PlantillaNotificacion,
    ConfiguracionNotificacion,
    ColaNotificacion,
    SolicitudWhatsApp,
    Token,
};