import "dotenv/config";

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import registerRoutes from "./routes/paciente/registerRoutes.js";

const app = express();

// Equivalente a __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Vistas (Pug) ----
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// ---- Middlewares ----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---- Rutas ----
app.use("/auth", registerRoutes);

// Redirige la raíz al registro
app.get("/", (req, res) => {
    res.redirect("/auth/register");
});

export default app;