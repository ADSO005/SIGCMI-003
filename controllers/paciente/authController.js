import { validationResult } from "express-validator";
import bcrypt from "bcrypt";
import Usuario from "../../models/paciente/Usuario.js";
import generarToken from "../../helpers/generarToken.js";
import enviarEmailRegistro from "../../helpers/emailRegistro.js";

// GET /auth/register
export const showRegisterForm = (req, res) => {
  res.render("viewsPaciente/register", {
    errors: {},
    formData: {},
  });
};

// POST /auth/register
export const register = async (req, res) => {

  console.log(req.body);
  console.log("Correo recibido:", `"${req.body.email}"`);
  // Verificar si el correo ya existe
  const existeCorreo = await Usuario.findOne({
    where: { correo: req.body.email }
  });
  console.log("Resultado búsqueda:", existeCorreo);

  if (existeCorreo) {
    return res.status(400).render("viewsPaciente/register", {
      errors: {
        email: { msg: "Este correo ya está registrado." }
      },
      formData: req.body,
    });
  }

  // Verificar si el documento ya existe
  const existeDocumento = await Usuario.findOne({
    where: { numero_documento: req.body.numeroDocumento }
  });

  if (existeDocumento) {
    return res.status(400).render("viewsPaciente/register", {
      errors: {
        numeroDocumento: { msg: "Este número de documento ya está registrado." }
      },
      formData: req.body,
    });
  }

  const passwordHash = await bcrypt.hash(req.body.password, 10);
  const token = generarToken();
  // Crear usuario
  const usuario = await Usuario.create({
    rol_id: 3,
    nombres: req.body.nombres,
    apellidos: req.body.apellidos,
    correo: req.body.email,
    telefono: req.body.telefono,
    tipo_documento: req.body.tipoDocumento,
    numero_documento: req.body.numeroDocumento,
    password: passwordHash,
    confirmado: false,
    estado: true,
    token
  });
  await enviarEmailRegistro({
    nombre: usuario.nombres,
    correo: usuario.correo,
    token: usuario.token
  });
  console.log("Usuario creado:", usuario.id_usuario);

  res.redirect("/auth/login");

};

export const confirmarCuenta = async (req, res) => {

    const { token } = req.params;

    const usuario = await Usuario.findOne({
        where: {
            token
        }
    });

    if (!usuario) {
        return res.render("viewsPaciente/confirmar-cuenta", {
            pagina: "Confirmar Cuenta",
            error: true,
            mensaje: "Token inválido o la cuenta ya fue confirmada."
        });
    }

    usuario.confirmado = true;
    usuario.token = null;

    await usuario.save();

    res.render("viewsPaciente/confirmar-cuenta", {
        pagina: "Cuenta Confirmada",
        error: false,
        mensaje: "Tu cuenta fue confirmada correctamente. Ya puedes iniciar sesión."
    });

};

export const checkEmail = async (req, res) => {

    try {

        const { email } = req.query;

        if (!email) {

            return res.status(400).json({
                existe: false,
                mensaje: "Correo no enviado."
            });

        }

        const usuario = await Usuario.findOne({
            where: {
                correo: email
            }
        });

        return res.json({
            existe: !!usuario
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            existe: false,
            mensaje: "Error interno del servidor."
        });

    }

};

// ===============================
// Verificar documento en la BD
// ===============================

export const checkDocument = async (req, res) => {

    try {

        const { documento } = req.query;

        if (!documento) {

            return res.status(400).json({
                existe: false,
                mensaje: "Documento no enviado."
            });

        }

        const usuario = await Usuario.findOne({
            where: {
                numero_documento: documento
            }
        });

        return res.json({
            existe: !!usuario
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            existe: false,
            mensaje: "Error interno del servidor."
        });

    }

};