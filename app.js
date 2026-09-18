import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import userRoutes from './routes/dashboardMedical/userRoutes.js';

// Recrear __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar Express
const app = express();

// Configurar Pug como motor de vistas
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Carpeta pública
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares para lectura de datos (Forms / JSON)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Definición de Rutas Directas
app.get('/', (req, res) => {
  res.render('auth/login', { title: 'Inicio - Sistema Médico' });
});

app.get('/dashboard', (req, res) => {
  res.render('dashboardMedical/viewsMedico/dashboardMedical', { title: 'Dashboard - Sistema Médico' });
});

app.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Iniciar Sesión' });
});

app.get('/registro', (req, res) => {
  res.render('auth/register', { title: 'Crear Cuenta' });
});

app.get('/recover-password', (req, res) => {
  res.render('auth/recover-password', { title: 'Recuperar Contraseña' });
});

app.post('/login', (req, res) => {
  // Nota: Aquí posteriormente irá la lógica de autenticación (JWT/Sessions)
  res.redirect('/dashboard');
});

// Usar el enrutador modularizado si manejas subrutas en userRoutes
app.use('/users', userRoutes);

export default app;
