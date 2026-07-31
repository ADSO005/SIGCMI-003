import express from 'express'
import userRoutes from "./routes/userRoutes.js";
import db from "./config/db.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config();
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set('view engine', 'pug');
app.set('views', './views');

app.use("/", userRoutes);


try {
    await db.authenticate();
    console.log("✅ Conexión a la base de datos establecida.");
} catch (error) {
    console.error("❌ Error al conectar con la base de datos:");
    console.error(error);
}

app.listen(3000, () => {
    console.log("Servidor funcionando en el puerto 3000");
});


