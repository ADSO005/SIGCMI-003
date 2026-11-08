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
    this.classList = { add: (...names) => names.forEach(x => classes.add(x)), remove: x => classes.delete(x), contains: x => classes.has(x) };
  }
  appendChild(node) { this.children.push(node); }
  replaceChildren() { this.children = []; }
  setAttribute(key, value) { this.attrs[key] = value; }
  focus() { this.focused = true; }
  set innerHTML(value) { throw Error("No se permite interpretar HTML: " + value); }
}
function fixture(fetch, now = "2026-11-09T17:00:00Z") {
  const modal = new Element(), status = new Element(), list = new Element();
  const elements = { modalHorarios: modal, estadoCargaHorarios: status, listaHorariosMedico: list };
  for (const id of ["diasSemanaHorario", "rangoSemanaHorario", "semanaAnteriorHorario", "semanaSiguienteHorario", "cerrarAgendaSemanal"]) elements[id] = new Element();
  const trigger = new Element("button");
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
  }
  const c = {
    AbortController, Date: FixedDate, window: {}, fetch,
    document: { activeElement: trigger, getElementById: id => elements[id], createElement: tag => new Element(tag) }
  };
  vm.createContext(c);
  const source = fs.readFileSync("public/medico/js/dashboardMedical.js", "utf8");
  vm.runInContext(source.slice(source.indexOf("// MODAL HORARIO"), source.indexOf("// SELECCIONAR PACIENTE")), c);
  return { api: c.window, modal, status, list, elements, trigger };
}
const horario = { id_horario: 1, dia_semana: "Lunes", hora_inicio: "08:00:00", hora_fin: "12:00:00", fecha_inicio: "2026-11-01", fecha_fin: "2026-11-30", estado: "Aprobado" };
const slots = f => f.list.children.flatMap(group => group.children.slice(1));
const dates = f => f.list.children.map(group => group.attrs["data-date"]);
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
  assert.equal(slots(f).length, 3);
  assert(slots(f).every(node => node.children[0].textContent === "08:00–12:00"));
  assert.deepEqual(slots(f).map(node => node.children[1].textContent).sort(), ["Aprobado", "Pendiente", "Rechazado"]);
  assert.match(f.status.textContent, /Solo lectura/);
  f.api.cerrarModalHorarios();
  await f.api.abrirModalHorarios();
  assert.deepEqual(calls, ["GET", "GET"]);
  const html = pug.renderFile("views/viewsMedico/includes/modalHorarios.pug");
  assert.doesNotMatch(html, /<input|<select|<form|guardarHorarios|agregarHora|toggleDia/);
  assert.equal((html.match(/<button/g) || []).length, 3);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-label="Semana anterior"/);
  assert.match(html, /bg-white text-slate-800/);
});

