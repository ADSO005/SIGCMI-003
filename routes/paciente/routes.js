import express from 'express';
import * as pacienteController from '../../controllers/paciente/controller.js';

const router = express.Router();

// Dashboard del paciente
router.get('/dashboard', pacienteController.mostrarDashboard);

// Perfil del paciente
router.get('/perfil', pacienteController.mostrarPerfil);

export default router;