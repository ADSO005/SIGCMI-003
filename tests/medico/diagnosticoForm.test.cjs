const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const pug = require("pug");
const nombres = ["diagnostico", "sintomas", "tratamiento", "notas_adicionales", "temperatura", "altura", "peso", "frecuencia_cardiaca", "presion_arterial"];
const hash = "a".repeat(64), nuevoHash = "b".repeat(64);
const registro = extra => ({ cita_id: 20, id_diagnostico: 80, ...Object.fromEntries(nombres.map(nombre => [nombre, null])), diagnostico: "Registro existente", ...extra });
const response = (data = { diagnostico: null, revision: null }, status = 200, extra = {}) => ({
    status, ok: status >= 200 && status < 300, redirected: false,
    headers: { get: () => "application/json" }, json: async () => data, ...extra
});
class Element {
    constructor(id = "") { this.id = id; this.value = ""; this.dataset = {}; this.attrs = {}; this.hidden = false; this.disabled = false; this.listeners = {}; this.children = []; }
    setAttribute(key, value) { this.attrs[key] = value; }
    removeAttribute(key) { delete this.attrs[key]; }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    appendChild(node) { this.children.push(node); }
    replaceChildren() { this.children = []; }
    setCustomValidity(value) { this.validationMessage = value; }
    reportValidity() { this.reported = true; return !this.validationMessage; }
    focus() { this.focused = true; }
    showModal() { this.open = true; }
    close() { this.open = false; }
    matches() { return this.disabled; }
    getClientRects() { return [{}]; }
    set innerHTML(value) { throw Error("HTML no permitido: " + value); }
}
function fixture(fetch) {
    const ids = ["formDiagnostico", "camposDiagnostico", "guardarDiagnostico", "finalizarConsulta", "mensajeDiagnostico", "reintentarDiagnostico",
        "consultarVersionDiagnostico", "versionRecienteDiagnostico", "detalleVersionDiagnostico", "ocultarVersionDiagnostico", "cargarVersionDiagnostico",
        "modalAtencion", "cerrarAtencionSuperior", "cerrarAtencion", "estadoGuardadoDiagnostico", "cuerpoAtencion"];
    const elements = Object.fromEntries(ids.map(id => [id, new Element(id)]));
    const campos = Object.fromEntries(nombres.map(nombre => [nombre, Object.assign(new Element(nombre), { dataset: { label: nombre } })]));
    const form = elements.formDiagnostico;
    form.dataset.cita = "20"; form.dataset.estadoCompletada = "333";
    elements.finalizarConsulta.dataset.estadoId = "333";
    form.elements = { namedItem: name => campos[name] };
    const events = {}, calls = [];
    const trigger = new Element("continuarConsulta");
    const document = { activeElement: trigger, body: { style: { overflow: "auto" } }, querySelector: () => trigger,
        listeners: {}, addEventListener(name, callback) { this.listeners[name] = callback; },
        getElementById: id => elements[id], createElement: tag => new Element(tag) };
    for (const node of [...Object.values(elements), ...Object.values(campos), trigger]) {
        node.focus = () => { node.focused = true; document.activeElement = node; };
    }
    elements.modalAtencion.querySelectorAll = () => [elements.cerrarAtencionSuperior, elements.cerrarAtencion, elements.guardarDiagnostico, elements.finalizarConsulta];
    elements.modalAtencion.contains = node => Object.values(elements).includes(node) || Object.values(campos).includes(node);
    let confirmacion = true;
    const navigations = [];
    const context = { TextEncoder, TypeError, SyntaxError,
        window: { addEventListener: (name, cb) => { events[name] = cb; }, confirm: () => confirmacion,
            location: { assign: url => navigations.push(url) } },
        document,
        fetch: async (...args) => { calls.push(args); return fetch(...args); }
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync("public/medico/js/diagnosticoMedical.js", "utf8"), context);
    return { elements, campos, calls, events, document, trigger, api: context.window, navigations,
        ready: () => new Promise(resolve => setImmediate(resolve)),
        submit: () => form.listeners.submit({ preventDefault() {} }),
        click: id => elements[id].listeners.click(),
        edit: (nombre, value) => { campos[nombre].value = value; form.listeners.input({ target: campos[nombre] }); },
        confirm: value => { confirmacion = value; }
    };
}