test("sin asignaciones muestra el estado vacío y al cerrar limpia el modal", async () => {
  const f = fixture(async () => response({ horarios: [] }));
  await f.api.abrirModalHorarios();
  assert.match(f.status.textContent, /No tienes horarios asignados/);
  assert.equal(f.status.attrs.role, "status");
  f.api.cerrarModalHorarios();
  assert(!f.modal.classList.contains("abierto"));
  assert.equal(f.status.textContent, "");
  assert(f.trigger.focused);
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
    { ...horario, id_horario: 2, estado: "<script>" }, horario,
    { ...horario, id_horario: 2, fecha_inicio: "2026-02-30" },
    { ...horario, id_horario: 2, fecha_fin: "2026-10-01" },
    { ...horario, id_horario: 2, fecha_inicio: null }
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

test("semana de lunes a domingo con tres días asignados y día actual accesible", async () => {
  const rows = [horario, { ...horario, id_horario: 2, dia_semana: "Miercoles" },
    { ...horario, id_horario: 3, dia_semana: "Viernes", hora_inicio: "14:00:00", hora_fin: "18:00:00" }];
  const f = fixture(async () => response({ horarios: rows }));
  await f.api.abrirModalHorarios();
  assert.deepEqual(dates(f), ["2026-11-09", "2026-11-11", "2026-11-13"]);
  const cells = f.elements.diasSemanaHorario.children;
  assert.equal(cells.length, 7);
  assert.equal(cells[0].attrs["aria-current"], "date");
  assert.equal(cells[6].attrs["data-date"], "2026-11-15");
  assert.equal(cells.filter(cell => cell.attrs["aria-label"].includes("con horarios aprobados")).length, 3);
});

test("navegación a asignaciones futuras y semana vacía no reutiliza datos previos", async () => {
  let calls = 0;
  const f = fixture(async () => { calls++; return response({ horarios: [{ ...horario, fecha_inicio: "2026-11-16", fecha_fin: "2026-11-22" }] }); });
  await f.api.abrirModalHorarios();
  assert.match(f.status.textContent, /Esta semana no tiene/);
  f.api.cambiarSemanaHorarios(1);
  assert.deepEqual(dates(f), ["2026-11-16"]);
  f.api.cambiarSemanaHorarios(-1);
  assert.equal(slots(f).length, 0);
  assert.match(f.status.textContent, /Esta semana no tiene/);
  assert.equal(calls, 1);
});

test("vigencia inclusiva empieza y termina a mitad de semana", async () => {
  const rows = ["Lunes", "Miercoles", "Viernes", "Domingo"].map((dia_semana, i) => ({ ...horario, id_horario: i + 1, dia_semana, fecha_inicio: "2026-11-11", fecha_fin: "2026-11-13" }));
  const f = fixture(async () => response({ horarios: rows }));
  await f.api.abrirModalHorarios();
  assert.deepEqual(dates(f), ["2026-11-11", "2026-11-13"]);
  f.api.cambiarSemanaHorarios(-1);
  assert.equal(slots(f).length, 0);
  assert(f.elements.diasSemanaHorario.children.every(cell => !cell.attrs["aria-label"].includes("con horarios aprobados")));
});

test("asignación mensual atraviesa semanas y termina sin inventar disponibilidad", async () => {
  const f = fixture(async () => response({ horarios: [horario] }));
  await f.api.abrirModalHorarios();
  assert.deepEqual(dates(f), ["2026-11-09"]);
  f.api.cambiarSemanaHorarios(1);
  assert.deepEqual(dates(f), ["2026-11-16"]);
  f.api.cambiarSemanaHorarios(1);
  f.api.cambiarSemanaHorarios(1);
  assert.deepEqual(dates(f), ["2026-11-30"]);
  f.api.cambiarSemanaHorarios(1);
  assert.equal(slots(f).length, 0);
});

test("franjas independientes se ordenan y coexisten períodos distintos en la misma semana", async () => {
  const f = fixture(async () => response({ horarios: [
    { ...horario, id_horario: 2, hora_inicio: "14:00:00", hora_fin: "18:00:00", fecha_inicio: "2026-11-09", fecha_fin: "2026-11-09" },
    horario,
    { ...horario, id_horario: 3, dia_semana: "Viernes", fecha_inicio: "2026-11-13", fecha_fin: "2026-11-20" }
  ] }));
  await f.api.abrirModalHorarios();
  assert.equal(slots(f).length, 3);
  assert.deepEqual(f.list.children[0].children.slice(1).map(slot => slot.children[0].textContent), ["08:00–12:00", "14:00–18:00"]);
  assert.match(slots(f)[1].children[2].textContent, /9 de noviembre de 2026/);
});

test("Bogotá y el cambio de año no desplazan fechas DATEONLY", async () => {
  // En UTC ya es lunes; en Bogotá todavía es domingo 8.
  const sunday = fixture(async () => response({ horarios: [horario] }), "2026-11-09T02:00:00Z");
  await sunday.api.abrirModalHorarios();
  assert.equal(sunday.elements.diasSemanaHorario.children[0].attrs["data-date"], "2026-11-02");
  assert.equal(sunday.elements.diasSemanaHorario.children[6].attrs["aria-current"], "date");
  const year = fixture(async () => response({ horarios: [{ ...horario, dia_semana: "Viernes", fecha_inicio: "2027-01-01", fecha_fin: "2027-01-01" }] }), "2027-01-01T17:00:00Z");
  await year.api.abrirModalHorarios();
  assert.equal(year.elements.diasSemanaHorario.children[0].attrs["data-date"], "2026-12-28");
  assert.deepEqual(dates(year), ["2027-01-01"]);
  year.api.cambiarSemanaHorarios(1);
  assert.equal(year.elements.diasSemanaHorario.children[0].attrs["data-date"], "2027-01-04");
});

test("pendientes y rechazados se informan sin marcar disponibilidad aprobada", async () => {
  const f = fixture(async () => response({ horarios: [{ ...horario, estado: "Rechazado" }] }));
  await f.api.abrirModalHorarios();
  assert.match(f.elements.diasSemanaHorario.children[0].attrs["aria-label"], /asignaciones sin aprobar/);
  assert.equal(slots(f)[0].children[1].textContent, "Rechazado");
});
