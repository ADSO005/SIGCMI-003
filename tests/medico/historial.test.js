import { after, before, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

// Adaptación de las pruebas de historial de feature/MedicalConexion.
// Este DOM simulado impide interpretar HTML y permite comprobar la estructura visual.
class Element {
    constructor(tag) { this.tagName = tag; this.children = []; }
    appendChild(node) { this.children.push(node); }
    replaceChildren() { this.children = []; }
    set innerHTML(value) { throw Error("No se permite insertar HTML: " + value); }
}
function historialFixture() {
    const root = new Element("div");
    const source = readFileSync("public/medico/js/dashboardMedical.js", "utf8");
    const context = {
        document: {
            getElementById: id => { assert.equal(id, "historialPaciente"); return root; },
            createElement: tag => new Element(tag)
        }
    };
    vm.createContext(context);
    vm.runInContext(source.slice(source.indexOf("function mostrarHistorial("), source.indexOf("// FILTRAR PACIENTES")), context);
    return { root, render: context.mostrarHistorial };
}

test("HTML y JavaScript clínicos permanecen como texto en la estructura original", () => {
    for (const payload of ["<script>alert(1)</script>", '<img src=x onerror="alert(1)">', '<svg onload="alert(1)"></svg>', "&lt;b&gt;texto&lt;/b&gt;"]) {
        const f = historialFixture();
        f.render([{ fecha: "2026-11-07", Diagnostico: { diagnostico: payload, sintomas: payload, tratamiento: payload } }]);
        const card = f.root.children[0];
        assert.equal(card.className, "historial-card");
        assert.deepEqual(card.children.map(node => node.tagName), ["h4", "p", "p", "p", "p", "p"]);
        for (const index of [0, 3, 5]) assert.equal(card.children[index].textContent, payload);
        assert.equal(card.children[1].className, "historial-fecha");
        assert.equal(card.children[1].textContent, new Date("2026-11-07T00:00:00").toLocaleDateString("es-CO"));
        assert.equal(card.children[2].children[0].tagName, "strong");
        assert.equal(card.children[2].children[0].textContent, "Síntomas:");
        assert.equal(card.children[4].children[0].textContent, "Tratamiento:");
        assert(card.children.every(node => node.children.length === (node === card.children[2] || node === card.children[4] ? 1 : 0)));
    }
});

test("el historial conserva valores por defecto y limpia datos al mostrar un estado vacío", () => {
    const f = historialFixture();
    f.render([{ fecha: "2026-11-07", Diagnostico: {} }, { Diagnostico: null }]);
    assert.equal(f.root.children.length, 1);
    const card = f.root.children[0];
    assert.equal(card.children[0].textContent, "Sin diagnóstico");
    assert.equal(card.children[3].textContent, "No registrados");
    assert.equal(card.children[5].textContent, "No registrado");
    for (const citas of [[], [{ Diagnostico: null }]]) {
        f.render(citas);
        assert.equal(f.root.children.length, 1);
        assert.equal(f.root.children[0].tagName, "p");
        assert.equal(f.root.children[0].textContent, "Este paciente no tiene diagnósticos registrados.");
    }
});

// Rutas, middleware y controlador reales; todas las consultas se resuelven en memoria.
let consultas, perfil;
const modelos = {
    Usuario: { findByPk: async id => ({ id_usuario: id, rol_id: id === 7 ? 2 : id, estado: true }) },
    Medico: { findOne: async options => { consultas.push(["medico", options]); return perfil; } },
    Paciente: { findByPk: async id => {
        consultas.push(["paciente", id]);
        return ["5", "6"].includes(id) ? { id_paciente: Number(id), Usuario: { nombres: "Paciente" } } : null;
    } },
    Cita: { findAll: async options => {
        consultas.push(["citas", options]);
        assert.equal(options.where.medico_id, 9);
        return options.where.paciente_id === 5
            ? [{ id_cita: 20, paciente_id: 5, medico_id: 9, Diagnostico: { diagnostico: "Ejemplo", Prescripcions: [] } }]
            : [];
    } },
    Diagnostico: {}, Prescripcion: {}, EstadoCita: {}, Especialidad: {}
};
for (const [nombre, modelo] of Object.entries(modelos)) {
    mock.module(new URL(`../../models/${nombre}.js`, import.meta.url).href, { defaultExport: modelo });
}
mock.module(new URL("../../config/db.js", import.meta.url).href, {
    defaultExport: new Proxy({}, { get() { throw Error("MySQL no está permitido en esta prueba"); } })
});
mock.module(new URL("../../controllers/medico/horariosController.js", import.meta.url).href, {
    namedExports: { listarHorarios() { throw Error("Horarios se verifican en su suite existente"); } }
});
const { default: router } = await import("../../routes/medico/medicoRoutes.js");
const secretoAnterior = process.env.JWT_SECRET;
let servidor, base;
before(async () => {
    process.env.JWT_SECRET = "medical-history-test-only";
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
beforeEach(() => { consultas = []; perfil = { id_medico: 9 }; });
const request = (path, user = 7) => fetch(base + "/medico/pacientes/" + path, {
    redirect: "manual",
    headers: user === null ? {} : { cookie: `_token=${jwt.sign({ id: user }, process.env.JWT_SECRET)}` }
});

test("historial exige sesión y rol médico antes de consultar pacientes", async () => {
    const res = await request("5", null);
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "/auth/login");
    for (const rol of [1, 3]) assert.equal((await request("5", rol)).status, 403);
    assert.equal(consultas.length, 0);
});

test("historial autorizado filtra paciente y médico ignorando identidad del navegador", async () => {
    const res = await request("5?medico_id=42&usuario_id=99");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.paciente.id_paciente, 5);
    assert.equal(body.citas[0].medico_id, 9);
    assert.deepEqual(consultas[0][1].where, { usuario_id: 7 });
    assert.deepEqual(consultas.at(-1)[1].where, { paciente_id: 5, medico_id: 9 });
    assert.equal(consultas.at(-1)[1].include[0].model, modelos.Diagnostico);
    assert.equal(consultas.at(-1)[1].include[0].include[0].model, modelos.Prescripcion);
});

test("paciente ajeno se rechaza sin devolver datos clínicos o personales", async () => {
    const res = await request("6");
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.paciente, undefined);
    assert.equal(body.citas, undefined);
});

test("perfil médico o paciente inexistente conservan el error 404", async () => {
    perfil = null;
    assert.equal((await request("5")).status, 404);
    assert.equal(consultas.length, 1);
    perfil = { id_medico: 9 };
    assert.equal((await request("404")).status, 404);
    assert(!consultas.some(([tipo]) => tipo === "citas"));
});
