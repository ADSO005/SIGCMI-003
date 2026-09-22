import Usuario from "../../models/Usuario.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import generateJWT from "../../helpers/generateJWT.js";
import generateToken from "../../helpers/generateToken.js";
import sendRecoveryEmail from "../../services/emailService.js";
import generateOTP from "../../helpers/generateOTP.js";
import generateResetToken from "../../helpers/generateResetToken.js";

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
        // CREAR USUARIO
        // ===============================

        await Usuario.create({

            rol_id: 3,

            nombres,

            apellidos,

            correo: email,

            telefono,

            tipo_documento: tipoDocumento,

            numero_documento: numeroDocumento,

            password: passwordHash,

            confirmado: true,

            estado: true

        });


        // ===============================
        // REGRESAR AL LOGIN
        // ===============================

        return res.render("login/auth/login", {

            titulo: "Iniciar Sesión",

            mensaje: "Cuenta creada correctamente. Ahora puedes iniciar sesión."

        });


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
    formRecoverPassword,
    recoverPassword,
    formVerifyOTP,
    verifyOTP,
    formResetPassword,
    resetPassword
};





