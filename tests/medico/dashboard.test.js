import { after, before, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

// Se prueba el dashboard real y sus barreras de acceso, sin importar modelos conectados.
let queries, profileExists, failQuery;
const rows = [
    { id_cita: 1, medico_id: 9, paciente_id: 30, fecha: "2026-11-09", Estado: { nombre: "Completada" }, Paciente: { id_paciente: 30 } },
    { id_cita: 2, medico_id: 10, paciente_id: 31, fecha: "2026-11-09", Estado: { nombre: "Pendiente" }, Paciente: { id_paciente: 31 } }
];
const models = {
    Usuario: { findByPk: async id => ({ id_usuario: id, rol_id: [7, 8].includes(id) ? 2 : id, estado: true }) },
    Medico: { findOne: async options => { queries.push(["medico", options]); return profileExists ? { id_medico: options.where.usuario_id === 7 ? 9 : 10 } : null; } },
    Cita: { findAll: async options => {
        queries.push(["citas", options]);
        if (failQuery) throw Error("Fallo de consulta simulado");
        return rows.filter(row => row.medico_id === options.where.medico_id && (!options.where.fecha || row.fecha === options.where.fecha));
    } },
    Paciente: {}, Diagnostico: {}, Prescripcion: {}, EstadoCita: {}
};
for (const [name, model] of Object.entries(models)) mock.module(new URL(`../../models/${name}.js`, import.meta.url).href, { defaultExport: model });
mock.module(new URL("../../config/db.js", import.meta.url).href, { defaultExport: new Proxy({}, { get() { throw Error("MySQL no permitido"); } }) });
mock.module(new URL("../../controllers/medico/horariosController.js", import.meta.url).href, { namedExports: { listarHorarios() { throw Error("Fuera de alcance"); } } });
const { default: router } = await import("../../routes/medico/medicoRoutes.js");
const previousSecret = process.env.JWT_SECRET;
let server, base;
before(async () => {
    mock.timers.enable({ apis: ["Date"], now: Date.parse("2026-11-09T17:00:00Z") });
    mock.method(console, "log", () => {});
    mock.method(console, "error", () => {});
    process.env.JWT_SECRET = "medical-dashboard-test-only";
    const app = express();
    app.use(cookieParser());
    // Se inspeccionan las variables que recibiría Pug, sin serializar usuarios al cliente.
    app.use((req, res, next) => { res.render = (view, data) => res.json({ view, metrics: data.dashboardMetrics }); next(); });
    app.use("/medico", router);
    server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
    await new Promise(resolve => server.close(resolve));
    mock.restoreAll();
    mock.timers.reset();
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
});
beforeEach(() => { queries = []; profileExists = true; failQuery = false; });
const request = (user = 7) => fetch(base + "/medico/dashboard?medico_id=10&usuario_id=8", {
    redirect: "manual", headers: user === null ? {} : { cookie: `_token=${jwt.sign({ id: user }, process.env.JWT_SECRET)}` }
});

test("cada médico recibe sus métricas con dos consultas de citas, sin aceptar propietario del navegador", async () => {
    const res = await request();
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.metrics.todayTotal, 1);
    assert.equal(body.metrics.todayCompleted, 1);
    assert.equal(body.metrics.monthlyPatients, 1);
    assert.deepEqual(queries[0][1].where, { usuario_id: 7 });
    const appointments = queries.filter(([type]) => type === "citas");
    assert.equal(appointments.length, 2);
    assert.deepEqual(appointments[0][1].where, { medico_id: 9 });
    assert.deepEqual(appointments[1][1].where, { medico_id: 9, fecha: "2026-11-09" });
    assert(appointments[0][1].include.some(include => include.model === models.EstadoCita && include.as === "Estado"));
    const other = await request(8);
    assert.equal((await other.json()).metrics.todayCompleted, 0);
});
test("sesión ausente y otros roles no llegan a las consultas médicas", async () => {
    const res = await request(null);
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "/auth/login");
    for (const role of [1, 3]) assert.equal((await request(role)).status, 403);
    assert.equal(queries.length, 0);
});
test("perfil médico ausente conserva el rechazo 404", async () => {
    profileExists = false;
    assert.equal((await request()).status, 404);
    assert.equal(queries.length, 1);
});
test("fallo de consulta no se transforma en métricas ficticias de cero", async () => {
    failQuery = true;
    const res = await request();
    assert.equal(res.status, 500);
    assert.match(await res.text(), /Error al cargar el dashboard/);
});
