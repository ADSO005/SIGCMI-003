import express from "express";
import auth from "../../middleware/auth.js";
import role from "../../middleware/role.js";


import {
    Paciente,
    Usuario,
    Cita,
    Medico,
    EstadoCita,
    ConfiguracionNotificacion
} from "../../models/index.js";

import {
    obtenerHistorialDiagnosticos
} from "../../controllers/paciente/controller.js";

const router = express.Router();

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


/**
 * Obtiene las preferencias de notificación del paciente autenticado.
 */
router.get(
    "/notificaciones/configuracion",
    auth,
    role(3),
    async (req, res) => {
        try {
            const usuarioId = req.usuario.id_usuario;

            let configuracion = await ConfiguracionNotificacion.findOne({
                where: {
                    usuario_id: usuarioId
                }
            });

            if (!configuracion) {
                configuracion = await ConfiguracionNotificacion.create({
                    usuario_id: usuarioId
                });
            }

            return res.json({
                ok: true,
                configuracion
            });
        } catch (error) {
            console.error(
                "Error al consultar preferencias de notificación:",
                error
            );

            return res.status(500).json({
                ok: false,
                mensaje: "No fue posible consultar las preferencias de notificación."
            });
        }
    }
);


/**
 * Guarda las preferencias de notificación del paciente autenticado.
 */
router.put(
    "/notificaciones/configuracion",
    auth,
    role(3),
    async (req, res) => {
        try {
            const usuarioId = req.usuario.id_usuario;

            const camposPermitidos = [
                "correo",
                "sms",
                "whatsapp",
                "recordatorio_24h",
                "recordatorio_1h",
                "confirmacion_cita",
                "cancelacion_cita",
                "reprogramacion",
                "nuevo_diagnostico",
                "actualizaciones"
            ];

            const cambios = {};

            for (const campo of camposPermitidos) {
                if (typeof req.body[campo] === "boolean") {
                    cambios[campo] = req.body[campo];
                }
            }

            if (Object.keys(cambios).length === 0) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "No se recibieron preferencias válidas."
                });
            }

            let configuracion =
                await ConfiguracionNotificacion.findOne({
                    where: { usuario_id: usuarioId }
                });

            if (!configuracion) {
                configuracion = await ConfiguracionNotificacion.create({
                    usuario_id: usuarioId,
                    ...cambios
                });
            } else {
                await configuracion.update(cambios);
            }

            return res.json({
                ok: true,
                mensaje: "Preferencias guardadas correctamente.",
                configuracion
            });
        } catch (error) {
            console.error(
                "Error al guardar preferencias de notificación:",
                error
            );

            return res.status(500).json({
                ok: false,
                mensaje: "No fue posible guardar las preferencias."
            });
        }
    }
);


export default router;