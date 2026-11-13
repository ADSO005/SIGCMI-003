import {
    Usuario,
    Rol
} from "../../models/index.js";

export const listarUsuarios = async (req, res) => {
    try {

        const usuarios = await Usuario.findAll({
            attributes: [
                "id_usuario",
                "rol_id",
                "nombres",
                "apellidos",
                "correo",
                "telefono",
                "tipo_documento",
                "numero_documento",
                "confirmado",
                "estado",
                "ultimo_login",
                "fecha_registro"
            ],
            order: [["fecha_registro", "DESC"]]
        });

        const roles = await Rol.findAll({
            attributes: [
                "id_rol",
                "nombre"
            ]
        });

        const usuariosLista = usuarios.map((usuario) => {

            const rol = roles.find(
                (rol) => rol.id_rol === usuario.rol_id
            );

            return {
                id: usuario.id_usuario,

                nombre:
                    `${usuario.nombres} ${usuario.apellidos}`,

                correo: usuario.correo,

                telefono: usuario.telefono,

                tipoDocumento:
                    usuario.tipo_documento,

                documento:
                    usuario.numero_documento,

                rol:
                    rol ? rol.nombre : "Sin rol",

                confirmado:
                    usuario.confirmado,

                estado:
                    usuario.estado,

                ultimoLogin:
                    usuario.ultimo_login,

                fechaRegistro:
                    usuario.fecha_registro
            };
        });

        res.render("viewsAdmin/usuarios/index", {

            // Administrador conectado
            usuarios: req.usuario,

            // Usuarios de la BD
            usuariosLista

        });

    } catch (error) {

        console.error(
            "Error al listar usuarios:",
            error
        );

        res.status(500).send(
            "Error al cargar la gestión de usuarios"
        );
    }
};

export const cambiarEstadoUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        // Validar ID
        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({
                ok: false,
                mensaje: "El ID del usuario no es válido."
            });
        }

        // Buscar usuario
        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                mensaje: "Usuario no encontrado."
            });
        }

        // Cambiar estado
        usuario.estado = !usuario.estado;

        await usuario.save();

        return res.json({
            ok: true,
            mensaje: usuario.estado
                ? "Usuario activado correctamente."
                : "Usuario desactivado correctamente.",
            estado: usuario.estado
        });

    } catch (error) {
        console.error("Error al cambiar estado del usuario:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error al cambiar el estado del usuario."
        });
    }
};
