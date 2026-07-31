import express from "express";
import {
    formLogin,
    formRecoverPassword,
    recoverPassword
} from "../controllers/userController.js";

const router = express.Router();

// Login
router.get("/login", formLogin);

// Registro


// Recuperar contraseña
router.get("/recover-password", formRecoverPassword);
router.post("/recover-password", recoverPassword);

export default router;