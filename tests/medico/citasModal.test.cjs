const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const pug = require("pug");

const render = citasAgenda => pug.renderFile("views/viewsMedico/includes/modalGestion.pug", { citasAgenda });
const cita = { fecha: "2026-11-09", hora: "08:00:00", paciente: "Luz Díaz", motivo: "Control", estado: "Confirmada" };

test("Pug muestra citas reales y solo controles de consulta, con diálogo accesible", () => {
    const html = render([cita, { ...cita, hora: "10:00:00", estado: "Completada" }]);
    assert.equal((html.match(/<article/g) || []).length, 2);
    for (const text of ["Luz Díaz", "Control", "Confirmada", "Completada", "2026-11-09", "08:00", "10:00"]) assert(html.includes(text));
    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
    assert.doesNotMatch(html, /Reprogramar|Cancelar|Guardar|iniciarConsulta|finalizarConsulta|modalReprogramar/);
    assert.match(render([]), /No tienes citas registradas/);
});

test("nombres, motivos, fechas y estados se escapan también en atributos", () => {
    const payload = '<img src=x onerror="alert(1)">';
    const html = render([{ ...cita, paciente: payload, motivo: payload, estado: payload, fecha: payload }]);
    assert(!html.includes(payload));
    assert.match(html, /&lt;img/);
    assert.doesNotMatch(html, /<script|<img/);
});

function fixture() {
    const elements = {};
    let document;
    const element = id => {
        const classes = new Set();
        const node = {
            id, value: "", hidden: false, textContent: "", dataset: {}, attrs: {},
            classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
            focus() { document.activeElement = node; },
            setAttribute(key, value) { node.attrs[key] = value; },
            set innerHTML(value) { throw Error("HTML no permitido: " + value); }
        };
        elements[id] = node;
        return node;
    };
    const trigger = element("trigger"), close = element("cerrarGestionCitas"), end = element("end");
    const modal = element("modalGestionCitas");
    modal.querySelectorAll = () => [close, end];
    document = { activeElement: trigger, body: { style: { overflow: "auto" } }, getElementById: id => elements[id] };
    const context = { window: {}, document };
    vm.createContext(context);
    const source = fs.readFileSync("public/medico/js/dashboardMedical.js", "utf8");
    vm.runInContext(source.slice(source.indexOf("// MODAL DE CONSULTA DE CITAS"), source.indexOf("// MODAL HORARIO")), context);
    return { api: context.window, elements, document, modal, trigger, close, end, element };
}

test("abrir, cerrar, fondo, Escape y Tab conservan foco y desplazamiento", () => {
    const f = fixture();
    f.api.abrirModal();
    assert(f.modal.classList.contains("abierto"));
    assert.equal(f.document.activeElement, f.close);
    assert.equal(f.document.body.style.overflow, "hidden");
    f.api.abrirModal();
    let prevented = 0;
    f.api.gestionarTecladoCitas({ key: "Tab", shiftKey: true, preventDefault() { prevented++; } });
    assert.equal(f.document.activeElement, f.end);
    f.api.gestionarTecladoCitas({ key: "Tab", shiftKey: false, preventDefault() { prevented++; } });
    assert.equal(f.document.activeElement, f.close);
    assert.equal(prevented, 2);
    f.api.cerrarModalFuera({ target: { id: "listaCitas" } });
    assert(f.modal.classList.contains("abierto"));
    f.api.gestionarTecladoCitas({ key: "Escape", preventDefault() {} });
    assert(!f.modal.classList.contains("abierto"));
    assert.equal(f.document.activeElement, f.trigger);
    assert.equal(f.document.body.style.overflow, "auto");
    f.api.abrirModal();
    f.api.cerrarModalFuera({ target: f.modal });
    assert(!f.modal.classList.contains("abierto"));
    f.api.abrirModal();
    f.api.cerrarModal();
    assert.equal(f.document.activeElement, f.trigger);
});
