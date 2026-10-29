import express from "express";
import auth from "../../middleware/auth.js";
import role from "../../middleware/role.js";
import { listarHorarios, guardarHorarios } from "../../controllers/medico/horariosController.js";
import {dashboard, detallePaciente, actualizarEstadoCita} from "../../controllers/medico/medicoController.js";

const router = express.Router();

router.get("/horarios",auth, role(2), listarHorarios);

router.put("/horarios", auth, role(2), guardarHorarios);

router.get("/dashboard", auth, role(2), dashboard);

router.get("/pacientes/:id", auth, role(2),detallePaciente);

router.patch("/citas/:id/estado", auth, role(2), actualizarEstadoCita);

export default router;
