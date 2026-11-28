// TOGGLE SIDEBAR (Ajustado)
window.toggleSidebar = () => {
  const sidebar = document.getElementById("sidebar");
  const main    = document.getElementById("mainContent");
  const toggleBtn = document.getElementById("toggleBtn");
  const overlay = document.getElementById("sidebarOverlay");

  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("open");
    if (overlay) overlay.classList.toggle("show");
    const mobileToggle = document.getElementById("mobileSidebarToggle");
    if (mobileToggle) mobileToggle.setAttribute("aria-expanded", String(sidebar.classList.contains("open")));
  } else {
    sidebar.classList.toggle("collapsed");
    main.classList.toggle("collapsed");
    
    // Alineación suave del botón al colapsar
    if (toggleBtn) {
      toggleBtn.style.marginLeft = sidebar.classList.contains("collapsed") ? "0px" : "";
    }
  }
};

const botonSidebarMovil = document.getElementById("mobileSidebarToggle");
const actualizarBotonSidebarMovil = () => {
  if (!botonSidebarMovil) return;
  const visible = window.innerWidth <= 768 && window.scrollY > 100;
  botonSidebarMovil.classList.toggle("opacity-0", !visible);
  botonSidebarMovil.classList.toggle("pointer-events-none", !visible);
  botonSidebarMovil.setAttribute("aria-hidden", String(!visible));
  botonSidebarMovil.tabIndex = visible ? 0 : -1;
};

window.addEventListener("scroll", actualizarBotonSidebarMovil, { passive: true });
window.addEventListener("resize", actualizarBotonSidebarMovil);
actualizarBotonSidebarMovil();

function cerrarSidebarMovil() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("show");
  const mobileToggle = document.getElementById("mobileSidebarToggle");
  if (mobileToggle) mobileToggle.setAttribute("aria-expanded", "false");
}

// NAVEGACIÓN ENTRE VISTAS
window.cambiarVista = (e, viewId, link) => {
  e.preventDefault();
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("preActive", "bg-[#315bd7]", "shadow-lg"));
  link.classList.add("preActive", "bg-[#315bd7]", "shadow-lg");
  
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const vistaTarget = document.getElementById(viewId);
  if (vistaTarget) vistaTarget.classList.add("active");
  
  if (window.innerWidth <= 768) cerrarSidebarMovil();
};

// Permite abrir la sección de pacientes desde enlaces que vienen de otra vista.
if (window.location.hash === "#pacientesView") {
  const vistaPacientes = document.getElementById("pacientesView");
  if (vistaPacientes) {
    document.querySelectorAll(".view").forEach(vista => vista.classList.remove("active"));
    vistaPacientes.classList.add("active");
    document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("preActive", "bg-[#315bd7]", "shadow-lg"));
    document.querySelector('.nav-link[onclick*="pacientesView"]')?.classList.add("preActive", "bg-[#315bd7]", "shadow-lg");
  }
}

// Confirma el cierre antes de enviar el formulario POST existente.
const formularioLogout = document.getElementById("formLogout");
const modalConfirmarLogout = document.getElementById("modalConfirmarLogout");
const botonCancelarLogout = document.getElementById("cancelarLogout");
const botonConfirmarLogout = document.getElementById("confirmarLogout");
let focoAntesDeLogout = null;
let confirmandoLogout = false;

if (formularioLogout && modalConfirmarLogout && botonCancelarLogout && botonConfirmarLogout) {
  formularioLogout.addEventListener("submit", event => {
    if (confirmandoLogout) return;
    event.preventDefault();
    focoAntesDeLogout = event.submitter || document.activeElement;

    if (typeof modalConfirmarLogout.showModal !== "function") {
      if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
        confirmandoLogout = true;
        formularioLogout.requestSubmit();
      }
      return;
    }

    modalConfirmarLogout.showModal();
    botonCancelarLogout.focus();
  });

  botonCancelarLogout.addEventListener("click", () => modalConfirmarLogout.close());
  botonConfirmarLogout.addEventListener("click", () => {
    if (botonConfirmarLogout.disabled) return;
    botonConfirmarLogout.disabled = true;
    confirmandoLogout = true;
    formularioLogout.requestSubmit();
  });
  modalConfirmarLogout.addEventListener("close", () => {
    botonConfirmarLogout.disabled = false;
    if (!confirmandoLogout && focoAntesDeLogout?.isConnected) focoAntesDeLogout.focus();
  });
}

