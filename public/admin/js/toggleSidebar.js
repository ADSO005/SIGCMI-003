function toggleSidebar() {

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (!sidebar) return;


    // ==========================================
    // VISTA MÓVIL
    // ==========================================

    if (window.innerWidth < 768) {

        sidebar.classList.toggle("-translate-x-full");

        if (overlay) {
            overlay.classList.toggle("hidden");
        }

        return;
    }


    // ==========================================
    // VISTA ESCRITORIO
    // ==========================================

    sidebar.classList.toggle("w-64");
    sidebar.classList.toggle("w-20");

    const textos =
        document.querySelectorAll(".sidebar-text");

    textos.forEach((texto) => {
        texto.classList.toggle("hidden");
    });
}


// ==========================================
// CERRAR SIDEBAR EN MÓVIL
// ==========================================

function closeSidebar() {

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("sidebarOverlay");

    if (!sidebar) return;

    sidebar.classList.add("-translate-x-full");

    if (overlay) {
        overlay.classList.add("hidden");
    }
}


// ==========================================
// RESPONSIVE
// ==========================================

window.addEventListener("resize", function () {

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("sidebarOverlay");

    if (!sidebar) return;


    if (window.innerWidth >= 768) {

        sidebar.classList.remove("-translate-x-full");

        if (overlay) {
            overlay.classList.add("hidden");
        }

    } else {

        sidebar.classList.add("-translate-x-full");

    }

});