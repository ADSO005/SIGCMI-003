import express from "express";

import auth from "../../middleware/auth.js";
import role from "../../middleware/role.js";

import { verDashboard } from "../../controllers/admin/dashboardController.js";

import {
    listarUsuarios,
    cambiarEstadoUsuario
} from "../../controllers/admin/usuariosController.js";

import {
    mostrarFormularioUsuario,
    registrarUsuario,
    mostrarFormularioEditarUsuario,
    actualizarUsuarioCompleto,
    fijarRol,
    ROLES
} from "../../controllers/admin/registrarUsuarioController.js";

import {
    mostrarFormularioNuevaCita,
    obtenerHorasDisponibles,
    crearNuevaCita,
    listarCitas,
    obtenerCita,
    reprogramarCita,
    cancelarCita
} from "../../controllers/admin/citasController.js";

import {
    listarPacientes,
    obtenerPaciente
} from "../../controllers/admin/pacientesController.js";

import {
    listarMedicos,
    obtenerMedico,
    crearHorariosMedico,
    guardarSemanaMedico
} from "../../controllers/admin/medicosController.js";

import {
    listarEspecialidades,
    crearEspecialidad,
    obtenerEspecialidad,
    actualizarEspecialidad,
    eliminarEspecialidad
} from "../../controllers/admin/especialidadesController.js";

import {
    mostrarCalendario
} from "../../controllers/admin/calendarioController.js";
const router = express.Router();

import {
    listarHorarios,
    actualizarHorario,
    actualizarPeriodoHorario,
    eliminarHorario
} from "../../controllers/admin/horariosController.js";


import {
    listarDiagnosticos,
    obtenerDiagnostico
} from "../../controllers/admin/diagnosticosController.js";

import {
    listarPrescripciones,
    obtenerPrescripcion
} from "../../controllers/admin/prescripcionesController.js";


router.get(
    "/dashboard",
    auth,
    role(1),
    verDashboard
);


router.get(
    "/usuarios",
    auth,
    role(1),
    listarUsuarios
);

router.get(
    "/usuarios/nuevo",
    auth,
    role(1),
    mostrarFormularioUsuario
);

router.post(
    "/usuarios/nuevo",
    auth,
    role(1),
    registrarUsuario
);

router.get(
    "/usuarios/:id/editar",
    auth,
    role(1),
    mostrarFormularioEditarUsuario
);

router.post(
    "/usuarios/:id/editar",
    auth,
    role(1),
    actualizarUsuarioCompleto
);

router.patch(
    "/usuarios/:id/estado",
    auth,
    role(1),
    cambiarEstadoUsuario
);


router.get(
    "/pacientes/nuevo",
    auth,
    role(1),
    fijarRol(ROLES.PACIENTE),
    mostrarFormularioUsuario
);

router.post(
    "/pacientes/nuevo",
    auth,
    role(1),
    fijarRol(ROLES.PACIENTE),
    registrarUsuario
);

router.get(
    "/pacientes",
    auth,
    role(1),
    listarPacientes
);

router.get(
    "/pacientes/:id",
    auth,
    role(1),
    obtenerPaciente
);


router.get(
    "/medicos",
    auth,
    role(1),
    listarMedicos
);

router.get(
    "/medicos/:id",
    auth,
    role(1),
    obtenerMedico
);


router.post(
    "/medicos/:id/horarios",
    auth,
    role(1),
    crearHorariosMedico
);

router.put(
    "/medicos/:id/semana",
    auth,
    role(1),
    guardarSemanaMedico
);


router.get(
    "/especialidades",
    auth,
    role(1),
    listarEspecialidades
);

router.post(
    "/especialidades",
    auth,
    role(1),
    crearEspecialidad
);

router.get(
    "/especialidades/:id",
    auth,
    role(1),
    obtenerEspecialidad
)

router.put(
    "/especialidades/:id",
    auth,
    role(1),
    actualizarEspecialidad
);

router.delete(
    "/especialidades/:id",
    auth,
    role(1),
    eliminarEspecialidad
)

router.get(
    "/citas",
    auth,
    role(1),
    listarCitas
);


router.get(
    "/citas/nueva",
    auth,
    role(1),
    mostrarFormularioNuevaCita
);

router.get(
    "/citas/disponibilidad",
    auth,
    role(1),
    obtenerHorasDisponibles
);

router.post(
    "/citas/nueva",
    auth,
    role(1),
    crearNuevaCita
);

router.get(
    "/citas/:id",
    auth,
    role(1),
    obtenerCita
);

router.put(
    "/citas/:id/reprogramar",
    auth,
    role(1),
    reprogramarCita
);

router.put(
    "/citas/:id/cancelar",
    auth,
    role(1),
    cancelarCita
);


router.get(
    "/calendario",
    auth,
    role(1),
    mostrarCalendario
);


router.get(
    "/horarios",
    auth,
    role(1),
    listarHorarios
);

router.put(
    "/horarios/:id",
    auth,
    role(1),
    actualizarHorario
);

router.delete(
    "/horarios",
    auth,
    role(1),
    eliminarHorario
);

router.put(
    "/horarios",
    auth,
    role(1),
    actualizarPeriodoHorario
);


router.get(
    "/diagnosticos",
    auth,
    role(1),
    listarDiagnosticos
);


router.get(
    "/diagnosticos/:id",
    auth,
    role(1),
    obtenerDiagnostico
);


router.get(
    "/prescripciones",
    auth,
    role(1),
    listarPrescripciones
);

router.get(
    "/prescripciones/:id",
    auth,
    role(1),
    obtenerPrescripcion
);
export default router;