import Usuario from "../../models/Usuario.js";
import Paciente from "../../models/Paciente.js";
import RegistroPendiente from "../../models/RegistroPendiente.js";

import db from "../../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import generateJWT from "../../helpers/generateJWT.js";
import generateToken from "../../helpers/generateToken.js";
import generateOTP from "../../helpers/generateOTP.js";
import generateResetToken from "../../helpers/generateResetToken.js";

import {
    sendRecoveryEmail,
    sendConfirmationEmail
} from "../../services/emailService.js";

/* ruta de la vista principal inicio de sesion */
const formLogin = (req, res) => {

    res.render("login/auth/login", {
        titulo: "Iniciar Sesión"
    });
};


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

    console.log("JWT:", token);

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


/* ===============================
   FORMULARIO DE REGISTRO
================================ */

const formRegister = (req, res) => {

    res.render("login/auth/register", {
        titulo: "Crear Cuenta"
    });

};


/* ===============================
   REGISTRAR USUARIO
================================ */

const register = async (req, res) => {

    try {

        const {
            nombres,
            apellidos,
            email,
            telefono,
            fechaNacimiento,
            tipoDocumento,
            numeroDocumento,
            departamento,
            ciudad,
            password,
            confirmPassword
        } = req.body;


        // ===============================
        // VALIDAR CONTRASEÑAS
        // ===============================

        if (password !== confirmPassword) {

            return res.render("login/auth/register", {
                titulo: "Crear Cuenta",
                error: "Las contraseñas no coinciden.",
                formData: req.body
            });

        }


        // ===============================
        // BUSCAR CORREO EXISTENTE
        // ===============================

        const usuarioExistente = await Usuario.findOne({
            where: {
                correo: email
            }
        });


        if (usuarioExistente) {

            return res.render("login/auth/register", {
                titulo: "Crear Cuenta",
                error: "Ya existe una cuenta con ese correo.",
                formData: req.body
            });

        }


        // ===============================
        // BUSCAR DOCUMENTO EXISTENTE
        // ===============================

        const documentoExistente = await Usuario.findOne({
            where: {
                numero_documento: numeroDocumento
            }
        });


        if (documentoExistente) {

            return res.render("login/auth/register", {
                titulo: "Crear Cuenta",
                error: "Ya existe una cuenta con ese número de documento.",
                formData: req.body
            });

        }


        // ===============================
        // ENCRIPTAR CONTRASEÑA
        // ===============================

        const salt = await bcrypt.genSalt(10);

        const passwordHash = await bcrypt.hash(
            password,
            salt
        );


        // ===============================
        // GENERAR TOKEN
        // ===============================

        const token = generateToken();


        // ===============================
        // EXPIRACIÓN DEL TOKEN
        // ===============================

        const expiracion = new Date();

        expiracion.setMinutes(
            expiracion.getMinutes() + 15
        );


        // ===============================
        // CREAR REGISTRO PENDIENTE
        // ===============================

        const registro = await RegistroPendiente.create({

            nombres,

            apellidos,

            correo: email,

            telefono,

            fecha_nacimiento:
                fechaNacimiento || null,

            tipo_documento:
                tipoDocumento,

            numero_documento:
                numeroDocumento,

            departamento:
                departamento || null,

            ciudad:
                ciudad || null,

            password:
                passwordHash,

            token,

            token_expira:
                expiracion

        });


        // ===============================
        // ENVIAR CORREO
        // ===============================

        await sendConfirmationEmail(registro);


        // ===============================
        // INFORMAR AL USUARIO
        // ===============================

        return res.render(
            "login/auth/register",
            {
                titulo: "Crear Cuenta",

                mensaje:
                    "Hemos enviado un correo de confirmación. Revisa tu bandeja de entrada para activar tu cuenta."
            }
        );



    } catch (error) {

        console.error("❌ Error al registrar usuario:");
        console.error(error);

        return res.render("login/auth/register", {

            titulo: "Crear Cuenta",

            error: "Ocurrió un error al crear la cuenta.",

            formData: req.body

        });

    }

};

