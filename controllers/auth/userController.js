import User from "../../models/User.js";
import bcrypt from "bcrypt";
import generateJWT from "../../helpers/generateJWT.js";


/* ruta de la vista principal inicio de sesion */
const formLogin = (req, res) => {

    res.render("login/auth/login", {
        titulo: "Iniciar Sesión"
    });
};

/* ruta de la vista recuperar contraseña */
const formRecoverPassword = (req, res) => {

    res.render("login/auth/recover-password", {
        titulo: "Recuperar contraseña"
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


export {
    formLogin,
    login,
    logout,
    formRecoverPassword
};





