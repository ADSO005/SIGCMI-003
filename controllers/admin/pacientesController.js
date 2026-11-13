import db from "../../config/db.js";
import Usuario from "../../models/Usuario.js";
import Paciente from "../../models/Paciente.js";

// =====================================================
// LISTAR PACIENTES
// =====================================================

export const listarPacientes = async (req, res) => {
    try {
        const pacientes = await Paciente.findAll({
            include: [
                {
                    model: Usuario,
                    attributes: [
                        "id_usuario",
                        "nombres",
                        "apellidos",
                        "correo",
                        "telefono",
                        "tipo_documento",
                        "numero_documento",
                        "estado",
                        "fecha_registro"
                    ]
                }
            ],
            order: [
                ["id_paciente", "DESC"]
            ]
        });

        const pacientesLista = pacientes.map((paciente) => ({
            id: paciente.id_paciente,

            usuarioId: paciente.usuario_id,

            nombre: paciente.Usuario
                ? `${paciente.Usuario.nombres} ${paciente.Usuario.apellidos}`
                : "Sin nombre",

            correo: paciente.Usuario?.correo || "",

            telefono: paciente.Usuario?.telefono || "",

            tipoDocumento:
                paciente.Usuario?.tipo_documento || "",

            documento:
                paciente.Usuario?.numero_documento || "",

            fechaNacimiento:
                paciente.fecha_nacimiento || "",

            tipoSangre:
                paciente.tipo_sangre || "",

            alergias:
                paciente.alergias || "",

            condicionesMedicas:
                paciente.condiciones_medicas || "",

            direccion:
                paciente.direccion || "",

            departamento:
                paciente.departamento || "",

            ciudad:
                paciente.ciudad || "",

            estado:
                paciente.Usuario?.estado ?? false,

            fechaRegistro:
                paciente.Usuario?.fecha_registro || null
        }));

        const totalPacientes = pacientesLista.length;

        const pacientesActivos = pacientesLista.filter(
            (paciente) => paciente.estado === true
        ).length;

        const pacientesInactivos =
            pacientesLista.filter(
                (paciente) => paciente.estado === false
            ).length;

        res.render("viewsAdmin/pacientes/index", {
            usuarios: req.usuario,
            pacientesLista,
            totalPacientes,
            pacientesActivos,
            pacientesInactivos
        });

    } catch (error) {

        console.error(
            "Error al listar pacientes:",
            error
        );

        res.status(500).send(
            "Error al cargar la gestión de pacientes."
        );
    }
};

// =====================================================
// OBTENER PACIENTE
// =====================================================

export const obtenerPaciente = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({
                ok: false,
                mensaje: "El ID del paciente no es válido."
            });
        }

        const paciente = await Paciente.findByPk(id, {
            include: [
                {
                    model: Usuario,
                    attributes: [
                        "id_usuario",
                        "nombres",
                        "apellidos",
                        "correo",
                        "telefono",
                        "tipo_documento",
                        "numero_documento",
                        "estado",
                        "fecha_registro"
                    ]
                }
            ]
        });

        if (!paciente) {
            return res.status(404).json({
                ok: false,
                mensaje: "Paciente no encontrado."
            });
        }

        return res.json({
            ok: true,
            paciente
        });

    } catch (error) {
        console.error(
            "Error al obtener paciente:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje: "Error al obtener el paciente."
        });
    }
};

