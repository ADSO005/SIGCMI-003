import express from "express";

import auth from "../../middleware/auth.js";
import role from "../../middleware/role.js";

import { verDashboard } from "../../controllers/admin/dashboardController.js";

import {
    listarUsuarios,
    obtenerUsuario,
    actualizarUsuario,
    cambiarEstadoUsuario
} from "../../controllers/admin/usuariosController.js";

import {
    mostrarFormularioNuevaCita,
    obtenerHorasDisponibles,
    crearNuevaCita
} from "../../controllers/admin/citasController.js";

import {
    mostrarFormularioPaciente,
    registrarPaciente,
    listarPacientes,
    obtenerPaciente,
    actualizarPaciente
} from "../../controllers/admin/pacientesController.js";

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

// ========================================
// PACIENTES
// ========================================

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

export default router;