// INICIAR ATENCIÓN: el servidor valida nuevamente propietario, fecha y estado.
function actualizarDisponibilidadInicio() {
  const botones = document.querySelectorAll(".btn-iniciar[data-fecha][data-hora]");
  if (!botones.length) return false;

  const ahora = new Date();
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Bogota",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(ahora);
  const reloj = Object.fromEntries(partes.map(parte => [parte.type, parte.value]));
  const fechaHoy = `${reloj.year}-${reloj.month}-${reloj.day}`;
  const segundosActuales = Number(reloj.hour) * 3600
    + Number(reloj.minute) * 60
    + Number(reloj.second)
    + ahora.getUTCMilliseconds() / 1000;
  let hayCitaFuturaHoy = false;

  botones.forEach(button => {
    const hora = /^(\d{2}):([0-5]\d)(?::([0-5]\d)(?:\.(\d{1,6}))?)?$/.exec(button.dataset.hora || "");
    if (!hora || Number(hora[1]) > 23) return;

    const segundosCita = Number(hora[1]) * 3600
      + Number(hora[2]) * 60
      + Number(hora[3] || 0)
      + Number(`0.${hora[4] || 0}`);
    const esHoy = button.dataset.fecha === fechaHoy;
    const tieneEstadoDestino = /^[1-9]\d*$/.test(button.dataset.estadoId || "");
    const puedeIniciar = esHoy && segundosCita <= segundosActuales;
    const habilitado = puedeIniciar && tieneEstadoDestino;

    button.disabled = !habilitado;

    const mensaje = button.nextElementSibling?.hasAttribute("data-mensaje-inicio")
      ? button.nextElementSibling : null;
    if (mensaje) {
      if (habilitado) {
        mensaje.hidden = true;
      } else if (puedeIniciar && !tieneEstadoDestino) {
        mensaje.textContent = "No se pudo cargar el estado de atención. Actualiza la agenda.";
        mensaje.setAttribute("role", "alert");
        mensaje.hidden = false;
      }
    }

    if (esHoy && segundosCita > segundosActuales) hayCitaFuturaHoy = true;
  });

  return hayCitaFuturaHoy;
}

if (actualizarDisponibilidadInicio()) {
  const temporizadorDisponibilidad = window.setInterval(() => {
    if (!actualizarDisponibilidadInicio()) window.clearInterval(temporizadorDisponibilidad);
  }, 1000);
}

const iniciosPendientes = new Set();
window.iniciarConsulta = async button => {
  const id = button.dataset.cita;
  const estadoId = Number(button.dataset.estadoId);
  const status = document.getElementById("estadoAtencion");
  if (button.disabled || iniciosPendientes.has(id)) return;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(estadoId) || estadoId <= 0) return;
  iniciosPendientes.add(id);
  button.disabled = true;
  const textoOriginal = button.textContent;
  button.textContent = "Iniciando…";
  status.hidden = false;
  status.setAttribute("role", "status");
  status.textContent = "Iniciando consulta…";
  let actualizado = false;
  try {
    const respuesta = await fetch(`/medico/citas/${id}/estado`, {
      method: "PATCH", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado_id: estadoId })
    });
    if (respuesta.redirected || respuesta.status === 401) throw Error("La sesión venció. Inicia sesión nuevamente y vuelve a la agenda.");
    if (respuesta.status === 403) throw Error("No tienes permiso para iniciar esta consulta.");
    if (!respuesta.headers.get("content-type")?.includes("application/json")) throw Error("No se recibió una respuesta válida. Recarga la agenda y comprueba tu sesión.");
    const resultado = await respuesta.json();
    if (respuesta.status === 409) throw Error("La cita ya no puede iniciarse o cambió de estado. Recarga la agenda para ver su situación actual.");
    if (!respuesta.ok) throw Error(typeof resultado.mensaje === "string" ? resultado.mensaje : "No se pudo iniciar la consulta. Recarga la agenda e inténtalo nuevamente.");
    if (resultado.id_cita !== Number(id) || resultado.estado_id !== estadoId) throw Error("No se pudo confirmar el cambio. Recarga la agenda.");
    window.location.assign(`/medico/dashboard?consulta=${id}#contextoConsulta`);
    actualizado = true;
  } catch (error) {
    status.setAttribute("role", "alert");
    status.textContent = error instanceof TypeError ? "No se pudo conectar con el servidor. Revisa la conexión e inténtalo nuevamente."
      : error instanceof SyntaxError ? "La respuesta no es válida. Recarga la agenda."
        : error.message;
    status.focus();
  } finally {
    if (!actualizado) {
      iniciosPendientes.delete(id);
      button.disabled = false;
      button.textContent = textoOriginal;
    }
  }
};

// El cierre conserva la consulta y registra el motivo antes de bloquearla.
let cierreConsultaReturnFocus = null;
let cierreConsultaEnviando = false;
const modalCierreConsulta = document.getElementById("modalCierreConsulta");
const formularioCierreConsulta = document.getElementById("formCierreConsulta");

window.abrirModalCierreConsulta = button => {
  if (!modalCierreConsulta || modalCierreConsulta.open || !button) return;
  const idCita = button.dataset.cita;
  const estadoId = Number(button.dataset.estadoId);
  if (!/^[1-9]\d*$/.test(idCita || "") || !Number.isSafeInteger(estadoId) || estadoId <= 0) return;

  cierreConsultaReturnFocus = button;
  formularioCierreConsulta.dataset.cita = idCita;
  formularioCierreConsulta.dataset.estadoId = String(estadoId);
  formularioCierreConsulta.reset();
  const estado = document.getElementById("estadoCierreConsulta");
  estado.textContent = "El motivo es obligatorio. La consulta no se finalizará.";
  estado.hidden = false;
  document.getElementById("errorCierreConsulta").hidden = true;
  modalCierreConsulta.showModal();
  document.getElementById("motivoCierreConsulta").focus();
};

function cerrarModalCierreConsulta() {
  if (cierreConsultaEnviando || !modalCierreConsulta?.open) return;
  modalCierreConsulta.close();
}

document.getElementById("cerrarModalCierreConsulta")?.addEventListener("click", cerrarModalCierreConsulta);
document.getElementById("cancelarCierreConsulta")?.addEventListener("click", cerrarModalCierreConsulta);
modalCierreConsulta?.addEventListener("cancel", event => {
  if (cierreConsultaEnviando) event.preventDefault();
});
modalCierreConsulta?.addEventListener("close", () => {
  cierreConsultaReturnFocus?.focus();
  cierreConsultaReturnFocus = null;
});

