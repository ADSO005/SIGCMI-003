import app from "./app.js";
import { sequelize } from "./models/index.js";

const PORT = 3000;

sequelize
  .sync()
  .then(() => {
    console.log("Base de datos sincronizada correctamente");

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error al sincronizar la base de datos:", error);
  });

  