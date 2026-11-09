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
  const estadoGuardado = elemento("estadoGuardadoDiagnostico");
  const url = `/medico/citas/${form.dataset.cita}/diagnostico`;
  let revision = null, reciente = null, cargado = false, cargando = false, guardando = false;
  let conflicto = false, bloqueado = false, cambios = false;
  let persistido = false, versionCarga = 0, focoAnterior = null, overflowAnterior = "";
  let valoresGuardados = "";

  const contenidoFormulario = () => JSON.stringify(nombres.map(nombre => campos[nombre].value));

  function avisar(texto, error = false) {
    mensaje.textContent = texto;
    mensaje.setAttribute("role", error ? "alert" : "status");
  }
  function actualizarControles() {
    fieldset.disabled = !cargado || guardando || bloqueado;
    guardar.disabled = !cargado || cargando || guardando || conflicto || bloqueado;
    guardar.textContent = guardando ? "Guardando…" : "Guardar diagnóstico";
    consultar.disabled = cargando || guardando;
    reintentar.disabled = cargando || guardando;
    cerrarSuperior.disabled = guardando;
    cerrarInferior.disabled = guardando;
    estadoGuardado.textContent = guardando ? "Guardando diagnóstico…" : bloqueado ? "Consulta no editable" : conflicto ? "Conflicto pendiente de revisión"
      : cambios ? "Cambios sin guardar" : !cargado ? (cargando ? "Cargando diagnóstico…" : "Diagnóstico no disponible")
        : persistido ? "Diagnóstico guardado" : "Sin diagnóstico guardado";
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
    if (cargando || guardando) return;
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
        avisar(datos.diagnostico ? "Diagnóstico cargado. Puedes editarlo mientras la cita siga En Curso." : "Todavía no hay diagnóstico. Completa el campo obligatorio para guardarlo.");
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
    if (!cargado || cargando || guardando || conflicto || bloqueado || !validarCampos()) return;
    const cuerpo = { revision };
    nombres.forEach(nombre => { cuerpo[nombre] = campos[nombre].value.trim() ? campos[nombre].value : null; });
    guardando = true;
    actualizarControles();
    avisar("Guardando diagnóstico…");
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
      avisar("Diagnóstico guardado correctamente. Puedes continuar editándolo.");
    } catch (error) {
      avisar(errorPeticion(error), true);
      consultar.hidden = false;
      mensaje.focus();
    } finally { guardando = false; actualizarControles(); }
  }
  form.addEventListener("submit", enviar);
  form.addEventListener("input", event => {
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
    if (cambios || guardando) { event.preventDefault(); event.returnValue = ""; }
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
    if (guardando) { avisar("Espera a que termine el guardado antes de cerrar."); return; }
    if (cambios && !window.confirm("Tienes cambios sin guardar. ¿Deseas descartarlos y cerrar la atención médica?")) return;
    // Una respuesta GET tardía no debe modificar un formulario cerrado o recién abierto.
    versionCarga++;
    cargando = false; cargado = false; cambios = false; persistido = false;
    conflicto = false; bloqueado = false; reciente = null; revision = null;
    nombres.forEach(nombre => { campos[nombre].value = ""; campos[nombre].setCustomValidity(""); campos[nombre].removeAttribute("aria-invalid"); });
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
