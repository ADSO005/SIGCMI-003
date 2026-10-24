
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modalNotificaciones");
    const btnAbrir = document.getElementById("btnAbrirNotificaciones");
    const btnCerrar = document.getElementById("cerrarNotificaciones");
    const btnCancelar = document.getElementById("cancelarNotificaciones");
    const btnGuardar = document.getElementById("guardarNotificaciones");

    if (!modal || !btnAbrir || !btnCerrar || !btnCancelar || !btnGuardar) {
        console.error(
            "No se encontraron todos los elementos del modal de notificaciones."
        );
        return;
    }

    const campos = {
        correo: "notificacionCorreo",
        sms: "notificacionSms",
        whatsapp: "notificacionWhatsapp",
        recordatorio_24h: "recordatorio24h",
        recordatorio_1h: "recordatorio1h",
        confirmacion_cita: "confirmacionCita",
        cancelacion_cita: "cancelacionCita",
        reprogramacion: "reprogramacion",
        nuevo_diagnostico: "nuevoDiagnostico",
        actualizaciones: "actualizaciones"
    };

    let preferenciasGuardadas = {};
    let guardando = false;

    const mensaje = document.createElement("p");
    mensaje.className = "px-5 pb-3 text-sm";
    mensaje.setAttribute("role", "status");
    mensaje.setAttribute("aria-live", "polite");

    btnGuardar.parentElement.before(mensaje);

    function mostrarMensaje(texto, error = false) {
        mensaje.textContent = texto;
        mensaje.className = error
            ? "px-5 pb-3 text-sm font-medium text-red-600"
            : "px-5 pb-3 text-sm font-medium text-indigo-700";
    }

    function leerPreferencias() {
        const preferencias = {};

        for (const [campo, id] of Object.entries(campos)) {
            const control = document.getElementById(id);

            if (control) {
                preferencias[campo] = control.checked;
            }
        }

        return preferencias;
    }

    function aplicarPreferencias(configuracion) {
        for (const [campo, id] of Object.entries(campos)) {
            const control = document.getElementById(id);

            if (
                control &&
                configuracion &&
                typeof configuracion[campo] === "boolean"
            ) {
                control.checked = configuracion[campo];
            }
        }

        preferenciasGuardadas = leerPreferencias();
    }

    function mostrarModal() {
        modal.classList.remove("hidden");
        document.body.classList.add("overflow-hidden");
        btnCerrar.focus();
    }

    function cerrarModal() {
        modal.classList.add("hidden");
        document.body.classList.remove("overflow-hidden");
        mensaje.textContent = "";
        btnAbrir.focus();
    }

    async function cargarPreferencias() {
        mostrarMensaje("Cargando preferencias...");

        try {
            const respuesta = await fetch(
                "/paciente/notificaciones/configuracion",
                {
                    method: "GET",
                    credentials: "same-origin",
                    headers: {
                        Accept: "application/json"
                    }
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok || !datos.ok) {
                throw new Error(
                    datos.mensaje || "No se pudieron cargar las preferencias."
                );
            }

            aplicarPreferencias(datos.configuracion);
            mensaje.textContent = "";
        } catch (error) {
            console.error("Error al cargar preferencias:", error);
            mostrarMensaje(
                error.message || "No se pudieron cargar las preferencias.",
                true
            );
        }
    }

    btnAbrir.addEventListener("click", async () => {
        mostrarModal();
        await cargarPreferencias();
    });

    btnCerrar.addEventListener("click", () => {
        aplicarPreferencias(preferenciasGuardadas);
        cerrarModal();
    });

    btnCancelar.addEventListener("click", () => {
        aplicarPreferencias(preferenciasGuardadas);
        cerrarModal();
    });

    modal.addEventListener("click", (evento) => {
        if (evento.target === modal) {
            aplicarPreferencias(preferenciasGuardadas);
            cerrarModal();
        }
    });

    document.addEventListener("keydown", (evento) => {
        if (
            evento.key === "Escape" &&
            !modal.classList.contains("hidden")
        ) {
            aplicarPreferencias(preferenciasGuardadas);
            cerrarModal();
        }
    });

    btnGuardar.addEventListener("click", async () => {
        if (guardando) return;

        guardando = true;
        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";
        mostrarMensaje("Guardando tus preferencias...");

        try {
            const respuesta = await fetch(
                "/paciente/notificaciones/configuracion",
                {
                    method: "PUT",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json"
                    },
                    body: JSON.stringify(leerPreferencias())
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok || !datos.ok) {
                throw new Error(
                    datos.mensaje || "No se pudieron guardar las preferencias."
                );
            }

            aplicarPreferencias(datos.configuracion);
            mostrarMensaje("¡Preferencias guardadas correctamente!");
        } catch (error) {
            console.error("Error al guardar preferencias:", error);
            mostrarMensaje(
                error.message || "Ocurrió un error al guardar.",
                true
            );
        } finally {
            guardando = false;
            btnGuardar.disabled = false;
            btnGuardar.textContent = "Guardar Cambios";
        }
    });
});
