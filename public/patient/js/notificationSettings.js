// =========================================================
// SIGCMI
// Configuración de Notificaciones
// =========================================================

const modalNotificaciones =
    document.getElementById("modalNotificaciones");

const btnAbrirNotificaciones =
    document.getElementById("btnAbrirNotificaciones");

const btnCerrarNotificaciones =
    document.getElementById("cerrarNotificaciones");

const btnCancelarNotificaciones =
    document.getElementById("cancelarNotificaciones");

const btnGuardarNotificaciones =
    document.getElementById("guardarNotificaciones");


// =========================================================
// ABRIR MODAL
// =========================================================

function abrirModalNotificaciones() {

    if (!modalNotificaciones) {
        return;
    }

    modalNotificaciones.classList.add("active");

    document.body.style.overflow = "hidden";
}


// =========================================================
// CERRAR MODAL
// =========================================================

function cerrarModalNotificaciones() {

    if (!modalNotificaciones) {
        return;
    }

    modalNotificaciones.classList.remove("active");

    document.body.style.overflow = "";
}


// =========================================================
// BOTÓN CONFIGURAR NOTIFICACIONES
// =========================================================

if (btnAbrirNotificaciones) {

    btnAbrirNotificaciones.addEventListener(
        "click",
        abrirModalNotificaciones
    );

}


// =========================================================
// BOTÓN X
// =========================================================

if (btnCerrarNotificaciones) {

    btnCerrarNotificaciones.addEventListener(
        "click",
        cerrarModalNotificaciones
    );

}


// =========================================================
// BOTÓN CANCELAR
// =========================================================

if (btnCancelarNotificaciones) {

    btnCancelarNotificaciones.addEventListener(
        "click",
        cerrarModalNotificaciones
    );

}


// =========================================================
// CERRAR AL HACER CLICK FUERA DEL MODAL
// =========================================================

if (modalNotificaciones) {

    modalNotificaciones.addEventListener(
        "click",
        function (event) {

            if (event.target === modalNotificaciones) {

                cerrarModalNotificaciones();

            }

        }
    );

}


// =========================================================
// CERRAR CON ESC
// =========================================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            modalNotificaciones &&
            modalNotificaciones.classList.contains("active")
        ) {

            cerrarModalNotificaciones();

        }

    }
);


// =========================================================
// GUARDAR CAMBIOS
// =========================================================

if (btnGuardarNotificaciones) {

    btnGuardarNotificaciones.addEventListener(
        "click",
        function () {

            const configuracion = {

                correo:
                    document.getElementById(
                        "notificacionCorreo"
                    ).checked,

                sms:
                    document.getElementById(
                        "notificacionSms"
                    ).checked,

                whatsapp:
                    document.getElementById(
                        "notificacionWhatsapp"
                    ).checked,

                recordatorio_24h:
                    document.getElementById(
                        "recordatorio24h"
                    ).checked,

                recordatorio_1h:
                    document.getElementById(
                        "recordatorio1h"
                    ).checked,

                confirmacion_cita:
                    document.getElementById(
                        "confirmacionCita"
                    ).checked,

                cancelacion_cita:
                    document.getElementById(
                        "cancelacionCita"
                    ).checked,

                reprogramacion:
                    document.getElementById(
                        "reprogramacion"
                    ).checked,

                nuevo_diagnostico:
                    document.getElementById(
                        "nuevoDiagnostico"
                    ).checked,

                actualizaciones:
                    document.getElementById(
                        "actualizaciones"
                    ).checked
            };


            console.log(
                "Configuración de notificaciones:",
                configuracion
            );


            alert("Cambios guardados correctamente.");

            cerrarModalNotificaciones();

        }
    );

}