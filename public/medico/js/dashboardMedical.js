// TOGGLE SIDEBAR (Ajustado)
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const main    = document.getElementById("mainContent");
  const toggleBtn = document.getElementById("toggleBtn");
  const overlay = document.getElementById("sidebarOverlay");

  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("open");
    if (overlay) overlay.classList.toggle("show");
  } else {
    sidebar.classList.toggle("collapsed");
    main.classList.toggle("collapsed");
    
    // Alineación suave del botón al colapsar
    if (toggleBtn) {
      toggleBtn.style.marginLeft = sidebar.classList.contains("collapsed") ? "0px" : "";
    }
  }
}

function cerrarSidebarMovil() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("show");
}

// NAVEGACIÓN ENTRE VISTAS
function cambiarVista(e, viewId, link) {
  e.preventDefault();
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("preActive"));
  link.classList.add("preActive");
  
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const vistaTarget = document.getElementById(viewId);
  if (vistaTarget) vistaTarget.classList.add("active");
  
  if (window.innerWidth <= 768) cerrarSidebarMovil();
}

// CERRAR SESIÓN
function cerrarSesion() {
  if (confirm("¿Seguro que deseas cerrar sesión?")) {
    alert("Sesión cerrada. Redirigiendo al login...");
  }
}

// BOTON INICIAR CONSULTA
async function iniciarConsulta(id) {
    try {
        // Obtener el ID numérico de la cita
        const idCita = id.replace("cita", "");

        // Enviar la solicitud al servidor
        const respuesta = await fetch(`/medico/citas/${idCita}/estado`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                estado_id: 2
            })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            alert(resultado.mensaje || "No se pudo iniciar la consulta");
            return;
        }

        // Actualizar la interfaz después de guardar en MySQL
        const cita = document.getElementById(id);

        if (!cita) return;

        cita.classList.replace("estado-pendiente", "estado-encurso");

        const state = cita.querySelector(".state");

        if (state) {
            state.textContent = "En Curso";
            state.className = "state yellowState";
        }

        const hour = cita.querySelector(".hour");

        if (hour) {
            hour.classList.add("hour-encurso");
        }

        const btn = cita.querySelector(".btn-iniciar");

        if (btn) {
            btn.textContent = "Finalizar Consulta";
            btn.className = "btn-consulta btn-finalizar";
            btn.setAttribute("onclick", `finalizarConsulta('${id}')`);
        }

        console.log("✅ Consulta iniciada correctamente:", resultado);

    } catch (error) {
        console.error("❌ Error al iniciar consulta:", error);
        alert("Ocurrió un error al conectar con el servidor");
    }
}

// BOTON FINALIZAR CONSULTA
async function finalizarConsulta(id) {
    try {
        const idCita = id.replace("cita", "");

        // Actualizar el estado en MySQL
        const respuesta = await fetch(`/medico/citas/${idCita}/estado`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                estado_id: 3
            })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            alert(resultado.mensaje || "No se pudo finalizar la consulta");
            return;
        }

        // Actualizar la interfaz
        const cita = document.getElementById(id);

        if (!cita) return;

        cita.classList.replace("estado-encurso", "estado-completada");

        const state = cita.querySelector(".state");

        if (state) {
            state.textContent = "Completada";
            state.className = "state greenState";
        }

        const hour = cita.querySelector(".hour");

        if (hour) {
            hour.classList.remove("hour-encurso");
        }

        const btnRow = cita.querySelector(".btn-full-row");

        if (btnRow) {
            btnRow.style.display = "none";
        }

        console.log("✅ Consulta finalizada correctamente:", resultado);

    } catch (error) {
        console.error("❌ Error al finalizar consulta:", error);
        alert("Ocurrió un error al conectar con el servidor");
    }
}

// MODAL GESTIÓN CITAS
function abrirModal() {
  const modal = document.getElementById("modalGestionCitas");
  if (modal) {
    modal.classList.add("abierto");
    actualizarSubtitulo();
  }
}

