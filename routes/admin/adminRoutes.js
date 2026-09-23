import express from "express";
import auth from "../../middleware/auth.js";
import role from "../../middleware/role.js";

import { verDashboard } from "../../controllers/admin/dashboardController.js";

import {
    mostrarFormularioNuevaCita,
    obtenerHorasDisponibles,
    crearNuevaCita
} from "../../controllers/admin/citasController.js";

const router = express.Router();

router.get(
    "/dashboard",
    auth,
    role(1),
    verDashboard
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