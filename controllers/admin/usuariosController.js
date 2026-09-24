import { Usuario, Rol } from "../../models/index.js";

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
export const obtenerUsuario = async (req, res) => {
    try {

        const { id } = req.params;

        const usuario = await Usuario.findByPk(id, {
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
                "estado"
            ]
        });

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                mensaje: "Usuario no encontrado."
            });
        }

        res.json({
            ok: true,
            usuario
        });

    } catch (error) {

        console.error(
            "Error al obtener usuario:",
            error
        );

        res.status(500).json({
            ok: false,
            mensaje: "Error al obtener el usuario."
        });
    }
};


export const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nombres,
            apellidos,
            correo,
            telefono,
            tipo_documento,
            numero_documento,
            rol_id
        } = req.body;

        // ========================================
        // CAMPOS OBLIGATORIOS
        // ========================================

        if (
            !nombres ||
            !apellidos ||
            !correo ||
            !telefono ||
            !tipo_documento ||
            !numero_documento ||
            !rol_id
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Todos los campos son obligatorios."
            });
        }

        // ========================================
        // VALIDAR ID
        // ========================================

        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({
                ok: false,
                mensaje: "El ID del usuario no es válido."
            });
        }

        // ========================================
        // BUSCAR USUARIO
        // ========================================

        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                mensaje: "Usuario no encontrado."
            });
        }

        // ========================================
        // LIMPIAR DATOS
        // ========================================

        const nombresLimpios = nombres.trim();
        const apellidosLimpios = apellidos.trim();
        const correoLimpio = correo.trim().toLowerCase();
        const telefonoLimpio = telefono.trim();
        const tipoDocumentoLimpio = tipo_documento.trim();
        const numeroDocumentoLimpio = numero_documento.trim();

        // ========================================
        // VALIDAR NOMBRES
        // ========================================

        const nombreRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;

        if (nombresLimpios.length < 2) {
            return res.status(400).json({
                ok: false,
                mensaje: "Los nombres deben tener mínimo 2 caracteres."
            });
        }

        if (!nombreRegex.test(nombresLimpios)) {
            return res.status(400).json({
                ok: false,
                mensaje: "Los nombres solo pueden contener letras y espacios."
            });
        }

        // ========================================
        // VALIDAR APELLIDOS
        // ========================================

        if (apellidosLimpios.length < 2) {
            return res.status(400).json({
                ok: false,
                mensaje: "Los apellidos deben tener mínimo 2 caracteres."
            });
        }

        if (!nombreRegex.test(apellidosLimpios)) {
            return res.status(400).json({
                ok: false,
                mensaje: "Los apellidos solo pueden contener letras y espacios."
            });
        }

        // ========================================
        // VALIDAR CORREO
        // ========================================

        const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!correoRegex.test(correoLimpio)) {
            return res.status(400).json({
                ok: false,
                mensaje: "El correo electrónico no es válido."
            });
        }

        // ========================================
        // VALIDAR TELÉFONO
        // ========================================

        const telefonoRegex = /^\d{7,10}$/;

        if (!telefonoRegex.test(telefonoLimpio)) {
            return res.status(400).json({
                ok: false,
                mensaje: "El teléfono debe contener entre 7 y 10 números."
            });
        }

        // ========================================
        // VALIDAR TIPO DE DOCUMENTO
        // ========================================

        const tiposDocumentoPermitidos = [
            "CC",
            "TI",
            "CE",
            "Pasaporte"
        ];

        if (!tiposDocumentoPermitidos.includes(tipoDocumentoLimpio)) {
            return res.status(400).json({
                ok: false,
                mensaje: "El tipo de documento seleccionado no es válido."
            });
        }

        // ========================================
        // VALIDAR NÚMERO DE DOCUMENTO
        // ========================================

        const documentoRegex = /^\d{5,15}$/;

        if (!documentoRegex.test(numeroDocumentoLimpio)) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El número de documento debe contener entre 5 y 15 números."
            });
        }

        // ========================================
        // VALIDAR ROL
        // ========================================

        const rolId = Number(rol_id);

        if (![1, 2, 3].includes(rolId)) {
            return res.status(400).json({
                ok: false,
                mensaje: "El rol seleccionado no es válido."
            });
        }

        const rolExiste = await Rol.findByPk(rolId);

        if (!rolExiste) {
            return res.status(400).json({
                ok: false,
                mensaje: "El rol seleccionado no existe."
            });
        }

        // ========================================
        // VALIDAR CORREO DUPLICADO
        // ========================================

        const correoExiste = await Usuario.findOne({
            where: {
                correo: correoLimpio
            }
        });

        if (
            correoExiste &&
            correoExiste.id_usuario !== Number(id)
        ) {
            return res.status(409).json({
                ok: false,
                mensaje: "El correo electrónico ya está registrado."
            });
        }

        // ========================================
        // VALIDAR DOCUMENTO DUPLICADO
        // ========================================

        const documentoExiste = await Usuario.findOne({
            where: {
                numero_documento: numeroDocumentoLimpio
            }
        });

        if (
            documentoExiste &&
            documentoExiste.id_usuario !== Number(id)
        ) {
            return res.status(409).json({
                ok: false,
                mensaje: "El número de documento ya está registrado."
            });
        }

        // ========================================
        // ACTUALIZAR
        // ========================================

        await usuario.update({
            nombres: nombresLimpios,
            apellidos: apellidosLimpios,
            correo: correoLimpio,
            telefono: telefonoLimpio,
            tipo_documento: tipoDocumentoLimpio,
            numero_documento: numeroDocumentoLimpio,
            rol_id: rolId
        });

        return res.json({
            ok: true,
            mensaje: "Usuario actualizado correctamente."
        });

    } catch (error) {

        console.error("Error al actualizar usuario:", error);

        return res.status(500).json({
            ok: false,
            mensaje: "Error al actualizar el usuario."
        });
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