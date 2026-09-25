console.log("PACIENTES.JS CARGADO");

document.addEventListener("DOMContentLoaded", () => {


    const buscarPaciente =
        document.getElementById("buscarPaciente");

    const filtroEstado =
        document.getElementById("filtroEstadoPaciente");

    const filas =
        document.querySelectorAll(".paciente-fila");

    const sinResultados =
        document.getElementById("sinResultadosPacientes");


    // ========================================
    // FILTRAR PACIENTES
    // ========================================

    function filtrarPacientes() {

        const texto =
            buscarPaciente.value
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


        // Mostrar mensaje si no hay resultados

        if (encontrados === 0) {

            sinResultados.classList.remove("hidden");

        } else {

            sinResultados.classList.add("hidden");
        }
    }


    // ========================================
    // EVENTOS
    // ========================================

    buscarPaciente.addEventListener(
        "input",
        filtrarPacientes
    );

    filtroEstado.addEventListener(
        "change",
        filtrarPacientes
    );

    // ========================================
    // VER PACIENTE
    // ========================================

    const modalVerPaciente =
        document.getElementById("modalVerPaciente");

    const btnCerrarVerPaciente =
        document.getElementById("btnCerrarVerPaciente");

    const btnCerrarVerPacienteFooter =
        document.getElementById(
            "btnCerrarVerPacienteFooter"
        );

    const botonesVerPaciente =
        document.querySelectorAll(
            ".btnVerPaciente"
        );


    // ========================================
    // CERRAR MODAL
    // ========================================

    function cerrarModalVerPaciente() {

        modalVerPaciente.classList.add("hidden");

        modalVerPaciente.classList.remove("flex");
    }


    // ========================================
    // ABRIR MODAL
    // ========================================

    async function verPaciente(id) {

        try {

            const respuesta = await fetch(
                `/admin/pacientes/${id}`
            );

            const data = await respuesta.json();

            if (!respuesta.ok || !data.ok) {

                throw new Error(
                    data.mensaje ||
                    "No se pudo obtener el paciente."
                );
            }

            const paciente = data.paciente;
            const usuario = paciente.Usuario;


            // ====================================
            // DATOS DEL USUARIO
            // ====================================

            document.getElementById(
                "ver_nombre_completo"
            ).textContent =
                `${usuario.nombres} ${usuario.apellidos}`;

            document.getElementById(
                "ver_correo"
            ).textContent =
                usuario.correo || "N/A";

            document.getElementById(
                "ver_tipo_documento"
            ).textContent =
                usuario.tipo_documento || "N/A";

            document.getElementById(
                "ver_numero_documento"
            ).textContent =
                usuario.numero_documento || "N/A";

            document.getElementById(
                "ver_telefono"
            ).textContent =
                usuario.telefono || "N/A";


            // ====================================
            // ESTADO
            // ====================================

            const estado =
                document.getElementById(
                    "ver_estado"
                );

            estado.textContent =
                usuario.estado
                    ? "Activo"
                    : "Inactivo";

            estado.className =
                usuario.estado
                    ? "inline-flex mt-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"
                    : "inline-flex mt-2 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700";


            // ====================================
            // DATOS DEL PACIENTE
            // ====================================

            document.getElementById(
                "ver_fecha_nacimiento"
            ).textContent =
                paciente.fecha_nacimiento
                    ? new Date(
                        paciente.fecha_nacimiento +
                        "T00:00:00"
                    ).toLocaleDateString("es-CO")
                    : "N/A";

            document.getElementById(
                "ver_fecha_registro"
            ).textContent =
                usuario.fecha_registro
                    ? new Date(
                        usuario.fecha_registro
                    ).toLocaleDateString("es-CO")
                    : "N/A";

            document.getElementById(
                "ver_tipo_sangre"
            ).textContent =
                paciente.tipo_sangre || "N/A";

            document.getElementById(
                "ver_departamento"
            ).textContent =
                paciente.departamento || "N/A";

            document.getElementById(
                "ver_ciudad"
            ).textContent =
                paciente.ciudad || "N/A";

            document.getElementById(
                "ver_direccion"
            ).textContent =
                paciente.direccion || "N/A";

            document.getElementById(
                "ver_alergias"
            ).textContent =
                paciente.alergias || "N/A";

            document.getElementById(
                "ver_condiciones_medicas"
            ).textContent =
                paciente.condiciones_medicas || "N/A";


            // ====================================
            // MOSTRAR MODAL
            // ====================================

            modalVerPaciente.classList.remove(
                "hidden"
            );

            modalVerPaciente.classList.add(
                "flex"
            );

        } catch (error) {

            console.error(
                "Error al obtener paciente:",
                error
            );

            alert(error.message);
        }
    }


    // ========================================
    // EVENTOS
    // ========================================

    botonesVerPaciente.forEach((boton) => {

        boton.addEventListener(
            "click",
            () => {

                const id =
                    boton.dataset.id;

                verPaciente(id);
            }
        );

    });


    btnCerrarVerPaciente.addEventListener(
        "click",
        cerrarModalVerPaciente
    );

    btnCerrarVerPacienteFooter.addEventListener(
        "click",
        cerrarModalVerPaciente
    );


    modalVerPaciente.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                modalVerPaciente
            ) {

                cerrarModalVerPaciente();
            }
        }
    );

    // =====================================================
    // EDITAR PACIENTE
    // =====================================================

    const modalEditarPaciente =
        document.getElementById("modalEditarPaciente");

    const btnCerrarEditarPaciente =
        document.getElementById("btnCerrarEditarPaciente");

    const btnCancelarEditarPaciente =
        document.getElementById("btnCancelarEditarPaciente");

    const formEditarPaciente =
        document.getElementById("formEditarPaciente");
    const btnGuardarEditarPaciente =
        document.getElementById("btnGuardarEditarPaciente");

    const botonesEditarPaciente =
        document.querySelectorAll(".btnEditarPaciente");

    // -----------------------------------------------------
    // CERRAR MODAL
    // -----------------------------------------------------

    function cerrarModalEditarPaciente() {
        modalEditarPaciente.classList.add("hidden");
        modalEditarPaciente.classList.remove("flex");
    }

    // -----------------------------------------------------
    // ABRIR Y CARGAR PACIENTE
    // -----------------------------------------------------

    async function editarPaciente(id) {

        try {

            const respuesta = await fetch(
                `/admin/pacientes/${id}`
            );

            const data = await respuesta.json();

            if (!respuesta.ok || !data.ok) {
                throw new Error(
                    data.mensaje ||
                    "No se pudo obtener el paciente."
                );
            }

            const paciente = data.paciente;
            const usuario = paciente.Usuario;

            // ---------------------------------------------
            // ID
            // ---------------------------------------------

            document.getElementById(
                "editar_id_paciente"
            ).value = paciente.id_paciente;

            // ---------------------------------------------
            // INFORMACIÓN PERSONAL
            // ---------------------------------------------

            document.getElementById(
                "editar_nombres"
            ).value = usuario.nombres || "";

            document.getElementById(
                "editar_apellidos"
            ).value = usuario.apellidos || "";

            document.getElementById(
                "editar_tipo_documento"
            ).value = usuario.tipo_documento || "";

            document.getElementById(
                "editar_numero_documento"
            ).value = usuario.numero_documento || "";

            // ---------------------------------------------
            // CONTACTO
            // ---------------------------------------------

            document.getElementById(
                "editar_correo"
            ).value = usuario.correo || "";

            document.getElementById(
                "editar_telefono"
            ).value = usuario.telefono || "";

            // ---------------------------------------------
            // INFORMACIÓN MÉDICA
            // ---------------------------------------------

            document.getElementById(
                "editar_fecha_nacimiento"
            ).value = paciente.fecha_nacimiento || "";

            document.getElementById(
                "editar_tipo_sangre"
            ).value = paciente.tipo_sangre || "";

            document.getElementById(
                "editar_alergias"
            ).value = paciente.alergias || "";

            document.getElementById(
                "editar_condiciones_medicas"
            ).value =
                paciente.condiciones_medicas || "";

            // ---------------------------------------------
            // UBICACIÓN
            // ---------------------------------------------

            document.getElementById(
                "editar_departamento"
            ).value = paciente.departamento || "";

            document.getElementById(
                "editar_ciudad"
            ).value = paciente.ciudad || "";

            document.getElementById(
                "editar_direccion"
            ).value = paciente.direccion || "";

            // ---------------------------------------------
            // ABRIR MODAL
            // ---------------------------------------------

            modalEditarPaciente.classList.remove("hidden");
            modalEditarPaciente.classList.add("flex");

        } catch (error) {

            console.error(
                "Error al cargar paciente:",
                error
            );

            alert(error.message);
        }
    }

    // -----------------------------------------------------
    // BOTONES EDITAR
    // -----------------------------------------------------

    botonesEditarPaciente.forEach((boton) => {

        boton.addEventListener("click", () => {

            const id = boton.dataset.id;

            editarPaciente(id);

        });

    });

    // -----------------------------------------------------
    // BOTONES CERRAR
    // -----------------------------------------------------

    btnCerrarEditarPaciente.addEventListener(
        "click",
        cerrarModalEditarPaciente
    );

    btnCancelarEditarPaciente.addEventListener(
        "click",
        cerrarModalEditarPaciente
    );

    // -----------------------------------------------------
    // CERRAR HACIENDO CLICK EN EL FONDO
    // -----------------------------------------------------

    modalEditarPaciente.addEventListener(
        "click",
        (event) => {

            if (
                event.target === modalEditarPaciente
            ) {
                cerrarModalEditarPaciente();
            }

        }
    );

    // =====================================================
    // GUARDAR CAMBIOS DEL PACIENTE
    // =====================================================

    formEditarPaciente.addEventListener("submit", async (event) => {

        event.preventDefault();

        const id = document.getElementById(
            "editar_id_paciente"
        ).value;

        const datos = {
            nombres: document.getElementById("editar_nombres").value.trim(),
            apellidos: document.getElementById("editar_apellidos").value.trim(),
            tipo_documento: document.getElementById("editar_tipo_documento").value,
            numero_documento: document.getElementById("editar_numero_documento").value.trim(),
            correo: document.getElementById("editar_correo").value.trim(),
            telefono: document.getElementById("editar_telefono").value.trim(),
            fecha_nacimiento: document.getElementById("editar_fecha_nacimiento").value,
            tipo_sangre: document.getElementById("editar_tipo_sangre").value,
            alergias: document.getElementById("editar_alergias").value.trim(),
            condiciones_medicas: document.getElementById("editar_condiciones_medicas").value.trim(),
            departamento: document.getElementById("editar_departamento").value.trim(),
            ciudad: document.getElementById("editar_ciudad").value.trim(),
            direccion: document.getElementById("editar_direccion").value.trim()
        };

        try {

            const respuesta = await fetch(`/admin/pacientes/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(datos)
            });

            const data = await respuesta.json();

            if (!respuesta.ok || !data.ok) {
                throw new Error(
                    data.mensaje || "No se pudo actualizar el paciente."
                );
            }

            alert(data.mensaje);

            cerrarModalEditarPaciente();

            window.location.reload();

        } catch (error) {

            console.error(
                "❌ ERROR AL ACTUALIZAR PACIENTE:",
                error
            );

            alert(error.message);
        }

    });

});