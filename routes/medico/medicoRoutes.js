import express from "express";
import auth from "../../middleware/auth.js";
import role from "../../middleware/role.js";

import {
    dashboard,
    detallePaciente,
    actualizarEstadoCita
} from "../../controllers/medico/medicoController.js";

const router = express.Router();

router.get(
    "/dashboard",
    auth,
    role(2),
    dashboard
);

router.get(
    "/pacientes/:id",
    auth,
    role(2),
    detallePaciente
);

router.patch(
    "/citas/:id/estado",
    auth,
    role(2),
    actualizarEstadoCita
);

export default router;