document.addEventListener("DOMContentLoaded", () => {
    const diagnosticCards = document.querySelectorAll(".diagnostic-card");
    const detailContainer = document.getElementById("detalle-diagnostico");

    if (!diagnosticCards.length) return;

    diagnosticCards.forEach(card => {
        card.addEventListener("click", () => {
            // Remover clase activa de las demás tarjetas y marcar la seleccionada
            diagnosticCards.forEach(c => c.classList.remove("border-indigo-500", "bg-indigo-50/30"));
            card.classList.add("border-indigo-500", "bg-indigo-50/30");

            // Extraer los datos o simular la carga del detalle del diagnóstico
            const diagnosticId = card.getAttribute("data-id");

            console.log(`Diagnóstico seleccionado ID: ${diagnosticId}`);
        });
    });
});