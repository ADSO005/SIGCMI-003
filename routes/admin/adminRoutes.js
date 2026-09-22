import express from "express";

import auth from "../../middleware/auth.js";
import role from "../../middleware/role.js";

import { verDashboard } from "../../controllers/admin/dashboardController.js";

const router = express.Router();

router.get(
    "/dashboard",
    auth,
    role(1),
    verDashboard
);

export default router;