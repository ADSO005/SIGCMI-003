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


    // ========================================
    // CAMBIAR ESTADO DEL USUARIO
    // ========================================

    const botonesEstado = document.querySelectorAll(
        ".btnCambiarEstadoUsuario"
    );

    botonesEstado.forEach((boton) => {

        boton.addEventListener("click", async () => {

            const id = boton.dataset.id;
            const estadoActual = boton.dataset.estado === "true";

            const accion = estadoActual
                ? "desactivar"
                : "activar";

            const confirmar = confirm(
                `¿Estás seguro de que deseas ${accion} este usuario?`
            );

            if (!confirmar) {
                return;
            }

            try {

                const respuesta = await fetch(
                    `/admin/usuarios/${id}/estado`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }
                );

                const data = await respuesta.json();

                if (!respuesta.ok || !data.ok) {
                    throw new Error(
                        data.mensaje ||
                        "No se pudo cambiar el estado del usuario."
                    );
                }

                alert(data.mensaje);

                window.location.reload();

            } catch (error) {

                console.error(
                    "Error al cambiar estado:",
                    error
                );

                alert(error.message);
            }
        });

    });
});