test("Pug presenta modal independiente, campos etiquetados, unidades y diagnóstico obligatorio", () => {
    const html = pug.renderFile("views/viewsMedico/includes/modalAtencion.pug", { contextoConsulta: { id_cita: 20, paciente: "Paciente", fecha: "2026-11-09", hora: "09:00:00", motivo: "Control" }, estadoCompletadaId: 333 });
    for (const nombre of nombres) {
        assert(html.includes(`name="${nombre}"`));
        assert(html.includes(`for="diagnostico-${nombre}"`));
    }
    assert.match(html, /°C|Altura \(m\)|Peso \(kg\)|lpm/);
    assert.match(html, /name="diagnostico"[^>]*required/);
    assert.match(html, /id="camposDiagnostico"[^>]*disabled/);
    assert.match(html, /Guardar borrador/);
    assert.match(html, /Finalizar consulta/);
    assert.match(html, /data-estado-id="333"/);
    assert.match(html, /<dialog[^>]*id="modalAtencion"/);
    assert.match(html, /aria-modal="true"/);
    assert.match(html, /form="formDiagnostico"/);
    assert.match(html, /max-w-\[960px\]/);
    assert.match(html, /flex-wrap/);
    assert.doesNotMatch(html, /Prescrip|innerHTML/);
});

test("carga inicial sin registro habilita formulario vacío con revisión null", async () => {
    const f = fixture(async (url, options) => {
        assert.equal(url, "/medico/citas/20/diagnostico");
        assert.equal(options.cache, "no-store");
        return response();
    });
    assert(f.elements.camposDiagnostico.disabled);
    await f.ready();
    assert(nombres.every(nombre => f.campos[nombre].value === ""));
    assert.equal(f.elements.guardarDiagnostico.disabled, false);
    assert.match(f.elements.mensajeDiagnostico.textContent, /Todavía no hay borrador/);
    assert.equal(f.elements.estadoGuardadoDiagnostico.textContent, "Sin borrador guardado");
    assert.equal(f.elements.finalizarConsulta.disabled, true);
});

test("recupera todos los campos, guarda todos los opcionales y actualiza la revisión al editar", async () => {
    const datos = registro({ sintomas: "Síntomas", tratamiento: "Tratamiento", notas_adicionales: "Notas", temperatura: "37.0", altura: "1.70", peso: "70.50", frecuencia_cardiaca: 80, presion_arterial: "120/80" });
    let writes = 0;
    const f = fixture(async (url, options) => {
        if (!options.method) return response({ diagnostico: datos, revision: hash });
        const body = JSON.parse(options.body);
        assert.equal(options.method, "PUT");
        assert.deepEqual(Object.keys(body).sort(), ["revision", ...nombres].sort());
        assert.equal(body.revision, writes++ ? nuevoHash : hash);
        for (const nombre of nombres.filter(nombre => nombre !== "diagnostico")) assert.equal(String(body[nombre]), String(datos[nombre]));
        return response({ diagnostico: { ...datos, diagnostico: body.diagnostico }, revision: nuevoHash });
    });
    await f.ready();
    for (const nombre of nombres) assert.equal(String(f.campos[nombre].value), String(datos[nombre]));
    f.edit("diagnostico", "Diagnóstico corregido");
    await f.submit();
    assert.equal(f.elements.mensajeDiagnostico.textContent, "Borrador guardado. Puedes continuar la atención");
    f.edit("diagnostico", "Segunda edición");
    await f.submit();
    assert.equal(writes, 2);
});

test("creación envía revisión null y opcionales vacíos explícitos; diagnóstico vacío no se envía", async () => {
    const f = fixture(async (url, options) => {
        if (!options.method) return response();
        const body = JSON.parse(options.body);
        assert.equal(body.revision, null);
        assert(nombres.filter(nombre => nombre !== "diagnostico").every(nombre => body[nombre] === null));
        return response({ diagnostico: registro({ diagnostico: body.diagnostico }), revision: hash }, 201);
    });
    await f.ready();
    f.edit("diagnostico", "   ");
    await f.submit();
    assert.equal(f.calls.length, 1);
    assert.equal(f.campos.diagnostico.attrs["aria-invalid"], "true");
    f.edit("diagnostico", "Registro nuevo");
    await f.submit();
    assert.equal(f.calls.length, 2);
});

