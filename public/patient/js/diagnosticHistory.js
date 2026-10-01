document.addEventListener("DOMContentLoaded", () => {

    console.log("✅ diagnosticHistory.js se cargó");

    const modal = document.getElementById("modalDiagnosticos");
    const botonAbrir = document.getElementById("btnAbrirDiagnosticos");
    const botonCerrar = document.getElementById("cerrarDiagnosticos");
    const botonCerrarFooter = document.getElementById("cerrarDiagnosticosFooter");

    if (!modal || !botonAbrir) {
        console.error("❌ No se encontraron los elementos del modal");
        return;
    }

    botonAbrir.addEventListener("click", () => {

        console.log("🟢 Se hizo clic en Ver Diagnósticos");

        modal.style.display = "flex";

        document.body.style.overflow = "hidden";
    });


    if (botonCerrar) {

        botonCerrar.addEventListener("click", () => {

            modal.style.display = "none";

            document.body.style.overflow = "";
        });
    }


    if (botonCerrarFooter) {

        botonCerrarFooter.addEventListener("click", () => {

            modal.style.display = "none";

            document.body.style.overflow = "";
        });
    }


    // ==========================================
    // ABRIR / CERRAR CADA DIAGNÓSTICO
    // ==========================================

    const diagnosticos = document.querySelectorAll(".diagnostico-item");

    diagnosticos.forEach((diagnostico) => {

        const encabezado = diagnostico.querySelector(".diagnostico-header");
        const flecha = diagnostico.querySelector(".diagnostico-arrow");

        encabezado.addEventListener("click", () => {

            diagnostico.classList.toggle("active");

            if (diagnostico.classList.contains("active")) {
                flecha.textContent = "▲";
            } else {
                flecha.textContent = "▼";
            }

        });

    });

});