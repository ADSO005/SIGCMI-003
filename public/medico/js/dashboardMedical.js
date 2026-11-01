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

// CERRAR SESIÓN
window.cerrarSesion = () => {
  if (confirm("¿Seguro que deseas cerrar sesión?")) {
    alert("Sesión cerrada. Redirigiendo al login...");
  }
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

// MODAL HORARIO: solicitudes semanales, sin utilizar el PUT heredado.
const diasHorario = new Set(['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']);
let peticionHorarios = null;
let versionCargaHorarios = 0;
let horariosCargados = false;
let guardandoHorario = false;
let solicitudPendienteHorario = null;
let semanaConsultadaHorario = null;
let configuracionHorario = null;

function lunesActualHorario(ahora = new Date()) {
  const partes = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(ahora).map(p => [p.type, p.value]));
  const fecha = new Date(partes.year + '-' + partes.month + '-' + partes.day + 'T00:00:00Z');
  fecha.setUTCDate(fecha.getUTCDate() - (fecha.getUTCDay() + 6) % 7);
  return fecha.toISOString().slice(0, 10);
}

function semanaHorario(inicio) {
  if (typeof inicio !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(inicio)) throw new Error('Selecciona el lunes de la semana.');
  const fecha = new Date(inicio + 'T00:00:00Z');
  if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== inicio || fecha.getUTCDay() !== 1) throw new Error('La fecha inicial debe ser un lunes válido.');
  fecha.setUTCDate(fecha.getUTCDate() + 6);
  return { fecha_inicio: inicio, fecha_fin: fecha.toISOString().slice(0, 10) };
}

function normalizarHoraHorario(valor) {
  if (typeof valor !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(valor)) throw new Error('Completa las horas con un formato válido.');
  return valor.slice(0, 5);
}

function obtenerDiaHorario(diaId) {
  if (typeof diaId !== 'string' || !diasHorario.has(diaId.slice(3)) || !diaId.startsWith('dia')) throw new Error('Día no válido.');
  const dia = document.getElementById(diaId);
  if (!dia || !document.getElementById('modalHorarios')?.contains(dia)) throw new Error('No se encontró el día.');
  return dia;
}

function mensajeHorarios(texto, error = false) {
  const mensaje = document.getElementById('estadoCargaHorarios');
  if (mensaje) { mensaje.textContent = texto; mensaje.setAttribute('role', error ? 'alert' : 'status'); }
}

function limpiarHorarios() {
  document.querySelectorAll('#modalHorarios .dia-row').forEach(dia => {
    dia.classList.remove('activo');
    dia.querySelector('input[type="checkbox"]').checked = false;
    dia.querySelector('.btn-agregar-hora').style.display = 'none';
    dia.querySelector('.dia-horas').replaceChildren();
  });
}

function bloquearEdicionHorarios(bloquear) {
  const pendiente = !!solicitudPendienteHorario;
  const pasado = semanaConsultadaHorario && semanaConsultadaHorario < lunesActualHorario();
  const deshabilitar = bloquear || !horariosCargados || guardandoHorario || pendiente || !!pasado;
  document.querySelectorAll('#modalHorarios .dia-row').forEach(dia => {
    const interruptor = dia.querySelector('input[type="checkbox"]');
    interruptor.disabled = deshabilitar;
    const etiqueta = dia.querySelector('label.switch');
    etiqueta.style.opacity = pendiente ? '0.45' : '';
    etiqueta.style.pointerEvents = pendiente ? 'none' : '';
    etiqueta.title = pendiente ? 'Día de una solicitud pendiente: solo lectura' : '';
    const agregar = dia.querySelector('.btn-agregar-hora');
    agregar.disabled = deshabilitar;
    agregar.style.display = !pendiente && interruptor.checked ? 'block' : 'none';
    dia.querySelectorAll('.hora-row input, .hora-row button').forEach(control => {
      control.disabled = deshabilitar;
      if (control.classList.contains('btn-eliminar-hora')) control.style.display = pendiente ? 'none' : '';
    });
  });
  const enviar = document.getElementById('guardarHorarioBtn');
  enviar.disabled = deshabilitar;
  enviar.textContent = pendiente ? 'Pendiente de aprobación' : 'Enviar solicitud';
  enviar.title = pendiente ? 'Esta solicitud ya fue enviada y está en revisión administrativa.' : 'Enviar una solicitud pendiente de aprobación';
  const cerrar = document.getElementById('cancelarHorarioBtn');
  cerrar.disabled = guardandoHorario;
  cerrar.textContent = pendiente ? 'Cerrar' : 'Cancelar';
  document.getElementById('semanaHorarioInicio').disabled = guardandoHorario;
}
async function respuestaSemanal(respuesta) {
  if (respuesta.redirected || respuesta.status === 401) throw new Error('La sesión expiró. Inicia sesión nuevamente.');
  if (respuesta.status === 403) throw new Error('No tienes permiso para gestionar solicitudes médicas.');
  if (!respuesta.headers.get('content-type')?.includes('application/json')) throw new Error('El servidor devolvió una respuesta inesperada.');
  return respuesta.json();
}

