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

export const obtenerHistorialDiagnosticos = async (req, res) => {
    try {
        // Aquí va tu lógica o los datos de prueba simulados que pusimos antes
        const diagnosticos = [
            {
                id_diagnostico: 1,
                fecha_diagnostico: '2026-10-15',
                diagnostico: 'Infección Respiratoria Aguda (Faringitis)',
                sintomas: 'Dolor de garganta, tos seca, fiebre moderada.',
                temperatura: '38.5',
                presion_arterial: '120/80',
                frecuencia_cardiaca: '88',
                peso: '70.5',
                tratamiento: 'Reposo absoluto e hidratación.',
                prescripcion: 'Ibuprofeno 600mg + Amoxicilina 500mg.',
                observaciones: 'Amígdalas inflamadas.',
                Citum: {
                    Medico: {
                        Usuario: {
                            nombres: 'Carlos Alberto',
                            apellidos: 'Mendoza Ruiz'
                        }
                    }
                }
            }
        ];

        return res.render('viewsPaciente/diagnosticHistory', {
            titulo: 'Historial de Diagnósticos',
            diagnosticos
        });

    } catch (error) {
        console.error("Error al obtener diagnósticos:", error);
        res.status(500).send("Error en el servidor");
    }
};

export const getNotificationSettings = (req, res) => {
    res.render('patient/notifications');
};