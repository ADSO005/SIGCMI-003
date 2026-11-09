import express from "express";
import { formRegister, register } from "../../controllers/auth/register.js";
import { confirmRegister } from "../../controllers/auth/confirmation.js";
import { formRecoverPassword, recoverPassword } from "../../controllers/auth/recoverPassword.js";
import { formVerifyOTP, verifyOTP } from "../../controllers/auth/verifyOtp.js";
import { formResetPassword, resetPassword } from "../../controllers/auth/resetPassword.js";

import {
    formLogin,
    login,
    logout
} from "../../controllers/auth/login.js";

const router = express.Router();

// ===============================
// Login
// ===============================

router.get("/login", formLogin); // Muestra el formulario de inicio de sesión.
router.post("/login", login); // Procesa las credenciales y crea la sesión.

// ===============================
// Registro
// ===============================

router.get("/register", formRegister);
router.post("/register", register);
router.get("/confirm-register/:token", confirmRegister);

// ===============================
// Cerrar sesión
// ===============================

router.post("/logout", logout); // Cierra la sesión del usuario.

// ===============================
// Recuperar contraseña
// ===============================

router.get("/recover-password", formRecoverPassword);
router.post("/recover-password", recoverPassword);

// ===============================
// Verificar código OTP
// ===============================

router.get("/verify-otp", formVerifyOTP);
router.post("/verify-otp", verifyOTP);

// ===============================
// Cambiar contraseña
// ===============================

router.get("/reset-password", formResetPassword);
router.post("/reset-password", resetPassword);

export default router;
