import { after, before, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

// Rutas y middleware reales; los modelos y los bloqueos se simulan sin conectar MySQL.
const estados = new Map([[11, "Pendiente"], [22, "En Curso"], [33, "Completada"], [44, "Cancelada"], [55, "Confirmada"]]);
let cita, perfil, diagnostico, consultas, cambios, cola, fallo, conflicto;
const modelos = {
    Usuario: { findByPk: async id => ({ id_usuario: id, rol_id: id === 7 ? 2 : id, estado: true }) },
    Medico: { findOne: async options => {
        consultas.push(["medico", options]);
        assert.deepEqual(options.where, { usuario_id: 7 });
        return perfil;
    } },
    EstadoCita: { findByPk: async (id, options) => {
        consultas.push(["estado", id, options]);
        return estados.has(id) ? { id_estado: id, nombre: estados.get(id) } : null;
    } },
    Diagnostico: { findOne: async options => {
        consultas.push(["diagnostico", options]);
        assert.deepEqual(options.where, { cita_id: 20 });
        assert.equal(options.lock, "UPDATE");
        assert(options.transaction);
        return diagnostico;
    } },
    Cita: {
        sequelize: { transaction: async callback => {
            const previa = cola;
            let liberar;
            cola = new Promise(resolve => { liberar = resolve; });
            await previa;
            const anterior = structuredClone(cita);
            try {
                const result = await callback({ LOCK: { UPDATE: "UPDATE" } });
                if (fallo === "commit") throw Error("Commit simulado fallido");
                consultas.push(["commit"]);
                return result;
            } catch (error) {
                cita = anterior;
                consultas.push(["rollback"]);
                throw error;
            } finally { liberar(); }
        } },
        findOne: async options => {
            consultas.push(["cita", options]);
            assert.equal(options.lock, "UPDATE");
            assert(options.transaction);
            return cita && options.where.id_cita === cita.id_cita && options.where.medico_id === cita.medico_id
                ? structuredClone(cita) : null;
        },
        update: async (values, options) => {
            consultas.push(["update", values, options]);
            assert(options.transaction);
            if (fallo === "update") throw Error("Actualización simulada fallida");
            if (conflicto || !Object.entries(options.where).every(([key, value]) => cita[key] === value)) return [0];
            cita.estado_id = values.estado_id;
            cambios++;
            return [1];
        }
    },
    Paciente: {}, Prescripcion: {}, Especialidad: {}
};
for (const [name, model] of Object.entries(modelos)) {
    mock.module(new URL(`../../models/${name}.js`, import.meta.url).href, { defaultExport: model });
}
mock.module(new URL("../../config/db.js", import.meta.url).href, {
    defaultExport: new Proxy({}, { get() { throw Error("MySQL prohibido en estas pruebas"); } })
});
mock.module(new URL("../../controllers/medico/horariosController.js", import.meta.url).href, {
    namedExports: { listarHorarios() { throw Error("Fuera de alcance"); } }
});
const { default: router } = await import("../../routes/medico/medicoRoutes.js");
const secretoAnterior = process.env.JWT_SECRET;
let servidor, base;
before(async () => {
    process.env.JWT_SECRET = "medical-state-test-only";
    mock.timers.enable({ apis: ["Date"], now: Date.parse("2026-11-09T14:00:00Z") });
    mock.method(console, "error", () => {});
    const app = express();
    app.use(express.json(), cookieParser());
    app.use("/medico", router);
    servidor = app.listen(0, "127.0.0.1");
    await new Promise(resolve => servidor.once("listening", resolve));
    base = `http://127.0.0.1:${servidor.address().port}`;
});
after(async () => {
    await new Promise(resolve => servidor.close(resolve));
    mock.timers.reset();
    mock.restoreAll();
    if (secretoAnterior === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = secretoAnterior;
});
beforeEach(() => {
    cita = { id_cita: 20, medico_id: 9, estado_id: 11, fecha: "2026-11-09", hora: "09:00:00" };
    perfil = { id_medico: 9 }; diagnostico = null; consultas = []; cambios = 0;
    cola = Promise.resolve(); fallo = null; conflicto = false;
    mock.timers.setTime(Date.parse("2026-11-09T14:00:00Z"));
});
const request = (body = { estado_id: 22 }, id = "20", user = 7) => fetch(`${base}/medico/citas/${id}/estado`, {
    method: "PATCH", redirect: "manual",
    headers: { "Content-Type": "application/json", ...(user === null ? {} : { cookie: `_token=${jwt.sign({ id: user }, process.env.JWT_SECRET)}` }) },
    body: JSON.stringify(body)
});

test("sin sesión y con otros roles no se consulta ni modifica la cita", async () => {
    assert.equal((await request({}, "20", null)).status, 302);
    for (const rol of [1, 3]) assert.equal((await request({}, "20", rol)).status, 403);
    assert.equal(consultas.length, 0);
});

test("perfil ausente, cita inexistente y cita ajena se rechazan sin consultar diagnóstico", async () => {
    perfil = null;
    assert.equal((await request()).status, 404);
    perfil = { id_medico: 9 };
    cita.medico_id = 10;
    assert.equal((await request()).status, 404);
    cita = null;
    assert.equal((await request()).status, 404);
    assert.equal(cambios, 0);
    assert(!consultas.some(([tipo]) => tipo === "diagnostico"));
});

test("IDs y cuerpos inválidos se rechazan antes de consultar modelos", async () => {
    for (const id of ["0", "-1", "01", "1.5", "abc", "2147483648", "9007199254740993"]) {
        assert.equal((await request({ estado_id: 22 }, id)).status, 400);
    }
    for (const body of [null, [], {}, { estado_id: "22" }, { estado_id: 0 }, { estado_id: -1 },
        { estado_id: 2.5 }, { estado_id: true }, { estado_id: 2147483648 }, { estado_id: 22, medico_id: 10 }]) {
        assert.equal((await request(body)).status, 400);
    }
    const sinCuerpo = await fetch(`${base}/medico/citas/20/estado`, {
        method: "PATCH", headers: { cookie: `_token=${jwt.sign({ id: 7 }, process.env.JWT_SECRET)}` }
    });
    assert.equal(sinCuerpo.status, 400);
    assert.equal(consultas.length, 0);
});

test("Pendiente y Confirmada pasan a En Curso con IDs de catálogo diferentes", async () => {
    for (const estado of [11, 55]) {
        cita.estado_id = estado;
        const response = await request();
        assert.equal(response.status, 200);
        assert.equal((await response.json()).estado_id, 22);
        assert.equal(cita.estado_id, 22);
    }
    assert.equal(cambios, 2);
    const updates = consultas.filter(([tipo]) => tipo === "update");
    assert.deepEqual(updates[0][2].where, { id_cita: 20, medico_id: 9, estado_id: 11 });
    assert.deepEqual(updates[1][2].where, { id_cita: 20, medico_id: 9, estado_id: 55 });
});

test("inicio antes de la hora se rechaza; hora exacta y atraso del mismo día se permiten", async () => {
    mock.timers.setTime(Date.parse("2026-11-09T13:59:59.999Z"));
    assert.equal((await request()).status, 409);
    assert.equal(cambios, 0);
    mock.timers.setTime(Date.parse("2026-11-09T14:00:00Z"));
    assert.equal((await request()).status, 200);
    cita.estado_id = 55;
    mock.timers.setTime(Date.parse("2026-11-10T04:59:59Z"));
    assert.equal((await request()).status, 200);
});

test("no se inician citas de fechas anteriores o futuras ni con TIME inválido", async () => {
    for (const fecha of ["2026-11-08", "2026-11-10"]) {
        cita.fecha = fecha;
        assert.equal((await request()).status, 409);
    }
    cita.fecha = "2026-11-09";
    for (const hora of [null, "25:00:00", "09:99:00"]) {
        cita.hora = hora;
        assert.equal((await request()).status, 409);
    }
    assert.equal(cambios, 0);
});

test("inicio respeta medianoche de Bogotá al cambiar de día, mes y año", async () => {
    for (const [anterior, siguiente] of [["2026-11-09", "2026-11-10"], ["2026-11-30", "2026-12-01"], ["2026-12-31", "2027-01-01"]]) {
        cita.fecha = anterior; cita.hora = "23:59:00"; cita.estado_id = 11;
        mock.timers.setTime(Date.parse(`${siguiente}T04:59:59Z`));
        assert.equal((await request()).status, 200);
        cita.estado_id = 11;
        mock.timers.setTime(Date.parse(`${siguiente}T05:00:00Z`));
        assert.equal((await request()).status, 409);
        cita.fecha = siguiente; cita.hora = "00:00:00";
        assert.equal((await request()).status, 200);
    }
});

test("Cancelada y Completada no permiten iniciar ni finalizar", async () => {
    for (const estado of [44, 33]) {
        cita.estado_id = estado;
        for (const destino of [22, 33]) assert.equal((await request({ estado_id: destino })).status, 409);
    }
    assert.equal(cambios, 0);
});

test("saltos, retrocesos, estados inexistentes e IDs fijos antiguos se rechazan", async () => {
    for (const estado of [11, 55]) {
        cita.estado_id = estado;
        assert.equal((await request({ estado_id: 33 })).status, 409);
    }
    cita.estado_id = 22;
    for (const estado_id of [11, 44, 55, 999, 2, 3]) assert.equal((await request({ estado_id })).status, 400);
    cita.estado_id = 999;
    assert.equal((await request()).status, 409);
    assert.equal(cambios, 0);
});

test("En Curso sin diagnóstico no finaliza ni antes ni después de medianoche", async () => {
    cita.estado_id = 22;
    for (const now of ["2026-11-09T15:00:00Z", "2026-11-10T05:01:00Z"]) {
        mock.timers.setTime(Date.parse(now));
        const response = await request({ estado_id: 33 });
        assert.equal(response.status, 409);
        assert.match((await response.json()).mensaje, /diagnóstico/);
        assert.equal(cita.estado_id, 22);
    }
    assert.equal(cambios, 0);
});

test("En Curso con diagnóstico persistido finaliza incluso después de medianoche", async () => {
    diagnostico = { id_diagnostico: 81, diagnostico: "Diagnóstico de prueba" };
    for (const now of ["2026-11-09T15:00:00Z", "2026-11-10T05:01:00Z"]) {
        cita.estado_id = 22;
        mock.timers.setTime(Date.parse(now));
        assert.equal((await request({ estado_id: 33 })).status, 200);
        assert.equal(cita.estado_id, 33);
        assert.equal(consultas.at(-1)[0], "commit");
    }
});

test("una solicitud que espera un bloqueo vuelve a evaluar la fecha de Bogotá", async () => {
    let liberar;
    cola = new Promise(resolve => { liberar = resolve; });
    mock.timers.setTime(Date.parse("2026-11-10T04:59:59Z"));
    const pendiente = request();
    while (!consultas.some(([tipo]) => tipo === "estado")) await new Promise(resolve => setImmediate(resolve));
    mock.timers.setTime(Date.parse("2026-11-10T05:00:00Z"));
    liberar();
    assert.equal((await pendiente).status, 409);
    assert.equal(cambios, 0);
});

test("solicitudes repetidas y concurrentes aplican una sola transición", async () => {
    const responses = await Promise.all([request(), request()]);
    assert.deepEqual(responses.map(res => res.status).sort(), [200, 409]);
    assert.equal(cambios, 1);
    assert.equal((await request()).status, 409);
    diagnostico = { id_diagnostico: 81, diagnostico: "Diagnóstico de prueba" };
    const end = await Promise.all([request({ estado_id: 33 }), request({ estado_id: 33 })]);
    assert.deepEqual(end.map(res => res.status).sort(), [200, 409]);
    assert.equal(cambios, 2);
});

test("una fila de diagnóstico vacía o inválida no permite finalizar", async () => {
    cita.estado_id = 22;
    for (const texto of [null, "", "   ", 123, "x".repeat(65536)]) {
        diagnostico = { id_diagnostico: 81, diagnostico: texto };
        assert.equal((await request({ estado_id: 33 })).status, 409);
        assert.equal(cita.estado_id, 22);
    }
    assert.equal(cambios, 0);
});

test("el UPDATE conserva el estado anterior como condición adicional", async () => {
    conflicto = true;
    assert.equal((await request()).status, 409);
    assert.equal(cita.estado_id, 11);
    assert.equal(cambios, 0);
});

test("fallo de actualización o commit devuelve error controlado y revierte el estado simulado", async () => {
    for (const tipo of ["update", "commit"]) {
        fallo = tipo;
        assert.equal((await request()).status, 500);
        assert.equal(cita.estado_id, 11);
        assert.equal(consultas.at(-1)[0], "rollback");
    }
});
