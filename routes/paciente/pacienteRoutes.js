import express from 'express'
import auth from '../../middleware/auth.js'
import role from '../../middleware/role.js'

import { Paciente, Usuario, Cita, Medico, Especialidad, EstadoCita } from '../../models/index.js'
import { mostrarFormularioCancelacion, solicitarCodigoCancelacion, verificarCodigoCancelacion } from '../../controllers/paciente/cancelAppointment.js'
import { mostrarEdicionPerfil, guardarEdicionPerfil } from '../../controllers/paciente/profileController.js'

const router = express.Router()
// ======================================================
// VISTA: PERFIL DEL PACIENTE (GET /paciente/perfil)
// ======================================================
router.get('/perfil', async (req, res) => {
    try {
        // Datos de prueba para previsualizar la vista en el navegador
        const pacienteVista = {
            id: 1,
            nombre: 'Juan Esteban Montoya Marin',
            nombres: 'Juan Esteban',
            apellidos: 'Montoya Marin',
            correo: 'usuario@sigcmi.com',
            telefono: '+52 555 123 4567',
            fechaNacimiento: '1990-05-15',
            tipoDocumento: 'CC',
            numeroDocumento: '1234567890',
            tipoSangre: 'O +',
            alergias: 'Penicilina',
            condicionesMedicas: 'Ninguna',
            direccion: 'Calle 22 #5-14',
            departamento: 'Risaralda',
            ciudad: 'Pereira',
            contactoEmergencia: {
                nombres: 'MarÃ­a',
                apellidos: 'GÃ³mez',
                telefono: '+52 555 987 6543',
                correo: 'emergencia@sigcmi.com'
            }
        }

        res.render('viewsPaciente/profile', {
            tituloPagina: 'Mi Perfil',
            fechaActual: new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date()),
            paciente: pacienteVista
        })
    } catch (error) {
        console.error('Error al renderizar la vista de perfil:', error)
        res.status(500).send('Error al cargar la vista del perfil.')
    }
})

// ======================================================
// VISTA: EDITAR PERFIL (GET /paciente/perfil/editar)
// ======================================================
router.get('/perfil/editar', auth, role(3), mostrarEdicionPerfil)
router.post('/perfil/editar', auth, role(3), guardarEdicionPerfil)

/* PORTAL DEL PACIENTE: GET /paciente/dashboard */
router.get('/dashboard', auth, role(3), async (req, res) => {
    try {
        const paciente = await Paciente.findOne({
            where: { usuario_id: req.usuario.id_usuario },
            include: [{ model: Usuario, attributes: ['nombres', 'apellidos', 'correo'] }]
        })

        if (!paciente) return res.status(404).send('No se encontró el perfil del paciente.')

        const citasDB = await Cita.findAll({
            where: { paciente_id: paciente.id_paciente },
            include: [
                {
                    model: Medico,
                    include: [
                        { model: Usuario, attributes: ['nombres', 'apellidos'] },
                        { model: Especialidad, attributes: ['nombre'] }
                    ]
                },
                { model: EstadoCita, as: 'Estado', attributes: ['nombre'] }
            ],
            order: [['fecha', 'ASC'], ['hora', 'ASC']]
        })

        const formatearFecha = (fecha) => new Intl.DateTimeFormat('es-CO', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }).format(new Date(`${fecha}T12:00:00`))

        const citas = citasDB.map((cita) => ({
            id: cita.id_cita,
            fecha: formatearFecha(cita.fecha),
            hora: String(cita.hora).slice(0, 5),
            consultorio: cita.Medico?.Especialidad?.nombre || 'Consulta médica',
            doctor: cita.Medico?.Usuario
                ? `Dr. ${cita.Medico.Usuario.nombres} ${cita.Medico.Usuario.apellidos}`
                : 'Médico asignado',
            estado: cita.Estado?.nombre || 'Estado no disponible'
        }))

        const proximaCita = citasDB.find((cita) =>
            ['Pendiente', 'Confirmada'].includes(cita.Estado?.nombre)
        )
        const proximaCitaVista = proximaCita ? {
            fecha: formatearFecha(proximaCita.fecha),
            doctor: proximaCita.Medico?.Usuario
                ? `Dr. ${proximaCita.Medico.Usuario.nombres} ${proximaCita.Medico.Usuario.apellidos}`
                : 'Médico asignado',
            consultorio: proximaCita.Medico?.Especialidad?.nombre || 'Consulta médica'
        } : null

        res.render('viewsPaciente/dashboard', {
            tituloPagina: 'Portal del Paciente',
            fechaActual: new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date()),
            paciente: {
                nombre: `${paciente.Usuario.nombres} ${paciente.Usuario.apellidos}`,
                rol: 'Paciente'
            },
            citas,
            proximaCita: proximaCitaVista
        })
    } catch (error) {
        console.error('Error al cargar el dashboard del paciente:', error)
        res.status(500).send('Error al cargar el dashboard del paciente.')
    }
})

// Verificación de identidad antes de cancelar una cita.
router.get('/citas/:id/cancelar', auth, role(3), mostrarFormularioCancelacion)
router.post('/citas/:id/cancelar', auth, role(3), solicitarCodigoCancelacion)
router.post('/citas/:id/cancelar/verificar', auth, role(3), verificarCodigoCancelacion)
export default router
