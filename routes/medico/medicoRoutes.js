import express from "express";
import auth from "../../middleware/auth.js";
import role from "../../middleware/role.js";
import { listarHorarios } from "../../controllers/medico/horariosController.js";
import { obtenerDiagnostico, guardarDiagnostico } from "../../controllers/medico/diagnosticoController.js";
import { obtenerMedicamentos, guardarMedicamentosCita } from "../../controllers/medico/prescripcionesController.js";
import {dashboard, detallePaciente, actualizarEstadoCita} from "../../controllers/medico/medicoController.js";


const router = express.Router();



router.get("/horarios",auth, role(2), listarHorarios);


router.get("/dashboard", auth, role(2), dashboard);

router.get("/pacientes/:id", auth, role(2),detallePaciente);

router.patch("/citas/:id/estado", auth, role(2), actualizarEstadoCita);
router.get("/citas/:id/diagnostico", auth, role(2), obtenerDiagnostico);
router.put("/citas/:id/diagnostico", auth, role(2), guardarDiagnostico);
router.get("/citas/:id/medicamentos", auth, role(2), obtenerMedicamentos);
router.put("/citas/:id/medicamentos", auth, role(2), guardarMedicamentosCita);

export default router;
