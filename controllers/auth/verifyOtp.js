import Usuario from "../../models/Usuario.js";
import generateResetToken from "../../helpers/generateResetToken.js";
import { Op } from "sequelize";

// Comprueba el código y habilita el paso de restablecimiento de contraseña.
const verifyOTP = async (req, res) => {

    const correo = typeof req.body.correo === "string" ? req.body.correo.trim() : "";
    const codigo = typeof req.body.codigo === "string" ? req.body.codigo.trim() : "";
    const datosVista = { titulo: "Verificar código", correo };

    if (!correo || !/^\d{6}$/.test(codigo)) {
        return res.status(400).render("login/auth/verify-otp", {
            ...datosVista,
            error: "Ingresa el correo asociado y un código válido de seis dígitos."
        });
    }

    const usuario = await Usuario.findOne({ where: { correo } });

    if (!usuario) {

        return res.status(400).render("login/auth/verify-otp", {
            ...datosVista,
            error: "El código ingresado no es válido."
        });

    }

    if (!usuario.codigo || !usuario.codigo_expira || usuario.codigo_expira < new Date()) {

        usuario.codigo = null;
        usuario.codigo_expira = null;
        usuario.codigo_intentos = 0;

        await usuario.save();

        return res.status(400).render("login/auth/verify-otp", {
            ...datosVista,
            error: "El código ha expirado. Solicita uno nuevo."
        });

    }

    if (usuario.codigo !== codigo) {
        // Incremento atómico para que peticiones simultáneas no evadan el límite.
        await usuario.increment("codigo_intentos");
        await usuario.reload();
        const intentosRestantes = Math.max(0, 5 - Number(usuario.codigo_intentos || 0));

        if (intentosRestantes === 0) {
            await Usuario.update(
                { codigo: null, codigo_expira: null },
                { where: { id_usuario: usuario.id_usuario, codigo: usuario.codigo } }
            );
        }

        return res.status(400).render("login/auth/verify-otp", {
            ...datosVista,
            error: intentosRestantes === 0
                ? "Se agotaron los intentos. Solicita un código nuevo."
                : `El código no es válido. Te quedan ${intentosRestantes} intentos.`
        });
    }

    // Consumo condicional: dos envíos simultáneos no pueden usar el mismo OTP.
    const [codigoConsumido] = await Usuario.update(
        { codigo: null, codigo_expira: null, codigo_intentos: 0 },
        {
            where: {
                id_usuario: usuario.id_usuario,
                codigo,
                codigo_expira: { [Op.gt]: new Date() }
            }
        }
    );

    if (codigoConsumido !== 1) {
        return res.status(400).render("login/auth/verify-otp", {
            ...datosVista,
            error: "El código ya fue utilizado o expiró. Solicita uno nuevo."
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

// Muestra el formulario para ingresar el código recibido por correo.
const formVerifyOTP = (req, res) => {
    return res.redirect("/auth/recover-password");
};

/* funcion correo para el cambio de contraseña */

export { verifyOTP, formVerifyOTP };
