import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

import pacienteRoutes from "./routes/paciente/routes.js";
import authRoutes from "./routes/paciente/authRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===============================
// MIDDLEWARES
// ===============================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ===============================
// CONFIGURACIÓN PUG
// ===============================

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// ===============================
// ARCHIVOS ESTÁTICOS
// ===============================

app.use(express.static(path.join(__dirname, "public")));

// ===============================
// RUTAS
// ===============================

app.use("/auth", authRoutes);

app.use("/paciente", pacienteRoutes);

// ===============================
// RUTA PRINCIPAL
// ===============================

app.get("/", (req, res) => {
    res.redirect("/paciente/dashboard");
});

// ===============================
// RUTA NO ENCONTRADA
// ===============================

app.use((req, res) => {
    res.status(404).send("Página no encontrada");
});

export default app;