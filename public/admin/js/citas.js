document.addEventListener("DOMContentLoaded", () => {

    const buscador = document.getElementById("buscarCita");
    const filtroEstado = document.getElementById("filtroEstado");
    const filtroFecha = document.getElementById("filtroFecha");

    const filas = document.querySelectorAll(
        "#tablaCitas tbody tr[data-paciente]"
    );


    const filtrarCitas = () => {

        const texto = buscador.value
            .trim()
            .toLowerCase();

        const estadoSeleccionado =
            filtroEstado.value
                .trim()
                .toLowerCase();

        const fechaSeleccionada =
            filtroFecha.value;


        filas.forEach((fila) => {

            const paciente =
                (fila.dataset.paciente || "")
                    .toLowerCase();

            const medico =
                (fila.dataset.medico || "")
                    .toLowerCase();

            const documento =
                (fila.dataset.documento || "")
                    .toLowerCase();

            const estado =
                (fila.dataset.estado || "")
                    .toLowerCase();

            const fecha =
                fila.dataset.fecha || "";


            const coincideTexto =
                !texto ||
                paciente.includes(texto) ||
                medico.includes(texto) ||
                documento.includes(texto);


            const coincideEstado =
                !estadoSeleccionado ||
                estado === estadoSeleccionado;


            const coincideFecha =
                !fechaSeleccionada ||
                fecha === fechaSeleccionada;


            if (
                coincideTexto &&
                coincideEstado &&
                coincideFecha
            ) {

                fila.classList.remove("hidden");

            } else {

                fila.classList.add("hidden");

            }

        });

    };


    // BUSCADOR

    buscador?.addEventListener(
        "input",
        filtrarCitas
    );


    // ESTADO

    filtroEstado?.addEventListener(
        "change",
        filtrarCitas
    );


    // FECHA

    filtroFecha?.addEventListener(
        "change",
        filtrarCitas
    );


    // ==========================================
    // MODAL VER CITA
    // ==========================================

    const modalVerCita =
        document.getElementById("modalVerCita");

    const btnCerrarVerCita =
        document.getElementById("btnCerrarVerCita");

    const btnCerrarVerCita2 =
        document.getElementById("btnCerrarVerCita2");

    const botonesVerCita =
        document.querySelectorAll(".btnVerCita");


    const cerrarModalVerCita = () => {

        modalVerCita.classList.add("hidden");
        modalVerCita.classList.remove("flex");

    };


    botonesVerCita.forEach((boton) => {

        boton.addEventListener("click", async () => {

            const id = boton.dataset.id;

            try {

                const respuesta = await fetch(
                    `/admin/citas/${id}`
                );

                const contenido =
                    await respuesta.text();

                let data;

                try {

                    data = JSON.parse(contenido);

                } catch (error) {

                    throw new Error(
                        `El servidor respondió con ${respuesta.status} y no devolvió JSON.`
                    );

                }


                if (!respuesta.ok) {

                    throw new Error(
                        data.mensaje ||
                        "No se pudo obtener la cita."
                    );

                }


                const cita = data.cita;


                // PACIENTE

                const paciente =
                    cita.Paciente;

                const pacienteUsuario =
                    paciente
                        ? paciente.Usuario
                        : null;


                // MÉDICO

                const medico =
                    cita.Medico;

                const medicoUsuario =
                    medico
                        ? medico.Usuario
                        : null;


                const especialidad =
                    medico
                        ? medico.Especialidad
                        : null;


                // DATOS

                document.getElementById(
                    "detalleCitaId"
                ).textContent =
                    `Cita #${cita.id_cita}`;


                document.getElementById(
                    "detallePaciente"
                ).textContent =
                    pacienteUsuario
                        ? `${pacienteUsuario.nombres} ${pacienteUsuario.apellidos}`
                        : "Sin información";


                document.getElementById(
                    "detalleDocumento"
                ).textContent =
                    pacienteUsuario
                        ? `CC: ${pacienteUsuario.numero_documento || "Sin documento"}`
                        : "CC: Sin documento";


                document.getElementById(
                    "detalleCorreoPaciente"
                ).textContent =
                    pacienteUsuario?.correo ||
                    "Sin correo";


                document.getElementById(
                    "detalleTelefonoPaciente"
                ).textContent =
                    pacienteUsuario?.telefono ||
                    "Sin teléfono";


                // MÉDICO

                document.getElementById(
                    "detalleMedico"
                ).textContent =
                    medicoUsuario
                        ? `${medicoUsuario.nombres} ${medicoUsuario.apellidos}`
                        : "Sin información";


                document.getElementById(
                    "detalleEspecialidad"
                ).textContent =
                    especialidad
                        ? `Especialidad: ${especialidad.nombre}`
                        : "Sin especialidad";


                document.getElementById(
                    "detalleCorreoMedico"
                ).textContent =
                    medicoUsuario?.correo ||
                    "Sin correo";


                document.getElementById(
                    "detalleTelefonoMedico"
                ).textContent =
                    medicoUsuario?.telefono ||
                    "Sin teléfono";


                // FECHA Y HORA

                document.getElementById(
                    "detalleFecha"
                ).textContent =
                    `Fecha: ${cita.fecha}`;


                document.getElementById(
                    "detalleHora"
                ).textContent =
                    `Hora: ${String(cita.hora).substring(0, 5)}`;


                // ESTADO

                document.getElementById(
                    "detalleEstado"
                ).textContent =
                    cita.Estado
                        ? cita.Estado.nombre
                        : "Sin estado";


                // MOTIVO

                document.getElementById(
                    "detalleMotivo"
                ).textContent =
                    cita.motivo_consulta ||
                    "Sin información";


                // ABRIR MODAL

                modalVerCita.classList.remove(
                    "hidden"
                );

                modalVerCita.classList.add(
                    "flex"
                );

            } catch (error) {

                console.error(
                    "Error al obtener detalle de cita:",
                    error
                );

                alert(error.message);

            }

        });

    });


    btnCerrarVerCita?.addEventListener(
        "click",
        cerrarModalVerCita
    );


    btnCerrarVerCita2?.addEventListener(
        "click",
        cerrarModalVerCita
    );



    // =====================================================
    // REPROGRAMAR CITA
    // =====================================================

    const modalReprogramarCita = document.getElementById("modalReprogramarCita");
    const btnCerrarReprogramarCita = document.getElementById("btnCerrarReprogramarCita");
    const btnCancelarReprogramarCita = document.getElementById("btnCancelarReprogramarCita");

    const botonesReprogramar = document.querySelectorAll(".btnReprogramarCita");

    const cerrarModalReprogramarCita = () => {
        modalReprogramarCita.classList.add("hidden");
        modalReprogramarCita.classList.remove("flex");

        document.getElementById("errorReprogramarCita")?.classList.add("hidden");
        document.getElementById("exitoReprogramarCita")?.classList.add("hidden");

        document.getElementById("reprogramarFecha").value = "";

        const hora = document.getElementById("reprogramarHora");

        hora.innerHTML = `
        <option value="">Seleccione una fecha</option>
    `;

        hora.disabled = true;
    };


    // =====================================================
    // ABRIR MODAL
    // =====================================================

    botonesReprogramar.forEach((boton) => {

        boton.addEventListener("click", async () => {

            const id = boton.dataset.id;

            try {

                const respuesta = await fetch(`/admin/citas/${id}`);

                const data = await respuesta.json();

                if (!respuesta.ok) {
                    throw new Error(
                        data.mensaje || "No se pudo obtener la información de la cita."
                    );
                }

                const cita = data.cita;

                const paciente = cita.Paciente;
                const pacienteUsuario = paciente
                    ? paciente.Usuario
                    : null;

                const medico = cita.Medico;
                const medicoUsuario = medico
                    ? medico.Usuario
                    : null;

                const especialidad = medico
                    ? medico.Especialidad
                    : null;


                // =========================================
                // DATOS OCULTOS
                // =========================================

                document.getElementById("reprogramarCitaId").value =
                    cita.id_cita;

                document.getElementById("reprogramarMedicoId").value =
                    cita.medico_id;


                // =========================================
                // INFORMACIÓN DE LA CITA
                // =========================================

                document.getElementById("reprogramarCitaNumero").textContent =
                    `Cita #${cita.id_cita}`;

                document.getElementById("reprogramarPaciente").textContent =
                    pacienteUsuario
                        ? `${pacienteUsuario.nombres} ${pacienteUsuario.apellidos}`
                        : "Sin información";

                document.getElementById("reprogramarMedico").textContent =
                    medicoUsuario
                        ? `${medicoUsuario.nombres} ${medicoUsuario.apellidos}`
                        : "Sin información";

                document.getElementById("reprogramarEspecialidad").textContent =
                    especialidad
                        ? especialidad.nombre
                        : "Sin especialidad";

                document.getElementById("reprogramarCitaActual").textContent =
                    `${cita.fecha} - ${String(cita.hora).substring(0, 5)}`;


                // =========================================
                // LIMPIAR CAMPOS
                // =========================================

                document.getElementById("reprogramarFecha").value = "";

                document.getElementById("reprogramarMotivo").value = "";

                const hora = document.getElementById("reprogramarHora");

                hora.innerHTML = `
                <option value="">Seleccione una fecha</option>
            `;

                hora.disabled = true;


                // =========================================
                // OCULTAR MENSAJES
                // =========================================

                document
                    .getElementById("errorReprogramarCita")
                    .classList.add("hidden");

                document
                    .getElementById("exitoReprogramarCita")
                    .classList.add("hidden");


                // =========================================
                // MOSTRAR MODAL
                // =========================================

                modalReprogramarCita.classList.remove("hidden");

                modalReprogramarCita.classList.add("flex");

            } catch (error) {

                console.error(
                    "Error al cargar cita para reprogramar:",
                    error
                );

                alert(error.message);
            }

        });

    });


    // =====================================================
    // CONSULTAR HORAS DISPONIBLES
    // =====================================================

    const reprogramarFecha = document.getElementById("reprogramarFecha");
    const reprogramarHora = document.getElementById("reprogramarHora");

    reprogramarFecha?.addEventListener("change", async () => {

        const fecha = reprogramarFecha.value;
        const medicoId = document.getElementById("reprogramarMedicoId").value;

        const errorBox = document.getElementById("errorReprogramarCita");
        const mensajeError = document.getElementById("mensajeErrorReprogramarCita");

        reprogramarHora.innerHTML = `
        <option value="">Cargando horarios...</option>
    `;

        reprogramarHora.disabled = true;

        errorBox.classList.add("hidden");


        if (!fecha || !medicoId) {
            reprogramarHora.innerHTML = `
            <option value="">Seleccione una fecha</option>
        `;

            return;
        }


        try {

            const respuesta = await fetch(
                `/admin/citas/disponibilidad?medico_id=${medicoId}&fecha=${fecha}`
            );

            const data = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    data.mensaje || "No hay disponibilidad para esta fecha."
                );
            }


            reprogramarHora.innerHTML = `
            <option value="">Seleccione una hora</option>
        `;


            if (!data.horas || data.horas.length === 0) {

                reprogramarHora.innerHTML = `
                <option value="">No hay horas disponibles</option>
            `;

                reprogramarHora.disabled = true;

                return;
            }


            data.horas.forEach((hora) => {

                const option = document.createElement("option");

                option.value = hora;
                option.textContent = hora.substring(0, 5);

                reprogramarHora.appendChild(option);

            });


            reprogramarHora.disabled = false;

        } catch (error) {

            console.error(
                "Error al consultar disponibilidad:",
                error
            );

            mensajeError.textContent = error.message;

            errorBox.classList.remove("hidden");

            reprogramarHora.innerHTML = `
            <option value="">No hay horas disponibles</option>
        `;

            reprogramarHora.disabled = true;
        }

    });


    // =====================================================
    // CERRAR MODAL
    // =====================================================

    btnCerrarReprogramarCita?.addEventListener(
        "click",
        cerrarModalReprogramarCita
    );

    btnCancelarReprogramarCita?.addEventListener(
        "click",
        cerrarModalReprogramarCita
    );

    // =====================================================
    // GUARDAR REPROGRAMACIÓN
    // =====================================================

    const formReprogramarCita =
        document.getElementById("formReprogramarCita");

    formReprogramarCita?.addEventListener("submit", async (event) => {

        event.preventDefault();

        const id =
            document.getElementById("reprogramarCitaId").value;

        const fecha =
            document.getElementById("reprogramarFecha").value;

        const hora =
            document.getElementById("reprogramarHora").value;

        const motivo =
            document.getElementById("reprogramarMotivo").value.trim();


        const errorBox =
            document.getElementById("errorReprogramarCita");

        const mensajeError =
            document.getElementById("mensajeErrorReprogramarCita");

        const exitoBox =
            document.getElementById("exitoReprogramarCita");

        const boton =
            document.getElementById("btnGuardarReprogramarCita");


        errorBox.classList.add("hidden");
        exitoBox.classList.add("hidden");


        if (!fecha || !hora || !motivo) {

            mensajeError.textContent =
                "Debe completar la fecha, hora y motivo de reprogramación.";

            errorBox.classList.remove("hidden");

            return;
        }


        boton.disabled = true;

        boton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin mr-2"></i>
        Reprogramando...
    `;


        try {

            const respuesta = await fetch(
                `/admin/citas/${id}/reprogramar`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        fecha,
                        hora,
                        motivo_reprogramacion: motivo
                    })
                }
            );


            const data = await respuesta.json();


            if (!respuesta.ok) {
                throw new Error(
                    data.mensaje ||
                    "No se pudo reprogramar la cita."
                );
            }


            exitoBox.textContent =
                "La cita fue reprogramada correctamente.";

            exitoBox.classList.remove("hidden");


            // Esperar un momento para que el usuario vea el mensaje
            setTimeout(() => {

                cerrarModalReprogramarCita();

                window.location.reload();

            }, 1000);


        } catch (error) {

            console.error(
                "Error al reprogramar cita:",
                error
            );

            mensajeError.textContent =
                error.message;

            errorBox.classList.remove("hidden");


        } finally {

            boton.disabled = false;

            boton.innerHTML = `
            <i class="fa-solid fa-calendar-check mr-2"></i>
            Reprogramar Cita
        `;
        }

    });


    // =====================================================
    // CANCELAR CITA - ABRIR MODAL
    // =====================================================

    const modalCancelarCita =
        document.getElementById("modalCancelarCita");

    const btnCerrarCancelarCita =
        document.getElementById("btnCerrarCancelarCita");

    const btnCancelarCancelarCita =
        document.getElementById("btnCancelarCancelarCita");

    const botonesCancelar =
        document.querySelectorAll(".btnCancelarCita");


    const cerrarModalCancelarCita = () => {

        modalCancelarCita.classList.add("hidden");
        modalCancelarCita.classList.remove("flex");

        document.getElementById("cancelarMotivo").value = "";

        document
            .getElementById("errorCancelarCita")
            .classList.add("hidden");

        document
            .getElementById("exitoCancelarCita")
            .classList.add("hidden");
    };


    // =====================================================
    // ABRIR MODAL
    // =====================================================

    botonesCancelar.forEach((boton) => {

        boton.addEventListener("click", async () => {

            const id = boton.dataset.id;

            try {

                const respuesta =
                    await fetch(`/admin/citas/${id}`);

                const data =
                    await respuesta.json();

                if (!respuesta.ok) {
                    throw new Error(
                        data.mensaje ||
                        "No se pudo obtener la información de la cita."
                    );
                }

                const cita = data.cita;

                const paciente =
                    cita.Paciente;

                const pacienteUsuario =
                    paciente
                        ? paciente.Usuario
                        : null;

                const medico =
                    cita.Medico;

                const medicoUsuario =
                    medico
                        ? medico.Usuario
                        : null;


                // =========================================
                // INFORMACIÓN
                // =========================================

                document.getElementById(
                    "cancelarCitaNumero"
                ).textContent =
                    `Cita #${cita.id_cita}`;


                document.getElementById(
                    "cancelarPaciente"
                ).textContent =
                    pacienteUsuario
                        ? `${pacienteUsuario.nombres} ${pacienteUsuario.apellidos}`
                        : "Sin información";


                document.getElementById(
                    "cancelarMedico"
                ).textContent =
                    medicoUsuario
                        ? `${medicoUsuario.nombres} ${medicoUsuario.apellidos}`
                        : "Sin información";


                document.getElementById(
                    "cancelarFecha"
                ).textContent =
                    cita.fecha;


                document.getElementById(
                    "cancelarHora"
                ).textContent =
                    String(cita.hora).substring(0, 5);


                // =========================================
                // GUARDAR ID
                // =========================================

                modalCancelarCita.dataset.id =
                    cita.id_cita;


                // =========================================
                // LIMPIAR
                // =========================================

                document.getElementById(
                    "cancelarMotivo"
                ).value = "";

                document
                    .getElementById("errorCancelarCita")
                    .classList.add("hidden");

                document
                    .getElementById("exitoCancelarCita")
                    .classList.add("hidden");


                // =========================================
                // MOSTRAR MODAL
                // =========================================

                modalCancelarCita.classList.remove("hidden");

                modalCancelarCita.classList.add("flex");

            } catch (error) {

                console.error(
                    "Error al cargar cita para cancelar:",
                    error
                );

                alert(error.message);
            }

        });

    });


    // =====================================================
    // CERRAR MODAL
    // =====================================================

    btnCerrarCancelarCita?.addEventListener(
        "click",
        cerrarModalCancelarCita
    );

    btnCancelarCancelarCita?.addEventListener(
        "click",
        cerrarModalCancelarCita
    );

    // =====================================================
    // CONFIRMAR CANCELACIÓN
    // =====================================================

    const btnConfirmarCancelarCita =
        document.getElementById("btnConfirmarCancelarCita");

    btnConfirmarCancelarCita?.addEventListener(
        "click",
        async () => {

            const id =
                modalCancelarCita.dataset.id;

            const motivo =
                document
                    .getElementById("cancelarMotivo")
                    .value
                    .trim();

            const errorBox =
                document.getElementById(
                    "errorCancelarCita"
                );

            const mensajeError =
                document.getElementById(
                    "mensajeErrorCancelarCita"
                );

            const exitoBox =
                document.getElementById(
                    "exitoCancelarCita"
                );


            errorBox.classList.add("hidden");
            exitoBox.classList.add("hidden");


            // =========================================
            // VALIDAR MOTIVO
            // =========================================

            if (!motivo) {

                mensajeError.textContent =
                    "Debe ingresar el motivo de cancelación.";

                errorBox.classList.remove("hidden");

                return;
            }


            // =========================================
            // DESHABILITAR BOTÓN
            // =========================================

            btnConfirmarCancelarCita.disabled = true;

            btnConfirmarCancelarCita.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin mr-2"></i>
            Cancelando...
        `;


            try {

                const respuesta =
                    await fetch(
                        `/admin/citas/${id}/cancelar`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                motivo_cancelacion:
                                    motivo
                            })
                        }
                    );


                const data =
                    await respuesta.json();


                if (!respuesta.ok) {

                    throw new Error(
                        data.mensaje ||
                        "No se pudo cancelar la cita."
                    );

                }


                // =========================================
                // ÉXITO
                // =========================================

                exitoBox.classList.remove("hidden");


                // =========================================
                // RECARGAR LISTADO
                // =========================================

                setTimeout(() => {

                    cerrarModalCancelarCita();

                    window.location.reload();

                }, 1000);


            } catch (error) {

                console.error(
                    "Error al cancelar cita:",
                    error
                );

                mensajeError.textContent =
                    error.message;

                errorBox.classList.remove("hidden");


            } finally {

                btnConfirmarCancelarCita.disabled = false;

                btnConfirmarCancelarCita.innerHTML = `
                <i class="fa-solid fa-calendar-xmark mr-2"></i>
                Cancelar Cita
            `;

            }

        }
    );
    
});

