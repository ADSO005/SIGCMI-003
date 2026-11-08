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
            id, value: "", hidden: false, textContent: "", dataset: {}, attrs: {}, validity: { valid: true },
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
    for (const id of ["fechaFiltroCitas", "estadoFiltroCitas", "estadoListaCitas", "modalSubtitulo"]) element(id);
    const cards = [
        { dataset: { fecha: "2026-11-09", estado: "Pendiente" } },
        { dataset: { fecha: "2026-11-10", estado: "Confirmada" } },
        { dataset: { fecha: "2026-11-09", estado: "Confirmada" } },
        { dataset: { fecha: "2026-11-09", estado: "En Curso" } },
        { dataset: { fecha: "2026-11-09", estado: "Completada" } },
        { dataset: { fecha: "2026-11-09", estado: "Cancelada" } }
    ];
    element("listaCitas").querySelectorAll = () => cards;
    document = { activeElement: trigger, body: { style: { overflow: "auto" } }, getElementById: id => elements[id] };
    const context = { window: {}, document };
    vm.createContext(context);
    const source = fs.readFileSync("public/medico/js/dashboardMedical.js", "utf8");
    vm.runInContext(source.slice(source.indexOf("// MODAL DE CONSULTA DE CITAS"), source.indexOf("// MODAL HORARIO")), context);
    return { api: context.window, elements, document, modal, trigger, close, end, element, cards };
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

test("filtros por fecha y nombre real de estado se combinan y Todas las citas los limpia", () => {
    const f = fixture();
    f.api.abrirModal();
    assert(f.cards.every(card => !card.hidden));
    f.elements.fechaFiltroCitas.value = "2026-11-10";
    f.api.filtrarCitas();
    assert.deepEqual(f.cards.filter(card => !card.hidden).map(card => card.dataset.estado), ["Confirmada"]);
    f.elements.fechaFiltroCitas.value = "";
    for (const state of ["Pendiente", "Confirmada", "En Curso", "Completada", "Cancelada"]) {
        f.elements.estadoFiltroCitas.value = state;
        f.api.filtrarCitas();
        assert(f.cards.filter(card => !card.hidden).every(card => card.dataset.estado === state));
        assert.equal(f.cards.filter(card => !card.hidden).length, state === "Confirmada" ? 2 : 1);
    }
    f.elements.estadoFiltroCitas.value = "Confirmada";
    f.elements.fechaFiltroCitas.value = "2026-11-09";
    f.api.filtrarCitas();
    assert.equal(f.cards.filter(card => !card.hidden).length, 1);
    assert.equal(f.elements.modalSubtitulo.textContent, "Citas: 1 de 6");
    f.api.limpiarFiltrosCitas();
    assert.equal(f.elements.fechaFiltroCitas.value, "");
    assert.equal(f.elements.estadoFiltroCitas.value, "");
    assert(f.cards.every(card => !card.hidden));
    assert.equal(f.elements.modalSubtitulo.textContent, "Citas: 6 de 6");
});

test("ausencia de citas y filtros sin resultados muestran mensajes distintos", () => {
    const f = fixture();
    f.elements.fechaFiltroCitas.value = "2027-01-01";
    f.api.filtrarCitas();
    assert(f.cards.every(card => card.hidden));
    assert.equal(f.elements.estadoListaCitas.hidden, false);
    assert.equal(f.elements.estadoListaCitas.textContent, "No se encontraron citas con los filtros seleccionados");
    assert.equal(f.elements.estadoListaCitas.attrs.role, "status");
    f.api.limpiarFiltrosCitas();
    assert.equal(f.elements.estadoListaCitas.hidden, true);
    f.cards.length = 0;
    f.api.filtrarCitas();
    assert.equal(f.elements.estadoListaCitas.textContent, "No tienes citas registradas.");
    assert.equal(f.elements.estadoListaCitas.hidden, false);
});

test("fecha inválida oculta resultados y muestra error recuperable sin escribir datos", () => {
    const f = fixture();
    f.elements.fechaFiltroCitas.validity.valid = false;
    f.api.filtrarCitas();
    assert(f.cards.every(card => card.hidden));
    assert.equal(f.elements.estadoListaCitas.hidden, false);
    assert.equal(f.elements.estadoListaCitas.attrs.role, "alert");
    assert.match(f.elements.estadoListaCitas.textContent, /La fecha no es válida/);
    f.elements.fechaFiltroCitas.validity.valid = true;
    f.api.limpiarFiltrosCitas();
    assert(f.cards.every(card => !card.hidden));
    assert.equal(f.elements.estadoListaCitas.attrs.role, "status");
});

test("opciones de estado se derivan de las asociaciones sin IDs o etiquetas inventadas", () => {
    const html = render([cita, { ...cita }, { ...cita, estado: "Estado del catálogo" }]);
    assert.equal((html.match(/<option value="Confirmada"/g) || []).length, 1);
    assert.match(html, /<option value="Estado del catálogo">Estado del catálogo<\/option>/);
    assert.doesNotMatch(html, /<option value="[1-9]/);
    assert.match(html, /<label[^>]*for="fechaFiltroCitas"/);
    assert.match(html, /<label[^>]*for="estadoFiltroCitas"/);
    assert.match(html, /Todas las citas/);
});
