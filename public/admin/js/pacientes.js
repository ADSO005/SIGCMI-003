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


    function filtrarPacientes() {

        const texto = buscarPaciente.value;

        const estadoSeleccionado =
            filtroEstado.value
                .toLowerCase()
                .trim();

        let encontrados = 0;

        filas.forEach((fila) => {

            const estado =
                fila.dataset.estado
                    .toLowerCase();


            const coincideTexto = Busqueda.coincide(texto, fila.dataset.nombre, fila.dataset.correo, fila.dataset.documento);


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


        if (encontrados === 0) {

            sinResultados.classList.remove("hidden");

        } else {

            sinResultados.classList.add("hidden");
        }
    }


    buscarPaciente.addEventListener(
        "input",
        filtrarPacientes
    );

    filtroEstado.addEventListener(
        "change",
        filtrarPacientes
    );


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


    function cerrarModalVerPaciente() {

        modalVerPaciente.classList.add("hidden");

        modalVerPaciente.classList.remove("flex");
    }


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

});