formularioCierreConsulta?.addEventListener("submit", async event => {
  event.preventDefault();
  if (cierreConsultaEnviando) return;

  const idCita = formularioCierreConsulta.dataset.cita;
  const estadoId = Number(formularioCierreConsulta.dataset.estadoId);
  const motivo = document.getElementById("motivoCierreConsulta").value.trim();
  const estado = document.getElementById("estadoCierreConsulta");
  const error = document.getElementById("errorCierreConsulta");
  const botonConfirmar = document.getElementById("confirmarCierreConsulta");
  const botonCancelar = document.getElementById("cancelarCierreConsulta");
  const botonCerrar = document.getElementById("cerrarModalCierreConsulta");

  if (!motivo || [...motivo].length > 2000) {
    error.textContent = "Escribe un motivo de hasta 2000 caracteres.";
    error.hidden = false;
    document.getElementById("motivoCierreConsulta").focus();
    return;
  }

  cierreConsultaEnviando = true;
  botonConfirmar.disabled = true;
  botonCancelar.disabled = true;
  botonCerrar.disabled = true;
  estado.textContent = "Registrando el cierre…";
  error.hidden = true;
  try {
    const respuesta = await fetch(`/medico/citas/${encodeURIComponent(idCita)}/estado`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado_id: estadoId, motivo_cierre: motivo })
    });
    if (respuesta.redirected || respuesta.status === 401) throw Error("La sesión venció. Inicia sesión nuevamente.");
    if (!respuesta.headers.get("content-type")?.includes("application/json")) {
      throw Error("No se recibió una respuesta válida. Comprueba tu sesión e inténtalo de nuevo.");
    }
    const resultado = await respuesta.json();
    if (respuesta.status === 409) throw Error(resultado.mensaje || "La consulta cambió de estado. Actualiza la agenda.");
    if (!respuesta.ok) throw Error(resultado.mensaje || "No se pudo cerrar la consulta.");
    if (resultado.id_cita !== Number(idCita) || resultado.estado_id !== estadoId) {
      throw Error("No se pudo confirmar el cierre. Actualiza la agenda.");
    }
    window.location.assign(`/medico/dashboard?citaCerrada=${encodeURIComponent(idCita)}#agendaView`);
  } catch (errorCierre) {
    estado.textContent = "No se cerró la consulta. Corrige el problema e inténtalo nuevamente.";
    error.textContent = errorCierre instanceof TypeError
      ? "No fue posible conectar con el servidor. Revisa la conexión."
      : errorCierre.message || "No se pudo cerrar la consulta.";
    error.hidden = false;
    error.focus();
  } finally {
    cierreConsultaEnviando = false;
    botonConfirmar.disabled = false;
    botonCancelar.disabled = false;
    botonCerrar.disabled = false;
  }
});

// MODAL DE CONSULTA DE CITAS
let citaReturnFocus = null;
let citaPreviousOverflow = "";

window.abrirModal = () => {
  const modal = document.getElementById("modalGestionCitas");
  if (!modal || modal.classList.contains("abierto")) return;
  citaReturnFocus = document.activeElement;
  citaPreviousOverflow = document.body.style.overflow;
  modal.classList.add("abierto");
  document.body.style.overflow = "hidden";
  window.filtrarCitas();
  document.getElementById("cerrarGestionCitas").focus();
};

window.cerrarModal = () => {
  const modal = document.getElementById("modalGestionCitas");
  if (!modal?.classList.contains("abierto")) return;
  modal.classList.remove("abierto");
  document.body.style.overflow = citaPreviousOverflow;
  citaReturnFocus?.focus();
};

window.cerrarModalFuera = event => {
  if (event.target.id === "modalGestionCitas") window.cerrarModal();
};

window.filtrarCitas = () => {
  const fecha = document.getElementById("fechaFiltroCitas");
  const estado = document.getElementById("estadoFiltroCitas");
  const cards = [...document.getElementById("listaCitas").querySelectorAll(".cita-card")];
  const status = document.getElementById("estadoListaCitas");
  const subtitulo = document.getElementById("modalSubtitulo");
  const fechaValida = fecha.validity.valid;
  let visibles = 0;
  cards.forEach(card => {
    card.hidden = !fechaValida || (fecha.value !== "" && card.dataset.fecha !== fecha.value)
      || (estado.value !== "" && card.dataset.estado !== estado.value);
    if (!card.hidden) visibles++;
  });
  subtitulo.textContent = `Citas: ${visibles} de ${cards.length}`;
  status.hidden = fechaValida && visibles > 0;
  status.setAttribute("role", fechaValida ? "status" : "alert");
  status.textContent = !fechaValida ? "La fecha no es válida. Revisa el filtro o selecciona Todas las citas."
    : !cards.length ? "No tienes citas registradas."
      : "No se encontraron citas con los filtros seleccionados";
};

window.limpiarFiltrosCitas = () => {
  document.getElementById("fechaFiltroCitas").value = "";
  document.getElementById("estadoFiltroCitas").value = "";
  window.filtrarCitas();
};

