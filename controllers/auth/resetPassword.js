import Usuario from "../../models/Usuario.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getPasswordPolicyError } from "../../helpers/passwordPolicy.js";

// Verifica la cookie temporal antes de mostrar el formulario de nueva contraseña.
const formResetPassword = async (req, res) => {

    const resetToken = req.cookies._reset_token;

    if (!resetToken) {

        return res.redirect("/auth/recover-password");

    }

    try {

        const decoded = jwt.verify(
            resetToken,
            process.env.JWT_SECRET
        );

        if (decoded.tipo !== "password-reset" || !decoded.jti) {

            return res.redirect("/auth/recover-password");

        }

        const usuario = await Usuario.findByPk(decoded.id);

        if (!usuario || usuario.token_reset !== decoded.jti) {

            return res.redirect("/auth/recover-password");

        }

        return res.render("login/auth/reset-password", {
            titulo: "Nueva contraseña"
        });

    } catch {

        return res.redirect("/auth/recover-password");

    }

};

// funcion cambiar contraseña
// Valida las contraseñas, guarda la nueva clave y limpia el estado de recuperación.
const resetPassword = async (req, res) => {

    const resetToken = req.cookies._reset_token;

    if (!resetToken) {

        return res.redirect("/auth/recover-password");

    }

    try {

        const decoded = jwt.verify(
            resetToken,
            process.env.JWT_SECRET
        );

        if (decoded.tipo !== "password-reset" || !decoded.jti) {

            return res.redirect("/auth/recover-password");

        }

        const usuario = await Usuario.findByPk(decoded.id);

        if (!usuario || usuario.token_reset !== decoded.jti) {

            return res.redirect("/auth/recover-password");

        }

        const { password, password_confirmation } = req.body;

        const passwordError = getPasswordPolicyError(password);
        if (passwordError) {
            return res.status(400).render("login/auth/reset-password", {
                titulo: "Nueva contraseña",
                error: passwordError
            });
        }

        if (password !== password_confirmation) {

            return res.render("login/auth/reset-password", {
                titulo: "Nueva contraseña",
                error: "Las contraseñas no coinciden."
            });

        }

        const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(10));
        const [tokenConsumido] = await Usuario.update(
            {
                password: passwordHash,
                token_reset: null,
                codigo: null,
                codigo_expira: null,
                codigo_intentos: 0
            },
            {
                where: {
                    id_usuario: usuario.id_usuario,
                    token_reset: decoded.jti
                }
            }
        );

        if (tokenConsumido !== 1) {
            return res.redirect("/auth/recover-password");
        }

        res.clearCookie("_reset_token");

        return res.render("login/auth/login", {
            titulo: "Iniciar Sesión",
            mensaje: "Tu contraseña fue actualizada correctamente."
        });

    } catch {

        return res.redirect("/auth/recover-password");

    }

};

export { formResetPassword, resetPassword };
