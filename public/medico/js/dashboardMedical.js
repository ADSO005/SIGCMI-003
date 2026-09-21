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
function iniciarConsulta(id) {
  const cita = document.getElementById(id);
  if (!cita) return;
  
  cita.classList.replace("estado-pendiente", "estado-encurso");
  
  const state = cita.querySelector(".state");
  if (state) {
    state.textContent = "En curso";
    state.className = "state yellowState";
  }
  
  const hour = cita.querySelector(".hour");
  if (hour) hour.classList.add("hour-encurso");
  
  const btn = cita.querySelector(".btn-iniciar");
  if (btn) {
    btn.textContent = "Finalizar Consulta";
    btn.className = "btn-consulta btn-finalizar";
    btn.setAttribute("onclick", `finalizarConsulta('${id}')`);
  }
}

// BOTON FINALIZAR CONSULTA
function finalizarConsulta(id) {
  const cita = document.getElementById(id);
  if (!cita) return;

  cita.classList.replace("estado-encurso", "estado-completada");
  
  const state = cita.querySelector(".state");
  if (state) {
    state.textContent = "Completado";
    state.className = "state greenState";
  }
  
  const hour = cita.querySelector(".hour");
  if (hour) hour.classList.remove("hour-encurso");
  
  const btnRow = cita.querySelector(".btn-full-row");
  if (btnRow) btnRow.style.display = "none";
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
function abrirModalHorarios() {
  document.getElementById("modalHorarios")?.classList.add("abierto");
}

function cerrarModalHorarios() {
  document.getElementById("modalHorarios")?.classList.remove("abierto");
}

function cerrarModalHorariosFuera(e) {
  if (e.target.id === "modalHorarios") cerrarModalHorarios();
}

function toggleDia(diaId, checkbox) {
  const dia = document.getElementById(diaId);
  if (!dia) return;
  
  const btn = dia.querySelector(".btn-agregar-hora");
  const horasContenedor = dia.querySelector(".dia-horas");

  if (checkbox.checked) {
    dia.classList.add("activo");
    if (btn) btn.style.display = "block";
    agregarHora(diaId);
  } else {
    dia.classList.remove("activo");
    if (btn) btn.style.display = "none";
    if (horasContenedor) horasContenedor.innerHTML = "";
  }
}

function agregarHora(diaId) {
  const contenedor = document.querySelector(`#${diaId} .dia-horas`);
  if (!contenedor) return;

  const fila = document.createElement("div");
  fila.className = "hora-row";
  fila.innerHTML = `
    <input type="time" value="08:00">
    <span>a</span>
    <input type="time" value="12:00">
    <button class="btn-eliminar-hora" onclick="this.parentElement.remove()">&#128465;</button>
  `;
  contenedor.appendChild(fila);
}

function guardarHorarios() {
  alert("Horario guardado correctamente.");
  cerrarModalHorarios();
}

// SELECCIONAR PACIENTE DE LA LISTA
function seleccionarPaciente(element) {
  // 1. Quitar la clase "activo" de todos los ítems de la lista
  document.querySelectorAll('.paciente-item').forEach(item => {
    item.classList.remove('activo');
  });

  // 2. Agregar la clase "activo" al elemento presionado
  if (element && element.classList) {
    element.classList.add('activo');
  }

  // 3. (Opcional) Obtener el nombre del paciente cliqueado
  const nombrePaciente = element.querySelector('h4')?.textContent;
  console.log("Paciente seleccionado:", nombrePaciente);
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
      sinRes.style.cssText = 'padding: 15px; text-align: center; color: #666; font-size: 14px;';
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