// TOGGLE SIDEBAR (Ajustado)
window.toggleSidebar = () => {
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
};

function cerrarSidebarMovil() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("show");
}

// NAVEGACIÓN ENTRE VISTAS
window.cambiarVista = (e, viewId, link) => {
  e.preventDefault();
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("preActive"));
  link.classList.add("preActive");
  
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const vistaTarget = document.getElementById(viewId);
  if (vistaTarget) vistaTarget.classList.add("active");
  
  if (window.innerWidth <= 768) cerrarSidebarMovil();
};

// BOTON INICIAR CONSULTA
window.iniciarConsulta = async (id) => {
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
};

// BOTON FINALIZAR CONSULTA
window.finalizarConsulta = async (id) => {
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
};

// MODAL GESTIÓN CITAS
window.abrirModal = () => {
  const modal = document.getElementById("modalGestionCitas");
  if (modal) {
    modal.classList.add("abierto");
    actualizarSubtitulo();
  }
};

window.cerrarModal = () => {
  const modal = document.getElementById("modalGestionCitas");
  if (modal) modal.classList.remove("abierto");
};

window.filtrarCitas = () => {
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
};

function actualizarSubtitulo(n) {
  const total = n !== undefined ? n : document.querySelectorAll(".cita-card").length;
  const subtitulo = document.getElementById("modalSubtitulo");
  if (subtitulo) subtitulo.textContent = `Total de citas ${total}`;
}

// REPROGRAMAR CITA
window.abrirReprogramar = (btn) => {
  const card = btn.closest(".cita-card");
  const infoUser = card.querySelector(".cita-info:nth-child(4)");
  
  if (infoUser) {
    const nombre = infoUser.textContent.replace("👤","").trim();
    const lblNombre = document.getElementById("reprogramarNombre");
    if (lblNombre) lblNombre.textContent = nombre;
  }

  document.getElementById("modalGestionCitas")?.classList.remove("abierto");
  document.getElementById("modalReprogramar")?.classList.add("abierto");
};

function cerrarReprogramar() {
  document.getElementById("modalReprogramar")?.classList.remove("abierto");
  document.getElementById("modalGestionCitas")?.classList.add("abierto");
}

window.cerrarReprogramarFuera = (event) => {
  if (event.target.id === "modalReprogramar") cerrarReprogramar();
}

// MODAL HORARIO
const diasHorario = new Set([
  "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"
]);
let peticionHorarios = null;
let versionCargaHorarios = 0;

function mensajeHorarios(texto, error = false) {
  const mensaje = document.getElementById("estadoCargaHorarios");
  mensaje.textContent = texto;
  mensaje.setAttribute("role", error ? "alert" : "status");
}

function validarHorario(horario, ids) {
  const horaValida = valor => typeof valor === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(valor);
  if (!horario || !Number.isSafeInteger(horario.id_horario) || horario.id_horario <= 0 ||
      ids.has(horario.id_horario) || !diasHorario.has(horario.dia_semana) ||
      !["Pendiente", "Aprobado", "Rechazado"].includes(horario.estado) ||
      !horaValida(horario.hora_inicio) || !horaValida(horario.hora_fin)) {
    throw new Error("La respuesta contiene un horario no válido.");
  }
  ids.add(horario.id_horario);
  const normalizar = hora => hora.length === 5 ? hora + ":00" : hora;
  if (normalizar(horario.hora_inicio) >= normalizar(horario.hora_fin)) {
    throw new Error("La respuesta contiene un rango horario no válido.");
  }
  return horario;
}

window.abrirModalHorarios = async () => {
  const modal = document.getElementById("modalHorarios");
  const lista = document.getElementById("listaHorariosMedico");
  peticionHorarios?.abort();
  const version = ++versionCargaHorarios;
  const peticion = new AbortController();
  peticionHorarios = peticion;
  lista.replaceChildren();
  mensajeHorarios("Cargando horarios...");
  modal.classList.add("abierto");
  try {
    const respuesta = await fetch("/medico/horarios", {
      credentials: "same-origin", cache: "no-store", signal: peticion.signal
    });
    if (version !== versionCargaHorarios) return;
    if (respuesta.redirected || respuesta.status === 401) {
      throw new Error("La sesión ha expirado. Inicia sesión nuevamente para consultar tus horarios.");
    }
    if (!respuesta.ok) {
      const mensajes = {
        403: "No tienes permiso para consultar estos horarios.",
        404: "No se encontró tu perfil médico."
      };
      throw new Error(mensajes[respuesta.status] || "No se pudieron cargar los horarios. Intenta abrir el modal nuevamente.");
    }
    if (!respuesta.headers.get("content-type")?.includes("application/json")) {
      throw new Error("El servidor no devolvió una respuesta JSON válida.");
    }
    const datos = await respuesta.json();
    if (version !== versionCargaHorarios) return;
    if (!datos || !Array.isArray(datos.horarios)) throw new Error("La respuesta de horarios no es válida.");
    const ids = new Set();
    // Se valida la respuesta completa antes de representar cualquier franja.
    const horarios = datos.horarios.map(horario => validarHorario(horario, ids));
    for (const h of horarios) {
      const fila = document.createElement("p");
      fila.textContent = h.dia_semana + ": " + h.hora_inicio + " a " + h.hora_fin + " (" + h.estado + ")";
      lista.appendChild(fila);
    }
    mensajeHorarios(horarios.length
      ? "Horarios asignados por administración. Solo lectura."
      : "No tienes horarios asignados. Contacta al administrador.");
  } catch (error) {
    if (version !== versionCargaHorarios || error.name === "AbortError") return;
    lista.replaceChildren();
    mensajeHorarios(error instanceof SyntaxError
      ? "El servidor devolvió datos incorrectos. No se cargaron los horarios."
      : error.message || "No se pudieron cargar los horarios.", true);
  } finally {
    if (version === versionCargaHorarios) peticionHorarios = null;
  }
};
window.cerrarModalHorarios = () => {
  ++versionCargaHorarios;
  peticionHorarios?.abort();
  peticionHorarios = null;
  document.getElementById("modalHorarios").classList.remove("abierto");
  document.getElementById("listaHorariosMedico").replaceChildren();
  mensajeHorarios("");
};
window.cerrarModalHorariosFuera = event => {
  if (event.target.id === "modalHorarios") window.cerrarModalHorarios();
};

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
  const contenedor = document.getElementById("historialPaciente");
  contenedor.replaceChildren();
  const agregarTexto = (padre, etiqueta, texto, clase) => {
    const nodo = document.createElement(etiqueta);
    nodo.textContent = texto;
    if (clase) nodo.className = clase;
    padre.appendChild(nodo);
    return nodo;
  };
  const diagnosticadas = citas.filter(cita => cita.Diagnostico);
  if (!diagnosticadas.length) {
    agregarTexto(contenedor, "p", "Este paciente no tiene diagnósticos registrados.");
    return;
  }
  diagnosticadas.forEach(cita => {
    const diagnostico = cita.Diagnostico;
    const card = document.createElement("div");
    card.className = "historial-card";
    agregarTexto(card, "h4", diagnostico.diagnostico || "Sin diagnóstico");
    agregarTexto(card, "p", new Date(cita.fecha + "T00:00:00").toLocaleDateString("es-CO"), "historial-fecha");
    agregarTexto(agregarTexto(card, "p", ""), "strong", "Síntomas:");
    agregarTexto(card, "p", diagnostico.sintomas || "No registrados");
    agregarTexto(agregarTexto(card, "p", ""), "strong", "Tratamiento:");
    agregarTexto(card, "p", diagnostico.tratamiento || "No registrado");
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