document.addEventListener("DOMContentLoaded", () => {

    const inputBuscar = document.getElementById("buscarPrescripcion");
    const filas = document.querySelectorAll("#tablaPrescripciones tr");

    const modal = document.getElementById("modalPrescripcion");

    const botonesCerrar = document.querySelectorAll(
        ".btnCerrarModalPrescripcion"
    );

    // =====================================================
    // BUSCAR PRESCRIPCIONES
    // =====================================================

    if (inputBuscar) {
        inputBuscar.addEventListener("input", () => {

            const texto = inputBuscar.value.toLowerCase().trim();

            filas.forEach((fila) => {

                const contenido = fila.dataset.search || "";

                fila.style.display =
                    contenido.includes(texto)
                        ? ""
                        : "none";

            });

        });
    }


    // =====================================================
    // VER PRESCRIPCIÓN
    // =====================================================

    const botones = document.querySelectorAll(".btnVerPrescripcion");

    botones.forEach((boton) => {

        boton.addEventListener("click", async () => {

            const id = boton.dataset.id;

            try {

                const respuesta = await fetch(
                    `/admin/prescripciones/${id}`
                );

                const datos = await respuesta.json();

                if (!datos.ok) {
                    alert(
                        datos.mensaje ||
                        "No se pudo obtener la prescripción."
                    );
                    return;
                }

                const prescripcion = datos.prescripcion;

                const diagnostico = prescripcion.Diagnostico;
                const cita = diagnostico
                    ? diagnostico.Cita
                    : null;

                const paciente = cita
                    ? cita.Paciente
                    : null;

                const pacienteUsuario = paciente
                    ? paciente.Usuario
                    : null;

                const medico = cita
                    ? cita.Medico
                    : null;

                const medicoUsuario = medico
                    ? medico.Usuario
                    : null;

                const especialidad = medico
                    ? medico.Especialidad
                    : null;

                const estado = cita
                    ? cita.Estado
                    : null;


                // =====================================================
                // DATOS DE LA PRESCRIPCIÓN
                // =====================================================

                document.getElementById(
                    "modalPrescripcionMedicamento"
                ).textContent =
                    prescripcion.nombre_medicamento ||
                    "Sin medicamento";

                document.getElementById(
                    "modalPrescripcionDosis"
                ).textContent =
                    prescripcion.dosis ||
                    "Sin dosis";

                document.getElementById(
                    "modalPrescripcionFrecuencia"
                ).textContent =
                    prescripcion.frecuencia ||
                    "Sin frecuencia";

                document.getElementById(
                    "modalPrescripcionDuracion"
                ).textContent =
                    prescripcion.duracion ||
                    "Sin duración";


                // =====================================================
                // PACIENTE
                // =====================================================

                document.getElementById(
                    "modalPrescripcionPaciente"
                ).textContent =
                    pacienteUsuario
                        ? `${pacienteUsuario.nombres} ${pacienteUsuario.apellidos}`
                        : "Sin paciente";

                document.getElementById(
                    "modalPrescripcionDocumento"
                ).textContent =
                    pacienteUsuario?.numero_documento ||
                    "Sin documento";


                // =====================================================
                // MÉDICO
                // =====================================================

                document.getElementById(
                    "modalPrescripcionMedico"
                ).textContent =
                    medicoUsuario
                        ? `${medicoUsuario.nombres} ${medicoUsuario.apellidos}`
                        : "Sin médico";

                document.getElementById(
                    "modalPrescripcionEspecialidad"
                ).textContent =
                    especialidad?.nombre ||
                    "Sin especialidad";


                // =====================================================
                // DIAGNÓSTICO
                // =====================================================

                document.getElementById(
                    "modalPrescripcionDiagnostico"
                ).textContent =
                    diagnostico?.diagnostico ||
                    "Sin diagnóstico";


                // =====================================================
                // CITA
                // =====================================================

                document.getElementById(
                    "modalPrescripcionFecha"
                ).textContent =
                    cita?.fecha
                        ? new Date(cita.fecha)
                            .toLocaleDateString("es-CO")
                        : "Sin fecha";

                document.getElementById(
                    "modalPrescripcionEstado"
                ).textContent =
                    estado?.nombre ||
                    "Sin estado";


                // =====================================================
                // ABRIR MODAL
                // =====================================================

                modal.classList.remove("hidden");
                modal.classList.add("flex");

            } catch (error) {

                console.error(
                    "Error al obtener prescripción:",
                    error
                );

                alert(
                    "Ocurrió un error al cargar la prescripción."
                );

            }

        });

    });


    // =====================================================
    // CERRAR MODAL
    // =====================================================

    botonesCerrar.forEach((boton) => {

        boton.addEventListener("click", () => {

            modal.classList.add("hidden");
            modal.classList.remove("flex");

        });

    });


    // =====================================================
    // CERRAR AL HACER CLICK FUERA
    // =====================================================

    if (modal) {

        modal.addEventListener("click", (event) => {

            if (event.target === modal) {

                modal.classList.add("hidden");
                modal.classList.remove("flex");

            }

        });

    }

});