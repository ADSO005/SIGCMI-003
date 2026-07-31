import { Router } from "express";
import { body } from "express-validator";
import * as authController from "../../controllers/paciente/registerControllers.js";
const router = Router();

// GET /auth/register
router.get("/register", authController.showRegisterForm);

// POST /auth/register
router.post(
    "/register",
    [
        body("nombres")
            .trim()
            .notEmpty()
            .withMessage("El nombre es obligatorio"),

        body("apellidos")
            .trim()
            .notEmpty()
            .withMessage("El apellido es obligatorio"),

        body("email")
            .trim()
            .isEmail()
            .withMessage("Correo inválido")
            .normalizeEmail(),

        body("telefono")
            .trim()
            .notEmpty()
            .withMessage("El teléfono es obligatorio"),

        body("fechaNacimiento")
            .notEmpty()
            .withMessage("La fecha de nacimiento es obligatoria"),

        body("numeroDocumento")
            .trim()
            .notEmpty()
            .withMessage("El número de documento es obligatorio"),

        body("departamento")
            .trim()
            .notEmpty()
            .withMessage("El departamento es obligatorio"),

        body("ciudad")
            .trim()
            .notEmpty()
            .withMessage("La ciudad es obligatoria"),

        body("password")
            .isLength({ min: 8 })
            .withMessage("La contraseña debe tener mínimo 8 caracteres"),

        body("confirmPassword").custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("Las contraseñas no coinciden");
            }
            return true;
        }),
    ],
    authController.register
);

export default router;