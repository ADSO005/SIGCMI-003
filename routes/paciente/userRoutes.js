import express from "express";
import {
    formLogin,
    formRecoverPassword
} from "../../controllers/paciente/userController.js";

const router = express.Router();

// Login
router.get("/login", formLogin);

// Registro


// Recuperar contraseña
router.get("/recover-password", formRecoverPassword);

export default router;