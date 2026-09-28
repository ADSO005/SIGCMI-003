document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // ELEMENTOS
    // ========================================

    const buscarMedico =
        document.getElementById("buscarMedico");

    const filtroEstado =
        document.getElementById("filtroEstadoMedico");

    const filas =
        document.querySelectorAll(".medico-fila");

    const sinResultados =
        document.getElementById("sinResultadosMedicos");


    // ========================================
    // FILTRAR MÉDICOS
    // ========================================

    function filtrarMedicos() {

        const texto =
            buscarMedico.value
                .toLowerCase()
                .trim();

        const estadoSeleccionado =
            filtroEstado.value
                .toLowerCase()
                .trim();

        let encontrados = 0;


        filas.forEach((fila) => {

            const nombre =
                fila.dataset.nombre
                    .toLowerCase();

            const correo =
                fila.dataset.correo
                    .toLowerCase();

            const documento =
                fila.dataset.documento
                    .toLowerCase();

            const estado =
                fila.dataset.estado
                    .toLowerCase();


            const coincideTexto =
                nombre.includes(texto) ||
                correo.includes(texto) ||
                documento.includes(texto);


            const coincideEstado =
                !estadoSeleccionado ||
                estado === estadoSeleccionado;


            if (
                coincideTexto &&
                coincideEstado
            ) {

                fila.classList.remove("hidden");

                encontrados++;

            } else {

                fila.classList.add("hidden");
            }

        });


        // ========================================
        // SIN RESULTADOS
        // ========================================

        if (encontrados === 0) {

            sinResultados.classList.remove("hidden");

        } else {

            sinResultados.classList.add("hidden");
        }

    }


    // ========================================
    // EVENTOS
    // ========================================

    buscarMedico.addEventListener(
        "input",
        filtrarMedicos
    );

    filtroEstado.addEventListener(
        "change",
        filtrarMedicos
    );



    // =====================================================
    // VER MÉDICO
    // =====================================================

    const modalVerMedico =
        document.getElementById("modalVerMedico");

    const btnCerrarVerMedico =
        document.getElementById("btnCerrarVerMedico");

    const btnCerrarVerMedicoFooter =
        document.getElementById("btnCerrarVerMedicoFooter");

    const botonesVerMedico =
        document.querySelectorAll(".btnVerMedico");

    // =====================================================
    // EDITAR MÉDICO
    // =====================================================

    const modalEditarMedico =
        document.getElementById("modalEditarMedico");

    const btnCerrarEditarMedico =
        document.getElementById("btnCerrarEditarMedico");

    const btnCancelarEditarMedico =
        document.getElementById("btnCancelarEditarMedico");

    const formEditarMedico =
        document.getElementById("formEditarMedico");

    const botonesEditarMedico =
        document.querySelectorAll(".btnEditarMedico");

    const modalHorariosMedico =
        document.getElementById("modalHorariosMedico");

    const btnCerrarHorariosMedico =
        document.getElementById("btnCerrarHorariosMedico");

    const btnNuevoHorario =
        document.getElementById("btnNuevoHorario");

    const btnCancelarNuevoHorario =
        document.getElementById("btnCancelarNuevoHorario");

    const btnCancelarHorario =
        document.getElementById("btnCancelarHorario");

    const formNuevoHorario =
        document.getElementById("formNuevoHorario");

    const botonesHorariosMedico =
        document.querySelectorAll(".btnHorariosMedico");

    botonesHorariosMedico.forEach((boton) => {

        boton.addEventListener("click", () => {

            const id = boton.dataset.id;

            abrirGestionHorarios(id);

        });

    });

