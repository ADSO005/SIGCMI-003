import express from "express";

import auth from "../../middleware/auth.js";
import role from "../../middleware/role.js";

import { verDashboard } from "../../controllers/admin/dashboardController.js";

import {
    listarUsuarios
} from "../../controllers/admin/usuariosController.js";

import {
    mostrarFormularioNuevaCita,
    obtenerHorasDisponibles,
    crearNuevaCita
} from "../../controllers/admin/citasController.js";

import {
    mostrarFormularioPaciente,
    registrarPaciente
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

// ===============================
// PACIENTES
// ===============================

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