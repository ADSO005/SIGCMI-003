// Editor semanal de horarios: abre la semana completa y permite ajustar las horas de cada día.
// Los datos de los médicos llegan en window.medicosHorarios; se guarda con PUT /admin/medicos/:id/semana.
(() => {
    const HORA_MIN = 7;
    const HORA_MAX = 19; // última hora abierta: 18:00-19:00
    const DIAS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
    const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const TODAS = Array.from({ length: HORA_MAX - HORA_MIN }, (_, i) => HORA_MIN + i);

    const modal = document.getElementById("editorSemana");
    if (!modal) return;

    const el = {
        medico: document.getElementById("editorSemanaMedico"),
        rango: document.getElementById("editorSemanaRango"),
        estado: document.getElementById("editorSemanaEstado"),
        aviso: document.getElementById("editorSemanaAviso"),
        dias: document.getElementById("editorSemanaDias"),
        horas: document.getElementById("editorSemanaHoras"),
        diaTitulo: document.getElementById("editorDiaTitulo"),
        diaResumen: document.getElementById("editorDiaResumen"),
        mensaje: document.getElementById("editorSemanaMensaje"),
        anterior: document.getElementById("editorSemanaAnterior"),
        siguiente: document.getElementById("editorSemanaSiguiente"),
        guardar: document.getElementById("editorSemanaGuardar"),
        descartar: document.getElementById("editorSemanaDescartar"),
    };

    const state = {
        medico: null,
        inicio: null, // lunes de la semana (Date local)
        borrador: {}, // { Lunes: Set(horas) }
        original: "",
        nueva: false,
        ajustada: false,
        dia: 0,
        guardando: false,
    };

    const texto = (fecha) =>
        `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
    const sumarDias = (fecha, dias) => {
        const nueva = new Date(fecha);
        nueva.setDate(nueva.getDate() + dias);
        return nueva;
    };
    const lunesDe = (fecha) => {
        const lunes = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
        lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
        return lunes;
    };
    const hoy = () => {
        const ahora = new Date();
        return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    };
    const fechaCorta = (fecha) => fecha.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
    const hh = (hora) => `${String(hora).padStart(2, "0")}:00`;

    const fechaDia = (indice) => sumarDias(state.inicio, indice);
    const esPasado = (indice) => fechaDia(indice) < hoy();
    const horasDe = (indice) => state.borrador[DIAS[indice]];
    const serializar = () => JSON.stringify(DIAS.map((dia) => [...state.borrador[dia]].sort((a, b) => a - b)));
    const hayCambios = () => serializar() !== state.original;

    function cargarSemana() {
        const desde = texto(state.inicio);
        const hasta = texto(sumarDias(state.inicio, 6));
        const filas = (state.medico.horarios || []).filter(
            (h) => String(h.fecha_inicio).slice(0, 10) === desde && String(h.fecha_fin).slice(0, 10) === hasta
        );

        state.nueva = filas.length === 0;
        state.ajustada = false;
        state.borrador = {};

        DIAS.forEach((dia, indice) => {
            const horas = new Set();
            if (state.nueva) {
                if (!esPasado(indice)) TODAS.forEach((h) => horas.add(h));
            } else {
                for (const fila of filas.filter((f) => f.dia_semana === dia)) {
                    const [hi, mi] = String(fila.hora_inicio).split(":").map(Number);
                    const [hf, mf] = String(fila.hora_fin).split(":").map(Number);
                    if (mi || mf) state.ajustada = true;
                    for (let h = Math.ceil((hi * 60 + mi) / 60); h < Math.floor((hf * 60 + mf) / 60); h++) {
                        if (h >= HORA_MIN && h < HORA_MAX) horas.add(h);
                    }
                }
            }
            state.borrador[dia] = horas;
        });

        // Una semana nueva se puede guardar tal cual; solo se pide confirmar al descartar si hubo ediciones.
        state.original = serializar();
        el.mensaje.textContent = "";
    }

    function resumenDia(indice) {
        const n = horasDe(indice).size;
        return n === 0 ? "Cerrado" : `${n} h`;
    }

    function pintarDias() {
        el.dias.replaceChildren();
        DIAS.forEach((dia, indice) => {
            const fecha = fechaDia(indice);
            const pasado = esPasado(indice);
            const abierto = horasDe(indice).size > 0;
            const seleccionado = indice === state.dia;

            const boton = document.createElement("button");
            boton.type = "button";
            boton.dataset.dia = String(indice);
            boton.disabled = false;
            boton.setAttribute("aria-pressed", String(seleccionado));
            boton.setAttribute("aria-label", `${DIAS_CORTOS[indice]} ${fechaCorta(fecha)}: ${pasado ? "día pasado" : resumenDia(indice)}`);
            boton.className = [
                "flex min-h-[76px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-2 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#335CD8]",
                seleccionado ? "border-[#335CD8] bg-[#335CD8] text-white shadow-sm" : "border-[#E2E8F0] bg-white text-[#001B4D] hover:bg-[#335CD8]/5",
                pasado ? "opacity-50" : "",
            ].join(" ");

            const nombre = document.createElement("span");
            nombre.className = "text-[11px] font-semibold uppercase tracking-wide sm:text-xs";
            nombre.textContent = DIAS_CORTOS[indice];

            const numero = document.createElement("span");
            numero.className = "text-lg font-bold leading-none sm:text-xl";
            numero.textContent = String(fecha.getDate());

            const estado = document.createElement("span");
            estado.className = [
                "mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none sm:text-[11px]",
                seleccionado ? "bg-white/20 text-white" : abierto ? "bg-[#059669]/10 text-[#059669]" : "bg-slate-100 text-slate-500",
            ].join(" ");
            estado.textContent = pasado ? "Pasó" : resumenDia(indice);

            boton.append(nombre, numero, estado);
            el.dias.append(boton);
        });
    }

    function pintarHoras() {
        const indice = state.dia;
        const pasado = esPasado(indice);
        const abiertas = horasDe(indice);
        const fecha = fechaDia(indice);

        const titulo = fecha.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }).replace(",", "");
        el.diaTitulo.textContent = titulo.charAt(0).toUpperCase() + titulo.slice(1);
        el.diaResumen.textContent = pasado
            ? "Este día ya pasó y no se puede modificar."
            : abiertas.size === 0
                ? "Día cerrado: sin horas de atención."
                : `${abiertas.size} h abiertas`;

        // Los botones se crean una sola vez y luego se actualizan: así el arrastre táctil no los pierde.
        const existentes = new Map([...el.horas.children].map((nodo) => [Number(nodo.dataset.hora), nodo]));
        TODAS.forEach((hora) => {
            const abierta = abiertas.has(hora);
            const boton = existentes.get(hora) ?? document.createElement("button");
            boton.replaceChildren();
            boton.type = "button";
            boton.dataset.hora = String(hora);
            boton.disabled = pasado;
            boton.setAttribute("aria-pressed", String(abierta));
            boton.setAttribute("aria-label", `${hh(hora)} a ${hh(hora + 1)}: ${abierta ? "abierta" : "cerrada"}`);
            boton.className = [
                "flex min-h-[52px] flex-col items-center justify-center rounded-xl border text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#335CD8] disabled:cursor-not-allowed disabled:opacity-50",
                abierta ? "border-[#335CD8] bg-[#335CD8] text-white" : "border-[#E2E8F0] bg-white text-slate-500 hover:bg-[#335CD8]/5",
            ].join(" ");

            const rango = document.createElement("span");
            rango.textContent = hh(hora);
            const marca = document.createElement("span");
            marca.className = "text-[11px] font-medium opacity-90";
            marca.textContent = abierta ? "✓ Abierta" : "Cerrada";
            boton.append(rango, marca);
            if (!existentes.has(hora)) el.horas.append(boton);
        });

        modal.querySelectorAll("[data-accion]").forEach((boton) => {
            boton.disabled = pasado;
        });
    }

    function pintarEncabezado() {
        const fin = sumarDias(state.inicio, 6);
        el.rango.textContent = `${fechaCorta(state.inicio)} – ${fechaCorta(fin)} de ${fin.getFullYear()}`;
        el.estado.textContent = state.nueva ? "Semana sin abrir" : "Agenda abierta";
        el.anterior.disabled = sumarDias(state.inicio, -1) < lunesDe(hoy());

        const avisos = [];
        if (state.nueva) avisos.push("Esta semana aún no tiene agenda. Se abrieron todas las horas de lunes a domingo (07:00 a 19:00); cierra las que no apliquen y guarda.");
        if (state.ajustada) avisos.push("Algunas franjas no estaban en horas completas y se ajustaron a horas completas.");
        el.aviso.textContent = avisos.join(" ");
        el.aviso.classList.toggle("hidden", avisos.length === 0);

        el.guardar.disabled = state.guardando || !(hayCambios() || state.nueva);
        el.descartar.disabled = state.guardando || !hayCambios();
    }

    function pintar() {
        pintarEncabezado();
        pintarDias();
        pintarHoras();
    }

    function fijarHoras(indice, horas) {
        if (esPasado(indice)) return;
        state.borrador[DIAS[indice]] = new Set(horas);
    }

    function conmutar(hora, valor) {
        const horas = horasDe(state.dia);
        if (valor) horas.add(hora);
        else horas.delete(hora);
    }

    let pintando = null; // valor que se aplica mientras se arrastra (true = abrir)

    el.horas.addEventListener("pointerdown", (evento) => {
        const boton = evento.target.closest("[data-hora]");
        if (!boton || boton.disabled || evento.button > 0) return;
        evento.preventDefault();
        const hora = Number(boton.dataset.hora);
        pintando = !horasDe(state.dia).has(hora);
        conmutar(hora, pintando);
        pintar();
        el.horas.querySelector(`[data-hora="${hora}"]`)?.focus();
    });

    el.horas.addEventListener("pointermove", (evento) => {
        if (pintando === null) return;
        const destino = document.elementFromPoint(evento.clientX, evento.clientY)?.closest("[data-hora]");
        if (!destino || destino.disabled || !el.horas.contains(destino)) return;
        const hora = Number(destino.dataset.hora);
        if (horasDe(state.dia).has(hora) === pintando) return;
        conmutar(hora, pintando);
        pintar();
    });

    const terminarArrastre = () => { pintando = null; };
    document.addEventListener("pointerup", terminarArrastre);
    document.addEventListener("pointercancel", terminarArrastre);

    // Teclado: Enter o espacio generan un clic sin puntero (detail === 0).
    el.horas.addEventListener("click", (evento) => {
        const boton = evento.target.closest("[data-hora]");
        if (!boton || boton.disabled || evento.detail !== 0) return;
        const hora = Number(boton.dataset.hora);
        conmutar(hora, !horasDe(state.dia).has(hora));
        pintar();
        el.horas.querySelector(`[data-hora="${hora}"]`)?.focus();
    });

    el.dias.addEventListener("click", (evento) => {
        const boton = evento.target.closest("[data-dia]");
        if (!boton) return;
        state.dia = Number(boton.dataset.dia);
        pintar();
        el.dias.querySelector(`[data-dia="${state.dia}"]`)?.focus();
    });

    modal.addEventListener("click", (evento) => {
        const boton = evento.target.closest("[data-accion]");
        if (!boton || boton.disabled) return;
        const horasActuales = [...horasDe(state.dia)];
        el.mensaje.textContent = "";
        const accion = boton.dataset.accion;

        if (accion === "dia-completo") fijarHoras(state.dia, TODAS);
        else if (accion === "manana") fijarHoras(state.dia, TODAS.filter((h) => h < 12));
        else if (accion === "tarde") fijarHoras(state.dia, TODAS.filter((h) => h >= 12));
        else if (accion === "cerrar-dia") fijarHoras(state.dia, []);
        else if (accion === "copiar-habiles" || accion === "copiar-todos") {
            const destinos = accion === "copiar-habiles" ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5, 6];
            destinos.forEach((indice) => fijarHoras(indice, horasActuales));
        }
        pintar();
        if (accion.startsWith("copiar")) {
            el.mensaje.className = "min-h-5 text-sm text-[#059669]";
            el.mensaje.textContent = accion === "copiar-habiles" ? "Horas copiadas de lunes a viernes." : "Horas copiadas a toda la semana.";
        }
    });

    function confirmarDescarte() {
        return !hayCambios() || window.confirm("Tienes cambios sin guardar. ¿Quieres descartarlos?");
    }

    function irASemana(inicio) {
        state.inicio = inicio;
        state.dia = 0;
        cargarSemana();
        const primero = DIAS.findIndex((_, i) => !esPasado(i));
        state.dia = primero === -1 ? 0 : Math.max(0, primero);
        if (state.inicio.getTime() === lunesDe(hoy()).getTime()) {
            const indiceHoy = (hoy().getDay() + 6) % 7;
            state.dia = indiceHoy;
        }
        pintar();
    }

    el.anterior.addEventListener("click", () => { if (confirmarDescarte()) irASemana(sumarDias(state.inicio, -7)); });
    el.siguiente.addEventListener("click", () => { if (confirmarDescarte()) irASemana(sumarDias(state.inicio, 7)); });
    el.descartar.addEventListener("click", () => { cargarSemana(); pintar(); });

    function cerrar() {
        if (!confirmarDescarte()) return;
        modal.close();
    }
    document.getElementById("editorSemanaCerrar").addEventListener("click", cerrar);
    modal.addEventListener("cancel", (evento) => {
        if (hayCambios() && !window.confirm("Tienes cambios sin guardar. ¿Quieres descartarlos?")) evento.preventDefault();
    });
    modal.addEventListener("pointerdown", (evento) => {
        if (evento.target === modal) cerrar();
    });

    el.guardar.addEventListener("click", async () => {
        if (state.guardando || !(hayCambios() || state.nueva)) return;
        state.guardando = true;
        el.guardar.disabled = true;
        el.mensaje.className = "min-h-5 text-sm text-slate-600";
        el.mensaje.textContent = "Guardando agenda…";

        const dias = {};
        DIAS.forEach((dia, indice) => {
            if (!esPasado(indice)) dias[dia] = [...state.borrador[dia]].sort((a, b) => a - b);
        });

        try {
            const respuesta = await fetch(`/admin/medicos/${encodeURIComponent(state.medico.id_medico)}/semana`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fecha_inicio: texto(state.inicio),
                    fecha_fin: texto(sumarDias(state.inicio, 6)),
                    dias,
                }),
            });
            const datos = await respuesta.json().catch(() => ({}));
            if (!respuesta.ok || !datos.ok) throw new Error(datos.mensaje || "No se pudo guardar la agenda.");

            state.original = serializar();
            state.nueva = false;
            el.mensaje.className = "min-h-5 text-sm font-semibold text-[#059669]";
            el.mensaje.textContent = "Agenda guardada. Actualizando…";
            // Se recarga la página para refrescar las tarjetas de los médicos.
            setTimeout(() => window.location.reload(), 700);
        } catch (error) {
            state.guardando = false;
            el.mensaje.className = "min-h-5 text-sm font-semibold text-red-600";
            el.mensaje.textContent = error.message;
            pintarEncabezado();
        }
    });

    function abrir(medicoId, semana) {
        const medico = (window.medicosHorarios || []).find((m) => String(m.id_medico) === String(medicoId));
        if (!medico) return;
        state.medico = medico;
        state.guardando = false;
        el.medico.textContent = `${medico.nombre} · ${medico.especialidad}`;

        const inicio = /^\d{4}-\d{2}-\d{2}$/.test(semana || "") ? lunesDe(new Date(`${semana}T00:00:00`)) : lunesDe(hoy());
        irASemana(inicio);
        modal.showModal();
    }

    document.addEventListener("click", (evento) => {
        const boton = evento.target.closest(".btnGestionarHorario");
        if (!boton) return;
        abrir(boton.dataset.medicoId, boton.dataset.semana);
    });
})();

(() => {
    const buscador = document.getElementById("buscarMedicoHorario");
    if (!buscador) return;

    const tarjetas = document.querySelectorAll(".tarjetaMedicoHorario");
    const sinResultados = document.getElementById("sinResultadosMedicos");

    buscador.addEventListener("input", () => {
        const busqueda = buscador.value;
        let encontrados = 0;

        tarjetas.forEach((tarjeta) => {
            const coincide = Busqueda.coincide(busqueda, tarjeta.dataset.nombre, tarjeta.dataset.especialidad);
            tarjeta.classList.toggle("hidden", !coincide);
            if (coincide) encontrados++;
        });

        sinResultados?.classList.toggle("hidden", encontrados !== 0);
    });
})();
