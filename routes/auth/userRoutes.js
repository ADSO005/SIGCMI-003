import express from "express";
import {
    formLogin,
    login,
    logout,
    formRecoverPassword,
    recoverPassword,
    formResetPassword,
    resetPassword
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
router.post("/recover-password", recoverPassword);

// Mostrar formulario de nueva contraseña
router.get("/reset-password/:token", formResetPassword);

// Guardar nueva contraseña
router.post("/reset-password/:token", resetPassword);

export default router;