window.gestionarTecladoCitas = event => {
  if (event.key === "Escape") {
    event.preventDefault();
    window.cerrarModal();
  } else if (event.key === "Tab") {
    const controls = [...document.getElementById("modalGestionCitas").querySelectorAll("button, input, select")];
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
};

// MODAL HORARIO
const diasHorario = new Set([
  "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"
]);
let peticionHorarios = null;
let versionCargaHorarios = 0;
let scheduleRows = null;
let selectedWeek = null;
let selectedScheduleDay = null;
let displayedScheduleMonth = null;
let scheduleReturnFocus = null;
const scheduleDayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const scheduleDayKeys = [...diasHorario];
const scheduleDayMs = 86400000;

// DATEONLY se convierte a un número de día: nunca a medianoche de la zona del equipo.
function scheduleDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("La vigencia del horario no es válida.");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  if (year < 1 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error("La vigencia del horario no es válida.");
  }
  return date.getTime() / scheduleDayMs;
}
function scheduleDate(day) { return new Date(day * scheduleDayMs).toISOString().slice(0, 10); }
function bogotaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return scheduleDay(`${values.year}-${values.month}-${values.day}`);
}
function scheduleWeekStart(day) { return day - ((day + 3) % 7 + 7) % 7; }
function scheduleMonthStart(day, offset = 0) {
  const date = new Date(day * scheduleDayMs);
  date.setUTCMonth(date.getUTCMonth() + offset, 1);
  return date.getTime() / scheduleDayMs;
}
function formatScheduleDay(day) {
  return new Intl.DateTimeFormat("es-CO", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" })
    .format(new Date(day * scheduleDayMs));
}
function appendScheduleText(parent, tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  parent.appendChild(node);
  return node;
}
function scheduleRowsForDay(day) {
  const weekday = ((day + 3) % 7 + 7) % 7;
  return (scheduleRows || []).filter(row => row.dia_semana === scheduleDayKeys[weekday] && row.startDay <= day && day <= row.endDay);
}
function renderScheduleMonth() {
  const calendar = document.getElementById("diasSemanaHorario");
  calendar.replaceChildren();
  document.getElementById("mesHorario").textContent = new Intl.DateTimeFormat("es-CO", {
    timeZone: "UTC", month: "long", year: "numeric"
  }).format(new Date(displayedScheduleMonth * scheduleDayMs));
  const firstDay = scheduleWeekStart(displayedScheduleMonth);
  const nextMonth = scheduleMonthStart(displayedScheduleMonth, 1);
  const today = bogotaToday();
  // Seis filas estables, con días adyacentes tenues, mantienen las columnas alineadas.
  for (let index = 0; index < 42; index++) {
    const day = firstDay + index;
    const date = scheduleDate(day);
    const rows = scheduleRowsForDay(day);
    const selected = selectedScheduleDay === day;
    const adjacent = day < displayedScheduleMonth || day >= nextMonth;
    const weekday = ((day + 3) % 7 + 7) % 7;
    const cell = appendScheduleText(calendar, "button", "", selected
      ? "flex min-h-10 min-w-0 flex-col items-center justify-center rounded-lg bg-[#465DE5] text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#465DE5]"
      : "flex min-h-10 min-w-0 flex-col items-center justify-center rounded-lg hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-[#465DE5]");
    if (!selected) cell.classList.add(adjacent ? "text-slate-400" : "text-slate-700");
    cell.type = "button";
    cell.disabled = scheduleRows === null;
    cell.setAttribute("id", "diaHorario-" + date);
    cell.setAttribute("data-date", date);
    cell.setAttribute("data-adjacent", String(adjacent));
    cell.setAttribute("aria-pressed", String(selected));
    cell.setAttribute("aria-label", `${scheduleDayNames[weekday]} ${formatScheduleDay(day)}: ${rows.length ? "con horarios" : "sin horarios"}${day === today ? ", hoy" : ""}`);
    cell.addEventListener("click", () => window.seleccionarDiaHorario(date));
    if (day === today) {
      cell.setAttribute("aria-current", "date");
      cell.classList.add("ring-1", "ring-inset", "ring-[#465DE5]");
    }
    const number = appendScheduleText(cell, "time", String(new Date(day * scheduleDayMs).getUTCDate()), "text-xs font-medium");
    number.setAttribute("datetime", date);
    const dot = appendScheduleText(cell, "span", rows.length ? "●" : "·", selected
      ? "text-[8px] leading-3 text-white"
      : rows.length ? "text-[8px] leading-3 text-[#465DE5]" : "text-[8px] leading-3 text-slate-300");
    dot.setAttribute("aria-hidden", "true");
  }
}
function renderScheduleWeek() {
  renderScheduleMonth();
  const list = document.getElementById("listaHorariosMedico");
  list.replaceChildren();
  const dateParts = day => Object.fromEntries(new Intl.DateTimeFormat("es-CO", {
    timeZone: "UTC", day: "numeric", month: "short", year: "numeric"
  }).formatToParts(new Date(day * scheduleDayMs)).map(part => [part.type, part.value]));
  const start = dateParts(selectedWeek), end = dateParts(selectedWeek + 6);
  const startLabel = start.month === end.month && start.year === end.year ? start.day
    : `${start.day} ${start.month}${start.year !== end.year ? " " + start.year : ""}`;
  document.getElementById("rangoSemanaHorario").textContent = `${startLabel}–${end.day} ${end.month} ${end.year}`;
  document.getElementById("tituloDetalleHorario").textContent = selectedScheduleDay === null ? "Horarios de la semana" : "Horarios del día";
  for (const id of ["semanaAnteriorHorario", "semanaSiguienteHorario", "mesAnteriorHorario", "mesSiguienteHorario"]) {
    document.getElementById(id).disabled = scheduleRows === null;
  }
  document.getElementById("vistaSemanaHorario").disabled = scheduleRows === null || selectedScheduleDay === null;
  let count = 0;
  const firstDay = selectedScheduleDay ?? selectedWeek;
  const lastDay = selectedScheduleDay ?? selectedWeek + 6;
  for (let day = firstDay; day <= lastDay; day++) {
    const rows = scheduleRowsForDay(day);
    if (!rows.length) continue;
    const weekday = ((day + 3) % 7 + 7) % 7;
    const group = appendScheduleText(list, "section", "", "min-w-0 rounded-xl border border-blue-100 bg-white px-4 py-3 shadow-sm");
    group.setAttribute("data-date", scheduleDate(day));
    appendScheduleText(group, "h3", `${scheduleDayNames[weekday]} ${formatScheduleDay(day)}`, "text-xs font-semibold text-slate-700");
    for (const [index, row] of rows.entries()) {
      const slot = appendScheduleText(group, "div", "", "mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 border-t border-slate-100 pt-2");
      slot.setAttribute("data-schedule-id", String(row.id_horario));
      slot.setAttribute("aria-label", `Franja ${index + 1} de ${rows.length}`);
      const time = value => value.endsWith(":00") ? value.slice(0, 5) : value;
      appendScheduleText(slot, "p", `${time(row.startTime)}–${time(row.endTime)}`, "justify-self-start rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-semibold text-[#2459B8]");
      appendScheduleText(slot, "p", `Vigencia: ${formatScheduleDay(row.startDay)} – ${formatScheduleDay(row.endDay)}`, "col-span-2 mt-1 break-words text-[11px] leading-5 text-slate-500");
      if (rows.length > 1) appendScheduleText(slot, "p", `Franja ${index + 1} de ${rows.length}`, "col-span-2 text-[10px] text-slate-500");
      count++;
    }
  }
  if (scheduleRows !== null) mensajeHorarios(!scheduleRows.length
    ? "No tienes horarios asignados. Contacta al administrador."
    : selectedScheduleDay !== null ? `${formatScheduleDay(selectedScheduleDay)} · ${count ? `${count} ${count === 1 ? "franja asignada" : "franjas asignadas"}` : "Este día no tiene horarios asignados."}`
      : count ? `${count} ${count === 1 ? "franja asignada esta semana" : "franjas asignadas esta semana"}. Solo lectura.`
        : "Esta semana no tiene horarios asignados. Puedes consultar otras semanas.");
}
window.cambiarSemanaHorarios = offset => {
  if (scheduleRows === null || ![-1, 1].includes(offset)) return;
  selectedWeek += offset * 7;
  selectedScheduleDay = null;
  displayedScheduleMonth = scheduleMonthStart(selectedWeek);
  renderScheduleWeek();
};
window.cambiarMesHorarios = offset => {
  if (scheduleRows === null || ![-1, 1].includes(offset)) return;
  displayedScheduleMonth = scheduleMonthStart(displayedScheduleMonth, offset);
  selectedWeek = scheduleWeekStart(displayedScheduleMonth);
  selectedScheduleDay = null;
  renderScheduleWeek();
};
window.seleccionarDiaHorario = value => {
  if (scheduleRows === null) return;
  selectedScheduleDay = scheduleDay(value);
  selectedWeek = scheduleWeekStart(selectedScheduleDay);
  displayedScheduleMonth = scheduleMonthStart(selectedScheduleDay);
  renderScheduleWeek();
  document.getElementById("diaHorario-" + value)?.focus();
};
window.verSemanaHorarios = () => {
  if (scheduleRows === null) return;
  selectedScheduleDay = null;
  renderScheduleWeek();
};

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
  const startDay = scheduleDay(horario.fecha_inicio), endDay = scheduleDay(horario.fecha_fin);
  if (startDay > endDay) throw new Error("La vigencia del horario está invertida.");
  return { ...horario, startDay, endDay, startTime: normalizar(horario.hora_inicio), endTime: normalizar(horario.hora_fin) };
}

