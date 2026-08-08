import dotenv from 'dotenv'
dotenv.config()

import app from './app.js'
import db from './config/db.js'
import userRoutes from "./routes/auth/userRoutes.js"


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

