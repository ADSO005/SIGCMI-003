document.addEventListener("DOMContentLoaded", () => {

    const inputBuscar = document.getElementById("buscarPrescripcion");
    const filas = document.querySelectorAll("#tablaPrescripciones tr");

    if (!inputBuscar) {
        return;
    }

    inputBuscar.addEventListener("input", () => {

        const texto = inputBuscar.value
            .toLowerCase()
            .trim();

        filas.forEach((fila) => {

            const contenido = fila
                .getAttribute("data-search");

            if (!contenido) {
                return;
            }

            const coincide = contenido.includes(texto);

            fila.style.display = coincide ? "" : "none";
        });
    });

});