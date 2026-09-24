document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // FILTROS
    // ==========================================

    const buscarUsuario =
        document.getElementById("buscarUsuario");

    const filtroRol =
        document.getElementById("filtroRol");

    const filas =
        document.querySelectorAll(".usuario-fila");


    function filtrarUsuarios() {

        const texto =
            buscarUsuario.value
                .toLowerCase()
                .trim();

        const rolSeleccionado =
            filtroRol.value
                .toLowerCase()
                .trim();


        filas.forEach((fila) => {

            const nombre =
                fila.dataset.nombre.toLowerCase();

            const correo =
                fila.dataset.correo.toLowerCase();

            const documento =
                fila.dataset.documento.toLowerCase();

            const rol =
                fila.dataset.rol.toLowerCase();


            const coincideTexto =
                nombre.includes(texto) ||
                correo.includes(texto) ||
                documento.includes(texto);

            const coincideRol =
                !rolSeleccionado ||
                rol === rolSeleccionado;


            if (coincideTexto && coincideRol) {

                fila.classList.remove("hidden");

            } else {

                fila.classList.add("hidden");

            }

        });
    }


    buscarUsuario.addEventListener(
        "input",
        filtrarUsuarios
    );

    filtroRol.addEventListener(
        "change",
        filtrarUsuarios
    );


    // ==========================================
    // MODAL EDITAR USUARIO
    // ==========================================

    const modal =
        document.getElementById("modalEditarUsuario");

    const form =
        document.getElementById("formEditarUsuario");

    const btnCerrar =
        document.getElementById("btnCerrarEditarUsuario");

    const btnCancelar =
        document.getElementById("btnCancelarEditarUsuario");

    const error =
        document.getElementById("errorEditarUsuario");

    const exito =
        document.getElementById("exitoEditarUsuario");


    // ==========================================
    // ABRIR MODAL
    // ==========================================

    document.querySelectorAll(".btnEditarUsuario")
        .forEach((boton) => {

            boton.addEventListener("click", async () => {

                const id =
                    boton.dataset.id;

                await cargarUsuario(id);

            });

        });


    // ==========================================
    // CARGAR USUARIO
    // ==========================================

    async function cargarUsuario(id) {

        try {

            limpiarMensajes();

            const respuesta =
                await fetch(`/admin/usuarios/${id}`);

            const data =
                await respuesta.json();


            if (!respuesta.ok || !data.ok) {

                throw new Error(
                    data.mensaje ||
                    "No se pudo obtener el usuario."
                );

            }


            const usuario =
                data.usuario;


            // ==================================
            // LLENAR FORMULARIO
            // ==================================

            document.getElementById(
                "editar_usuario_id"
            ).value = usuario.id_usuario;


            document.getElementById(
                "editar_nombres"
            ).value = usuario.nombres || "";


            document.getElementById(
                "editar_apellidos"
            ).value = usuario.apellidos || "";


            document.getElementById(
                "editar_correo"
            ).value = usuario.correo || "";


            document.getElementById(
                "editar_telefono"
            ).value = usuario.telefono || "";


            document.getElementById(
                "editar_tipo_documento"
            ).value = usuario.tipo_documento || "";


            document.getElementById(
                "editar_numero_documento"
            ).value = usuario.numero_documento || "";


            document.getElementById(
                "editar_rol_id"
            ).value = usuario.rol_id;


            // ==================================
            // MOSTRAR MODAL
            // ==================================

            modal.classList.remove("hidden");
            modal.classList.add("flex");

        } catch (error) {

            console.error(
                "Error al cargar usuario:",
                error
            );

            mostrarError(error.message);

        }

    }


    // ==========================================
    // CERRAR MODAL
    // ==========================================

    function cerrarModal() {

        modal.classList.add("hidden");
        modal.classList.remove("flex");

        form.reset();

        limpiarMensajes();

    }


    btnCerrar.addEventListener(
        "click",
        cerrarModal
    );

    btnCancelar.addEventListener(
        "click",
        cerrarModal
    );


    // ==========================================
    // CERRAR AL HACER CLICK FUERA
    // ==========================================

    modal.addEventListener("click", (event) => {

        if (event.target === modal) {

            cerrarModal();

        }

    });


    // ==========================================
    // GUARDAR CAMBIOS
    // ==========================================

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            limpiarMensajes();


            const id =
                document.getElementById(
                    "editar_usuario_id"
                ).value;


            const datos = {
                nombres: document.getElementById("editar_nombres").value.trim(),
                apellidos: document.getElementById("editar_apellidos").value.trim(),
                correo: document.getElementById("editar_correo").value.trim(),
                telefono: document.getElementById("editar_telefono").value.trim(),
                tipo_documento: document.getElementById("editar_tipo_documento").value,
                numero_documento: document.getElementById("editar_numero_documento").value.trim(),
                rol_id: document.getElementById("editar_rol_id").value
            };

            // ========================================
            // VALIDACIONES
            // ========================================

            // Campos obligatorios
            if (!datos.nombres) {
                mostrarError("El campo nombres es obligatorio.");
                return;
            }

            if (!datos.apellidos) {
                mostrarError("El campo apellidos es obligatorio.");
                return;
            }

            if (!datos.correo) {
                mostrarError("El correo electrónico es obligatorio.");
                return;
            }

            if (!datos.telefono) {
                mostrarError("El teléfono es obligatorio.");
                return;
            }

            if (!datos.tipo_documento) {
                mostrarError("Debes seleccionar el tipo de documento.");
                return;
            }

            if (!datos.numero_documento) {
                mostrarError("El número de documento es obligatorio.");
                return;
            }

            if (!datos.rol_id) {
                mostrarError("Debes seleccionar un rol.");
                return;
            }

            // Nombres
            const nombreRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;

            if (datos.nombres.length < 2) {
                mostrarError("Los nombres deben tener mínimo 2 caracteres.");
                return;
            }

            if (!nombreRegex.test(datos.nombres)) {
                mostrarError("Los nombres solo pueden contener letras y espacios.");
                return;
            }

            // Apellidos
            if (datos.apellidos.length < 2) {
                mostrarError("Los apellidos deben tener mínimo 2 caracteres.");
                return;
            }

            if (!nombreRegex.test(datos.apellidos)) {
                mostrarError("Los apellidos solo pueden contener letras y espacios.");
                return;
            }

            // Correo
            const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!correoRegex.test(datos.correo)) {
                mostrarError("Ingresa un correo electrónico válido.");
                return;
            }

            // Teléfono
            const telefonoRegex = /^\d{7,10}$/;

            if (!telefonoRegex.test(datos.telefono)) {
                mostrarError("El teléfono debe contener entre 7 y 10 números.");
                return;
            }

            // Tipo de documento
            const tiposDocumentoPermitidos = [
                "CC",
                "TI",
                "CE",
                "Pasaporte"
            ];

            if (!tiposDocumentoPermitidos.includes(datos.tipo_documento)) {
                mostrarError("El tipo de documento seleccionado no es válido.");
                return;
            }

            // Número de documento
            const documentoRegex = /^\d{5,15}$/;

            if (!documentoRegex.test(datos.numero_documento)) {
                mostrarError(
                    "El número de documento debe contener entre 5 y 15 números."
                );
                return;
            }

            // Rol
            const rolesPermitidos = ["1", "2", "3"];

            if (!rolesPermitidos.includes(String(datos.rol_id))) {
                mostrarError("El rol seleccionado no es válido.");
                return;
            }


            try {

                const respuesta =
                    await fetch(
                        `/admin/usuarios/${id}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(datos)
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
                        "No se pudo actualizar el usuario."
                    );

                }


                // ==================================
                // ÉXITO
                // ==================================

                exito.textContent =
                    data.mensaje;

                exito.classList.remove(
                    "hidden"
                );


                setTimeout(() => {

                    window.location.reload();

                }, 1000);


            } catch (error) {

                console.error(
                    "Error al actualizar usuario:",
                    error
                );

                mostrarError(
                    error.message
                );

            }

        }
    );


    // ==========================================
    // MENSAJES
    // ==========================================

    function mostrarError(mensaje) {

        error.textContent =
            mensaje;

        error.classList.remove(
            "hidden"
        );

    }


    function limpiarMensajes() {

        error.textContent = "";

        error.classList.add(
            "hidden"
        );

        exito.textContent = "";

        exito.classList.add(
            "hidden"
        );

    }

});