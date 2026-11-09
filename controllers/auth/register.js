import Usuario from "../../models/Usuario.js";
import RegistroPendiente from "../../models/RegistroPendiente.js";
import bcrypt from "bcrypt";
import generateToken from "../../helpers/generateToken.js";
import { getPasswordPolicyError } from "../../helpers/passwordPolicy.js";
import { sendConfirmationEmail } from "../../services/emailService.js";

// Muestra el formulario para crear una cuenta de paciente.
const formRegister = (req, res) => {
  res.render("login/auth/register", { titulo: "Crear Cuenta" });
};

// Valida los datos, crea el registro pendiente y envía el enlace de confirmación.
const register = async (req, res) => {
  try {
    const {
      nombres, apellidos, email, telefono, fechaNacimiento, tipoDocumento,
      numeroDocumento, departamento, ciudad, password, confirmPassword
    } = req.body;

    const nombresLimpios = typeof nombres === "string" ? nombres.trim() : "";
    const apellidosLimpios = typeof apellidos === "string" ? apellidos.trim() : "";
    const correoLimpio = typeof email === "string" ? email.trim() : "";
    const telefonoLimpio = typeof telefono === "string" ? telefono.trim() : "";
    const tipoDocumentoLimpio = typeof tipoDocumento === "string" ? tipoDocumento.trim() : "";
    const numeroDocumentoLimpio = typeof numeroDocumento === "string" ? numeroDocumento.trim() : "";
    const errors = {};

    const today = new Date();
    const maxBirthYear = today.getFullYear() - 18;
    const maxBirthMonth = today.getMonth();
    const maxBirthDay = Math.min(today.getDate(), new Date(maxBirthYear, maxBirthMonth + 1, 0).getDate());
    const maxBirthDate = `${maxBirthYear}-${String(maxBirthMonth + 1).padStart(2, "0")}-${String(maxBirthDay).padStart(2, "0")}`;
    const parsedBirthDate = typeof fechaNacimiento === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)
      ? new Date(`${fechaNacimiento}T00:00:00.000Z`)
      : null;
    const birthDateIsValid = parsedBirthDate &&
      !Number.isNaN(parsedBirthDate.getTime()) &&
      parsedBirthDate.toISOString().slice(0, 10) === fechaNacimiento;

    if (nombresLimpios.length < 2 || nombresLimpios.length > 100) {
      errors.nombres = { msg: "Los nombres deben tener entre 2 y 100 caracteres." };
    }
    if (apellidosLimpios.length < 2 || apellidosLimpios.length > 100) {
      errors.apellidos = { msg: "Los apellidos deben tener entre 2 y 100 caracteres." };
    }
    if (correoLimpio.length < 6 || correoLimpio.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      errors.email = { msg: "Ingresa un correo válido de entre 6 y 150 caracteres." };
    }
    if (telefonoLimpio && !/^\d{10}$/.test(telefonoLimpio)) {
      errors.telefono = { msg: "El teléfono debe tener exactamente 10 dígitos, sin espacios ni código de país." };
    }

    if (!["CC", "CE", "PA"].includes(tipoDocumentoLimpio)) {
      errors.tipoDocumento = { msg: "Selecciona un tipo de documento válido." };
    }
    if (!numeroDocumentoLimpio) {
      errors.numeroDocumento = { msg: "Ingresa tu número de documento." };
    } else if (tipoDocumentoLimpio === "CC" && (!/^\d+$/.test(numeroDocumentoLimpio) || numeroDocumentoLimpio.length > 10)) {
      errors.numeroDocumento = { msg: "La cédula debe contener solo números y hasta 10 dígitos." };
    } else if (tipoDocumentoLimpio === "CE" && (!/^\d+$/.test(numeroDocumentoLimpio) || numeroDocumentoLimpio.length > 7)) {
      errors.numeroDocumento = { msg: "La cédula de extranjería debe contener solo números y hasta 7 dígitos." };
    } else if (tipoDocumentoLimpio === "PA" && numeroDocumentoLimpio.length > 30) {
      errors.numeroDocumento = { msg: "El pasaporte no puede superar 30 caracteres." };
    }

    if (!fechaNacimiento) {
      errors.fechaNacimiento = { msg: "Ingresa tu fecha de nacimiento." };
    } else if (!birthDateIsValid) {
      errors.fechaNacimiento = { msg: "Ingresa una fecha de nacimiento válida." };
    } else if (fechaNacimiento > maxBirthDate) {
      errors.fechaNacimiento = { msg: "Debes tener al menos 18 años para crear una cuenta." };
    }

    if (Object.keys(errors).length) {
      return res.render("login/auth/register", {
        titulo: "Crear Cuenta",
        errors,
        formData: { ...req.body, nombres: nombresLimpios, apellidos: apellidosLimpios, email: correoLimpio, telefono: telefonoLimpio }
      });
    }

    const passwordError = getPasswordPolicyError(password);
    if (passwordError) {
      return res.render("login/auth/register", {
        titulo: "Crear Cuenta",
        errors: { password: { msg: passwordError } },
        formData: req.body
      });
    }

    if (!String(departamento || "").trim() || !String(ciudad || "").trim()) {
      return res.render("login/auth/register", {
        titulo: "Crear Cuenta",
        errors: {
          ...(!String(departamento || "").trim() && { departamento: { msg: "Selecciona un departamento." } }),
          ...(!String(ciudad || "").trim() && { ciudad: { msg: "Selecciona un municipio." } })
        },
        formData: req.body
      });
    }

    if (password !== confirmPassword) {
      return res.render("login/auth/register", {
        titulo: "Crear Cuenta",
        errors: { confirmPassword: { msg: "Las contraseñas no coinciden. Verifica este campo." } },
        formData: req.body
      });
    }

    // Devuelve el formulario indicando el campo que ya pertenece a otra cuenta.
    const renderDuplicateError = (field, msg) => res.render("login/auth/register", {
      titulo: "Crear Cuenta",
      errors: { [field]: { msg } },
      formData: req.body
    });

    if (await Usuario.findOne({ where: { correo: correoLimpio } })) {
      return renderDuplicateError("email", "Ya existe una cuenta con ese correo. Verifica este campo o inicia sesión.");
    }
    if (await Usuario.findOne({ where: { numero_documento: numeroDocumentoLimpio } })) {
      return renderDuplicateError("numeroDocumento", "Ya existe una cuenta con ese número de documento. Verifica este campo.");
    }
    if (await RegistroPendiente.findOne({ where: { correo: correoLimpio } })) {
      return renderDuplicateError("email", "Ya existe una solicitud pendiente con este correo. Revisa tu bandeja de entrada.");
    }
    if (await RegistroPendiente.findOne({ where: { numero_documento: numeroDocumentoLimpio } })) {
      return renderDuplicateError("numeroDocumento", "Ya existe una solicitud pendiente con este documento. Verifica este campo.");
    }

    const missingEmailSettings = ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASS", "EMAIL_FROM"]
      .filter((key) => !process.env[key]?.trim());
    if (missingEmailSettings.length) {
      return res.status(503).render("login/auth/register", {
        titulo: "Crear Cuenta",
        error: "El registro no está disponible porque falta configurar el correo de confirmación. Contacta al administrador.",
        formData: req.body
      });
    }

    const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const token = generateToken();
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 15);

    const registration = await RegistroPendiente.create({
      nombres: nombresLimpios,
      apellidos: apellidosLimpios,
      correo: correoLimpio,
      telefono: telefonoLimpio || null,
      fecha_nacimiento: fechaNacimiento || null,
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumentoLimpio,
      departamento: departamento || null,
      ciudad: ciudad || null,
      password: passwordHash,
      token,
      token_expira: expiration
    });

    await sendConfirmationEmail(registration);
    return res.render("login/auth/register", {
      titulo: "Crear Cuenta",
      mensaje: "Hemos enviado un correo de confirmación. Revisa tu bandeja de entrada para activar tu cuenta."
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const fields = Object.keys(error.fields || {});
      const field = fields.includes("correo") ? "email" : fields.includes("numero_documento") ? "numeroDocumento" : null;
      if (field) {
        return res.render("login/auth/register", {
          titulo: "Crear Cuenta",
          errors: {
            [field]: {
              msg: field === "email"
                ? "Ya existe un registro con ese correo. Revisa tu solicitud pendiente o inicia sesión."
                : "Ya existe un registro con ese documento. Verifica el número e inténtalo de nuevo."
            }
          },
          formData: req.body
        });
      }
    }

    console.error("Error al registrar usuario:", error.name, error.original?.code || "sin código SQL");
    return res.render("login/auth/register", {
      titulo: "Crear Cuenta",
      error: "Ocurrió un error al crear la cuenta.",
      formData: req.body
    });
  }
};

export { formRegister, register };
