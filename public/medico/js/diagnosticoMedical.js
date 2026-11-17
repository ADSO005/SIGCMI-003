(() => {
  const form = document.getElementById("formDiagnostico");
  if (!form) return;
  const nombres = ["diagnostico", "sintomas", "tratamiento", "notas_adicionales", "temperatura", "altura", "peso", "frecuencia_cardiaca", "presion_arterial"];
  const campos = Object.fromEntries(nombres.map(nombre => [nombre, form.elements.namedItem(nombre)]));
  const elemento = id => document.getElementById(id);
  const fieldset = elemento("camposDiagnostico"), guardar = elemento("guardarDiagnostico");
  const mensaje = elemento("mensajeDiagnostico"), reintentar = elemento("reintentarDiagnostico");
  const consultar = elemento("consultarVersionDiagnostico"), panel = elemento("versionRecienteDiagnostico");
  const modal = elemento("modalAtencion"), cerrarSuperior = elemento("cerrarAtencionSuperior"), cerrarInferior = elemento("cerrarAtencion");
  const finalizar = elemento("finalizarConsulta");
  const estadoGuardado = elemento("estadoGuardadoDiagnostico");
  const camposMedicamentos = elemento("camposMedicamentos");
  const estadoMedicamentos = elemento("estadoMedicamentos");
  const decisionRequiere = elemento("decisionRequiere"), decisionNoRequiere = elemento("decisionNoRequiere");
  const listaGuardados = elemento("medicamentosGuardados"), listaPendientes = elemento("medicamentosPendientes");
  const guardarMedicamentos = elemento("guardarMedicamentos"), revisarMedicamentos = elemento("revisarMedicamentos");
  const confirmarRevisionMedicamentos = elemento("confirmarRevisionMedicamentos");
  const formularioNuevoMedicamento = elemento("formNuevoMedicamento");
  const camposNuevoMedicamento = {
    nombre_medicamento: elemento("nuevoNombreMedicamento"),
    dosis: elemento("nuevaDosisMedicamento"),
    frecuencia: elemento("nuevaFrecuenciaMedicamento"),
    duracion: elemento("nuevaDuracionMedicamento")
  };
  const url = `/medico/citas/${form.dataset.cita}/diagnostico`;
  let revision = null, reciente = null, cargado = false, cargando = false, guardando = false, finalizando = false;
  let conflicto = false, bloqueado = false, cambios = false;
  let persistido = false, versionCarga = 0, focoAnterior = null, overflowAnterior = "";
  let valoresGuardados = "";
  let decisionPersistida = "Pendiente", decisionSeleccionada = "";
  let versionPrescripciones = null, medicamentosGuardados = [], medicamentosPendientes = [];
  let medicamentosCargados = false, cargandoMedicamentos = false, guardandoMedicamentos = false, conflictoMedicamentos = false;
  let errorCargaMedicamentos = "";
  let medicamentosRevisados = false;

  const contenidoFormulario = () => JSON.stringify(nombres.map(nombre => campos[nombre].value));

  function avisar(texto, error = false) {
    mensaje.textContent = texto;
    mensaje.setAttribute("role", error ? "alert" : "status");
  }
  function actualizarControles() {
    fieldset.disabled = !cargado || guardando || guardandoMedicamentos || finalizando || bloqueado;
    guardar.disabled = !cargado || cargando || guardando || finalizando || conflicto || bloqueado;
    guardar.textContent = guardando ? "Guardando…" : "Guardar borrador";
    const estadoCompletadaId = Number(form.dataset.estadoCompletada);
    const decisionCompleta = decisionPersistida === "No requiere"
      ? medicamentosGuardados.length === 0
      : decisionPersistida === "Requiere" && medicamentosGuardados.length > 0;
    const medicamentosListos = medicamentosCargados && !guardandoMedicamentos
      && !conflictoMedicamentos && !medicamentosPendientes.length && !hayCambiosDecision();
    finalizar.disabled = !cargado || !persistido || !decisionCompleta || !medicamentosListos
      || cambios || cargando || guardando || finalizando || conflicto || bloqueado
      || !Number.isSafeInteger(estadoCompletadaId) || estadoCompletadaId <= 0;
    finalizar.textContent = finalizando ? "Finalizando…" : "Finalizar consulta";
    consultar.disabled = cargando || guardando || finalizando;
    reintentar.disabled = cargando || guardando || finalizando;
    cerrarSuperior.disabled = guardando || finalizando;
    cerrarInferior.disabled = guardando || finalizando;
    camposMedicamentos.disabled = !medicamentosCargados || !persistido || bloqueado || guardandoMedicamentos || guardando || finalizando;
    guardarMedicamentos.disabled = !medicamentosCargados || !persistido || !decisionSeleccionada
      || guardandoMedicamentos || guardando || finalizando || bloqueado || conflictoMedicamentos
      || (decisionSeleccionada === "Requiere" && !medicamentosPendientes.length && !medicamentosGuardados.some(medicamentoValido));
    revisarMedicamentos.disabled = guardandoMedicamentos || guardando || finalizando;
    confirmarRevisionMedicamentos.disabled = guardandoMedicamentos || guardando || finalizando || !medicamentosRevisados;
    formularioNuevoMedicamento.hidden = decisionSeleccionada !== "Requiere" || !medicamentosCargados;
    decisionRequiere.checked = decisionSeleccionada === "Requiere";
    decisionNoRequiere.checked = decisionSeleccionada === "No requiere";
    decisionNoRequiere.disabled = medicamentosGuardados.length > 0 || medicamentosPendientes.length > 0;
    elemento("ayudaDecisionMedicamentos").textContent = decisionPersistida === "Pendiente"
      ? "La decisión permanece Pendiente hasta que la guardes."
      : decisionNoRequiere.disabled
        ? "Ya hay medicamentos agregados; no se puede cambiar la decisión a No requiere."
        : "Decisión guardada: " + decisionPersistida + ".";
    renderizarMedicamentos();
    actualizarEstadoMedicamentos();
    estadoGuardado.textContent = guardando ? "Guardando borrador…" : finalizando ? "Finalizando consulta…" : bloqueado ? "Consulta no editable" : conflicto ? "Conflicto pendiente de revisión"
      : cambios ? "Cambios sin guardar" : !cargado ? (cargando ? "Cargando borrador…" : "Borrador no disponible")
        : persistido ? "Borrador guardado" : "Sin borrador guardado";
  }
  function hayCambiosDecision() {
    return decisionSeleccionada !== "" && decisionSeleccionada !== decisionPersistida;
  }
  function medicamentoValido(medicamento) {
    return ["nombre_medicamento", "dosis", "frecuencia", "duracion"]
      .every(campo => typeof medicamento?.[campo] === "string" && medicamento[campo].trim());
  }
  function actualizarEstadoMedicamentos() {
    if (!persistido) {
      estadoMedicamentos.textContent = "Guarda primero un diagnóstico válido para registrar la decisión sobre medicamentos.";
    } else if (cargandoMedicamentos) {
      estadoMedicamentos.textContent = "Consultando la decisión y los medicamentos guardados…";
    } else if (!medicamentosCargados && errorCargaMedicamentos) {
      estadoMedicamentos.textContent = errorCargaMedicamentos + " La selección se habilitará cuando se pueda consultar el estado actual.";
    } else if (!medicamentosCargados) {
      estadoMedicamentos.textContent = "No se ha podido consultar todavía la decisión de medicamentos.";
    } else if (guardandoMedicamentos) {
      estadoMedicamentos.textContent = "Guardando la decisión y los medicamentos…";
    } else if (conflictoMedicamentos && !medicamentosRevisados) {
      estadoMedicamentos.textContent = "La información cambió en otra sesión. Consulta el estado actual y revísalo antes de volver a guardar.";
    } else if (conflictoMedicamentos) {
      estadoMedicamentos.textContent = "Revisa la lista guardada. Tus medicamentos nuevos siguen pendientes; el guardado no se reenvió.";
    } else if (decisionPersistida === "Pendiente") {
      estadoMedicamentos.textContent = "Decisión Pendiente. Selecciona una opción y guárdala antes de finalizar la consulta.";
    } else if (hayCambiosDecision() || medicamentosPendientes.length) {
      estadoMedicamentos.textContent = "Tienes cambios sin guardar. La consulta no se podrá finalizar hasta guardarlos.";
    } else if (decisionPersistida === "No requiere") {
      estadoMedicamentos.textContent = "Decisión guardada: No requiere medicamentos.";
    } else {
      estadoMedicamentos.textContent = "Decisión guardada: Requiere medicamentos. " + medicamentosGuardados.length + " medicamento(s) registrados.";
    }
  }
  function renderizarMedicamentos() {
    listaGuardados.replaceChildren();
    listaPendientes.replaceChildren();
    elemento("sinMedicamentosGuardados").hidden = medicamentosGuardados.length > 0;
    medicamentosGuardados.forEach(medicamento => agregarTarjetaMedicamento(listaGuardados, medicamento, false));
    medicamentosPendientes.forEach((medicamento, indice) => agregarTarjetaMedicamento(listaPendientes, medicamento, true, indice));
  }
  function agregarTarjetaMedicamento(lista, medicamento, pendiente, indice) {
    const tarjeta = document.createElement("li");
    tarjeta.className = "min-w-0 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 [overflow-wrap:anywhere]";
    const nombre = document.createElement("p");
    nombre.className = "font-semibold text-slate-900";
    nombre.textContent = medicamento.nombre_medicamento;
    tarjeta.appendChild(nombre);
    const detalle = document.createElement("p");
    detalle.className = "mt-1 whitespace-pre-wrap";
    detalle.textContent = "Dosis: " + medicamento.dosis + " · Frecuencia: " + medicamento.frecuencia + " · Duración: " + medicamento.duracion;
    tarjeta.appendChild(detalle);
    if (pendiente) {
      const quitar = document.createElement("button");
      quitar.type = "button";
      quitar.className = "mt-2 rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700";
      quitar.textContent = "Quitar de pendientes";
      quitar.addEventListener("click", () => {
        medicamentosPendientes.splice(indice, 1);
        actualizarControles();
      });
      tarjeta.appendChild(quitar);
    } else {
      const etiqueta = document.createElement("span");
      etiqueta.className = "mt-2 inline-block text-xs text-emerald-800";
      etiqueta.textContent = "Guardado · solo lectura";
      tarjeta.appendChild(etiqueta);
    }
    lista.appendChild(tarjeta);
  }
  function medicamentosRespuestaValida(datos) {
    const decisionValida = ["Pendiente", "Requiere", "No requiere"].includes(datos?.decision_medicamentos);
    const cantidadesValidas = datos?.decision_medicamentos === "Pendiente"
      ? datos.medicamentos?.length === 0
      : datos?.decision_medicamentos === "No requiere"
        ? datos.medicamentos?.length === 0
        : datos?.decision_medicamentos === "Requiere" && datos.medicamentos?.length > 0;
    return decisionValida && cantidadesValidas
      && Number.isSafeInteger(datos.version_prescripciones) && datos.version_prescripciones >= 0
      && Array.isArray(datos.medicamentos) && datos.medicamentos.every(medicamentoValido);
  }
  async function cargarMedicamentos(opciones = {}) {
    const version = versionCarga;
    if (cargandoMedicamentos) return false;
    if (!persistido) {
      medicamentosCargados = false;
      actualizarControles();
      return false;
    }
    cargandoMedicamentos = true;
    errorCargaMedicamentos = "";
    actualizarControles();
    try {
      const respuesta = await fetch("/medico/citas/" + form.dataset.cita + "/medicamentos", {
        credentials: "same-origin",
        cache: "no-store"
      });
      if (version !== versionCarga) return false;
      if (respuesta.redirected || respuesta.status === 401) {
        bloqueado = true;
        throw Error("La sesión venció. Inicia sesión nuevamente.");
      }
      if (!respuesta.headers.get("content-type")?.includes("application/json")) {
        throw Error("No se pudo consultar el estado de los medicamentos.");
      }
      const datos = await respuesta.json();
      if (version !== versionCarga) return false;
      if (!respuesta.ok) throw Error(typeof datos?.mensaje === "string" ? datos.mensaje : "No se pudo consultar el estado de los medicamentos.");
      if (!Number.isSafeInteger(datos.id_diagnostico) || datos.id_diagnostico <= 0) {
        throw Error("La respuesta de medicamentos no es válida.");
      }
      if (!medicamentosRespuestaValida(datos)) throw Error("La respuesta de medicamentos está incompleta.");

      decisionPersistida = datos.decision_medicamentos;
      versionPrescripciones = datos.version_prescripciones;
      medicamentosGuardados = datos.medicamentos;
      medicamentosCargados = true;
      if (opciones.conflicto) {
        // Se actualiza la versión del servidor, pero nunca se reenvía el formulario automáticamente.
        decisionSeleccionada = decisionPersistida === "Pendiente" ? "" : decisionPersistida;
        medicamentosRevisados = true;
        revisarMedicamentos.hidden = true;
        confirmarRevisionMedicamentos.hidden = false;
      } else if (!opciones.conservarDecision) {
        decisionSeleccionada = decisionPersistida === "Pendiente" ? "" : decisionPersistida;
      }
      return true;
    } catch (error) {
      if (version !== versionCarga) return false;
      errorCargaMedicamentos = errorPeticion(error);
      if (!opciones.conflicto) medicamentosCargados = false;
      return false;
    } finally {
      if (version === versionCarga) {
        cargandoMedicamentos = false;
        actualizarControles();
      }
    }
  }
  function agregarMedicamentoPendiente() {
    for (const input of Object.values(camposNuevoMedicamento)) {
      const valor = input.value.trim();
      if (!valor || valor.length > Number(input.maxLength)) {
        input.setCustomValidity(!valor ? "Este campo es obligatorio." : "El valor supera el límite permitido.");
        input.setAttribute("aria-invalid", "true");
        input.reportValidity();
        return;
      }
      input.setCustomValidity("");
      input.removeAttribute("aria-invalid");
    }
    medicamentosPendientes.push({
      nombre_medicamento: camposNuevoMedicamento.nombre_medicamento.value.trim(),
      dosis: camposNuevoMedicamento.dosis.value.trim(),
      frecuencia: camposNuevoMedicamento.frecuencia.value.trim(),
      duracion: camposNuevoMedicamento.duracion.value.trim()
    });
    Object.values(camposNuevoMedicamento).forEach(input => { input.value = ""; });
    actualizarControles();
    camposNuevoMedicamento.nombre_medicamento.focus();
  }
  async function guardarDecisionMedicamentos() {
    if (guardarMedicamentos.disabled || guardandoMedicamentos) return;
    if (decisionSeleccionada === "Requiere" && !medicamentosPendientes.length
      && !medicamentosGuardados.some(medicamentoValido)) {
      estadoMedicamentos.textContent = "Agrega al menos un medicamento para guardar la decisión Requiere.";
      return;
    }
    if (decisionSeleccionada === "No requiere" && medicamentosGuardados.length) {
      estadoMedicamentos.textContent = "Ya existen medicamentos guardados; no se puede registrar No requiere.";
      return;
    }
    guardandoMedicamentos = true;
    actualizarControles();
    try {
      const respuesta = await fetch("/medico/citas/" + form.dataset.cita + "/medicamentos", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision_medicamentos: decisionSeleccionada,
          version_prescripciones: versionPrescripciones,
          medicamentos: decisionSeleccionada === "Requiere" ? medicamentosPendientes : []
        })
      });
      if (respuesta.redirected || respuesta.status === 401) {
        bloqueado = true;
        throw Error("La sesión venció. Los medicamentos no se reenviaron.");
      }
      if (!respuesta.headers.get("content-type")?.includes("application/json")) {
        throw Error("Respuesta no válida. Verifica el estado actual antes de volver a guardar.");
      }
      const datos = await respuesta.json();
      if (respuesta.status === 409) {
        conflictoMedicamentos = true;
        medicamentosRevisados = false;
        revisarMedicamentos.hidden = false;
        confirmarRevisionMedicamentos.hidden = true;
        await cargarMedicamentos({ conflicto: true, conservarDecision: true });
        conflictoMedicamentos = true;
        estadoMedicamentos.textContent = "Conflicto 409: se consultó el estado actual. Revísalo antes de decidir si vuelves a guardar; no hubo reenvío automático.";
        throw Error(typeof datos?.mensaje === "string" ? datos.mensaje : "La información cambió en otra sesión.");
      }
      if (!respuesta.ok) throw Error(typeof datos?.mensaje === "string" ? datos.mensaje : "No se pudieron guardar los medicamentos.");
      if (!medicamentosRespuestaValida(datos)) throw Error("No se pudo confirmar el guardado. Consulta el estado actual antes de reintentar.");
      decisionPersistida = datos.decision_medicamentos;
      decisionSeleccionada = datos.decision_medicamentos;
      versionPrescripciones = datos.version_prescripciones;
      medicamentosGuardados = datos.medicamentos;
      medicamentosPendientes = [];
      medicamentosCargados = true;
      conflictoMedicamentos = false;
      medicamentosRevisados = false;
      revisarMedicamentos.hidden = true;
      confirmarRevisionMedicamentos.hidden = true;
      estadoMedicamentos.textContent = "Decisión y medicamentos guardados. La cita continúa En Curso.";
    } catch (error) {
      if (!conflictoMedicamentos) estadoMedicamentos.textContent = errorPeticion(error);
      else estadoMedicamentos.textContent = "Conflicto 409: revisa el estado actual. Tus medicamentos nuevos siguen pendientes y no se reenviaron.";
    } finally {
      guardandoMedicamentos = false;
      actualizarControles();
    }
  }
  function cargarCampos(datos) {
    nombres.forEach(nombre => {
      campos[nombre].value = String(datos.diagnostico?.[nombre] ?? "");
      campos[nombre].setCustomValidity("");
      campos[nombre].removeAttribute("aria-invalid");
    });
    revision = datos.revision;
    cambios = false;
    valoresGuardados = contenidoFormulario();
    persistido = typeof datos.diagnostico?.diagnostico === "string" && !!datos.diagnostico.diagnostico.trim();
  }
  async function leerRespuesta(respuesta) {
    if (respuesta.redirected || respuesta.status === 401) {
      bloqueado = true;
      throw Error("La sesión venció. Tus datos se conservan en esta página; inicia sesión nuevamente antes de continuar.");
    }
    if ([403, 404].includes(respuesta.status)) {
      bloqueado = true;
      throw Error("No tienes acceso a esta consulta. Tus datos escritos se conservan.");
    }
    if (respuesta.status === 413) throw Error("El formulario supera el tamaño admitido por el servidor. Reduce los textos; tus datos se conservan.");
    if (!respuesta.headers.get("content-type")?.includes("application/json")) throw Error("Respuesta no válida. Tus datos se conservan; comprueba tu sesión o reintenta.");
    return respuesta.json();
  }
  function respuestaValida(datos) {
    if (datos?.diagnostico === null) return datos.revision === null;
    return datos?.diagnostico?.cita_id === Number(form.dataset.cita)
      && typeof datos.revision === "string" && /^[a-f0-9]{64}$/.test(datos.revision)
      && nombres.every(nombre => Object.hasOwn(datos.diagnostico, nombre)
        && (datos.diagnostico[nombre] === null || ["string", "number"].includes(typeof datos.diagnostico[nombre])));
  }
  function mostrarVersion(datos) {
    const lista = elemento("detalleVersionDiagnostico");
    lista.replaceChildren();
    nombres.forEach(nombre => {
      const grupo = document.createElement("div");
      const etiqueta = document.createElement("dt"), valor = document.createElement("dd");
      etiqueta.className = "font-semibold";
      etiqueta.textContent = campos[nombre].dataset.label;
      valor.className = "whitespace-pre-wrap";
      valor.textContent = datos.diagnostico?.[nombre] ?? "Sin registrar";
      grupo.appendChild(etiqueta); grupo.appendChild(valor); lista.appendChild(grupo);
    });
    panel.hidden = false;
  }
  function errorPeticion(error) {
    return error instanceof TypeError ? "No se pudo conectar con el servidor. Tus datos se conservan; revisa la conexión."
      : error instanceof SyntaxError ? "La respuesta del servidor no es válida. Tus datos se conservan."
        : error.message;
  }
  async function cargar(versionReciente = false) {
    if (cargando || guardando || finalizando) return;
    const version = versionCarga;
    cargando = true;
    if (versionReciente) { reciente = null; panel.hidden = true; }
    actualizarControles();
    avisar(versionReciente ? "Consultando la versión más reciente sin cambiar tu formulario…" : "Cargando diagnóstico…");
    try {
      const respuesta = await fetch(url, { credentials: "same-origin", cache: "no-store" });
      if (version !== versionCarga) return;
      const datos = await leerRespuesta(respuesta);
      if (version !== versionCarga) return;
      if (respuesta.status === 409) bloqueado = true;
      if (!respuesta.ok) throw Error(typeof datos?.mensaje === "string" ? datos.mensaje : "No se pudo consultar el diagnóstico.");
      if (!respuestaValida(datos)) throw Error("La respuesta del diagnóstico está incompleta. No se ha modificado el formulario.");
      if (versionReciente) {
        reciente = datos;
        mostrarVersion(datos);
        avisar("Versión reciente consultada. Tus datos y la revisión del formulario no se han modificado.");
      } else {
        cargarCampos(datos);
        cargado = true; bloqueado = false;
        reintentar.hidden = true;
        avisar(datos.diagnostico ? "Borrador cargado. Puedes editarlo mientras la cita siga En Curso." : "Todavía no hay borrador. Completa el campo obligatorio para guardarlo.");
        if (persistido) await cargarMedicamentos();
        else {
          medicamentosCargados = false;
          estadoMedicamentos.textContent = "Guarda primero un diagnóstico válido para registrar la decisión sobre medicamentos.";
        }
      }
    } catch (error) {
      if (version !== versionCarga) return;
      avisar(errorPeticion(error), true);
      reintentar.hidden = cargado || bloqueado;
      mensaje.focus();
    } finally {
      if (version === versionCarga) { cargando = false; actualizarControles(); }
    }
  }
  function validarCampos() {
    const escalas = { temperatura: [4, 1], altura: [4, 2], peso: [5, 2] };
    for (const nombre of nombres) {
      const campo = campos[nombre], texto = campo.value.trim();
      let error = "";
      if (nombre === "diagnostico" && !texto) error = "El diagnóstico es obligatorio y no puede contener solo espacios.";
      else if (["diagnostico", "sintomas", "tratamiento", "notas_adicionales"].includes(nombre)
        && new TextEncoder().encode(campo.value).length > 65535) error = "El texto supera el límite de 65535 bytes UTF-8.";
      else if (texto && Object.hasOwn(escalas, nombre)) {
        const partes = /^[+-]?(\d+)(?:\.(\d+))?$/.exec(texto);
        const [precision, escala] = escalas[nombre];
        if (!partes || partes[1].replace(/^0+/, "").length > precision - escala || (partes[2] || "").length > escala) {
          error = `Usa punto decimal, hasta ${precision - escala} dígitos enteros y ${escala} decimales.`;
        }
      } else if (texto && nombre === "frecuencia_cardiaca"
        && (!/^[+-]?\d+$/.test(texto) || Number(texto) < -2147483648 || Number(texto) > 2147483647)) error = "Usa un entero válido de 32 bits.";
      else if (texto && nombre === "presion_arterial" && (texto.length > 20 || !/^\d+\s*\/\s*\d+$/.test(texto))) error = "Usa dos enteros separados por /, con máximo 20 caracteres.";
      campo.setCustomValidity(error);
      if (error) {
        campo.setAttribute("aria-invalid", "true");
        avisar(`${campo.dataset.label}: ${error}`, true);
        campo.reportValidity();
        return false;
      }
      campo.removeAttribute("aria-invalid");
    }
    return true;
  }
  async function enviar(event) {
    event.preventDefault();
    if (!cargado || cargando || guardando || finalizando || conflicto || bloqueado || !validarCampos()) return;
    const cuerpo = { revision };
    nombres.forEach(nombre => { cuerpo[nombre] = campos[nombre].value.trim() ? campos[nombre].value : null; });
    guardando = true;
    actualizarControles();
    avisar("Guardando borrador…");
    try {
      const respuesta = await fetch(url, { method: "PUT", credentials: "same-origin",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
      const datos = await leerRespuesta(respuesta);
      if (respuesta.status === 409) {
        conflicto = true;
        throw Error("Hay un conflicto: el diagnóstico pudo ser modificado desde otra sesión o pestaña, o la cita ya no está En Curso. Tus datos se conservan. Consulta la versión más reciente.");
      }
      if (!respuesta.ok) throw Error(typeof datos?.mensaje === "string" ? datos.mensaje : "No se pudo guardar el diagnóstico. Tus datos se conservan.");
      if (!respuestaValida(datos) || !datos.diagnostico) throw Error("No se pudo confirmar el guardado. Tus datos se conservan; consulta la versión más reciente.");
      cargarCampos(datos);
      consultar.hidden = true; panel.hidden = true; reciente = null;
      avisar("Borrador guardado. Puedes continuar la atención");
      await cargarMedicamentos();
    } catch (error) {
      avisar(errorPeticion(error), true);
      consultar.hidden = false;
      mensaje.focus();
    } finally { guardando = false; actualizarControles(); }
  }
  async function finalizarAtencion() {
    const estadoId = Number(finalizar.dataset.estadoId);
    if (finalizar.disabled || finalizando || !persistido || cambios || !Number.isSafeInteger(estadoId) || estadoId <= 0) return;
    if (!window.confirm("Al finalizar, el diagnóstico quedará bloqueado para edición. ¿Deseas finalizar la consulta?")) return;
    finalizando = true;
    actualizarControles();
    avisar("Finalizando consulta…");
    try {
      const respuesta = await fetch(`/medico/citas/${form.dataset.cita}/estado`, {
        method: "PATCH", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado_id: estadoId })
      });
      if (respuesta.redirected || respuesta.status === 401) throw Error("La sesión venció. Verifica el estado de la consulta antes de continuar.");
      if (respuesta.status === 403) throw Error("No tienes permiso para finalizar esta consulta.");
      if (!respuesta.headers.get("content-type")?.includes("application/json")) throw Error("Respuesta no válida. Comprueba el estado de la consulta antes de reintentar.");
      const datos = await respuesta.json();
      if (respuesta.status === 409) {
        bloqueado = true;
        throw Error(typeof datos?.mensaje === "string" ? datos.mensaje : "La consulta cambió de estado. Actualiza la agenda.");
      }
      if (!respuesta.ok) throw Error(typeof datos?.mensaje === "string" ? datos.mensaje : "No se pudo finalizar la consulta.");
      if (datos.id_cita !== Number(form.dataset.cita) || datos.estado_id !== estadoId) throw Error("No se pudo confirmar el cambio. Actualiza la agenda.");
      window.location.assign(`/medico/dashboard?citaFinalizada=${form.dataset.cita}#agendaView`);
    } catch (error) {
      avisar(errorPeticion(error), true);
      mensaje.focus();
    } finally {
      finalizando = false;
      actualizarControles();
    }
  }
  form.addEventListener("submit", enviar);
  finalizar.addEventListener("click", finalizarAtencion);
  guardarMedicamentos.addEventListener("click", guardarDecisionMedicamentos);
  elemento("agregarMedicamento").addEventListener("click", agregarMedicamentoPendiente);
  [decisionRequiere, decisionNoRequiere].forEach(opcion => opcion.addEventListener("change", () => {
    if (opcion.checked) decisionSeleccionada = opcion.value;
    actualizarControles();
  }));
  revisarMedicamentos.addEventListener("click", async () => {
    revisarMedicamentos.disabled = true;
    estadoMedicamentos.textContent = "Consultando el estado actual; no se guardarán cambios.";
    const consultado = await cargarMedicamentos({ conflicto: true, conservarDecision: true });
    if (!consultado) {
      medicamentosRevisados = false;
      confirmarRevisionMedicamentos.hidden = true;
      estadoMedicamentos.textContent = "No se pudo consultar el estado actual. Tus datos pendientes se conservaron; reintenta la consulta.";
      revisarMedicamentos.hidden = false;
    }
    actualizarControles();
  });
  confirmarRevisionMedicamentos.addEventListener("click", () => {
    if (!medicamentosRevisados) return;
    conflictoMedicamentos = false;
    medicamentosRevisados = false;
    confirmarRevisionMedicamentos.hidden = true;
    revisarMedicamentos.hidden = true;
    estadoMedicamentos.textContent = "Estado actual revisado. Revisa tu decisión y los medicamentos pendientes antes de guardar.";
    actualizarControles();
  });
  form.addEventListener("input", event => {
    // La selección de los radios se procesa en change; no restablecerla antes.
    if (event.target.name === "decision_medicamentos") return;
    cambios = contenidoFormulario() !== valoresGuardados;
    event.target.setCustomValidity?.("");
    event.target.removeAttribute("aria-invalid");
    actualizarControles();
  });
  reintentar.addEventListener("click", () => cargar());
  consultar.addEventListener("click", () => cargar(true));
  elemento("ocultarVersionDiagnostico").addEventListener("click", () => { panel.hidden = true; });
  elemento("cargarVersionDiagnostico").addEventListener("click", () => {
    if (!reciente || cargando || guardando || !window.confirm("Se reemplazarán los datos de tu formulario con la versión consultada. ¿Deseas descartar tus cambios locales?")) return;
    cargarCampos(reciente);
    reciente = null; conflicto = false; bloqueado = false; cargado = true;
    panel.hidden = true; consultar.hidden = true;
    actualizarControles();
    avisar("Se cargó la versión consultada. Revisa los campos antes de editar y guardar.");
  });
  window.addEventListener("beforeunload", event => {
    if (cambios || guardando || medicamentosPendientes.length || hayCambiosDecision() || guardandoMedicamentos) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  function abrir(event) {
    event?.preventDefault();
    if (modal.open) return;
    focoAnterior = event?.currentTarget || document.querySelector(`[data-continuar-cita="${form.dataset.cita}"]`) || document.activeElement;
    overflowAnterior = document.body.style.overflow;
    modal.showModal(); // El diálogo nativo mantiene el foco dentro y deja inerte el fondo.
    document.body.style.overflow = "hidden";
    elemento("cuerpoAtencion").scrollTop = 0;
    cerrarSuperior.focus();
    cargar();
  }
  function cerrar() {
    if (!modal.open) return;
    if (guardando || guardandoMedicamentos || finalizando) { avisar("Espera a que termine la solicitud antes de cerrar."); return; }
    const medicamentoEnEdicion = Object.values(camposNuevoMedicamento).some(input => input.value.trim());
    if ((cambios || medicamentosPendientes.length || hayCambiosDecision() || medicamentoEnEdicion)
      && !window.confirm("Tienes cambios sin guardar. ¿Deseas descartarlos y cerrar la atención médica?")) return;
    // Una respuesta GET tardía no debe modificar un formulario cerrado o recién abierto.
    versionCarga++;
    cargando = false; cargado = false; cambios = false; persistido = false; finalizando = false;
    conflicto = false; bloqueado = false; reciente = null; revision = null;
    nombres.forEach(nombre => { campos[nombre].value = ""; campos[nombre].setCustomValidity(""); campos[nombre].removeAttribute("aria-invalid"); });
    Object.values(camposNuevoMedicamento).forEach(input => { input.value = ""; input.setCustomValidity(""); input.removeAttribute("aria-invalid"); });
    decisionPersistida = "Pendiente"; decisionSeleccionada = ""; versionPrescripciones = null;
    medicamentosGuardados = []; medicamentosPendientes = []; medicamentosCargados = false;
    cargandoMedicamentos = false; guardandoMedicamentos = false; conflictoMedicamentos = false; medicamentosRevisados = false;
    errorCargaMedicamentos = "";
    revisarMedicamentos.hidden = true; confirmarRevisionMedicamentos.hidden = true;
    valoresGuardados = contenidoFormulario();
    panel.hidden = true; consultar.hidden = true; reintentar.hidden = true;
    actualizarControles();
    modal.close();
    document.body.style.overflow = overflowAnterior;
    focoAnterior?.focus();
  }
  window.abrirAtencion = abrir;
  cerrarSuperior.addEventListener("click", cerrar);
  cerrarInferior.addEventListener("click", cerrar);
  modal.addEventListener("cancel", event => { event.preventDefault(); cerrar(); });
  modal.addEventListener("click", event => { if (event.target === modal) cerrar(); });
  document.addEventListener("keydown", event => {
    if (!modal.open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      cerrar();
      return;
    }
    if (event.key !== "Tab") return;
    const controles = [...modal.querySelectorAll("button, input, textarea, select, a[href], [tabindex]:not([tabindex='-1'])")]
      .filter(control => !control.matches(":disabled") && control.getClientRects().length);
    if (!controles.length) { event.preventDefault(); modal.focus(); return; }
    const primero = controles[0], ultimo = controles[controles.length - 1];
    if (!modal.contains(document.activeElement)) { event.preventDefault(); primero.focus(); }
    else if (event.shiftKey && document.activeElement === primero) { event.preventDefault(); ultimo.focus(); }
    else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primero.focus(); }
  });
  abrir();
})();
