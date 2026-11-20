import bcrypt from "bcrypt";
import { Op } from "sequelize";
import Medico from "../../models/Medico.js";
import Especialidad from "../../models/Especialidad.js";
import Horario from "../../models/Horario.js";
import Usuario from "../../models/Usuario.js";

const diasSemana = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

const obtenerFechaActualBogota = () => {
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Bogota",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());
    const fecha = Object.fromEntries(partes.map(parte => [parte.type, parte.value]));
    return `${fecha.year}-${fecha.month}-${fecha.day}`;
};

const buscarMedicoAutenticado = usuarioId => Medico.findOne({
    where: { usuario_id: usuarioId },
    attributes: ["id_medico", "especialidad_id", "cedula_profesional", "anios_experiencia"],
    include: [{ model: Especialidad, attributes: ["nombre"] }]
});

const datosUsuario = (usuario, formulario = {}) => ({
    nombres: formulario.nombres ?? usuario.nombres ?? "",
    apellidos: formulario.apellidos ?? usuario.apellidos ?? "",
    correo: formulario.correo ?? usuario.correo ?? "",
    telefono: formulario.telefono ?? usuario.telefono ?? "",
    tipoDocumento: usuario.tipo_documento || "No registrado",
    numeroDocumento: usuario.numero_documento || "No registrado"
});

const renderizarPerfil = async (req, res, opciones = {}) => {
    res.set("Cache-Control", "no-store");
    const medico = await buscarMedicoAutenticado(req.usuario.id_usuario);
    if (!medico) return res.status(404).send("No se encontró el perfil del médico.");

    const hoy = obtenerFechaActualBogota();
    const horariosActuales = await Horario.findAll({
        where: {
            medico_id: medico.id_medico,
            estado: "Aprobado",
            fecha_inicio: { [Op.lte]: hoy },
            fecha_fin: { [Op.gte]: hoy }
        },
        attributes: ["dia_semana", "hora_inicio", "hora_fin", "fecha_inicio", "fecha_fin"]
    });
    const horariosPorDia = horariosActuales.sort((a, b) => {
        const ordenDia = diasSemana.indexOf(a.dia_semana) - diasSemana.indexOf(b.dia_semana);
        return ordenDia || a.hora_inicio.localeCompare(b.hora_inicio);
    }).map(horario => ({
        dia: horario.dia_semana === "Miercoles" ? "Miércoles"
            : horario.dia_semana === "Sabado" ? "Sábado" : horario.dia_semana,
        horaInicio: horario.hora_inicio.slice(0, 5),
        horaFin: horario.hora_fin.slice(0, 5),
        fechaInicio: horario.fecha_inicio,
        fechaFin: horario.fecha_fin
    }));

    return res.status(opciones.status || 200).render("viewsMedico/perfil", {
        perfilActivo: true,
        modoEdicion: Boolean(opciones.modoEdicion),
        nombreMedico: [req.usuario.nombres, req.usuario.apellidos].filter(Boolean).join(" "),
        especialidadMedico: medico.Especialidad?.nombre?.trim() || "Especialidad no registrada",
        usuarioPerfil: datosUsuario(req.usuario, opciones.formulario),
        perfilProfesional: {
            especialidad: medico.Especialidad?.nombre || "Especialidad no registrada",
            cedulaProfesional: medico.cedula_profesional || "No registrada",
            aniosExperiencia: medico.anios_experiencia ?? null,
            horarios: horariosPorDia
        },
        mensajeExito: opciones.mensajeExito || null,
        errorPerfil: opciones.errorPerfil || null,
        errorPassword: opciones.errorPassword || null
    });
};

export const mostrarPerfilMedico = async (req, res) => {
    try {
        return await renderizarPerfil(req, res);
    } catch (error) {
        console.error("Error al cargar el perfil médico:", error?.name || "Error desconocido");
        return res.status(500).send("No fue posible cargar el perfil médico.");
    }
};

export const mostrarEdicionPerfilMedico = async (req, res) => {
    try {
        return await renderizarPerfil(req, res, { modoEdicion: true });
    } catch (error) {
        console.error("Error al cargar la edición del perfil médico:", error?.name || "Error desconocido");
        return res.status(500).send("No fue posible cargar la edición del perfil médico.");
    }
};

