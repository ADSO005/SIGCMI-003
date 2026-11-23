document.addEventListener("DOMContentLoaded", () => {
    const telefono = document.querySelector("#telefono");
    if (!telefono) return;

    telefono.addEventListener("input", () => {
        const caracteresPermitidos = telefono.value.replace(/[^0-9\s().+-]/g, "");
        const prefijo = caracteresPermitidos.startsWith("+") ? "+" : "";
        telefono.value = `${prefijo}${caracteresPermitidos.replace(/\+/g, "")}`.slice(0, 20);
    });
});
