const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const pug = require("pug");

const cita = { id_cita: 20, fecha: "2026-11-09", hora: "09:00:00", paciente: "Paciente de prueba", motivo: "Control", estado: "Pendiente", puedeIniciar: true };
const render = extra => pug.renderFile("views/viewsMedico/includes/dailyAppointments.pug", {
    agendaHoy: [], consultasAnteriores: [], contextoConsulta: null, errorContexto: false,
    estadoEnCursoId: 222, ...extra
});

test("botones según estado y elegibilidad, sin finalizar ni formularios clínicos", () => {
    const enabled = render({ agendaHoy: [cita, { ...cita, id_cita: 21, estado: "Confirmada" }] });
    assert.equal((enabled.match(/<button/g) || []).length, 2);
    assert.doesNotMatch(enabled, /disabled="disabled"/);
    assert.match(enabled, /data-estado-id="222"/);
    const future = render({ agendaHoy: [{ ...cita, puedeIniciar: false }] });
    assert.match(future, /disabled="disabled"/);
    assert.match(future, /Disponible desde la hora programada/);
    const terminal = render({ agendaHoy: ["Completada", "Cancelada", "En Curso"].map(estado => ({ ...cita, estado, puedeIniciar: false })) });
    assert.doesNotMatch(terminal, /<button/);
    assert.match(terminal, /Continuar consulta/);
    assert.doesNotMatch(enabled + terminal, /Finalizar|finalizarConsulta|<form|<textarea|Guardar|Prescribir/);
});

test("contexto y consultas anteriores se presentan con escape y formulario sin finalización", () => {
    const payload = '<img src=x onerror="alert(1)">';
    const previous = { ...cita, estado: "En Curso", fecha: "2026-11-08", paciente: payload, motivo: payload };
    const html = render({ consultasAnteriores: [previous], contextoConsulta: previous });
    assert.match(html, /Consultas en curso de días anteriores/);
    assert.match(html, /id="contextoConsulta"/);
    assert.match(html, /2026-11-08/);
    assert.match(html, /Continuar consulta/);
    assert.match(html, /&lt;img/);
    assert(!html.includes(payload));
    assert.equal((html.match(/<form/g) || []).length, 1);
    assert.match(html, /id="formDiagnostico"/);
    assert.doesNotMatch(html, /Finalizar Consulta|finalizarConsulta|Prescribir/);
    assert.match(render({ errorContexto: true }), /No se encontró una consulta/);
    assert.match(render({ agendaHoy: [cita], estadoEnCursoId: null }), /disabled="disabled"/);
});

const response = (status = 200, extra = {}) => ({
    ok: status === 200, status, redirected: false,
    headers: { get: () => "application/json" },
    json: async () => ({ id_cita: 20, estado_id: 222 }), ...extra
});
function fixture(fetch) {
    const status = { hidden: true, attrs: {}, setAttribute(key, value) { this.attrs[key] = value; }, focus() { this.focused = true; }, set innerHTML(value) { throw Error(value); } };
    const button = { dataset: { cita: "20", estadoId: "222" }, disabled: false, textContent: "Iniciar Consulta" };
    const navigations = [];
    const context = { window: { location: { assign: url => navigations.push(url) } }, document: { getElementById: id => { assert.equal(id, "estadoAtencion"); return status; } }, fetch, TypeError, SyntaxError };
    vm.createContext(context);
    const source = fs.readFileSync("public/medico/js/dashboardMedical.js", "utf8");
    vm.runInContext(source.slice(source.indexOf("// INICIAR ATENCIÓN"), source.indexOf("// MODAL DE CONSULTA DE CITAS")), context);
    return { api: context.window, status, button, navigations };
}

test("inicio correcto usa ID dinámico y recarga desde el servidor con contexto", async () => {
    const f = fixture(async (url, options) => {
        assert.equal(url, "/medico/citas/20/estado");
        assert.equal(options.method, "PATCH");
        assert.equal(options.credentials, "same-origin");
        assert.deepEqual(JSON.parse(options.body), { estado_id: 222 });
        return response();
    });
    await f.api.iniciarConsulta(f.button);
    assert.deepEqual(f.navigations, ["/medico/dashboard?consulta=20#contextoConsulta"]);
    assert.equal(f.button.disabled, true);
});

test("peticiones duplicadas y botones no elegibles no envían nuevas solicitudes", async () => {
    let calls = 0, complete;
    const f = fixture(() => { calls++; return new Promise(resolve => { complete = resolve; }); });
    const pending = f.api.iniciarConsulta(f.button);
    assert.equal(f.button.disabled, true);
    await f.api.iniciarConsulta(f.button);
    await f.api.iniciarConsulta({ ...f.button, disabled: false });
    assert.equal(calls, 1);
    complete(response());
    await pending;
    await f.api.iniciarConsulta({ ...f.button, dataset: { cita: "21", estadoId: "222" }, disabled: true });
    assert.equal(calls, 1);
});

test("conflictos, sesión vencida, permisos, errores HTTP y red recuperan el botón sin mutar la tarjeta", async () => {
    const scenarios = [
        [async () => response(409), /cambió de estado/],
        [async () => response(401), /sesión venció/],
        [async () => response(200, { redirected: true }), /sesión venció/],
        [async () => response(403), /permiso/],
        [async () => response(500, { json: async () => ({ mensaje: "Error de servidor" }) }), /Error de servidor/],
        [async () => response(200, { headers: { get: () => "text/html" } }), /comprueba tu sesión/],
        [async () => { throw new TypeError("fetch failed"); }, /conexión/],
        [async () => response(200, { json: async () => { throw new SyntaxError("invalid"); } }), /respuesta no es válida/],
        [async () => response(200, { json: async () => ({ id_cita: 99, estado_id: 222 }) }), /confirmar el cambio/]
    ];
    for (const [fetch, message] of scenarios) {
        const f = fixture(fetch);
        await f.api.iniciarConsulta(f.button);
        assert.equal(f.status.attrs.role, "alert");
        assert.match(f.status.textContent, message);
        assert.equal(f.button.disabled, false);
        assert.equal(f.button.textContent, "Iniciar Consulta");
        assert.equal(f.status.focused, true);
        assert.deepEqual(f.navigations, []);
    }
});
