import express from 'express';
import * as pacienteController from '../../controllers/paciente/controller.js';

const router = express.Router();

router.get('/dashboard', pacienteController.mostrarDashboard);

export default router;