import db from "../../config/db.js";
import Usuario from "../../models/Usuario.js";
import Paciente from "../../models/Paciente.js";

// =====================================================
// LISTAR PACIENTES
// =====================================================

export const listarPacientes = async (req, res) => {
    try {
        const pacientes = await Paciente.findAll({
            include: [
                {
                    model: Usuario,
                    attributes: [
                        "id_usuario",
                        "nombres",
                        "apellidos",
                        "correo",
                        "telefono",
                        "tipo_documento",
                        "numero_documento",
                        "estado",
                        "fecha_registro"
                    ]
                }
            ],
            order: [
                ["id_paciente", "DESC"]
            ]
        });

        const pacientesLista = pacientes.map((paciente) => ({
            id: paciente.id_paciente,

            usuarioId: paciente.usuario_id,

            nombre: paciente.Usuario
                ? `${paciente.Usuario.nombres} ${paciente.Usuario.apellidos}`
                : "Sin nombre",

            correo: paciente.Usuario?.correo || "",

            telefono: paciente.Usuario?.telefono || "",

            tipoDocumento:
                paciente.Usuario?.tipo_documento || "",

            documento:
                paciente.Usuario?.numero_documento || "",

            fechaNacimiento:
                paciente.fecha_nacimiento || "",

            tipoSangre:
                paciente.tipo_sangre || "",

            alergias:
                paciente.alergias || "",

            condicionesMedicas:
                paciente.condiciones_medicas || "",

            direccion:
                paciente.direccion || "",

            departamento:
                paciente.departamento || "",

            ciudad:
                paciente.ciudad || "",

            estado:
                paciente.Usuario?.estado ?? false,

            fechaRegistro:
                paciente.Usuario?.fecha_registro || null
        }));

        const totalPacientes = pacientesLista.length;

        const pacientesActivos = pacientesLista.filter(
            (paciente) => paciente.estado === true
        ).length;

        const pacientesInactivos =
            pacientesLista.filter(
                (paciente) => paciente.estado === false
            ).length;

        res.render("viewsAdmin/pacientes/index", {
            usuarios: req.usuario,
            pacientesLista,
            totalPacientes,
            pacientesActivos,
            pacientesInactivos
        });

    } catch (error) {

        console.error(
            "Error al listar pacientes:",
            error
        );

        res.status(500).send(
            "Error al cargar la gestión de pacientes."
        );
    }
};

// =====================================================
// OBTENER PACIENTE
// =====================================================

export const obtenerPaciente = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({
                ok: false,
                mensaje: "El ID del paciente no es válido."
            });
        }

        const paciente = await Paciente.findByPk(id, {
            include: [
                {
                    model: Usuario,
                    attributes: [
                        "id_usuario",
                        "nombres",
                        "apellidos",
                        "correo",
                        "telefono",
                        "tipo_documento",
                        "numero_documento",
                        "estado",
                        "fecha_registro"
                    ]
                }
            ]
        });

        if (!paciente) {
            return res.status(404).json({
                ok: false,
                mensaje: "Paciente no encontrado."
            });
        }

        return res.json({
            ok: true,
            paciente
        });

    } catch (error) {
        console.error(
            "Error al obtener paciente:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje: "Error al obtener el paciente."
        });
    }
};

// =====================================================
// ACTUALIZAR PACIENTE
// =====================================================

