import codes from "../helpers/codes.js";
import User from "../models/User.js";
import { enviarCodigoRecuperacion } from "../services/emailService.js";


/* ruta de la vista principal inicio de sesion */
const formLogin = (req, res) => {

    res.render("auth/login", {
        titulo: "Iniciar Sesión"
    });
};

/* ruta de la vista recuperar contraseña */
const formRecoverPassword = (req, res) => {

    res.render("auth/recover-password", {
        titulo: "Recuperar contraseña"
    });
};


/* funcion para la creacion del codigo, de recuperacion de contraseña */
const recoverPassword = async (req, res) => {

    const { email } = req.body;

    const usuario = await User.findOne({
        where: {
            correo: email
        }
    });

    if (!usuario) {

        return res.render("auth/recover-password", {
            titulo: "Recuperar contraseña",
            error: "No existe una cuenta con ese correo."
        });

    }

    const codigo = codes();

    usuario.codigo = codigo;
    usuario.codigo_expira = new Date(Date.now() + (10 * 60 * 1000));

    await usuario.save();

    // Enviar el correo
    await enviarCodigoRecuperacion({
        correo: usuario.correo,
        nombres: usuario.nombres,
        codigo
    });

    return res.render("auth/recover-password", {
        titulo: "Recuperar contraseña",
        exito: "Hemos enviado un código de verificación a tu correo."
    });

}

export {
    formLogin,
    formRecoverPassword,
    recoverPassword
};





