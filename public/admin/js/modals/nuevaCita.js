document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // ELEMENTOS
    // =====================================================

    const modal =
        document.getElementById("modalNuevaCita");

    const btnAbrir =
        document.getElementById("btnNuevaCita");

    const btnCerrar =
        document.getElementById("btnCerrarNuevaCita");

    const btnCancelar =
        document.getElementById("btnCancelarNuevaCita");

    const form =
        document.getElementById("formNuevaCita");

    const especialidadSelect =
        document.getElementById("modal_especialidad_id");

    const medicoSelect =
        document.getElementById("modal_medico_id");

    const fechaInput =
        document.getElementById("modal_fecha");

    const horaSelect =
        document.getElementById("modal_hora");

    const motivoInput =
        document.getElementById("modal_motivo");

    const errorBox =
        document.getElementById("errorNuevaCita");

    const mensajeError =
        document.getElementById("mensajeErrorNuevaCita");

    const exitoBox =
        document.getElementById("exitoNuevaCita");


    if (!modal || !form) {
        return;
    }


    // =====================================================
    // FECHA MÍNIMA
    // =====================================================

    const obtenerFechaLocal = () => {

        const ahora = new Date();

        const anio =
            ahora.getFullYear();

        const mes =
            String(
                ahora.getMonth() + 1
            ).padStart(2, "0");

        const dia =
            String(
                ahora.getDate()
            ).padStart(2, "0");

        return `${anio}-${mes}-${dia}`;
    };


    fechaInput.min =
        obtenerFechaLocal();


    // =====================================================
    // MENSAJES
    // =====================================================

    const mostrarError = (mensaje) => {

        mensajeError.textContent =
            mensaje;

        errorBox.classList.remove(
            "hidden"
        );

        exitoBox.classList.add(
            "hidden"
        );

    };


    const ocultarMensajes = () => {

        errorBox.classList.add(
            "hidden"
        );

        exitoBox.classList.add(
            "hidden"
        );

    };


    // =====================================================
    // ABRIR MODAL
    // =====================================================

    const abrirModal = () => {

        modal.classList.remove(
            "hidden"
        );

        modal.classList.add(
            "flex"
        );

        ocultarMensajes();

    };


    // =====================================================
    // CERRAR MODAL
    // =====================================================

    const cerrarModal = () => {

        modal.classList.add(
            "hidden"
        );

        modal.classList.remove(
            "flex"
        );

        ocultarMensajes();

    };


    btnAbrir?.addEventListener(
        "click",
        abrirModal
    );


    btnCerrar?.addEventListener(
        "click",
        cerrarModal
    );


    btnCancelar?.addEventListener(
        "click",
        cerrarModal
    );


    // =====================================================
    // CERRAR HACIENDO CLICK FUERA
    // =====================================================

    modal.addEventListener(
        "click",
        (event) => {

            if (event.target === modal) {
                cerrarModal();
            }

        }
    );


    // =====================================================
    // FILTRAR MÉDICOS POR ESPECIALIDAD
    // =====================================================

    const opcionesMedicos =
        Array.from(
            medicoSelect.querySelectorAll(
                "option[data-especialidad]"
            )
        );


    const filtrarMedicos = () => {

        const especialidadId =
            especialidadSelect.value;


        medicoSelect.innerHTML = "";


        const opcionInicial =
            document.createElement("option");

        opcionInicial.value = "";


        if (!especialidadId) {

            opcionInicial.textContent =
                "Seleccione una especialidad primero";

            medicoSelect.appendChild(
                opcionInicial
            );

        } else {

            opcionInicial.textContent =
                "Seleccione un médico";

            medicoSelect.appendChild(
                opcionInicial
            );


            opcionesMedicos.forEach(
                opcion => {

                    if (
                        opcion.dataset.especialidad ===
                        especialidadId
                    ) {

                        medicoSelect.appendChild(
                            opcion.cloneNode(true)
                        );

                    }

                }
            );

        }


        limpiarHoras();

    };


    especialidadSelect.addEventListener(
        "change",
        filtrarMedicos
    );


    // =====================================================
    // LIMPIAR HORAS
    // =====================================================

    function limpiarHoras() {

        horaSelect.innerHTML =
            '<option value="">Seleccione médico y fecha</option>';

        horaSelect.disabled =
            true;

    }


    // =====================================================
    // CARGAR HORAS DISPONIBLES
    // =====================================================

    const cargarHorasDisponibles =
        async () => {

            ocultarMensajes();

            const medicoId =
                medicoSelect.value;

            const fecha =
                fechaInput.value;


            if (!medicoId || !fecha) {

                limpiarHoras();

                return;
            }


            horaSelect.disabled =
                true;

            horaSelect.innerHTML =
                '<option value="">Consultando disponibilidad...</option>';


            try {

                const params =
                    new URLSearchParams({
                        medico_id: medicoId,
                        fecha
                    });


                const response =
                    await fetch(
                        `/admin/citas/disponibilidad?${params.toString()}`
                    );


                const data =
                    await response.json();


                if (!response.ok || !data.ok) {

                    throw new Error(
                        data.mensaje ||
                        "No fue posible consultar la disponibilidad."
                    );

                }


                horaSelect.innerHTML =
                    "";


                const opcionInicial =
                    document.createElement(
                        "option"
                    );

                opcionInicial.value =
                    "";


                if (data.horas.length === 0) {

                    opcionInicial.textContent =
                        "No hay horas disponibles";

                    horaSelect.appendChild(
                        opcionInicial
                    );

                    horaSelect.disabled =
                        true;

                    return;
                }


                opcionInicial.textContent =
                    "Seleccione una hora";

                horaSelect.appendChild(
                    opcionInicial
                );


                data.horas.forEach(
                    hora => {

                        const option =
                            document.createElement(
                                "option"
                            );

                        option.value =
                            hora;

                        option.textContent =
                            hora;

                        horaSelect.appendChild(
                            option
                        );

                    }
                );


                horaSelect.disabled =
                    false;


            } catch (error) {

                limpiarHoras();

                mostrarError(
                    error.message
                );

            }

        };


    medicoSelect.addEventListener(
        "change",
        cargarHorasDisponibles
    );


    fechaInput.addEventListener(
        "change",
        cargarHorasDisponibles
    );


    // =====================================================
    // VALIDAR MOTIVO
    // =====================================================

    const motivoValido = () => {

        let texto =
            motivoInput.value
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");


        const sustituciones = {
            "0": "o",
            "1": "i",
            "3": "e",
            "4": "a",
            "5": "s",
            "7": "t",
            "@": "a",
            "$": "s"
        };


        texto = texto
            .split("")
            .map(caracter =>
                sustituciones[caracter] ?? caracter
            )
            .join("");


        const limpio =
            texto.replace(/[^a-z]/g, "");


        const reducido =
            limpio.replace(
                /(.)\1{2,}/g,
                "$1$1"
            );


        const palabrasBloqueadas = [
            "puta",
            "puto",
            "mierda",
            "marica",
            "maricon",
            "gonorrea",
            "hijueputa",
            "malparido",
            "carechimba",
            "caremonda",
            "careverga",
            "chimba",
            "monda",
            "verga",
            "polla",
            "coño",
            "culo",
            "joder",
            "jodete",
            "chingar",
            "chingada"
        ];


        return !palabrasBloqueadas.some(
            palabra => {

                const palabraLimpia =
                    palabra
                        .normalize("NFD")
                        .replace(
                            /[\u0300-\u036f]/g,
                            ""
                        );

                return (
                    texto.includes(palabraLimpia) ||
                    limpio.includes(palabraLimpia) ||
                    reducido.includes(palabraLimpia)
                );

            }
        );

    };


    // =====================================================
    // ENVIAR FORMULARIO
    // =====================================================

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            ocultarMensajes();


            if (!form.checkValidity()) {

                form.reportValidity();

                return;
            }


            if (!horaSelect.value) {

                mostrarError(
                    "Seleccione una hora disponible."
                );

                return;
            }


            if (!motivoValido()) {

                mostrarError(
                    "El motivo de consulta contiene lenguaje no permitido."
                );

                return;
            }


            try {

                const formData =
                    new FormData(form);


                const datos =
                    Object.fromEntries(
                        formData.entries()
                    );


                const response =
                    await fetch(
                        "/admin/citas/nueva",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(datos)
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok || !data.ok) {

                    throw new Error(
                        data.mensaje ||
                        "No fue posible crear la cita."
                    );

                }


                exitoBox.innerHTML = `
                    <i class="fa-solid fa-circle-check mr-2"></i>
                    ${data.mensaje}
                `;


                exitoBox.classList.remove(
                    "hidden"
                );


                errorBox.classList.add(
                    "hidden"
                );


                form.reset();

                limpiarHoras();


                setTimeout(() => {

                    window.location.reload();

                }, 1500);


            } catch (error) {

                mostrarError(
                    error.message
                );

            }

        }
    );

});