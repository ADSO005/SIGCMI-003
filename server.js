import app from './app.js'
import db from './config/db.js'
import dotenv from 'dotenv'
import userRoutes from "./routes/paciente/userRoutes.js"


app.set('view engine', 'pug');
app.set('views', './views');

app.use("/auth", userRoutes);

const PORT = process.env.PORT || 3000

try {
    await db.authenticate()
    console.log('✅ Base de datos conectada correctamente')
} catch (error) {
    console.log(error)
}

app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`)
})

dotenv.config()