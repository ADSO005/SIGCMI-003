import User from "../../models/User.js";
import bcrypt from "bcrypt";
import generateJWT from "../../helpers/generateJWT.js";
import generateToken from "../../helpers/generateToken.js";
import sendRecoveryEmail from "../../services/emailService.js";

/* ruta de la vista principal inicio de sesion */
const formLogin = (req, res) => {

    res.render("login/auth/login", {
        titulo: "Iniciar Sesión"
    });
};


const login = async (req, res) => {

    const { correo, password } = req.body;

    const usuario = await User.findOne({
        where: {
            correo
        }
    });

    if (!usuario) {
        return res.render("login/auth/login", {
            titulo: "Iniciar Sesión",
            error: "Correo o contraseña incorrectos."
        });
    }

    const passwordCorrecta = await bcrypt.compare(
        password,
        usuario.password
    );

    if (!passwordCorrecta) {
        return res.render("login/auth/login", {
            titulo: "Iniciar Sesión",
            error: "Correo o contraseña incorrectos."
        });
    }

    if (!usuario.estado) {
        return res.render("login/auth/login", {
            titulo: "Iniciar Sesión",
            error: "La cuenta se encuentra inactiva."
        });
    }

    if (!usuario.confirmado) {
        return res.render("login/auth/login", {
            titulo: "Iniciar Sesión",
            error: "Debes confirmar tu cuenta antes de iniciar sesión."
        });
    }

    usuario.ultimo_login = new Date();

    await usuario.save();

    const token = generateJWT(usuario);

    console.log("JWT:",token);

    console.log(passwordCorrecta);

    console.log(usuario);

    res.cookie("_token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    });

    switch (usuario.rol_id) {

        case 1:
            return res.redirect("/admin/dashboard");

        case 2:
            return res.redirect("/medico/dashboard");

        case 3:
            return res.redirect("/paciente/dashboard");

        default:
            return res.redirect("/auth/login");
    }

};

const logout = (req, res) => {

    res.clearCookie("_token");

    return res.redirect("/auth/login");

};

/* ruta vista olvide mi contraseña */
const formRecoverPassword = (req, res) => {

    res.render("login/auth/recover-password", {
        titulo: "Recuperar contraseña"
    });
};

/* funcion enlace recuperar contraseña */
const recoverPassword = async (req, res) => {

    const { correo } = req.body;

    const usuario = await User.findOne({
        where: {
            correo
        }
    });

    if (!usuario) {

        return res.render("login/auth/recover-password", {
            titulo: "Recuperar contraseña",
            error: "No existe una cuenta con ese correo."
        });

    }

    usuario.token = generateToken();

    await usuario.save();

    await sendRecoveryEmail(usuario);

    return res.render("login/auth/recover-password",{
        titulo: "Recuperar contraseña",
        mensaje: "Hemos enviado un enlace de recuperación a tu correo. "
    });

};

/* funcion correo para el cambio de contraseña */
const formResetPassword = async (req, res) => {

    const { token } = req.params;

    const usuario = await User.findOne({
        where: {
            token
        }
    });

    if (!usuario) {

        return res.render("login/auth/recover-password", {
            titulo: "Recuperar contraseña",
            error: "El enlace de recuperación no es válido o ha expirado."
        });

    }

    res.render("login/auth/reset-password", {
        titulo: "Nueva contraseña",
        token
    });

};

// funcion cambiar contraseña
const resetPassword = async (req, res) => {

    const { token } = req.params;

    const { password, password_confirmation } = req.body;

    if (password !== password_confirmation) {

        return res.render("login/auth/reset-password", {
            titulo: "Nueva contraseña",
            token,
            error: "Las contraseñas no coinciden."
        });

    }

    const usuario = await User.findOne({
        where: {
            token
        }
    });

    if (!usuario) {

        return res.render("login/auth/recover-password", {
            titulo: "Recuperar contraseña",
            error: "El enlace no es válido."
        });

    }

    const salt = await bcrypt.genSalt(10);

    usuario.password = await bcrypt.hash(password, salt);

    usuario.token = null;

    await usuario.save();

    return res.render("login/auth/login", {
        titulo: "Iniciar Sesión",
        mensaje: "Tu contraseña fue actualizada correctamente."
    });

};

export {
    formLogin,
    login,
    logout,
    formRecoverPassword,
    recoverPassword,
    formResetPassword,
    resetPassword
};