window.abrirModalHorarios = async () => {
  const modal = document.getElementById("modalHorarios");
  const lista = document.getElementById("listaHorariosMedico");
  peticionHorarios?.abort();
  const version = ++versionCargaHorarios;
  const peticion = new AbortController();
  peticionHorarios = peticion;
  if (!modal.classList.contains("abierto")) scheduleReturnFocus = document.activeElement;
  scheduleRows = null;
  const today = bogotaToday();
  selectedWeek = scheduleWeekStart(today);
  selectedScheduleDay = null;
  displayedScheduleMonth = scheduleMonthStart(today);
  renderScheduleWeek();
  lista.setAttribute("aria-busy", "true");
  mensajeHorarios("Cargando horarios...");
  modal.classList.add("abierto");
  document.getElementById("cerrarAgendaSemanal").focus();
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
    scheduleRows = datos.horarios.map(horario => validarHorario(horario, ids))
      .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime) || a.id_horario - b.id_horario);
    if (scheduleRowsForDay(today).length) selectedScheduleDay = today;
    renderScheduleWeek();
  } catch (error) {
    if (version !== versionCargaHorarios || error.name === "AbortError") return;
    lista.replaceChildren();
    scheduleRows = null;
    mensajeHorarios(error instanceof SyntaxError
      ? "El servidor devolvió datos incorrectos. No se cargaron los horarios."
      : error.message || "No se pudieron cargar los horarios.", true);
  } finally {
    if (version === versionCargaHorarios) {
      peticionHorarios = null;
      lista.setAttribute("aria-busy", "false");
    }
  }
};
window.cerrarModalHorarios = () => {
  ++versionCargaHorarios;
  peticionHorarios?.abort();
  peticionHorarios = null;
  scheduleRows = null;
  document.getElementById("modalHorarios").classList.remove("abierto");
  document.getElementById("listaHorariosMedico").replaceChildren();
  document.getElementById("listaHorariosMedico").setAttribute("aria-busy", "false");
  document.getElementById("diasSemanaHorario").replaceChildren();
  mensajeHorarios("");
  scheduleReturnFocus?.focus();
  scheduleReturnFocus = null;
};
window.cerrarModalHorariosFuera = event => {
  if (event.target.id === "modalHorarios") window.cerrarModalHorarios();
};

