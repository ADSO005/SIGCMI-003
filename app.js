import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import userRoutes from "./routes/dashboardMedical/userRoutes.js";
import "dotenv/config";
import pacienteRoutes from "./routes/paciente/routes.js";
import authRoutes from "./routes/paciente/authRoutes.js";
import dashboardRoutes from "./routes/admin/dashboardRoutes.js";

// Recrear __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar Express
const app = express();

// Configurar Pug como motor de vistas
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Carpeta pública
app.use(express.static(path.join(__dirname, "public")));

// Middlewares para leer formularios y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// =====================================================
// RUTAS DE VISTAS
// =====================================================

// Página principal → Login
app.get("/", (req, res) => {
    res.render("dashboardMedical/auth/login", {
        title: "Inicio - Sistema Médico"
    });
});

// Login
app.get("/login", (req, res) => {
    res.render("dashboardMedical/auth/login", {
        title: "Iniciar Sesión"
    });
});

// Registro
app.get("/auth/registro", (req, res) => {
    res.render("viewsPaciente/register", {
        title: "Registro de Paciente"
    });
});

// Recuperar contraseña
app.get("/recover-password", (req, res) => {
    res.render("dashboardMedical/auth/recover-password", {
        title: "Recuperar Contraseña"
    });
});

// Dashboard médico
app.get("/dashboard", (req, res) => {
    res.render("dashboardMedical/viewsMedico/dashboardMedical", {
        title: "Dashboard - Sistema Médico"
    });
});


// =====================================================
// LOGIN
// =====================================================

app.post("/login", (req, res) => {

    // Aquí posteriormente irá la lógica real
    // de autenticación con JWT / sesiones.

    console.log("Datos recibidos:", req.body);

    res.redirect("/dashboard");
});


// =====================================================
// RUTAS MODULARIZADAS
// =====================================================

// Usuarios
app.use("/users", userRoutes);

// Autenticación
app.use("/auth", authRoutes);

// Administrador
app.use("/admin", dashboardRoutes);

// Pacientes
app.use("/paciente", pacienteRoutes);

// Perfil
app.use("/perfil", pacienteRoutes);


// =====================================================
// EXPORTAR APP
// =====================================================

export default app;