import express from "express";
import { verDashboard } from "../../controllers/admin/dashboardController.js";
// import { verificarJWT } from "../../middleware/verificarJWT.js"; // descomenta cuando lo tengas

const router = express.Router();

// GET /admin/dashboard
// Si ya tienes el middleware de JWT, agrégalo aquí como segundo argumento:
// router.get("/dashboard", verificarJWT, verDashboard);
router.get("/dashboard", verDashboard);

export default router;