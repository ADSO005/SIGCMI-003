document.addEventListener("DOMContentLoaded", () => {


    //MODAL NUEVA ESPECIALIDAD

    const modal =
        document.getElementById("modalNuevaEspecialidad");

    const btnNueva =
        document.getElementById("btnNuevaEspecialidad");

    const btnCerrar =
        document.getElementById("btnCerrarNuevaEspecialidad");

    const btnCancelar =
        document.getElementById("btnCancelarNuevaEspecialidad");

    const formulario =
        document.getElementById("formNuevaEspecialidad");

    //MODAL EDITAR ESPECIALIDAD

    const modalEditar =
        document.getElementById("modalEditarEspecialidad");

    const btnCerrarEditar =
        document.getElementById("btnCerrarEditarEspecialidad");

    const btnCancelarEditar =
        document.getElementById("btnCancelarEditarEspecialidad");

    const formularioEditar =
        document.getElementById("formEditarEspecialidad");

    const botonesEditar =
        document.querySelectorAll(".btnEditarEspecialidad");

    // ==========================================
    // ABRIR MODAL EDITAR
    // ==========================================

    botonesEditar.forEach((boton) => {

        boton.addEventListener("click", async () => {

            const id = boton.dataset.id;

            try {

                const respuesta = await fetch(
                    `/admin/especialidades/${id}`
                );

                const contenido = await respuesta.text();

                console.log("Status:", respuesta.status);
                console.log("Respuesta del servidor:", contenido);

                let data;

                try {
                    data = JSON.parse(contenido);
                } catch (error) {
                    throw new Error(
                        `El servidor respondió con ${respuesta.status} y no devolvió JSON.`
                    );
                }

                if (!respuesta.ok) {
                    throw new Error(
                        data.mensaje ||
                        "No se pudo obtener la especialidad."
                    );
                }

                const especialidad = data.especialidad;

                document.getElementById(
                    "editar_especialidad_id"
                ).value = especialidad.id_especialidad;

                document.getElementById(
                    "editar_especialidad_nombre"
                ).value = especialidad.nombre;

                document.getElementById(
                    "editar_especialidad_descripcion"
                ).value =
                    especialidad.descripcion || "";

                modalEditar.classList.remove("hidden");
                modalEditar.classList.add("flex");

            } catch (error) {

                console.error(
                    "Error al obtener especialidad:",
                    error
                );

                alert(error.message);
            }

        });

    });

    //FORMULARIO EDITAR ESPECIALIDAD

    formularioEditar?.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const id =
                document.getElementById(
                    "editar_especialidad_id"
                ).value;

            const nombre =
                document.getElementById(
                    "editar_especialidad_nombre"
                ).value.trim();

            const descripcion =
                document.getElementById(
                    "editar_especialidad_descripcion"
                ).value.trim();

            try {

                const respuesta = await fetch(
                    `/admin/especialidades/${id}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            nombre,
                            descripcion
                        })
                    }
                );

                const data =
                    await respuesta.json();

                if (!respuesta.ok) {
                    throw new Error(
                        data.mensaje ||
                        "No se pudo actualizar la especialidad."
                    );
                }

                alert(data.mensaje);

                window.location.reload();

            } catch (error) {

                console.error(
                    "Error al actualizar especialidad:",
                    error
                );

                alert(error.message);
            }

        }
    );

    //BOTONES PARA CERRAR MODAL EDITAR ESPECIALIDAD

    const cerrarModalEditar = () => {

        modalEditar.classList.add("hidden");
        modalEditar.classList.remove("flex");

        formularioEditar.reset();

    };

    btnCerrarEditar?.addEventListener(
        "click",
        cerrarModalEditar
    );

    btnCancelarEditar?.addEventListener(
        "click",
        cerrarModalEditar
    );


    // ==========================================
    // ELIMINAR ESPECIALIDAD
    // ==========================================

    const botonesEliminar =
        document.querySelectorAll(".btnEliminarEspecialidad");

    botonesEliminar.forEach((boton) => {

        boton.addEventListener("click", async () => {

            const id = boton.dataset.id;

            const confirmar = confirm(
                "¿Estás seguro de que deseas eliminar esta especialidad?"
            );

            if (!confirmar) {
                return;
            }

            try {

                const respuesta = await fetch(
                    `/admin/especialidades/${id}`,
                    {
                        method: "DELETE"
                    }
                );

                const contenido = await respuesta.text();

                console.log("Status eliminar:", respuesta.status);
                console.log(
                    "Respuesta eliminar:",
                    contenido
                );

                let data;

                try {
                    data = JSON.parse(contenido);
                } catch (error) {
                    throw new Error(
                        `El servidor respondió con ${respuesta.status} y no devolvió JSON.`
                    );
                }

                if (!respuesta.ok) {
                    throw new Error(
                        data.mensaje ||
                        "No se pudo eliminar la especialidad."
                    );
                }

                alert(data.mensaje);

                window.location.reload();

            } catch (error) {

                console.error(
                    "Error al eliminar especialidad:",
                    error
                );

                alert(error.message);
            }

        });

    });
    
    // ==========================================
    // ABRIR MODAL 
    // ==========================================

    btnNueva?.addEventListener("click", () => {

        modal.classList.remove("hidden");
        modal.classList.add("flex");

    });


    // ==========================================
    // CERRAR MODAL
    // ==========================================

    const cerrarModal = () => {

        modal.classList.add("hidden");
        modal.classList.remove("flex");

        formulario.reset();

    };


    btnCerrar?.addEventListener(
        "click",
        cerrarModal
    );

    btnCancelar?.addEventListener(
        "click",
        cerrarModal
    );


    // ==========================================
    // CREAR ESPECIALIDAD
    // ==========================================

    formulario?.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const nombre =
                document
                    .getElementById("especialidad_nombre")
                    .value
                    .trim();

            const descripcion =
                document
                    .getElementById("especialidad_descripcion")
                    .value
                    .trim();


            try {

                const respuesta = await fetch(
                    "/admin/especialidades",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            nombre,
                            descripcion
                        })
                    }
                );


                const data =
                    await respuesta.json();


                if (!respuesta.ok) {

                    throw new Error(
                        data.mensaje ||
                        "No se pudo crear la especialidad."
                    );

                }


                alert(data.mensaje);

                cerrarModal();

                // Recargar lista
                window.location.reload();


            } catch (error) {

                console.error(
                    "Error al crear especialidad:",
                    error
                );

                alert(error.message);

            }

        }
    );

});