function validarRespuestaSemanal(datos, semana) {
  if (!datos || datos.fecha_inicio !== semana.fecha_inicio || datos.fecha_fin !== semana.fecha_fin || !Array.isArray(datos.solicitudes)) throw new Error('La respuesta no corresponde a la semana seleccionada.');
  const config = datos.configuracion;
  if (!Number.isSafeInteger(config?.duracionConsultaMinutos) || config.duracionConsultaMinutos <= 0 || !Number.isSafeInteger(config.descansoPosteriorMinutos) || config.descansoPosteriorMinutos < 0) throw new Error('La configuración de consulta no es válida.');
  const ids = new Set(), versiones = new Set();
  let pendientes = 0;
  datos.solicitudes.forEach(s => {
    if (!Number.isSafeInteger(s.id_solicitud) || s.id_solicitud <= 0 || ids.has(s.id_solicitud) || !Number.isSafeInteger(s.version) || s.version <= 0 || versiones.has(s.version) || s.fecha_inicio !== semana.fecha_inicio || s.fecha_fin !== semana.fecha_fin || !['Pendiente', 'Aprobado', 'Rechazado', 'Retirada'].includes(s.estado) || !Array.isArray(s.detalles) || !s.detalles.length) throw new Error('La respuesta contiene una solicitud incorrecta.');
    ids.add(s.id_solicitud); versiones.add(s.version);
    if (s.estado === 'Pendiente') pendientes++;
    const detalles = new Set();
    s.detalles.forEach(d => {
      if (!Number.isSafeInteger(d.id_detalle) || d.id_detalle <= 0 || detalles.has(d.id_detalle) || !diasHorario.has(d.dia_semana)) throw new Error('La respuesta contiene una franja incorrecta.');
      detalles.add(d.id_detalle);
      if (normalizarHoraHorario(d.hora_inicio) >= normalizarHoraHorario(d.hora_fin)) throw new Error('La respuesta contiene un rango incorrecto.');
    });
  });
  if (pendientes > 1) throw new Error('Existen pendientes inconsistentes; se requiere revisión.');
  return datos;
}

function representarSolicitudesHorarios(datos) {
  limpiarHorarios();
  solicitudPendienteHorario = datos.solicitudes.find(s => s.estado === 'Pendiente') || null;
  configuracionHorario = datos.configuracion;
  const resumen = datos.solicitudes.map(s => 'Solicitud ' + s.id_solicitud + ', versión ' + s.version + ': ' + s.estado).join(' | ');
  document.getElementById('historialSolicitudesHorarios').textContent = resumen || 'Todavía no hay solicitudes para esta semana.';
  if (solicitudPendienteHorario) solicitudPendienteHorario.detalles.forEach(d => {
    mostrarDiaActivo('dia' + d.dia_semana);
    mostrarHorario('dia' + d.dia_semana, d.hora_inicio, d.hora_fin);
  });
  horariosCargados = true;
  bloquearEdicionHorarios(false);
}

