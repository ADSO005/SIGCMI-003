import Medico from "../../models/Medico.js";

const dashboard = async (req, res) => {

    try {

        const medico = await Medico.findOne({
            where: {
                usuario_id: req.usuario.id_usuario
            }
        });

        if (!medico) {
            return res.status(404).send("No se encontró el perfil del médico");
        }

        console.log("Usuario autenticado:", req.usuario.id_usuario);
        console.log("Médico encontrado:", medico.id_medico);

        res.render("dashboardMedical/viewsMedico/dashboardMedical", {
            usuario: req.usuario,
            medico
        });

    } catch (error) {

        console.error("❌ Error al cargar dashboard médico:", error);

        res.status(500).send("Error al cargar el dashboard");

    }

};

export {
    dashboard
};