export const actualizarPaciente = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nombres,
            apellidos,
            correo,
            telefono,
            tipo_documento,
            numero_documento,
            fecha_nacimiento,
            tipo_sangre,
            alergias,
            condiciones_medicas,
            direccion,
            departamento,
            ciudad
        } = req.body;

        // ========================================
        // VALIDAR ID
        // ========================================

        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({
                ok: false,
                mensaje: "El ID del paciente no es válido."
            });
        }

        // ========================================
        // CAMPOS OBLIGATORIOS
        // ========================================

        if (
            !nombres ||
            !apellidos ||
            !correo ||
            !telefono ||
            !tipo_documento ||
            !numero_documento
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "Completa todos los campos obligatorios."
            });
        }

        // ========================================
        // BUSCAR PACIENTE
        // ========================================

        const paciente = await Paciente.findByPk(id);

        if (!paciente) {
            return res.status(404).json({
                ok: false,
                mensaje: "Paciente no encontrado."
            });
        }

        const usuario = await Usuario.findByPk(
            paciente.usuario_id
        );

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                mensaje: "El usuario asociado al paciente no existe."
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
        const numeroDocumentoLimpio =
            numero_documento.trim();

        // ========================================
        // VALIDAR NOMBRES
        // ========================================

        const nombreRegex =
            /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;

        if (
            nombresLimpios.length < 2 ||
            !nombreRegex.test(nombresLimpios)
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "Los nombres solo pueden contener letras y espacios y deben tener mínimo 2 caracteres."
            });
        }

        // ========================================
        // VALIDAR APELLIDOS
        // ========================================

        if (
            apellidosLimpios.length < 2 ||
            !nombreRegex.test(apellidosLimpios)
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "Los apellidos solo pueden contener letras y espacios y deben tener mínimo 2 caracteres."
            });
        }

        // ========================================
        // VALIDAR CORREO
        // ========================================

        const correoRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!correoRegex.test(correoLimpio)) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El correo electrónico no es válido."
            });
        }

        // ========================================
        // VALIDAR TELÉFONO
        // ========================================

        const telefonoRegex = /^\d{7,10}$/;

        if (!telefonoRegex.test(telefonoLimpio)) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El teléfono debe contener entre 7 y 10 números."
            });
        }

        // ========================================
        // VALIDAR TIPO DOCUMENTO
        // ========================================

        const tiposDocumentoPermitidos = [
            "CC",
            "TI",
            "CE",
            "Pasaporte"
        ];

        if (
            !tiposDocumentoPermitidos.includes(
                tipoDocumentoLimpio
            )
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El tipo de documento seleccionado no es válido."
            });
        }

        // ========================================
        // VALIDAR DOCUMENTO
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
        // CORREO DUPLICADO
        // ========================================

        const correoExiste = await Usuario.findOne({
            where: {
                correo: correoLimpio
            }
        });

        if (
            correoExiste &&
            correoExiste.id_usuario !== usuario.id_usuario
        ) {
            return res.status(409).json({
                ok: false,
                mensaje:
                    "El correo electrónico ya está registrado."
            });
        }

        // ========================================
        // DOCUMENTO DUPLICADO
        // ========================================

        const documentoExiste =
            await Usuario.findOne({
                where: {
                    numero_documento:
                        numeroDocumentoLimpio
                }
            });

        if (
            documentoExiste &&
            documentoExiste.id_usuario !== usuario.id_usuario
        ) {
            return res.status(409).json({
                ok: false,
                mensaje:
                    "El número de documento ya está registrado."
            });
        }

        // ========================================
        // ACTUALIZAR USUARIO Y PACIENTE
        // ========================================

        const transaction =
            await db.transaction();

        try {

            await usuario.update(
                {
                    nombres: nombresLimpios,
                    apellidos: apellidosLimpios,
                    correo: correoLimpio,
                    telefono: telefonoLimpio,
                    tipo_documento:
                        tipoDocumentoLimpio,
                    numero_documento:
                        numeroDocumentoLimpio
                },
                {
                    transaction
                }
            );

            await paciente.update(
                {
                    fecha_nacimiento:
                        fecha_nacimiento || null,

                    tipo_sangre:
                        tipo_sangre || null,

                    alergias:
                        alergias?.trim() || null,

                    condiciones_medicas:
                        condiciones_medicas?.trim() || null,

                    direccion:
                        direccion?.trim() || null,

                    departamento:
                        departamento?.trim() || null,

                    ciudad:
                        ciudad?.trim() || null
                },
                {
                    transaction
                }
            );

            await transaction.commit();

        } catch (error) {

            await transaction.rollback();

            throw error;
        }

        return res.json({
            ok: true,
            mensaje:
                "Paciente actualizado correctamente."
        });

    } catch (error) {

        console.error(
            "Error al actualizar paciente:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "Error al actualizar el paciente."
        });
    }
};