import Usuario from "../../models/Usuario.js";

import bcrypt from "bcrypt";

import generateJWT from "../../helpers/generateJWT.js";


// Renderiza el formulario de inicio de sesión.
const formLogin = (req, res) => {

    res.render("login/auth/login", {
        titulo: "Iniciar Sesión"
    });
};


// Valida las credenciales, registra el último acceso y crea la sesión del usuario.
const login = async (req, res) => {

    const { correo, password } = req.body;

    const usuario = await Usuario.findOne({
        where: {
            correo
        }
    });

    if (!usuario) {
        return res.render("login/auth/login", {
            titulo: "Iniciar Sesión",
            error: "No encontramos una cuenta asociada a este correo.",
            mostrarRegistro: true,
            correo
        });
    }

    const passwordCorrecta = await bcrypt.compare(
        password,
        usuario.password
    );

    if (!passwordCorrecta) {
        return res.render("login/auth/login", {
            titulo: "Iniciar Sesión",
            error: "La contraseña o correo es incorrecto.",
            correo
        });
    }

    if (!usuario.estado) {
        return res.render("login/auth/login", {
            titulo: "Iniciar Sesión",
            error: "La cuenta se encuentra inactiva.",
            correo
        });
    }

    if (!usuario.confirmado) {
        return res.render("login/auth/login", {
            titulo: "Iniciar Sesión",
            error: "Debes confirmar tu cuenta antes de iniciar sesión.",
            correo
        });
    }

    usuario.ultimo_login = new Date();

    await usuario.save();

    const token = generateJWT(usuario);

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

// Elimina la cookie de sesión y devuelve al usuario al inicio de sesión.
const logout = (req, res) => {

    res.clearCookie("_token");

    return res.redirect("/auth/login");

};


export {
    formLogin,
    login,
    logout
};





