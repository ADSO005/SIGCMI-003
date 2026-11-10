import Usuario from "../../models/Usuario.js";
import Paciente from "../../models/Paciente.js";
import RegistroPendiente from "../../models/RegistroPendiente.js";
import db from "../../config/db.js";

// Valida el token de confirmación y crea el usuario junto con su perfil de paciente.
const confirmRegister = async (req, res) => {
  try {
    const { token } = req.params;
    const registration = await RegistroPendiente.findOne({ where: { token } });

    if (!registration) {
      return res.render("login/auth/confirmation", {
        titulo: "Confirmación de cuenta",
        error: "El enlace de confirmación no es válido."
      });
    }
    if (registration.token_expira < new Date()) {
      await registration.destroy();
      return res.render("login/auth/confirmation", {
        titulo: "Confirmación de cuenta",
        error: "El enlace de confirmación ha expirado. Debes realizar el registro nuevamente."
      });
    }

    const transaction = await db.transaction();
    try {
      const user = await Usuario.create({
        rol_id: 3,
        nombres: registration.nombres,
        apellidos: registration.apellidos,
        correo: registration.correo,
        telefono: registration.telefono,
        tipo_documento: registration.tipo_documento,
        numero_documento: registration.numero_documento,
        password: registration.password,
        confirmado: true,
        estado: true
      }, { transaction });

      await Paciente.create({
        usuario_id: user.id_usuario,
        fecha_nacimiento: registration.fecha_nacimiento,
        departamento: registration.departamento,
        ciudad: registration.ciudad
      }, { transaction });

      await registration.destroy({ transaction });
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
    console.error("Error al confirmar registro:");
    console.error(error);
    return res.render("login/auth/confirmation", {
      titulo: "Confirmación de cuenta",
      error: "No fue posible confirmar la cuenta."
    });
  }
};

export { confirmRegister };
