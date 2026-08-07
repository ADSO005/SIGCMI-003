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