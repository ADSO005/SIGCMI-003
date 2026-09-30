import Usuario from "../../models/Usuario.js";
import Paciente from "../../models/Paciente.js";
import Especialidad from "../../models/Especialidad.js";
import Medico from "../../models/Medico.js";
import Horario from "../../models/Horario.js";
import Cita from "../../models/Cita.js";

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
    // SELECCION MEDICO
    // ==========================================

    if (sesion.estado === "ESPERANDO_MEDICO") {

        const opcion = parseInt(mensajeNormalizado);

        if (
            isNaN(opcion) ||
            opcion < 1 ||
            opcion > sesion.medicos.length
        ) {
            return {
                mensaje: `⚠️ Opción no válida.

Por favor, selecciona uno de los médicos disponibles.`
            };
        }

        const medicoSeleccionado = sesion.medicos[opcion - 1];

        sesion.medicoId = medicoSeleccionado.id_medico;

        sesion.medicoNombre =
            `${medicoSeleccionado.Usuario.nombres} ${medicoSeleccionado.Usuario.apellidos}`;

        sesion.estado = "ESPERANDO_FECHA";

        return {
            mensaje: `✅ Médico seleccionado:

👨‍⚕️ Dr. ${sesion.medicoNombre}

Ahora ingresa la fecha en la que deseas tu cita.

📅 Formato:

DD/MM/AAAA

Ejemplo:
30/09/2026`
        };
    }


    // ==========================================
    // ESPERANDO FECHA
    // ==========================================

    if (sesion.estado === "ESPERANDO_MEDICO") {

        const opcion = parseInt(mensajeNormalizado);

        if (
            isNaN(opcion) ||
            opcion < 1 ||
            opcion > sesion.medicos.length
        ) {
            return {
                mensaje: `⚠️ Opción no válida.

Por favor, selecciona uno de los médicos disponibles.`
            };
        }

        const medicoSeleccionado = sesion.medicos[opcion - 1];

        sesion.medicoId = medicoSeleccionado.id_medico;

        sesion.medicoNombre =
            `${medicoSeleccionado.Usuario.nombres} ${medicoSeleccionado.Usuario.apellidos}`;

        sesion.estado = "ESPERANDO_FECHA";

        return {
            mensaje: `✅ Médico seleccionado:

👨‍⚕️ Dr. ${sesion.medicoNombre}

Ahora ingresa la fecha en la que deseas tu cita.

📅 Formato:

DD/MM/AAAA

Ejemplo:
30/09/2026`
        };
    }


    // ==========================================
    // ESPERANDO FECHA
    // ==========================================

    if (sesion.estado === "ESPERANDO_FECHA") {

        const fechaIngresada = mensaje.trim();

        const formatoFecha = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const resultado = fechaIngresada.match(formatoFecha);

        if (!resultado) {
            return {
                mensaje: `⚠️ El formato de fecha no es válido.

Por favor utiliza:

DD/MM/AAAA

Ejemplo:
30/09/2026`
            };
        }

        const dia = parseInt(resultado[1]);
        const mes = parseInt(resultado[2]);
        const anio = parseInt(resultado[3]);

        const fecha = new Date(anio, mes - 1, dia);

        if (
            fecha.getFullYear() !== anio ||
            fecha.getMonth() !== mes - 1 ||
            fecha.getDate() !== dia
        ) {
            return {
                mensaje: `⚠️ La fecha ingresada no existe.

Por favor ingresa una fecha válida.`
            };
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (fecha < hoy) {
            return {
                mensaje: `⚠️ No puedes seleccionar una fecha anterior a hoy.

Por favor ingresa una fecha futura.`
            };
        }

        const fechaSQL =
            `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

        sesion.fecha = fechaSQL;

        try {

            const fechaConsulta =
                new Date(`${sesion.fecha}T00:00:00`);

            const diasSemana = [
                "Domingo",
                "Lunes",
                "Martes",
                "Miercoles",
                "Jueves",
                "Viernes",
                "Sabado"
            ];

            const diaSemana = diasSemana[fechaConsulta.getDay()];

            // ==========================================
            // BUSCAR HORARIO DEL MÉDICO
            // ==========================================

            const horario = await Horario.findOne({
                where: {
                    medico_id: sesion.medicoId,
                    dia_semana: diaSemana,
                    estado: "Aprobado"
                }
            });

            if (!horario) {

                sesion.estado = "ESPERANDO_FECHA";

                return {
                    mensaje: `❌ El Dr. ${sesion.medicoNombre} no tiene horario de atención para el ${diaSemana}.

Por favor selecciona otra fecha.`
                };
            }

            // ==========================================
            // VALIDAR VIGENCIA DEL HORARIO
            // ==========================================

            if (
                horario.fecha_inicio &&
                sesion.fecha < horario.fecha_inicio
            ) {
                sesion.estado = "ESPERANDO_FECHA";

                return {
                    mensaje: `❌ El horario del médico todavía no está vigente para esa fecha.

Por favor selecciona otra fecha.`
                };
            }

            if (
                horario.fecha_fin &&
                sesion.fecha > horario.fecha_fin
            ) {
                sesion.estado = "ESPERANDO_FECHA";

                return {
                    mensaje: `❌ El horario del médico ya no está vigente para esa fecha.

Por favor selecciona otra fecha.`
                };
            }

            // ==========================================
            // BUSCAR CITAS OCUPADAS
            // ==========================================

            const citasExistentes = await Cita.findAll({
                where: {
                    medico_id: sesion.medicoId,
                    fecha: sesion.fecha
                }
            });

            const horasOcupadas = citasExistentes.map(
                cita => cita.hora.substring(0, 5)
            );

            // ==========================================
            // GENERAR HORARIOS DE 30 MINUTOS
            // ==========================================

            const horariosDisponibles = [];

            let horaActual = horario.hora_inicio;
            const horaFin = horario.hora_fin;

            while (horaActual < horaFin) {

                const horaFormateada =
                    horaActual.substring(0, 5);

                if (!horasOcupadas.includes(horaFormateada)) {
                    horariosDisponibles.push(horaFormateada);
                }

                const [horas, minutos] = horaActual
                    .split(":")
                    .map(Number);

                const minutosTotales =
                    horas * 60 + minutos + 30;

                const nuevaHora =
                    Math.floor(minutosTotales / 60);

                const nuevosMinutos =
                    minutosTotales % 60;

                horaActual =
                    `${String(nuevaHora).padStart(2, "0")}:${String(nuevosMinutos).padStart(2, "0")}:00`;
            }

            // ==========================================
            // NO HAY HORARIOS
            // ==========================================

            if (horariosDisponibles.length === 0) {

                sesion.estado = "ESPERANDO_FECHA";

                return {
                    mensaje: `❌ No hay horarios disponibles para el ${fechaIngresada}.

Por favor selecciona otra fecha.`
                };
            }

            // ==========================================
            // MOSTRAR HORARIOS
            // ==========================================

            const listaHorarios = horariosDisponibles
                .map((hora) => {
                    return `🕐 ${hora}`;
                })
                .join("\n");

            sesion.horariosDisponibles = horariosDisponibles;
            sesion.estado = "ESPERANDO_HORA";

            return {
                mensaje: `📅 Fecha: ${fechaIngresada}

👨‍⚕️ Dr. ${sesion.medicoNombre}

Horarios disponibles:

${listaHorarios}

Escribe la hora que prefieres.

Ejemplo: 08:30`
            };

        } catch (error) {

            console.error(
                "❌ Error consultando horarios:",
                error
            );

            return {
                mensaje: "❌ Ocurrió un error consultando los horarios disponibles."
            };
        }
    }

    // ==========================================
    // ESPERANDO HORA
    // ==========================================

    if (sesion.estado === "ESPERANDO_HORA") {

        const horaIngresada = mensaje.trim();

        // ==========================================
        // VALIDAR FORMATO
        // ==========================================

        const formatoHora = /^([01]\d|2[0-3]):([0-5]\d)$/;

        if (!formatoHora.test(horaIngresada)) {

            return {
                mensaje: `⚠️ El formato de hora no es válido.

Por favor utiliza:

HH:MM

Ejemplo:
08:30`
            };
        }

        // ==========================================
        // VERIFICAR QUE LA HORA ESTÉ DISPONIBLE
        // ==========================================

        if (!sesion.horariosDisponibles.includes(horaIngresada)) {

            return {
                mensaje: `❌ La hora ${horaIngresada} no está disponible.

Por favor selecciona una de las horas disponibles que te mostré anteriormente.`
            };
        }

        // ==========================================
        // GUARDAR HORA
        // ==========================================

        sesion.hora = horaIngresada;

        sesion.estado = "CONFIRMANDO_CITA";

        // ==========================================
        // MOSTRAR RESUMEN
        // ==========================================

        return {
            mensaje: `📋 Resumen de tu cita

🏥 ${sesion.especialidadNombre}
👨‍⚕️ Dr. ${sesion.medicoNombre}
📅 ${sesion.fecha.split("-").reverse().join("/")}
🕐 ${sesion.hora}

¿Deseas confirmar esta cita?

1️⃣ Sí, confirmar
2️⃣ No, cancelar`
        };
    }


    // ==========================================
    // CONFIRMANDO CITA
    // ==========================================

    if (sesion.estado === "CONFIRMANDO_CITA") {

        // ==========================================
        // CONFIRMAR
        // ==========================================

        if (mensajeNormalizado === "1") {

            // Verificar nuevamente que la hora siga disponible
            const citaExistente = await Cita.findOne({
                where: {
                    medico_id: sesion.medicoId,
                    fecha: sesion.fecha,
                    hora: sesion.hora
                }
            });

            // La hora fue ocupada mientras el paciente confirmaba
            if (citaExistente) {

                sesion.estado = "ESPERANDO_FECHA";

                return {
                    mensaje: `❌ Lo sentimos.

La hora ${sesion.hora} acaba de ser ocupada por otro paciente.

Por favor selecciona nuevamente una fecha para consultar los horarios disponibles.`
                };
            }

            // Crear la cita
            const nuevaCita = await Cita.create({
                paciente_id: sesion.pacienteId,
                medico_id: sesion.medicoId,
                estado_id: 1,
                creado_por: sesion.usuarioId,
                fecha: sesion.fecha,
                hora: sesion.hora
            });

            // Guardar el ID de la cita
            sesion.citaId = nuevaCita.id_cita;

            // Reiniciar estado
            sesion.estado = "PACIENTE_VALIDADO";

            return {
                mensaje: `✅ ¡Cita creada correctamente!

📋 Datos de tu cita:

🆔 Cita #${nuevaCita.id_cita}
🏥 ${sesion.especialidadNombre}
👨‍⚕️ Dr. ${sesion.medicoNombre}
📅 ${sesion.fecha.split("-").reverse().join("/")}
🕐 ${sesion.hora}
📌 Estado: Pendiente

Tu cita ha sido registrada exitosamente.`
            };
        }

        // ==========================================
        // CANCELAR SOLICITUD
        // ==========================================

        if (mensajeNormalizado === "2") {

            sesion.estado = "PACIENTE_VALIDADO";

            return {
                mensaje: `❌ Solicitud de cita cancelada.

No se ha creado ninguna cita.

¿Qué deseas hacer ahora?

1️⃣ Solicitar una cita
2️⃣ Consultar mis citas
3️⃣ Cancelar una cita
4️⃣ Reprogramar una cita`
            };
        }

        // ==========================================
        // OPCIÓN NO VÁLIDA
        // ==========================================

        return {
            mensaje: `⚠️ Opción no válida.

Por favor responde:

1️⃣ Sí, confirmar
2️⃣ No, cancelar`
        };
    }

    // ==========================================
    // MENSAJE NO RECONOCIDO
    // ==========================================

    return {
        mensaje: `No estoy seguro de haber entendido tu solicitud. 🤖

Escribe "Hola" para comenzar.`
    };
};