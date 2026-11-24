document.addEventListener("DOMContentLoaded", () => {

    const inputBuscar = document.getElementById("buscarPrescripcion");
    const filas = document.querySelectorAll("#tablaPrescripciones tr");

    const modal = document.getElementById("modalPrescripcion");

    const botonesCerrar = document.querySelectorAll(
        ".btnCerrarModalPrescripcion"
    );


    if (inputBuscar) {
        inputBuscar.addEventListener("input", () => {

            const texto = inputBuscar.value;

            filas.forEach((fila) => {

                const contenido = fila.dataset.search || "";

                fila.style.display =
                    Busqueda.coincide(texto, contenido)
                        ? ""
                        : "none";

            });

        });
    }


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


                document.getElementById(
                    "modalPrescripcionDiagnostico"
                ).textContent =
                    diagnostico?.diagnostico ||
                    "Sin diagnóstico";


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


    botonesCerrar.forEach((boton) => {

        boton.addEventListener("click", () => {

            modal.classList.add("hidden");
            modal.classList.remove("flex");

        });

    });


    if (modal) {

        modal.addEventListener("click", (event) => {

            if (event.target === modal) {

                modal.classList.add("hidden");
                modal.classList.remove("flex");

            }

        });

    }

});