import express from "express";

import {
    formLogin,
    login,
    logout,
    formRegister,
    register,
    formRecoverPassword,
    recoverPassword,
    formVerifyOTP,
    verifyOTP,
    formResetPassword,
    resetPassword
} from "../../controllers/auth/userController.js";

const router = express.Router();

// ===============================
// Login
// ===============================

router.get("/login", formLogin);
router.post("/login", login);

// ===============================
// Registro
// ===============================

router.get("/register", formRegister);
router.post("/register", register);

// ===============================
// Cerrar sesión
// ===============================

router.get("/logout", logout);

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