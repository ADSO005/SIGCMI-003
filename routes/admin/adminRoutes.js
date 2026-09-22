import express from "express";
import auth from "../../middleware/auth.js";
import role from "../../middleware/role.js";

import { verDashboard } from "../../controllers/admin/dashboardController.js";

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

export default router;