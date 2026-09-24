document.addEventListener("DOMContentLoaded", () => {

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
                fila.dataset.nombre
                    .toLowerCase();

            const correo =
                fila.dataset.correo
                    .toLowerCase();

            const documento =
                fila.dataset.documento
                    .toLowerCase();

            const rol =
                fila.dataset.rol
                    .toLowerCase();


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

});