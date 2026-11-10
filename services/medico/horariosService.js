import { createHash } from "node:crypto";

const plano = h => h.get ? h.get({ plain: true }) : h;
export function revisionHorarios(horarios) {
    const rows = horarios.map(plano).map(h => [h.id_horario, h.dia_semana, h.hora_inicio, h.hora_fin, h.estado, h.aprobado_por, h.fecha_creacion])
        .sort((a, b) => a[0] - b[0]);
    return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}