// Evita que una respuesta lenta reemplace al paciente seleccionado más recientemente.
let versionCargaPaciente = 0;
let pacienteSeleccionadoId = null;
let paginaHistorialActual = 1;
let paginacionHistorialActual = null;

// SELECCIONAR PACIENTE DE LA LISTA
async function seleccionarPaciente(element) {
  const idPaciente = element?.dataset.id;
  ++versionCargaPaciente;
  const pacienteNuevo = idPaciente !== pacienteSeleccionadoId;
  pacienteSeleccionadoId = idPaciente;
  if (pacienteNuevo) {
    paginaHistorialActual = 1;
    paginacionHistorialActual = null;
  }

  document.querySelectorAll(".paciente-item").forEach(item => {
    item.classList.toggle("activo", item === element);
  });
  limpiarDetallePaciente("Cargando información del paciente…");

  if (!idPaciente || !/^[1-9]\d*$/.test(idPaciente)) {
    mostrarErrorDetallePaciente("No se pudo identificar el paciente seleccionado.");
    return;
  }

  await cargarPaginaHistorial(idPaciente, paginaHistorialActual, { limpiarDetalleAlFallar: true });
}

async function cargarPaginaHistorial(idPaciente, pagina, opciones = {}) {
  const versionActual = ++versionCargaPaciente;
  const historial = document.getElementById("historialPaciente");
  const paginacion = document.getElementById("paginacionHistorial");
  let cargaExitosa = false;
  historial.setAttribute("aria-busy", "true");
  paginacion.setAttribute("aria-busy", "true");
  paginacion.querySelectorAll("button").forEach(boton => { boton.disabled = true; });

  try {
    const respuesta = await fetch(`/medico/pacientes/${encodeURIComponent(idPaciente)}?pagina=${encodeURIComponent(pagina)}`, {
      credentials: "same-origin",
      cache: "no-store"
    });
    if (versionActual !== versionCargaPaciente) return;

    if (respuesta.redirected || respuesta.status === 401) {
      throw new Error("Tu sesión venció. Inicia sesión nuevamente.");
    }
    if (!respuesta.ok) {
      const mensajes = {
        403: "No tienes permiso para consultar este paciente.",
        404: "El paciente no está disponible o no tiene citas vinculadas a este médico."
      };
      throw new Error(mensajes[respuesta.status] || "No se pudo cargar la información del paciente.");
    }
    if (!respuesta.headers.get("content-type")?.includes("application/json")) {
      throw new Error("El servidor no devolvió una respuesta JSON válida.");
    }

    const datos = await respuesta.json();
    if (versionActual !== versionCargaPaciente) return;
    const paginaInfo = datos?.paginacion;
    if (!datos?.paciente || !Array.isArray(datos.citas) || !paginaInfo
      || !Number.isInteger(paginaInfo.paginaActual) || paginaInfo.paginaActual < 1
      || paginaInfo.porPagina !== 1 || !Number.isInteger(paginaInfo.totalCitas) || paginaInfo.totalCitas < 1
      || !Number.isInteger(paginaInfo.totalPaginas) || paginaInfo.totalPaginas < 1
      || paginaInfo.paginaActual > paginaInfo.totalPaginas
      || !Number.isInteger(paginaInfo.totalDiagnosticos) || paginaInfo.totalDiagnosticos < 0
      || datos.citas.length !== 1) {
      throw new Error("La respuesta del servidor no tiene el formato esperado.");
    }
    mostrarDetallePaciente(datos.paciente, datos.citas, paginaInfo);
    paginaHistorialActual = paginaInfo.paginaActual;
    cargaExitosa = true;
    if (opciones.restaurarFoco) {
      paginacion.querySelector(`[data-page="${paginaHistorialActual}"]`)?.focus();
    }
  } catch (error) {
    if (versionActual !== versionCargaPaciente) return;
    console.error("Error al cargar el detalle del paciente");
    const mensaje = error instanceof TypeError
      ? "No fue posible conectar con el servidor. Revisa la conexión."
      : error.message || "No fue posible conectar con el servidor.";
    if (opciones.limpiarDetalleAlFallar) mostrarErrorDetallePaciente(mensaje);
    else mostrarAvisoHistorial(mensaje);
  } finally {
    if (versionActual === versionCargaPaciente) {
      historial.setAttribute("aria-busy", "false");
      paginacion.setAttribute("aria-busy", "false");
      if (!cargaExitosa && !opciones.limpiarDetalleAlFallar && paginacionHistorialActual) {
        mostrarPaginacionHistorial(paginacionHistorialActual);
      }
    }
  }
}

