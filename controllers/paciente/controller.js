export const mostrarDashboard = (req, res) => {
    
    const paciente = {
        nombre: 'Juan'
    };

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
    ];

    res.render('viewsPaciente/dashboard', {
        paciente,
        citas
    });
};
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
    };

    res.render('viewsPaciente/profile', {
        paciente
    });
};

import { Diagnostico, Medico, Prescripcion, Paciente, Usuario } from '../../models/index.js';

// Renderizar la vista de Historial de Diagnósticos del Paciente
const obtenerHistorialDiagnosticos = async (req, res) => {
    try {
        // Obtener el ID del usuario o paciente desde la sesión/token (req.usuario)
        const usuarioId = req.usuario.id;

        // Buscar el perfil de paciente asociado al usuario
        const paciente = await Paciente.findOne({ where: { usuario_id: usuarioId } });

        if (!paciente) {
            return res.redirect('/auth/login');
        }

        // Consultar diagnósticos del paciente con sus asociaciones
        const diagnosticos = await Diagnostico.findAll({
            where: { paciente_id: paciente.id },
            include: [
                {
                    model: Medico,
                    include: [{ model: Usuario, attributes: ['nombre', 'apellido'] }]
                },
                {
                    model: Prescripcion
                }
            ],
            order: [['fecha_registro', 'DESC']]
        });

        res.render('viewsPaciente/diagnosticHistory', {
            pagina: 'Historial de Diagnósticos',
            nombreUsuario: `${req.usuario.nombre} ${req.usuario.apellido}`,
            diagnosticos
        });
    } catch (error) {
        console.error('Error al obtener el historial de diagnósticos:', error);
        res.status(500).render('viewsPaciente/diagnosticHistory', {
            pagina: 'Historial de Diagnósticos',
            errores: [{ msg: 'Hubo un error al cargar la información' }]
        });
    }
};

export {
    obtenerHistorialDiagnosticos
};