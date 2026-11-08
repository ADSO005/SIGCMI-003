import test from "node:test";
import assert from "node:assert/strict";
import { revisionHorarios } from "../../services/medico/horariosService.js";

const horario = {
    id_horario: 1, dia_semana: "Lunes", hora_inicio: "08:00:00", hora_fin: "12:00:00",
    estado: "Aprobado", aprobado_por: 3, fecha_creacion: "2026-11-07T12:00:00.000Z"
};

test("la revisión vacía conserva el hash público existente", () => {
    assert.equal(revisionHorarios([]), "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945");
});

test("la revisión admite registros Sequelize y no depende del orden ni modifica los datos", () => {
    const segundo = { ...horario, id_horario: 2, dia_semana: "Martes" };
    const filas = [segundo, horario];
    const copia = structuredClone(filas);
    const esperado = revisionHorarios([horario, segundo]);
    assert.equal(revisionHorarios(filas), esperado);
    assert.equal(revisionHorarios(filas.map(fila => ({
        get(options) { assert.deepEqual(options, { plain: true }); return fila; }
    }))), esperado);
    assert.deepEqual(filas, copia);
});

test("cambios en los campos publicados o de aprobación alteran la revisión", () => {
    const original = revisionHorarios([horario]);
    for (const cambio of [
        { id_horario: 2 }, { dia_semana: "Martes" }, { hora_inicio: "09:00:00" },
        { hora_fin: "13:00:00" }, { estado: "Rechazado" }, { aprobado_por: 4 },
        { fecha_creacion: "2026-11-08T12:00:00.000Z" }
    ]) assert.notEqual(revisionHorarios([{ ...horario, ...cambio }]), original);
});
