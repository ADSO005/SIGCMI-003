window.toggleSidebar = () => {

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (!sidebar) return;

    if (window.innerWidth <= 768) {

        sidebar.classList.toggle("open");

        if (overlay) {
            overlay.classList.toggle("hidden", !sidebar.classList.contains("open"));
        }

        return;
    }

    sidebar.classList.toggle("collapsed");
};


// ==========================================
// CERRAR SIDEBAR EN MÓVIL
// ==========================================

window.closeSidebar = () => {

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    if (overlay) {
        overlay.classList.add("hidden");
    }
};


// ==========================================
// RESPONSIVE
// ==========================================

window.addEventListener("resize", () => {

    if (window.innerWidth > 768) {
        window.closeSidebar();
    }
});