import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Clave AES-256: WHATSAPP_ENCRYPTION_KEY o, en su defecto, derivada de JWT_SECRET.
const clave = () => {
    const base = process.env.WHATSAPP_ENCRYPTION_KEY || process.env.JWT_SECRET;
    if (!base) throw new Error("Falta WHATSAPP_ENCRYPTION_KEY (o JWT_SECRET) para cifrar credenciales.");
    return createHash("sha256").update(base).digest();
};

export const cifrar = (texto) => {
    if (!texto) return null;
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", clave(), iv);
    const datos = Buffer.concat([cipher.update(String(texto), "utf8"), cipher.final()]);
    return [iv, cipher.getAuthTag(), datos].map((b) => b.toString("base64")).join(".");
};

export const descifrar = (valor) => {
    if (!valor) return null;
    const [iv, tag, datos] = valor.split(".").map((p) => Buffer.from(p, "base64"));
    const decipher = createDecipheriv("aes-256-gcm", clave(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(datos), decipher.final()]).toString("utf8");
};
