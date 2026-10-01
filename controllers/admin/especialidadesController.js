import Especialidad from "../../models/Especialidad.js";
import Medico from "../../models/Medico.js";
import { contieneLenguajeInapropiado } from "../../utils/filtroLenguaje.js";

export const listarEspecialidades = async (req, res) => {
    try {

        const especialidades = await Especialidad.findAll({
            include: [
                {
                    model: Medico,
                    attributes: ["id_medico"],
                    required: false
                }
            ],
            order: [["nombre", "ASC"]]
        });

        const especialidadesLista = especialidades.map((especialidad) => ({
            id_especialidad: especialidad.id_especialidad,
            nombre: especialidad.nombre,
            descripcion: especialidad.descripcion,
            cantidad_medicos: especialidad.Medicos
                ? especialidad.Medicos.length
                : 0
        }));

        res.render("viewsAdmin/especialidades/index", {
            especialidades: especialidadesLista,
            usuarios: req.usuario
        });

    } catch (error) {

        console.error(
            "Error al listar especialidades:",
            error
        );

        res.status(500).send(
            "Error al cargar las especialidades."
        );
    }
};

export const crearEspecialidad = async (req, res) => {
    try {
        let { nombre, descripcion } = req.body;

        // Limpiar espacios
        nombre = nombre?.trim();
        descripcion = descripcion?.trim();

        // ==========================================
        // VALIDAR NOMBRE
        // ==========================================

        if (!nombre) {
            return res.status(400).json({
                ok: false,
                mensaje: "El nombre de la especialidad es obligatorio."
            });
        }

        if (nombre.length < 3) {
            return res.status(400).json({
                ok: false,
                mensaje: "El nombre debe tener al menos 3 caracteres."
            });
        }

        if (nombre.length > 100) {
            return res.status(400).json({
                ok: false,
                mensaje: "El nombre no puede superar los 100 caracteres."
            });
        }

        // ==========================================
        // FILTRO DE LENGUAJE
        // ==========================================

        if (contieneLenguajeInapropiado(nombre)) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "El nombre de la especialidad contiene lenguaje inapropiado."
            });
        }

        if (
            descripcion &&
            contieneLenguajeInapropiado(descripcion)
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "La descripción contiene lenguaje inapropiado."
            });
        }

        // ==========================================
        // VALIDAR DUPLICADO
        // ==========================================

        const especialidadExistente =
            await Especialidad.findOne({
                where: {
                    nombre
                }
            });

        if (especialidadExistente) {
            return res.status(409).json({
                ok: false,
                mensaje:
                    "Ya existe una especialidad con ese nombre."
            });
        }

        // ==========================================
        // CREAR
        // ==========================================

        const especialidad =
            await Especialidad.create({
                nombre,
                descripcion: descripcion || null
            });

        return res.status(201).json({
            ok: true,
            mensaje:
                "Especialidad creada correctamente.",
            especialidad
        });

    } catch (error) {

        console.error(
            "Error al crear especialidad:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje:
                "Error al crear la especialidad."
        });
    }
};

export const actualizarEspecialidad = async (req, res) => {
    try {
        const { id } = req.params;
        let { nombre, descripcion } = req.body;

        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({
                ok: false,
                mensaje: "El ID de la especialidad no es válido."
            });
        }

        nombre = nombre?.trim();
        descripcion = descripcion?.trim();

        if (!nombre) {
            return res.status(400).json({
                ok: false,
                mensaje: "El nombre de la especialidad es obligatorio."
            });
        }

        if (nombre.length < 3) {
            return res.status(400).json({
                ok: false,
                mensaje: "El nombre debe tener al menos 3 caracteres."
            });
        }

        if (nombre.length > 100) {
            return res.status(400).json({
                ok: false,
                mensaje: "El nombre no puede superar los 100 caracteres."
            });
        }

        if (contieneLenguajeInapropiado(nombre)) {
            return res.status(400).json({
                ok: false,
                mensaje: "El nombre de la especialidad contiene lenguaje inapropiado."
            });
        }

        if (
            descripcion &&
            contieneLenguajeInapropiado(descripcion)
        ) {
            return res.status(400).json({
                ok: false,
                mensaje: "La descripción contiene lenguaje inapropiado."
            });
        }

        const especialidad = await Especialidad.findByPk(id);

        if (!especialidad) {
            return res.status(404).json({
                ok: false,
                mensaje: "Especialidad no encontrada."
            });
        }

        const especialidadExistente =
            await Especialidad.findOne({
                where: { nombre }
            });

        if (
            especialidadExistente &&
            especialidadExistente.id_especialidad !==
                especialidad.id_especialidad
        ) {
            return res.status(409).json({
                ok: false,
                mensaje: "Ya existe otra especialidad con ese nombre."
            });
        }

        await especialidad.update({
            nombre,
            descripcion: descripcion || null
        });

        return res.status(200).json({
            ok: true,
            mensaje: "Especialidad actualizada correctamente.",
            especialidad
        });

    } catch (error) {

        console.error(
            "Error al actualizar especialidad:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje: "Error al actualizar la especialidad."
        });
    }
};


export const obtenerEspecialidad = async (req, res) => {
    try {

        const { id } = req.params;

        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({
                ok: false,
                mensaje: "El ID de la especialidad no es válido."
            });
        }

        const especialidad =
            await Especialidad.findByPk(id);

        if (!especialidad) {
            return res.status(404).json({
                ok: false,
                mensaje: "Especialidad no encontrada."
            });
        }

        return res.status(200).json({
            ok: true,
            especialidad
        });

    } catch (error) {

        console.error(
            "Error al obtener especialidad:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje: "Error al obtener la especialidad."
        });
    }
};

export const eliminarEspecialidad = async (req, res) => {
    try {
        const { id } = req.params;

        // Validar ID
        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({
                ok: false,
                mensaje: "El ID de la especialidad no es válido."
            });
        }

        // Buscar especialidad
        const especialidad = await Especialidad.findByPk(id);

        if (!especialidad) {
            return res.status(404).json({
                ok: false,
                mensaje: "Especialidad no encontrada."
            });
        }

        // Verificar médicos asociados
        const cantidadMedicos = await Medico.count({
            where: {
                especialidad_id: id
            }
        });

        if (cantidadMedicos > 0) {
            return res.status(409).json({
                ok: false,
                mensaje: `No se puede eliminar la especialidad porque tiene ${cantidadMedicos} médico(s) asociado(s).`
            });
        }

        // Eliminar especialidad
        await especialidad.destroy();

        return res.status(200).json({
            ok: true,
            mensaje: "Especialidad eliminada correctamente."
        });

    } catch (error) {

        console.error(
            "Error al eliminar especialidad:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje: "Error al eliminar la especialidad."
        });
    }
};