function cerrarModal() {
  const modal = document.getElementById("modalGestionCitas");
  if (modal) modal.classList.remove("abierto");
}

function filtrarCitas() {
  const inputSearch = document.querySelector(".modal-gc-search");
  const selectEstado = document.querySelector(".modal-gc-select");
  
  const texto  = inputSearch ? inputSearch.value.toLowerCase() : "";
  const estado = selectEstado ? selectEstado.value : "";
  let visibles  = 0;

  document.querySelectorAll(".cita-card").forEach(card => {
    const coincide = card.textContent.toLowerCase().includes(texto) &&
                     (!estado || card.dataset.estado === estado);
    card.style.display = coincide ? "" : "none";
    if (coincide) visibles++;
  });

  const sinRes = document.querySelector(".sin-resultados");
  if (sinRes) sinRes.remove();

  if (visibles === 0) {
    const msg = document.createElement("p");
    msg.className  = "sin-resultados";
    msg.textContent = "No se encontraron citas.";
    const lista = document.getElementById("listaCitas");
    if (lista) lista.appendChild(msg);
  }

  actualizarSubtitulo(visibles);
}

function actualizarSubtitulo(n) {
  const total = n !== undefined ? n : document.querySelectorAll(".cita-card").length;
  const subtitulo = document.getElementById("modalSubtitulo");
  if (subtitulo) subtitulo.textContent = `Total de citas ${total}`;
}

// REPROGRAMAR CITA
function abrirReprogramar(btn) {
  const card = btn.closest(".cita-card");
  const infoUser = card.querySelector(".cita-info:nth-child(4)");
  
  if (infoUser) {
    const nombre = infoUser.textContent.replace("👤","").trim();
    const lblNombre = document.getElementById("reprogramarNombre");
    if (lblNombre) lblNombre.textContent = nombre;
  }

  document.getElementById("modalGestionCitas")?.classList.remove("abierto");
  document.getElementById("modalReprogramar")?.classList.add("abierto");
}

function cerrarReprogramar() {
  document.getElementById("modalReprogramar")?.classList.remove("abierto");
  document.getElementById("modalGestionCitas")?.classList.add("abierto");
}

function cerrarReprogramarFuera(event) {
  if (event.target.id === "modalReprogramar") cerrarReprogramar();
}

// MODAL HORARIO
const diasHorario = new Set([
  "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"
]);
let peticionHorarios = null;
let versionCargaHorarios = 0;

function normalizarHoraHorario(valor) {
  if (typeof valor !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(valor)) {
    throw new Error("La respuesta contiene horas no validas.");
  }
  return valor.slice(0, 5);
}

function obtenerDiaHorario(diaId) {
  if (typeof diaId !== "string" || !diasHorario.has(diaId.slice(3)) || !diaId.startsWith("dia")) {
    throw new Error("La respuesta contiene un dia no valido.");
  }
  const dia = document.getElementById(diaId);
  if (!dia || !document.getElementById("modalHorarios")?.contains(dia)) {
    throw new Error("No se encontro el dia del horario.");
  }
  return dia;
}

function mensajeHorarios(texto, error = false) {
  const mensaje = document.getElementById("estadoCargaHorarios");
  if (mensaje) {
    mensaje.textContent = texto;
    mensaje.setAttribute("role", error ? "alert" : "status");
  }
}

function limpiarHorarios() {
  document.querySelectorAll("#modalHorarios .dia-row").forEach(dia => {
    dia.classList.remove("activo");
    dia.querySelector('input[type="checkbox"]').checked = false;
    dia.querySelector(".btn-agregar-hora").style.display = "none";
    dia.querySelector(".dia-horas").replaceChildren();
  });
}

