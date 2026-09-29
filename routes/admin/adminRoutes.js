import express from "express";

import auth from "../../middleware/auth.js";
import role from "../../middleware/role.js";

import { verDashboard } from "../../controllers/admin/dashboardController.js";

//APARTADO USUARIOS
import {
    listarUsuarios,
    obtenerUsuario,
    actualizarUsuario,
    cambiarEstadoUsuario
} from "../../controllers/admin/usuariosController.js";

//APARTADO CREAR CITA
import {
    mostrarFormularioNuevaCita,
    obtenerHorasDisponibles,
    crearNuevaCita,
    listarCitas,
    obtenerCita,
    reprogramarCita,
    cancelarCita
} from "../../controllers/admin/citasController.js";

//APARTADO CREAR UN PACIENTE
import {
    mostrarFormularioPaciente,
    registrarPaciente,
    listarPacientes,
    obtenerPaciente,
    actualizarPaciente
} from "../../controllers/admin/pacientesController.js";

//APARTADO MEDICOS
import {
    listarMedicos,
    obtenerMedico,
    actualizarMedico,
    crearHorariosMedico
} from "../../controllers/admin/medicosController.js";

//APARTADO ESPECIALIDADES
import {
    listarEspecialidades,
    crearEspecialidad,
    obtenerEspecialidad,
    actualizarEspecialidad,
    eliminarEspecialidad
} from "../../controllers/admin/especialidadesController.js";

const router = express.Router();

// ===============================
// DASHBOARD
// ===============================

router.get(
    "/dashboard",
    auth,
    role(1),
    verDashboard
);

// ===============================
// USUARIOS
// ===============================

router.get(
    "/usuarios",
    auth,
    role(1),
    listarUsuarios
);

router.get(
    "/usuarios/:id",
    auth,
    role(1),
    obtenerUsuario
);

router.put(
    "/usuarios/:id",
    auth,
    role(1),
    actualizarUsuario
);

router.patch(
    "/usuarios/:id/estado",
    auth,
    role(1),
    cambiarEstadoUsuario
);

// ===============================
// PACIENTES
// ===============================


// Registrar paciente
router.get(
    "/pacientes/nuevo",
    auth,
    role(1),
    mostrarFormularioPaciente
);

router.post(
    "/pacientes/nuevo",
    auth,
    role(1),
    registrarPaciente
);

// Listar pacientes
router.get(
    "/pacientes",
    auth,
    role(1),
    listarPacientes
);

// Obtener paciente
router.get(
    "/pacientes/:id",
    auth,
    role(1),
    obtenerPaciente
);

// Actualizar paciente
router.put(
    "/pacientes/:id",
    auth,
    role(1),
    actualizarPaciente
);


// ===============================
// MÉDICOS
// ===============================

router.get(
    "/medicos",
    auth,
    role(1),
    listarMedicos
);

router.get(
    "/medicos/:id",
    auth,
    role(1),
    obtenerMedico
);

router.put(
    "/medicos/:id",
    auth,
    role(1),
    actualizarMedico
);


router.post(
    "/medicos/:id/horarios",
    auth,
    role(1),
    crearHorariosMedico
);

// ===============================
// ESPECIALIDADES
// ===============================

router.get(
    "/especialidades",
    auth,
    role(1),
    listarEspecialidades
);

router.post(
    "/especialidades",
    auth,
    role(1),
    crearEspecialidad
);

router.get(
    "/especialidades/:id",
    auth,
    role(1),
    obtenerEspecialidad
)

router.put(
    "/especialidades/:id",
    auth,
    role(1),
    actualizarEspecialidad
);

router.delete(
    "/especialidades/:id",
    auth,
    role(1),
    eliminarEspecialidad
)

// ===============================
// CITAS
// ===============================
router.get(
    "/citas",
    auth,
    role(1),
    listarCitas
);


router.get(
    "/citas/nueva",
    auth,
    role(1),
    mostrarFormularioNuevaCita
);

router.get(
    "/citas/disponibilidad",
    auth,
    role(1),
    obtenerHorasDisponibles
);

router.post(
    "/citas/nueva",
    auth,
    role(1),
    crearNuevaCita
);

router.get(
    "/citas/:id",
    auth,
    role(1),
    obtenerCita
);

router.put(
    "/citas/:id/reprogramar",
    auth,
    role(1),
    reprogramarCita
);

router.put(
    "/citas/:id/cancelar",
    auth,
    role(1),
    cancelarCita
);
export default router;