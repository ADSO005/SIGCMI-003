import test from "node:test";
import assert from "node:assert/strict";
import { crearServicioHorarios, revisionHorarios, validarHorarios } from "../../services/medico/horariosService.js";
const franja = (extra = {}) => ({ dia_semana: "Lunes", hora_inicio: "08:00", hora_fin: "12:00", ...extra });
const existente = (extra = {}) => ({ id_horario: 1, medico_id: 9, ...franja(), hora_inicio: "08:00:00", hora_fin: "12:00:00", estado: "Pendiente", aprobado_por: null, fecha_creacion: "2026-01-01", ...extra });
const payload = h => { const { id_horario, dia_semana, hora_inicio, hora_fin } = h; return { ...(id_horario ? { id_horario } : {}), dia_semana, hora_inicio, hora_fin }; };
function fixture(initial = [], citas = []) {
    let rows = structuredClone(initial), failCreate = 0, created = 0;
    const writes = [], profile = { id_medico: 9 }, tx = { LOCK: { UPDATE: "UPDATE" } };
    const scoped = o => { assert.equal(o.transaction, tx); assert.equal(o.where.medico_id, 9); };
    const dependencies = {
        db: { transaction: async cb => { const backup = structuredClone(rows); try { return await cb(tx); } catch (e) { rows = backup; throw e; } } },
        Medico: { findOne: async o => { assert.equal(o.where.usuario_id, 7); assert.equal(o.lock, "UPDATE"); return profile; } },
        Horario: {
            findAll: async o => { scoped(o); assert.equal(o.lock, "UPDATE"); return structuredClone(rows.filter(r => r.medico_id === 9)); },
            create: async (data, o) => { assert.equal(o.transaction, tx); writes.push("create"); if (++created === failCreate) throw Error("Fallo simulado"); rows.push({ ...data, id_horario: 100 + created, fecha_creacion: "2026-01-01" }); },
            update: async (data, o) => { scoped(o); assert.equal(o.where.estado, "Pendiente"); assert.equal(o.where.aprobado_por, null); writes.push("update"); const row = rows.find(r => r.id_horario === o.where.id_horario && r.medico_id === 9); if (!row) return [0]; Object.assign(row, data); return [1]; },
            destroy: async o => { scoped(o); assert.equal(o.where.estado, "Pendiente"); assert.equal(o.where.aprobado_por, null); writes.push("destroy"); const n = rows.length; rows = rows.filter(r => !(r.id_horario === o.where.id_horario && r.medico_id === 9)); return n - rows.length; }
        },
        Cita: { findAll: async o => { scoped(o); return citas; } },
        ahora: () => ({ fecha: "2026-10-22", hora: "10:00:00" })
    };
    return { save: crearServicioHorarios(dependencies), rows: () => rows, writes, body: horarios => ({ horarios, revision: revisionHorarios(rows.filter(r => r.medico_id === 9)) }), fail: () => { failCreate = 2; } };
}
test("guarda varias franjas y persisten en una lectura posterior; sin descanso de 30 minutos", async () => {
    const f = fixture(); const result = await f.save(7, f.body([franja({ hora_fin: "10:00" }), franja({ hora_inicio: "10:00" }), franja({ dia_semana: "Martes" })]));
    assert.equal(result.creados, 3); assert.equal(f.rows().length, 3); assert(f.rows().every(h => h.estado === "Pendiente" && h.aprobado_por === null && h.medico_id === 9));
});
test("rechaza días, formatos, rangos invertidos y campos de autoridad", async () => {
    for (const h of [franja({ dia_semana: "Miercoles<script>" }), franja({ hora_inicio: "25:00" }), franja({ hora_fin: "07:00" }), franja({ medico_id: 42 }), franja({ estado: "Aprobado" }), franja({ aprobado_por: 1 })]) {
        const f = fixture(); await assert.rejects(f.save(7, f.body([h])), e => e.status === 400); assert.equal(f.writes.length, 0);
    }
});
test("rechaza duplicados, solapamientos y IDs repetidos", async () => {
    for (const h of [[franja(), franja()], [franja(), franja({ hora_inicio: "11:00", hora_fin: "13:00" })], [payload(existente()), payload(existente())]]) {
        const f = fixture([existente()]); await assert.rejects(f.save(7, f.body(h)), e => e.status === 400); assert.equal(f.writes.length, 0);
    }
});
test("sesión ausente no consulta ni modifica", async () => { const f = fixture(); await assert.rejects(f.save(undefined, f.body([])), e => e.status === 401); assert.equal(f.writes.length, 0); });
test("ID ajeno o inexistente se rechaza sin tocar ningún registro", async () => { const f = fixture([existente({ id_horario: 22, medico_id: 10 })]); await assert.rejects(f.save(7, f.body([payload(existente({ id_horario: 22 }))])), e => e.status === 403); assert.equal(f.rows()[0].medico_id, 10); assert.equal(f.writes.length, 0); });
test("conserva aprobación y rechazados: omisión o cambio genera conflicto", async () => {
    for (const estado of ["Aprobado", "Rechazado"]) for (const mode of ["omitido", "editado"]) {
        const f = fixture([existente({ estado, aprobado_por: 1 })]); const h = mode === "omitido" ? [] : [payload(existente({ hora_fin: "13:00" }))];
        await assert.rejects(f.save(7, f.body(h)), e => e.status === 409); assert.equal(f.rows()[0].estado, estado); assert.equal(f.writes.length, 0);
    }
});
test("no reescribe aprobaciones y crea únicamente lo nuevo", async () => {
    const row = existente({ estado: "Aprobado", aprobado_por: 1 }); const f = fixture([row]); await f.save(7, f.body([payload(row), franja({ dia_semana: "Martes" })])); assert.deepEqual(f.rows()[0], row); assert.deepEqual(f.writes, ["create"]);
});
test("rechazados preservados no reservan una franja", async () => { const row = existente({ estado: "Rechazado", aprobado_por: 1 }); const f = fixture([row]); await f.save(7, f.body([payload(row), franja()])); assert.equal(f.rows().length, 2); assert.equal(f.rows()[0].estado, "Rechazado"); });
test("actualiza y retira pendientes únicamente, conservando IDs sin cambios", async () => {
    const f = fixture([existente(), existente({ id_horario: 2, dia_semana: "Martes" })]); const r = await f.save(7, f.body([payload(existente({ hora_fin: "11:00" }))])); assert.equal(r.actualizados, 1); assert.equal(r.eliminados, 1); assert.equal(f.rows()[0].id_horario, 1);
});
test("no elimina ni altera una franja con una cita futura", async () => { for (const horarios of [[], [payload(existente({ hora_fin: "11:00" }))]]) { const f = fixture([existente()], [{ fecha: "2026-10-26", hora: "09:00:00" }]); await assert.rejects(f.save(7, f.body(horarios)), e => e.status === 409); assert.equal(f.writes.length, 0); } });
test("revisión desactualizada devuelve conflicto sin escrituras", async () => { const f = fixture([existente()]); await assert.rejects(f.save(7, { horarios: [], revision: revisionHorarios([]) }), e => e.status === 409); assert.equal(f.writes.length, 0); });
test("rollback de todas las inserciones ante fallo intermedio", async () => { const f = fixture(); f.fail(); await assert.rejects(f.save(7, f.body([franja(), franja({ dia_semana: "Martes" })]))); assert.equal(f.rows().length, 0); });
test("configuración idéntica es idempotente y no escribe", async () => { const f = fixture([existente()]); assert.deepEqual(await f.save(7, f.body([payload(existente())])), { creados: 0, actualizados: 0, eliminados: 0 }); assert.equal(f.writes.length, 0); });
test("segundos existentes se conservan; revisiones cambian al aprobar", () => { const h = existente({ hora_inicio: "08:00:30" }); assert.equal(validarHorarios([payload(h)])[0].hora_inicio, "08:00:30"); assert.notEqual(revisionHorarios([h]), revisionHorarios([{ ...h, estado: "Aprobado", aprobado_por: 1 }])); });