async function abrirModalHorarios({ conservarSemana = false, confirmacion = '', solicitudConfirmada = null } = {}) {
  if (guardandoHorario) return false;
  const modal = document.getElementById('modalHorarios');
  if (!modal) return false;
  const selector = document.getElementById('semanaHorarioInicio');
  if (!conservarSemana) selector.value = lunesActualHorario();
  peticionHorarios?.abort();
  const version = ++versionCargaHorarios;
  const peticion = new AbortController(); peticionHorarios = peticion;
  horariosCargados = false; solicitudPendienteHorario = null; semanaConsultadaHorario = null; configuracionHorario = null;
  limpiarHorarios(); bloquearEdicionHorarios(true);
  document.getElementById('historialSolicitudesHorarios').textContent = '';
  document.getElementById('semanaHorarioFin').textContent = '';
  modal.classList.add('abierto');
  try {
    const semana = semanaHorario(selector.value);
    semanaConsultadaHorario = semana.fecha_inicio;
    document.getElementById('semanaHorarioFin').textContent = semana.fecha_fin;
    mensajeHorarios('Consultando solicitudes semanales...');
    const respuesta = await fetch('/medico/solicitudes-horarios?fecha_inicio=' + encodeURIComponent(semana.fecha_inicio), { credentials: 'same-origin', cache: 'no-store', signal: peticion.signal });
    if (version !== versionCargaHorarios) return false;
    const datos = await respuestaSemanal(respuesta);
    if (version !== versionCargaHorarios) return false;
    if (!respuesta.ok) throw new Error(typeof datos?.mensaje === 'string' ? datos.mensaje : 'No se pudieron consultar las solicitudes.');
    validarRespuestaSemanal(datos, semana);
    if (solicitudConfirmada !== null && !datos.solicitudes.some(s => s.id_solicitud === solicitudConfirmada)) throw new Error('La consulta no incluye la solicitud confirmada. Vuelve a abrir el modal.');
    representarSolicitudesHorarios(datos);
    mensajeHorarios(confirmacion || (solicitudPendienteHorario
      ? 'Solicitud pendiente, versión ' + solicitudPendienteHorario.version + '. Solo lectura; todavía no habilita citas.'
      : semana.fecha_inicio < lunesActualHorario() ? 'Semana pasada: puedes consultar su historial, pero no presentar solicitudes.'
      : 'Puedes preparar una nueva propuesta. El historial no se modifica y la disponibilidad aprobada se conserva.'));
    return true;
  } catch (error) {
    if (version !== versionCargaHorarios || error.name === 'AbortError') return false;
    horariosCargados = false; bloquearEdicionHorarios(true);
    mensajeHorarios((confirmacion ? confirmacion + ' No se pudo verificar la recarga. ' : '') + (error.message || 'No se pudo consultar la semana.'), true);
    return false;
  } finally { if (version === versionCargaHorarios) peticionHorarios = null; }
}

window.cambiarSemanaHorarios = () => {
  if (!guardandoHorario) return abrirModalHorarios({ conservarSemana: true });
};

function cerrarModalHorarios() {
  if (guardandoHorario) return;
  ++versionCargaHorarios; peticionHorarios?.abort(); peticionHorarios = null;
  horariosCargados = false; solicitudPendienteHorario = null;
  document.getElementById('modalHorarios')?.classList.remove('abierto');
  limpiarHorarios(); bloquearEdicionHorarios(true);
  mensajeHorarios('El borrador se descarta al cerrar. Las solicitudes enviadas permanecen guardadas.');
}

window.cerrarModalHorariosFuera = (e) => {
  if (e.target.id === 'modalHorarios') cerrarModalHorarios();
};

function mostrarDiaActivo(diaId) {
  const dia = obtenerDiaHorario(diaId);
  dia.querySelector('input[type="checkbox"]').checked = true;
  dia.classList.add('activo'); dia.querySelector('.btn-agregar-hora').style.display = 'block';
}

function mostrarHorario(diaId, inicio, fin) {
  const dia = obtenerDiaHorario(diaId), horaInicio = normalizarHoraHorario(inicio), horaFin = normalizarHoraHorario(fin);
  if (horaInicio >= horaFin) throw new Error('El inicio debe ser anterior al final.');
  const fila = document.createElement('div'); fila.className = 'hora-row';
  const desde = document.createElement('input'); desde.type = 'time'; desde.value = horaInicio;
  const hasta = document.createElement('input'); hasta.type = 'time'; hasta.value = horaFin;
  for (const input of [desde, hasta]) { input.min = '07:00'; input.max = '19:00'; input.step = '60'; }
  const separador = document.createElement('span'); separador.textContent = 'a';
  const eliminar = document.createElement('button'); eliminar.type = 'button'; eliminar.className = 'btn-eliminar-hora';
  eliminar.textContent = String.fromCodePoint(0x1F5D1); eliminar.setAttribute('aria-label', 'Eliminar rango horario');
  eliminar.addEventListener('click', () => { if (!eliminar.disabled) fila.remove(); });
  fila.append(desde, separador, hasta, eliminar); dia.querySelector('.dia-horas').appendChild(fila);
  return fila;
}

window.toggleDia = (diaId, checkbox) => {
  if (checkbox.disabled) return;
  const dia = obtenerDiaHorario(diaId);
  if (checkbox.checked) { mostrarDiaActivo(diaId); agregarHora(diaId); }
  else { dia.classList.remove('activo'); dia.querySelector('.btn-agregar-hora').style.display = 'none'; dia.querySelector('.dia-horas').replaceChildren(); }
};

function agregarHora(diaId) {
  if (!horariosCargados || guardandoHorario || solicitudPendienteHorario || semanaConsultadaHorario < lunesActualHorario()) return;
  mostrarHorario(diaId, '08:00', '12:00');
}

