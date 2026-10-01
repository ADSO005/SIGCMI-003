const role = (...rolesPermitidos) => {

    return (req, res, next) => {

        if (!rolesPermitidos.includes(req.usuario.rol_id)) {

            return res.status(403).send("Acceso denegado");

        }

        next();

    };

};

export default role;