document.getElementById("paginacionHistorial")?.addEventListener("click", event => {
  const boton = event.target.closest("button[data-page]");
  const pagina = Number(boton?.dataset.page);
  if (!boton || boton.disabled || !pacienteSeleccionadoId || !Number.isSafeInteger(pagina) || pagina < 1) return;
  cargarPaginaHistorial(pacienteSeleccionadoId, pagina, { restaurarFoco: true });
});

function limpiarDetallePaciente(mensaje) {
  document.getElementById("detalleNombre").textContent = mensaje;
  document.getElementById("detalleCorreo").textContent = "-";
  document.getElementById("detalleCorreo").removeAttribute("href");
  document.getElementById("detalleTelefono").textContent = "-";
  document.getElementById("detalleEdad").textContent = "-";
  document.getElementById("detalleUltimaVisita").textContent = "-";
  document.getElementById("detalleCitas").textContent = "0";
  document.getElementById("detalleDiagnosticos").textContent = "0";
  document.getElementById("historialPaciente").replaceChildren();
  document.getElementById("historialPaciente").setAttribute("aria-busy", "false");
  const paginacion = document.getElementById("paginacionHistorial");
  paginacion.replaceChildren();
  paginacion.hidden = true;
  paginacion.setAttribute("aria-busy", "false");
  paginacionHistorialActual = null;
}

function mostrarErrorDetallePaciente(mensaje) {
  limpiarDetallePaciente("No se pudo cargar el paciente");
  const aviso = document.createElement("p");
  aviso.textContent = mensaje;
  document.getElementById("historialPaciente").replaceChildren(aviso);
}

function mostrarAvisoHistorial(mensaje) {
  const aviso = document.createElement("p");
  aviso.textContent = mensaje;
  document.getElementById("historialPaciente").replaceChildren(aviso);
}

function mostrarDetallePaciente(paciente, citas, paginacion) {
  const usuario = paciente.Usuario || {};
  const nombre = [usuario.nombres, usuario.apellidos].filter(Boolean).join(" ");
  document.getElementById("detalleNombre").textContent = nombre || "Nombre no registrado";

  const correo = document.getElementById("detalleCorreo");
  correo.textContent = usuario.correo || "No registrado";
  if (usuario.correo) correo.href = `mailto:${usuario.correo}`;
  else correo.removeAttribute("href");

  document.getElementById("detalleTelefono").textContent = usuario.telefono || "No registrado";
  document.getElementById("detalleEdad").textContent = calcularEdad(paciente.fecha_nacimiento);
  document.getElementById("detalleCitas").textContent = String(paginacion.totalCitas);
  if (paginacion.paginaActual === 1) {
    document.getElementById("detalleUltimaVisita").textContent = obtenerUltimaVisita(citas);
  }

  document.getElementById("detalleDiagnosticos").textContent = String(paginacion.totalDiagnosticos);
  mostrarHistorial(citas);
  paginacionHistorialActual = paginacion;
  mostrarPaginacionHistorial(paginacion);
}

function crearBotonPagina(texto, numero, ariaLabel, actual = false) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.textContent = texto;
  boton.dataset.page = String(numero);
  boton.setAttribute("aria-label", ariaLabel);
  boton.disabled = actual;
  if (actual) boton.setAttribute("aria-current", "page");
  boton.className = actual
    ? "inline-flex h-11 items-center justify-center rounded-lg border border-[#315bd7] bg-[#315bd7] px-3 text-sm font-semibold text-white disabled:opacity-50"
    : "inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50";
  return boton;
}

function mostrarPaginacionHistorial(paginacion) {
  const nav = document.getElementById("paginacionHistorial");
  nav.replaceChildren();
  nav.hidden = false;

  const desde = (paginacion.paginaActual - 1) * paginacion.porPagina + 1;
  const resumen = document.createElement("p");
  resumen.className = "m-0 text-xs leading-5 text-slate-600";
  resumen.textContent = `Cita ${desde} de ${paginacion.totalCitas}. Página ${paginacion.paginaActual} de ${paginacion.totalPaginas}.`;
  nav.appendChild(resumen);

  const controles = document.createElement("div");
  controles.className = "flex flex-wrap items-center gap-2";
  controles.appendChild(crearBotonPagina("Anterior", paginacion.paginaActual - 1, "Página anterior"));
  controles.firstElementChild.disabled = paginacion.paginaActual === 1;

  let primera = Math.max(1, paginacion.paginaActual - 2);
  let ultima = Math.min(paginacion.totalPaginas, primera + 4);
  primera = Math.max(1, ultima - 4);
  const agregarNumero = numero => controles.appendChild(crearBotonPagina(
    String(numero), numero, `Página ${numero}`, numero === paginacion.paginaActual
  ));

  if (primera > 1) {
    agregarNumero(1);
    if (primera > 2) {
      const puntos = document.createElement("span");
      puntos.textContent = "…";
      puntos.setAttribute("aria-hidden", "true");
      controles.appendChild(puntos);
    }
  }
  for (let numero = primera; numero <= ultima; numero++) agregarNumero(numero);
  if (ultima < paginacion.totalPaginas) {
    if (ultima < paginacion.totalPaginas - 1) {
      const puntos = document.createElement("span");
      puntos.textContent = "…";
      puntos.setAttribute("aria-hidden", "true");
      controles.appendChild(puntos);
    }
    agregarNumero(paginacion.totalPaginas);
  }

  const siguiente = crearBotonPagina("Siguiente", paginacion.paginaActual + 1, "Página siguiente");
  siguiente.disabled = paginacion.paginaActual === paginacion.totalPaginas;
  controles.appendChild(siguiente);
  nav.appendChild(controles);
}

