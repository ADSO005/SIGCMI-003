document.addEventListener("DOMContentLoaded", () => {

    const citas = window.citasCalendario || [];

    const calendarioGrid = document.getElementById("calendarioGrid");
    const tituloMes = document.getElementById("tituloMes");
    const subtituloMes = document.getElementById("subtituloMes");

    const btnMesAnterior = document.getElementById("btnMesAnterior");
    const btnHoy = document.getElementById("btnHoy");
    const btnMesSiguiente = document.getElementById("btnMesSiguiente");
    const filtroEstado = document.getElementById("filtroEstado");

    let fechaActual = new Date();

    // --------------------------------------------------
    // FECHA ACTUAL
    // --------------------------------------------------

    const fechaActualTexto = document.getElementById("fechaActualTexto");

    if (fechaActualTexto) {
        let texto = fechaActual.toLocaleDateString("es-CO", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        fechaActualTexto.textContent =
            texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    // --------------------------------------------------
    // UTILIDADES
    // --------------------------------------------------

    function obtenerFechaLocal(fecha) {
        const partes = fecha.split("-");

        return new Date(
            Number(partes[0]),
            Number(partes[1]) - 1,
            Number(partes[2])
        );
    }

    function formatearHora(hora) {
        if (!hora) return "";

        const partes = hora.split(":");
        const horas = Number(partes[0]);
        const minutos = partes[1];

        const periodo = horas >= 12 ? "PM" : "AM";
        const hora12 = horas % 12 || 12;

        return `${hora12}:${minutos} ${periodo}`;
    }

    function obtenerClaseEstado(estado) {

        switch (estado) {
            case "Pendiente":
                return "bg-amber-100 text-amber-700";

            case "En curso":
                return "bg-blue-100 text-blue-700";

            case "Completada":
                return "bg-green-100 text-green-700";

            case "Cancelada":
                return "bg-red-100 text-red-700";

            default:
                return "bg-slate-100 text-slate-700";
        }
    }

    // --------------------------------------------------
    // RENDERIZAR CALENDARIO
    // --------------------------------------------------

    function renderizarCalendario() {

        if (!calendarioGrid) return;

        calendarioGrid.innerHTML = "";

        const año = fechaActual.getFullYear();
        const mes = fechaActual.getMonth();

        const primerDia = new Date(año, mes, 1);
        const ultimoDia = new Date(año, mes + 1, 0);

        let diaInicio = primerDia.getDay();

        // Convertir domingo = 0 a lunes = 0
        diaInicio = diaInicio === 0 ? 6 : diaInicio - 1;

        const cantidadDias = ultimoDia.getDate();

        // --------------------------------------------------
        // TÍTULO
        // --------------------------------------------------

        const nombreMes = fechaActual.toLocaleDateString("es-CO", {
            month: "long"
        });

        if (tituloMes) {
            tituloMes.textContent =
                nombreMes.charAt(0).toUpperCase() +
                nombreMes.slice(1) +
                ` ${año}`;
        }

        if (subtituloMes) {
            subtituloMes.textContent =
                `${cantidadDias} días`;
        }

        // --------------------------------------------------
        // DÍAS ANTERIORES
        // --------------------------------------------------

        for (let i = 0; i < diaInicio; i++) {

            const celda = document.createElement("div");

            celda.className =
                "min-h-[130px] bg-slate-50 border-r border-b border-slate-200";

            calendarioGrid.appendChild(celda);
        }

        // --------------------------------------------------
        // DÍAS DEL MES
        // --------------------------------------------------

        for (let dia = 1; dia <= cantidadDias; dia++) {

            const fechaCelda = new Date(año, mes, dia);

            const añoTexto = fechaCelda.getFullYear();
            const mesTexto = String(
                fechaCelda.getMonth() + 1
            ).padStart(2, "0");

            const diaTexto = String(
                fechaCelda.getDate()
            ).padStart(2, "0");

            const fechaISO =
                `${añoTexto}-${mesTexto}-${diaTexto}`;

            const hoy = new Date();

            const esHoy =
                fechaCelda.getDate() === hoy.getDate() &&
                fechaCelda.getMonth() === hoy.getMonth() &&
                fechaCelda.getFullYear() === hoy.getFullYear();

            const celda = document.createElement("div");

            celda.className =
                "min-h-[130px] bg-white border-r border-b border-slate-200 p-2";

            // --------------------------------------------------
            // NÚMERO DEL DÍA
            // --------------------------------------------------

            const encabezadoDia = document.createElement("div");

            encabezadoDia.className =
                "flex items-center justify-between mb-2";

            const numeroDia = document.createElement("span");

            numeroDia.textContent = dia;

            numeroDia.className = esHoy
                ? "flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold"
                : "font-semibold text-slate-700";

            encabezadoDia.appendChild(numeroDia);

            celda.appendChild(encabezadoDia);

            // --------------------------------------------------
            // CITAS DEL DÍA
            // --------------------------------------------------

            const filtro = filtroEstado
                ? filtroEstado.value
                : "Todos";

            const citasDelDia = citas.filter(cita => {

                if (!cita.fecha) return false;

                const coincideFecha =
                    String(cita.fecha).substring(0, 10) === fechaISO;

                const coincideEstado =
                    filtro === "Todos" ||
                    cita.estado === filtro;

                return coincideFecha && coincideEstado;
            });

            citasDelDia
                .sort((a, b) =>
                    String(a.hora || "").localeCompare(
                        String(b.hora || "")
                    )
                )
                .forEach(cita => {

                    const citaElemento =
                        document.createElement("button");

                    citaElemento.type = "button";

                    citaElemento.className =
                        "w-full text-left mb-1 p-2 rounded-lg border border-slate-200 hover:shadow-md transition bg-slate-50";

                    citaElemento.dataset.id = cita.id_cita;

                    citaElemento.innerHTML = `
                        <div class="flex items-center justify-between gap-1">
                            <span class="text-xs font-bold text-blue-600">
                                ${formatearHora(cita.hora)}
                            </span>

                            <span class="text-[10px] px-2 py-0.5 rounded-full ${obtenerClaseEstado(cita.estado)}">
                                ${cita.estado}
                            </span>
                        </div>

                        <p class="text-sm font-semibold text-slate-800 truncate mt-1">
                            ${cita.paciente}
                        </p>

                        <p class="text-xs text-slate-500 truncate">
                            ${cita.medico}
                        </p>

                        <p class="text-[11px] text-slate-400 truncate">
                            ${cita.especialidad}
                        </p>
                    `;

                    citaElemento.addEventListener("click", () => {
                        abrirDetalleCita(cita.id_cita);
                    });

                    celda.appendChild(citaElemento);
                });

            calendarioGrid.appendChild(celda);
        }
    }

    // --------------------------------------------------
    // VER DETALLE DE CITA
    // --------------------------------------------------

    async function abrirDetalleCita(id) {
        try {
            const respuesta = await fetch(`/admin/citas/${id}`);

            if (!respuesta.ok) {
                throw new Error("No se pudo obtener la información de la cita.");
            }

            const cita = await respuesta.json();

            console.log("Cita seleccionada:", cita);

            const data = cita.cita || cita;

            const modal = document.getElementById("modalVerCita");

            if (!modal) {
                console.error("No se encontró el modal modalVerCita");
                return;
            }

            const paciente = data.Paciente?.Usuario;
            const medico = data.Medico?.Usuario;
            const especialidad = data.Medico?.Especialidad;
            const estado = data.Estado;

            document.getElementById("detalleCitaId").textContent =
                data.id_cita ?? "-";

            document.getElementById("detalleEstado").textContent =
                estado?.nombre ?? "-";

            document.getElementById("detallePaciente").textContent =
                paciente
                    ? `${paciente.nombres} ${paciente.apellidos}`
                    : "-";

            document.getElementById("detalleDocumento").textContent =
                paciente?.numero_documento ?? "-";

            document.getElementById("detalleTelefonoPaciente").textContent =
                paciente?.telefono ?? "-";

            document.getElementById("detalleCorreoPaciente").textContent =
                paciente?.correo ?? "-";

            document.getElementById("detalleMedico").textContent =
                medico
                    ? `${medico.nombres} ${medico.apellidos}`
                    : "-";

            document.getElementById("detalleEspecialidad").textContent =
                especialidad?.nombre ?? "-";

            document.getElementById("detalleTelefonoMedico").textContent =
                medico?.telefono ?? "-";

            document.getElementById("detalleCorreoMedico").textContent =
                medico?.correo ?? "-";

            document.getElementById("detalleFecha").textContent =
                data.fecha ?? "-";

            document.getElementById("detalleHora").textContent =
                data.hora ?? "-";

            document.getElementById("detalleMotivo").textContent =
                data.motivo_consulta || "Sin motivo registrado";

            modal.classList.remove("flex");

            modal.classList.remove(
                "hidden"
            );

            modal.classList.add(
                "flex"
            );

        } catch (error) {
            console.error("Error al mostrar la cita:", error);
        }
    }

    // --------------------------------------------------
    // BOTONES DE NAVEGACIÓN
    // --------------------------------------------------

    if (btnMesAnterior) {

        btnMesAnterior.addEventListener("click", () => {

            fechaActual.setMonth(
                fechaActual.getMonth() - 1
            );

            renderizarCalendario();
        });
    }

    if (btnMesSiguiente) {

        btnMesSiguiente.addEventListener("click", () => {

            fechaActual.setMonth(
                fechaActual.getMonth() + 1
            );

            renderizarCalendario();
        });
    }

    if (btnHoy) {

        btnHoy.addEventListener("click", () => {

            fechaActual = new Date();

            renderizarCalendario();
        });
    }

    if (filtroEstado) {

        filtroEstado.addEventListener("change", () => {
            renderizarCalendario();
        });
    }

    // --------------------------------------------------
    // CERRAR MODAL
    // --------------------------------------------------

    const btnCerrar =
        document.getElementById("btnCerrarVerCita");

    const btnCerrar2 =
        document.getElementById("btnCerrarVerCita2");

    const modal =
        document.getElementById("modalVerCita");

    if (btnCerrar) {

        btnCerrar.addEventListener("click", () => {
            modal?.classList.add("hidden");
        });
    }

    if (btnCerrar2) {

        btnCerrar2.addEventListener("click", () => {
            modal?.classList.add("hidden");
        });
    }

    // --------------------------------------------------
    // INICIAR
    // --------------------------------------------------

    console.log("Citas recibidas por calendario:", citas);

    renderizarCalendario();
});