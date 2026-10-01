document.addEventListener("DOMContentLoaded", () => {
    function establecerTexto(id, valor) {

        const elemento = document.getElementById(id);

        if (!elemento) {
            console.error(`❌ No existe el elemento #${id}`);
            return;
        }

        console.log(`✅ Elemento encontrado: #${id}`);

        elemento.textContent = valor ?? "-";
    }
    // =====================================================
    // ELEMENTOS
    // =====================================================

    const buscador = document.getElementById("buscarDiagnostico");
    const filtroEstado = document.getElementById("filtroEstado");
    const btnLimpiar = document.getElementById("btnLimpiarFiltros");

    const filas = document.querySelectorAll(".diagnostico-row");
    const contador = document.getElementById("contadorDiagnosticos");

    const modal = document.getElementById("modalDiagnostico");
    const btnCerrarModal = document.getElementById("btnCerrarModal");

    // =====================================================
    // FILTROS
    // =====================================================

    function filtrarDiagnosticos() {

        const texto = buscador
            ? buscador.value.toLowerCase().trim()
            : "";

        const estado = filtroEstado
            ? filtroEstado.value
            : "";

        let visibles = 0;

        filas.forEach(fila => {

            const contenido = fila.dataset.search || "";
            const estadoFila = fila.dataset.estado || "";

            const coincideTexto =
                !texto || contenido.includes(texto);

            const coincideEstado =
                !estado || estadoFila === estado;

            if (coincideTexto && coincideEstado) {

                fila.style.display = "";
                visibles++;

            } else {

                fila.style.display = "none";

            }

        });

        if (contador) {
            contador.textContent = visibles;
        }
    }

    if (buscador) {
        buscador.addEventListener(
            "input",
            filtrarDiagnosticos
        );
    }

    if (filtroEstado) {
        filtroEstado.addEventListener(
            "change",
            filtrarDiagnosticos
        );
    }

    if (btnLimpiar) {

        btnLimpiar.addEventListener("click", () => {

            if (buscador) {
                buscador.value = "";
            }

            if (filtroEstado) {
                filtroEstado.value = "";
            }

            filtrarDiagnosticos();

        });
    }


    // =====================================================
    // VER DIAGNÓSTICO
    // =====================================================

    const botonesVer =
        document.querySelectorAll(".btnVerDiagnostico");

    botonesVer.forEach(boton => {

        boton.addEventListener("click", async () => {

            const id = boton.dataset.id;

            if (!id) {
                return;
            }

            try {

                const respuesta =
                    await fetch(`/admin/diagnosticos/${id}`);

                const datos =
                    await respuesta.json();

                if (!datos.ok) {

                    alert(
                        datos.mensaje ||
                        "No se pudo cargar el diagnóstico."
                    );

                    return;
                }

                const diagnostico =
                    datos.diagnostico;

                const cita =
                    diagnostico.Cita;

                const paciente =
                    cita?.Paciente;

                const pacienteUsuario =
                    paciente?.Usuario;

                const medico =
                    cita?.Medico;

                const medicoUsuario =
                    medico?.Usuario;

                const especialidad =
                    medico?.Especialidad;

                const estado =
                    cita?.Estado;

                console.log("Modal:", modal);
                console.log(
                    "modalPaciente:",
                    document.getElementById("modalPaciente")
                );

                // =================================================
                // PACIENTE
                // =================================================

                document.getElementById(
                    "modalPaciente"
                ).textContent =
                    pacienteUsuario
                        ? `${pacienteUsuario.nombres} ${pacienteUsuario.apellidos}`
                        : "Sin paciente";


                document.getElementById(
                    "modalDocumento"
                ).textContent =
                    pacienteUsuario?.numero_documento
                        ? `Documento: ${pacienteUsuario.numero_documento}`
                        : "Documento: -";


                // =================================================
                // MÉDICO
                // =================================================

                document.getElementById(
                    "modalMedico"
                ).textContent =
                    medicoUsuario
                        ? `${medicoUsuario.nombres} ${medicoUsuario.apellidos}`
                        : "Sin médico";


                document.getElementById(
                    "modalEspecialidad"
                ).textContent =
                    especialidad?.nombre ||
                    "Sin especialidad";


                // =================================================
                // FECHA
                // =================================================

                const fecha =
                    diagnostico.fecha_diagnostico
                        ? new Date(
                            diagnostico.fecha_diagnostico
                        )
                        : null;


                document.getElementById(
                    "modalFecha"
                ).textContent =
                    fecha
                        ? fecha.toLocaleDateString("es-CO")
                        : "Sin fecha";


                // =================================================
                // ESTADO
                // =================================================

                document.getElementById(
                    "modalEstado"
                ).textContent =
                    estado?.nombre ||
                    "Sin estado";


                // =================================================
                // SIGNOS VITALES
                // =================================================

                document.getElementById(
                    "modalTemperatura"
                ).textContent =
                    diagnostico.temperatura
                        ? `${diagnostico.temperatura} °C`
                        : "-";


                document.getElementById(
                    "modalPresion"
                ).textContent =
                    diagnostico.presion_arterial ||
                    "-";


                document.getElementById(
                    "modalAltura"
                ).textContent =
                    diagnostico.altura
                        ? `${diagnostico.altura} m`
                        : "-";


                document.getElementById(
                    "modalPeso"
                ).textContent =
                    diagnostico.peso
                        ? `${diagnostico.peso} kg`
                        : "-";


                document.getElementById(
                    "modalFrecuencia"
                ).textContent =
                    diagnostico.frecuencia_cardiaca
                        ? `${diagnostico.frecuencia_cardiaca} lpm`
                        : "-";


                // =================================================
                // INFORMACIÓN CLÍNICA
                // =================================================

                document.getElementById(
                    "modalSintomas"
                ).textContent =
                    diagnostico.sintomas ||
                    "Sin síntomas registrados";


                document.getElementById(
                    "modalDiagnosticoTexto"
                ).textContent =
                    diagnostico.diagnostico ||
                    "Sin diagnóstico";


                document.getElementById(
                    "modalTratamiento"
                ).textContent =
                    diagnostico.tratamiento ||
                    "Sin tratamiento registrado";


                document.getElementById(
                    "modalNotas"
                ).textContent =
                    diagnostico.notas_adicionales ||
                    "Sin notas adicionales";


                // =================================================
                // MOSTRAR MODAL
                // =================================================

                modal.classList.remove("hidden");
                modal.classList.add("flex");

            } catch (error) {

                console.error(
                    "Error al cargar diagnóstico:",
                    error
                );

                alert(
                    "Ocurrió un error al cargar el diagnóstico."
                );
            }

        });

    });


    // =====================================================
    // CERRAR MODAL
    // =====================================================

    if (btnCerrarModal) {

        btnCerrarModal.addEventListener(
            "click",
            () => {

                modal.classList.add("hidden");
                modal.classList.remove("flex");

            }
        );

    }


    // =====================================================
    // CERRAR AL HACER CLICK FUERA
    // =====================================================

    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (event.target === modal) {

                    modal.classList.add("hidden");
                    modal.classList.remove("flex");

                }

            }
        );

    }

});