test("valida capacidad DECIMAL, TEXT UTF-8, entero y formato de presión sin enviar valores inválidos", async () => {
    const f = fixture(async () => response());
    await f.ready();
    f.edit("diagnostico", "Registro");
    for (const [nombre, value] of [["temperatura", "1000.1"], ["altura", "1.701"], ["peso", "1000"], ["frecuencia_cardiaca", "2147483648"], ["presion_arterial", "120-80"], ["notas_adicionales", "😀".repeat(16384)]]) {
        f.edit(nombre, value);
        await f.submit();
        assert.equal(f.calls.length, 1);
        assert.equal(f.campos[nombre].attrs["aria-invalid"], "true");
        f.edit(nombre, "");
    }
});

test("no duplica envíos y bloquea campos durante el guardado", async () => {
    let resolve;
    const f = fixture(async (url, options) => !options.method ? response() : new Promise(done => { resolve = done; }));
    await f.ready();
    f.edit("diagnostico", "Registro");
    const saving = f.submit();
    assert.equal(f.elements.guardarDiagnostico.disabled, true);
    assert.equal(f.elements.camposDiagnostico.disabled, true);
    await f.submit();
    assert.equal(f.calls.length, 2);
    resolve(response({ diagnostico: registro(), revision: hash }, 201));
    await saving;
    assert.equal(f.elements.camposDiagnostico.disabled, false);
});

test("409 conserva cambios y revisión; consultar versión reciente nunca reemplaza el formulario automáticamente", async () => {
    let reads = 0, writes = 0;
    const f = fixture(async (url, options) => {
        if (!options.method) return response({ diagnostico: registro({ diagnostico: reads++ ? "Cambio de otra pestaña" : "Original" }), revision: reads > 1 ? nuevoHash : hash });
        writes++;
        const payload = JSON.parse(options.body);
        assert.equal(payload.revision, writes === 1 ? hash : nuevoHash);
        return writes === 1 ? response({ mensaje: "El diagnóstico cambió desde tu lectura" }, 409)
            : response({ diagnostico: registro({ diagnostico: payload.diagnostico }), revision: "c".repeat(64) });
    });
    await f.ready();
    f.edit("diagnostico", "Mis cambios locales");
    await f.submit();
    assert.equal(f.campos.diagnostico.value, "Mis cambios locales");
    assert.match(f.elements.mensajeDiagnostico.textContent, /otra sesión o pestaña/);
    assert.equal(f.elements.guardarDiagnostico.disabled, true);
    await f.click("consultarVersionDiagnostico");
    assert.equal(f.campos.diagnostico.value, "Mis cambios locales");
    assert.equal(f.elements.versionRecienteDiagnostico.hidden, false);
    await f.submit();
    assert.equal(writes, 1);
    f.click("ocultarVersionDiagnostico");
    assert.equal(f.campos.diagnostico.value, "Mis cambios locales");
    f.confirm(false); f.click("cargarVersionDiagnostico");
    assert.equal(f.campos.diagnostico.value, "Mis cambios locales");
    f.confirm(true); f.click("cargarVersionDiagnostico");
    assert.equal(f.campos.diagnostico.value, "Cambio de otra pestaña");
    assert.equal(f.elements.guardarDiagnostico.disabled, false);
    f.edit("diagnostico", "Edición revisada");
    await f.submit();
    assert.equal(writes, 2);
});

test("errores HTTP, sesión, validación y red conservan los datos escritos", async () => {
    for (const error of [
        async () => response({ mensaje: "Revisa el diagnóstico" }, 400),
        async () => response({ mensaje: "Fallo interno" }, 500),
        async () => response({}, 401), async () => response({}, 403), async () => response({}, 404),
        async () => response({}, 200, { redirected: true }),
        async () => response({}, 413),
        async () => { throw new TypeError("Sin conexión"); },
        async () => response({}, 200, { json: async () => { throw new SyntaxError("JSON inválido"); } }),
        async () => response({}, 200, { headers: { get: () => "text/html" } })
    ]) {
        const f = fixture(async (url, options) => !options.method ? response({ diagnostico: registro(), revision: hash }) : error());
        await f.ready();
        f.edit("diagnostico", "Mi texto no debe perderse");
        f.edit("notas_adicionales", "Nota local");
        await f.submit();
        assert.equal(f.campos.diagnostico.value, "Mi texto no debe perderse");
        assert.equal(f.campos.notas_adicionales.value, "Nota local");
        assert.equal(f.elements.mensajeDiagnostico.attrs.role, "alert");
        assert.equal(f.elements.consultarVersionDiagnostico.hidden, false);
    }
});

