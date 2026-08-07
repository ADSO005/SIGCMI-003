import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import pacienteRoutes from './routes/paciente/routes.js';

const app = express();

// Reemplazo de __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/paciente', pacienteRoutes);

export default app;