import express from "express";
import {
    formLogin,
    login,
    logout,
    formRecoverPassword
} from "../../controllers/auth/userController.js";

const router = express.Router();

// Login
router.get("/login", formLogin);
router.post("/login",login);

// Cerrar sesion
router.get("/logout", logout);

// Registro


// Recuperar contraseña
router.get("/recover-password", formRecoverPassword);

export default router;