test("carga fallida permite reintentar y un estado no editable bloquea el formulario sin borrar cambios", async () => {
    let calls = 0;
    const f = fixture(async () => ++calls === 1 ? response({}, 500) : response());
    await f.ready();
    assert.equal(f.elements.guardarDiagnostico.disabled, true);
    assert.equal(f.elements.reintentarDiagnostico.hidden, false);
    assert.equal(f.elements.estadoGuardadoDiagnostico.textContent, "Borrador no disponible");
    await f.click("reintentarDiagnostico");
    assert.equal(f.elements.guardarDiagnostico.disabled, false);
    let reads = 0;
    const denied = fixture(async (url, options) => options.method || reads++ ? response({ mensaje: "Solo puedes editar En Curso" }, 409)
        : response({ diagnostico: registro(), revision: hash }));
    await denied.ready();
    denied.edit("diagnostico", "Datos que deben conservarse tras cambio de estado");
    await denied.submit();
    await denied.click("consultarVersionDiagnostico");
    assert.equal(denied.elements.camposDiagnostico.disabled, true);
    assert.equal(denied.elements.estadoGuardadoDiagnostico.textContent, "Consulta no editable");
    assert.equal(denied.campos.diagnostico.value, "Datos que deben conservarse tras cambio de estado");
});