export const guardarPerfilMedico = async (req, res) => {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const formulario = {
        nombres: typeof body.nombres === "string" ? body.nombres.trim() : "",
        apellidos: typeof body.apellidos === "string" ? body.apellidos.trim() : "",
        correo: typeof body.correo === "string" ? body.correo.trim().toLowerCase() : "",
        telefono: typeof body.telefono === "string" ? body.telefono.trim() : "",
        passwordActual: typeof body.passwordActual === "string" ? body.passwordActual : ""
    };

    try {
        if (!formulario.nombres || formulario.nombres.length > 100
            || !formulario.apellidos || formulario.apellidos.length > 100) {
            return await renderizarPerfil(req, res, {
                status: 400, modoEdicion: true, formulario,
                errorPerfil: "Nombres y apellidos son obligatorios y deben tener máximo 100 caracteres."
            });
        }

        if (formulario.correo.length > 150
            || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo)) {
            return await renderizarPerfil(req, res, {
                status: 400, modoEdicion: true, formulario,
                errorPerfil: "Escribe un correo electrónico válido de máximo 150 caracteres."
            });
        }

        if (formulario.telefono.length > 20 || !/^\+?[0-9\s().-]*$/.test(formulario.telefono)) {
            return await renderizarPerfil(req, res, {
                status: 400, modoEdicion: true, formulario,
                errorPerfil: "El teléfono puede tener máximo 20 caracteres y solo incluir números, espacios y signos comunes."
            });
        }

        if (!formulario.passwordActual
            || !await bcrypt.compare(formulario.passwordActual, req.usuario.password)) {
            return await renderizarPerfil(req, res, {
                status: 401, modoEdicion: true, formulario,
                errorPerfil: "La contraseña actual no es correcta."
            });
        }

        const correoExistente = await Usuario.findOne({
            where: { correo: formulario.correo },
            attributes: ["id_usuario"]
        });
        if (correoExistente && correoExistente.id_usuario !== req.usuario.id_usuario) {
            return await renderizarPerfil(req, res, {
                status: 409, modoEdicion: true, formulario,
                errorPerfil: "Ese correo ya está registrado en otra cuenta."
            });
        }

        await req.usuario.update({
            nombres: formulario.nombres,
            apellidos: formulario.apellidos,
            correo: formulario.correo,
            telefono: formulario.telefono || null
        });

        return await renderizarPerfil(req, res, {
            modoEdicion: false,
            mensajeExito: "Los datos de tu perfil se actualizaron correctamente."
        });
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            return await renderizarPerfil(req, res, {
                status: 409, modoEdicion: true, formulario,
                errorPerfil: "Ese correo ya está registrado en otra cuenta."
            });
        }
        console.error("Error al guardar el perfil médico:", error?.name || "Error desconocido");
        return res.status(500).send("No fue posible guardar los cambios del perfil.");
    }
};

export const cambiarContrasenaMedico = async (req, res) => {
    try {
        const body = req.body && typeof req.body === "object" ? req.body : {};
        const passwordActual = typeof body.passwordActual === "string" ? body.passwordActual : "";
        const passwordNueva = typeof body.passwordNueva === "string" ? body.passwordNueva : "";
        const confirmarPassword = typeof body.confirmarPassword === "string" ? body.confirmarPassword : "";

        let errorPassword = "";
        if (!passwordActual || !passwordNueva || !confirmarPassword) {
            errorPassword = "Completa los tres campos para cambiar la contraseña.";
        } else if (!await bcrypt.compare(passwordActual, req.usuario.password)) {
            errorPassword = "La contraseña actual no es correcta.";
        } else if (passwordNueva !== confirmarPassword) {
            errorPassword = "La contraseña nueva y su confirmación no coinciden.";
        } else if (Buffer.byteLength(passwordNueva, "utf8") > 72) {
            errorPassword = "La contraseña es demasiado larga. Prueba con una más corta.";
        } else if (passwordNueva.length < 6
            || !/[A-Za-z]/.test(passwordNueva) || !/\d/.test(passwordNueva)
            || !/[^A-Za-z\d]/.test(passwordNueva)) {
            errorPassword = "Usa al menos 6 caracteres e incluye una letra, un número y un carácter especial.";
        } else if (await bcrypt.compare(passwordNueva, req.usuario.password)) {
            errorPassword = "La contraseña nueva debe ser diferente a la actual.";
        }

        if (errorPassword) {
            return await renderizarPerfil(req, res, { status: 400, errorPassword });
        }

        const passwordHash = await bcrypt.hash(passwordNueva, await bcrypt.genSalt(10));
        await req.usuario.update({ password: passwordHash });

        return await renderizarPerfil(req, res, {
            mensajeExito: "La contraseña se actualizó correctamente."
        });
    } catch (error) {
        console.error("Error al cambiar la contraseña médica:", error?.name || "Error desconocido");
        return res.status(500).send("No fue posible actualizar la contraseña.");
    }
};
