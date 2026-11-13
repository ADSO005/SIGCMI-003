import db from "../../config/db.js";
import bcrypt from "bcrypt";
import { Usuario, Paciente, Medico, Especialidad, Cita } from "../../models/index.js";

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
            rolFijo: req.rolFijo ?? null,
            modoEdicion: false,
            accion: "/admin/usuarios/nuevo",
            volver: "usuarios",
            valores: {},
            error: null
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

        if (!esPasswordSegura(password)) {
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
// CONTRASEÑA
// =====================================================

const esPasswordSegura = (password) =>
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

// =====================================================
// EDITAR USUARIO (ADMIN, MÉDICO O PACIENTE)
// Usa el mismo formulario del registro. Al cambiar el rol se crea
// o actualiza el perfil de paciente o médico correspondiente.
// Los perfiles anteriores no se borran para conservar el historial (citas, etc.).
// =====================================================

const TIPOS_DOCUMENTO = ["CC", "TI", "CE", "PP"];

const valoresDesdeRegistro = (usuario, paciente, medico) => ({
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    tipo_documento: usuario.tipo_documento,
    numero_documento: usuario.numero_documento,
    correo: usuario.correo,
    telefono: usuario.telefono || "",
    rol_id: String(usuario.rol_id),
    fecha_nacimiento: paciente?.fecha_nacimiento || "",
    tipo_sangre: paciente?.tipo_sangre || "",
    departamento: paciente?.departamento || "",
    ciudad: paciente?.ciudad || "",
    direccion: paciente?.direccion || "",
    alergias: paciente?.alergias || "",
    condiciones_medicas: paciente?.condiciones_medicas || "",
    especialidad_id: medico ? String(medico.especialidad_id) : "",
    cedula_profesional: medico?.cedula_profesional || "",
    anios_experiencia: medico?.anios_experiencia ?? ""
});

// Lista a la que se vuelve al terminar: usuarios, pacientes o medicos
const destinoVolver = (valor) =>
    ["usuarios", "pacientes", "medicos"].includes(valor) ? valor : "usuarios";

const renderFormularioEdicion = async (req, res, id, valores, { error = null, status = 200, volver = "usuarios" } = {}) => {
    const especialidades = await Especialidad.findAll({
        attributes: ["id_especialidad", "nombre"],
        order: [["nombre", "ASC"]]
    });

    return res.status(status).render("viewsAdmin/usuarios/registrar", {
        titulo: "Editar Usuario",
        usuarios: req.usuario,
        especialidades,
        rolFijo: null,
        modoEdicion: true,
        accion: `/admin/usuarios/${id}/editar`,
        volver,
        valores,
        error
    });
};

const guardarPerfil = async (Modelo, usuarioId, datos, transaction) => {
    const existente = await Modelo.findOne({
        where: { usuario_id: usuarioId },
        transaction
    });

    if (existente) {
        return existente.update(datos, { transaction });
    }

    return Modelo.create({ usuario_id: usuarioId, ...datos }, { transaction });
};

export const mostrarFormularioEditarUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(String(id))) {
            return res.status(400).send("El ID del usuario no es válido.");
        }

        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).send("Usuario no encontrado.");
        }

        const paciente = await Paciente.findOne({ where: { usuario_id: usuario.id_usuario } });
        const medico = await Medico.findOne({ where: { usuario_id: usuario.id_usuario } });

        return await renderFormularioEdicion(
            req,
            res,
            usuario.id_usuario,
            valoresDesdeRegistro(usuario, paciente, medico),
            { volver: destinoVolver(req.query.volver) }
        );
    } catch (error) {
        console.error("Error al mostrar el formulario de edición:", error);
        return res.status(500).send("Error interno al cargar el formulario de edición.");
    }
};

