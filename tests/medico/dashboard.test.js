import { after, before, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import pug from "pug";

// Se prueba el dashboard real y sus barreras de acceso, sin importar modelos conectados.
let queries, profileExists, failQuery, specialty;
const rows = [
    { id_cita: 1, medico_id: 9, paciente_id: 30, fecha: "2026-11-09", Estado: { nombre: "Completada" }, Paciente: { id_paciente: 30 } },
    { id_cita: 2, medico_id: 10, paciente_id: 31, fecha: "2026-11-09", Estado: { nombre: "Pendiente" }, Paciente: { id_paciente: 31 } }
];
const models = {
    Usuario: { findByPk: async id => ({ id_usuario: id, rol_id: [7, 8].includes(id) ? 2 : id, estado: true }) },
    Medico: { findOne: async options => {
        queries.push(["medico", options]);
        const first = options.where.usuario_id === 7;
        return profileExists ? {
            id_medico: first ? 9 : 10,
            Usuario: first ? { nombres: "Ana", apellidos: "Pérez" } : { nombres: "Luis", apellidos: "Gómez" },
            Especialidad: specialty ? { nombre: first ? "Cardiología" : "Pediatría" } : null
        } : null;
    } },
    Cita: { findAll: async options => {
        queries.push(["citas", options]);
        if (failQuery) throw Error("Fallo de consulta simulado");
        return rows.filter(row => row.medico_id === options.where.medico_id && (!options.where.fecha || row.fecha === options.where.fecha));
    } },
    Paciente: {}, Diagnostico: {}, Prescripcion: {}, EstadoCita: {}, Especialidad: {}
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
    app.use((req, res, next) => {
        res.render = (view, data) => res.json({
            view, metrics: data.dashboardMetrics, name: data.nombreMedico,
            specialty: data.especialidadMedico, date: data.fechaDashboard, nextAppointment: data.proximaCita,
            html: pug.renderFile(`views/${view}.pug`, { ...data, pacientes: [], citasHoy: [] })
        });
        next();
    });
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
beforeEach(() => {
    queries = []; profileExists = true; failQuery = false; specialty = true;
    rows.splice(2);
    mock.timers.setTime(Date.parse("2026-11-09T17:00:00Z"));
});
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
test("identidad y especialidad pertenecen al usuario autenticado y se muestran sin datos fijos", async () => {
    for (const [id, name, specialtyName] of [[7, "Ana Pérez", "Cardiología"], [8, "Luis Gómez", "Pediatría"]]) {
        const body = await (await request(id)).json();
        assert.equal(body.name, name);
        assert.equal(body.specialty, specialtyName);
        assert(body.html.includes(name));
        assert(body.html.includes(specialtyName));
        assert.doesNotMatch(body.html, /montoyajuanes11|Médico General|3 de Abril del 2026/);
        assert.equal((body.html.match(/data-metric="todayTotal"/g) || []).length, 1);
    }
    const profile = queries[0][1];
    assert.deepEqual(profile.include[0], { model: models.Usuario, attributes: ["nombres", "apellidos"] });
    assert.deepEqual(profile.include[1], { model: models.Especialidad, attributes: ["nombre"], required: false });
    assert.equal(queries.length, 6);
});

test("sin especialidad se conserva el perfil y se muestra un texto neutral", async () => {
    specialty = false;
    const body = await (await request()).json();
    assert.equal(body.specialty, "Especialidad no registrada");
    assert(body.html.includes("Especialidad no registrada"));
    assert.equal(body.name, "Ana Pérez");
});

test("fecha visible, consulta diaria y métricas comparten el instante de Bogotá", async () => {
    for (const [instant, date, label, total] of [
        ["2026-11-09T04:59:59Z", "2026-11-08", "8 de noviembre de 2026", 0],
        ["2026-11-09T05:00:00Z", "2026-11-09", "9 de noviembre de 2026", 1],
        ["2026-12-01T04:59:59Z", "2026-11-30", "30 de noviembre de 2026", 0],
        ["2026-12-01T05:00:00Z", "2026-12-01", "1 de diciembre de 2026", 0],
        ["2027-01-01T04:59:59Z", "2026-12-31", "31 de diciembre de 2026", 0],
        ["2027-01-01T05:00:00Z", "2027-01-01", "1 de enero de 2027", 0]
    ]) {
        queries = [];
        mock.timers.setTime(Date.parse(instant));
        const body = await (await request()).json();
        assert.equal(body.date, label);
        assert.equal(body.html.split(label).length - 1, 2);
        assert.equal(queries[2][1].where.fecha, date);
        assert.equal(body.metrics.todayTotal, total);
    }
});

test("próxima cita reutiliza la consulta diaria y Pug escapa nombres y motivos", async () => {
    const payload = '<img src=x onerror="alert(1)">';
    rows.push({ id_cita: 3, medico_id: 9, paciente_id: 32, fecha: "2026-11-09", hora: "13:00:00",
        Estado: { nombre: "Confirmada" }, Paciente: { Usuario: { nombres: payload, apellidos: "Paciente" } }, motivo_consulta: payload });
    const body = await (await request()).json();
    assert.equal(body.nextAppointment.hora, "1:00 PM");
    assert.equal(body.nextAppointment.paciente, payload + " Paciente");
    assert.equal(body.nextAppointment.motivo, payload);
    assert(body.html.includes("&lt;img src=x"));
    assert(!body.html.includes(payload));
    assert.equal(queries.length, 3);
    const card = body.html.slice(body.html.indexOf('class="proxima-cita '), body.html.indexOf('id="pacientesView"'));
    assert(card.includes("1:00 PM"));
    assert.doesNotMatch(card, /Ana Rodríguez|Medicina interna|11:00 AM/);
});

test("sin próxima cita se representa el estado vacío sin nombres ni horas ficticias", async () => {
    const body = await (await request()).json();
    assert.equal(body.nextAppointment, null);
    assert(body.html.includes("No tienes más citas programadas para hoy"));
    assert(body.html.includes("Tu agenda está libre por el momento"));
    const card = body.html.slice(body.html.indexOf('class="proxima-cita '), body.html.indexOf('id="pacientesView"'));
    assert(card.includes("Tu agenda está libre por el momento"));
    assert.doesNotMatch(card, /Ana Rodríguez|Medicina interna|11:00 AM/);
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
