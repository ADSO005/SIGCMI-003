// Muestra solo las secciones del rol elegido y deshabilita sus campos
// cuando no corresponden, para que no se envíen ni validen.
(() => {
    const form = document.getElementById("formUsuario");
    const selectorRol = document.getElementById("rol_id");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const secciones = document.querySelectorAll("[data-rol]");

    if (!form || !selectorRol) return;

    const aplicarRol = () => {
        const rol = selectorRol.value;

        secciones.forEach((seccion) => {
            const visible = seccion.dataset.rol === rol;

            seccion.classList.toggle("hidden", !visible);

            seccion.querySelectorAll("input, select, textarea").forEach((campo) => {
                campo.disabled = !visible;
            });
        });
    };

    selectorRol.addEventListener("change", aplicarRol);
    aplicarRol();

    form.addEventListener("submit", (event) => {
        if (password.value !== confirmPassword.value) {
            event.preventDefault();
            alert("Las contraseñas no coinciden.");
            confirmPassword.focus();
        }
    });
})();