function bloquearEdicionHorarios(bloquear) {
  document.querySelectorAll('#modalHorarios .dia-row input, #modalHorarios .dia-row button').forEach(control => {
    control.disabled = bloquear;
  });
  const guardar = document.getElementById("guardarHorarioBtn");
  if (guardar) guardar.disabled = true;
}

async function abrirModalHorarios() {
  const modal = document.getElementById("modalHorarios");
  if (!modal) return;
  peticionHorarios?.abort();
  const version = ++versionCargaHorarios;
  const peticion = new AbortController();
  peticionHorarios = peticion;
  limpiarHorarios();
  bloquearEdicionHorarios(true);
  mensajeHorarios("Cargando horarios. El guardado todavia no esta disponible.");
  modal.classList.add("abierto");

  try {
    const respuesta = await fetch("/medico/horarios", {
      credentials: "same-origin",
      cache: "no-store",
      signal: peticion.signal
    });
    if (version !== versionCargaHorarios) return;
    if (respuesta.redirected || respuesta.status === 401) {
      throw new Error("La sesion ha expirado. Inicia sesion nuevamente para consultar tus horarios.");
    }
    if (!respuesta.ok) {
      const mensajes = {
        403: "No tienes permiso para consultar estos horarios.",
        404: "No se encontro tu perfil medico."
      };
      throw new Error(mensajes[respuesta.status] || "No se pudieron cargar los horarios. Intenta abrir el modal nuevamente.");
    }
    if (!respuesta.headers.get("content-type")?.includes("application/json")) {
      throw new Error("El servidor no devolvio una respuesta JSON valida.");
    }
    const datos = await respuesta.json();
    if (version !== versionCargaHorarios) return;
    if (!datos || !Array.isArray(datos.horarios)) {
      throw new Error("La respuesta de horarios no es valida.");
    }
    const ids = new Set();
    // Validar todo antes de insertar: un registro incorrecto invalida la carga completa.
    const horarios = datos.horarios.map(horario => {
      if (!horario || !Number.isSafeInteger(horario.id_horario) || horario.id_horario <= 0 ||
          ids.has(horario.id_horario) || !diasHorario.has(horario.dia_semana) ||
          !["Pendiente", "Aprobado", "Rechazado"].includes(horario.estado)) {
        throw new Error("La respuesta contiene un horario no valido.");
      }
      ids.add(horario.id_horario);
      const inicio = normalizarHoraHorario(horario.hora_inicio);
      const fin = normalizarHoraHorario(horario.hora_fin);
      if (inicio >= fin) throw new Error("La respuesta contiene un rango horario no valido.");
      obtenerDiaHorario("dia" + horario.dia_semana);
      return { ...horario, inicio, fin };
    });
    horarios.forEach(horario => {
      const diaId = "dia" + horario.dia_semana;
      mostrarDiaActivo(diaId);
      const fila = mostrarHorario(diaId, horario.inicio, horario.fin);
      fila.dataset.idHorario = String(horario.id_horario);
      fila.dataset.estado = horario.estado;
    });
    bloquearEdicionHorarios(false);
    mensajeHorarios(horarios.length
      ? "Horarios cargados. Los cambios son temporales: el guardado todavia no esta disponible."
      : "No tienes horarios registrados. El guardado todavia no esta disponible.");
  } catch (error) {
    if (version !== versionCargaHorarios || error.name === "AbortError") return;
    limpiarHorarios();
    bloquearEdicionHorarios(true);
    mensajeHorarios(error instanceof SyntaxError
      ? "El servidor devolvio datos incorrectos. No se cargaron los horarios."
      : error.message || "No se pudieron cargar los horarios.", true);
  } finally {
    if (version === versionCargaHorarios) peticionHorarios = null;
  }
}

function cerrarModalHorarios() {
  ++versionCargaHorarios;
  peticionHorarios?.abort();
  peticionHorarios = null;
  document.getElementById("modalHorarios")?.classList.remove("abierto");
  limpiarHorarios();
  bloquearEdicionHorarios(true);
  mensajeHorarios("El guardado de horarios todavia no esta disponible.");
}

