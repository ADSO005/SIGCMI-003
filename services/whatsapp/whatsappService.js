import Usuario from "../../models/Usuario.js";
import Paciente from "../../models/Paciente.js";
import Especialidad from "../../models/Especialidad.js";
import Medico from "../../models/Medico.js";

const sesiones = new Map();

export const procesarMensaje = async (telefono, mensaje) => {

    const mensajeNormalizado = mensaje
        .trim()
        .toLowerCase();

    let sesion = sesiones.get(telefono);

    if (!sesion) {
        sesion = {
            estado: "INICIO",
            pacienteId: null,
            usuarioId: null,
            documento: null
        };

        sesiones.set(telefono, sesion);
    }

    // ==========================================
    // INICIO
    // ==========================================

    if (
        sesion.estado === "INICIO" &&
        (
            mensajeNormalizado.includes("hola") ||
            mensajeNormalizado.includes("buenos dias") ||
            mensajeNormalizado.includes("buenos días") ||
            mensajeNormalizado.includes("buenas tardes") ||
            mensajeNormalizado.includes("buenas noches")
        )
    ) {
        return {
            mensaje: `¡Hola! 👋 Bienvenido al asistente virtual de SIGCMI.

¿En qué puedo ayudarte?

1️⃣ Solicitar una cita
2️⃣ Consultar mis citas
3️⃣ Cancelar una cita
4️⃣ Reprogramar una cita`
        };
    }

    // ==========================================
    // SOLICITAR CITA
    // ==========================================

    if (
        sesion.estado === "INICIO" &&
        (
            mensajeNormalizado === "1" ||
            mensajeNormalizado.includes("quiero una cita") ||
            mensajeNormalizado.includes("solicitar una cita")
        )
    ) {
        sesion.estado = "ESPERANDO_DOCUMENTO";

        return {
            mensaje: `Claro que sí. 📅

Para solicitar una cita necesito validar tu identidad.

Por favor, ingresa tu número de documento.`
        };
    }

    // ==========================================
    // VALIDAR DOCUMENTO
    // ==========================================

    if (sesion.estado === "ESPERANDO_DOCUMENTO") {

        const documento = mensaje.trim();

        if (!/^\d+$/.test(documento)) {
            return {
                mensaje: `⚠️ El número de documento debe contener solamente números.

Por favor, ingresa nuevamente tu documento.`
            };
        }

        try {

            const usuario = await Usuario.findOne({
                where: {
                    numero_documento: documento,
                    rol_id: 3,
                    estado: true
                },
                include: [
                    {
                        model: Paciente,
                        required: true
                    }
                ]
            });

            // ==========================================
            // PACIENTE NO ENCONTRADO
            // ==========================================

            if (!usuario) {

                sesion.estado = "INICIO";

                return {
                    mensaje: `❌ No encontramos un paciente activo asociado al documento ingresado.

Verifica que el número sea correcto.

Si consideras que tus datos deberían estar registrados en SIGCMI, comunícate con la institución.`
                };
            }

            // ==========================================
            // PACIENTE ENCONTRADO
            // ==========================================

            sesion.documento = documento;
            sesion.usuarioId = usuario.id_usuario;
            sesion.pacienteId = usuario.Paciente.id_paciente;
            sesion.estado = "PACIENTE_VALIDADO";

            return {
                mensaje: `✅ Identidad encontrada correctamente.

Hola ${usuario.nombres} ${usuario.apellidos} 👋

Tu información ya se encuentra registrada en SIGCMI.

No necesitas ingresar al portal web para solicitar tu cita.

¿Qué deseas hacer?

1️⃣ Solicitar una cita
2️⃣ Consultar mis citas
3️⃣ Cancelar una cita
4️⃣ Reprogramar una cita`
            };

        } catch (error) {

            console.error(
                "❌ Error validando paciente:",
                error
            );

            return {
                mensaje: "Ocurrió un error al validar tu información. Inténtalo nuevamente."
            };
        }
    }

    // ==========================================
    // PACIENTE VALIDADO
    // ==========================================

    if (sesion.estado === "PACIENTE_VALIDADO") {

        if (mensajeNormalizado === "1") {

            try {

                const especialidades = await Especialidad.findAll({
                    order: [["nombre", "ASC"]]
                });

                if (especialidades.length === 0) {
                    return {
                        mensaje: `❌ En este momento no hay especialidades disponibles.`
                    };
                }

                const listaEspecialidades = especialidades
                    .map((especialidad, index) => {
                        return `${index + 1}️⃣ ${especialidad.nombre}`;
                    })
                    .join("\n");

                sesion.estado = "ESPERANDO_ESPECIALIDAD";
                sesion.especialidades = especialidades;

                return {
                    mensaje: `Perfecto. 📅

Selecciona la especialidad que necesitas:

${listaEspecialidades}

Escribe el número de la especialidad.`
                };

            } catch (error) {

                console.error(
                    "❌ Error obteniendo especialidades:",
                    error
                );

                return {
                    mensaje: "❌ Ocurrió un error consultando las especialidades."
                };
            }
        }

        if (mensajeNormalizado === "2") {
            return {
                mensaje: `📋 Consulta de citas.

Esta funcionalidad la conectaremos con tus citas registradas en SIGCMI.`
            };
        }

        if (mensajeNormalizado === "3") {
            return {
                mensaje: `❌ Cancelación de citas.

Esta funcionalidad la conectaremos con tus citas registradas en SIGCMI.`
            };
        }

        if (mensajeNormalizado === "4") {
            return {
                mensaje: `🔄 Reprogramación de citas.

Esta funcionalidad la conectaremos con tus citas registradas en SIGCMI.`
            };
        }

        return {
            mensaje: `Por favor, selecciona una opción:

1️⃣ Solicitar una cita
2️⃣ Consultar mis citas
3️⃣ Cancelar una cita
4️⃣ Reprogramar una cita`
        };
    }

    // ==========================================
    // SOLICITANDO CITA 
    // ==========================================

    if (sesion.estado === "SOLICITANDO_CITA") {

        try {

            const especialidades = await Especialidad.findAll({
                order: [["nombre", "ASC"]]
            });

            if (especialidades.length === 0) {
                return {
                    mensaje: "❌ En este momento no hay especialidades disponibles."
                };
            }

            const listaEspecialidades = especialidades
                .map((especialidad, index) => {
                    return `${index + 1}️⃣ ${especialidad.nombre}`;
                })
                .join("\n");

            sesion.estado = "ESPERANDO_ESPECIALIDAD";
            sesion.especialidades = especialidades;

            return {
                mensaje: `Perfecto. 📅

Selecciona la especialidad que necesitas:

${listaEspecialidades}

Escribe el número de la especialidad.`
            };

        } catch (error) {

            console.error(
                "❌ Error obteniendo especialidades:",
                error
            );

            return {
                mensaje: "❌ Ocurrió un error consultando las especialidades."
            };
        }
    }


    // ==========================================
    // SELECCION ESPECIALIDAD
    // ==========================================


    if (sesion.estado === "ESPERANDO_ESPECIALIDAD") {

        const opcion = parseInt(mensajeNormalizado);

        if (
            isNaN(opcion) ||
            opcion < 1 ||
            opcion > sesion.especialidades.length
        ) {
            return {
                mensaje: `⚠️ Opción no válida.

Selecciona una de las especialidades disponibles.`
            };
        }

        const especialidadSeleccionada =
            sesion.especialidades[opcion - 1];

        sesion.especialidadId =
            especialidadSeleccionada.id_especialidad;

        sesion.especialidadNombre =
            especialidadSeleccionada.nombre;

        try {

            const medicos = await Medico.findAll({
                where: {
                    especialidad_id: sesion.especialidadId
                },
                include: [
                    {
                        model: Usuario,
                        attributes: ["nombres", "apellidos"],
                        required: true
                    }
                ]
            });

            if (medicos.length === 0) {
                return {
                    mensaje: `❌ No hay médicos disponibles para ${sesion.especialidadNombre} en este momento.

Puedes seleccionar otra especialidad.`
                };
            }

            const listaMedicos = medicos
                .map((medico, index) => {
                    return `${index + 1}️⃣ Dr. ${medico.Usuario.nombres} ${medico.Usuario.apellidos}`;
                })
                .join("\n");

            sesion.medicos = medicos;
            sesion.estado = "ESPERANDO_MEDICO";

            return {
                mensaje: `✅ Especialidad seleccionada:

🏥 ${sesion.especialidadNombre}

Ahora selecciona el médico:

${listaMedicos}

Escribe el número del médico.`
            };

        } catch (error) {

            console.error(
                "❌ Error obteniendo médicos:",
                error
            );

            return {
                mensaje: "❌ Ocurrió un error consultando los médicos."
            };
        }
    }
    // ==========================================
    // MENSAJE NO RECONOCIDO
    // ==========================================

    return {
        mensaje: `No estoy seguro de haber entendido tu solicitud. 🤖

Escribe "Hola" para comenzar.`
    };
};