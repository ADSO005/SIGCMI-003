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

            const respuesta = await fetch(
                `/admin/medicos/${id}`
            );

            const data = await respuesta.json();

            if (!respuesta.ok || !data.ok) {

                throw new Error(
                    data.mensaje ||
                    "No se pudo obtener el médico."
                );
            }

            const medico = data.medico;

            const usuario = medico.Usuario;

            const especialidad = medico.Especialidad;

            const horarios = medico.Horarios || [];

            const contenedorHorarios = document.getElementById("ver_medico_horarios");

            if (horarios.length === 0) {
                contenedorHorarios.innerHTML = `
        <div class="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <i class="fa-solid fa-calendar-xmark text-slate-400 text-lg"></i>
            <p class="text-sm text-slate-500">
                Este médico no tiene horarios registrados.
            </p>
        </div>
    `;
            } else {
                contenedorHorarios.innerHTML = horarios.map((horario) => {
                    const horaInicio = horario.hora_inicio?.slice(0, 5) || "";
                    const horaFin = horario.hora_fin?.slice(0, 5) || "";

                    let estadoClase = "";
                    let iconoEstado = "";

                    if (horario.estado === "Aprobado") {
                        estadoClase = "bg-emerald-100 text-emerald-700";
                        iconoEstado = "fa-circle-check";
                    } else if (horario.estado === "Rechazado") {
                        estadoClase = "bg-red-100 text-red-700";
                        iconoEstado = "fa-circle-xmark";
                    } else {
                        estadoClase = "bg-amber-100 text-amber-700";
                        iconoEstado = "fa-clock";
                    }

                    return `
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <i class="fa-solid fa-calendar-day text-blue-600"></i>
                    </div>

                    <div>
                        <p class="text-sm font-semibold text-slate-800">
                            ${horario.dia_semana}
                        </p>

                        <p class="text-sm text-slate-500">
                            ${horaInicio} - ${horaFin}
                        </p>
                    </div>
                </div>

                <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${estadoClase}">
                    <i class="fa-solid ${iconoEstado}"></i>
                    ${horario.estado}
                </span>

            </div>
        `;
                }).join("");
            }
            // ========================================
            // DATOS PERSONALES
            // ========================================

            document.getElementById(
                "ver_medico_nombre"
            ).textContent =
                `${usuario.nombres} ${usuario.apellidos}`;


            document.getElementById(
                "ver_medico_nombre_completo"
            ).textContent =
                `${usuario.nombres} ${usuario.apellidos}`;


            document.getElementById(
                "ver_medico_documento"
            ).textContent =
                `${usuario.tipo_documento || "N/A"} ${usuario.numero_documento || ""}`;


            document.getElementById(
                "ver_medico_correo"
            ).textContent =
                usuario.correo || "N/A";


            document.getElementById(
                "ver_medico_telefono"
            ).textContent =
                usuario.telefono || "N/A";


            // ========================================
            // DATOS PROFESIONALES
            // ========================================

            document.getElementById(
                "ver_medico_especialidad"
            ).textContent =
                especialidad?.nombre || "Sin especialidad";


            document.getElementById(
                "ver_medico_cedula"
            ).textContent =
                medico.cedula_profesional || "N/A";


            document.getElementById(
                "ver_medico_experiencia"
            ).textContent =
                medico.anios_experiencia !== null
                    ? `${medico.anios_experiencia} años`
                    : "N/A";


            // ========================================
            // ESTADO
            // ========================================

            const estado =
                document.getElementById(
                    "ver_medico_estado"
                );


            estado.textContent =
                usuario.estado
                    ? "Activo"
                    : "Inactivo";


            estado.className =
                usuario.estado
                    ? "inline-flex px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"
                    : "inline-flex px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700";


            // ========================================
            // FECHA DE REGISTRO
            // ========================================

            document.getElementById(
                "ver_medico_fecha_registro"
            ).textContent =
                usuario.fecha_registro
                    ? new Date(
                        usuario.fecha_registro
                    ).toLocaleDateString("es-CO")
                    : "N/A";


            // ========================================
            // MOSTRAR MODAL
            // ========================================

            modalVerMedico.classList.remove("hidden");

            modalVerMedico.classList.add("flex");


        } catch (error) {

            console.error(
                "Error al obtener médico:",
                error
            );

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
    
}); 