import app from "./app.js";
import db from "./config/db.js";
import asociarModelos from "./models/asociaciones.js";

// Registrar todas las asociaciones de Sequelize
asociarModelos();

try {

    // Conectar con la base de datos
    await db.authenticate();

    console.log("✅ Base de datos conectada correctamente");

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    });

} catch (error) {

    console.error("❌ Error al conectar la base de datos");
    console.error(error);

}
