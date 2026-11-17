import { createHash } from "node:crypto";

const escalas = { temperatura: [4, 1], altura: [4, 2], peso: [5, 2] };
export const camposClinicos = ["diagnostico", "sintomas", "tratamiento", "notas_adicionales",
    "temperatura", "altura", "peso", "frecuencia_cardiaca", "presion_arterial"];

export function textoDiagnosticoValido(value) {
    return typeof value === "string" && value.trim().length > 0 && Buffer.byteLength(value, "utf8") <= 65535;
}

export function validarDiagnostico(cuerpo) {
    if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo)
        || Object.keys(cuerpo).some(campo => ![...camposClinicos, "revision"].includes(campo))) {
        return { error: "Envía únicamente los campos clínicos permitidos y revision" };
    }
    if (!Object.hasOwn(cuerpo, "revision") || (cuerpo.revision !== null
        && (typeof cuerpo.revision !== "string" || !/^[a-f0-9]{64}$/.test(cuerpo.revision)))) {
        return { error: "Envía la revisión obtenida al consultar el diagnóstico, o null para crear" };
    }
    if (!textoDiagnosticoValido(cuerpo.diagnostico)) return { error: "El diagnóstico es obligatorio y no debe superar 65535 bytes UTF-8" };
    const datos = {};
    for (const campo of camposClinicos) {
        const valor = cuerpo[campo];
        if (valor === undefined || valor === null || (typeof valor === "string" && !valor.trim())) {
            datos[campo] = null;
            continue;
        }
        if (Object.hasOwn(escalas, campo)) {
            if (!["number", "string"].includes(typeof valor)) return { error: `${campo} debe ser decimal` };
            const texto = String(valor).trim();
            const partes = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(texto);
            const [precision, escala] = escalas[campo];
            if (!partes || partes[2].replace(/^0+/, "").length > precision - escala
                || (partes[3] || "").length > escala) return { error: `${campo} debe respetar DECIMAL(${precision},${escala})` };
            datos[campo] = Number(texto).toFixed(escala);
        } else if (campo === "frecuencia_cardiaca") {
            if (!["number", "string"].includes(typeof valor) || !/^[+-]?\d+$/.test(String(valor).trim())
                || !Number.isInteger(Number(valor)) || Number(valor) < -2147483648 || Number(valor) > 2147483647) {
                return { error: "frecuencia_cardiaca debe ser un entero de 32 bits" };
            }
            datos[campo] = Number(valor);
        } else {
            if (typeof valor !== "string") return { error: `${campo} debe ser texto` };
            const texto = valor.trim();
            if (campo === "presion_arterial") {
                if (texto.length > 20 || !/^\d+\s*\/\s*\d+$/.test(texto)) return { error: "presion_arterial debe tener formato sistólica/diastólica y máximo 20 caracteres" };
                datos[campo] = texto.replace(/\s*\/\s*/, "/");
            } else {
                if (Buffer.byteLength(texto, "utf8") > 65535) return { error: `${campo} supera 65535 bytes UTF-8` };
                datos[campo] = texto;
            }
        }
    }
    return { datos, revision: cuerpo.revision };
}

// Un orden estable y decimales canónicos evitan revisiones distintas por el formato del ORM.
export function datosDiagnostico(registro) {
    if (!registro) return null;
    const datos = { id_diagnostico: registro.id_diagnostico, cita_id: registro.cita_id,
        fecha_diagnostico: registro.fecha_diagnostico ? new Date(registro.fecha_diagnostico).toISOString() : null };
    for (const campo of camposClinicos) {
        const valor = registro[campo] ?? null;
        datos[campo] = valor === null ? null : Object.hasOwn(escalas, campo) ? Number(valor).toFixed(escalas[campo][1])
            : campo === "frecuencia_cardiaca" ? Number(valor) : valor;
    }
    return datos;
}

export function revisionDiagnostico(registro) {
    return registro ? createHash("sha256").update(JSON.stringify(datosDiagnostico(registro))).digest("hex") : null;
}
