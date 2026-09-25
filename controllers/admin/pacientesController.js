import db from "../../config/db.js";
import Usuario from "../../models/Usuario.js";
import Paciente from "../../models/Paciente.js";
import bcrypt from "bcrypt";

// =====================================================
// MOSTRAR FORMULARIO
// =====================================================

export const mostrarFormularioPaciente = (req, res) => {
    res.render("viewsAdmin/pacientes/registrar", {
        titulo: "Registrar Paciente",
        usuarios: req.usuario
    });
};

// =====================================================
// REGISTRAR PACIENTE
// =====================================================

export const registrarPaciente = async (req, res) => {

    const {
        nombres,
        apellidos,
        tipo_documento,
        numero_documento,
        correo,
        telefono,
        fecha_nacimiento,
        tipo_sangre,
        alergias,
        condiciones_medicas,
        direccion,
        departamento,
        ciudad,
        password,
        confirmPassword
    } = req.body;

    try {

        // =================================================
        // 1. VALIDACIONES BÁSICAS
        // =================================================

        if (
            !nombres ||
            !apellidos ||
            !tipo_documento ||
            !numero_documento ||
            !correo ||
            !password ||
            !confirmPassword
        ) {
            return res.status(400).send(
                "Todos los campos obligatorios deben estar completos."
            );
        }

        // =================================================
        // 2. VALIDAR CONTRASEÑAS
        // =================================================

        if (password !== confirmPassword) {
            return res.status(400).send(
                "Las contraseñas no coinciden."
            );
        }

        // =================================================
        // 3. VALIDAR CONTRASEÑA
        // =================================================

        const passwordValida =
            password.length >= 8 &&
            /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /[0-9]/.test(password) &&
            /[^A-Za-z0-9]/.test(password);

        if (!passwordValida) {
            return res.status(400).send(
                "La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial."
            );
        }

        // =================================================
        // 4. VALIDAR CORREO
        // =================================================

        const correoValido =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

        if (!correoValido) {
            return res.status(400).send(
                "El correo electrónico no es válido."
            );
        }

        // =================================================
        // 5. VALIDAR DOCUMENTO
        // =================================================

        const documentoValido =
            /^[0-9A-Za-z-]+$/.test(numero_documento);

        if (!documentoValido) {
            return res.status(400).send(
                "El número de documento contiene caracteres no permitidos."
            );
        }

        // =================================================
        // 6. VERIFICAR CORREO DUPLICADO
        // =================================================

        const usuarioCorreo = await Usuario.findOne({
            where: {
                correo: correo.trim().toLowerCase()
            }
        });

        if (usuarioCorreo) {
            return res.status(409).send(
                "Ya existe un usuario registrado con ese correo."
            );
        }

        // =================================================
        // 7. VERIFICAR DOCUMENTO DUPLICADO
        // =================================================

        const usuarioDocumento = await Usuario.findOne({
            where: {
                numero_documento: numero_documento.trim()
            }
        });

        if (usuarioDocumento) {
            return res.status(409).send(
                "Ya existe un usuario registrado con ese número de documento."
            );
        }

        // =================================================
        // 8. ENCRIPTAR CONTRASEÑA
        // =================================================

        const passwordHash = await bcrypt.hash(password, 10);

        // =================================================
        // 9. INICIAR TRANSACCIÓN
        // =================================================

        const transaction = await db.transaction();

        try {

            // =============================================
            // 10. CREAR USUARIO
            // =============================================

            const usuario = await Usuario.create(
                {
                    rol_id: 3,
                    nombres: nombres.trim(),
                    apellidos: apellidos.trim(),
                    correo: correo.trim().toLowerCase(),
                    telefono: telefono?.trim() || null,
                    tipo_documento: tipo_documento.trim(),
                    numero_documento: numero_documento.trim(),
                    password: passwordHash,
                    confirmado: true,
                    estado: true
                },
                {
                    transaction
                }
            );

            // =============================================
            // 11. CREAR PACIENTE
            // =============================================

            await Paciente.create(
                {
                    usuario_id: usuario.id_usuario,
                    fecha_nacimiento: fecha_nacimiento || null,
                    tipo_sangre: tipo_sangre || null,
                    alergias: alergias?.trim() || null,
                    condiciones_medicas:
                        condiciones_medicas?.trim() || null,
                    direccion: direccion?.trim() || null,
                    departamento: departamento?.trim() || null,
                    ciudad: ciudad?.trim() || null
                },
                {
                    transaction
                }
            );

            // =============================================
            // 12. CONFIRMAR TRANSACCIÓN
            // =============================================

            await transaction.commit();

        } catch (error) {

            // Si algo falla, deshacer todo
            await transaction.rollback();

            throw error;
        }

        // =================================================
        // 13. RESPUESTA EXITOSA
        // =================================================

        return res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>SIGCMI - Registro exitoso</title>

    <script src="https://cdn.tailwindcss.com"></script>

    <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
    >
</head>

<body class="bg-slate-100 min-h-screen flex items-center justify-center">

    <div class="w-full max-w-lg px-6">

        <div class="bg-white rounded-3xl shadow-xl p-8 text-center">

            <!-- Icono de éxito -->

            <div class="mx-auto mb-6 w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">

                <div class="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center">

                    <i class="fa-solid fa-check text-white text-2xl"></i>

                </div>

            </div>


            <!-- Título -->

            <h1 class="text-3xl font-bold text-slate-800 mb-3">

                ¡Paciente registrado!

            </h1>


            <!-- Mensaje -->

            <p class="text-slate-500 text-lg mb-8">

                El paciente ha sido registrado correctamente
                en el sistema SIGCMI.

            </p>


            <!-- Información -->

            <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-8">

                <p class="text-emerald-700 text-sm">

                    <i class="fa-solid fa-circle-check mr-2"></i>

                    El usuario y la información del paciente
                    fueron guardados correctamente.

                </p>

            </div>


            <!-- Botones -->

            <div class="flex flex-col sm:flex-row gap-3">

                <a
                    href="/admin/dashboard"
                    class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-5 rounded-xl transition"
                >

                    <i class="fa-solid fa-house mr-2"></i>

                    Ir al dashboard

                </a>


                <a
                    href="/admin/pacientes"
                    class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-5 rounded-xl transition"
                >

                    <i class="fa-solid fa-users mr-2"></i>

                    Ver pacientes

                </a>

            </div>

        </div>


        <!-- Logo -->

        <p class="text-center text-slate-400 text-sm mt-6">

            SIGCMI · Sistema Integral de Gestión de Citas Médicas

        </p>

    </div>

</body>
</html>
`);

    } catch (error) {

        console.error(
            "Error al registrar paciente:",
            error
        );

        return res.status(500).send(
            "Error interno al registrar el paciente."
        );
    }
};

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