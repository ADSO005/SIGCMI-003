import express from "express";
const router = express.Router();

import {
    obtenerHistorialDiagnosticos,
    listarConfiguracionNotificaciones,
    actualizarConfiguracionNotificaciones
} from "../../controllers/paciente/controller.js";


// ======================================================
// VISTA: PERFIL DEL PACIENTE (GET /paciente/perfil)
// ======================================================
router.get("/perfil", async (req, res) => {
    try {
        // Datos de prueba para previsualizar la vista en el navegador
        const pacienteVista = {
            id: 1,
            nombre: "Juan Esteban Montoya Marin",
            nombres: "Juan Esteban",
            apellidos: "Montoya Marin",
            correo: "usuario@sigcmi.com",
            telefono: "+52 555 123 4567",
            fechaNacimiento: "1990-05-15",
            tipoDocumento: "CC",
            numeroDocumento: "1234567890",
            tipoSangre: "O +",
            alergias: "Penicilina",
            condicionesMedicas: "Ninguna",
            direccion: "Calle 22 #5-14",
            departamento: "Risaralda",
            ciudad: "Pereira",
            contactoEmergencia: {
                nombres: "María",
                apellidos: "Gómez",
                telefono: "+52 555 987 6543",
                correo: "emergencia@sigcmi.com"
            }
        };

        res.render("viewsPaciente/profile", {
            pagina: "Mi Perfil",
            paciente: pacienteVista
        });
    } catch (error) {
        console.error("Error al renderizar la vista de perfil:", error);
        res.status(500).send("Error al cargar la vista del perfil.");
    }
});

// ======================================================
// VISTA: EDITAR PERFIL (GET /paciente/perfil/editar)
// ======================================================
router.get("/perfil/editar", async (req, res) => {
    try {
        const pacienteVista = {
            nombres: "Juan Esteban",
            apellidos: "Montoya Marin",
            correo: "usuario@sigcmi.com",
            telefono: "+52 555 123 4567",
            fechaNacimiento: "1990-05-15",
            tipoDocumento: "CC",
            numeroDocumento: "1234567890",
            tipoSangre: "O +",
            alergias: "Penicilina",
            condicionesMedicas: "Ninguna",
            direccion: "Calle 22 #5-14",
            departamento: "Risaralda",
            ciudad: "Pereira"
        };

        res.render("viewsPaciente/editProfile", {
            pagina: "Editar Perfil",
            paciente: pacienteVista
        });
    } catch (error) {
        console.error("Error al renderizar el formulario de edición:", error);
        res.status(500).send("Error al cargar el formulario de edición.");
    }
});

// ======================================================
// HISTORIAL DE DIAGNÓSTICOS DEL PACIENTE
// ======================================================

router.get(
    "/historial-diagnosticos",
    // auth,
    // role(3),
    obtenerHistorialDiagnosticos
);


router.get('/notificaciones', listarConfiguracionNotificaciones);
router.post('/notificacion', actualizarConfiguracionNotificaciones);
export default router;