import app from "./app.js";
import db from "./config/db.js";

try {
    await db.authenticate();
    console.log("✅ Base de datos conectada correctamente");
} catch (error) {
    console.error(error);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});