function recogerHorarios() {
  const franjas = [];
  document.querySelectorAll('#modalHorarios .dia-row').forEach(dia => {
    const nombre = dia.id.slice(3);
    if (!diasHorario.has(nombre)) throw new Error('Día no válido.');
    if (!dia.querySelector('input[type="checkbox"]').checked) return;
    const filas = Array.from(dia.querySelector('.dia-horas').children);
    if (!filas.length) throw new Error('Agrega una franja para ' + nombre + '.');
    filas.forEach(fila => {
      const inputs = fila.querySelectorAll('input[type="time"]');
      const inicio = normalizarHoraHorario(inputs[0].value), fin = normalizarHoraHorario(inputs[1].value);
      if (inicio < '07:00' || fin > '19:00' || inicio >= fin) throw new Error('Las franjas deben estar entre 07:00 y 19:00, con inicio anterior al final.');
      franjas.push({ dia_semana: nombre, hora_inicio: inicio, hora_fin: fin });
    });
  });
  if (!franjas.length || franjas.length > 200) throw new Error('Selecciona entre 1 y 200 franjas.');
  const minutos = h => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
  for (const dia of diasHorario) {
    const rangos = franjas.filter(f => f.dia_semana === dia).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    let inicio = null, fin = null;
    for (const r of rangos) {
      const a = minutos(r.hora_inicio), b = minutos(r.hora_fin);
      if (fin !== null && a < fin) throw new Error('Hay franjas duplicadas o superpuestas en ' + dia + '.');
      if (fin !== null && a !== fin) {
        if (fin - inicio < configuracionHorario.duracionConsultaMinutos) throw new Error('Cada intervalo continuo debe permitir una consulta completa.');
        inicio = a;
      }
      if (inicio === null) inicio = a;
      fin = b;
    }
    if (fin !== null && fin - inicio < configuracionHorario.duracionConsultaMinutos) throw new Error('Cada intervalo continuo debe permitir una consulta completa.');
  }
  return franjas;
}

window.guardarHorarios = async () => {
  if (guardandoHorario || !horariosCargados || solicitudPendienteHorario) return;
  let semana, franjas;
  try {
    semana = semanaHorario(document.getElementById('semanaHorarioInicio').value);
    if (semana.fecha_inicio !== semanaConsultadaHorario) throw new Error('Consulta la semana seleccionada antes de enviar.');
    if (semana.fecha_inicio < lunesActualHorario()) throw new Error('No puedes presentar una semana pasada.');
    franjas = recogerHorarios();
  } catch (error) { mensajeHorarios(error.message, true); return; }
  guardandoHorario = true; bloquearEdicionHorarios(true);
  mensajeHorarios('Enviando solicitud. Espera la confirmación antes de cerrar.');
  let enviada = false, recuperable = false;
  try {
    const respuesta = await fetch('/medico/solicitudes-horarios', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...semana, franjas }),
    });
    const datos = await respuestaSemanal(respuesta);
    if (!respuesta.ok) {
      recuperable = respuesta.status === 400;
      throw new Error(typeof datos?.mensaje === 'string' ? datos.mensaje : 'No se pudo presentar la solicitud.');
    }
    if (respuesta.status !== 201 || datos?.solicitud?.estado !== 'Pendiente' || !Number.isSafeInteger(datos.solicitud.id_solicitud) || datos.solicitud.fecha_inicio !== semana.fecha_inicio || datos.solicitud.fecha_fin !== semana.fecha_fin || typeof datos.mensaje !== 'string') throw new Error('No se pudo confirmar la respuesta de guardado.');
    enviada = true;
    const confirmacion = datos.mensaje + ' Solicitud ' + datos.solicitud.id_solicitud + '. Todavía no habilita citas.';
    guardandoHorario = false;
    await abrirModalHorarios({ conservarSemana: true, confirmacion, solicitudConfirmada: datos.solicitud.id_solicitud });
  } catch (error) {
    guardandoHorario = false;
    if (!recuperable) horariosCargados = false;
    bloquearEdicionHorarios(!recuperable);
    mensajeHorarios((error.message || 'Error de comunicación.') + (recuperable ? ' Corrige el borrador y vuelve a enviar.' : enviada ? ' La solicitud se guardó; vuelve a consultar la semana.' : ' El borrador se conserva. Vuelve a consultar la semana antes de reintentar; no se puede asegurar el resultado.'), true);
  } finally { guardandoHorario = false; bloquearEdicionHorarios(!horariosCargados); }
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