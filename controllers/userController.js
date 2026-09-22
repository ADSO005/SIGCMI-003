

/* ruta de la vista principal inicio de sesion */
const formLogin = (req, res) => {

    res.render("auth/login", {
        titulo: "Iniciar Sesión"
    });
};

/* ===============================
   FORMULARIO DE REGISTRO
================================ */

const formRegister = (req, res) => {
    res.render("register", {
        titulo: "Crear Cuenta"
    });
};


/* ===============================
   REGISTRO DE USUARIO
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

        // Verificar contraseñas
        if (password !== confirmPassword) {
            return res.render("register", {
                titulo: "Crear Cuenta",
                error: "Las contraseñas no coinciden.",
                formData: req.body
            });
        }

        // Verificar correo existente
        const usuarioExistente = await Usuario.findOne({
            where: {
                correo: email
            }
        });

        if (usuarioExistente) {
            return res.render("register", {
                titulo: "Crear Cuenta",
                error: "Ya existe una cuenta con ese correo.",
                formData: req.body
            });
        }

        // Verificar documento existente
        const documentoExistente = await Usuario.findOne({
            where: {
                numero_documento: numeroDocumento
            }
        });

        if (documentoExistente) {
            return res.render("register", {
                titulo: "Crear Cuenta",
                error: "Ya existe una cuenta con ese número de documento.",
                formData: req.body
            });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Crear usuario
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

        return res.redirect("/auth/login");

    } catch (error) {

        console.error("❌ Error al registrar usuario:", error);

        return res.render("register", {
            titulo: "Crear Cuenta",
            error: "Ocurrió un error al crear la cuenta.",
            formData: req.body
        });
    }
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





