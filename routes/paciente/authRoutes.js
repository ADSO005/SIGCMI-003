import { Router } from "express";
import { body } from "express-validator";
import * as authController from "../../controllers/paciente/authController.js";
const router = Router();

// ===============================
// Registro
// ===============================

router.get("/register", authController.showRegisterForm);

router.post(
    "/register",
    [
        // Validaciones...
    ],
    authController.register
);

// ===============================
// Confirmación de cuenta
// ===============================

router.get(
    "/confirmar/:token",
    authController.confirmarCuenta
);

// ===============================
// Validaciones AJAX
// ===============================

router.get(
    "/check-email",
    authController.checkEmail
);

router.get(
    "/check-document",
    authController.checkDocument
);

export default router;