export const actualizarUsuarioCompleto = async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    if (!/^\d+$/.test(String(id))) {
        return res.status(400).send("El ID del usuario no es válido.");
    }

    // Vuelve a mostrar el formulario con los datos ingresados y el mensaje de error
    const volver = destinoVolver(body.volver);

    const fallar = (mensaje, status = 400) =>
        renderFormularioEdicion(req, res, id, { ...body }, { error: mensaje, status, volver });

    try {
        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).send("Usuario no encontrado.");
        }

        const rol = Number(body.rol_id);
        const nombres = texto(body.nombres);
        const apellidos = texto(body.apellidos);
        const tipoDocumento = texto(body.tipo_documento);
        const numeroDocumento = texto(body.numero_documento);
        const correo = texto(body.correo).toLowerCase();
        const telefono = texto(body.telefono);
        const password = typeof body.password === "string" ? body.password : "";
        const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
        const cambiarPassword = password !== "" || confirmPassword !== "";

        // 1. Rol y campos comunes
        if (!Object.values(ROLES).includes(rol)) {
            return fallar("Selecciona un rol válido.");
        }

        if (!nombres || !apellidos || !tipoDocumento || !numeroDocumento || !correo) {
            return fallar("Todos los campos obligatorios deben estar completos.");
        }

        if (!TIPOS_DOCUMENTO.includes(tipoDocumento)) {
            return fallar("El tipo de documento seleccionado no es válido.");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            return fallar("El correo electrónico no es válido.");
        }

        if (!/^[0-9A-Za-z-]+$/.test(numeroDocumento)) {
            return fallar("El número de documento contiene caracteres no permitidos.");
        }

        // 2. Contraseña (opcional en edición)
        if (cambiarPassword) {
            if (password !== confirmPassword) {
                return fallar("Las contraseñas no coinciden.");
            }

            if (!esPasswordSegura(password)) {
                return fallar("La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.");
            }
        }

        // 3. Datos del médico
        let datosMedico = null;

        if (rol === ROLES.MEDICO) {
            const especialidadId = Number(body.especialidad_id);
            const cedula = texto(body.cedula_profesional);
            const aniosExperiencia = body.anios_experiencia === "" || body.anios_experiencia === undefined
                ? null
                : Number(body.anios_experiencia);

            if (!Number.isInteger(especialidadId) || especialidadId <= 0) {
                return fallar("Selecciona una especialidad.");
            }

            if (!cedula) {
                return fallar("La tarjeta o cédula profesional es obligatoria.");
            }

            if (aniosExperiencia !== null && (!Number.isInteger(aniosExperiencia) || aniosExperiencia < 0 || aniosExperiencia > 60)) {
                return fallar("Los años de experiencia deben ser un número entre 0 y 60.");
            }

            if (!(await Especialidad.findByPk(especialidadId))) {
                return fallar("La especialidad seleccionada no existe.");
            }

            const medicoConCedula = await Medico.findOne({ where: { cedula_profesional: cedula } });

            if (medicoConCedula && medicoConCedula.usuario_id !== usuario.id_usuario) {
                return fallar("Ya existe un médico registrado con esa cédula profesional.", 409);
            }

            datosMedico = {
                especialidad_id: especialidadId,
                cedula_profesional: cedula,
                anios_experiencia: aniosExperiencia
            };
        }

        // 4. Duplicados (excluyendo al propio usuario)
        const correoExiste = await Usuario.findOne({ where: { correo } });

        if (correoExiste && correoExiste.id_usuario !== usuario.id_usuario) {
            return fallar("Ya existe un usuario registrado con ese correo.", 409);
        }

        const documentoExiste = await Usuario.findOne({ where: { numero_documento: numeroDocumento } });

        if (documentoExiste && documentoExiste.id_usuario !== usuario.id_usuario) {
            return fallar("Ya existe un usuario registrado con ese número de documento.", 409);
        }

        // 4b. Un perfil con citas no se elimina: la BD borraría sus citas en cascada
        const pacienteActual = await Paciente.findOne({ where: { usuario_id: usuario.id_usuario } });

        if (pacienteActual && rol !== ROLES.PACIENTE) {
            const citas = await Cita.count({ where: { paciente_id: pacienteActual.id_paciente } });

            if (citas > 0) {
                return fallar(`No se puede cambiar el rol: el paciente tiene ${citas} cita(s) en su historial y se perderían al eliminar su perfil.`, 409);
            }
        }

        const medicoActual = await Medico.findOne({ where: { usuario_id: usuario.id_usuario } });

        if (medicoActual && rol !== ROLES.MEDICO) {
            const citas = await Cita.count({ where: { medico_id: medicoActual.id_medico } });

            if (citas > 0) {
                return fallar(`No se puede cambiar el rol: el médico tiene ${citas} cita(s) en su historial y se perderían al eliminar su perfil.`, 409);
            }
        }

        // 5. Guardar usuario y perfil según el rol en una sola transacción
        const campos = {
            rol_id: rol,
            nombres,
            apellidos,
            correo,
            telefono: telefono || null,
            tipo_documento: tipoDocumento,
            numero_documento: numeroDocumento
        };

        if (cambiarPassword) {
            campos.password = await bcrypt.hash(password, 10);
        }

        const transaction = await db.transaction();

        try {
            await usuario.update(campos, { transaction });

            // Quitar los perfiles que ya no corresponden al nuevo rol (sin citas, verificado arriba)
            if (rol !== ROLES.PACIENTE) {
                await Paciente.destroy({ where: { usuario_id: usuario.id_usuario }, transaction });
            }

            if (rol !== ROLES.MEDICO) {
                await Medico.destroy({ where: { usuario_id: usuario.id_usuario }, transaction });
            }

            if (rol === ROLES.PACIENTE) {
                await guardarPerfil(Paciente, usuario.id_usuario, {
                    fecha_nacimiento: body.fecha_nacimiento || null,
                    tipo_sangre: body.tipo_sangre || null,
                    alergias: texto(body.alergias) || null,
                    condiciones_medicas: texto(body.condiciones_medicas) || null,
                    direccion: texto(body.direccion) || null,
                    departamento: texto(body.departamento) || null,
                    ciudad: texto(body.ciudad) || null
                }, transaction);
            }

            if (rol === ROLES.MEDICO) {
                await guardarPerfil(Medico, usuario.id_usuario, datosMedico, transaction);
            }

            await transaction.commit();

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

        return res.redirect(`/admin/${volver}`);

    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        return res.status(500).send("Error interno al actualizar el usuario.");
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
