const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const pug = require("pug");

// Adaptación de las pruebas de feature/MedicalConexion al modal de develop.
class Element {
  constructor(tag = "div") {
    this.tagName = tag;
    this.children = [];
    this.attrs = {};
    const classes = new Set();
    this.classList = { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) };
  }
  appendChild(node) { this.children.push(node); }
  replaceChildren() { this.children = []; }
  setAttribute(key, value) { this.attrs[key] = value; }
  set innerHTML(value) { throw Error("No se permite interpretar HTML: " + value); }
}
function fixture(fetch) {
  const modal = new Element(), status = new Element(), list = new Element();
  const elements = { modalHorarios: modal, estadoCargaHorarios: status, listaHorariosMedico: list };
  const c = {
    AbortController, window: {}, fetch,
    document: { getElementById: id => elements[id], createElement: tag => new Element(tag) }
  };
  vm.createContext(c);
  const source = fs.readFileSync("public/medico/js/dashboardMedical.js", "utf8");
  vm.runInContext(source.slice(source.indexOf("// MODAL HORARIO"), source.indexOf("// SELECCIONAR PACIENTE")), c);
  return { api: c.window, modal, status, list };
}
const horario = { id_horario: 1, dia_semana: "Lunes", hora_inicio: "08:00:00", hora_fin: "12:00:00", estado: "Aprobado" };
const response = (data, status = 200) => ({
  ok: status === 200, status, redirected: false,
  headers: { get: () => "application/json" }, json: async () => data
});

test("todos los estados se representan como texto y solo se realizan lecturas", async () => {
  const calls = [];
  const f = fixture(async (url, options) => {
    assert.equal(url, "/medico/horarios");
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.cache, "no-store");
    calls.push(options.method || "GET");
    return response({ horarios: ["Pendiente", "Aprobado", "Rechazado"].map((estado, i) => ({ ...horario, id_horario: i + 1, estado })) });
  });
  await f.api.abrirModalHorarios();
  assert.equal(f.list.children.length, 3);
  assert(f.list.children.every(node => node.tagName === "p" && node.textContent.includes("08:00:00 a 12:00:00")));
  assert.match(f.status.textContent, /Solo lectura/);
  f.api.cerrarModalHorarios();
  await f.api.abrirModalHorarios();
  assert.deepEqual(calls, ["GET", "GET"]);
  const html = pug.renderFile("views/viewsMedico/includes/modalHorarios.pug");
  assert.doesNotMatch(html, /<input|<select|<form|guardarHorarios|agregarHora|toggleDia/);
  assert.equal((html.match(/<button/g) || []).length, 1);
});

test("sin asignaciones muestra el estado vacío y al cerrar limpia el modal", async () => {
  const f = fixture(async () => response({ horarios: [] }));
  await f.api.abrirModalHorarios();
  assert.match(f.status.textContent, /No tienes horarios asignados/);
  assert.equal(f.status.attrs.role, "status");
  f.api.cerrarModalHorarios();
  assert(!f.modal.classList.contains("abierto"));
  assert.equal(f.status.textContent, "");
});

test("errores HTTP, sesión, red y JSON limpian datos y muestran alerta", async () => {
  const fallos = [
    ...[401, 403, 404, 500].map(status => async () => response({}, status)),
    async () => ({ ...response({}), redirected: true }),
    async () => ({ ...response({}), headers: { get: () => "text/html" } }),
    async () => { throw Error("Sin red"); },
    async () => ({ ...response({}), json: async () => JSON.parse("{") })
  ];
  for (const fallo of fallos) {
    let fetch = async () => response({ horarios: [horario] });
    const f = fixture((...args) => fetch(...args));
    await f.api.abrirModalHorarios();
    assert.equal(f.list.children.length, 1);
    fetch = fallo;
    await f.api.abrirModalHorarios();
    assert.equal(f.list.children.length, 0);
    assert.equal(f.status.attrs.role, "alert");
    assert(f.status.textContent);
  }
});

test("una respuesta inválida completa se rechaza antes de representar franjas", async () => {
  for (const data of [null, {}, { horarios: {} }, ...[
    { ...horario, id_horario: 0 }, { ...horario, id_horario: 2, dia_semana: "<img onerror=alert(1)>" },
    { ...horario, id_horario: 2, hora_inicio: "25:00" }, { ...horario, id_horario: 2, hora_fin: "07:00" },
    { ...horario, id_horario: 2, estado: "<script>" }, horario
  ].map(invalido => ({ horarios: [horario, invalido] }))]) {
    const f = fixture(async () => response(data));
    await f.api.abrirModalHorarios();
    assert.equal(f.list.children.length, 0);
    assert.equal(f.status.attrs.role, "alert");
  }
});

test("cerrar durante fetch aborta e impide representar respuestas tardías", async () => {
  let done, signal;
  const f = fixture((url, options) => { signal = options.signal; return new Promise(resolve => { done = resolve; }); });
  const pending = f.api.abrirModalHorarios();
  f.api.cerrarModalHorarios();
  assert(signal.aborted);
  done(response({ horarios: [horario] }));
  await pending;
  assert.equal(f.list.children.length, 0);
  assert.equal(f.status.textContent, "");
});

test("reabrir durante json mantiene solo la respuesta más reciente", async () => {
  let done, started;
  const parsing = new Promise(resolve => { started = resolve; });
  let calls = 0;
  const f = fixture(async () => ++calls === 1
    ? { ...response({}), json: () => { started(); return new Promise(resolve => { done = resolve; }); } }
    : response({ horarios: [] }));
  const pending = f.api.abrirModalHorarios();
  await parsing;
  await f.api.abrirModalHorarios();
  done({ horarios: [horario] });
  await pending;
  assert.equal(f.list.children.length, 0);
  assert.match(f.status.textContent, /No tienes horarios asignados/);
});
