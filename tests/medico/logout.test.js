import { after, before, mock, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import pug from "pug";

// Se usan rutas, logout y middleware reales, sin cargar modelos ni conectar MySQL.
const prohibido = () => { throw new Error("Esta prueba no permite acceder a MySQL ni enviar correos"); };
let lecturasUsuario = 0;
const usuario = {
    findByPk: async id => {
        lecturasUsuario++;
        assert.equal(id, 7);
        return { id_usuario: 7, rol_id: 2, estado: true };
    }
};
for (const nombre of ["Usuario", "Paciente", "RegistroPendiente"]) {
    mock.module(new URL(`../../models/${nombre}.js`, import.meta.url).href, {
        defaultExport: nombre === "Usuario" ? usuario : new Proxy({}, { get: () => prohibido })
    });
}
mock.module(new URL("../../config/db.js", import.meta.url).href, {
    defaultExport: new Proxy({}, { get: () => prohibido })
});
mock.module(new URL("../../services/emailService.js", import.meta.url).href, {
    namedExports: { sendRecoveryEmail: prohibido, sendConfirmationEmail: prohibido }
});
// Los manejadores médicos se sustituyen: solo interesa comprobar su barrera de sesión.
const paginaMedica = (req, res) => res.sendStatus(200);
mock.module(new URL("../../controllers/medico/diagnosticoController.js", import.meta.url).href, {
    namedExports: { obtenerDiagnostico: paginaMedica, guardarDiagnostico: paginaMedica }
});
mock.module(new URL("../../controllers/medico/medicoController.js", import.meta.url).href, {
    namedExports: { dashboard: paginaMedica, detallePaciente: paginaMedica, actualizarEstadoCita: paginaMedica }
});
mock.module(new URL("../../controllers/medico/horariosController.js", import.meta.url).href, {
    namedExports: { listarHorarios: paginaMedica }
});
const { default: authRoutes } = await import("../../routes/auth/userRoutes.js");
const { default: medicoRoutes } = await import("../../routes/medico/medicoRoutes.js");
const secretoAnterior = process.env.JWT_SECRET;
const secretoPrueba = "medical-logout-test-only";
let servidor, base;

before(async () => {
    process.env.JWT_SECRET = secretoPrueba;
    const app = express();
    app.use(express.urlencoded({ extended: true }), cookieParser());
    app.use("/auth", authRoutes);
    app.use("/medico", medicoRoutes);
    servidor = app.listen(0, "127.0.0.1");
    await new Promise(resolve => servidor.once("listening", resolve));
    base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
    await new Promise(resolve => servidor.close(resolve));
    if (secretoAnterior === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = secretoAnterior;
});

const sidebar = () => pug.renderFile("views/viewsMedico/includes/sidebar.pug");

test("el sidebar ofrece un formulario POST accesible y elimina el logout simulado", () => {
    const html = sidebar();
    assert.match(html, /<form[^>]*action="\/auth\/logout"[^>]*method="POST"/);
    assert.match(html, /<button[^>]*type="submit"[^>]*aria-label="Cerrar sesión"/);
    assert.doesNotMatch(html, /cerrarSesion\(/);
    const script = readFileSync("public/medico/js/dashboardMedical.js", "utf8");
    assert.doesNotMatch(script, /cerrarSesion|Sesión cerrada\. Redirigiendo/);
});

test("el formulario real expira la cookie y la siguiente petición médica sin ella requiere login", async () => {
    const cookie = `_token=${jwt.sign({ id: 7 }, secretoPrueba)}`;
    const anterior = await fetch(base + "/medico/dashboard", {
        headers: { cookie }, redirect: "manual"
    });
    assert.equal(anterior.status, 200);
    const lecturasAntes = lecturasUsuario;
    const [, action, method] = sidebar().match(/<form[^>]*action="([^"]+)"[^>]*method="([^"]+)"/);
    const salida = await fetch(base + action, { method, headers: { cookie }, redirect: "manual" });
    assert.equal(salida.status, 302);
    assert.equal(salida.headers.get("location"), "/auth/login");
    const cookieExpirada = salida.headers.get("set-cookie");
    assert.match(cookieExpirada, /^_token=;/);
    assert.match(cookieExpirada, /Path=\//);
    assert(new Date(cookieExpirada.match(/Expires=([^;]+)/)[1]).getTime() < Date.now());
    // El navegador elimina la cookie expirada y no la envía en la siguiente petición.
    const posterior = await fetch(base + "/medico/dashboard", { redirect: "manual" });
    assert.equal(posterior.status, 302);
    assert.equal(posterior.headers.get("location"), "/auth/login");
    assert.equal(lecturasUsuario, lecturasAntes);
});

test("cerrar sesión sin cookie sigue redirigiendo al login sin consultar usuarios", async () => {
    const lecturasAntes = lecturasUsuario;
    const salida = await fetch(base + "/auth/logout", { method: "POST", redirect: "manual" });
    assert.equal(salida.status, 302);
    assert.equal(salida.headers.get("location"), "/auth/login");
    assert.match(salida.headers.get("set-cookie"), /^_token=;/);
    assert.equal(lecturasUsuario, lecturasAntes);
});
