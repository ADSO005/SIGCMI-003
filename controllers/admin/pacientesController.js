import db from "../../config/db.js";
import Usuario from "../../models/Usuario.js";
import Paciente from "../../models/Paciente.js";

export const mostrarFormularioPaciente = (req, res) => {
    res.render("viewsAdmin/pacientes/registrar", {
        titulo: "Registrar Paciente",
        usuarios: req.usuario
    });
};

export const registrarPaciente = async (req, res) => {
    try {
        // La lógica de registro la agregaremos paso a paso.
        return res.send("Ruta de registro de paciente funcionando");
    } catch (error) {
        console.error("Error al registrar paciente:", error);
        return res.status(500).send(
            "Error interno al registrar paciente"
        );
    }
};