test("HTML clínico se asigna a value y textContent; aviso de salida protege cambios no guardados", async () => {
    const payload = '<img src=x onerror="alert(1)">';
    let requests = 0;
    const f = fixture(async () => response({ diagnostico: registro({ diagnostico: payload }), revision: ++requests === 1 ? hash : nuevoHash }));
    await f.ready();
    assert.equal(f.campos.diagnostico.value, payload);
    f.edit("diagnostico", "Cambio local");
    await f.click("consultarVersionDiagnostico");
    assert.equal(f.elements.detalleVersionDiagnostico.children[0].children[1].textContent, payload);
    assert.equal(f.campos.diagnostico.value, "Cambio local");
    let prevented = false;
    f.events.beforeunload({ preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
});

test("modal abre, restaura foco y scroll al cerrar y vuelve a consultar al reabrir", async () => {
    const f = fixture(async () => response({ diagnostico: registro(), revision: hash }));
    await f.ready();
    assert.equal(f.elements.modalAtencion.open, true);
    assert.equal(f.document.body.style.overflow, "hidden");
    assert.equal(f.elements.cerrarAtencionSuperior.focused, true);
    assert.equal(f.elements.estadoGuardadoDiagnostico.textContent, "Borrador guardado");
    f.elements.finalizarConsulta.focus();
    f.document.listeners.keydown({ key: "Tab", shiftKey: false, preventDefault() {} });
    assert.equal(f.document.activeElement, f.elements.cerrarAtencionSuperior);
    f.document.listeners.keydown({ key: "Tab", shiftKey: true, preventDefault() {} });
    assert.equal(f.document.activeElement, f.elements.finalizarConsulta);
    f.edit("diagnostico", "Cambio temporal");
    f.edit("diagnostico", "Registro existente");
    f.confirm(false);
    f.click("cerrarAtencion");
    assert.equal(f.elements.modalAtencion.open, false);
    assert.equal(f.document.body.style.overflow, "auto");
    assert.equal(f.trigger.focused, true);
    f.api.abrirAtencion({ preventDefault() {}, currentTarget: f.trigger });
    await f.ready();
    assert.equal(f.elements.modalAtencion.open, true);
    assert.equal(f.calls.length, 2);
});

test("guardar crea o edita un borrador sin PATCH y permite finalizar usando el ID dinámico", async () => {
    let guardado = false;
    const f = fixture(async (url, options) => {
        if (options.method === "PATCH") {
            assert.equal(url, "/medico/citas/20/estado");
            assert.deepEqual(JSON.parse(options.body), { estado_id: 333 });
            return response({ id_cita: 20, estado_id: 333 });
        }
        if (options.method === "PUT") {
            guardado = true;
            return response({ diagnostico: registro({ diagnostico: JSON.parse(options.body).diagnostico }), revision: nuevoHash }, 201);
        }
        return response();
    });
    await f.ready();
    f.edit("diagnostico", "Borrador clínico");
    assert.equal(f.elements.finalizarConsulta.disabled, true);
    await f.submit();
    assert.equal(guardado, true);
    assert.equal(f.calls.filter(([, options]) => options.method === "PATCH").length, 0);
    assert.equal(f.elements.mensajeDiagnostico.textContent, "Borrador guardado. Puedes continuar la atención");
    assert.equal(f.elements.estadoGuardadoDiagnostico.textContent, "Borrador guardado");
    assert.equal(f.elements.finalizarConsulta.disabled, false);
    await f.click("finalizarConsulta");
    await f.ready();
    assert.deepEqual(f.navigations, ["/medico/dashboard?citaFinalizada=20#agendaView"]);
});

test("finalizar exige un borrador sin cambios pendientes y confirma antes de enviar", async () => {
    const f = fixture(async () => response({ diagnostico: registro(), revision: hash }));
    await f.ready();
    f.edit("sintomas", "Dato conservado");
    assert.equal(f.elements.finalizarConsulta.disabled, true);
    await f.click("finalizarConsulta");
    assert.equal(f.calls.length, 1);
    f.edit("sintomas", "");
    f.confirm(false);
    await f.click("finalizarConsulta");
    assert.equal(f.calls.length, 1);
    assert.deepEqual(f.navigations, []);
});

test("una solicitud de finalización deshabilita guardar y evita transiciones simultáneas", async () => {
    let completar;
    const f = fixture(async (url, options) => !options.method
        ? response({ diagnostico: registro(), revision: hash })
        : new Promise(resolve => { completar = resolve; }));
    await f.ready();
    const pendiente = f.click("finalizarConsulta");
    assert.equal(f.elements.finalizarConsulta.disabled, true);
    assert.equal(f.elements.guardarDiagnostico.disabled, true);
    await f.submit();
    assert.equal(f.calls.length, 2);
    completar(response({ id_cita: 20, estado_id: 333 }));
    await pendiente;
    assert.equal(f.calls.length, 2);
});

test("conflicto al finalizar conserva el borrador y bloquea edición", async () => {
    const f = fixture(async (url, options) => !options.method
        ? response({ diagnostico: registro(), revision: hash })
        : response({ mensaje: "La cita cambió de estado" }, 409));
    await f.ready();
    await f.click("finalizarConsulta");
    await f.ready();
    assert.equal(f.elements.mensajeDiagnostico.textContent, "La cita cambió de estado");
    assert.equal(f.elements.camposDiagnostico.disabled, true);
    assert.equal(f.campos.diagnostico.value, "Registro existente");
    assert.deepEqual(f.navigations, []);
});

test("botones y Escape solicitan confirmación antes de descartar cambios", async () => {
    const f = fixture(async () => response());
    await f.ready();
    f.edit("diagnostico", "Cambios pendientes");
    assert.equal(f.elements.estadoGuardadoDiagnostico.textContent, "Cambios sin guardar");
    f.confirm(false);
    f.click("cerrarAtencionSuperior");
    assert.equal(f.elements.modalAtencion.open, true);
    let prevented = false;
    f.elements.modalAtencion.listeners.cancel({ preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(f.elements.modalAtencion.open, true);
    assert.equal(f.campos.diagnostico.value, "Cambios pendientes");
    f.confirm(true);
    f.elements.modalAtencion.listeners.cancel({ preventDefault() {} });
    assert.equal(f.elements.modalAtencion.open, false);
    assert.equal(f.campos.diagnostico.value, "");
});

test("no se cierra durante PUT y una carga tardía no modifica un modal cerrado", async () => {
    let terminar;
    const f = fixture(async (url, options) => !options.method ? response() : new Promise(resolve => { terminar = resolve; }));
    await f.ready();
    f.edit("diagnostico", "Registro");
    const saving = f.submit();
    f.document.listeners.keydown({ key: "Escape", preventDefault() {}, stopPropagation() {} });
    assert.equal(f.elements.modalAtencion.open, true);
    assert.equal(f.elements.cerrarAtencion.disabled, true);
    terminar(response({ diagnostico: registro(), revision: hash }));
    await saving;
    f.click("cerrarAtencion");
    assert.equal(f.elements.modalAtencion.open, false);
    let responder;
    const slow = fixture(() => new Promise(resolve => { responder = resolve; }));
    slow.click("cerrarAtencion");
    responder(response({ diagnostico: registro(), revision: hash }));
    await slow.ready();
    assert.equal(slow.campos.diagnostico.value, "");
    assert.equal(slow.elements.camposDiagnostico.disabled, true);
});