function cerrarModalHorariosFuera(e) {
  if (e.target.id === "modalHorarios") cerrarModalHorarios();
}

function mostrarDiaActivo(diaId) {
  const dia = obtenerDiaHorario(diaId);
  dia.querySelector('input[type="checkbox"]').checked = true;
  dia.classList.add("activo");
  dia.querySelector(".btn-agregar-hora").style.display = "block";
}

function mostrarHorario(diaId, inicio, fin) {
  const dia = obtenerDiaHorario(diaId);
  const horaInicio = normalizarHoraHorario(inicio);
  const horaFin = normalizarHoraHorario(fin);
  if (horaInicio >= horaFin) throw new Error("Rango horario no valido.");
  const fila = document.createElement("div");
  fila.className = "hora-row";
  const desde = document.createElement("input");
  desde.type = "time";
  desde.value = horaInicio;
  const separador = document.createElement("span");
  separador.textContent = "a";
  const hasta = document.createElement("input");
  hasta.type = "time";
  hasta.value = horaFin;
  const eliminar = document.createElement("button");
  eliminar.type = "button";
  eliminar.className = "btn-eliminar-hora";
  eliminar.textContent = String.fromCodePoint(0x1F5D1);
  eliminar.setAttribute("aria-label", "Eliminar rango horario");
  eliminar.addEventListener("click", () => fila.remove());
  fila.append(desde, separador, hasta, eliminar);
  dia.querySelector(".dia-horas").appendChild(fila);
  return fila;
}

function toggleDia(diaId, checkbox) {
  const dia = obtenerDiaHorario(diaId);
  if (checkbox.disabled) return;
  if (checkbox.checked) {
    mostrarDiaActivo(diaId);
    agregarHora(diaId);
  } else {
    dia.classList.remove("activo");
    dia.querySelector(".btn-agregar-hora").style.display = "none";
    dia.querySelector(".dia-horas").replaceChildren();
  }
}

function agregarHora(diaId) {
  const dia = obtenerDiaHorario(diaId);
  if (dia.querySelector('input[type="checkbox"]').disabled) return;
  mostrarHorario(diaId, "08:00", "12:00");
}

function guardarHorarios() {
  mensajeHorarios("El guardado de horarios todavia no esta disponible.");
}

// SELECCIONAR PACIENTE DE LA LISTA
async function seleccionarPaciente(element) {

  document.querySelectorAll(".paciente-item").forEach(item => {
    item.classList.remove("activo");
  });

  element.classList.add("activo");

  const idPaciente = element.dataset.id;

  if (!idPaciente) {
    console.error("No se encontró el ID del paciente");
    return;
  }

  try {

    const respuesta = await fetch(
      `/medico/pacientes/${idPaciente}`
    );

    if (!respuesta.ok) {
      throw new Error("No se pudo obtener el paciente");
    }

    const datos = await respuesta.json();

    const paciente = datos.paciente;
    const citas = datos.citas;
    const usuario = paciente.Usuario;

    // -----------------------------
    // DATOS PERSONALES
    // -----------------------------

    document.getElementById("detalleNombre").textContent =
      `${usuario.nombres} ${usuario.apellidos}`;

    const correo = document.getElementById("detalleCorreo");

    correo.textContent = usuario.correo || "No registrado";

    correo.href = usuario.correo
      ? `mailto:${usuario.correo}`
      : "#";

    document.getElementById("detalleTelefono").textContent =
      usuario.telefono || "No registrado";

    // -----------------------------
    // EDAD
    // -----------------------------

    document.getElementById("detalleEdad").textContent =
      calcularEdad(paciente.fecha_nacimiento);

    // -----------------------------
    // CANTIDAD DE CITAS
    // -----------------------------

    document.getElementById("detalleCitas").textContent =
      citas.length;

    // -----------------------------
    // ÚLTIMA VISITA
    // -----------------------------

    document.getElementById("detalleUltimaVisita").textContent =
      obtenerUltimaVisita(citas);

    // -----------------------------
    // DIAGNÓSTICOS
    // -----------------------------

    const citasConDiagnostico = citas.filter(
      cita => cita.Diagnostico
    );

    document.getElementById("detalleDiagnosticos").textContent =
      citasConDiagnostico.length;

    // -----------------------------
    // HISTORIAL
    // -----------------------------

    mostrarHistorial(citas);

  } catch (error) {

    console.error(
      "Error al cargar el paciente:",
      error
    );

  }
}

