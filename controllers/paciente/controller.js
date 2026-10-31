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
    })
}