/* confirmer register */
const confirmRegister = async (req, res) => {
    try {
        const { token } = req.params;

        const registro = await RegistroPendiente.findOne({
            where: { token }
        });

        if (!registro) {
            return res.render("login/auth/confirmation", {
                titulo: "Confirmación de cuenta",
                error: "El enlace de confirmación no es válido."
            });
        }

        if (registro.token_expira < new Date()) {
            await registro.destroy();

            return res.render("login/auth/confirmation", {
                titulo: "Confirmación de cuenta",
                error: "El enlace de confirmación ha expirado. Debes realizar el registro nuevamente."
            });
        }

        const transaction = await db.transaction();

        try {
            const usuario = await Usuario.create(
                {
                    rol_id: 3,
                    nombres: registro.nombres,
                    apellidos: registro.apellidos,
                    correo: registro.correo,
                    telefono: registro.telefono,
                    tipo_documento: registro.tipo_documento,
                    numero_documento: registro.numero_documento,
                    password: registro.password,
                    confirmado: true,
                    estado: true
                },
                { transaction }
            );

            await Paciente.create(
                {
                    usuario_id: usuario.id_usuario,
                    fecha_nacimiento: registro.fecha_nacimiento,
                    departamento: registro.departamento,
                    ciudad: registro.ciudad
                },
                { transaction }
            );

            await registro.destroy({ transaction });

            await transaction.commit();

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

        return res.render("login/auth/login", {
            titulo: "Iniciar Sesión",
            mensaje: "¡Cuenta confirmada correctamente! Ya puedes iniciar sesión."
        });

    } catch (error) {
        console.error("❌ Error al confirmar registro:");
        console.error(error);

        return res.render("login/auth/confirmation", {
            titulo: "Confirmación de cuenta",
            error: "No fue posible confirmar la cuenta."
        });
    }
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

    const usuario = await Usuario.findOne({
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

    const codigo = generateOTP();

    const expiracion = new Date();
    expiracion.setMinutes(expiracion.getMinutes() + 15);

    usuario.codigo = codigo;
    usuario.codigo_expira = expiracion;

    await usuario.save();

    await sendRecoveryEmail(usuario);

    return res.render("login/auth/verify-otp", {
        titulo: "Verificar código",
        correo
    });

};

const verifyOTP = async (req, res) => {

    const { codigo } = req.body;

    const usuario = await Usuario.findOne({
        where: {
            codigo
        }
    });

    if (!usuario) {

        return res.render("login/auth/verify-otp", {
            titulo: "Verificar código",
            error: "El código ingresado no es válido."
        });

    }

    if (usuario.codigo_expira < new Date()) {

        usuario.codigo = null;
        usuario.codigo_expira = null;

        await usuario.save();

        return res.render("login/auth/verify-otp", {
            titulo: "Verificar código",
            error: "El código ha expirado. Solicita uno nuevo."
        });

    }

    const resetToken = generateResetToken(usuario);

    res.cookie("_reset_token", resetToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 10 * 60 * 1000
    });

    return res.redirect("/auth/reset-password");

};

const formVerifyOTP = (req, res) => {

    res.render("login/auth/verify-otp", {
        titulo: "Verificar código"
    });

};

/* funcion correo para el cambio de contraseña */
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

        if (decoded.tipo !== "password-reset") {

            return res.redirect("/auth/recover-password");

        }

        const usuario = await Usuario.findByPk(decoded.id);

        if (!usuario) {

            return res.redirect("/auth/recover-password");

        }

        return res.render("login/auth/reset-password", {
            titulo: "Nueva contraseña"
        });

    } catch (error) {

        return res.redirect("/auth/recover-password");

    }

};

// funcion cambiar contraseña
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

        if (decoded.tipo !== "password-reset") {

            return res.redirect("/auth/recover-password");

        }

        const usuario = await Usuario.findByPk(decoded.id);

        if (!usuario) {

            return res.redirect("/auth/recover-password");

        }

        const { password, password_confirmation } = req.body;

        if (password !== password_confirmation) {

            return res.render("login/auth/reset-password", {
                titulo: "Nueva contraseña",
                error: "Las contraseñas no coinciden."
            });

        }

        const salt = await bcrypt.genSalt(10);

        usuario.password = await bcrypt.hash(password, salt);

        usuario.codigo = null;
        usuario.codigo_expira = null;

        await usuario.save();

        res.clearCookie("_reset_token");

        return res.render("login/auth/login", {
            titulo: "Iniciar Sesión",
            mensaje: "Tu contraseña fue actualizada correctamente."
        });

    } catch (error) {

        return res.redirect("/auth/recover-password");

    }

};

export {
    formLogin,
    login,
    logout,
    formRegister,
    register,
    confirmRegister,
    formRecoverPassword,
    recoverPassword,
    formVerifyOTP,
    verifyOTP,
    formResetPassword,
    resetPassword
};





