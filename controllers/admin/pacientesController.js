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