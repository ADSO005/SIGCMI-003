import express from "express";
import {
    formLogin,
    formRecoverPassword,
    recoverPassword
} from "../../controllers/userController.js";

const router = express.Router();

// Ruta raíz (redirige al login)
router.get("/", (req, res) => {
    res.redirect("/login");
});

// Login
router.get("/login", formLogin);

// Registro


// Recuperar contraseña
router.get("/recover-password", formRecoverPassword);
router.post("/recover-password", recoverPassword);

// Dashboard Médico (SIGCMI)
router.get("/dashboard", (req, res) => {
    res.render("dashboardMedical", { title: "Portal Médico - SIGCMI" });
});

export default router;