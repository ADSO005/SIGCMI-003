import "dotenv/config";

import app from "./app.js";
import db from "./config/db.js";

import userRoutes from "./routes/auth/userRoutes.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import medicoRoutes from "./routes/medico/medicoRoutes.js";
import pacienteRoutes from "./routes/paciente/pacienteRoutes.js";

import asociarModelos from "./models/asociaciones.js";

// =====================================
// ASOCIACIONES DE SEQUELIZE
// =====================================

asociarModelos();

// =====================================
// CONFIGURACIÓN DE VISTAS
// =====================================

app.set("view engine", "pug");
app.set("views", "./views");

// =====================================
// RUTAS
// =====================================

app.use("/auth", userRoutes);
app.use("/admin", adminRoutes);
app.use("/medico", medicoRoutes);
app.use("/paciente", pacienteRoutes);

// =====================================
// SERVIDOR
// =====================================

const PORT = process.env.PORT || 3000;

try {

    // Conectar con la base de datos
    await db.authenticate();

    console.log("✅ Base de datos conectada correctamente");

    app.listen(PORT, () => {
        console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    });

} catch (error) {

    console.error("❌ Error al conectar la base de datos");
    console.error(error);

}