function cargarHorariosMedico(horarios) {

    const contenedorHorarios =
        document.getElementById("listaHorariosMedico");

    if (!contenedorHorarios) {
        console.error(
            "No existe el elemento #listaHorariosMedico"
        );
        return;
    }

    // Limpiar contenido anterior
    contenedorHorarios.innerHTML = "";

    // ============================================
    // SIN HORARIOS
    // ============================================

    if (!horarios || horarios.length === 0) {

        contenedorHorarios.innerHTML = `
            <div class="text-center py-10 text-slate-500">

                <i class="fa-solid fa-calendar-xmark text-4xl mb-3"></i>

                <p class="font-medium">
                    Este médico no tiene horarios registrados.
                </p>

            </div>
        `;

        return;
    }

    // ============================================
    // AGRUPAR POR PERÍODO
    // ============================================

    const periodos = {};

    horarios.forEach((horario) => {

        const fechaInicio =
            horario.fecha_inicio || "";

        const fechaFin =
            horario.fecha_fin || "";

        const clave =
            `${fechaInicio}_${fechaFin}`;

        if (!periodos[clave]) {

            periodos[clave] = {
                fechaInicio,
                fechaFin,
                horarios: []
            };
        }

        periodos[clave].horarios.push(horario);

    });

    // ============================================
    // ORDEN DE LOS DÍAS
    // ============================================

    const ordenDias = {
        Lunes: 1,
        Martes: 2,
        Miercoles: 3,
        Jueves: 4,
        Viernes: 5,
        Sabado: 6,
        Domingo: 7
    };

    // ============================================
    // FORMATEAR FECHA
    // ============================================

    const formatearFecha = (fecha) => {

        if (!fecha) {
            return "Fecha no definida";
        }

        const partes = fecha.split("-");

        if (partes.length !== 3) {
            return fecha;
        }

        const [anio, mes, dia] = partes;

        return `${dia}/${mes}/${anio}`;
    };

    // ============================================
    // CREAR CADA PERÍODO
    // ============================================

    Object.values(periodos).forEach((periodo) => {

        // Ordenar días
        periodo.horarios.sort((a, b) => {

            return (
                (ordenDias[a.dia_semana] || 99) -
                (ordenDias[b.dia_semana] || 99)
            );

        });

        const periodoHTML =
            document.createElement("div");

        periodoHTML.className =
            "border border-slate-200 rounded-2xl p-4 bg-white shadow-sm";

        periodoHTML.innerHTML = `

            <!-- CABECERA DEL PERÍODO -->

            <div class="flex items-center gap-3 mb-5">

                <div class="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">

                    <i class="fa-solid fa-calendar-days text-blue-600"></i>

                </div>

                <div>

                    <p class="text-sm text-slate-500">
                        Vigencia del horario
                    </p>

                    <p class="font-semibold text-slate-800">

                        ${formatearFecha(periodo.fechaInicio)}

                        hasta

                        ${formatearFecha(periodo.fechaFin)}

                    </p>

                </div>

            </div>


            <!-- HORARIOS -->

            <div class="space-y-3">

                ${periodo.horarios.map((horario) => {

                    const horaInicio =
                        horario.hora_inicio
                            ? horario.hora_inicio.substring(0, 5)
                            : "--:--";

                    const horaFin =
                        horario.hora_fin
                            ? horario.hora_fin.substring(0, 5)
                            : "--:--";


                    let estadoHTML = "";


                    if (horario.estado === "Aprobado") {

                        estadoHTML = `
                            <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">

                                <i class="fa-solid fa-circle-check"></i>

                                Aprobado

                            </span>
                        `;

                    } else if (horario.estado === "Pendiente") {

                        estadoHTML = `
                            <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">

                                <i class="fa-solid fa-clock"></i>

                                Pendiente

                            </span>
                        `;

                    } else {

                        estadoHTML = `
                            <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">

                                <i class="fa-solid fa-circle-xmark"></i>

                                ${horario.estado || "Sin estado"}

                            </span>
                        `;

                    }


                    return `

                        <div class="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">

                            <div class="flex items-center gap-3">

                                <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">

                                    <i class="fa-solid fa-clock text-blue-600"></i>

                                </div>


                                <div>

                                    <p class="font-semibold text-slate-800">

                                        ${horario.dia_semana}

                                    </p>

                                    <p class="text-sm text-slate-500">

                                        ${horaInicio} - ${horaFin}

                                    </p>

                                </div>

                            </div>


                            <div>

                                ${estadoHTML}

                            </div>

                        </div>

                    `;

                }).join("")}

            </div>

        `;

        contenedorHorarios.appendChild(
            periodoHTML
        );

    });
}

    async function abrirGestionHorarios(id) {

        try {

            const respuesta =
                await fetch(`/admin/medicos/${id}`);

            const data =
                await respuesta.json();

            if (!respuesta.ok || !data.ok) {

                throw new Error(
                    data.mensaje ||
                    "No se pudo obtener la información del médico."
                );

            }

            const medico = data.medico;

            const usuario = medico.Usuario;

            document.getElementById(
                "horario_medico_id"
            ).value = medico.id_medico;

            document.getElementById(
                "horarios_medico_nombre"
            ).textContent =
                `${usuario.nombres} ${usuario.apellidos}`;

            modalHorariosMedico.classList.remove("hidden");

            modalHorariosMedico.classList.add("flex");

            cargarHorariosMedico(
                medico.Horarios || []
            );

        } catch (error) {

            console.error(
                "Error al abrir horarios:",
                error
            );

            alert(error.message);

        }

    }

    function cerrarGestionHorarios() {

        modalHorariosMedico.classList.add("hidden");

        modalHorariosMedico.classList.remove("flex");

        document.getElementById(
            "formularioHorarioMedico"
        ).classList.add("hidden");

    }


    btnCerrarHorariosMedico.addEventListener(
        "click",
        cerrarGestionHorarios
    );

    btnCancelarNuevoHorario.addEventListener(
        "click",
        () => {

            document.getElementById(
                "formularioHorarioMedico"
            ).classList.add("hidden");

        }
    );

    btnCancelarHorario.addEventListener(
        "click",
        () => {

            document.getElementById(
                "formularioHorarioMedico"
            ).classList.add("hidden");

        }
    );

    btnNuevoHorario.addEventListener(
        "click",
        () => {

            document.getElementById(
                "formularioHorarioMedico"
            ).classList.remove("hidden");

        }
    );

    botonesEditarMedico.forEach((boton) => {

        boton.addEventListener("click", () => {

            const id = boton.dataset.id;

            editarMedico(id);

        });

    });

    btnCerrarEditarMedico.addEventListener(
        "click",
        cerrarModalEditarMedico
    );

    btnCancelarEditarMedico.addEventListener(
        "click",
        cerrarModalEditarMedico
    );

    modalEditarMedico.addEventListener(
        "click",
        (event) => {

            if (event.target === modalEditarMedico) {
                cerrarModalEditarMedico();
            }

        }
    );
    function cerrarModalEditarMedico() {
        modalEditarMedico.classList.add("hidden");
        modalEditarMedico.classList.remove("flex");
    }

    async function editarMedico(id) {
        try {
            const respuesta = await fetch(`/admin/medicos/${id}`);

            const data = await respuesta.json();

            if (!respuesta.ok || !data.ok) {
                throw new Error(
                    data.mensaje || "No se pudo obtener el médico."
                );
            }

            const medico = data.medico;
            const usuario = medico.Usuario;

            document.getElementById("editar_medico_id").value =
                medico.id_medico;

            document.getElementById("editar_nombres").value =
                usuario.nombres || "";

            document.getElementById("editar_apellidos").value =
                usuario.apellidos || "";

            document.getElementById("editar_tipo_documento").value =
                usuario.tipo_documento || "";

            document.getElementById("editar_numero_documento").value =
                usuario.numero_documento || "";

            document.getElementById("editar_correo").value =
                usuario.correo || "";

            document.getElementById("editar_telefono").value =
                usuario.telefono || "";

            document.getElementById("editar_especialidad_id").value =
                medico.especialidad_id || "";

            document.getElementById("editar_cedula_profesional").value =
                medico.cedula_profesional || "";

            document.getElementById("editar_anios_experiencia").value =
                medico.anios_experiencia ?? "";

            document.getElementById("editar_estado").value =
                usuario.estado ? "true" : "false";

            modalEditarMedico.classList.remove("hidden");
            modalEditarMedico.classList.add("flex");

        } catch (error) {

            console.error(
                "Error al cargar médico para editar:",
                error
            );

            alert(error.message);
        }
    }

    function cerrarModalVerMedico() {

        modalVerMedico.classList.add("hidden");

        modalVerMedico.classList.remove("flex");
    }


    async function verMedico(id) {
        try {
            const respuesta = await fetch(`/admin/medicos/${id}`);
            const data = await respuesta.json();

            if (!respuesta.ok || !data.ok) {
                throw new Error(
                    data.mensaje || "No se pudo obtener el médico."
                );
            }

            const medico = data.medico;
            const usuario = medico.Usuario;
            const especialidad = medico.Especialidad;
            const horarios = medico.Horarios || [];

            // ============================================
            // DATOS DEL MÉDICO
            // ============================================

            document.getElementById("ver_medico_nombre").textContent =
                `${usuario.nombres} ${usuario.apellidos}`;

            document.getElementById("ver_medico_nombre_completo").textContent =
                `${usuario.nombres} ${usuario.apellidos}`;

            document.getElementById("ver_medico_documento").textContent =
                `${usuario.tipo_documento} ${usuario.numero_documento}`;

            document.getElementById("ver_medico_correo").textContent =
                usuario.correo || "No registrado";

            document.getElementById("ver_medico_telefono").textContent =
                usuario.telefono || "No registrado";

            document.getElementById("ver_medico_especialidad").textContent =
                especialidad?.nombre || "Sin especialidad";

            document.getElementById("ver_medico_cedula").textContent =
                medico.cedula_profesional || "No registrada";

            document.getElementById("ver_medico_experiencia").textContent =
                medico.anios_experiencia != null
                    ? `${medico.anios_experiencia} años`
                    : "No registrada";

            document.getElementById("ver_medico_estado").textContent =
                usuario.estado ? "Activo" : "Inactivo";

            document.getElementById("ver_medico_fecha_registro").textContent =
                usuario.fecha_registro
                    ? new Date(usuario.fecha_registro).toLocaleDateString("es-CO")
                    : "No registrada";

            // ============================================
            // HORARIOS
            // ============================================

            const contenedorHorarios = document.getElementById(
                "ver_medico_horarios"
            );

            contenedorHorarios.innerHTML = "";

            if (horarios.length === 0) {
                contenedorHorarios.innerHTML = `
                <div class="text-center py-8 text-slate-500">
                    <i class="fa-solid fa-calendar-xmark text-3xl mb-3"></i>
                    <p>Este médico no tiene horarios registrados.</p>
                </div>
            `;
            } else {

                // ========================================
                // AGRUPAR POR PERÍODO
                // ========================================

                const periodos = {};

                horarios.forEach((horario) => {

                    const fechaInicio = horario.fecha_inicio;
                    const fechaFin = horario.fecha_fin;

                    const clave = `${fechaInicio}_${fechaFin}`;

                    if (!periodos[clave]) {
                        periodos[clave] = {
                            fechaInicio,
                            fechaFin,
                            horarios: []
                        };
                    }

                    periodos[clave].horarios.push(horario);
                });

                // ========================================
                // ORDEN DE LOS DÍAS
                // ========================================

                const ordenDias = {
                    Lunes: 1,
                    Martes: 2,
                    Miercoles: 3,
                    Jueves: 4,
                    Viernes: 5,
                    Sabado: 6,
                    Domingo: 7
                };

                // ========================================
                // FORMATEAR FECHA
                // ========================================

                const formatearFecha = (fecha) => {

                    if (!fecha) {
                        return "Fecha no definida";
                    }

                    const partes = fecha.split("-");

                    if (partes.length !== 3) {
                        return fecha;
                    }

                    const [anio, mes, dia] = partes;

                    return `${dia}/${mes}/${anio}`;
                };

                // ========================================
                // MOSTRAR CADA PERÍODO
                // ========================================

                Object.values(periodos).forEach((periodo) => {

                    periodo.horarios.sort((a, b) => {
                        return (
                            (ordenDias[a.dia_semana] || 99) -
                            (ordenDias[b.dia_semana] || 99)
                        );
                    });

                    const periodoHTML = document.createElement("div");

                    periodoHTML.className =
                        "border border-slate-200 rounded-2xl p-5 bg-white shadow-sm";

                    periodoHTML.innerHTML = `
                    <div class="flex items-center gap-3 mb-5">

                        <div class="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                            <i class="fa-solid fa-calendar-days text-blue-600 text-lg"></i>
                        </div>

                        <div>
                            <p class="text-sm text-slate-500">
                                Vigencia del horario
                            </p>

                            <p class="font-semibold text-slate-800">
                                ${formatearFecha(periodo.fechaInicio)}
                                hasta
                                ${formatearFecha(periodo.fechaFin)}
                            </p>
                        </div>

                    </div>

                    <div class="space-y-3">

                        ${periodo.horarios.map((horario) => {

                        const horaInicio =
                            horario.hora_inicio
                                ? horario.hora_inicio.substring(0, 5)
                                : "--:--";

                        const horaFin =
                            horario.hora_fin
                                ? horario.hora_fin.substring(0, 5)
                                : "--:--";

                        let estadoHTML = "";

                        if (horario.estado === "Aprobado") {

                            estadoHTML = `
                                    <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                                        <i class="fa-solid fa-circle-check"></i>
                                        Aprobado
                                    </span>
                                `;

                        } else if (horario.estado === "Pendiente") {

                            estadoHTML = `
                                    <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                        <i class="fa-solid fa-clock"></i>
                                        Pendiente
                                    </span>
                                `;

                        } else {

                            estadoHTML = `
                                    <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                                        <i class="fa-solid fa-circle-xmark"></i>
                                        ${horario.estado || "Sin estado"}
                                    </span>
                                `;
                        }

                        return `
                                <div class="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">

                                    <div class="flex items-center gap-3">

                                        <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <i class="fa-solid fa-clock text-blue-600"></i>
                                        </div>

                                        <div>

                                            <p class="font-semibold text-slate-800">
                                                ${horario.dia_semana}
                                            </p>

                                            <p class="text-sm text-slate-500">
                                                ${horaInicio} - ${horaFin}
                                            </p>

                                        </div>

                                    </div>

                                    ${estadoHTML}

                                </div>
                            `;
                    }).join("")}

                    </div>
                `;

                    contenedorHorarios.appendChild(periodoHTML);
                });
            }

            // ============================================
            // ABRIR MODAL
            // ============================================

            modalVerMedico.classList.remove("hidden");
            modalVerMedico.classList.add("flex");

        } catch (error) {

            console.error("Error al obtener médico:", error);

            alert(error.message);
        }
    }


    // =====================================================
    // BOTONES VER
    // =====================================================

    botonesVerMedico.forEach((boton) => {

        boton.addEventListener("click", () => {

            const id =
                boton.dataset.id;

            verMedico(id);

        });

    });


    // =====================================================
    // CERRAR MODAL
    // =====================================================

    btnCerrarVerMedico.addEventListener(
        "click",
        cerrarModalVerMedico
    );

    btnCerrarVerMedicoFooter.addEventListener(
        "click",
        cerrarModalVerMedico
    );


    modalVerMedico.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                modalVerMedico
            ) {

                cerrarModalVerMedico();

            }

        }
    );
    // =====================================================
    // GUARDAR CAMBIOS DEL MÉDICO
    // =====================================================

    formEditarMedico.addEventListener("submit", async (event) => {

        event.preventDefault();

        const id = document.getElementById(
            "editar_medico_id"
        ).value;

        const nombres = document.getElementById(
            "editar_nombres"
        ).value.trim();

        const apellidos = document.getElementById(
            "editar_apellidos"
        ).value.trim();

        const tipoDocumento = document.getElementById(
            "editar_tipo_documento"
        ).value;

        const numeroDocumento = document.getElementById(
            "editar_numero_documento"
        ).value.trim();

        const correo = document.getElementById(
            "editar_correo"
        ).value.trim();

        const telefono = document.getElementById(
            "editar_telefono"
        ).value.trim();

        const especialidadId = document.getElementById(
            "editar_especialidad_id"
        ).value;

        const cedulaProfesional = document.getElementById(
            "editar_cedula_profesional"
        ).value.trim();

        const aniosExperiencia = document.getElementById(
            "editar_anios_experiencia"
        ).value;

        const estado = document.getElementById(
            "editar_estado"
        ).value === "true";


        // =================================================
        // VALIDACIONES
        // =================================================

        if (
            !nombres ||
            !apellidos ||
            !tipoDocumento ||
            !numeroDocumento ||
            !correo ||
            !especialidadId ||
            !cedulaProfesional
        ) {

            alert(
                "Completa todos los campos obligatorios."
            );

            return;
        }


        // Validar correo

        const expresionCorreo =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!expresionCorreo.test(correo)) {

            alert(
                "Ingresa un correo electrónico válido."
            );

            return;
        }


        // Validar años de experiencia

        if (
            aniosExperiencia !== "" &&
            (
                Number(aniosExperiencia) < 0 ||
                Number(aniosExperiencia) > 60
            )
        ) {

            alert(
                "Los años de experiencia deben estar entre 0 y 60."
            );

            return;
        }


        try {

            const respuesta = await fetch(
                `/admin/medicos/${id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        nombres,

                        apellidos,

                        tipo_documento: tipoDocumento,

                        numero_documento: numeroDocumento,

                        correo,

                        telefono,

                        especialidad_id: especialidadId,

                        cedula_profesional: cedulaProfesional,

                        anios_experiencia: aniosExperiencia,

                        estado

                    })
                }
            );


            const data =
                await respuesta.json();


            if (
                !respuesta.ok ||
                !data.ok
            ) {

                throw new Error(
                    data.mensaje ||
                    "No se pudo actualizar el médico."
                );
            }


            alert(
                "Médico actualizado correctamente."
            );


            // Cerrar modal

            cerrarModalEditarMedico();


            // Recargar información

            window.location.reload();


        } catch (error) {

            console.error(
                "Error al actualizar médico:",
                error
            );

            alert(
                error.message
            );
        }

    });

    formNuevoHorario.addEventListener("submit", async (event) => {

        event.preventDefault();

        const medicoId =
            document.getElementById("horario_medico_id").value;

        const fechaInicio =
            document.getElementById("horario_fecha_inicio").value;

        const fechaFin =
            document.getElementById("horario_fecha_fin").value;

        const horaInicio =
            document.getElementById("horario_hora_inicio").value;

        const horaFin =
            document.getElementById("horario_hora_fin").value;

        const diasSeleccionados = [
            ...document.querySelectorAll(".diaHorario:checked")
        ].map((checkbox) => checkbox.value);

        // ============================================
        // VALIDACIONES
        // ============================================

        if (
            !fechaInicio ||
            !fechaFin ||
            !horaInicio ||
            !horaFin
        ) {
            alert("Completa todos los campos obligatorios.");
            return;
        }

        if (diasSeleccionados.length === 0) {
            alert("Selecciona al menos un día de atención.");
            return;
        }

        // ============================================
        // VALIDAR FECHA DE INICIO
        // ============================================

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const fechaInicioObj = new Date(`${fechaInicio}T00:00:00`);
        const fechaFinObj = new Date(`${fechaFin}T00:00:00`);

        if (fechaInicioObj <= hoy) {
            alert(
                "La fecha de inicio debe ser posterior a la fecha actual."
            );
            return;
        }

        // ============================================
        // VALIDAR FECHA FINAL
        // ============================================

        if (fechaFinObj < fechaInicioObj) {
            alert(
                "La fecha final no puede ser anterior a la fecha inicial."
            );
            return;
        }

        // ============================================
        // VALIDAR HORARIO
        // ============================================

        if (
            horaInicio < "07:00" ||
            horaInicio > "19:00"
        ) {
            alert(
                "La hora de inicio debe estar entre las 07:00 AM y las 07:00 PM."
            );
            return;
        }

        if (
            horaFin < "07:00" ||
            horaFin > "19:00"
        ) {
            alert(
                "La hora de finalización debe estar entre las 07:00 AM y las 07:00 PM."
            );
            return;
        }

        // ============================================
        // VALIDAR QUE FIN SEA MAYOR QUE INICIO
        // ============================================

        if (horaFin <= horaInicio) {
            alert(
                "La hora de finalización debe ser posterior a la hora de inicio."
            );
            return;
        }

        try {

            const respuesta = await fetch(
                `/admin/medicos/${medicoId}/horarios`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        fecha_inicio: fechaInicio,
                        fecha_fin: fechaFin,
                        dias_semana: diasSeleccionados,
                        hora_inicio: horaInicio,
                        hora_fin: horaFin
                    })
                }
            );


            const contenido = await respuesta.text();

            let data;

            try {
                data = JSON.parse(contenido);
            } catch (error) {
                console.error("Respuesta del servidor:", contenido);

                throw new Error(
                    `El servidor respondió con ${respuesta.status} y no devolvió JSON.`
                );
            }


            if (!respuesta.ok || !data.ok) {

                throw new Error(
                    data.mensaje ||
                    "No se pudo registrar el horario."
                );
            }


            alert(
                "Horario registrado correctamente."
            );


            // ========================================
            // LIMPIAR FORMULARIO
            // ========================================

            formNuevoHorario.reset();

            document
                .getElementById("formularioHorarioMedico")
                .classList.add("hidden");


            // ========================================
            // RECARGAR HORARIOS
            // ========================================

            abrirGestionHorarios(medicoId);


        } catch (error) {

            console.error(
                "Error al guardar horario:",
                error
            );

            alert(error.message);
        }

    });

}); 