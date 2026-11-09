import { after, before, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { camposClinicos, validarDiagnostico, revisionDiagnostico } from "../../services/medico/diagnosticoService.js";

// Rutas y middleware reales; persistencia y bloqueo solo se simulan en memoria.
let cita, perfil, registro, fallo, cola, creados, actualizados;
let consultas = [], logs = [];
const estados = new Map([[61, "Pendiente"], [73, "En Curso"], [84, "Completada"], [95, "Cancelada"], [106, "Confirmada"]]);
const fila = datos => Object.assign({
    async update(valores, opciones) {
        assert(opciones.transaction);
        assert.equal(opciones.logging, false);
        consultas.push("editar");
        Object.assign(this, valores);
        actualizados++;
        if (fallo === "editar") throw Error("SQL con información clínica que no debe registrarse");
    }
}, datos);
const modelos = {
    Usuario: { findByPk: async id => ({ id_usuario: id, rol_id: id === 7 ? 2 : id, estado: true }) },
    Medico: { findOne: async options => {
        consultas.push("perfil");
        assert.deepEqual(options.where, { usuario_id: 7 });
        return perfil;
    } },
    EstadoCita: { findByPk: async id => { consultas.push("estado"); return { id_estado: id, nombre: estados.get(id) }; } },
    Cita: {
        sequelize: { transaction: async callback => {
            const anterior = cola;
            let liberar;
            cola = new Promise(resolve => { liberar = resolve; });
            await anterior;
            const copia = registro ? Object.fromEntries(Object.entries(registro).filter(([, value]) => typeof value !== "function")) : null;
            const copiaCita = cita ? { ...cita } : null;
            try {
                const resultado = await callback({ LOCK: { UPDATE: "UPDATE" } });
                if (fallo === "commit") throw Error("Fallo al confirmar: contiene datos clínicos");
                consultas.push("commit");
                return resultado;
            } catch (error) {
                registro = copia ? fila(copia) : null;
                cita = copiaCita;
                consultas.push("rollback");
                throw error;
            } finally { liberar(); }
        } },
        findOne: async options => {
            consultas.push("cita");
            assert(options.transaction);
            assert.equal(options.lock, "UPDATE");
            return cita && options.where.id_cita === cita.id_cita && options.where.medico_id === cita.medico_id ? cita : null;
        },
        update: async (valores, options) => {
            assert(options.transaction);
            if (!Object.entries(options.where).every(([key, value]) => cita[key] === value)) return [0];
            cita.estado_id = valores.estado_id;
            return [1];
        }
    },
    Diagnostico: {
        findOne: async options => {
            consultas.push("diagnostico");
            assert.equal(options.logging, false);
            assert.equal(options.where.cita_id, 20);
            assert(options.transaction);
            assert.equal(options.lock, "UPDATE");
            return registro;
        },
        create: async (datos, options) => {
            assert(options.transaction);
            assert.equal(options.logging, false);
            assert.equal(datos.cita_id, 20);
            consultas.push("crear");
            if (fallo === "unique") throw Object.assign(Error("SQL sensible"), { name: "SequelizeUniqueConstraintError" });
            assert.equal(registro, null);
            registro = fila({ ...datos, decision_medicamentos: "Pendiente", version_prescripciones: 0, id_diagnostico: 80 });
            creados++;
            if (fallo === "crear") throw Error("SQL con diagnóstico sensible");
            return registro;
        }
    },
    Paciente: {}, Prescripcion: {}, Especialidad: {}
};
for (const [name, model] of Object.entries(modelos)) mock.module(new URL(`../../models/${name}.js`, import.meta.url).href, { defaultExport: model });
mock.module(new URL("../../config/db.js", import.meta.url).href, {
    defaultExport: new Proxy({}, { get() { throw Error("MySQL no permitido en estas pruebas"); } })
});
mock.module(new URL("../../controllers/medico/horariosController.js", import.meta.url).href, {
    namedExports: { listarHorarios() { throw Error("Fuera de alcance"); } }
});
const { default: router } = await import("../../routes/medico/medicoRoutes.js");
const secretoAnterior = process.env.JWT_SECRET;
let servidor, base;
before(async () => {
    process.env.JWT_SECRET = "medical-diagnosis-test-only";
    mock.timers.enable({ apis: ["Date"], now: Date.parse("2026-11-10T05:01:00Z") });
    mock.method(console, "error", (...args) => logs.push(args));
    const app = express();
    app.use(express.json(), cookieParser());
    app.use("/medico", router);
    servidor = app.listen(0, "127.0.0.1");
    await new Promise(resolve => servidor.once("listening", resolve));
    base = `http://127.0.0.1:${servidor.address().port}`;
});
after(async () => {
    await new Promise(resolve => servidor.close(resolve));
    mock.timers.reset(); mock.restoreAll();
    if (secretoAnterior === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = secretoAnterior;
});
beforeEach(() => {
    cita = { id_cita: 20, medico_id: 9, estado_id: 73, fecha: "2026-11-09" };
    perfil = { id_medico: 9 }; registro = null; consultas = []; logs = [];
    creados = 0; actualizados = 0; fallo = null; cola = Promise.resolve();
});
const body = extra => ({ revision: null, diagnostico: "Diagnóstico de prueba", ...extra });
const request = (method = "GET", data, id = "20", user = 7) => fetch(`${base}/medico/citas/${id}/diagnostico?medico_id=42`, {
    method, redirect: "manual", headers: {
        "Content-Type": "application/json",
        ...(user === null ? {} : { cookie: `_token=${jwt.sign({ id: user }, process.env.JWT_SECRET)}` })
    }, ...(data === undefined ? {} : { body: JSON.stringify(data) })
});

test("GET y PUT exigen sesión y rol médico antes de consultar modelos", async () => {
    for (const method of ["GET", "PUT"]) {
        const data = method === "PUT" ? body() : undefined;
        assert.equal((await request(method, data, "20", null)).status, 302);
        for (const role of [1, 3]) assert.equal((await request(method, data, "20", role)).status, 403);
    }
    assert.equal(consultas.length, 0);
});

test("perfil ausente y citas ajenas o inexistentes no revelan diagnóstico", async () => {
    perfil = null;
    assert.equal((await request("PUT", body())).status, 404);
    perfil = { id_medico: 9 }; cita.medico_id = 10;
    assert.equal((await request()).status, 404);
    assert.equal((await request("PUT", body())).status, 404);
    cita = null;
    assert.equal((await request("PUT", body())).status, 404);
    assert(!consultas.includes("diagnostico"));
    assert.equal(creados, 0);
});

test("solo En Curso permite consultar, crear y editar, sin depender del ID del catálogo", async () => {
    for (const estado of [61, 84, 95, 106, 999]) {
        cita.estado_id = estado;
        for (const method of ["GET", "PUT"]) assert.equal((await request(method, method === "PUT" ? body() : undefined)).status, 409);
    }
    cita.estado_id = 73;
    assert.equal((await request("PUT", body())).status, 201);
    assert.equal(cita.estado_id, 73);
});

test("GET entrega revisión inicial null y datos mínimos sin caché", async () => {
    const res = await request();
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.deepEqual(await res.json(), { mensaje: "Diagnóstico consultado", diagnostico: null, revision: null });
    assert.deepEqual(consultas, ["perfil", "cita", "estado", "diagnostico", "commit"]);
});

test("crea tras medianoche, normaliza opcionales y usa fecha del servidor sin cambiar la cita", async () => {
    const res = await request("PUT", body({ sintomas: "   ", tratamiento: null, temperatura: "37.0", altura: "1.70", peso: "70.50", frecuencia_cardiaca: "80", presion_arterial: "120 / 80" }));
    assert.equal(res.status, 201);
    const result = await res.json();
    assert.match(result.revision, /^[a-f0-9]{64}$/);
    assert.equal(result.diagnostico.fecha_diagnostico, "2026-11-10T05:01:00.000Z");
    assert.equal(result.diagnostico.sintomas, null);
    assert.equal(result.diagnostico.notas_adicionales, null);
    assert.equal(result.diagnostico.presion_arterial, "120/80");
    assert.equal(result.diagnostico.peso, "70.50");
    assert.equal(registro.decision_medicamentos, "Pendiente");
    assert.equal(registro.version_prescripciones, 0);
    assert.equal(Object.hasOwn(result.diagnostico, "decision_medicamentos"), false);
    assert.equal(Object.hasOwn(result.diagnostico, "version_prescripciones"), false);
    assert.equal(cita.fecha, "2026-11-09");
    assert.equal(cita.estado_id, 73);
    assert.equal(consultas.at(-1), "commit");
    assert.deepEqual((await (await request()).json()).revision, result.revision);
});

test("editar exige revisión vigente y conserva cita, ID y fecha del registro", async () => {
    const first = await (await request("PUT", body())).json();
    registro.decision_medicamentos = "Requiere";
    registro.version_prescripciones = 3;
    const res = await request("PUT", body({ revision: first.revision, diagnostico: "Diagnóstico corregido", notas_adicionales: "Nota" }));
    assert.equal(res.status, 200);
    const result = await res.json();
    assert.notEqual(result.revision, first.revision);
    assert.equal(result.diagnostico.fecha_diagnostico, first.diagnostico.fecha_diagnostico);
    assert.equal(result.diagnostico.id_diagnostico, first.diagnostico.id_diagnostico);
    assert.equal(result.diagnostico.cita_id, 20);
    assert.equal(creados, 1); assert.equal(actualizados, 1);
    assert.equal((await request("PUT", body({ revision: first.revision }))).status, 409);
    assert.equal(registro.diagnostico, "Diagnóstico corregido");
    assert.equal(registro.decision_medicamentos, "Requiere");
    assert.equal(registro.version_prescripciones, 3);
});

test("IDs, diagnóstico y cuerpos inválidos se rechazan sin consultar modelos", async () => {
    for (const id of ["0", "-1", "01", "abc", "1.5", "2147483648"]) assert.equal((await request("PUT", body(), id)).status, 400);
    for (const data of [null, [], {}, body({ diagnostico: "" }), body({ diagnostico: "  " }), body({ diagnostico: null }), body({ diagnostico: 1 }), body({ revision: "incorrecta" }), { diagnostico: "Prueba" }]) {
        assert.equal((await request("PUT", data)).status, 400);
    }
    assert.equal((await request("PUT")).status, 400);
    assert.equal(consultas.length, 0);
});

test("rechaza propiedades inesperadas y todos los campos de identidad o estado", async () => {
    for (const campo of ["cita_id", "medico_id", "paciente_id", "estado_id", "id_diagnostico", "fecha_diagnostico", "decision_medicamentos", "version_prescripciones", "prescripciones", "otro"]) {
        assert.equal((await request("PUT", body({ [campo]: 1 }))).status, 400);
    }
    assert.equal(consultas.length, 0);
});

test("valida límites y escalas decimales sin redondear ni inventar rangos clínicos", () => {
    for (const [campo, validos, invalidos] of [
        ["temperatura", ["999.9", "-999.9", 0], ["1000.0", "1.11", true, "NaN", Infinity]],
        ["altura", ["99.99", "-99.99", "01.70"], ["100", "1.701", {}, "1e1"]],
        ["peso", ["999.99", "-999.99", 70.5], ["1000", "70.555", [], "kg"]]
    ]) {
        for (const valor of validos) assert(!validarDiagnostico(body({ [campo]: valor })).error);
        for (const valor of invalidos) assert(validarDiagnostico(body({ [campo]: valor })).error);
    }
    for (const value of [0, "-2147483648", 2147483647]) assert(!validarDiagnostico(body({ frecuencia_cardiaca: value })).error);
    for (const value of [2147483648, -2147483649, 1.5, true, {}, "80 lpm"]) assert(validarDiagnostico(body({ frecuencia_cardiaca: value })).error);
});

test("TEXT usa límite UTF-8 y presión usa dos enteros separados por barra, máximo 20 caracteres", () => {
    for (const campo of ["diagnostico", "sintomas", "tratamiento", "notas_adicionales"]) {
        assert(!validarDiagnostico(body({ [campo]: "x".repeat(65535) })).error);
        assert(validarDiagnostico(body({ [campo]: "x".repeat(65536) })).error);
        assert(validarDiagnostico(body({ [campo]: "😀".repeat(16384) })).error);
    }
    for (const value of ["120/80", "000/000", "1234567890/123456789"]) assert(!validarDiagnostico(body({ presion_arterial: value })).error);
    for (const value of [120, "120-80", "120/80 mmHg", "a/b", "1234567890/1234567890"]) assert(validarDiagnostico(body({ presion_arterial: value })).error);
});

test("opcionales vacíos son null y tipos erróneos no llegan a persistencia", async () => {
    const optional = Object.fromEntries(camposClinicos.filter(campo => campo !== "diagnostico").map(campo => [campo, "   "]));
    const result = await (await request("PUT", body(optional))).json();
    for (const campo of Object.keys(optional)) assert.equal(result.diagnostico[campo], null);
    for (const [campo, value] of [["altura", "1.701"], ["frecuencia_cardiaca", 2.5], ["sintomas", {}], ["notas_adicionales", false], ["tratamiento", "x".repeat(65536)]]) {
        assert.equal((await request("PUT", body({ [campo]: value }))).status, 400);
    }
    assert.equal(creados, 1);
});

test("reenvío de creación y dos pestañas desactualizadas nunca duplican ni sobrescriben", async () => {
    const initial = await (await request("PUT", body())).json();
    assert.equal((await request("PUT", body())).status, 409);
    const first = await request("PUT", body({ revision: initial.revision, diagnostico: "Pestaña A" }));
    assert.equal(first.status, 200);
    assert.equal((await request("PUT", body({ revision: initial.revision, diagnostico: "Pestaña B" }))).status, 409);
    assert.equal(registro.diagnostico, "Pestaña A");
    assert.equal(creados, 1);
});

test("guardados concurrentes serializados comparan revisión dentro de la transacción", async () => {
    const creation = await Promise.all([request("PUT", body()), request("PUT", body())]);
    assert.deepEqual(creation.map(res => res.status).sort(), [201, 409]);
    const initial = await (await request()).json();
    const editions = await Promise.all([
        request("PUT", body({ revision: initial.revision, diagnostico: "Primero" })),
        request("PUT", body({ revision: initial.revision, diagnostico: "Segundo" }))
    ]);
    assert.deepEqual(editions.map(res => res.status).sort(), [200, 409]);
    assert.equal(creados, 1); assert.equal(actualizados, 1);
});

test("revisión es determinista ante formato DECIMAL y cambia con cualquier campo persistido", () => {
    const base = { id_diagnostico: 80, cita_id: 20, fecha_diagnostico: new Date("2026-11-10T05:01:00Z"), diagnostico: "Prueba", peso: "70.50" };
    assert.equal(revisionDiagnostico(base), revisionDiagnostico({ ...base, peso: 70.5 }));
    for (const campo of camposClinicos) assert.notEqual(revisionDiagnostico(base), revisionDiagnostico({ ...base, [campo]: campo === "peso" ? "71.50" : campo === "frecuencia_cardiaca" ? 81 : ["temperatura", "altura"].includes(campo) ? "1" : "Otro texto" }));
});

test("fallos de creación, edición y commit revierten datos sin registrar texto clínico", async () => {
    for (const tipo of ["crear", "commit"]) {
        fallo = tipo;
        assert.equal((await request("PUT", body())).status, 500);
        assert.equal(registro, null);
        assert.equal(consultas.at(-1), "rollback");
    }
    fallo = null;
    const initial = await (await request("PUT", body())).json();
    fallo = "editar";
    assert.equal((await request("PUT", body({ revision: initial.revision, diagnostico: "Cambio sensible" }))).status, 500);
    assert.equal(registro.diagnostico, initial.diagnostico.diagnostico);
    assert(logs.every(args => args.length === 1 && args[0] === "Error al consultar o guardar el diagnóstico médico"));
});

test("violación de unicidad se transforma en conflicto controlado", async () => {
    fallo = "unique";
    assert.equal((await request("PUT", body())).status, 409);
    assert.equal(registro, null);
    assert.equal(logs.length, 0);
});

test("guardar y finalizar son operaciones separadas; después de completar ya no puede editarse", async () => {
    const completion = () => fetch(`${base}/medico/citas/20/estado`, {
        method: "PATCH", headers: { "Content-Type": "application/json", cookie: `_token=${jwt.sign({ id: 7 }, process.env.JWT_SECRET)}` },
        body: JSON.stringify({ estado_id: 84 })
    });
    assert.equal((await completion()).status, 409);
    assert.equal(cita.estado_id, 73);
    const saved = await (await request("PUT", body())).json();
    assert.equal(cita.estado_id, 73);
    assert.equal((await completion()).status, 200);
    assert.equal(cita.estado_id, 84);
    assert.equal((await request("PUT", body({ revision: saved.revision, diagnostico: "Edición posterior" }))).status, 409);
    assert.equal(registro.diagnostico, saved.diagnostico.diagnostico);
});
