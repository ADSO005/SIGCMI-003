// Select con buscador: cambia la lista desplegable por un campo donde se puede escribir para filtrar.
// El <select> original se conserva (oculto) como fuente de verdad: su valor, sus opciones, el atributo
// disabled y los eventos "change" siguen funcionando igual para el resto de los scripts.
// Uso: agregar el atributo data-select-buscable a cualquier <select>.
(() => {
    const valorOriginal = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
    let contador = 0;

    function mejorar(select) {
        if (select.dataset.mejorado) return;
        select.dataset.mejorado = "true";

        const id = `sb${++contador}`;
        const clasesCampo = select.className;
        const etiqueta = select.id ? document.querySelector(`label[for="${select.id}"]`) : null;
        if (etiqueta && !etiqueta.id) etiqueta.id = `${id}-etiqueta`;

        const contenedor = document.createElement("div");
        contenedor.className = "relative";
        select.parentNode.insertBefore(contenedor, select);
        contenedor.append(select);

        // El select sigue en el formulario (y se valida), pero no se ve ni recibe foco por teclado.
        select.className = "pointer-events-none absolute inset-x-0 bottom-0 h-px w-full opacity-0";
        select.tabIndex = -1;
        select.setAttribute("aria-hidden", "true");

        const boton = document.createElement("button");
        boton.type = "button";
        boton.id = `${id}-boton`;
        boton.className = `${clasesCampo} flex items-center justify-between gap-3 bg-white text-left disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`;
        boton.setAttribute("role", "combobox");
        boton.setAttribute("aria-haspopup", "listbox");
        boton.setAttribute("aria-expanded", "false");
        boton.setAttribute("aria-controls", `${id}-lista`);
        if (etiqueta) boton.setAttribute("aria-labelledby", `${etiqueta.id} ${boton.id}`);
        if (select.required) boton.setAttribute("aria-required", "true");

        const texto = document.createElement("span");
        texto.className = "min-w-0 truncate";
        const flecha = document.createElement("i");
        flecha.className = "fa-solid fa-chevron-down shrink-0 text-xs text-slate-400";
        flecha.setAttribute("aria-hidden", "true");
        boton.append(texto, flecha);

        const panel = document.createElement("div");
        panel.hidden = true;
        panel.className = "fixed z-[100] rounded-xl border border-slate-200 bg-white p-2 shadow-xl";

        const buscador = document.createElement("input");
        buscador.type = "text";
        buscador.autocomplete = "off";
        buscador.placeholder = "Buscar...";
        buscador.setAttribute("role", "combobox");
        buscador.setAttribute("aria-label", "Buscar en la lista");
        buscador.setAttribute("aria-controls", `${id}-lista`);
        buscador.setAttribute("aria-expanded", "true");
        buscador.className = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

        const lista = document.createElement("ul");
        lista.id = `${id}-lista`;
        lista.setAttribute("role", "listbox");
        lista.className = "mt-2 max-h-56 overflow-y-auto";

        const aviso = document.createElement("p");
        aviso.className = "sr-only";
        aviso.setAttribute("aria-live", "polite");

        panel.append(buscador, lista, aviso);
        contenedor.append(boton, panel);

        let opciones = []; // [{ opcion, li }]
        let visibles = []; // subconjunto de opciones que coincide con la búsqueda
        let activo = -1;

        function sincronizar() {
            const seleccionada = select.options[select.selectedIndex];
            texto.textContent = seleccionada ? seleccionada.textContent.trim() : "";
            texto.classList.toggle("text-slate-500", !select.value);
            boton.disabled = select.disabled;
            if (select.disabled && !panel.hidden) cerrar(false);
        }

        function construirLista() {
            lista.replaceChildren();
            opciones = [];
            [...select.options].forEach((opcion, indice) => {
                if (opcion.value === "") return; // la opción vacía es solo el texto de ayuda
                const li = document.createElement("li");
                li.id = `${id}-op${indice}`;
                li.setAttribute("role", "option");
                li.setAttribute("aria-selected", String(opcion.selected));
                li.className = "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-slate-700";
                const nombre = document.createElement("span");
                nombre.className = "min-w-0 truncate";
                nombre.textContent = opcion.textContent.trim();
                li.append(nombre);
                if (opcion.selected) {
                    const marca = document.createElement("i");
                    marca.className = "fa-solid fa-check shrink-0 text-xs text-indigo-600";
                    marca.setAttribute("aria-hidden", "true");
                    li.append(marca);
                    li.classList.add("font-semibold");
                }
                if (opcion.disabled) {
                    li.setAttribute("aria-disabled", "true");
                    li.classList.add("cursor-not-allowed", "opacity-50");
                }
                li.addEventListener("pointermove", () => marcarActivo(visibles.findIndex((v) => v.li === li), false));
                li.addEventListener("click", () => elegir(opcion));
                lista.append(li);
                opciones.push({ opcion, li });
            });
        }

        function filtrar() {
            visibles = opciones.filter((item) => {
                const coincide = Busqueda.coincide(buscador.value, item.opcion.textContent);
                item.li.hidden = !coincide;
                return coincide;
            });

            lista.querySelector("[data-vacio]")?.remove();
            if (visibles.length === 0) {
                const vacio = document.createElement("li");
                vacio.dataset.vacio = "true";
                vacio.className = "px-3 py-3 text-center text-sm text-slate-500";
                vacio.textContent = opciones.length === 0 ? "No hay opciones disponibles." : "Sin resultados.";
                lista.append(vacio);
            }
            aviso.textContent = visibles.length === 1 ? "1 resultado" : `${visibles.length} resultados`;

            const seleccionado = visibles.findIndex((item) => item.opcion.selected);
            marcarActivo(seleccionado >= 0 ? seleccionado : visibles.length ? 0 : -1, true);
        }

        function marcarActivo(indice, desplazar) {
            activo = indice;
            visibles.forEach((item, i) => {
                const esActivo = i === indice;
                item.li.classList.toggle("bg-indigo-50", esActivo);
                if (esActivo) {
                    buscador.setAttribute("aria-activedescendant", item.li.id);
                    if (desplazar) item.li.scrollIntoView({ block: "nearest" });
                }
            });
            if (indice < 0) buscador.removeAttribute("aria-activedescendant");
        }

        function colocar() {
            const caja = boton.getBoundingClientRect();
            const alto = Math.min(320, panel.scrollHeight || 320);
            const abajo = window.innerHeight - caja.bottom - 8;
            const arriba = caja.top - 8;
            const haciaArriba = abajo < alto && arriba > abajo;
            panel.style.left = `${caja.left}px`;
            panel.style.width = `${caja.width}px`;
            panel.style.top = haciaArriba ? "auto" : `${caja.bottom + 4}px`;
            panel.style.bottom = haciaArriba ? `${window.innerHeight - caja.top + 4}px` : "auto";
            lista.style.maxHeight = `${Math.max(120, Math.min(224, (haciaArriba ? arriba : abajo) - 72))}px`;
        }

        function abrir() {
            if (select.disabled || !panel.hidden) return;
            construirLista();
            buscador.value = "";
            panel.hidden = false;
            boton.setAttribute("aria-expanded", "true");
            filtrar();
            colocar();
            buscador.focus();
        }

        function cerrar(devolverFoco = true) {
            if (panel.hidden) return;
            panel.hidden = true;
            boton.setAttribute("aria-expanded", "false");
            if (devolverFoco) boton.focus();
        }

        function elegir(opcion) {
            if (opcion.disabled) return;
            const cambio = select.value !== opcion.value;
            select.value = opcion.value; // el gancho de abajo sincroniza el texto
            cerrar();
            if (cambio) select.dispatchEvent(new Event("change", { bubbles: true }));
        }

        boton.addEventListener("click", () => (panel.hidden ? abrir() : cerrar()));
        boton.addEventListener("keydown", (evento) => {
            if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
                evento.preventDefault();
                abrir();
            }
        });

        buscador.addEventListener("input", filtrar);
        buscador.addEventListener("keydown", (evento) => {
            if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
                evento.preventDefault();
                if (!visibles.length) return;
                const paso = evento.key === "ArrowDown" ? 1 : -1;
                marcarActivo((activo + paso + visibles.length) % visibles.length, true);
            } else if (evento.key === "Home" || evento.key === "End") {
                if (!visibles.length) return;
                evento.preventDefault();
                marcarActivo(evento.key === "Home" ? 0 : visibles.length - 1, true);
            } else if (evento.key === "Enter") {
                evento.preventDefault(); // evita enviar el formulario
                if (activo >= 0) elegir(visibles[activo].opcion);
            } else if (evento.key === "Escape") {
                evento.preventDefault();
                evento.stopPropagation(); // no cierra también el modal
                cerrar();
            } else if (evento.key === "Tab") {
                cerrar(false);
            }
        });

        document.addEventListener("pointerdown", (evento) => {
            if (!panel.hidden && !contenedor.contains(evento.target)) cerrar(false);
        });
        window.addEventListener("resize", () => { if (!panel.hidden) colocar(); });
        window.addEventListener("scroll", () => { if (!panel.hidden) colocar(); }, true);

        // Un clic en la etiqueta o un aviso de "campo requerido" enfocan el select: se redirige al botón.
        select.addEventListener("focus", () => boton.focus());
        select.addEventListener("invalid", () => boton.classList.add("border-red-400"));
        select.addEventListener("change", () => boton.classList.remove("border-red-400"));

        // ---------- Sincronización con el select original ----------
        // Otros scripts cambian las opciones (innerHTML/appendChild), el disabled o el valor.
        new MutationObserver(() => {
            sincronizar();
            if (!panel.hidden) { construirLista(); filtrar(); }
        }).observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"] });

        Object.defineProperty(select, "value", {
            configurable: true,
            get() { return valorOriginal.get.call(this); },
            set(valor) { valorOriginal.set.call(this, valor); sincronizar(); }
        });

        // form.reset() restablece el select sin avisar.
        select.form?.addEventListener("reset", () => setTimeout(sincronizar, 0));

        sincronizar();
    }

    function iniciar() {
        document.querySelectorAll("select[data-select-buscable]").forEach(mejorar);
    }

    window.SelectBuscable = { mejorar };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
    else iniciar();
})();
