import ConfiguracionNotificacion from '../../models/ConfiguracionNotificacion.js';
import { Cita, Diagnostico, Medico, Paciente, Prescripcion, Usuario, EstadoCita } from '../../models/index.js';

export const mostrarDashboard = (req, res) => {
    try {
        const paciente = {
            nombre: 'Juan'
        }

        const citas = [
            {
                id: 1,
                fecha: 'Miércoles, 4 de Junio de 2026',
                hora: '10:00',
                consultorio: 'Consultorio 101',
                doctor: 'Dr. Carlos Pérez',
                estado: 'Confirmada'
            },
            {
                id: 2,
                fecha: 'Miércoles, 4 de Junio de 2026',
                hora: '10:00',
                consultorio: 'Consultorio 101',
                doctor: 'Dr. Carlos Pérez',
                estado: 'Pendiente'
            },
            {
                id: 3,
                fecha: 'Miércoles, 4 de Junio de 2026',
                hora: '10:00',
                consultorio: 'Consultorio 101',
                doctor: 'Dr. Carlos Pérez',
                estado: 'Completada'
            }
        ]

        // OBJETO PROXIMACITA OBLIGATORIO
        const proximaCita = {
            fecha: 'Miércoles, 4 de Junio de 2026',
            doctor: 'Dr. Carlos Pérez',
            consultorio: 'Consultorio 101'
        }

        res.render('viewsPaciente/dashboard', {
            tituloPagina: 'Portal del Paciente',
            fechaActual: '3 de Abril del 2026',
            paciente,
            citas,
            proximaCita
        })
    } catch (error) {
        // ESTA LÍNEA TE IMPRIMIRÁ EL DETALLE EN LA TERMINAL / CONSOLA DE NODE
        console.error('Detalle del error:', error)
        res.status(500).send('Error al cargar el portal del paciente')
    }
}

export const mostrarPerfil = (req, res) => {
    const paciente = {
        nombre: 'Juan Esteban Montoya Marin',

        nombres: 'Juan Esteban',
        apellidos: 'Montoya Marin',
        correo: 'usuario@sigcmi.com',
        telefono: '+52 555 123 4567',
        fechaNacimiento: '1990-05-15',

        tipoDocumento: 'Cédula',
        numeroDocumento: '1234567890',

        tipoSangre: 'O+',
        alergias: 'Penicilina',
        condicionesMedicas: 'Ninguna',

        direccion: 'Calle 22 #15-14',
        departamento: 'Risaralda',
        ciudad: 'Pereira',

        contactoEmergencia: {
            nombres: '',
            apellidos: '',
            telefono: 'Ninguna',
            correo: 'usuario@sigcmi.com'
        }
    }

    res.render('viewsPaciente/profile', {
        paciente
    });
};

export const obtenerHistorialDiagnosticos = async (req, res) => {
    try {
        const paciente = await Paciente.findOne({
            where: { usuario_id: req.usuario.id_usuario },
            attributes: ['id_paciente']
        });

        if (!paciente) {
            return res.status(404).send('No se encontró el perfil del paciente.');
        }

        const citas = await Cita.findAll({
            where: { paciente_id: paciente.id_paciente },
            attributes: ['id_cita', 'fecha', 'hora'],
            include: [
                { model: EstadoCita, as: 'Estado', required: true, where: { nombre: 'Completada' }, attributes: [] },
                {
                    model: Diagnostico,
                    as: 'Diagnostico',
                    required: true,
                    include: [{
                        model: Prescripcion,
                        as: 'Prescripcions',
                        attributes: ['nombre_medicamento', 'dosis', 'frecuencia', 'duracion'],
                        required: false
                    }]
                },
                {
                    model: Medico,
                    attributes: ['id_medico'],
                    include: [{
                        model: Usuario,
                        attributes: ['nombres', 'apellidos']
                    }]
                }
            ],
            order: [['fecha', 'DESC'], ['hora', 'DESC']]
        });

        const diagnosticos = citas.map((cita) => {
            const diagnostico = cita.Diagnostico;
            const medicamentos = (diagnostico.Prescripcions || [])
                .map((prescripcion) => `${prescripcion.nombre_medicamento}: ${prescripcion.dosis} | ${prescripcion.frecuencia} | ${prescripcion.duracion}`)
                .join('\n');

            return {
                ...diagnostico.get({ plain: true }),
                fecha_diagnostico: diagnostico.fecha_diagnostico || cita.fecha,
                Medico: cita.Medico,
                prescripcion: medicamentos,
                observaciones: diagnostico.notas_adicionales || ''
            };
        });

        return res.render('viewsPaciente/diagnosticHistory', {
            tituloPagina: 'Historial de Diagnósticos',
            fechaActual: new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date()),
            paciente: {
                nombre: `${req.usuario.nombres} ${req.usuario.apellidos}`,
                rol: 'Paciente'
            },
            activeSection: 'diagnosticos',
            diagnosticos
        });

    } catch (error) {
        console.error("Error al obtener diagnósticos:", error);
        res.status(500).send("Error en el servidor");
    }
};

export const listarConfiguracionNotificaciones = async (req, res) => {
    const [con] = await ConfiguracionNotificacion.findOrCreate({
        where: { usuario_id: req.usuario.id_usuario },
        defaults: { usuario_id: req.usuario.id_usuario }
    });

    // Simular que esto vino de BD
    const configuracionNotificaciones = {
        tituloPagina: 'Configuración de Notificaciones',
        fechaActual: new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date()),
        paciente: {
            nombre: `${req.usuario.nombres} ${req.usuario.apellidos}`,
            rol: 'Paciente'
        },
        activeSection: 'notificaciones',
        correo: con.correo,
        sms: con.sms,
        whatsapp: con.whatsapp,
        recordatorio_24h: con.recordatorio_24h,
        recordatorio_1h: con.recordatorio_1h,
        confirmacion_cita: con.confirmacion_cita,
        cancelacion_cita: con.cancelacion_cita,
        reprogramacion: con.reprogramacion,
        nuevo_diagnostico: con.nuevo_diagnostico,
        success: req.query.success,
        message: req.query.message
    };

    res.render(
        'viewsPaciente/notificationsSetting',
        configuracionNotificaciones
    );
};

export const actualizarConfiguracionNotificaciones = async (req, res) => {
    const data = {
        correo: req.body.correo ? true : false,
        sms: req.body.sms ? true : false,
        whatsapp: req.body.whatsapp ? true : false,
        recordatorio_24h: req.body.recordatorio_24h ? true : false,
        recordatorio_1h: req.body.recordatorio_1h ? true : false,
        confirmacion_cita: req.body.confirmacion_cita ? true : false,
        cancelacion_cita: req.body.cancelacion_cita ? true : false,
        reprogramacion: req.body.reprogramacion ? true : false,
        nuevo_diagnostico: req.body.nuevo_diagnostico ? true : false
    };

    const [con] = await ConfiguracionNotificacion.findOrCreate({
        where: { usuario_id: req.usuario.id_usuario },
        defaults: { usuario_id: req.usuario.id_usuario }
    });
    await con.update(data);

    res.redirect('/paciente/notificaciones?success=1&message=Configuración actualizada correctamente');
}

