function toggleSidebar() {
                // Buscamos el sidebar por su id
                const sidebar = document.getElementById('sidebar');

                // Buscamos TODOS los elementos marcados con la clase "sidebar-text"
                // (el texto "SIGCMI", "Bienvenido", "Dashboard", "Citas", etc.)
                const textos = document.querySelectorAll('.sidebar-text');

                // classList.toggle("w-64") hace lo siguiente:
                // - si el sidebar YA tiene esa clase, la quita
                // - si NO la tiene, la agrega
                // Usamos dos toggle: uno para el ancho grande (w-64) y otro
                // para el ancho chico (w-20), así siempre queda uno u otro.
                sidebar.classList.toggle('w-64');
                sidebar.classList.toggle('w-20');

                // Recorremos cada texto y le agregamos/quitamos la clase "hidden"
                // de Tailwind (que es simplemente display: none).
                textos.forEach(function (texto) {
                    texto.classList.toggle('hidden');
                });
            }
