document.addEventListener("DOMContentLoaded", () => {

    // ==================================================
    // DATOS DE LOS MÉDICOS
    // ==================================================

    const medicosHorarios = window.medicosHorarios || [];


    // ==================================================
    // BÚSQUEDA
    // ==================================================

    const buscador = document.getElementById("buscarMedicoHorario");

    const tarjetas = document.querySelectorAll(
        ".tarjetaMedicoHorario"
    );

    const mensajeSinResultados =
        document.getElementById("sinResultadosMedicos");


    if (buscador) {

        buscador.addEventListener("input", () => {

            const texto = buscador.value
                .trim()
                .toLowerCase();

            let encontrados = 0;

            tarjetas.forEach((tarjeta) => {

                const nombre =
                    (tarjeta.dataset.nombre || "").toLowerCase();

                const especialidad =
                    (tarjeta.dataset.especialidad || "").toLowerCase();

                const coincide =
                    nombre.includes(texto) ||
                    especialidad.includes(texto);

                if (coincide) {

                    tarjeta.classList.remove("hidden");

                    encontrados++;

                } else {

                    tarjeta.classList.add("hidden");

                }

            });

            if (mensajeSinResultados) {

                mensajeSinResultados.classList.toggle(
                    "hidden",
                    encontrados !== 0
                );

            }

        });

    }


    // ==================================================
    // ELEMENTOS DEL MODAL
    // ==================================================

    const modal =
        document.getElementById("modalGestionarHorarios");

    const btnCerrar =
        document.getElementById("btnCerrarGestionHorarios");

    const btnCerrar2 =
        document.getElementById("btnCerrarGestionHorarios2");

    const btnAgregarHorario =
        document.getElementById("btnAgregarHorarioModal");

    const formularioNuevoHorario =
        document.getElementById("formularioNuevoHorario");

    const btnCancelarNuevoHorario =
        document.getElementById("btnCancelarNuevoHorario");

    const btnCancelarNuevoHorario2 =
        document.getElementById("btnCancelarNuevoHorario2");

    const formNuevoHorario =
        document.getElementById("formNuevoHorario");

    const nombreMedico =
        document.getElementById("modalNombreMedico");

    const especialidadMedico =
        document.getElementById("modalEspecialidadMedico");

    const listaHorarios =
        document.getElementById("listaHorariosModal");

    const sinHorarios =
        document.getElementById("sinHorariosModal");

    const contador =
        document.getElementById("contadorHorariosModal");




    // ==================================================
    // FORMATEAR FECHA
    // ==================================================

    function formatearFecha(fecha) {

        if (!fecha) {
            return "Sin fecha";
        }

        const partes = fecha.split("-");

        if (partes.length !== 3) {
            return fecha;
        }

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }


    // ==================================================
    // FORMATEAR HORA
    // ==================================================

    function formatearHora(hora) {

        if (!hora) {
            return "";
        }

        const partes =
            hora.substring(0, 5).split(":");

        let horas =
            parseInt(partes[0], 10);

        const minutos =
            partes[1];

        const periodo =
            horas >= 12 ? "PM" : "AM";

        if (horas === 0) {

            horas = 12;

        } else if (horas > 12) {

            horas -= 12;

        }

        return `${horas}:${minutos} ${periodo}`;
    }


    // ==================================================
    // NOMBRE DE LOS DÍAS
    // ==================================================

    const nombresDias = {
        Lunes: "Lunes",
        Martes: "Martes",
        Miercoles: "Miércoles",
        Jueves: "Jueves",
        Viernes: "Viernes",
        Sabado: "Sábado",
        Domingo: "Domingo"
    };


    // ==================================================
    // ORDEN DE LOS DÍAS
    // ==================================================

    const diasOrdenados = [
        "Lunes",
        "Martes",
        "Miercoles",
        "Jueves",
        "Viernes",
        "Sabado",
        "Domingo"
    ];


    // ==================================================
    // AGRUPAR HORARIOS POR PERÍODO
    // ==================================================

    function agruparHorarios(horarios) {
        const grupos = {};

        horarios.forEach(horario => {

            // Un período se identifica únicamente por:
            // fecha_inicio + fecha_fin + estado
            const clave =
                `${horario.fecha_inicio}_${horario.fecha_fin}_${horario.estado}`;

            if (!grupos[clave]) {
                grupos[clave] = {
                    fecha_inicio: horario.fecha_inicio,
                    fecha_fin: horario.fecha_fin,
                    estado: horario.estado,
                    dias: [],
                    ids: [],
                    horarios: []
                };
            }

            grupos[clave].dias.push(horario.dia_semana);
            grupos[clave].ids.push(horario.id_horario);

            // Guardamos las horas individuales de cada día
            grupos[clave].horarios.push({
                dia_semana: horario.dia_semana,
                hora_inicio: horario.hora_inicio,
                hora_fin: horario.hora_fin
            });
        });

        return Object.values(grupos);
    }


    // ==================================================
    // CREAR TARJETA DE PERÍODO
    // ==================================================

    function crearPeriodoHTML(periodo) {

        // Ordenar días de lunes a domingo
        periodo.dias.sort(
            (a, b) =>
                diasOrdenados.indexOf(a) -
                diasOrdenados.indexOf(b)
        );



        // Crear botones de días
        const diasHTML = periodo.dias.map((dia) => {

            return `
            <span class="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm font-semibold">
                ${nombresDias[dia] || dia}
            </span>
        `;

        }).join("");


        // Clase visual según estado
        const estadoClase =
            periodo.estado === "Aprobado"
                ? "bg-green-100 text-green-700"
                : periodo.estado === "Rechazado"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700";


        return `
        <div class="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">

            <!-- CABECERA DEL PERÍODO -->

            <div class="px-5 py-4 bg-slate-50 border-b border-slate-200">

                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                    <div>

                        <div class="flex items-center gap-2 mb-2">

                            <i class="fa-regular fa-calendar text-blue-600"></i>

                            <span class="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Período de atención
                            </span>

                        </div>


                        <p class="text-lg font-bold text-slate-800">

                            ${formatearFecha(periodo.fecha_inicio)}

                            <span class="text-slate-400 mx-2">
                                →
                            </span>

                            ${formatearFecha(periodo.fecha_fin)}

                        </p>

                    </div>


                    <span class="w-fit px-3 py-1.5 rounded-full text-xs font-bold ${estadoClase}">
                        ${periodo.estado}
                    </span>

                </div>

            </div>


            <!-- INFORMACIÓN DEL HORARIO -->

            <div class="p-5">

                <!-- DÍAS DE ATENCIÓN -->

                <div class="mb-5">

                    <p class="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
                        Días de atención
                    </p>


                    <div class="flex flex-wrap gap-2">

                        ${diasHTML}

                    </div>

                </div>


                <!-- HORARIOS POR DÍA -->

                <div>

                    <p class="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                        Horario de atención
                    </p>

                    <div class="space-y-2">

                        ${periodo.horarios.map(horario => `
                            <div class="flex items-center justify-between gap-4 text-slate-800">

                                <div class="flex items-center gap-2">

                                    <i class="fa-regular fa-calendar text-blue-600"></i>

                                    <span class="font-semibold">
                                        ${horario.dia_semana}
                                    </span>

                                </div>

                                <div class="flex items-center gap-2">

                                    <i class="fa-regular fa-clock text-slate-400"></i>

                                    <span class="font-bold">
                                        ${formatearHora(horario.hora_inicio)}
                                    </span>

                                    <span class="text-slate-400">
                                        →
                                    </span>

                                    <span class="font-bold">
                                        ${formatearHora(horario.hora_fin)}
                                    </span>

                                </div>

                            </div>
                        `).join("")}

                    </div>

                </div>


                    <!-- ACCIONES -->

                    <div class="flex items-center gap-2">

                        <button
                            type="button"
                            class="btnEditarHorario w-10 h-10 rounded-xl text-blue-600 hover:bg-blue-100 transition"
                            title="Editar horario"
                            data-horarios-ids="${periodo.ids.join(",")}"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>


                        <button
                            type="button"
                            class="btnEliminarHorario w-10 h-10 rounded-xl text-red-600 hover:bg-red-100 transition"
                            title="Eliminar período completo"
                            data-horarios-ids="${periodo.ids.join(",")}"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>

                </div>

            </div>

        </div>
    `;
    }

    document.addEventListener("click", (event) => {

        const botonEliminar =
            event.target.closest(".btnEliminarHorario");

        if (!botonEliminar) {
            return;
        }

        const idsTexto =
            botonEliminar.getAttribute("data-horarios-ids");

        console.log("IDS RECIBIDOS:", idsTexto);

        if (!idsTexto) {
            console.error("El botón no tiene data-horarios-ids");
            return;
        }

        const horariosIds = idsTexto
            .split(",")
            .map(id => Number(id))
            .filter(id => Number.isInteger(id));

        console.log("IDS A ELIMINAR:", horariosIds);

        if (horariosIds.length === 0) {
            console.error("No hay IDs válidos");
            return;
        }

        eliminarHorario(horariosIds);
    });


    document.addEventListener("click", (event) => {

        const botonEditar =
            event.target.closest(".btnEditarHorario");

        if (!botonEditar) {
            return;
        }

        const idsTexto =
            botonEditar.dataset.horariosIds;

        if (!idsTexto) {
            console.error(
                "El botón no tiene data-horarios-ids"
            );
            return;
        }

        const horariosIds =
            idsTexto
                .split(",")
                .map(id => Number(id))
                .filter(id => Number.isInteger(id));

        if (horariosIds.length === 0) {
            console.error(
                "No hay IDs válidos para editar"
            );
            return;
        }

        editarHorario(horariosIds);
    });


    // ==================================================
    // ABRIR MODAL
    // ==================================================

    function abrirGestionHorarios(medicoId) {

        // Siempre comenzar en estado limpio
        resetearFormularioHorario();

        const medico = medicosHorarios.find((item) => {
            return String(item.id_medico) === String(medicoId);
        });

        if (!medico) {

            console.error(
                "No se encontró el médico:",
                medicoId
            );

            return;
        }

        // ==============================
        // INFORMACIÓN DEL MÉDICO
        // ==============================

        nombreMedico.textContent =
            medico.nombre;

        especialidadMedico.textContent =
            medico.especialidad;


        // ==============================
        // OBTENER HORARIOS
        // ==============================

        const horarios =
            medico.horarios || [];


        // ==============================
        // LIMPIAR LISTA
        // ==============================

        listaHorarios.innerHTML = "";


        // ==============================
        // SIN HORARIOS
        // ==============================

        if (horarios.length === 0) {

            sinHorarios.classList.remove("hidden");

            contador.textContent =
                "0 horarios";

        } else {

            sinHorarios.classList.add("hidden");

            contador.textContent =
                horarios.length === 1
                    ? "1 horario"
                    : `${horarios.length} horarios`;


            // ==============================
            // AGRUPAR HORARIOS
            // ==============================

            const periodos =
                agruparHorarios(horarios);


            // ==============================
            // MOSTRAR PERIODOS
            // ==============================

            periodos.forEach((periodo) => {

                listaHorarios.insertAdjacentHTML(
                    "beforeend",
                    crearPeriodoHTML(periodo)
                );

            });

        }


        // ==============================
        // GUARDAR MÉDICO ACTUAL
        // ==============================

        modal.dataset.medicoId =
            medico.id_medico;

        const inputMedico =
            document.getElementById("horario_medico_id");

        console.log(
            "Input horario_medico_id:",
            inputMedico
        );

        if (inputMedico) {
            inputMedico.value = medico.id_medico;
        }
        // ==============================
        // ABRIR MODAL
        // ==============================

        modal.classList.remove("hidden");

        document.body.classList.add(
            "overflow-hidden"
        );
    }


    // ==================================================
    // BOTONES "GESTIONAR HORARIOS"
    // ==================================================
    // ==================================================
    // BOTONES "GESTIONAR HORARIOS"
    // ==================================================

    const botonesGestionar =
        document.querySelectorAll(".btnGestionarHorario");


    botonesGestionar.forEach((boton) => {

        boton.addEventListener("click", () => {

            const medicoId =
                boton.dataset.medicoId;

            console.log(
                "Click en gestionar horarios"
            );

            console.log(
                "ID del médico:",
                medicoId
            );

            abrirGestionHorarios(medicoId);

        });

    });




    // ==================================================
    // FUNCIÓN EDITAR HORARIO
    // ==================================================
    function editarHorario(horariosIds) {

        const medicoId =
            modal.dataset.medicoId;

        const medico =
            medicosHorarios.find(
                (item) =>
                    String(item.id_medico) ===
                    String(medicoId)
            );

        if (!medico) {
            alert("No se encontró el médico.");
            return;
        }

        // ============================================
        // CONVERTIR IDS A NÚMEROS
        // ============================================

        const ids =
            horariosIds.map((id) => Number(id));

        // ============================================
        // BUSCAR TODOS LOS HORARIOS DEL PERÍODO
        // ============================================

        const horariosPeriodo =
            (medico.horarios || []).filter(
                (item) =>
                    ids.includes(
                        Number(item.id_horario)
                    )
            );

        if (horariosPeriodo.length === 0) {
            alert("No se encontraron los horarios.");
            return;
        }

        console.log(
            "Horarios seleccionados para editar:",
            horariosPeriodo
        );

        // ============================================
        // GUARDAR IDS EN EL FORMULARIO
        // ============================================

        formNuevoHorario.dataset.editarIds =
            ids.join(",");

        // ============================================
        // CAMBIAR TÍTULO
        // ============================================

        establecerModoEditarHorario();

        // ============================================
        // HORARIO BASE
        // ============================================

        const horarioBase =
            horariosPeriodo[0];

        // ============================================
        // CARGAR FECHAS
        // ============================================

        const inputFechaInicio =
            document.getElementById(
                "horario_fecha_inicio"
            );

        const inputFechaFin =
            document.getElementById(
                "horario_fecha_fin"
            );

        if (inputFechaInicio) {
            inputFechaInicio.value =
                horarioBase.fecha_inicio || "";
        }

        if (inputFechaFin) {
            inputFechaFin.value =
                horarioBase.fecha_fin || "";
        }

        // ============================================
        // LIMPIAR TODOS LOS DÍAS
        // ============================================

        document
            .querySelectorAll(".diaHorario")
            .forEach((checkbox) => {
                checkbox.checked = false;
            });

        // ============================================
        // OCULTAR Y LIMPIAR HORAS
        // ============================================

        document
            .querySelectorAll(".horasDia")
            .forEach((contenedor) => {

                contenedor.classList.add("hidden");

                const inputInicio =
                    contenedor.querySelector(
                        ".horaInicioDia"
                    );

                const inputFin =
                    contenedor.querySelector(
                        ".horaFinDia"
                    );

                if (inputInicio) {
                    inputInicio.value = "";
                }

                if (inputFin) {
                    inputFin.value = "";
                }
            });

        // ============================================
        // CARGAR CADA DÍA CON SUS HORAS
        // ============================================

        horariosPeriodo.forEach((horario) => {

            const checkbox =
                document.querySelector(
                    `.diaHorario[value="${horario.dia_semana}"]`
                );

            const contenedor =
                document.querySelector(
                    `.horasDia[data-dia="${horario.dia_semana}"]`
                );

            if (!checkbox || !contenedor) {

                console.warn(
                    `No se encontró el formulario para ${horario.dia_semana}`
                );

                return;
            }

            // Marcar día
            checkbox.checked = true;

            // Mostrar las horas
            contenedor.classList.remove("hidden");

            // Hora de inicio
            const inputInicio =
                contenedor.querySelector(
                    ".horaInicioDia"
                );

            if (inputInicio) {

                inputInicio.value =
                    horario.hora_inicio
                        ? horario.hora_inicio.substring(0, 5)
                        : "";
            }

            // Hora de finalización
            const inputFin =
                contenedor.querySelector(
                    ".horaFinDia"
                );

            if (inputFin) {

                inputFin.value =
                    horario.hora_fin
                        ? horario.hora_fin.substring(0, 5)
                        : "";
            }
        });

        // ============================================
        // DEBUG
        // ============================================

        console.log(
            "🔵 MODO EDICIÓN ACTIVADO"
        );

        console.log(
            "IDs:",
            formNuevoHorario.dataset.editarIds
        );

        console.log(
            "Horarios cargados:",
            horariosPeriodo
        );

        // ============================================
        // MOSTRAR FORMULARIO
        // ============================================

        formularioNuevoHorario.classList.remove(
            "hidden"
        );

        // ============================================
        // DESPLAZAR AL FORMULARIO
        // ============================================

        formularioNuevoHorario.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }




    // ==================================================
    // FUNCIÓN ELIMINAR HORARIO
    // ==================================================

    async function eliminarHorario(horariosIds) {

        const confirmar = confirm(
            "¿Estás seguro de que deseas eliminar este período completo?"
        );

        if (!confirmar) {
            return;
        }

        try {

            const respuesta = await fetch(
                "/admin/horarios",
                {
                    method: "DELETE",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        ids: horariosIds
                    })
                }
            );

            const data = await respuesta.json();

            if (!respuesta.ok || !data.ok) {

                throw new Error(
                    data.mensaje ||
                    "No se pudo eliminar el período."
                );

            }

            alert(
                "Período de horario eliminado correctamente."
            );

            window.location.reload();

        } catch (error) {

            console.error(
                "Error al eliminar período:",
                error
            );

            alert(error.message);
        }
    }


    // ==================================================
    // BOTONES "AGREGAR" DE CADA MÉDICO
    // ==================================================

    document
        .querySelectorAll(".btnNuevoHorarioMedico")
        .forEach((boton) => {

            boton.addEventListener("click", () => {

                const medicoId =
                    boton.dataset.medicoId;

                console.log(
                    "Agregar horario para médico:",
                    medicoId
                );

                abrirGestionHorarios(medicoId);

                setTimeout(() => {

                    if (formularioNuevoHorario) {

                        formularioNuevoHorario.classList.remove("hidden");

                        const fechaInicio =
                            document.getElementById(
                                "horario_fecha_inicio"
                            );

                        if (fechaInicio) {
                            fechaInicio.focus();
                        }

                    }

                }, 50);

            });

        });


    function establecerModoNuevoHorario() {

        const titulo =
            document.getElementById("tituloFormularioHorario");

        const descripcion =
            document.getElementById("descripcionFormularioHorario");

        const icono =
            document.getElementById("iconoEstadoFormularioHorario");

        const boton =
            document.getElementById("btnGuardarHorario");

        const iconoBoton =
            document.getElementById("iconoBotonHorario");

        const textoBoton =
            document.getElementById("textoBotonHorario");


        // Título
        if (titulo) {
            titulo.textContent = "Nuevo horario";
        }

        // Descripción
        if (descripcion) {
            descripcion.textContent =
                "Configura el período y los días de atención.";
        }

        // Icono del encabezado
        if (icono) {

            icono.classList.remove(
                "bg-blue-100",
                "text-blue-600"
            );

            icono.classList.add(
                "bg-green-100",
                "text-green-600"
            );

            icono.innerHTML =
                '<i class="fa-solid fa-plus"></i>';
        }

        // Botón
        if (boton) {

            boton.classList.remove(
                "bg-blue-600",
                "hover:bg-blue-700"
            );

            boton.classList.add(
                "bg-green-600",
                "hover:bg-green-700"
            );
        }

        // Icono del botón
        if (iconoBoton) {
            iconoBoton.className =
                "fa-solid fa-floppy-disk mr-2";
        }

        // Texto del botón
        if (textoBoton) {
            textoBoton.textContent =
                "Guardar horario";
        }
    }


    function establecerModoEditarHorario() {

        const titulo =
            document.getElementById("tituloFormularioHorario");

        const descripcion =
            document.getElementById("descripcionFormularioHorario");

        const icono =
            document.getElementById("iconoEstadoFormularioHorario");

        const boton =
            document.getElementById("btnGuardarHorario");

        const iconoBoton =
            document.getElementById("iconoBotonHorario");

        const textoBoton =
            document.getElementById("textoBotonHorario");


        // Título
        if (titulo) {
            titulo.textContent = "Editar horario";
        }

        // Descripción
        if (descripcion) {
            descripcion.textContent =
                "Modifica el período y los días de atención.";
        }

        // Icono del encabezado
        if (icono) {

            icono.classList.remove(
                "bg-green-100",
                "text-green-600"
            );

            icono.classList.add(
                "bg-blue-100",
                "text-blue-600"
            );

            icono.innerHTML =
                '<i class="fa-solid fa-pen"></i>';
        }

        // Botón
        if (boton) {

            boton.classList.remove(
                "bg-green-600",
                "hover:bg-green-700"
            );

            boton.classList.add(
                "bg-blue-600",
                "hover:bg-blue-700"
            );
        }

        // Icono del botón
        if (iconoBoton) {
            iconoBoton.className =
                "fa-solid fa-pen-to-square mr-2";
        }

        // Texto del botón
        if (textoBoton) {
            textoBoton.textContent =
                "Actualizar horario";
        }
    }


    function resetearFormularioHorario() {

        if (!formularioNuevoHorario) {
            return;
        }

        // Salir del modo edición
        delete formNuevoHorario.dataset.editarIds;

        establecerModoNuevoHorario();

        // Ocultar formulario
        formularioNuevoHorario.classList.add("hidden");

        // Limpiar campos
        if (formNuevoHorario) {
            formNuevoHorario.reset();
        }

        // Desmarcar días
        document
            .querySelectorAll(".diaHorario")
            .forEach((checkbox) => {
                checkbox.checked = false;
            });

        // Ocultar y limpiar horas
        document
            .querySelectorAll(".horasDia")
            .forEach((contenedor) => {

                contenedor.classList.add("hidden");

                const horaInicio =
                    contenedor.querySelector(".horaInicioDia");

                const horaFin =
                    contenedor.querySelector(".horaFinDia");

                if (horaInicio) {
                    horaInicio.value = "";
                }

                if (horaFin) {
                    horaFin.value = "";
                }
            });
    }
    // ==================================================
    // CERRAR MODAL
    // ==================================================

    function cerrarModal() {

        if (!modal) return;

        // Limpiar cualquier estado de edición
        resetearFormularioHorario();

        // Cerrar modal
        modal.classList.add("hidden");

        document.body.classList.remove(
            "overflow-hidden"
        );
    }


    if (btnCerrar) {

        btnCerrar.addEventListener(
            "click",
            cerrarModal
        );

    }


    if (btnCerrar2) {

        btnCerrar2.addEventListener(
            "click",
            cerrarModal
        );

    }


    // Cerrar haciendo clic fuera
    if (modal) {

        modal.addEventListener("click", (event) => {

            if (event.target === modal) {

                cerrarModal();

            }

        });

    }


    // Cerrar con ESC
    document.addEventListener("keydown", (event) => {

        if (
            event.key === "Escape" &&
            modal &&
            !modal.classList.contains("hidden")
        ) {

            cerrarModal();

        }

    });

    if (btnAgregarHorario) {

        btnAgregarHorario.addEventListener("click", () => {

            formularioNuevoHorario.classList.remove("hidden");

            document
                .getElementById("horario_fecha_inicio")
                ?.focus();

        });

    }
    function cerrarFormularioNuevoHorario() {

        if (!formularioNuevoHorario) {
            return;
        }

        formularioNuevoHorario.classList.add("hidden");

        if (formNuevoHorario) {
            formNuevoHorario.reset();
        }

    }


    if (btnCancelarNuevoHorario) {

        btnCancelarNuevoHorario.addEventListener(
            "click",
            cerrarFormularioNuevoHorario
        );

    }

    if (btnCancelarNuevoHorario2) {

        btnCancelarNuevoHorario2.addEventListener(
            "click",
            cerrarFormularioNuevoHorario
        );

    }


    // ==========================================================
    // MOSTRAR / OCULTAR HORAS POR DÍA
    // ==========================================================

    document
        .querySelectorAll(".diaHorario")
        .forEach((checkbox) => {

            checkbox.addEventListener("change", () => {

                const dia = checkbox.value;

                const contenedor =
                    document.querySelector(
                        `.horasDia[data-dia="${dia}"]`
                    );

                if (!contenedor) {
                    return;
                }

                if (checkbox.checked) {

                    contenedor.classList.remove("hidden");

                } else {

                    contenedor.classList.add("hidden");

                    const horaInicio =
                        contenedor.querySelector(
                            ".horaInicioDia"
                        );

                    const horaFin =
                        contenedor.querySelector(
                            ".horaFinDia"
                        );

                    if (horaInicio) {
                        horaInicio.value = "";
                    }

                    if (horaFin) {
                        horaFin.value = "";
                    }
                }
            });
        });
    // ==================================================
    // GUARDAR NUEVO HORARIO
    // ==================================================

    if (formNuevoHorario) {

        formNuevoHorario.addEventListener("submit", async (event) => {

            event.preventDefault();

            // ============================================
            // OBTENER DATOS DEL FORMULARIO
            // ============================================

            const medicoId =
                document.getElementById("horario_medico_id").value;

            const fechaInicio =
                document.getElementById("horario_fecha_inicio").value;

            const fechaFin =
                document.getElementById("horario_fecha_fin").value;


            const diasSeleccionados = [
                ...document.querySelectorAll(".diaHorario:checked")
            ].map((checkbox) => {

                const dia = checkbox.value;

                const contenedor = document.querySelector(
                    `.horasDia[data-dia="${dia}"]`
                );

                const horaInicio =
                    contenedor?.querySelector(".horaInicioDia")?.value || "";

                const horaFin =
                    contenedor?.querySelector(".horaFinDia")?.value || "";

                return {
                    dia_semana: dia,
                    hora_inicio: horaInicio,
                    hora_fin: horaFin
                };
            });



            const editarIds =
                formNuevoHorario.dataset.editarIds || "";

            // ============================================
            // VALIDAR MÉDICO
            // ============================================

            if (!medicoId) {

                alert(
                    "No se ha seleccionado ningún médico."
                );

                return;
            }





            // ============================================
            // VALIDAR DÍAS
            // ============================================

            if (diasSeleccionados.length === 0) {

                alert(
                    "Selecciona al menos un día de atención."
                );

                return;
            }

            for (const horario of diasSeleccionados) {

                if (!horario.hora_inicio || !horario.hora_fin) {
                    alert(
                        `Completa la hora de inicio y finalización para ${horario.dia_semana}.`
                    );
                    return;
                }

                if (
                    horario.hora_inicio < "07:00" ||
                    horario.hora_inicio > "19:00"
                ) {
                    alert(
                        `La hora de inicio del ${horario.dia_semana} debe estar entre las 07:00 y las 19:00.`
                    );
                    return;
                }

                if (
                    horario.hora_fin < "07:00" ||
                    horario.hora_fin > "19:00"
                ) {
                    alert(
                        `La hora de finalización del ${horario.dia_semana} debe estar entre las 07:00 y las 19:00.`
                    );
                    return;
                }

                if (horario.hora_fin <= horario.hora_inicio) {
                    alert(
                        `La hora de finalización debe ser posterior a la hora de inicio para ${horario.dia_semana}.`
                    );
                    return;
                }
            }


            // ============================================
            // VALIDAR FECHAS
            // ============================================

            const hoy = new Date();

            hoy.setHours(0, 0, 0, 0);

            const fechaInicioObj =
                new Date(`${fechaInicio}T00:00:00`);

            const fechaFinObj =
                new Date(`${fechaFin}T00:00:00`);


            if (fechaInicioObj <= hoy) {

                alert(
                    "La fecha de inicio debe ser posterior a la fecha actual."
                );

                return;
            }


            if (fechaFinObj < fechaInicioObj) {

                alert(
                    "La fecha final no puede ser anterior a la fecha inicial."
                );

                return;
            }


            // ============================================
            // LA SEMANA DEBE SER LUNES → DOMINGO
            // ============================================

            if (fechaInicioObj.getDay() !== 1) {

                alert(
                    "La fecha de inicio debe ser un lunes."
                );

                return;
            }


            if (fechaFinObj.getDay() !== 0) {

                alert(
                    "La fecha de finalización debe ser un domingo."
                );

                return;
            }


            // ============================================
            // VALIDAR MÁXIMO 7 DÍAS
            // ============================================

            const diferenciaMilisegundos =
                fechaFinObj.getTime() -
                fechaInicioObj.getTime();

            const diferenciaDias =
                Math.floor(
                    diferenciaMilisegundos /
                    (1000 * 60 * 60 * 24)
                ) + 1;


            if (diferenciaDias !== 7) {

                alert(
                    "El período debe tener exactamente 7 días, desde lunes hasta domingo."
                );

                return;
            }


            if (diferenciaDias > 7) {

                alert(
                    "El período de horario no puede superar 7 días. Debe corresponder a una semana de lunes a domingo."
                );

                return;
            }

            if (fechaInicioObj.getDay() !== 1) {

                alert(
                    "La fecha de inicio debe ser un lunes."
                );

                return;
            }

            if (fechaFinObj.getDay() !== 0) {

                alert(
                    "La fecha de finalización debe ser un domingo."
                );

                return;
            }







            // ============================================
            // ENVIAR AL SERVIDOR
            // ============================================

            try {

                let respuesta;

                if (editarIds) {

                    // ============================================
                    // EDITAR PERÍODO COMPLETO
                    // ============================================

                    const ids = formNuevoHorario.dataset.editarIds
                        .split(",")
                        .map(id => Number(id))
                        .filter(id => Number.isInteger(id));

                    console.log(
                        "IDs del período a editar:",
                        ids
                    );

                    respuesta = await fetch(
                        "/admin/horarios",
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({
                                ids: ids,
                                fecha_inicio: fechaInicio,
                                fecha_fin: fechaFin,
                                horarios: diasSeleccionados
                            })
                        }
                    );

                } else {

                    // ============================================
                    // CREAR NUEVO HORARIO
                    // ============================================

                    respuesta = await fetch(
                        `/admin/medicos/${medicoId}/horarios`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({
                                fecha_inicio: fechaInicio,
                                fecha_fin: fechaFin,
                                horarios: diasSeleccionados
                            })
                        }
                    );
                }

                // ========================================
                // LEER RESPUESTA
                // ========================================

                const contenido =
                    await respuesta.text();

                let data;

                try {

                    data =
                        JSON.parse(contenido);

                } catch (error) {

                    console.error(
                        "Respuesta del servidor:",
                        contenido
                    );

                    throw new Error(
                        `El servidor respondió con ${respuesta.status} y no devolvió JSON.`
                    );
                }


                // ========================================
                // VALIDAR RESPUESTA
                // ========================================

                if (
                    !respuesta.ok ||
                    !data.ok
                ) {

                    throw new Error(
                        data.mensaje ||
                        "No se pudo registrar el horario."
                    );
                }


                // ========================================
                // ÉXITO
                // ========================================

                alert(
                    editarIds
                        ? "Período de horario actualizado correctamente."
                        : "Horario registrado correctamente."
                );


                // ========================================
                // LIMPIAR FORMULARIO
                // ========================================

                formNuevoHorario.reset();

                delete formNuevoHorario.dataset.editarIds;


                // ========================================
                // OCULTAR FORMULARIO
                // ========================================

                formularioNuevoHorario.classList.add(
                    "hidden"
                );


                // ========================================
                // ACTUALIZAR DATOS
                // ========================================

                window.location.reload();


            } catch (error) {

                console.error(
                    "Error al guardar horario:",
                    error
                );

                alert(
                    error.message ||
                    "Ocurrió un error al registrar el horario."
                );

            }

        });

    }

    btnAgregarHorarioModal.addEventListener("click", () => {

        // Limpiar cualquier estado anterior
        resetearFormularioHorario();

        // Mostrar formulario como nuevo horario
        formularioNuevoHorario.classList.remove("hidden");

        // Enfocar fecha de inicio
        document
            .getElementById("horario_fecha_inicio")
            ?.focus();
    });

});