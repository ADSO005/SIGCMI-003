import { after, before, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

// Rutas, middleware y GET reales; los modelos se sustituyen antes de importarlos.
let consultas, perfil, horarios;
const modelos = {
    Usuario: { findByPk: async id => ({ id_usuario: id, rol_id: id === 7 ? 2 : id, estado: true }) },
    Medico: { findOne: async options => { consultas.push(["medico", options]); return perfil; } },
    Horario: { findAll: async options => { consultas.push(["horarios", options]); return horarios; } }
};
for (const [nombre, modelo] of Object.entries(modelos)) {
    mock.module(new URL(`../../models/${nombre}.js`, import.meta.url).href, { defaultExport: modelo });
}
mock.module(new URL("../../config/db.js", import.meta.url).href, {
    defaultExport: new Proxy({}, { get() { throw Error("MySQL no está permitido en esta prueba"); } })
});
// No se ejercitan otras funcionalidades médicas en esta entrega.
const otroControlador = () => { throw Error("Endpoint fuera del alcance"); };
mock.module(new URL("../../controllers/medico/medicoController.js", import.meta.url).href, {
    namedExports: { dashboard: otroControlador, detallePaciente: otroControlador, actualizarEstadoCita: otroControlador }
});
const { default: router } = await import("../../routes/medico/medicoRoutes.js");
const secretoAnterior = process.env.JWT_SECRET;
let servidor, base;
before(async () => {
    process.env.JWT_SECRET = "medical-schedules-test-only";
    const app = express();
    app.use(cookieParser());
    app.use("/medico", router);
    servidor = app.listen(0, "127.0.0.1");
    await new Promise(resolve => servidor.once("listening", resolve));
    base = `http://127.0.0.1:${servidor.address().port}`;
});
after(async () => {
    await new Promise(resolve => servidor.close(resolve));
    if (secretoAnterior === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = secretoAnterior;
});
beforeEach(() => {
    consultas = [];
    perfil = { id_medico: 9 };
    horarios = [{ id_horario: 1, dia_semana: "Lunes", hora_inicio: "08:00:00", hora_fin: "12:00:00", estado: "Aprobado" }];
});
const request = (path = "/horarios", user = 7, method = "GET") => fetch(base + "/medico" + path, {
    method, redirect: "manual",
    headers: user === null ? {} : { cookie: `_token=${jwt.sign({ id: user }, process.env.JWT_SECRET)}` }
});

test("GET usa exclusivamente la identidad autenticada y conserva el contrato", async () => {
    const res = await request("/horarios?medico_id=42&usuario_id=99");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.horarios, horarios);
    assert.equal(typeof body.revision, "string");
    assert.deepEqual(consultas[0][1].where, { usuario_id: 7 });
    assert.deepEqual(consultas[1][1].where, { medico_id: 9 });
});
test("sesión ausente y otros roles se rechazan antes de consultar horarios", async () => {
    const res = await request("/horarios", null);
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "/auth/login");
    for (const rol of [1, 3]) assert.equal((await request("/horarios", rol)).status, 403);
    assert.equal(consultas.length, 0);
});
test("perfil ausente devuelve 404 y médico sin horarios devuelve lista vacía", async () => {
    perfil = null;
    assert.equal((await request()).status, 404);
    assert.equal(consultas.length, 1);
    perfil = { id_medico: 9 };
    horarios = [];
    const res = await request();
    assert.equal(res.status, 200);
    assert.deepEqual((await res.json()).horarios, []);
});
test("no existen endpoints médicos de escritura de horarios ni solicitudes semanales", async () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
        assert.equal((await request("/horarios", 7, method)).status, 404);
        assert.equal((await request("/horarios/1", 7, method)).status, 404);
    }
    assert.equal((await request("/solicitudes-horarios")).status, 404);
    const rutas = router.stack.filter(layer => layer.route).map(layer => layer.route);
    assert.deepEqual(rutas.filter(route => route.path.includes("horario")).map(route => [route.path, Object.keys(route.methods)]), [["/horarios", ["get"]]]);
    assert.equal(consultas.length, 0);
});