function calcularEdad(fechaNacimiento) {

  if (!fechaNacimiento) {
    return "No registrada";
  }

  const nacimiento = new Date(
    `${fechaNacimiento}T00:00:00`
  );

  const hoy = new Date();

  let edad =
    hoy.getFullYear() - nacimiento.getFullYear();

  const mes =
    hoy.getMonth() - nacimiento.getMonth();

  if (
    mes < 0 ||
    (mes === 0 && hoy.getDate() < nacimiento.getDate())
  ) {
    edad--;
  }

  return `${edad} años`;
}

function obtenerUltimaVisita(citas) {

  if (!citas || citas.length === 0) {
    return "Sin visitas";
  }

  const fecha = citas[0].fecha;

  if (!fecha) {
    return "Sin visitas";
  }

  return new Date(
    `${fecha}T00:00:00`
  ).toLocaleDateString("es-CO");
}

function mostrarHistorial(citas) {

  const contenedor =
    document.getElementById("historialPaciente");

  contenedor.innerHTML = "";

  const citasConDiagnostico = citas.filter(
    cita => cita.Diagnostico
  );

  if (citasConDiagnostico.length === 0) {

    contenedor.innerHTML = `
      <p>Este paciente no tiene diagnósticos registrados.</p>
    `;

    return;
  }

  citasConDiagnostico.forEach(cita => {

    const diagnostico = cita.Diagnostico;

    const card = document.createElement("div");

    card.className = "historial-card";

    const fecha = new Date(
      `${cita.fecha}T00:00:00`
    ).toLocaleDateString("es-CO");

    card.innerHTML = `
      <h4>${diagnostico.diagnostico || "Sin diagnóstico"}</h4>

      <p class="historial-fecha">
        ${fecha}
      </p>

      <p>
        <strong>Síntomas:</strong>
      </p>

      <p>
        ${diagnostico.sintomas || "No registrados"}
      </p>

      <p>
        <strong>Tratamiento:</strong>
      </p>

      <p>
        ${diagnostico.tratamiento || "No registrado"}
      </p>
    `;

    contenedor.appendChild(card);

  });
}
// FILTRAR PACIENTES EN TIEMPO REAL
function filtrarPacientes(query) {
  const texto = query.toLowerCase().trim();
  const pacientes = document.querySelectorAll('.paciente-item');
  let encontrados = 0;

  pacientes.forEach(paciente => {
    const nombre = paciente.querySelector('h4')?.textContent.toLowerCase() || '';
    if (nombre.includes(texto)) {
      paciente.style.display = 'flex';
      encontrados++;
    } else {
      paciente.style.display = 'none';
    }
  });

  // Manejar mensaje de "Sin resultados"
  let sinRes = document.querySelector('.sin-pacientes');
  if (encontrados === 0) {
    if (!sinRes) {
      sinRes = document.createElement('p');
      sinRes.className = 'sin-pacientes';
      sinRes.textContent = 'No se encontraron pacientes.';
      document.querySelector('.pacientes-lista').appendChild(sinRes);
    }
  } else if (sinRes) {
    sinRes.remove();
  }
}

// Exponer las funciones globalmente para que las lea el HTML/Pug
window.seleccionarPaciente = seleccionarPaciente;
window.filtrarPacientes = filtrarPacientes;