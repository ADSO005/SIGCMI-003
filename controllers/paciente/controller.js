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

import { Diagnostico, Medico, Prescripcion, Cita, Paciente, Usuario } from '../../models/index.js';

// Renderizar la vista de Historial de Diagnósticos del Paciente
export const obtenerHistorialDiagnosticos = async (req, res) => {
    try {
        // ---- BYPASS TEMPORAL PARA VER LA VISTA ----
        const paciente = await Paciente.findOne(); // Toma el primer paciente que encuentre en tu BD
        
        if (!paciente) {
            return res.send("La tabla de pacientes está vacía en la base de datos.");
        }
        // ------------------------------------------

const diagnosticos = await Diagnostico.findAll({
    include: [
        {
            model: Cita,
            required: true,
            where: { paciente_id: paciente.id_paciente || paciente.id },
            include: [
                {
                    model: Medico,
                    include: [{ model: Usuario, attributes: ['nombres', 'apellidos'] }]
                }
            ]
        },
        {
            model: Prescripcion
        }
    ],
    order: [['id_diagnostico', 'DESC']] // <--- Cambiado a una columna real de la tabla
});

        res.render('viewsPaciente/diagnosticHistory', {
            pagina: 'Historial de Diagnósticos',
            diagnosticos
        });
    } catch (error) {
        console.error('Error al obtener el historial de diagnósticos:', error);
        res.status(500).render('viewsPaciente/diagnosticHistory', {
            pagina: 'Historial de Diagnósticos',
            diagnosticos: [],
            errores: [{ msg: 'Hubo un error al cargar la información' }]
        });
    }
};