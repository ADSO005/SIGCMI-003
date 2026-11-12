import db from "../../config/db.js";
import bcrypt from "bcrypt";
import { Usuario, Paciente, Medico, Especialidad } from "../../models/index.js";

// =====================================================
// CONSTANTES
// =====================================================

export const ROLES = {
    ADMIN: 1,
    MEDICO: 2,
    PACIENTE: 3
};

const NOMBRES_ROL = {
    [ROLES.ADMIN]: "Administrador",
    [ROLES.MEDICO]: "Médico",
    [ROLES.PACIENTE]: "Paciente"
};

const texto = (valor) => typeof valor === "string" ? valor.trim() : "";

// Fija el rol de la solicitud. Lo usan las rutas heredadas de /pacientes/nuevo.
export const fijarRol = (rol) => (req, res, next) => {
    req.rolFijo = rol;
    next();
};

// =====================================================
// MOSTRAR FORMULARIO
// =====================================================

export const mostrarFormularioUsuario = async (req, res) => {
    try {
        const especialidades = await Especialidad.findAll({
            attributes: ["id_especialidad", "nombre"],
            order: [["nombre", "ASC"]]
        });

        return res.render("viewsAdmin/usuarios/registrar", {
            titulo: "Registrar Usuario",
            usuarios: req.usuario,
            especialidades,
            rolFijo: req.rolFijo ?? null
        });
    } catch (error) {
        console.error("Error al mostrar el formulario de usuario:", error);
        return res.status(500).send("Error interno al cargar el formulario.");
    }
};

// =====================================================
// REGISTRAR USUARIO (ADMIN, MÉDICO O PACIENTE)
// =====================================================

export const registrarUsuario = async (req, res) => {

    const body = req.body;

    const rol = req.rolFijo ?? Number(body.rol_id);

    const nombres = texto(body.nombres);
    const apellidos = texto(body.apellidos);
    const tipoDocumento = texto(body.tipo_documento);
    const numeroDocumento = texto(body.numero_documento);
    const correo = texto(body.correo).toLowerCase();
    const telefono = texto(body.telefono);
    const { password, confirmPassword } = body;

    try {

        // 1. Rol válido
        if (!Object.values(ROLES).includes(rol)) {
            return res.status(400).send("Selecciona un rol válido.");
        }

        // 2. Campos comunes obligatorios
        if (!nombres || !apellidos || !tipoDocumento || !numeroDocumento || !correo || !password || !confirmPassword) {
            return res.status(400).send("Todos los campos obligatorios deben estar completos.");
        }

        // 3. Contraseñas
        if (password !== confirmPassword) {
            return res.status(400).send("Las contraseñas no coinciden.");
        }

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

        // 4. Correo y documento
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            return res.status(400).send("El correo electrónico no es válido.");
        }

        if (!/^[0-9A-Za-z-]+$/.test(numeroDocumento)) {
            return res.status(400).send("El número de documento contiene caracteres no permitidos.");
        }

        // 5. Datos específicos del médico
        let datosMedico = null;

        if (rol === ROLES.MEDICO) {
            const especialidadId = Number(body.especialidad_id);
            const cedula = texto(body.cedula_profesional);
            const aniosExperiencia = body.anios_experiencia === "" || body.anios_experiencia === undefined
                ? null
                : Number(body.anios_experiencia);

            if (!Number.isInteger(especialidadId) || especialidadId <= 0) {
                return res.status(400).send("Selecciona una especialidad.");
            }

            if (!cedula) {
                return res.status(400).send("La tarjeta o cédula profesional es obligatoria.");
            }

            if (aniosExperiencia !== null && (!Number.isInteger(aniosExperiencia) || aniosExperiencia < 0 || aniosExperiencia > 60)) {
                return res.status(400).send("Los años de experiencia deben ser un número entre 0 y 60.");
            }

            const especialidad = await Especialidad.findByPk(especialidadId);
            if (!especialidad) {
                return res.status(400).send("La especialidad seleccionada no existe.");
            }

            if (await Medico.findOne({ where: { cedula_profesional: cedula } })) {
                return res.status(409).send("Ya existe un médico registrado con esa cédula profesional.");
            }

            datosMedico = {
                especialidad_id: especialidadId,
                cedula_profesional: cedula,
                anios_experiencia: aniosExperiencia
            };
        }

        // 6. Duplicados
        if (await Usuario.findOne({ where: { correo } })) {
            return res.status(409).send("Ya existe un usuario registrado con ese correo.");
        }

        if (await Usuario.findOne({ where: { numero_documento: numeroDocumento } })) {
            return res.status(409).send("Ya existe un usuario registrado con ese número de documento.");
        }

        // 7. Crear usuario y perfil en una sola transacción
        const passwordHash = await bcrypt.hash(password, 10);
        const transaction = await db.transaction();

        try {
            const usuario = await Usuario.create(
                {
                    rol_id: rol,
                    nombres,
                    apellidos,
                    correo,
                    telefono: telefono || null,
                    tipo_documento: tipoDocumento,
                    numero_documento: numeroDocumento,
                    password: passwordHash,
                    confirmado: true,
                    estado: true
                },
                { transaction }
            );

            if (rol === ROLES.PACIENTE) {
                await Paciente.create(
                    {
                        usuario_id: usuario.id_usuario,
                        fecha_nacimiento: body.fecha_nacimiento || null,
                        tipo_sangre: body.tipo_sangre || null,
                        alergias: texto(body.alergias) || null,
                        condiciones_medicas: texto(body.condiciones_medicas) || null,
                        direccion: texto(body.direccion) || null,
                        departamento: texto(body.departamento) || null,
                        ciudad: texto(body.ciudad) || null
                    },
                    { transaction }
                );
            }

            if (rol === ROLES.MEDICO) {
                await Medico.create(
                    {
                        usuario_id: usuario.id_usuario,
                        ...datosMedico
                    },
                    { transaction }
                );
            }

            await transaction.commit();

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

        // 8. Respuesta exitosa
        return res.send(paginaExito(rol));

    } catch (error) {
        console.error("Error al registrar usuario:", error);
        return res.status(500).send("Error interno al registrar el usuario.");
    }
};

// =====================================================
// PÁGINA DE ÉXITO
// =====================================================

const paginaExito = (rol) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SIGCMI - Registro exitoso</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
</head>
<body class="bg-slate-100 min-h-screen flex items-center justify-center">
    <div class="w-full max-w-lg px-6">
        <div class="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div class="mx-auto mb-6 w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <div class="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center">
                    <i class="fa-solid fa-check text-white text-2xl"></i>
                </div>
            </div>
            <h1 class="text-3xl font-bold text-slate-800 mb-3">¡${NOMBRES_ROL[rol]} registrado!</h1>
            <p class="text-slate-500 text-lg mb-8">
                El usuario fue registrado correctamente en el sistema SIGCMI.
            </p>
            <div class="flex flex-col sm:flex-row gap-3">
                <a href="/admin/dashboard" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-5 rounded-xl transition">
                    <i class="fa-solid fa-house mr-2"></i>Ir al dashboard
                </a>
                <a href="/admin/usuarios" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-5 rounded-xl transition">
                    <i class="fa-solid fa-users mr-2"></i>Ver usuarios
                </a>
            </div>
        </div>
        <p class="text-center text-slate-400 text-sm mt-6">SIGCMI · Sistema Integral de Gestión de Citas Médicas</p>
    </div>
</body>
</html>
`;
