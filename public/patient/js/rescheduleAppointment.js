document.addEventListener("DOMContentLoaded", () => {

    console.log("✅ rescheduleAppointment.js se cargó");

    const modal = document.getElementById("modalReprogramarCita");
    const botonesReprogramar = document.querySelectorAll(".btn-reprogramar");
    const botonCerrar = document.getElementById("cerrarReprogramar");
    const botonCancelar = document.getElementById("btnCancelarReprogramar");
    const formulario = document.getElementById("formReprogramarCita");

    if (!modal) {
        console.error("❌ No se encontró el modal de reprogramación");
        return;
    }

    console.log(
        `✅ Se encontraron ${botonesReprogramar.length} botones de reprogramación`
    );


    // -----------------------------------------
    // ABRIR MODAL
    // -----------------------------------------

    botonesReprogramar.forEach((boton) => {

        boton.addEventListener("click", () => {

            const citaId = boton.dataset.citaId;

            console.log("🟢 Reprogramando cita:", citaId);

            // Guardamos el ID de la cita
            modal.dataset.citaId = citaId;

            modal.style.display = "flex";

            document.body.style.overflow = "hidden";
        });

    });


    // -----------------------------------------
    // CERRAR MODAL
    // -----------------------------------------

    function cerrarModal() {

        modal.style.display = "none";

        document.body.style.overflow = "";

        formulario.reset();

        delete modal.dataset.citaId;
    }


    // Botón X
    if (botonCerrar) {

        botonCerrar.addEventListener("click", () => {

            cerrarModal();

        });

    }


    // Botón Cancelar
    if (botonCancelar) {

        botonCancelar.addEventListener("click", () => {

            cerrarModal();

        });

    }


    // -----------------------------------------
    // ENVIAR FORMULARIO
    // -----------------------------------------

    formulario.addEventListener("submit", (event) => {

        event.preventDefault();

        const citaId = modal.dataset.citaId;

        const especialidad =
            document.getElementById("especialidad").value;

        const medico =
            document.getElementById("medico").value;

        const fecha =
            document.getElementById("fecha").value;

        const hora =
            document.getElementById("hora").value;


        console.log("📋 Nueva programación:");

        console.log({
            citaId,
            especialidad,
            medico,
            fecha,
            hora
        });


        alert("La cita fue reprogramada correctamente.");

      cerrarModal();

    });

});