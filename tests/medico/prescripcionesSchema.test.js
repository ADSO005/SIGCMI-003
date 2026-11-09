import { test, mock } from "node:test";
import assert from "node:assert/strict";

let definition;
const dbMock = {
    define(nombre, atributos, opciones) {
        definition = { nombre, atributos, opciones };
        return definition;
    }
};

mock.module(new URL("../../config/db.js", import.meta.url).href, { defaultExport: dbMock });
const { default: Diagnostico } = await import("../../models/Diagnostico.js");
const { default: migracion } = await import("../../migrations/20261109000100-prescription-decision-and-version.js");

test("Diagnostico define los valores por defecto y restricciones de las columnas nuevas", () => {
    assert.equal(Diagnostico, definition);
    const decision = definition.atributos.decision_medicamentos;
    assert.equal(decision.allowNull, false);
    assert.equal(decision.defaultValue, "Pendiente");
    assert.deepEqual(decision.type.values, ["Pendiente", "Requiere", "No requiere"]);
    assert.deepEqual(decision.validate.isIn, [["Pendiente", "Requiere", "No requiere"]]);

    const version = definition.atributos.version_prescripciones;
    assert.equal(version.allowNull, false);
    assert.equal(version.defaultValue, 0);
    assert.match(version.type.toString(), /UNSIGNED/);
    assert.equal(version.validate.isInt, true);
    assert.equal(version.validate.min, 0);
    assert.equal(version.validate.max, 4294967295);
    assert.equal(definition.opciones.tableName, "diagnosticos");
});

test("la migración incremental agrega solo las dos columnas con defaults compatibles", async () => {
    const sentencias = [];
    await migracion.up({ sequelize: { query: async sql => { sentencias.push(sql); } } });
    assert.equal(sentencias.length, 1);
    assert.match(sentencias[0], /ALTER TABLE `diagnosticos`/);
    assert.match(sentencias[0], /decision_medicamentos` ENUM\('Pendiente', 'Requiere', 'No requiere'\) NOT NULL DEFAULT 'Pendiente'/);
    assert.match(sentencias[0], /version_prescripciones` INT UNSIGNED NOT NULL DEFAULT 0/);
    assert.doesNotMatch(sentencias[0], /CREATE TABLE|DROP TABLE|INSERT|UPDATE|DELETE/);
});

test("la reversión conserva columnas cuando ya guardan datos clínicos", async () => {
    const sentencias = [];
    await assert.rejects(() => migracion.down({ sequelize: { query: async sql => {
        sentencias.push(sql);
        if (/SELECT COUNT/.test(sql)) return [[{ cambios: "1" }], {}];
        return [[], {}];
    } } }), /no se pueden retirar columnas/i);
    assert.equal(sentencias.length, 1);
    assert.match(sentencias[0], /SELECT COUNT/);
});

test("la reversión solo retira las columnas si conservan los valores iniciales", async () => {
    const sentencias = [];
    await migracion.down({ sequelize: { query: async sql => {
        sentencias.push(sql);
        return /SELECT COUNT/.test(sql) ? [[{ cambios: "0" }], {}] : [[], {}];
    } } });
    assert.equal(sentencias.length, 2);
    assert.match(sentencias[1], /DROP COLUMN `version_prescripciones`/);
    assert.match(sentencias[1], /DROP COLUMN `decision_medicamentos`/);
});