function separarFechaCivil(fecha) {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha || "");
  if (!coincidencia) return null;
  const partes = coincidencia.slice(1).map(Number);
  const fechaUtc = new Date(Date.UTC(partes[0], partes[1] - 1, partes[2]));
  if (fechaUtc.toISOString().slice(0, 10) !== fecha) return null;
  return { anio: partes[0], mes: partes[1], dia: partes[2] };
}

function fechaActualBogota() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const fecha = Object.fromEntries(partes.map(parte => [parte.type, parte.value]));
  return `${fecha.year}-${fecha.month}-${fecha.day}`;
}

function calcularEdad(fechaNacimiento) {
  const nacimiento = separarFechaCivil(fechaNacimiento);
  const hoy = separarFechaCivil(fechaActualBogota());
  if (!nacimiento || !hoy) return "No registrada";

  let edad = hoy.anio - nacimiento.anio;
  if (hoy.mes < nacimiento.mes || (hoy.mes === nacimiento.mes && hoy.dia < nacimiento.dia)) edad--;
  return edad < 0 ? "No registrada" : `${edad} años`;
}

function obtenerUltimaVisita(citas) {

  if (!citas || citas.length === 0) {
    return "Sin visitas";
  }

  const fecha = citas[0].fecha;
  const partes = separarFechaCivil(fecha);
  if (!partes) return "Sin visitas";

  return new Date(Date.UTC(partes.anio, partes.mes - 1, partes.dia))
    .toLocaleDateString("es-CO", { timeZone: "UTC" });
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

  if (!citas.length) {
    agregarTexto(contenedor, "p", "No hay citas registradas para este paciente.");
    return;
  }

  citas.forEach(cita => {
    const card = document.createElement("div");
    card.className = "historial-card";
    const fecha = cita.fecha
      ? new Date(`${cita.fecha}T00:00:00`).toLocaleDateString("es-CO", { timeZone: "America/Bogota" })
      : "Fecha no registrada";
    const hora = cita.hora ? String(cita.hora).slice(0, 5) : "Hora no registrada";
    const estado = cita.Estado?.nombre || "Estado no registrado";

    agregarTexto(card, "h4", `Cita del ${fecha}`);
    agregarTexto(card, "p", `${hora} · ${estado}`, "historial-fecha");
    agregarTexto(agregarTexto(card, "p", ""), "strong", "Motivo:");
    agregarTexto(card, "p", cita.motivo_consulta || "Motivo no registrado");

    if (cita.Diagnostico) {
      agregarTexto(agregarTexto(card, "p", ""), "strong", "Diagnóstico:");
      agregarTexto(card, "p", cita.Diagnostico.diagnostico || "No registrado");
      agregarTexto(agregarTexto(card, "p", ""), "strong", "Síntomas:");
      agregarTexto(card, "p", cita.Diagnostico.sintomas || "No registrados");
      agregarTexto(agregarTexto(card, "p", ""), "strong", "Tratamiento:");
      agregarTexto(card, "p", cita.Diagnostico.tratamiento || "No registrado");
      agregarMedicamentosHistorial(card, cita.Diagnostico, agregarTexto);
    } else {
      agregarTexto(card, "p", "No hay diagnóstico registrado para esta cita.");
    }
    contenedor.appendChild(card);
  });
}

function agregarMedicamentosHistorial(card, diagnostico, agregarTexto) {
  agregarTexto(agregarTexto(card, "p", ""), "strong", "Medicamentos:");
  if (diagnostico.decision_medicamentos === "No requiere") {
    agregarTexto(card, "p", "No requiere medicamentos");
    return;
  }
  if (diagnostico.decision_medicamentos === "Pendiente") {
    agregarTexto(card, "p", "Decisión de medicamentos pendiente");
    return;
  }
  if (diagnostico.decision_medicamentos !== "Requiere") {
    agregarTexto(card, "p", "Decisión de medicamentos no disponible");
    return;
  }

  const medicamentos = Array.isArray(diagnostico.medicamentos) ? diagnostico.medicamentos : [];
  if (!medicamentos.length) {
    agregarTexto(card, "p", "No hay medicamentos registrados.");
    return;
  }

  const lista = document.createElement("ul");
  lista.className = "mb-2 list-disc space-y-1 pl-5 text-[12px] text-[#666] [overflow-wrap:anywhere]";
  medicamentos.forEach(medicamento => {
    const item = document.createElement("li");
    item.textContent = (medicamento.nombre_medicamento || "Medicamento sin nombre")
      + " — Dosis: " + (medicamento.dosis || "No registrada")
      + " · Frecuencia: " + (medicamento.frecuencia || "No registrada")
      + " · Duración: " + (medicamento.duracion || "No registrada");
    lista.appendChild(item);
  });
  card.appendChild(lista);
}

// Ignora mayúsculas, tildes y signos al buscar ("jose" encuentra "José").
const normalizarBusqueda = valor => String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

// FILTRAR PACIENTES EN TIEMPO REAL
function filtrarPacientes(query) {
  const texto = normalizarBusqueda(query);
  const pacientes = document.querySelectorAll('.paciente-item');
  let encontrados = 0;

  pacientes.forEach(paciente => {
    const nombre = normalizarBusqueda(paciente.querySelector('h4')?.textContent);
    if (texto.split(' ').every(palabra => nombre.includes(palabra))) {
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
