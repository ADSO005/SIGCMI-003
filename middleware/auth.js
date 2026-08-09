import User from "../models/user.js";
import jwt from "jsonwebtoken";

const auth = async (req, res, next) => {

    const token = req.cookies._token;

    if (!token) {
        return res.redirect("/auth/login");
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const usuario = await User.findByPk(decoded.id);

        if (!usuario) {

            return res.redirect("/auth/login");

        }

        if (!usuario.estado) {

            return res.redirect("/auth/login");

        }

        req.usuario = usuario;

        next();

    } catch (error) {

        return res.redirect("/auth/login");

    }

};

export default auth;